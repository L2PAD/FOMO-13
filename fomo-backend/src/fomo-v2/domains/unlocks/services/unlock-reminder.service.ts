import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { randomUUID } from "crypto";
import { Model, Types } from "mongoose";
import { EmailService } from "src/email/email.service";
import { Event, EventDocument } from "src/events/models/event.model";
import { TelegramService } from "src/telegram/telegram.service";
import { User, UserDocument } from "src/user/user.model";

const TOKEN_UNLOCK_SOURCE_TYPE = "token_unlock";
const REMINDER_BATCH_SIZE = 50;
const REMINDER_CLAIM_LEASE_MS = 15 * 60 * 1000;
const MAX_ERROR_LENGTH = 1_000;

@Injectable()
export class FomoV2UnlockReminderService {
  private readonly logger = new Logger(FomoV2UnlockReminderService.name);
  private readonly workerId = randomUUID();
  private isRunning = false;

  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
    private readonly telegramService: TelegramService
  ) {}

  @Cron("0 */5 * * * *", { name: "fomo-v2-unlock-reminders" })
  async sendDueUnlockReminders(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      for (let processed = 0; processed < REMINDER_BATCH_SIZE; processed += 1) {
        const event = await this.claimNextDueReminder(new Date());
        if (!event) break;

        await this.deliverClaimedReminder(event);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async claimNextDueReminder(now: Date): Promise<any | null> {
    const staleClaimBefore = new Date(now.getTime() - REMINDER_CLAIM_LEASE_MS);

    return this.eventModel
      .findOneAndUpdate(
        {
          notifyAt: { $lte: now },
          notifyEnabled: true,
          sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
          $and: [
            {
              $or: [
                { notifySentAt: { $exists: false } },
                { notifySentAt: null },
              ],
            },
            {
              $or: [
                { notifyClaimedAt: { $exists: false } },
                { notifyClaimedAt: null },
                { notifyClaimedAt: { $lt: staleClaimBefore } },
              ],
            },
          ],
        },
        {
          $inc: { notifyAttemptCount: 1 },
          $set: {
            notifyClaimedAt: now,
            notifyClaimedBy: this.workerId,
          },
          $unset: { notifyLastError: "" },
        },
        {
          new: true,
          sort: { notifyAt: 1, _id: 1 },
        }
      )
      .lean();
  }

  private async deliverClaimedReminder(event: any): Promise<void> {
    try {
      await this.sendUnlockReminder(event);

      await this.eventModel.updateOne(
        {
          _id: event._id,
          notifyClaimedBy: this.workerId,
          notifyEnabled: true,
          $or: [{ notifySentAt: { $exists: false } }, { notifySentAt: null }],
        },
        {
          $set: { notifySentAt: new Date() },
          $unset: {
            notifyClaimedAt: "",
            notifyClaimedBy: "",
            notifyLastError: "",
          },
        }
      );
    } catch (error) {
      const message = this.errorMessage(error);
      await this.eventModel.updateOne(
        {
          _id: event._id,
          notifyClaimedBy: this.workerId,
        },
        {
          $set: { notifyLastError: message.slice(0, MAX_ERROR_LENGTH) },
          $unset: {
            notifyClaimedAt: "",
            notifyClaimedBy: "",
          },
        }
      );
      this.logger.warn(
        `Failed to send token unlock reminder for event ${String(
          event._id
        )}: ${message}`
      );
    }
  }

  private async sendUnlockReminder(event: any): Promise<void> {
    if (!event?.userId || !Types.ObjectId.isValid(event.userId)) return;

    const user = await this.userModel.findById(event.userId).lean();
    if (!user) return;

    const projectName = event.projectName || event.name || "Token unlock";
    const link = `${this.frontendUrl()}/crypto/calendar`;

    if (user.telegramNotification && user.telegramData?.telegramId) {
      await this.telegramService.sendNotification(
        String(user.telegramData.telegramId),
        projectName,
        link
      );
    }

    if (user.emailNotification && user.email) {
      await this.emailService.sendNotification(user.email, projectName, link);
    }
  }

  private frontendUrl(): string {
    return String(process.env.FRONT_URL || "https://fomo.cx").replace(
      /\/+$/,
      ""
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

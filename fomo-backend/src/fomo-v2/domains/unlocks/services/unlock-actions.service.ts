import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Event,
  EventDocument,
} from "src/events/models/event.model";
import {
  FomoV2UnlockFeedCalendarResolution,
  FomoV2UnlockFeedReadService,
} from "./unlock-feed-read.service";

interface UnlockActionPayload {
  notifyEnabled?: boolean;
  notifyBeforeMinutes?: number;
}

interface UnlockUserActionState {
  inCalendar: boolean;
  reminderEnabled: boolean;
  notifyAt?: string;
}

const TOKEN_UNLOCK_SOURCE_TYPE = "token_unlock";
const DEFAULT_UNLOCK_NOTIFY_BEFORE_MINUTES = 24 * 60;
const MAX_USER_ACTION_IDS = 100;

@Injectable()
export class FomoV2UnlockActionsService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    private readonly unlockFeedReadService: FomoV2UnlockFeedReadService
  ) {}

  async getUserActions(
    userId: string,
    ids: string | string[]
  ): Promise<Record<string, UnlockUserActionState>> {
    const requestedIds = this.normalizeIdList(ids);
    if (!requestedIds.length) return {};

    const resolutionByRequestedId = await this.unlockFeedReadService
      .resolveCalendarEvents(requestedIds)
      .catch(() => new Map<string, FomoV2UnlockFeedCalendarResolution>());
    const sourceIds = new Set<string>();

    for (const requestedId of requestedIds) {
      const resolution = resolutionByRequestedId.get(requestedId);
      sourceIds.add(requestedId);
      if (resolution?.sourceId) sourceIds.add(resolution.sourceId);
    }

    const events = await this.eventModel
      .find({
        sourceId: { $in: Array.from(sourceIds) },
        sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
        userId: this.toObjectId(userId),
      })
      .lean();
    const eventsBySourceId = new Map(
      events.map((event: any) => [this.toNonEmptyString(event.sourceId), event])
    );
    const result: Record<string, UnlockUserActionState> = {};

    for (const requestedId of requestedIds) {
      const resolution = resolutionByRequestedId.get(requestedId);
      const event =
        eventsBySourceId.get(requestedId) ||
        (resolution?.sourceId
          ? eventsBySourceId.get(resolution.sourceId)
          : undefined);

      if (!event) continue;

      const state = this.toUserActionState(event);
      result[requestedId] = state;
      if (resolution?.sourceId) result[resolution.sourceId] = state;
    }

    return result;
  }

  async addUnlockToCalendar(
    userId: string,
    unlockId: string,
    payload?: UnlockActionPayload
  ): Promise<{ success: boolean; event: EventDocument; alreadyExists?: boolean }> {
    return this.upsertUnlockCalendarEvent(userId, unlockId, payload);
  }

  async removeUnlockFromCalendar(
    userId: string,
    unlockId: string
  ): Promise<{ success: boolean; deleted: boolean }> {
    const sourceIds = await this.resolveSourceIds(unlockId);
    const deletedEvent = await this.eventModel.findOneAndDelete({
      sourceId: { $in: sourceIds },
      sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
      userId: this.toObjectId(userId),
    });

    return { success: true, deleted: Boolean(deletedEvent) };
  }

  async enableUnlockReminder(
    userId: string,
    unlockId: string,
    payload?: Pick<UnlockActionPayload, "notifyBeforeMinutes">
  ): Promise<{ success: boolean; event: EventDocument; alreadyExists?: boolean }> {
    return this.upsertUnlockCalendarEvent(userId, unlockId, {
      notifyBeforeMinutes: payload?.notifyBeforeMinutes,
      notifyEnabled: true,
    });
  }

  async disableUnlockReminder(
    userId: string,
    unlockId: string
  ): Promise<{ success: boolean; event: EventDocument | null }> {
    const sourceIds = await this.resolveSourceIds(unlockId);
    const event = await this.eventModel.findOneAndUpdate(
      {
        sourceId: { $in: sourceIds },
        sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
        userId: this.toObjectId(userId),
      },
      {
        $set: { notifyEnabled: false },
        $unset: {
          notifyAt: "",
          notifyBeforeMinutes: "",
          notifyClaimedAt: "",
          notifyClaimedBy: "",
          notifyLastError: "",
          notifySentAt: "",
        },
      },
      { new: true }
    );

    return { success: true, event };
  }

  private async upsertUnlockCalendarEvent(
    userId: string,
    unlockId: string,
    payload?: UnlockActionPayload
  ): Promise<{ success: boolean; event: EventDocument; alreadyExists?: boolean }> {
    const resolved = await this.resolveUnlock(unlockId);
    const eventData = this.buildCalendarEventPayload(userId, resolved, payload);

    this.assertFutureUnlockDate(eventData.unlockDate);

    const existingEvent = await this.findExistingCalendarEvent(
      userId,
      resolved.sourceId
    );

    if (existingEvent) {
      if (!payload?.notifyEnabled) {
        return { success: true, event: existingEvent, alreadyExists: true };
      }

      const notifyBeforeMinutes = this.getNotifyBeforeMinutes(
        payload.notifyBeforeMinutes
      );
      const updatedEvent = await this.eventModel.findOneAndUpdate(
        { _id: existingEvent._id },
        {
          $set: {
            notifyAt: this.getNotifyAt(eventData.unlockDate, notifyBeforeMinutes),
            notifyBeforeMinutes,
            notifyEnabled: true,
          },
          $unset: {
            notifyClaimedAt: "",
            notifyClaimedBy: "",
            notifyLastError: "",
            notifySentAt: "",
          },
        },
        { new: true }
      );

      return {
        success: true,
        event: updatedEvent as EventDocument,
        alreadyExists: true,
      };
    }

    try {
      const createdEvent = await this.eventModel.create(eventData);

      return { success: true, event: createdEvent, alreadyExists: false };
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;

      const duplicateEvent = await this.findExistingCalendarEvent(
        userId,
        resolved.sourceId
      );
      if (!duplicateEvent) throw error;

      return { success: true, event: duplicateEvent, alreadyExists: true };
    }
  }

  private buildCalendarEventPayload(
    userId: string,
    resolved: FomoV2UnlockFeedCalendarResolution,
    payload?: UnlockActionPayload
  ): Record<string, any> {
    const unlock = resolved.unlock as any;
    const unlockEvent = resolved.unlockEvent || {};
    const detailed = unlock?.detailed || {};
    const unlockDate = this.parseDate(unlockEvent.unlockDate);
    const tokenSymbol = this.firstString(
      unlock?.coinSymbol,
      unlockEvent?.symbol,
      detailed?.symbol
    ).toUpperCase();
    const projectName =
      this.firstString(detailed?.name, unlockEvent?.name, unlock?.coinSlug) ||
      "Token unlock";
    const projectSlug = this.firstString(unlockEvent?.coinSlug, unlock?.coinSlug);
    const projectLogo = this.firstString(
      unlockEvent?.logo,
      unlockEvent?.image,
      unlockEvent?.icon,
      unlock?.logo,
      unlock?.image,
      unlock?.icon,
      detailed?.logo,
      detailed?.image
    );
    const unlockAmount = this.firstNumber(
      unlockEvent?.tokensAmount,
      unlockEvent?.tokenAmount,
      unlock?.nextUnlockTokensAmount
    );
    const unlockValueUsd = this.firstNumber(
      unlockEvent?.unlockValueUsd,
      unlockEvent?.valueUsd,
      unlock?.nextUnlockValueUsd
    );
    const unlockPercent = this.firstNumber(
      unlockEvent?.tokensPercent,
      unlockEvent?.percentOfSupply,
      unlock?.nextUnlockPercent
    );
    const title = `${projectName}${tokenSymbol ? ` (${tokenSymbol})` : ""} token unlock`;
    const description = [
      unlockAmount ? `Amount: ${unlockAmount} ${tokenSymbol}` : "",
      unlockValueUsd ? `Value: $${unlockValueUsd}` : "",
      unlockPercent ? `Supply: ${unlockPercent}%` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    const eventData: Record<string, any> = {
      date: unlockDate,
      description,
      endDate: unlockDate
        ? new Date(unlockDate.getTime() + 60 * 60 * 1000)
        : undefined,
      endTime: "00:00",
      isPrivate: true,
      name: title,
      notifyEnabled: false,
      page: "crypto",
      projectLogo,
      projectName,
      projectSlug,
      sourceId: resolved.sourceId,
      sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
      stars: 0,
      status: "active",
      time: "00:00",
      tokenSymbol,
      unlockAmount,
      unlockDate,
      unlockPercent,
      unlockValueUsd,
      userId: this.toObjectId(userId),
    };

    if (payload?.notifyEnabled) {
      const notifyBeforeMinutes = this.getNotifyBeforeMinutes(
        payload.notifyBeforeMinutes
      );
      eventData.notifyAt = this.getNotifyAt(unlockDate, notifyBeforeMinutes);
      eventData.notifyBeforeMinutes = notifyBeforeMinutes;
      eventData.notifyEnabled = true;
      eventData.notifySentAt = undefined;
    }

    if (
      unlock?.projectId &&
      typeof unlock.projectId === "string" &&
      Types.ObjectId.isValid(unlock.projectId)
    ) {
      eventData.projectId = new Types.ObjectId(unlock.projectId);
    }

    return eventData;
  }

  private async resolveUnlock(
    unlockId: string
  ): Promise<FomoV2UnlockFeedCalendarResolution> {
    const normalizedId = this.toNonEmptyString(unlockId);
    if (!normalizedId) throw new BadRequestException("Unlock id is required");

    const resolved =
      await this.unlockFeedReadService.resolveCalendarEvent(normalizedId);
    if (!resolved) throw new NotFoundException("Unlock event not found");

    return resolved;
  }

  private async resolveSourceIds(unlockId: string): Promise<string[]> {
    const normalizedId = this.toNonEmptyString(unlockId);
    if (!normalizedId) throw new BadRequestException("Unlock id is required");

    const resolved = await this.resolveUnlock(normalizedId).catch(() => null);

    return Array.from(
      new Set([normalizedId, resolved?.sourceId].filter(Boolean) as string[])
    );
  }

  private async findExistingCalendarEvent(
    userId: string,
    sourceId: string
  ): Promise<EventDocument | null> {
    return this.eventModel.findOne({
      sourceId,
      sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
      userId: this.toObjectId(userId),
    });
  }

  private normalizeIdList(ids: string | string[]): string[] {
    const normalizedIds = Array.from(
      new Set(
        (Array.isArray(ids) ? ids.join(",") : ids || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    if (normalizedIds.length > MAX_USER_ACTION_IDS) {
      throw new BadRequestException(
        `No more than ${MAX_USER_ACTION_IDS} unlock ids are allowed`,
      );
    }

    return normalizedIds;
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException("Invalid user id");
    }

    return new Types.ObjectId(value);
  }

  private toNonEmptyString(value: any): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private firstString(...values: any[]): string {
    return (
      values
        .map((value) =>
          value === undefined || value === null ? "" : String(value).trim()
        )
        .find(Boolean) || ""
    );
  }

  private firstNumber(...values: any[]): number {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    return 0;
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  private assertFutureUnlockDate(unlockDate?: Date | null): void {
    if (!unlockDate || unlockDate.getTime() <= Date.now()) {
      throw new BadRequestException("Unlock date has already passed");
    }
  }

  private getNotifyBeforeMinutes(value?: number): number {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return DEFAULT_UNLOCK_NOTIFY_BEFORE_MINUTES;
    }

    return Math.min(Math.floor(parsedValue), 365 * 24 * 60);
  }

  private getNotifyAt(
    unlockDate: Date | null,
    notifyBeforeMinutes: number
  ): Date {
    if (!unlockDate) return new Date();

    const rawNotifyAt =
      unlockDate.getTime() - notifyBeforeMinutes * 60 * 1000;

    return new Date(Math.max(rawNotifyAt, Date.now()));
  }

  private toUserActionState(event: any): UnlockUserActionState {
    return {
      inCalendar: true,
      reminderEnabled: Boolean(event.notifyEnabled),
      notifyAt: event.notifyAt
        ? new Date(event.notifyAt).toISOString()
        : undefined,
    };
  }

  private isDuplicateKeyError(error: any): boolean {
    return error?.code === 11000;
  }
}

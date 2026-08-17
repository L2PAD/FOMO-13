import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import {
  SocialNotification,
  SocialNotificationDocument,
  SocialNotificationType,
} from "./model/social-notification.model";

interface SocialEmitInput {
  recipient: string | mongoose.Types.ObjectId;
  actor: string | mongoose.Types.ObjectId;
  type: SocialNotificationType;
  topicId?: string | mongoose.Types.ObjectId | null;
  commentId?: string | mongoose.Types.ObjectId | null;
  preview?: string;
}

/**
 * Dedicated service for the SOCIAL notification loop (repost / reply / like /
 * follow / quote). Kept separate from the legacy content-subscription
 * NotificationsService so it can own the SocialNotification model without every
 * module that re-provides NotificationsService needing that schema.
 */
@Injectable()
export class SocialNotificationsService {
  constructor(
    @InjectModel(SocialNotification.name)
    private readonly socialModel: Model<SocialNotificationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  private isOid(v: string): boolean {
    return /^[a-f\d]{24}$/i.test(String(v || ""));
  }

  /** Best-effort — never throws into the caller (notifications must not break actions). */
  async emit(input: SocialEmitInput): Promise<void> {
    try {
      const recipient = String(input.recipient || "");
      const actor = String(input.actor || "");
      if (!recipient || !actor || recipient === actor) return; // no self-notify
      if (!this.isOid(recipient) || !this.isOid(actor)) return;

      const topicId = input.topicId
        ? new mongoose.Types.ObjectId(String(input.topicId))
        : null;
      const commentId = input.commentId
        ? new mongoose.Types.ObjectId(String(input.commentId))
        : null;

      // Collapse repeated LIKE/REPOST/FOLLOW toggles into one fresh unread row.
      if (input.type === "LIKE" || input.type === "REPOST" || input.type === "FOLLOW") {
        const existing = await this.socialModel.findOne({
          recipient,
          actor,
          type: input.type,
          topicId,
          commentId,
        });
        if (existing) {
          existing.read = false;
          existing.preview = input.preview || existing.preview;
          (existing as any).createdAt = new Date();
          await existing.save();
          return;
        }
      }

      await this.socialModel.create({
        recipient: new mongoose.Types.ObjectId(recipient),
        actor: new mongoose.Types.ObjectId(actor),
        type: input.type,
        topicId,
        commentId,
        preview: (input.preview || "").slice(0, 200),
        read: false,
      });
    } catch (e) {
      // swallow
    }
  }

  async list(userId: string, limit = 30): Promise<any[]> {
    if (!this.isOid(userId)) return [];
    const rows = await this.socialModel
      .find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .lean();
    const actorIds = Array.from(new Set(rows.map((r) => String(r.actor))));
    const actors = await this.userModel
      .find({ _id: { $in: actorIds } })
      .select("name userName image avatar")
      .lean();
    const actorMap = new Map(
      actors.map((a: any) => [
        String(a._id),
        {
          id: String(a._id),
          name: a.name || a.userName || "Someone",
          userName: a.userName || null,
          image: a.image || a.avatar || null,
        },
      ])
    );
    return rows.map((r) => ({
      id: String(r._id),
      type: r.type,
      actor: actorMap.get(String(r.actor)) || {
        id: String(r.actor),
        name: "Someone",
        image: null,
      },
      topicId: r.topicId ? String(r.topicId) : null,
      commentId: r.commentId ? String(r.commentId) : null,
      preview: r.preview || "",
      read: !!r.read,
      createdAt: (r as any).createdAt,
    }));
  }

  async unreadCount(userId: string): Promise<number> {
    if (!this.isOid(userId)) return 0;
    return this.socialModel.countDocuments({ recipient: userId, read: false });
  }

  async markRead(userId: string, ids?: string[]): Promise<{ ok: true; unread: number }> {
    if (!this.isOid(userId)) return { ok: true, unread: 0 };
    const filter: any = { recipient: userId, read: false };
    if (Array.isArray(ids) && ids.length) {
      filter._id = { $in: ids.filter((x) => this.isOid(x)) };
    }
    await this.socialModel.updateMany(filter, { $set: { read: true } });
    return { ok: true, unread: await this.unreadCount(userId) };
  }
}

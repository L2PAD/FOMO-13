import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import {
  UserActionLog,
  UserActionLogActorType,
  UserActionLogDocument,
  UserActionLogSeverity,
} from "./user-action-log.model";

type UserActionLogId = string | mongoose.Types.ObjectId | null | undefined;

export type WriteUserActionLogInput = {
  userId?: UserActionLogId;
  walletAddress?: string;
  actorId?: UserActionLogId;
  actorType?: UserActionLogActorType;
  category: string;
  action: string;
  severity?: UserActionLogSeverity;
  title?: string;
  description?: string;
  entityType?: string;
  entityId?: UserActionLogId | number;
  metadata?: Record<string, unknown>;
  request?: Record<string, unknown>;
};

export type UserActionLogsPagination = {
  offset: number;
  limit: number;
};

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "signature",
  "secret",
  "twoFactorSecret",
  "code",
  "authCode",
]);

@Injectable()
export class UserActionLogsService {
  private readonly logger = new Logger(UserActionLogsService.name);

  constructor(
    @InjectModel(UserActionLog.name)
    private readonly logModel: Model<UserActionLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  async log(input: WriteUserActionLogInput): Promise<UserActionLogDocument | null> {
    try {
      const userId = await this.resolveUserId(input.userId, input.walletAddress);

      if (!userId) {
        return null;
      }

      return await this.logModel.create({
        userId,
        actorId: this.toObjectId(input.actorId) || null,
        actorType: input.actorType || "user",
        category: this.cleanString(input.category, 80) || "general",
        action: this.cleanString(input.action, 120) || "unknown",
        severity: input.severity || "info",
        title: this.cleanString(input.title, 160),
        description: this.cleanString(input.description, 500),
        entityType: this.cleanString(input.entityType, 80),
        entityId: this.cleanEntityId(input.entityId),
        metadata: this.sanitizeRecord(input.metadata),
        request: this.sanitizeRecord(input.request),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write user action log: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }

  async logForUsers(
    userIds: UserActionLogId[],
    input: Omit<WriteUserActionLogInput, "userId" | "walletAddress">
  ): Promise<void> {
    const uniqueIds = Array.from(
      new Set(
        userIds
          .map((userId) => this.toObjectId(userId)?.toString())
          .filter(Boolean)
      )
    );

    await Promise.all(
      uniqueIds.map((userId) =>
        this.log({
          ...input,
          userId,
        })
      )
    );
  }

  async countByUser(userId: UserActionLogId): Promise<number> {
    const userObjectId = this.toObjectId(userId);

    if (!userObjectId) {
      return 0;
    }

    return this.logModel.countDocuments({ userId: userObjectId });
  }

  async getUserLogs(
    userId: UserActionLogId,
    pagination: UserActionLogsPagination
  ): Promise<{ items: unknown[]; total: number }> {
    const userObjectId = this.toObjectId(userId);

    if (!userObjectId) {
      return { items: [], total: 0 };
    }

    const [items, total] = await Promise.all([
      this.logModel
        .find({ userId: userObjectId })
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.offset)
        .limit(pagination.limit)
        .select("-__v")
        .lean(),
      this.logModel.countDocuments({ userId: userObjectId }),
    ]);

    return { items, total };
  }

  private async resolveUserId(
    userId?: UserActionLogId,
    walletAddress?: string
  ): Promise<mongoose.Types.ObjectId | null> {
    const directUserId = this.toObjectId(userId);

    if (directUserId) {
      return directUserId;
    }

    const normalizedWallet = String(walletAddress || "").trim().toLowerCase();

    if (!normalizedWallet) {
      return null;
    }

    const user = await this.userModel
      .findOne({ wallet: normalizedWallet })
      .select("_id")
      .lean();

    return this.toObjectId(user?._id);
  }

  private toObjectId(value: UserActionLogId): mongoose.Types.ObjectId | null {
    if (!value) {
      return null;
    }

    if (value instanceof mongoose.Types.ObjectId) {
      return value;
    }

    const stringValue = String(value);

    if (!mongoose.Types.ObjectId.isValid(stringValue)) {
      return null;
    }

    return new mongoose.Types.ObjectId(stringValue);
  }

  private cleanEntityId(value: WriteUserActionLogInput["entityId"]): string {
    if (value === null || value === undefined) {
      return "";
    }

    return this.cleanString(String(value), 160);
  }

  private cleanString(value: unknown, maxLength: number): string {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value).trim();

    return stringValue.length > maxLength
      ? `${stringValue.slice(0, maxLength)}...`
      : stringValue;
  }

  private sanitizeRecord(value?: Record<string, unknown>): Record<string, unknown> {
    const sanitized = this.sanitizeValue(value || {}, 0);

    return this.isRecord(sanitized) ? sanitized : {};
  }

  private sanitizeValue(value: unknown, depth: number): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === "string") {
      return this.cleanString(value, 500);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    if (value instanceof mongoose.Types.ObjectId) {
      return value.toString();
    }

    if (depth >= 4) {
      return "[truncated]";
    }

    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item) => this.sanitizeValue(item, depth + 1));
    }

    if (!this.isRecord(value)) {
      return this.cleanString(String(value), 500);
    }

    return Object.entries(value)
      .slice(0, 50)
      .reduce<Record<string, unknown>>((acc, [key, item]) => {
        if (SENSITIVE_KEYS.has(key)) {
          acc[key] = "[redacted]";
          return acc;
        }

        acc[key] = this.sanitizeValue(item, depth + 1);
        return acc;
      }, {});
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}

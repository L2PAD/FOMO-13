import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TokenUnlock, TokenUnlockDocument } from "./models/token-unlock.model";
import mongoose, { FilterQuery, Model, Types } from "mongoose";
import axios from "axios";
import { GetTokenUnlocksDto } from "./dto/get-token.dto";
import { Event, EventDocument } from "src/events/models/event.model";
import { User, UserDocument } from "src/user/user.model";
import { Cron } from "@nestjs/schedule";
import { EmailService } from "src/email/email.service";
import { TelegramService } from "src/telegram/telegram.service";
import { Project, ProjectDocument } from "src/projects/project.model";
import { FomoV2UnlockFeedReadService } from "src/fomo-v2/domains/unlocks/services";

interface RoundSnapshot {
  name: string;
  unlockedTokens: number;
  unlockedPercent: number;
}

interface Point {
  unlockedPercentInPeriod: number;
  cumulativeUnlockedPercent: number;
  roundSnapshots: RoundSnapshot[];
  date: string;
}

interface PointSummary {
  date: string;
  lockupPeriod: string;
  vestingSchedule: string;
  earlyUnlock: string;
  cliff: string;
  timeline: { name: string; cumulativePercent: number }[];
  nextUnlock: { name: string; percent: number } | null;
  tgePercent: number;
}

interface UnlockCalendarActionPayload {
  notifyEnabled?: boolean;
  notifyBeforeMinutes?: number;
}

interface ResolvedUnlockCalendarEvent {
  sourceId: string;
  unlock: any;
  unlockEvent: Record<string, any>;
}

const TOKEN_UNLOCK_SOURCE_TYPE = "token_unlock";
const DEFAULT_UNLOCK_NOTIFY_BEFORE_MINUTES = 24 * 60;


@Injectable()
export class TokenUnlocksService {
  private readonly logger = new Logger(TokenUnlocksService.name);
  private readonly smallUnlockMinPercent = 1;

  constructor(
    @InjectModel(TokenUnlock.name)
    private tokenUnlockModel: Model<TokenUnlockDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
    private emailService: EmailService,
    private telegramService: TelegramService,
    private fomoV2UnlockFeedReadService: FomoV2UnlockFeedReadService,
  ) {
    // this.syncTokenUnlocks()
  }

  private analyzePoints(points: Point[]): PointSummary[] {
    if (!points.length) return [];

    const sortedPoints = points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sortedPoints.map((point, i) => {
      const timeline = point.roundSnapshots.map(r => ({
        name: r.name,
        cumulativePercent: r.unlockedPercent
      }));

      const tgePercent = point.roundSnapshots.reduce((sum, r) => sum + r.unlockedPercent, 0);

      const firstUnlock = point.roundSnapshots.find(r => r.unlockedPercent > 0);
      const lockupPeriod = firstUnlock
        ? `${Math.ceil((new Date(point.date).getTime() - new Date(sortedPoints[0].date).getTime()) / (1000 * 60 * 60 * 24))} days`
        : "0 days";

      const maxCumulative = point.roundSnapshots.reduce((sum, r) => sum + r.unlockedPercent, 0);
      const vestingSchedule = `${maxCumulative.toFixed(2)}% at ${point.date}`;

      const earlyUnlock = point.unlockedPercentInPeriod > 5 ? "Yes" : "No";

      const cliffRound = point.roundSnapshots.find(r => r.unlockedPercent > 1);
      const cliff = cliffRound ? cliffRound.name : "None";

      const now = new Date();
      const nextUnlockRound = point.roundSnapshots.find(r => r.unlockedPercent > 0 && new Date(point.date) > now);
      const nextUnlock = nextUnlockRound ? { name: nextUnlockRound.name, percent: nextUnlockRound.unlockedPercent } : null;

      return {
        date: point.date,
        lockupPeriod,
        vestingSchedule,
        earlyUnlock,
        cliff,
        timeline,
        nextUnlock,
        tgePercent
      };
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getHeaders(): any {
    return {
      Accept: "*/*",
      "x-dropstab-api-key": process.env.DROPSTAB_KEY,
    };
  }

  private async safeRequest(
    url: string,
    params = {},
    headers = {}
  ): Promise<any> {
    try {
      const response = await axios.get(url, { params, headers });
      return response.data;
    } catch (error) {
      throw new Error(error.message || "Request failed");
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private slugify(value: string): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private getAllowedSortField(sortBy?: string): string {
    const allowedSortFields: Record<string, string> = {
      nextTokenUnlockDate: "nextTokenUnlockDate",
      lastTokenUnlockDate: "lastTokenUnlockDate",
      priceUsd: "priceUsd",
      marketCap: "marketCap",
      fdv: "fdv",
      circulatingSupply: "circulatingSupply",
      totalSupply: "totalSupply",
      circulationSupplyPercent: "circulationSupplyPercent",
      publicVestingPercent: "publicVestingPercent",
      nextUnlockPercent: "nextUnlockPercent",
      nextUnlockValueUsd: "nextUnlockValueUsd",
      totalTokensUnlockedPercent: "totalTokensUnlockedPercent",
      totalTokensLockedPercent: "totalTokensLockedPercent",
      coinSlug: "coinSlug",
      coinSymbol: "coinSymbol",
      updatedAt: "updatedAt",
      createdAt: "createdAt",
    };

    return allowedSortFields[sortBy || ""] || "nextTokenUnlockDate";
  }

  private includesSmallUnlocks(value?: string | boolean): boolean {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
  }

  private appendAndFilter(
    filter: FilterQuery<TokenUnlockDocument>,
    condition: FilterQuery<TokenUnlockDocument>,
  ): void {
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      condition,
    ];
  }

  private applySmallUnlocksFilter(
    filter: FilterQuery<TokenUnlockDocument>,
    smallUnlocks?: string | boolean,
  ): void {
    if (this.includesSmallUnlocks(smallUnlocks)) {
      return;
    }

    this.appendAndFilter(filter, {
      $or: [
        { nextUnlockPercent: { $gte: this.smallUnlockMinPercent } },
        { publicVestingPercent: { $gte: this.smallUnlockMinPercent } },
        { "nextUnlockEvent.tokensPercent": { $gte: this.smallUnlockMinPercent } },
        { "nextUnlockEvent.percentOfSupply": { $gte: this.smallUnlockMinPercent } },
        { "unlockEvents.tokensPercent": { $gte: this.smallUnlockMinPercent } },
        { "unlockEvents.percentOfSupply": { $gte: this.smallUnlockMinPercent } },
        { "intelSourceSnapshot.tokens_percent": { $gte: this.smallUnlockMinPercent } },
        { "intelSourceSnapshot.unlock_percent": { $gte: this.smallUnlockMinPercent } },
        { "intelSourceSnapshot.unlock_pct": { $gte: this.smallUnlockMinPercent } },
        { "intelSourceSnapshot.next_unlocked.tokenAmountPercentage": { $gte: this.smallUnlockMinPercent } },
        { "intelSourceSnapshot.raw.nextUnlocked.tokenAmountPercentage": { $gte: this.smallUnlockMinPercent } },
      ],
    });
  }

  private toNonEmptyString(value?: unknown): string {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  private toNumber(value?: unknown): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const stringValue = this.toNonEmptyString(value);
    if (!stringValue) {
      return 0;
    }

    const parsedValue = Number(stringValue.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  private parseDate(value?: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsedDate = new Date(String(value));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException("Invalid user id");
    }

    return new Types.ObjectId(value);
  }

  private getNotifyBeforeMinutes(value?: number): number {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return DEFAULT_UNLOCK_NOTIFY_BEFORE_MINUTES;
    }

    return Math.min(Math.floor(parsedValue), 365 * 24 * 60);
  }

  private getNotifyAt(unlockDate: Date, notifyBeforeMinutes: number): Date {
    const rawNotifyAt =
      unlockDate.getTime() - notifyBeforeMinutes * 60 * 1000;

    return new Date(Math.max(rawNotifyAt, Date.now()));
  }

  private async findUnlockForActionId(unlockId: string): Promise<any | null> {
    const normalizedUnlockId = this.toNonEmptyString(unlockId);
    const filters: FilterQuery<TokenUnlockDocument>[] = [
      { "nextUnlockEvent.id": normalizedUnlockId },
      { "nextUnlockEvent.sourceKey": normalizedUnlockId },
      { "nextUnlockEvent.sourceId": normalizedUnlockId },
      { "unlockEvents.id": normalizedUnlockId },
      { "unlockEvents.sourceKey": normalizedUnlockId },
      { "unlockEvents.sourceId": normalizedUnlockId },
      { sourceKey: normalizedUnlockId },
      { coinSlug: normalizedUnlockId },
    ];

    if (Types.ObjectId.isValid(normalizedUnlockId)) {
      filters.unshift({ _id: new Types.ObjectId(normalizedUnlockId) } as any);
    }

    return this.tokenUnlockModel.findOne({ $or: filters }).lean();
  }

  private resolveActionEventFromUnlock(unlock: any, unlockId: string): any {
    const events = [
      unlock?.nextUnlockEvent,
      ...(Array.isArray(unlock?.unlockEvents) ? unlock.unlockEvents : []),
    ].filter(Boolean);

    const exactEvent = events.find((event) => {
      const aliases = [
        event?.id,
        event?.sourceKey,
        event?.sourceId,
      ].map((item) => this.toNonEmptyString(item));

      return aliases.includes(unlockId);
    });

    if (exactEvent) {
      return exactEvent;
    }

    return (
      unlock?.nextUnlockEvent ||
      events.find((event) => event?.isUpcoming) ||
      events[0] ||
      {}
    );
  }

  private async resolveUnlockCalendarEvent(
    unlockId: string,
  ): Promise<ResolvedUnlockCalendarEvent> {
    const normalizedUnlockId = this.toNonEmptyString(unlockId);

    if (!normalizedUnlockId) {
      throw new BadRequestException("Unlock id is required");
    }

    const unlock = await this.findUnlockForActionId(normalizedUnlockId);

    if (!unlock) {
      const v2Resolution =
        await this.fomoV2UnlockFeedReadService.resolveCalendarEvent(
          normalizedUnlockId,
        );
      if (v2Resolution) return v2Resolution;

      throw new NotFoundException("Unlock event not found");
    }

    const unlockEvent = this.resolveActionEventFromUnlock(
      unlock,
      normalizedUnlockId,
    );
    const unlockDate = this.parseDate(
      unlockEvent?.unlockDate ||
        unlockEvent?.unlock_date ||
        unlockEvent?.date ||
        unlock?.nextTokenUnlockDate,
    );

    if (!unlockDate) {
      throw new BadRequestException("Unlock date is missing");
    }

    const projectSlug =
      this.toNonEmptyString(unlockEvent?.coinSlug) ||
      this.toNonEmptyString(unlock?.coinSlug) ||
      this.toNonEmptyString(unlockEvent?.projectSlug);
    const allocation = this.toNonEmptyString(unlockEvent?.allocation);
    const sourceId =
      this.toNonEmptyString(unlockEvent?.id) ||
      this.toNonEmptyString(unlockEvent?.sourceKey) ||
      this.toNonEmptyString(unlockEvent?.sourceId) ||
      [
        TOKEN_UNLOCK_SOURCE_TYPE,
        projectSlug || this.toNonEmptyString(unlock?._id),
        unlockDate.toISOString(),
        this.slugify(allocation || "token-unlock"),
      ]
        .filter(Boolean)
        .join(":");

    return {
      sourceId,
      unlock,
      unlockEvent: {
        ...unlockEvent,
        unlockDate,
      },
    };
  }

  private buildTokenUnlockEventPayload(
    userId: string,
    resolved: ResolvedUnlockCalendarEvent,
    payload?: UnlockCalendarActionPayload,
  ): Record<string, any> {
    const userObjectId = this.toObjectId(userId);
    const unlock = resolved.unlock as any;
    const unlockEvent = resolved.unlockEvent || {};
    const detailed = unlock?.detailed || {};
    const unlockDate = this.parseDate(unlockEvent?.unlockDate);
    const tokenSymbol =
      this.toNonEmptyString(unlock?.coinSymbol) ||
      this.toNonEmptyString(unlockEvent?.symbol) ||
      this.toNonEmptyString(detailed?.symbol);
    const projectName =
      this.toNonEmptyString(detailed?.name) ||
      this.toNonEmptyString(unlockEvent?.name) ||
      this.toNonEmptyString(unlock?.coinSlug) ||
      "Token unlock";
    const projectSlug =
      this.toNonEmptyString(unlockEvent?.coinSlug) ||
      this.toNonEmptyString(unlock?.coinSlug);
    const projectLogo =
      this.toNonEmptyString(unlockEvent?.logo) ||
      this.toNonEmptyString(unlockEvent?.image) ||
      this.toNonEmptyString(unlockEvent?.icon) ||
      this.toNonEmptyString(unlock?.logo) ||
      this.toNonEmptyString(unlock?.image) ||
      this.toNonEmptyString(unlock?.icon) ||
      this.toNonEmptyString(detailed?.logo) ||
      this.toNonEmptyString(detailed?.image);
    const unlockAmount =
      this.toNumber(unlockEvent?.tokensAmount) ||
      this.toNumber(unlockEvent?.tokenAmount) ||
      this.toNumber(unlock?.nextUnlockTokensAmount);
    const unlockValueUsd =
      this.toNumber(unlockEvent?.unlockValueUsd) ||
      this.toNumber(unlockEvent?.valueUsd) ||
      this.toNumber(unlock?.nextUnlockValueUsd);
    const unlockPercent =
      this.toNumber(unlockEvent?.tokensPercent) ||
      this.toNumber(unlockEvent?.percentOfSupply) ||
      this.toNumber(unlock?.nextUnlockPercent);
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
      userId: userObjectId,
    };

    if (payload?.notifyEnabled) {
      const notifyBeforeMinutes = this.getNotifyBeforeMinutes(
        payload.notifyBeforeMinutes,
      );
      eventData.notifyBeforeMinutes = notifyBeforeMinutes;
      eventData.notifyEnabled = true;
      eventData.notifyAt = this.getNotifyAt(unlockDate, notifyBeforeMinutes);
      eventData.notifySentAt = undefined;
    }

    if (
      unlock?.projectId &&
      typeof unlock.projectId === "string" &&
      mongoose.Types.ObjectId.isValid(unlock.projectId)
    ) {
      eventData.projectId = new Types.ObjectId(unlock.projectId);
    }

    return eventData;
  }

  private async findExistingCalendarEvent(
    userId: string,
    sourceId: string,
  ): Promise<EventDocument | null> {
    return this.eventModel.findOne({
      userId: this.toObjectId(userId),
      sourceId,
      sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
    });
  }

  private isDuplicateKeyError(error: any): boolean {
    return error?.code === 11000;
  }

  private assertFutureUnlockDate(unlockDate?: Date): void {
    if (!unlockDate || unlockDate.getTime() <= Date.now()) {
      throw new BadRequestException("Unlock date has already passed");
    }
  }

  private async upsertUnlockCalendarEvent(
    userId: string,
    unlockId: string,
    payload?: UnlockCalendarActionPayload,
  ): Promise<{ success: boolean; event: EventDocument; alreadyExists?: boolean }> {
    const resolved = await this.resolveUnlockCalendarEvent(unlockId);
    const eventData = this.buildTokenUnlockEventPayload(
      userId,
      resolved,
      payload,
    );

    this.assertFutureUnlockDate(eventData.unlockDate);

    const existingEvent = await this.findExistingCalendarEvent(
      userId,
      resolved.sourceId,
    );

    if (existingEvent) {
      if (!payload?.notifyEnabled) {
        return {
          success: true,
          event: existingEvent,
          alreadyExists: true,
        };
      }

      const notifyBeforeMinutes = this.getNotifyBeforeMinutes(
        payload.notifyBeforeMinutes,
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
            notifySentAt: "",
          },
        },
        { new: true },
      );

      return {
        success: true,
        event: updatedEvent,
        alreadyExists: true,
      };
    }

    try {
      const createdEvent = await this.eventModel.create(eventData);

      return {
        success: true,
        event: createdEvent,
        alreadyExists: false,
      };
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) {
        throw error;
      }

      const duplicateEvent = await this.findExistingCalendarEvent(
        userId,
        resolved.sourceId,
      );

      if (!duplicateEvent) {
        throw error;
      }

      return {
        success: true,
        event: duplicateEvent,
        alreadyExists: true,
      };
    }
  }

  public async addUnlockToCalendar(
    userId: string,
    unlockId: string,
    payload?: UnlockCalendarActionPayload,
  ): Promise<{ success: boolean; event: EventDocument; alreadyExists?: boolean }> {
    return this.upsertUnlockCalendarEvent(userId, unlockId, payload);
  }

  public async removeUnlockFromCalendar(
    userId: string,
    unlockId: string,
  ): Promise<{ success: boolean; deleted: boolean }> {
    const resolved = await this.resolveUnlockCalendarEvent(unlockId).catch(
      () => null,
    );
    const sourceIds = [
      resolved?.sourceId,
      this.toNonEmptyString(unlockId),
    ].filter(Boolean);
    const deletedEvent = await this.eventModel.findOneAndDelete({
      userId: this.toObjectId(userId),
      sourceId: { $in: sourceIds },
      sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
    });

    return { success: true, deleted: Boolean(deletedEvent) };
  }

  public async enableUnlockReminder(
    userId: string,
    unlockId: string,
    payload?: Pick<UnlockCalendarActionPayload, "notifyBeforeMinutes">,
  ): Promise<{ success: boolean; event: EventDocument; alreadyExists?: boolean }> {
    return this.upsertUnlockCalendarEvent(userId, unlockId, {
      notifyBeforeMinutes: payload?.notifyBeforeMinutes,
      notifyEnabled: true,
    });
  }

  public async disableUnlockReminder(
    userId: string,
    unlockId: string,
  ): Promise<{ success: boolean; event: EventDocument | null }> {
    const resolved = await this.resolveUnlockCalendarEvent(unlockId).catch(
      () => null,
    );
    const sourceIds = [
      resolved?.sourceId,
      this.toNonEmptyString(unlockId),
    ].filter(Boolean);
    const event = await this.eventModel.findOneAndUpdate(
      {
        userId: this.toObjectId(userId),
        sourceId: { $in: sourceIds },
        sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
      },
      {
        $set: {
          notifyEnabled: false,
        },
        $unset: {
          notifyAt: "",
          notifyBeforeMinutes: "",
          notifySentAt: "",
        },
      },
      { new: true },
    );

    return { success: true, event };
  }

  public async getUserActions(
    userId: string,
    ids: string | string[],
  ): Promise<Record<string, { inCalendar: boolean; reminderEnabled: boolean; notifyAt?: string }>> {
    const normalizedIds = (Array.isArray(ids) ? ids.join(",") : ids || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!normalizedIds.length) {
      return {};
    }

    const events = await this.eventModel
      .find({
        userId: this.toObjectId(userId),
        sourceId: { $in: normalizedIds },
        sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
      })
      .lean();

    return events.reduce((acc, event) => {
      acc[event.sourceId] = {
        inCalendar: true,
        reminderEnabled: Boolean(event.notifyEnabled),
        notifyAt: event.notifyAt ? new Date(event.notifyAt).toISOString() : undefined,
      };

      return acc;
    }, {} as Record<string, { inCalendar: boolean; reminderEnabled: boolean; notifyAt?: string }>);
  }

  private objectIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id && value._id !== value) return this.objectIdString(value._id);
    if (typeof value.toString === "function") return value.toString();
    return "";
  }

  private getUnlockProjectIds(unlock: any): string[] {
    return Array.from(
      new Set(
        [
          this.objectIdString(unlock?.projectId),
          ...(Array.isArray(unlock?.projectLinks)
            ? unlock.projectLinks.map((link: any) => this.objectIdString(link?.projectId))
            : []),
        ].filter((id) => Types.ObjectId.isValid(id)),
      ),
    );
  }

  private async loadProjectsForUnlocks(unlocks: any[]): Promise<Map<string, any>> {
    const projectIds = Array.from(
      new Set(unlocks.flatMap((unlock) => this.getUnlockProjectIds(unlock))),
    );

    if (!projectIds.length) {
      return new Map();
    }

    const projects = await this.projectModel
      .find({ _id: { $in: projectIds.map((id) => new Types.ObjectId(id)) } })
      .select([
        "name",
        "slug",
        "logo",
        "image",
        "symbol",
        "ticker",
        "niche",
        "rating",
        "fomoScore",
        "likes",
        "redFlags",
        "redFlagsList",
        "mainCategory",
        "price",
        "priceUsd",
        "marketCap",
        "fdv",
        "circulatingSupply",
        "totalSupply",
        "maxSupply",
      ].join(" "))
      .lean();

    return new Map((projects as any[]).map((project) => [this.objectIdString(project?._id), project]));
  }

  private pickUnlockProject(unlock: any, projectsById: Map<string, any>): any | null {
    return (
      this.getUnlockProjectIds(unlock)
        .map((id) => projectsById.get(id))
        .find(Boolean) || null
    );
  }

  private compactProjectLinks(projectLinks: any): any[] {
    if (!Array.isArray(projectLinks)) return [];

    return projectLinks.map((link) => ({
      projectId: link?.projectId,
      projectType: link?.projectType,
      confidence: link?.confidence,
      matchedBy: link?.matchedBy,
      reason: link?.reason,
    }));
  }

  private compactUnlockEvent(event: any): any | null {
    if (!event) return null;

    return {
      id: event.id,
      source: event.source,
      sourceKey: event.sourceKey,
      sourceUrl: event.sourceUrl,
      detailUrl: event.detailUrl,
      coinSlug: event.coinSlug,
      projectKey: event.projectKey,
      name: event.name,
      symbol: event.symbol || event.coinSymbol,
      logo: event.logo || event.image || event.icon,
      icon: event.icon || event.image || event.logo,
      image: event.image || event.logo || event.icon,
      unlockDate: event.unlockDate,
      daysUntilUnlock: event.daysUntilUnlock,
      isUpcoming: event.isUpcoming,
      isPast: event.isPast,
      allocation: event.allocation,
      unlockType: event.unlockType,
      cliffEnd: event.cliffEnd,
      tokenAmount: event.tokenAmount ?? event.tokensAmount,
      tokensAmount: event.tokensAmount ?? event.tokenAmount,
      unlockValueUsd: event.unlockValueUsd ?? event.valueUsd,
      valueUsd: event.valueUsd ?? event.unlockValueUsd,
      percentOfSupply: event.percentOfSupply ?? event.tokensPercent,
      tokensPercent: event.tokensPercent ?? event.percentOfSupply,
      priceUsd: event.priceUsd,
      marketCapUsd: event.marketCapUsd ?? event.marketCap,
      marketCap: event.marketCap ?? event.marketCapUsd,
      circulatingSupply: event.circulatingSupply,
      totalSupply: event.totalSupply,
      maxSupply: event.maxSupply,
      fullyDilutedMarketCapUsd: event.fullyDilutedMarketCapUsd,
      updatedAt: event.updatedAt,
    };
  }

  private compactAllocations(allocations: any): any[] {
    if (!Array.isArray(allocations)) return [];

    return allocations.map((allocation) => ({
      id: allocation?.id,
      name: allocation?.name,
      tokensAllocatedAmount: allocation?.tokensAllocatedAmount,
      tokensAllocatedPercent: allocation?.tokensAllocatedPercent,
      tokenUnlockProgress: allocation?.tokenUnlockProgress,
      tgeDate: allocation?.tgeDate,
      vesting: Array.isArray(allocation?.vesting)
        ? allocation.vesting.map((event: any) => ({
            source: event?.source,
            sourceKey: event?.sourceKey,
            sourceUrl: event?.sourceUrl,
            detailUrl: event?.detailUrl,
            date: event?.date,
            amount: event?.amount,
            percent: event?.percent,
            valueUsd: event?.valueUsd,
            unlockType: event?.unlockType,
            cliffEnd: event?.cliffEnd,
          }))
        : [],
    }));
  }

  private compactChart(chart: any): any[] {
    if (!Array.isArray(chart)) return [];

    return chart.map((point) => ({
      date: point?.date,
      unlockedPercentInPeriod: point?.unlockedPercentInPeriod,
      cumulativeUnlockedPercent: point?.cumulativeUnlockedPercent,
      roundSnapshots: Array.isArray(point?.roundSnapshots)
        ? point.roundSnapshots.map((snapshot: any) => ({
            name: snapshot?.name,
            source: snapshot?.source,
            sourceKey: snapshot?.sourceKey,
            unlockedPercent: snapshot?.unlockedPercent,
            unlockedTokens: snapshot?.unlockedTokens,
            unlockedValueUsd: snapshot?.unlockedValueUsd,
            unlockType: snapshot?.unlockType,
            cliffEnd: snapshot?.cliffEnd,
          }))
        : [],
    }));
  }

  private compactVesting(vesting: any): any[] {
    if (!Array.isArray(vesting)) return [];

    return vesting.map((item) => ({
      id: item?.id,
      tgePercent: item?.tgePercent,
    }));
  }

  private compactIntelSourceSnapshot(snapshot: any): any {
    if (!snapshot || typeof snapshot !== "object") return {};

    return {
      source: snapshot.source,
      sourceKey: snapshot.sourceKey,
      sourceUrl: snapshot.sourceUrl,
      detailUrl: snapshot.detailUrl,
      coinSlug: snapshot.coinSlug,
      coinSymbol: snapshot.coinSymbol,
      coinId: snapshot.coinId,
      projectKey: snapshot.projectKey,
      image: snapshot.image,
      logo: snapshot.logo,
      icon: snapshot.icon,
      tokenLockedAmount: snapshot.tokenLockedAmount,
      token_locked_amount: snapshot.token_locked_amount,
      lockedPercent: snapshot.lockedPercent,
      locked_percent: snapshot.locked_percent,
      marketCap: snapshot.marketCap,
      fullyDilutedMarketCap: snapshot.fullyDilutedMarketCap,
      circulatingSupply: snapshot.circulatingSupply,
      totalSupply: snapshot.totalSupply,
      unlockType: snapshot.unlockType,
      cliffEnd: snapshot.cliffEnd,
      sourceEventCount: snapshot.sourceEventCount,
      upstreamSources: snapshot.upstreamSources,
    };
  }

  private compactUnlock(unlock: any, project: any | null): any {
    const detailed = unlock?.detailed || {};
    const projectName =
      this.toNonEmptyString(project?.name) ||
      this.toNonEmptyString(unlock?.projectName) ||
      this.toNonEmptyString(detailed?.name) ||
      this.toNonEmptyString(unlock?.coinSlug);
    const symbol =
      this.toNonEmptyString(unlock?.coinSymbol) ||
      this.toNonEmptyString(project?.symbol) ||
      this.toNonEmptyString(project?.ticker) ||
      this.toNonEmptyString(project?.niche);
    const logo =
      this.toNonEmptyString(project?.logo) ||
      this.toNonEmptyString(project?.image) ||
      this.toNonEmptyString(unlock?.logo) ||
      this.toNonEmptyString(unlock?.image) ||
      this.toNonEmptyString(unlock?.icon) ||
      this.toNonEmptyString(detailed?.logo) ||
      this.toNonEmptyString(detailed?.image);
    const nextUnlockEvent = this.compactUnlockEvent(unlock?.nextUnlockEvent);
    const unlockEvents = Array.isArray(unlock?.unlockEvents)
      ? unlock.unlockEvents.map((event: any) => this.compactUnlockEvent(event)).filter(Boolean)
      : [];
    const allocations = this.compactAllocations(unlock?.allocations);

    return {
      _id: unlock?._id,
      projectId: unlock?.projectId,
      projectLinks: this.compactProjectLinks(unlock?.projectLinks),
      source: unlock?.source,
      sourceKey: unlock?.sourceKey,
      sourceUrl: unlock?.sourceUrl,
      detailUrl: unlock?.detailUrl,
      sources: Array.isArray(unlock?.sources) ? unlock.sources : [],
      coinId: unlock?.coinId,
      coinSlug: unlock?.coinSlug,
      coinSymbol: symbol,
      projectName,
      image: logo,
      logo,
      icon: this.toNonEmptyString(unlock?.icon) || logo,
      priceUsd: this.toNumber(unlock?.priceUsd || detailed?.priceUsd || detailed?.price?.USD || project?.priceUsd),
      marketCap: this.toNumber(unlock?.marketCap || project?.marketCap),
      fdv: this.toNumber(unlock?.fdv || project?.fdv),
      circulatingSupply: this.toNumber(unlock?.circulatingSupply || detailed?.circulatingSupply || project?.circulatingSupply),
      totalSupply: this.toNumber(unlock?.totalSupply || detailed?.totalSupply || project?.totalSupply),
      maxSupply: this.toNumber(unlock?.maxSupply || project?.maxSupply),
      circulationSupplyPercent: unlock?.circulationSupplyPercent,
      totalTokensUnlockedPercent: unlock?.totalTokensUnlockedPercent,
      totalTokensLockedPercent: unlock?.totalTokensLockedPercent,
      tgeDate: unlock?.tgeDate,
      detailed: {
        name: projectName,
        symbol,
        image: logo,
        logo,
        icon: this.toNonEmptyString(unlock?.icon) || logo,
        niche: detailed?.niche || allocations[0]?.name || "Token Unlock",
        price: {
          USD: this.toNumber(detailed?.price?.USD || unlock?.priceUsd || project?.priceUsd),
        },
        priceChange24h: this.toNumber(detailed?.priceChange24h),
        circulatingSupply: this.toNumber(detailed?.circulatingSupply || unlock?.circulatingSupply || project?.circulatingSupply),
        totalSupply: this.toNumber(detailed?.totalSupply || unlock?.totalSupply || project?.totalSupply),
        fullyDilutedMarketCap: this.toNumber(detailed?.fullyDilutedMarketCap || unlock?.fdv || project?.fdv),
        mainCategory: {
          name:
            detailed?.mainCategory?.name ||
            project?.mainCategory?.name ||
            allocations[0]?.name ||
            "Token Unlock",
        },
      },
      rating: project?.rating,
      fomoScore: project?.fomoScore,
      likes: Array.isArray(project?.likes) ? project.likes.length : this.toNumber(project?.likes),
      redFlags: this.toNumber(project?.redFlags),
      redFlagsList: Array.isArray(project?.redFlagsList) ? project.redFlagsList : [],
      publicVestingPercent: unlock?.publicVestingPercent,
      nextUnlockPercent: unlock?.nextUnlockPercent,
      nextUnlockValueUsd: unlock?.nextUnlockValueUsd,
      nextUnlockTokensAmount: unlock?.nextUnlockTokensAmount,
      totalTokensUnlockedAmount: unlock?.totalTokensUnlockedAmount,
      totalTokensLockedAmount: unlock?.totalTokensLockedAmount,
      totalTokensUntrackedPercent: unlock?.totalTokensUntrackedPercent,
      totalTokensUntrackedAmount: unlock?.totalTokensUntrackedAmount,
      lastTokenUnlockDate: unlock?.lastTokenUnlockDate,
      nextTokenUnlockDate: unlock?.nextTokenUnlockDate,
      allocations,
      vesting: this.compactVesting(unlock?.vesting),
      chart: this.compactChart(unlock?.chart),
      unlockEvents,
      nextUnlockEvent,
      largestUnlockEvent: this.compactUnlockEvent(unlock?.largestUnlockEvent),
      intelSourceSnapshot: this.compactIntelSourceSnapshot(unlock?.intelSourceSnapshot),
      projectSnapshot: project
        ? {
            _id: project._id,
            name: project.name,
            slug: project.slug,
            symbol: project.symbol || project.ticker || project.niche,
            logo: project.logo || project.image,
            mainCategory: project.mainCategory,
          }
        : undefined,
    };
  }

  private async compactUnlocksWithProjects(unlocks: any[]): Promise<any[]> {
    const projectsById = await this.loadProjectsForUnlocks(unlocks);

    return unlocks.map((unlock) => this.compactUnlock(unlock, this.pickUnlockProject(unlock, projectsById)));
  }

  private getFrontendUrl(): string {
    return String(process.env.FRONT_URL || "https://fomo.cx").replace(/\/+$/, "");
  }

  private async sendUnlockReminder(event: any): Promise<void> {
    const user = await this.userModel.findById(event.userId).lean();

    if (!user) {
      return;
    }

    const projectName = event.projectName || event.name || "Token unlock";
    const link = `${this.getFrontendUrl()}/crypto/calendar`;

    if (user.telegramNotification && user.telegramData?.telegramId) {
      await this.telegramService.sendNotification(
        String(user.telegramData.telegramId),
        projectName,
        link,
      );
    }

    if (user.emailNotification && user.email) {
      await this.emailService.sendNotification(user.email, projectName, link);
    }
  }

  @Cron("0 */5 * * * *")
  public async sendDueUnlockReminders(): Promise<void> {
    const now = new Date();
    const dueEvents = await this.eventModel
      .find({
        notifyAt: { $lte: now },
        notifyEnabled: true,
        sourceType: TOKEN_UNLOCK_SOURCE_TYPE,
        $or: [
          { notifySentAt: { $exists: false } },
          { notifySentAt: null },
        ],
      })
      .limit(50)
      .lean();

    for (const event of dueEvents) {
      try {
        await this.sendUnlockReminder(event);
        await this.eventModel.updateOne(
          { _id: event._id },
          { $set: { notifySentAt: new Date() } },
        );
      } catch (error) {
        this.logger.warn(
          `Failed to send token unlock reminder for event ${event._id}: ${
            error?.message || error
          }`,
        );
      }
    }
  }

  public async getTokenUnlocks(
    query?: GetTokenUnlocksDto
  ): Promise<{
    totalCount: number;
    unlocks: TokenUnlock[];
    allocations: any[];
  }> {
    if (this.useV2ReadModel(query)) {
      return this.fomoV2UnlockFeedReadService.getTokenUnlocks(query as any) as any;
    }

    const {
      search,
      platform,
      source,
      category,
      status = "upcoming",
      days,
      minValueUsd,
      small_unlocks: smallUnlocksSnake,
      smallUnlocks,
      sortBy = "nextTokenUnlockDate",
      sortOrder = "asc",
      limit = 5,
      offset = 0,
    } = query || {};

    const now = new Date();
    const parsedLimit = Math.max(1, Number(limit) || 5);
    const parsedOffset = Math.max(0, Number(offset) || 0);
    const parsedDays = Number(days);
    const parsedMinValueUsd = Number(minValueUsd);

    const filter: FilterQuery<TokenUnlockDocument> = {};

    if (status === "past") {
      filter.nextTokenUnlockDate = { $exists: true, $ne: null, $lt: now };
    } else if (status !== "all") {
      filter.nextTokenUnlockDate = { $exists: true, $ne: null, $gte: now };
    }

    if (Number.isFinite(parsedDays) && parsedDays > 0) {
      const future = new Date(now.getTime() + parsedDays * 24 * 60 * 60 * 1000);
      const currentDateFilter =
        typeof filter.nextTokenUnlockDate === "object" && filter.nextTokenUnlockDate
          ? filter.nextTokenUnlockDate
          : {};

      filter.nextTokenUnlockDate = {
        ...currentDateFilter,
        $lte: future,
      };
    }

    this.applySmallUnlocksFilter(filter, smallUnlocksSnake ?? smallUnlocks);

    if (search) {
      const regex = new RegExp(this.escapeRegex(search), "i");
      filter.$or = [
        { coinSlug: regex },
        { coinSymbol: regex },
        { "detailed.name": regex },
        { "unlockEvents.name": regex },
        { "unlockEvents.symbol": regex },
      ];
    }

    if (platform) {
      filter.icoPlatforms = platform;
    }

    if (source) {
      filter.sources = source;
    }

    if (category) {
      const categoryRegex = new RegExp(`^${this.escapeRegex(category)}$`, "i");
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        {
          $or: [
            { "unlockEvents.allocation": categoryRegex },
            { "allocations.name": categoryRegex },
            { "detailed.mainCategory.name": categoryRegex },
          ],
        },
      ];
    }

    if (Number.isFinite(parsedMinValueUsd) && parsedMinValueUsd > 0) {
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        {
          $or: [
            { nextUnlockValueUsd: { $gte: parsedMinValueUsd } },
            { "unlockEvents.unlockValueUsd": { $gte: parsedMinValueUsd } },
            { "unlockEvents.valueUsd": { $gte: parsedMinValueUsd } },
          ],
        },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[this.getAllowedSortField(sortBy)] = sortOrder === "asc" ? 1 : -1;
    if (!sort.coinSlug) {
      sort.coinSlug = 1;
    }

    const [totalCount, unlocks] = await Promise.all([
      this.tokenUnlockModel.countDocuments(filter),
      this.tokenUnlockModel
        .find(filter)
        .sort(sort)
        .skip(parsedOffset)
        .limit(parsedLimit)
        .lean(),
    ]);

    const compactUnlocks = await this.compactUnlocksWithProjects(unlocks);

    const sortedAllocations: any[] = compactUnlocks?.length
      ? (
        compactUnlocks[0].allocations?.filter(
          (item: any) => !!item.tokensAllocatedAmount
        ) || []
      ).sort(
        (a: any, b: any) => b.tokensAllocatedAmount - a.tokensAllocatedAmount
      )
      : [];

    return { totalCount, unlocks: compactUnlocks, allocations: sortedAllocations };
  }

  public async getTokenUnlockCategories(
    query?: Pick<GetTokenUnlocksDto, "status" | "limit" | "small_unlocks" | "smallUnlocks">
  ): Promise<{ categories: Array<{ key: string; label: string; count: number }> }> {
    if (this.useV2ReadModel(query as GetTokenUnlocksDto)) {
      return this.fomoV2UnlockFeedReadService.getTokenUnlockCategories(query as any);
    }

    const {
      status = "upcoming",
      limit = 8,
      small_unlocks: smallUnlocksSnake,
      smallUnlocks,
    } = query || {};
    const now = new Date();
    const parsedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
    const filter: FilterQuery<TokenUnlockDocument> = {};

    if (status === "past") {
      filter.nextTokenUnlockDate = { $exists: true, $ne: null, $lt: now };
    } else if (status !== "all") {
      filter.nextTokenUnlockDate = { $exists: true, $ne: null, $gte: now };
    }

    this.applySmallUnlocksFilter(filter, smallUnlocksSnake ?? smallUnlocks);

    const rows = await this.tokenUnlockModel.aggregate([
      { $match: filter },
      {
        $project: {
          categories: {
            $setUnion: [
              {
                $map: {
                  input: { $ifNull: ["$unlockEvents", []] },
                  as: "event",
                  in: "$$event.allocation",
                },
              },
              {
                $map: {
                  input: { $ifNull: ["$allocations", []] },
                  as: "allocation",
                  in: "$$allocation.name",
                },
              },
              ["$detailed.mainCategory.name"],
            ],
          },
        },
      },
      { $unwind: "$categories" },
      {
        $match: {
          categories: {
            $nin: [null, "", "Token Unlock", "-"],
          },
        },
      },
      {
        $group: {
          _id: "$categories",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: parsedLimit },
    ]);

    return {
      categories: rows.map((item) => ({
        key: this.slugify(String(item._id)),
        label: String(item._id),
        count: Number(item.count || 0),
      })),
    };
  }

  private useV2ReadModel(query?: Pick<GetTokenUnlocksDto, "readModel">): boolean {
    return String(query?.readModel || "").trim().toLowerCase() === "v2";
  }

  public async syncTokenUnlocks(): Promise<void> {
    const url = "https://public-api.dropstab.com/api/v1/tokenUnlocks";
    const headers = this.getHeaders();
    const totalPages = 9;

    for (let i = 0; i < totalPages; i++) {
      try {
        const response = await axios.get(
          `${url}?page=${i}&pageSize=100&sortingOrder=DESC&sortingField=MARKET_CAP`,
          { headers }
        );
        const tokenUnlocksData = response?.data?.data?.content || [];
        const result = [];

        for (let i = 0; i < tokenUnlocksData.length; i++) {
          const unlock = tokenUnlocksData[i];
          const slug = unlock.coinSlug;
          if (!slug) continue;

          console.log(`${slug} id = ${i}`);

          try {
            const detailedData = await this.safeRequest(
              `https://public-api.dropstab.com/api/v1/coins/detailed/${slug}`,
              {},
              headers
            );
            const vestingData = await this.safeRequest(
              `https://public-api.dropstab.com/api/v1/tokenUnlocks/chart/${slug}`,
              {},
              headers
            );

            const tokenData = await this.safeRequest(
              `https://public-api.dropstab.com/api/v1/tokenUnlocks/${slug}`,
              {},
              headers
            )

            let publicVestingPercent = 0;
            if (unlock.allocations && Array.isArray(unlock.allocations)) {
              publicVestingPercent = unlock.allocations
                .filter((a) => {
                  const name = a.name?.toLowerCase() || "";
                  return (
                    name.includes("ido") ||
                    name.includes("auction") ||
                    name.includes("public")
                  );
                })
                .reduce((sum, a) => sum + (a.tokensAllocatedPercent || 0), 0);
            }

            let nextUnlockDates: Date[] = [];
            let lastUnlockDates: Date[] = [];

            for (const alloc of unlock.allocations || []) {
              if (alloc.tokenUnlockProgress?.nextTokenUnlockDate) {
                const nextDate = new Date(
                  alloc.tokenUnlockProgress.nextTokenUnlockDate
                );
                if (!isNaN(nextDate.getTime())) nextUnlockDates.push(nextDate);
              }

              if (alloc.tokenUnlockProgress?.lastTokenUnlockDate) {
                const lastDate = new Date(
                  alloc.tokenUnlockProgress.lastTokenUnlockDate
                );
                if (!isNaN(lastDate.getTime())) lastUnlockDates.push(lastDate);
              }
            }

            const now = new Date();
            const nextTokenUnlockDate = nextUnlockDates
              .filter((d) => d > now)
              .sort((a, b) => a.getTime() - b.getTime())[0];

            const lastTokenUnlockDate = lastUnlockDates
              .filter((d) => d <= now)
              .sort((a, b) => b.getTime() - a.getTime())[0];

            const entry = {
              ...unlock,
              publicVestingPercent,
              detailed: detailedData?.data || {},
              nextTokenUnlockDate,
              lastTokenUnlockDate,
              totalTokensUnlockedAmount: tokenData?.data?.totalTokensUnlockedAmount || 0,
              totalTokensLockedAmount: tokenData?.data?.totalTokensLockedAmount || 0,
              totalTokensUntrackedPercent: tokenData?.data?.totalTokensUntrackedPercent || 0,
              totalTokensUntrackedAmount: tokenData?.data?.totalTokensUntrackedAmount || 0,
              vesting: vestingData?.data?.roundsInfo || [],
              chart: vestingData?.data?.points || []
            };

            await this.tokenUnlockModel.updateOne(
              { coinId: entry.coinId },
              entry,
              { upsert: true }
            );

            console.log(`✅ TokenUnlock synced and saved for ${slug}`);
            result.push(entry);
            await this.sleep(1500);
          } catch (err: any) {
            console.error(
              `❌ Failed to fetch/save for ${slug}:`,
              err.message || err
            );
          }
        }

        await this.sleep(1500);
        console.log(
          `✅ Синхронизировано и сохранено ${result.length} tokenUnlocks`
        );
      } catch (err: any) {
        console.error(
          "❌ Ошибка при получении tokenUnlocks:",
          err.message || err
        );
      }
    }
  }
}

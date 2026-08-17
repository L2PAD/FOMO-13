import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Project, ProjectDocument } from "../project.model";
import { ProjectIntel, ProjectIntelDocument } from "./models/project-intel.model";
import { ProjectUnlocks, ProjectUnlocksDocument } from "./models/project-unlocks.model";
import { ProjectSourceMap, ProjectSourceMapDocument } from "./models/project-source-map.model";
import { normalizeSlug } from "./project-identity.util";

type EventsMode = "upcoming" | "all" | "none" | "past";

interface ResolvedEventsQuery {
  mode: EventsMode;
  limit: number | null;
  rangeDays: number | null;
  full: boolean;
  now: Date;
}

@Injectable()
export class ProjectIntelReadService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectIntel.name) private readonly projectIntelModel: Model<ProjectIntelDocument>,
    @InjectModel(ProjectUnlocks.name) private readonly projectUnlocksModel: Model<ProjectUnlocksDocument>,
    @InjectModel(ProjectSourceMap.name) private readonly sourceMapModel: Model<ProjectSourceMapDocument>,
  ) { }

  async getProjectIntel(slugOrId: string): Promise<any> {
    const project = await this.findProject(slugOrId);
    const intel = await this.projectIntelModel.findOne({ projectId: project._id }).lean();
    const dropstab = this.resolveDropstabIntel(intel);

    return {
      project: this.serializeProject(project),
      about: dropstab.about || intel?.about || {},
      description: dropstab.description || intel?.description || {},
      profile: intel?.profile || {},
      fundraising: this.resolveFundraising(intel),
      fundraisingRounds: this.resolveFundraisingRounds(intel),
      tokenomics: intel?.tokenomics || {},
      team: intel?.team || [],
      marketData: intel?.marketData || {},
      dropstab,
      sourceRefs: intel?.sourceRefs || {},
      dataQuality: intel?.dataQuality || {},
      lastSyncedAt: this.latestDate(
        intel?.sourceRefs?.icodrops?.lastSyncedAt,
        intel?.sourceRefs?.dropstab?.lastSyncedAt,
        (intel as any)?.updatedAt,
      ),
    };
  }

  async getProjectFundraising(slugOrId: string): Promise<any> {
    const project = await this.findProject(slugOrId);
    const intel = await this.projectIntelModel.findOne({ projectId: project._id }).lean();
    const dropstab = this.resolveDropstabIntel(intel);
    const fundraisingRounds = this.resolveFundraisingRounds(intel);

    return {
      project: this.serializeProject(project),
      source: (dropstab.fundraising || fundraisingRounds.length) ? "icodrops+dropstab" : "icodrops",
      fundraising: this.resolveFundraising(intel),
      fundraisingRounds,
      dropstabFundraising: dropstab.fundraising || {},
      tokenomics: {
        tokenAllocation: intel?.tokenomics?.tokenAllocation || [],
        initialMarketCap: intel?.tokenomics?.initialMarketCap,
        fdv: intel?.tokenomics?.fdv,
        supply: intel?.tokenomics?.supply,
      },
      dataQuality: intel?.dataQuality || {},
      sourceRefs: intel?.sourceRefs || {},
      lastSyncedAt: this.latestDate(
        intel?.sourceRefs?.icodrops?.lastSyncedAt,
        intel?.sourceRefs?.dropstab?.lastSyncedAt,
        (intel as any)?.updatedAt,
      ),
    };
  }

  async getProjectUnlocks(slugOrId: string, query: any = {}): Promise<any> {
    const project = await this.findProject(slugOrId);
    const intel = await this.projectIntelModel.findOne({ projectId: project._id }).lean();
    const unlocks = await this.findProjectUnlocks(project);
    const dropstab = this.resolveDropstabIntel(intel);
    const fundraisingRounds = this.resolveFundraisingRounds(intel);
    const eventQuery = this.resolveEventsQuery(query);
    const allEvents = Array.isArray(unlocks?.unlockingEvents) ? unlocks.unlockingEvents : [];
    const filteredEvents = this.filterEvents(allEvents, eventQuery);
    const nextUnlockingEvent = this.resolveNextUnlockingEvent(unlocks?.nextUnlockingEvent, allEvents, eventQuery.now);

    return {
      project: this.serializeProject(project),
      source: "dropstab",
      about: dropstab.about || intel?.about || {},
      description: dropstab.description || intel?.description || {},
      fundraising: this.resolveFundraising(intel),
      fundraisingRounds,
      dropstabFundraising: dropstab.fundraising || {},
      dropstab,
      tokenAllocation: unlocks?.tokenAllocation || [],
      vestingSummary: unlocks?.vestingSummary || {},
      vestingSchedule: unlocks?.vestingSchedule || [],
      vestingRounds: unlocks?.vestingRounds || [],
      vestingTimeline: unlocks?.vestingTimeline || [],
      unlockingEventsFilter: {
        mode: eventQuery.mode,
        limit: eventQuery.limit,
        rangeDays: eventQuery.rangeDays,
        returned: filteredEvents.length,
        total: allEvents.length,
      },
      unlockingEvents: eventQuery.full ? filteredEvents : filteredEvents.map((event) => this.compactUnlockingEvent(event)),
      nextUnlockingEvent: eventQuery.full
        ? nextUnlockingEvent
        : this.compactNextUnlockingEvent(nextUnlockingEvent),
      publicVesting: unlocks?.publicVesting || null,
      dataQuality: {
        ...(intel?.dataQuality || {}),
        ...(unlocks?.dataQuality || {}),
      },
      sourceLinks: unlocks?.sourceLinks || [],
      sourceRefs: {
        ...(intel?.sourceRefs || {}),
        ...(unlocks?.sourceRefs || {}),
      },
      lastSyncedAt: this.latestDate(
        unlocks?.sourceRefs?.dropstab?.lastSyncedAt,
        intel?.sourceRefs?.dropstab?.lastSyncedAt,
        (unlocks as any)?.updatedAt,
        (intel as any)?.updatedAt,
      ),
    };
  }

  private async findProject(slugOrId: string): Promise<any> {
    const normalizedSlug = normalizeSlug(slugOrId);
    const clauses: any[] = [{ slug: slugOrId }, { slug: normalizedSlug }, { sourceId: slugOrId }];
    if (Types.ObjectId.isValid(slugOrId)) clauses.push({ _id: new Types.ObjectId(slugOrId) });

    const project = await this.projectModel.findOne({ $or: clauses }).lean();
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  private async findProjectUnlocks(project: any): Promise<any | null> {
    const direct = await this.projectUnlocksModel.findOne({ projectId: project._id, source: "dropstab" }).lean();
    if (direct) return direct;

    const slugs = this.projectSlugCandidates(project);
    const sourceIds = this.projectSourceIdCandidates(project);
    const sourceMapClauses = [
      slugs.length ? { sourceSlug: { $in: slugs } } : null,
      sourceIds.length ? { sourceId: { $in: sourceIds } } : null,
    ].filter(Boolean);

    if (sourceMapClauses.length) {
      const sourceMap = await this.sourceMapModel
        .findOne({ source: "dropstab", $or: sourceMapClauses })
        .sort({ isVerified: -1, confidence: -1, updatedAt: -1 })
        .lean();

      if (sourceMap?.projectId) {
        const mapped = await this.projectUnlocksModel
          .findOne({ projectId: sourceMap.projectId, source: "dropstab" })
          .lean();
        if (mapped) return mapped;
      }
    }

    const unlockRefClauses = [
      slugs.length ? { "sourceRefs.dropstab.slug": { $in: slugs } } : null,
      slugs.length ? { "sourceRefs.dropstab.icoSlug": { $in: slugs } } : null,
      sourceIds.length ? { "sourceRefs.dropstab.icoProjectId": { $in: sourceIds } } : null,
    ].filter(Boolean);

    if (!unlockRefClauses.length) return null;

    return this.projectUnlocksModel
      .findOne({ source: "dropstab", $or: unlockRefClauses })
      .sort({ updatedAt: -1 })
      .lean();
  }

  private projectSlugCandidates(project: any): string[] {
    return this.uniqueNonEmptyStrings([
      project?.slug,
      normalizeSlug(project?.slug),
      normalizeSlug(project?.sourceId),
      normalizeSlug(project?.name),
    ]);
  }

  private projectSourceIdCandidates(project: any): string[] {
    return this.uniqueNonEmptyStrings([
      project?.sourceId,
      project?.slug,
      normalizeSlug(project?.sourceId),
      normalizeSlug(project?.slug),
    ]);
  }

  private uniqueNonEmptyStrings(values: any[]): string[] {
    return Array.from(
      new Set(
        values
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );
  }

  private serializeProject(project: any): any {
    return {
      id: String(project._id),
      name: project.name,
      symbol: project.symbol || project.ticker || null,
      slug: project.slug,
      logo: project.logo || null,
    };
  }

  private resolveDropstabIntel(intel: any): any {
    if (!intel) return {};
    const source = intel.dropstab || {};
    return this.compactObject({
      about: intel.about || source.about,
      description: intel.description || source.description,
      fundraising: source.fundraising || intel.fundraising?.dropstab,
      fundraisingRounds: this.resolveFundraisingRounds(intel),
      sourceLinks: source.sourceLinks || [],
      parsedAt: source.parsedAt || null,
      dataQuality: source.dataQuality || {},
    }) || {};
  }

  private resolveFundraising(intel: any): any {
    const base = intel?.fundraising || {};
    const dropstab = intel?.dropstab?.fundraising || base.dropstab || {};
    const rounds = this.resolveFundraisingRounds(intel);
    const merged = {
      ...base,
      dropstab,
      fundraisingRounds: rounds,
      totalRaised: base.totalRaised ?? dropstab.totalRaised,
      totalRaisedFormatted: base.totalRaisedFormatted ?? dropstab.totalRaisedFormatted,
      valuation: base.valuation ?? dropstab.valuation,
      valuationFormatted: base.valuationFormatted ?? dropstab.valuationFormatted,
      investors: this.mergeUniqueByName(base.investors, dropstab.investors),
      leadInvestors: this.mergeUniqueByName(base.leadInvestors, dropstab.leadInvestors),
      roundsCount: base.roundsCount ?? dropstab.roundsCount ?? (rounds.length || undefined),
      investorsCount: base.investorsCount ?? dropstab.investorsCount,
    };

    return this.compactObject(merged) || {};
  }

  private resolveFundraisingRounds(intel: any): any[] {
    const rounds =
      intel?.dropstab?.fundraisingRounds ||
      intel?.fundraising?.dropstabRounds ||
      intel?.fundraising?.fundraisingRounds ||
      [];
    return Array.isArray(rounds) ? rounds : [];
  }

  private resolveEventsQuery(query: any): ResolvedEventsQuery {
    const full = this.isTruthy(query.full);
    const mode = this.parseEventsMode(query.events) || (full ? "all" : "upcoming");
    const explicitLimit = this.optionalNumber(query.eventsLimit, 0, 200);

    return {
      mode,
      full,
      limit: explicitLimit === undefined ? (full || mode === "all" ? null : 10) : explicitLimit,
      rangeDays: this.parseEventsRangeDays(query.eventsRange),
      now: new Date(),
    };
  }

  private filterEvents(events: any[], query: ResolvedEventsQuery): any[] {
    if (query.mode === "none") return [];
    const filtered = events.filter((event) => this.matchesEventsMode(event, query));
    const sorted = this.sortEvents(filtered, query);
    return query.limit === null ? sorted : sorted.slice(0, query.limit);
  }

  private matchesEventsMode(event: any, query: ResolvedEventsQuery): boolean {
    const start = this.eventStartTime(event);
    const end = this.eventEndTime(event);
    if (start === null || end === null) return false;

    const now = query.now.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (query.mode === "upcoming") {
      if (end < now) return false;
      if (query.rangeDays !== null && start > now + query.rangeDays * dayMs) return false;
      return true;
    }

    if (query.mode === "past") {
      if (end >= now) return false;
      if (query.rangeDays !== null && end < now - query.rangeDays * dayMs) return false;
      return true;
    }

    if (query.mode === "all" && query.rangeDays !== null) {
      const min = now - query.rangeDays * dayMs;
      const max = now + query.rangeDays * dayMs;
      return end >= min && start <= max;
    }

    return true;
  }

  private sortEvents(events: any[], query: ResolvedEventsQuery): any[] {
    if (query.mode === "past") {
      return [...events].sort((left, right) => (this.eventEndTime(right) || 0) - (this.eventEndTime(left) || 0));
    }

    if (query.mode === "upcoming") {
      const now = query.now.getTime();
      return [...events].sort((left, right) => this.upcomingSortTime(left, now) - this.upcomingSortTime(right, now));
    }

    return [...events].sort((left, right) => (this.eventStartTime(left) || 0) - (this.eventStartTime(right) || 0));
  }

  private resolveNextUnlockingEvent(storedEvent: any, events: any[], nowDate: Date): any | null {
    const now = nowDate.getTime();
    if (storedEvent && (this.eventEndTime(storedEvent) ?? this.eventStartTime(storedEvent) ?? 0) >= now) {
      return storedEvent;
    }

    const upcomingQuery: ResolvedEventsQuery = {
      mode: "upcoming",
      limit: null,
      rangeDays: null,
      full: true,
      now: nowDate,
    };
    return this.filterEvents(events, upcomingQuery)[0] || null;
  }

  private compactUnlockingEvent(event: any): any {
    const compact: any = {
      unlockDate: this.toIsoString(event?.unlockDate),
      amount: this.numberOrNull(event?.amount),
      percent: this.numberOrNull(event?.percent),
      valueUsd: this.numberOrNull(event?.valueUsd),
      roundsCount: this.numberOrNull(event?.roundsCount),
      stage: this.resolveEventStage(event),
      roundNames: this.stringArray(event?.roundNames),
      unlockTypes: this.stringArray(event?.unlockTypes),
      isTgeUnlock: Boolean(event?.isTgeUnlock),
      isPast: this.resolveIsPast(event),
    };

    if (event?.isCompacted) compact.isCompacted = true;
    if (Number(event?.occurrences) > 1) compact.occurrences = Number(event.occurrences);
    if (event?.endDate) compact.endDate = this.toIsoString(event.endDate);

    return compact;
  }

  private compactNextUnlockingEvent(event: any): any {
    if (!event) return null;
    const { rounds, ...rest } = event;
    return {
      ...rest,
      unlockDate: this.toIsoString(event.unlockDate) || event.unlockDate || null,
      stage: this.resolveEventStage(event),
      roundNames: this.stringArray(event.roundNames),
    };
  }

  private resolveEventStage(event: any): string | null {
    if (Number(event?.roundsCount) !== 1) return null;
    const cleaned = String(event?.stage || event?.roundNames?.[0] || "").trim();
    return cleaned && !/^multiple$/i.test(cleaned) ? cleaned : null;
  }

  private upcomingSortTime(event: any, now: number): number {
    const start = this.eventStartTime(event);
    const end = this.eventEndTime(event);
    if (start === null) return Number.MAX_SAFE_INTEGER;
    if (end !== null && start < now && end >= now) return now;
    return start;
  }

  private eventStartTime(event: any): number | null {
    return this.dateTimeOrNull(event?.unlockDate);
  }

  private eventEndTime(event: any): number | null {
    return this.dateTimeOrNull(event?.endDate) ?? this.dateTimeOrNull(event?.unlockDate);
  }

  private resolveIsPast(event: any): boolean {
    const end = this.eventEndTime(event);
    return end !== null ? end < Date.now() : Boolean(event?.isPast);
  }

  private parseEventsMode(value: any): EventsMode | undefined {
    const mode = String(value || "").trim().toLowerCase();
    return ["upcoming", "all", "none", "past"].includes(mode) ? (mode as EventsMode) : undefined;
  }

  private parseEventsRangeDays(value: any): number | null {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return null;
    const match = text.match(/^(\d+)\s*([dwmy]?)$/);
    if (!match) return null;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const unit = match[2] || "d";
    const days = unit === "y" ? amount * 365 : unit === "m" ? amount * 30 : unit === "w" ? amount * 7 : amount;
    return Math.max(1, Math.min(3650, Math.trunc(days)));
  }

  private optionalNumber(value: any, min: number, max: number): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : undefined;
  }

  private isTruthy(value: any): boolean {
    return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
  }

  private stringArray(value: any): string[] {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return Array.from(
      new Set(
        list
          .map((item) => String(item || "").trim())
          .filter((item) => item && !/^multiple$/i.test(item)),
      ),
    );
  }

  private numberOrNull(value: any): number | null {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private mergeUniqueByName(...values: any[]): any[] {
    const seen = new Set<string>();
    const result: any[] = [];

    for (const value of values) {
      const list = Array.isArray(value) ? value : value ? [value] : [];
      for (const item of list) {
        const key = typeof item === "string"
          ? item.trim().toLowerCase()
          : String(item?.name || item?.title || item?.slug || item?.url || "").trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(item);
      }
    }

    return result;
  }

  private compactObject(value: any): any | undefined {
    if (!value || typeof value !== "object") return undefined;
    const result: any = {};

    for (const [key, raw] of Object.entries(value)) {
      let item: any = raw;
      if (item && typeof item === "object" && !Array.isArray(item) && !(item instanceof Date)) {
        item = this.compactObject(item);
      }
      if (item === undefined || item === null || item === "") continue;
      if (Array.isArray(item) && !item.length) continue;
      if (item && typeof item === "object" && !(item instanceof Date) && !Array.isArray(item) && !Object.keys(item).length) continue;
      result[key] = item;
    }

    return Object.keys(result).length ? result : undefined;
  }

  private toIsoString(value: any): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  private dateTimeOrNull(value: any): number | null {
    const iso = this.toIsoString(value);
    if (!iso) return null;
    const time = new Date(iso).getTime();
    return Number.isFinite(time) ? time : null;
  }

  private latestDate(...values: any[]): string | null {
    const times = values
      .map((value) => this.dateTimeOrNull(value))
      .filter((value) => value !== null) as number[];
    if (!times.length) return null;
    return new Date(Math.max(...times)).toISOString();
  }
}

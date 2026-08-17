import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FomoV2MarketProjectReadModel } from "../../market/models";
import {
  FomoV2TokenAllocation,
  FomoV2VestingRound,
  FomoV2VestingSummary,
} from "../../vesting/models";
import { FomoV2UnlockEvent } from "../models";

export interface FomoV2UnlockFeedQuery {
  search?: string;
  platform?: string;
  source?: string;
  category?: string;
  status?: "upcoming" | "past" | "all" | string;
  days?: number | string;
  minValueUsd?: number | string;
  small_unlocks?: string | boolean;
  smallUnlocks?: string | boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  limit?: number | string;
  offset?: number | string;
}

export interface FomoV2UnlockFeedResult {
  totalCount: number;
  unlocks: any[];
  allocations: any[];
  vesting: any[];
}

export interface FomoV2UnlockFeedCalendarResolution {
  sourceId: string;
  unlock: any;
  unlockEvent: Record<string, any>;
}

interface BuildRowsContext {
  now: Date;
  status?: string;
}

interface EnrichmentContext {
  readRowsByMarketAssetId: Map<string, any>;
  readRowsByCanonicalProjectId: Map<string, any>;
  allocationsByProjectId: Map<string, any[]>;
  allocationById: Map<string, any>;
  roundsByProjectId: Map<string, any[]>;
  summariesByProjectId: Map<string, any[]>;
}

const SMALL_UNLOCK_MIN_PERCENT = 1;
const CATEGORY_DENY_LIST = new Set([
  "",
  "-",
  "mixed",
  "multiple",
  "token unlock",
  "unknown",
  "various",
]);

@Injectable()
export class FomoV2UnlockFeedReadService {
  constructor(
    @InjectModel(FomoV2UnlockEvent.name)
    private readonly unlockEventModel: Model<FomoV2UnlockEvent>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<FomoV2TokenAllocation>,
    @InjectModel(FomoV2VestingRound.name)
    private readonly vestingRoundModel: Model<FomoV2VestingRound>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<FomoV2VestingSummary>
  ) {}

  async getTokenUnlocks(
    query: FomoV2UnlockFeedQuery = {}
  ): Promise<FomoV2UnlockFeedResult> {
    const now = new Date();
    const limit = Math.min(this.positiveInteger(query.limit, 50), 100);
    const offset = Math.min(this.nonNegativeInteger(query.offset, 0), 100_000);
    const events = await this.loadEvents(query, now);
    let rows = await this.buildRowsFromEvents(events, { now, status: query.status });

    rows = this.applyRowFilters(rows, query);
    rows = this.sortRows(rows, query);

    const totalCount = rows.length;
    const unlocks = rows.slice(offset, offset + limit);
    const allocations =
      unlocks[0]?.allocations
        ?.filter((item: any) => Number(item?.tokensAllocatedAmount || 0) > 0)
        ?.sort(
          (left: any, right: any) =>
            Number(right.tokensAllocatedAmount || 0) -
            Number(left.tokensAllocatedAmount || 0)
        ) || [];

    return { totalCount, unlocks, allocations, vesting: [] };
  }

  async getTokenUnlockCategories(
    query: Pick<
      FomoV2UnlockFeedQuery,
      "status" | "limit" | "small_unlocks" | "smallUnlocks"
    > = {}
  ): Promise<{ categories: Array<{ key: string; label: string; count: number }> }> {
    const now = new Date();
    const limit = Math.min(this.positiveInteger(query.limit, 8), 20);
    const events = await this.loadEvents(query, now);
    const rows = await this.buildRowsFromEvents(events, {
      now,
      status: query.status,
    });
    const counts = new Map<string, { label: string; count: number }>();

    for (const row of rows) {
      const labels = new Set<string>();
      for (const event of row.unlockEvents || []) {
        this.pushCategoryLabel(labels, event?.allocation);
        this.pushCategoryLabel(labels, event?.roundName);
      }
      for (const allocation of row.allocations || []) {
        this.pushCategoryLabel(labels, allocation?.name);
      }
      this.pushCategoryLabel(labels, row?.detailed?.mainCategory?.name);

      for (const label of labels) {
        const key = this.slugify(label);
        const current = counts.get(key) || { label, count: 0 };
        current.count += 1;
        counts.set(key, current);
      }
    }

    return {
      categories: Array.from(counts.entries())
        .map(([key, value]) => ({ key, label: value.label, count: value.count }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
        .slice(0, limit),
    };
  }

  async resolveCalendarEvent(
    unlockId: string
  ): Promise<FomoV2UnlockFeedCalendarResolution | null> {
    const id = this.nonEmptyString(unlockId);
    if (!id) return null;

    const resolutions = await this.resolveCalendarEvents([id]);
    return resolutions.get(id) || null;
  }

  async resolveCalendarEvents(
    unlockIds: string[],
  ): Promise<Map<string, FomoV2UnlockFeedCalendarResolution>> {
    const ids = Array.from(
      new Set(unlockIds.map((value) => this.nonEmptyString(value)).filter(Boolean)),
    );
    if (!ids.length) return new Map();

    const events = await this.unlockEventModel
      .find(this.buildEventIdsFilter(ids))
      .limit(Math.min(ids.length * 4, 400))
      .lean();
    if (!events.length) return new Map();

    const now = new Date();
    const rows = await this.buildRowsFromEvents(events, { now, status: "all" });
    const rowsByGroupKey = new Map(
      rows.map((row) => [
        this.idString(row?.marketAssetId) || this.idString(row?.canonicalProjectId),
        row,
      ]),
    );
    const result = new Map<string, FomoV2UnlockFeedCalendarResolution>();

    for (const id of ids) {
      const rawEvent = events.find((event) => this.eventMatchesId(event, id));
      if (!rawEvent) continue;

      const row = rowsByGroupKey.get(this.groupKey(rawEvent) || "");
      if (!row) continue;

      const unlockEvent = (row.unlockEvents || []).find((item: any) =>
        [item?.id, item?.sourceKey, item?.sourceId]
          .map((value) => this.nonEmptyString(value))
          .includes(id),
      );
      if (!unlockEvent) continue;

      result.set(id, {
        sourceId:
          this.nonEmptyString(unlockEvent.id) ||
          this.nonEmptyString(unlockEvent.sourceKey) ||
          this.nonEmptyString(unlockEvent.sourceId) ||
          id,
        unlock: row,
        unlockEvent,
      });
    }

    return result;
  }

  private async loadEvents(
    query: FomoV2UnlockFeedQuery,
    now: Date
  ): Promise<any[]> {
    const filter = this.buildEventFilter(query, now);
    const maxEvents =
      query.search || this.statusValue(query.status) === "all"
        ? 10000
        : Math.min(
            Math.max(
              this.positiveInteger(query.limit, 50) +
                this.nonNegativeInteger(query.offset, 0),
              500
            ),
            10000
          );

    return this.unlockEventModel
      .find(filter)
      .sort({ unlockDate: this.statusValue(query.status) === "past" ? -1 : 1, _id: 1 } as any)
      .limit(maxEvents)
      .lean();
  }

  private buildEventFilter(
    query: FomoV2UnlockFeedQuery,
    now: Date
  ): Record<string, any> {
    const filter: Record<string, any> = {};
    const status = this.statusValue(query.status);
    const and: any[] = [];

    if (status === "past") {
      filter.unlockDate = { $exists: true, $ne: null, $lt: now };
    } else if (status !== "all") {
      filter.unlockDate = { $exists: true, $ne: null, $gte: now };
      and.push(this.unappliedEventFilter());
    }

    const requestedDays = Number(query.days);
    if (Number.isFinite(requestedDays) && requestedDays > 0) {
      const days = Math.min(requestedDays, 3650);
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      filter.unlockDate = {
        ...(typeof filter.unlockDate === "object" ? filter.unlockDate : {}),
        $lte: future,
      };
    }

    if (!this.includesSmallUnlocks(query.small_unlocks ?? query.smallUnlocks)) {
      and.push({
        $or: [
          { percentOfSupply: { $gte: SMALL_UNLOCK_MIN_PERCENT } },
          { sourceMarketCapSharePercent: { $gte: SMALL_UNLOCK_MIN_PERCENT } },
        ],
      });
    }

    if (query.source) {
      filter.sourceType = this.nonEmptyString(query.source);
    }

    if (query.category) {
      const regex = new RegExp(`^${this.escapeRegex(String(query.category))}$`, "i");
      and.push({
        $or: [
          { roundName: regex },
          { normalizedRoundName: this.slugify(String(query.category)).replace(/-/g, "_") },
          { stage: regex },
        ],
      });
    }

    if (and.length) filter.$and = and;
    return filter;
  }

  private unappliedEventFilter(): Record<string, any> {
    return {
      $and: [
        {
          $or: [{ appliedAt: { $exists: false } }, { appliedAt: null }],
        },
        {
          $or: [
            { appliedStatus: { $exists: false } },
            { appliedStatus: null },
            { appliedStatus: { $nin: ["applied", "skipped"] } },
          ],
        },
      ],
    };
  }

  private async buildRowsFromEvents(
    events: any[],
    context: BuildRowsContext
  ): Promise<any[]> {
    if (!events.length) return [];

    const enrichment = await this.loadEnrichment(events);
    const groups = new Map<string, any[]>();
    for (const event of events) {
      const key = this.groupKey(event);
      if (!key) continue;
      groups.set(key, [...(groups.get(key) || []), event]);
    }

    return Array.from(groups.values())
      .map((groupEvents) => this.buildRow(groupEvents, enrichment, context))
      .filter(Boolean);
  }

  private async loadEnrichment(events: any[]): Promise<EnrichmentContext> {
    const marketAssetIds = this.uniqueObjectIds(events.map((event) => event.marketAssetId));
    const canonicalProjectIds = this.uniqueObjectIds(events.map((event) => event.canonicalProjectId));
    const allocationIds = this.uniqueObjectIds(events.map((event) => event.tokenAllocationId));

    const [readRows, allocations, rounds, summaries] = await Promise.all([
      this.marketReadModel
        .find({
          $or: [
            marketAssetIds.length ? { marketAssetId: { $in: marketAssetIds } } : undefined,
            canonicalProjectIds.length ? { canonicalProjectId: { $in: canonicalProjectIds } } : undefined,
          ].filter(Boolean),
        })
        .lean(),
      this.tokenAllocationModel
        .find({
          $or: [
            canonicalProjectIds.length ? { canonicalProjectId: { $in: canonicalProjectIds } } : undefined,
            allocationIds.length ? { _id: { $in: allocationIds } } : undefined,
          ].filter(Boolean),
        })
        .lean(),
      this.vestingRoundModel
        .find({ canonicalProjectId: { $in: canonicalProjectIds } })
        .lean(),
      this.vestingSummaryModel
        .find({ canonicalProjectId: { $in: canonicalProjectIds } })
        .lean(),
    ]);

    return {
      readRowsByMarketAssetId: new Map(
        (readRows as any[]).map((row) => [this.idString(row.marketAssetId), row])
      ),
      readRowsByCanonicalProjectId: new Map(
        (readRows as any[])
          .filter((row) => row.canonicalProjectId)
          .map((row) => [this.idString(row.canonicalProjectId), row])
      ),
      allocationsByProjectId: this.groupById(allocations, "canonicalProjectId"),
      allocationById: new Map((allocations as any[]).map((item) => [this.idString(item._id), item])),
      roundsByProjectId: this.groupById(rounds, "canonicalProjectId"),
      summariesByProjectId: this.groupById(summaries, "canonicalProjectId"),
    };
  }

  private buildRow(
    rawEvents: any[],
    enrichment: EnrichmentContext,
    context: BuildRowsContext
  ): any {
    const now = context.now;
    const events = [...rawEvents].sort(
      (left, right) =>
        this.dateTime(left.unlockDate) - this.dateTime(right.unlockDate) ||
        this.idString(left._id).localeCompare(this.idString(right._id))
    );
    const firstEvent = events[0];
    const canonicalProjectId = this.idString(firstEvent?.canonicalProjectId);
    const marketAssetId = this.idString(firstEvent?.marketAssetId);
    const readRow =
      enrichment.readRowsByMarketAssetId.get(marketAssetId) ||
      enrichment.readRowsByCanonicalProjectId.get(canonicalProjectId) ||
      {};
    const allocations = enrichment.allocationsByProjectId.get(canonicalProjectId) || [];
    const rounds = enrichment.roundsByProjectId.get(canonicalProjectId) || [];
    const summary = this.pickSummary(
      enrichment.summariesByProjectId.get(canonicalProjectId) || [],
      firstEvent?.sourceType
    );
    const priceUsd = this.firstNumber(
      readRow.price,
      readRow.priceUsd,
      readRow.usdQuote?.price
    );
    const logo = this.firstString(readRow.logo, readRow.image, readRow.icon);
    const symbol = this.firstString(readRow.symbol, firstEvent?.symbol);
    const name = this.firstString(readRow.name, firstEvent?.name, readRow.slug);
    const slug = this.firstString(
      readRow.providerIds?.coingeckoId,
      readRow.slug,
      this.slugify(name)
    );
    const allCanonicalEvents = events.map((event) =>
      this.toCanonicalUnlockEvent(event, {
        allocation: enrichment.allocationById.get(this.idString(event.tokenAllocationId)),
        logo,
        name,
        now,
        priceUsd,
        readRow,
        slug,
        symbol,
      })
    );
    const futureEvents = allCanonicalEvents.filter((event) => !event.isPast);
    const pastEvents = allCanonicalEvents.filter((event) => event.isPast);
    const nextUnlockEvent =
      futureEvents[0] ||
      (this.statusValue(context.status) === "past" ? pastEvents[pastEvents.length - 1] : null) ||
      allCanonicalEvents[0] ||
      null;
    const nextDateTime = this.dateTime(nextUnlockEvent?.unlockDate);
    const nextDateEvents = Number.isFinite(nextDateTime)
      ? futureEvents.filter((event) => this.dateTime(event.unlockDate) === nextDateTime)
      : [];
    const nextUnlockTokensAmount = this.roundNumber(
      nextDateEvents.reduce((sum, event) => sum + Number(event.tokensAmount || 0), 0),
      6
    );
    const nextUnlockPercent = this.roundNumber(
      nextDateEvents.reduce((sum, event) => sum + Number(event.tokensPercent || 0), 0),
      6
    );
    const nextUnlockValueUsd = this.roundNumber(
      nextDateEvents.reduce((sum, event) => sum + Number(event.unlockValueUsd || 0), 0),
      6
    );
    const largestUnlockEvent =
      [...allCanonicalEvents].sort(
        (left, right) => Number(right.unlockValueUsd || 0) - Number(left.unlockValueUsd || 0)
      )[0] || null;
    const actionId =
      this.nonEmptyString(nextUnlockEvent?.id) ||
      this.nonEmptyString(nextUnlockEvent?.sourceKey) ||
      this.nonEmptyString(nextUnlockEvent?.sourceId);
    const progress = this.buildProgress(summary, rounds);
    const compactAllocations = this.compactAllocations(
      allocations,
      allCanonicalEvents
    );

    return this.cleanObject({
      _id: marketAssetId || canonicalProjectId,
      projectId: this.idString(readRow.legacyProjectId),
      projectLinks: canonicalProjectId
        ? [
            {
              projectId: slug || canonicalProjectId,
              projectType: "market",
              confidence: "high",
              matchedBy: "fomo-v2",
            },
          ]
        : [],
      source: "fomo-v2",
      sourceKey: `fomo-v2:${marketAssetId || canonicalProjectId}`,
      actionId,
      userActionSourceId: actionId,
      sources: this.uniqueStrings(events.map((event) => event.sourceType)),
      coinId:
        this.firstNumber(readRow.providerIds?.coinMarketCapId) ||
        Math.abs(this.hashToNegativeNumber(slug || marketAssetId || canonicalProjectId)),
      coinSlug: slug,
      coinSymbol: symbol,
      coingeckoId: this.firstString(readRow.providerIds?.coingeckoId, slug),
      providerIds: readRow.providerIds,
      slug,
      marketProjectId: slug,
      marketAssetId,
      canonicalProjectId,
      projectName: name,
      image: logo,
      logo,
      icon: logo,
      priceUsd,
      marketCap: this.firstNumber(readRow.marketCap, readRow.usdQuote?.market_cap),
      fdv: this.firstNumber(readRow.fullyDilutedMarketCap, readRow.usdQuote?.fully_diluted_market_cap),
      circulatingSupply: this.firstNumber(readRow.circulatingSupply),
      totalSupply: this.firstNumber(readRow.totalSupply),
      maxSupply: this.firstNumber(readRow.maxSupply),
      circulationSupplyPercent: this.firstNumber(
        readRow.circulatingSupplyPercent,
        progress.unlockedPercent
      ),
      totalTokensUnlockedPercent: progress.unlockedPercent,
      totalTokensLockedPercent: progress.lockedPercent,
      tgeDate: allCanonicalEvents[0]?.unlockDate,
      detailed: {
        name,
        symbol,
        image: logo,
        logo,
        icon: logo,
        niche: compactAllocations[0]?.name || this.firstCategory(allCanonicalEvents) || "Token Unlock",
        price: { USD: priceUsd },
        priceChange24h: this.firstNumber(readRow.priceChange, readRow.usdQuote?.percent_change_24h),
        circulatingSupply: this.firstNumber(readRow.circulatingSupply),
        totalSupply: this.firstNumber(readRow.totalSupply),
        fullyDilutedMarketCap: this.firstNumber(readRow.fullyDilutedMarketCap),
        mainCategory: {
          name: this.firstCategory(allCanonicalEvents) || compactAllocations[0]?.name || readRow.category || "Token Unlock",
        },
      },
      rating: readRow.rating,
      fomoScore: readRow.fomoScore,
      publicVestingPercent: nextUnlockPercent,
      nextUnlockPercent,
      nextUnlockValueUsd,
      nextUnlockTokensAmount,
      totalTokensUnlockedAmount: progress.unlockedAmount,
      totalTokensLockedAmount: progress.lockedAmount,
      totalTokensUntrackedPercent: this.firstNumber(summary?.untrackedPercent, 0),
      totalTokensUntrackedAmount: this.firstNumber(summary?.untrackedAmount, 0),
      lastTokenUnlockDate:
        this.isoString(summary?.lastUnlockDate) ||
        pastEvents[pastEvents.length - 1]?.unlockDate,
      nextTokenUnlockDate: nextUnlockEvent?.unlockDate,
      allocations: compactAllocations,
      vesting: rounds.map((round) => ({
        id: this.idString(round._id),
        tgePercent: this.firstNumber(round.tgeUnlockPercent, 0),
      })),
      chart: this.buildChart(allCanonicalEvents),
      unlockEvents: allCanonicalEvents,
      nextUnlockEvent,
      largestUnlockEvent,
      projectSnapshot: readRow?._id
        ? {
            _id: this.idString(readRow._id),
            canonicalProjectId,
            marketAssetId,
            name,
            slug,
            symbol,
            logo,
            mainCategory: readRow.category,
          }
        : undefined,
    });
  }

  private toCanonicalUnlockEvent(
    event: any,
    context: {
      allocation?: any;
      logo?: string;
      name?: string;
      now: Date;
      priceUsd?: number;
      readRow: any;
      slug?: string;
      symbol?: string;
    }
  ): any {
    const unlockDate = this.toDate(event?.unlockDate);
    const timestamp = unlockDate?.getTime() || 0;
    const amount = this.firstNumber(event?.amount, 0);
    const valueUsd =
      amount && context.priceUsd
        ? amount * context.priceUsd
        : this.firstNumber(event?.sourceValueUsd, 0);

    return this.cleanObject({
      id: this.idString(event?._id),
      actionId: this.idString(event?._id),
      userActionSourceId: this.idString(event?._id),
      source: event?.sourceType,
      sourceId: event?.sourceEventId,
      sourceKey: this.firstString(event?.canonicalFingerprint, event?.unlockKey, this.idString(event?._id)),
      sourceUrl: event?.sourceRefs?.[0]?.sourceUrl,
      detailUrl: event?.sourceRefs?.[0]?.sourceUrl,
      coinSlug: context.slug,
      projectKey: context.slug,
      name: context.name,
      symbol: context.symbol,
      logo: context.logo,
      icon: context.logo,
      image: context.logo,
      unlockDate: unlockDate?.toISOString(),
      date: unlockDate?.toISOString(),
      daysUntilUnlock: unlockDate
        ? Math.ceil((unlockDate.getTime() - context.now.getTime()) / (24 * 60 * 60 * 1000))
        : undefined,
      isUpcoming: unlockDate ? unlockDate.getTime() >= context.now.getTime() : false,
      isPast: unlockDate ? unlockDate.getTime() < context.now.getTime() : false,
      allocation: this.firstString(event?.roundName, context.allocation?.name, event?.stage, "Token Unlock"),
      roundName: this.firstString(event?.roundName, context.allocation?.name, event?.stage),
      unlockType: event?.unlockType,
      cliffEnd: event?.unlockType === "CLIFF",
      tokenAmount: amount,
      tokensAmount: amount,
      unlockValueUsd: this.roundNumber(valueUsd || 0, 6),
      valueUsd: this.roundNumber(valueUsd || 0, 6),
      percentOfSupply: this.firstNumber(event?.percentOfSupply, 0),
      tokensPercent: this.firstNumber(event?.percentOfSupply, 0),
      priceUsd: context.priceUsd,
      marketCapUsd: this.firstNumber(context.readRow?.marketCap, context.readRow?.usdQuote?.market_cap),
      marketCap: this.firstNumber(context.readRow?.marketCap, context.readRow?.usdQuote?.market_cap),
      circulatingSupply: this.firstNumber(context.readRow?.circulatingSupply),
      totalSupply: this.firstNumber(context.readRow?.totalSupply),
      maxSupply: this.firstNumber(context.readRow?.maxSupply),
      fullyDilutedMarketCapUsd: this.firstNumber(context.readRow?.fullyDilutedMarketCap),
      updatedAt: event?.updatedAt,
    });
  }

  private buildProgress(summary: any, rounds: any[]): Record<string, number> {
    const summaryTotal = this.firstPositiveNumber(summary?.totalAmount);
    if (summaryTotal !== undefined) {
      const unlockedAmount = this.firstNumber(
        summary?.unlockedAmount,
        this.amountFromPercent(summaryTotal, summary?.unlockedPercent),
        0
      );
      const lockedAmount = this.firstNumber(
        summary?.lockedAmount,
        Math.max(0, summaryTotal - Number(unlockedAmount || 0)),
        0
      );
      return {
        unlockedAmount,
        lockedAmount,
        unlockedPercent: this.normalizePercent(
          this.firstNumber(summary?.unlockedPercent, this.percentFromAmount(unlockedAmount, summaryTotal), 0)
        ),
        lockedPercent: this.normalizePercent(
          this.firstNumber(summary?.lockedPercent, this.percentFromAmount(lockedAmount, summaryTotal), 0)
        ),
      };
    }

    const totals = (rounds || [])
      .map((round) => {
        const totalAmount = this.firstPositiveNumber(round?.totalAmount);
        if (totalAmount === undefined) return undefined;
        const unlockedAmount = this.firstNumber(
          round?.unlockedAmountSource,
          this.amountFromPercent(totalAmount, round?.unlockedPercentSource),
          0
        );
        return {
          totalAmount,
          unlockedAmount: Number(unlockedAmount || 0),
        };
      })
      .filter(Boolean) as Array<{ totalAmount: number; unlockedAmount: number }>;
    const totalAmount = totals.reduce((sum, item) => sum + item.totalAmount, 0);
    const unlockedAmount = totals.reduce((sum, item) => sum + item.unlockedAmount, 0);
    const lockedAmount = Math.max(0, totalAmount - unlockedAmount);

    return {
      unlockedAmount: this.roundNumber(unlockedAmount, 6),
      lockedAmount: this.roundNumber(lockedAmount, 6),
      unlockedPercent: totalAmount ? this.roundNumber((unlockedAmount / totalAmount) * 100, 6) : 0,
      lockedPercent: totalAmount ? this.roundNumber((lockedAmount / totalAmount) * 100, 6) : 0,
    };
  }

  private compactAllocations(allocations: any[], events: any[]): any[] {
    return (allocations || [])
      .map((allocation) => {
        const allocationEvents = events.filter((event) => {
          const label = this.normalizeLabel(event?.allocation);
          return label && label === this.normalizeLabel(allocation?.name);
        });
        const next = allocationEvents.find((event) => event.isUpcoming);
        return {
          id: this.idString(allocation?._id),
          name: allocation?.name,
          tokensAllocatedAmount: allocation?.amount,
          tokensAllocatedPercent: allocation?.allocationPercent,
          tokenUnlockProgress: {
            nextTokenUnlockDate: next?.unlockDate,
            nextUnlockPercent: next?.tokensPercent,
            nextUnlockTokensAmount: next?.tokensAmount,
          },
          tgeDate: allocationEvents[0]?.unlockDate,
          vesting: allocationEvents.map((event) => ({
            source: event.source,
            sourceKey: event.sourceKey,
            sourceUrl: event.sourceUrl,
            detailUrl: event.detailUrl,
            date: event.unlockDate,
            amount: event.tokensAmount,
            percent: event.tokensPercent,
            valueUsd: event.unlockValueUsd,
            unlockType: event.unlockType,
            cliffEnd: event.cliffEnd,
          })),
        };
      })
      .filter((allocation) => allocation.name);
  }

  private buildChart(events: any[]): any[] {
    const byDate = new Map<string, any[]>();
    for (const event of events) {
      const date = this.toDate(event?.unlockDate);
      if (!date) continue;
      const key = date.toISOString().slice(0, 10);
      byDate.set(key, [...(byDate.get(key) || []), event]);
    }

    let cumulativeUnlockedPercent = 0;
    return Array.from(byDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, dateEvents]) => {
        const unlockedPercentInPeriod = this.roundNumber(
          dateEvents.reduce((sum, event) => sum + Number(event.tokensPercent || 0), 0),
          6
        );
        cumulativeUnlockedPercent = this.roundNumber(
          cumulativeUnlockedPercent + unlockedPercentInPeriod,
          6
        );
        return {
          date,
          unlockedPercentInPeriod,
          cumulativeUnlockedPercent,
          roundSnapshots: dateEvents.map((event) => ({
            name: event.allocation,
            source: event.source,
            sourceKey: event.sourceKey,
            unlockedPercent: event.tokensPercent,
            unlockedTokens: event.tokensAmount,
            unlockedValueUsd: event.unlockValueUsd,
            unlockType: event.unlockType,
            cliffEnd: event.cliffEnd,
          })),
        };
      });
  }

  private applyRowFilters(rows: any[], query: FomoV2UnlockFeedQuery): any[] {
    const search = this.normalizeLabel(query.search);
    const category = this.normalizeLabel(query.category);
    const minValueUsd = Number(query.minValueUsd);

    return rows.filter((row) => {
      if (search && !this.rowMatchesSearch(row, search)) return false;
      if (category && !this.rowMatchesCategory(row, category)) return false;
      if (
        Number.isFinite(minValueUsd) &&
        minValueUsd > 0 &&
        Number(row?.nextUnlockValueUsd || 0) < minValueUsd
      ) {
        return false;
      }
      return true;
    });
  }

  private rowMatchesSearch(row: any, search: string): boolean {
    const needle = search.toLowerCase();
    const haystack = [
      row?.coinSlug,
      row?.coinSymbol,
      row?.projectName,
      row?.detailed?.name,
      row?.detailed?.symbol,
      row?.detailed?.mainCategory?.name,
      ...(row?.unlockEvents || []).flatMap((event: any) => [
        event?.allocation,
        event?.roundName,
        event?.name,
        event?.symbol,
      ]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  }

  private rowMatchesCategory(row: any, category: string): boolean {
    const target = this.normalizeLabel(category);
    return [
      row?.detailed?.mainCategory?.name,
      ...(row?.allocations || []).map((item: any) => item?.name),
      ...(row?.unlockEvents || []).flatMap((event: any) => [
        event?.allocation,
        event?.roundName,
      ]),
    ].some((value) => this.normalizeLabel(value) === target);
  }

  private sortRows(rows: any[], query: FomoV2UnlockFeedQuery): any[] {
    const sortBy = this.allowedSortField(query.sortBy);
    const direction = query.sortOrder === "desc" ? -1 : 1;

    return [...rows].sort((left, right) => {
      const leftValue = this.sortValue(left, sortBy);
      const rightValue = this.sortValue(right, sortBy);
      const leftMissing = leftValue === undefined || leftValue === null || leftValue === "";
      const rightMissing = rightValue === undefined || rightValue === null || rightValue === "";

      if (leftMissing && rightMissing) return this.stringCompare(left.coinSlug, right.coinSlug);
      if (leftMissing) return 1;
      if (rightMissing) return -1;
      if (leftValue < rightValue) return -1 * direction;
      if (leftValue > rightValue) return 1 * direction;
      return this.stringCompare(left.coinSlug, right.coinSlug);
    });
  }

  private sortValue(row: any, field: string): any {
    if (field === "nextTokenUnlockDate" || field === "lastTokenUnlockDate") {
      return this.dateTime(row?.[field]);
    }
    return row?.[field];
  }

  private allowedSortField(sortBy?: string): string {
    const allowed: Record<string, string> = {
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

    return allowed[sortBy || ""] || "nextTokenUnlockDate";
  }

  private buildEventIdsFilter(ids: string[]): Record<string, any> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const filters: Record<string, any>[] = [
      { canonicalFingerprint: { $in: ids } },
      { unlockKey: { $in: ids } },
      { sourceEventId: { $in: ids } },
    ];
    if (objectIds.length) filters.unshift({ _id: { $in: objectIds } });

    return { $or: filters };
  }

  private eventMatchesId(event: any, id: string): boolean {
    return [
      this.idString(event?._id),
      this.nonEmptyString(event?.canonicalFingerprint),
      this.nonEmptyString(event?.unlockKey),
      this.nonEmptyString(event?.sourceEventId),
    ].includes(id);
  }

  private groupKey(event: any): string | undefined {
    return (
      this.idString(event?.marketAssetId) ||
      this.idString(event?.canonicalProjectId)
    );
  }

  private groupById(items: any[], field: string): Map<string, any[]> {
    const map = new Map<string, any[]>();
    for (const item of items || []) {
      const id = this.idString(item?.[field]);
      if (!id) continue;
      map.set(id, [...(map.get(id) || []), item]);
    }
    return map;
  }

  private pickSummary(summaries: any[], sourceType?: string): any {
    return (
      summaries.find((summary) => summary?.sourceType === sourceType) ||
      summaries[0] ||
      undefined
    );
  }

  private pushCategoryLabel(labels: Set<string>, value: any): void {
    const label = this.nonEmptyString(value);
    if (!label) return;
    if (CATEGORY_DENY_LIST.has(label.toLowerCase())) return;
    labels.add(label);
  }

  private firstCategory(events: any[]): string | undefined {
    return (events || [])
      .map((event) => this.nonEmptyString(event?.allocation || event?.roundName))
      .find((label) => label && !CATEGORY_DENY_LIST.has(label.toLowerCase()));
  }

  private statusValue(value?: any): string {
    const status = String(value || "upcoming").trim().toLowerCase();
    return ["upcoming", "past", "all"].includes(status) ? status : "upcoming";
  }

  private includesSmallUnlocks(value?: string | boolean): boolean {
    if (value === undefined || value === null || value === "") return true;
    return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    return Array.from(
      new Set(values.map((value) => this.idString(value)).filter(Boolean))
    ).map((value) => new Types.ObjectId(value));
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => this.nonEmptyString(value)).filter(Boolean))
    );
  }

  private idString(value: any): string {
    if (!value) return "";
    return typeof value?.toString === "function" ? value.toString() : String(value);
  }

  private firstString(...values: any[]): string | undefined {
    return values.map((value) => this.nonEmptyString(value)).find(Boolean);
  }

  private nonEmptyString(value: any): string {
    if (value === undefined || value === null) return "";
    return String(value).trim();
  }

  private normalizeLabel(value: any): string {
    return this.nonEmptyString(value).toLowerCase();
  }

  private firstNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  }

  private firstPositiveNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return undefined;
  }

  private amountFromPercent(totalAmount: number, percent: any): number | undefined {
    const parsed = Number(percent);
    if (!Number.isFinite(parsed)) return undefined;
    return (totalAmount * parsed) / 100;
  }

  private percentFromAmount(amount: any, totalAmount: number): number | undefined {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || !totalAmount) return undefined;
    return (parsed / totalAmount) * 100;
  }

  private normalizePercent(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(Math.max(this.roundNumber(parsed, 6), 0), 100);
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private isoString(value: any): string | undefined {
    return this.toDate(value)?.toISOString();
  }

  private dateTime(value: any): number {
    return this.toDate(value)?.getTime() ?? Number.NaN;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.trunc(parsed);
  }

  private roundNumber(value: number, precision = 6): number {
    if (!Number.isFinite(value)) return value;
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }

  private slugify(value: string): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private stringCompare(left: any, right: any): number {
    return this.nonEmptyString(left).localeCompare(this.nonEmptyString(right));
  }

  private hashToNegativeNumber(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return hash || -1;
  }

  private cleanObject<T extends Record<string, any>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined)
    ) as T;
  }
}

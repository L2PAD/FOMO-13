import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import { FomoV2FundingRound } from "../../funding/models";
import {
  FomoV2MarketProjectHistory,
  FomoV2MarketProjectReadModel,
  FomoV2MarketProjectRoiMetric,
  FomoV2ProjectMarketSnapshot,
} from "../models";

export type FomoV2MarketRoiTier = MarketDataTier | "all";
export type FomoV2MarketRoiQuote = "usd" | "btc" | "eth";
export type FomoV2MarketRoiEntryKind =
  | "public_sale"
  | "ico"
  | "ido"
  | "ieo"
  | "launchpad"
  | "token_sale"
  | "auction"
  | "first_market_price_fallback";

export interface FomoV2MarketRoiTarget {
  marketAssetId: any;
  canonicalProjectId?: any;
  coingeckoId?: string;
  symbol?: string;
  tier?: MarketDataTier;
}

export interface FomoV2MarketRoiRecalculateOptions {
  dryRun?: boolean;
}

export interface FomoV2MarketRoiTierRecalculateOptions extends FomoV2MarketRoiRecalculateOptions {
  tier?: FomoV2MarketRoiTier;
  limit?: number;
  offset?: number;
  coingeckoId?: string;
  marketAssetId?: string;
  canonicalProjectId?: string;
}

export interface FomoV2MarketRoiRecalculateResult {
  dryRun: boolean;
  requested: number;
  calculated: number;
  wouldUpsert: number;
  upserted: number;
  skipped: {
    invalidTarget: number;
  };
  missing: {
    latestPoint: number;
    fundingRounds: number;
    entryPrice: number;
  };
  examples: any[];
}

interface ResolvedRoiTarget {
  marketAssetId: Types.ObjectId;
  canonicalProjectId?: Types.ObjectId;
  coingeckoId?: string;
  symbol?: string;
  tier?: MarketDataTier;
}

interface RoiPoint {
  source: "market_project_histories" | "project_market_snapshots";
  timestamp: Date;
  priceUsd: number;
  btcPriceUsd?: number;
  ethPriceUsd?: number;
}

interface EntryClassification {
  kind: FomoV2MarketRoiEntryKind;
  score: number;
}

interface EntryPriceSelection {
  usd: number;
  btc?: number;
  eth?: number;
  kind: FomoV2MarketRoiEntryKind;
  fundingRoundId: string;
  roundName?: string;
  normalizedRoundType?: string;
  sourceType?: string;
  sourceUrl?: string;
  priceDate?: Date;
  confidence?: string;
  selectedByRuleVersion: number;
  selectedByRule: string;
  score: number;
}

const ROI_QUOTES: FomoV2MarketRoiQuote[] = ["usd", "btc", "eth"];
const REFERENCE_COINGECKO_IDS: Record<Exclude<FomoV2MarketRoiQuote, "usd">, string> = {
  btc: "bitcoin",
  eth: "ethereum",
};
const ENTRY_PRICE_RULE_VERSION = 1;
const REFERENCE_PRICE_TOLERANCE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class FomoV2MarketProjectRoiMetricService {
  private readonly logger = new Logger(FomoV2MarketProjectRoiMetricService.name);
  private readonly referenceAssetIdCache = new Map<Exclude<FomoV2MarketRoiQuote, "usd">, Promise<Types.ObjectId | undefined>>();
  private readonly referencePriceCache = new Map<string, Promise<number | null>>();

  constructor(
    @InjectModel(FomoV2MarketProjectRoiMetric.name)
    private readonly roiMetricModel: Model<FomoV2MarketProjectRoiMetric>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2MarketProjectHistory.name)
    private readonly historyModel: Model<FomoV2MarketProjectHistory>,
    @InjectModel(FomoV2ProjectMarketSnapshot.name)
    private readonly snapshotModel: Model<FomoV2ProjectMarketSnapshot>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
  ) {}

  async recalculateByTier(
    options: FomoV2MarketRoiTierRecalculateOptions = {},
  ): Promise<FomoV2MarketRoiRecalculateResult> {
    const limit = this.positiveInteger(options.limit, 100);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const tier = options.tier || "HOT";
    const query: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
      status: "active",
      marketAssetId: { $exists: true },
    };

    if (tier !== "all") query.tier = tier;
    if (options.coingeckoId) query["providerIds.coingeckoId"] = this.normalizeCoinGeckoId(options.coingeckoId);
    if (options.marketAssetId) query.marketAssetId = this.parseObjectId(options.marketAssetId, "marketAssetId");
    if (options.canonicalProjectId) query.canonicalProjectId = this.parseObjectId(options.canonicalProjectId, "canonicalProjectId");

    const rows = await this.readModel
      .find(query)
      .sort({ rank: 1, _id: 1 })
      .skip(offset)
      .limit(limit)
      .select("canonicalProjectId marketAssetId providerIds symbol tier")
      .lean();
    const targets = (rows as any[]).map((row) => ({
      canonicalProjectId: row.canonicalProjectId,
      marketAssetId: row.marketAssetId,
      coingeckoId: row.providerIds?.coingeckoId,
      symbol: row.symbol,
      tier: row.tier,
    }));

    return this.recalculateForMarketAssets(targets, options);
  }

  async recalculateForMarketAssets(
    targets: FomoV2MarketRoiTarget[],
    options: FomoV2MarketRoiRecalculateOptions = {},
  ): Promise<FomoV2MarketRoiRecalculateResult> {
    const dryRun = options.dryRun === true;
    const result: FomoV2MarketRoiRecalculateResult = {
      dryRun,
      requested: targets.length,
      calculated: 0,
      wouldUpsert: 0,
      upserted: 0,
      skipped: {
        invalidTarget: 0,
      },
      missing: {
        latestPoint: 0,
        fundingRounds: 0,
        entryPrice: 0,
      },
      examples: [],
    };
    const operations: any[] = [];

    for (const target of this.dedupeTargets(targets)) {
      const resolvedTarget = await this.resolveTarget(target);
      if (!resolvedTarget) {
        result.skipped.invalidTarget += 1;
        continue;
      }

      const now = new Date();
      const [latest, fundingRounds] = await Promise.all([
        this.loadLatestPoint(resolvedTarget.marketAssetId),
        this.loadFundingRounds(resolvedTarget),
      ]);
      const entryPrice = await this.selectEntryPrice(fundingRounds);
      const totalRaised = this.calculateTotalRaised(fundingRounds, now);
      const currentPrice = latest ? await this.buildCurrentPrice(resolvedTarget, latest) : {};
      const roiMultiplier = entryPrice
        ? this.calculateRoiMultipliers(entryPrice, currentPrice)
        : {};
      const missing = this.buildMissing({
        latest,
        fundingRounds,
        entryPrice,
        currentPrice,
        roiMultiplier,
      });

      if (!latest) result.missing.latestPoint += 1;
      if (!fundingRounds.length) result.missing.fundingRounds += 1;
      if (!entryPrice) result.missing.entryPrice += 1;

      const set = this.cleanObject({
        canonicalProjectId: resolvedTarget.canonicalProjectId,
        marketAssetId: resolvedTarget.marketAssetId,
        coingeckoId: resolvedTarget.coingeckoId,
        symbol: resolvedTarget.symbol,
        tier: resolvedTarget.tier,
        anchorTimestamp: latest?.timestamp,
        calculatedAt: now,
        source: latest?.source,
        provider: "coingecko",
        version: 1,
        entryPrice: this.serializeEntryPrice(entryPrice),
        currentPrice,
        roiMultiplier,
        totalRaised,
        missing,
        meta: this.cleanObject({
          entryPriceRuleVersion: ENTRY_PRICE_RULE_VERSION,
          fundingRoundsScanned: fundingRounds.length,
          latestPointSource: latest?.source,
          latestPointTimestamp: latest?.timestamp,
        }),
        updatedAt: now,
      });

      result.calculated += 1;
      result.wouldUpsert += 1;
      this.pushExample(
        result.examples,
        this.example(resolvedTarget, {
          entryPrice: set.entryPrice,
          currentPrice: set.currentPrice,
          roiMultiplier: set.roiMultiplier,
          totalRaised: set.totalRaised,
          missing: set.missing,
        }),
      );
      operations.push({
        updateOne: {
          filter: { marketAssetId: resolvedTarget.marketAssetId },
          update: {
            $set: set,
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      });
    }

    if (!dryRun && operations.length) {
      result.upserted = await this.bulkWrite(operations);
    }

    return result;
  }

  private async selectEntryPrice(rounds: any[]): Promise<EntryPriceSelection | undefined> {
    const candidates = (rounds || [])
      .map((round) => {
        const classification = this.classifyEntryRound(round);
        const usd = this.roundTokenPriceUsd(round);
        if (!classification || usd === undefined || usd <= 0) return undefined;
        return { round, usd, classification };
      })
      .filter((item): item is { round: any; usd: number; classification: EntryClassification } => Boolean(item));

    if (!candidates.length) return undefined;

    const selected = candidates.sort((left, right) => {
      const scoreDiff = right.classification.score - left.classification.score;
      if (scoreDiff !== 0) return scoreDiff;

      const leftDate = this.roundDate(left.round)?.getTime() || Number.MAX_SAFE_INTEGER;
      const rightDate = this.roundDate(right.round)?.getTime() || Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    })[0];
    const round = selected.round;
    const priceDate = this.roundDate(round);
    const explicitBtc = this.firstPositiveNumber(
      round?.tokenPriceBTC,
      round?.tokenPriceBtc,
      round?.metadata?.tokenPriceBTC,
      round?.metadata?.tokenPriceBtc,
      round?.metadata?.icoPrice?.BTC,
    );
    const explicitEth = this.firstPositiveNumber(
      round?.tokenPriceETH,
      round?.tokenPriceEth,
      round?.metadata?.tokenPriceETH,
      round?.metadata?.tokenPriceEth,
      round?.metadata?.icoPrice?.ETH,
    );

    const [btcReferenceUsd, ethReferenceUsd] = priceDate
      ? await Promise.all([
          this.loadReferencePriceUsd("btc", priceDate),
          this.loadReferencePriceUsd("eth", priceDate),
        ])
      : [null, null];

    return this.cleanObject({
      usd: selected.usd,
      btc: explicitBtc || (btcReferenceUsd && btcReferenceUsd > 0 ? this.roundPrice(selected.usd / btcReferenceUsd) : undefined),
      eth: explicitEth || (ethReferenceUsd && ethReferenceUsd > 0 ? this.roundPrice(selected.usd / ethReferenceUsd) : undefined),
      kind: selected.classification.kind,
      fundingRoundId: this.toIdString(round?._id),
      roundName: this.firstString(round?.roundName, round?.normalizedRoundName),
      normalizedRoundType: this.firstString(round?.normalizedRoundType, round?.roundType),
      sourceType: this.firstString(round?.primarySource, round?.sourceType, round?.sourceFeed),
      sourceUrl: this.firstString(round?.sourceUrl),
      priceDate,
      confidence: this.firstString(round?.confidence, this.confidenceForScore(selected.classification.score)),
      selectedByRuleVersion: ENTRY_PRICE_RULE_VERSION,
      selectedByRule: "public_sale_token_price",
      score: selected.classification.score,
    }) as EntryPriceSelection;
  }

  private classifyEntryRound(round: any): EntryClassification | undefined {
    const haystack = [
      round?.roundName,
      round?.normalizedRoundName,
      round?.roundType,
      round?.normalizedRoundType,
      round?.platform?.name,
      round?.sourceUrl,
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    if (/\b(public[_\s-]?sale|public sale|public)\b/.test(haystack)) {
      return { kind: "public_sale", score: 140 };
    }
    if (/\bico\b/.test(haystack)) return { kind: "ico", score: 135 };
    if (/\bcoinlist\b/.test(haystack) && /\bauction\b/.test(haystack)) {
      return { kind: "auction", score: 132 };
    }
    if (/\bcoinlist\b/.test(haystack)) return { kind: "public_sale", score: 128 };
    if (/\bido\b/.test(haystack)) return { kind: "ido", score: 126 };
    if (/\bieo\b/.test(haystack)) return { kind: "ieo", score: 126 };
    if (/\blaunchpad\b/.test(haystack)) return { kind: "launchpad", score: 122 };
    if (/\bauction\b/.test(haystack)) return { kind: "auction", score: 120 };
    if (/\b(token[_\s-]?sale|crowd[_\s-]?sale|crowdsale)\b/.test(haystack)) {
      return { kind: "token_sale", score: 115 };
    }
    if (/\btge[_\s-]?distribution\b/.test(haystack)) {
      return { kind: "token_sale", score: 105 };
    }

    return undefined;
  }

  private calculateTotalRaised(rounds: any[], calculatedAt: Date): any {
    const roundIds: string[] = [];
    const skippedNonUsdRoundIds: string[] = [];
    const usd = (rounds || []).reduce((sum, round) => {
      const amount = this.toFiniteNumber(round?.raisedAmount);
      if (amount === undefined || amount <= 0) return sum;

      const currency = this.firstString(round?.raisedCurrency, "USD")?.toUpperCase();
      if (currency && currency !== "USD") {
        const roundId = this.toIdString(round?._id);
        if (roundId) skippedNonUsdRoundIds.push(roundId);
        return sum;
      }

      const roundId = this.toIdString(round?._id);
      if (roundId) roundIds.push(roundId);
      return sum + amount;
    }, 0);

    return this.cleanObject({
      usd: usd > 0 ? this.roundMoney(usd) : undefined,
      roundIds,
      skippedNonUsdRoundIds: skippedNonUsdRoundIds.length ? skippedNonUsdRoundIds : undefined,
      calculatedAt,
      source: "funding_rounds",
    });
  }

  private async buildCurrentPrice(target: ResolvedRoiTarget, latest: RoiPoint): Promise<Record<string, any>> {
    const currentPrice: Record<string, any> = {
      usd: latest.priceUsd,
    };

    for (const quote of ROI_QUOTES) {
      if (quote === "usd") continue;
      const quotePrice = await this.quotePrice(target, latest, quote);
      if (quotePrice !== null) currentPrice[quote] = quotePrice;
    }

    return this.cleanObject({
      ...currentPrice,
      timestamp: latest.timestamp,
      source: latest.source,
    });
  }

  private calculateRoiMultipliers(
    entryPrice: EntryPriceSelection,
    currentPrice: Record<string, any>,
  ): Record<string, any> {
    const roi: Record<string, any> = {};
    for (const quote of ROI_QUOTES) {
      const entry = this.toFinitePositiveNumber((entryPrice as any)[quote]);
      const current = this.toFinitePositiveNumber(currentPrice?.[quote]);
      if (entry === null || current === null) continue;
      roi[quote] = this.roundMultiplier(current / entry);
    }
    return roi;
  }

  private buildMissing(input: {
    latest: RoiPoint | null;
    fundingRounds: any[];
    entryPrice?: EntryPriceSelection;
    currentPrice: Record<string, any>;
    roiMultiplier: Record<string, any>;
  }): Record<string, any> {
    const missing: Record<string, any> = {};
    if (!input.latest) missing.latestPoint = "missing_latest_market_history_point";
    if (!input.fundingRounds.length) missing.fundingRounds = "missing_funding_rounds";
    if (!input.entryPrice) missing.entryPrice = "missing_public_sale_token_price";

    if (input.entryPrice) {
      for (const quote of ROI_QUOTES) {
        if (this.toFinitePositiveNumber((input.entryPrice as any)[quote]) === null) {
          missing[`entryPrice.${quote}`] = `missing_${quote}_entry_price`;
        }
        if (this.toFinitePositiveNumber(input.currentPrice?.[quote]) === null) {
          missing[`currentPrice.${quote}`] = `missing_${quote}_current_price`;
        }
        if (this.toFinitePositiveNumber(input.roiMultiplier?.[quote]) === null) {
          missing[`roiMultiplier.${quote}`] = `missing_${quote}_roi_multiplier`;
        }
      }
    }

    return missing;
  }

  private serializeEntryPrice(entryPrice?: EntryPriceSelection): Record<string, any> {
    if (!entryPrice) return {};
    return this.cleanObject({
      usd: entryPrice.usd,
      btc: entryPrice.btc,
      eth: entryPrice.eth,
      kind: entryPrice.kind,
      fundingRoundId: entryPrice.fundingRoundId,
      roundName: entryPrice.roundName,
      normalizedRoundType: entryPrice.normalizedRoundType,
      sourceType: entryPrice.sourceType,
      sourceUrl: entryPrice.sourceUrl,
      priceDate: entryPrice.priceDate,
      confidence: entryPrice.confidence,
      lockedAt: entryPrice.priceDate,
      selectedByRuleVersion: entryPrice.selectedByRuleVersion,
      selectedByRule: entryPrice.selectedByRule,
      score: entryPrice.score,
    });
  }

  private async quotePrice(
    target: ResolvedRoiTarget,
    point: RoiPoint,
    quote: Exclude<FomoV2MarketRoiQuote, "usd">,
  ): Promise<number | null> {
    const referenceCoinGeckoId = REFERENCE_COINGECKO_IDS[quote];
    if (target.coingeckoId === referenceCoinGeckoId) return 1;

    const directReference = quote === "btc" ? point.btcPriceUsd : point.ethPriceUsd;
    const referenceUsd = this.toFinitePositiveNumber(directReference) || await this.loadReferencePriceUsd(quote, point.timestamp);
    if (!referenceUsd || referenceUsd <= 0) return null;

    return this.roundPrice(point.priceUsd / referenceUsd);
  }

  private async loadFundingRounds(target: ResolvedRoiTarget): Promise<any[]> {
    const clauses: any[] = [];
    if (target.canonicalProjectId) clauses.push({ canonicalProjectId: target.canonicalProjectId });
    if (target.marketAssetId) clauses.push({ marketAssetId: target.marketAssetId });
    if (!clauses.length) return [];

    return this.fundingRoundModel
      .find({
        $and: [
          { $or: clauses },
          {
            status: {
              $nin: ["cancelled", "conflict", "deprecated", "superseded"],
            },
          },
        ],
      })
      .sort({ announcedDate: 1, date: 1, _id: 1 })
      .lean();
  }

  private async loadLatestPoint(marketAssetId: Types.ObjectId): Promise<RoiPoint | null> {
    const [history, snapshot] = await Promise.all([
      this.historyModel
        .findOne({
          marketAssetId,
          source: "coingecko",
          price: { $gt: 0 },
          bucketTimestamp: { $type: "date" },
        })
        .sort({ bucketTimestamp: -1 })
        .lean(),
      this.snapshotModel
        .findOne({
          marketAssetId,
          provider: "coingecko",
          priceUsd: { $gt: 0 },
        })
        .sort({ timestamp: -1 })
        .lean(),
    ]);
    return this.pickLatestPoint([
      this.historyToPoint(history),
      this.snapshotToPoint(snapshot),
    ]);
  }

  private async loadReferencePriceUsd(
    quote: Exclude<FomoV2MarketRoiQuote, "usd">,
    timestamp: Date,
  ): Promise<number | null> {
    const cacheKey = `${quote}:${Math.floor(timestamp.getTime() / 60_000)}`;
    if (!this.referencePriceCache.has(cacheKey)) {
      this.referencePriceCache.set(cacheKey, this.loadReferencePriceUsdUncached(quote, timestamp));
    }
    return this.referencePriceCache.get(cacheKey)!;
  }

  private async loadReferencePriceUsdUncached(
    quote: Exclude<FomoV2MarketRoiQuote, "usd">,
    timestamp: Date,
  ): Promise<number | null> {
    const marketAssetId = await this.loadReferenceMarketAssetId(quote);
    if (!marketAssetId) return null;

    const point = await this.loadNearestPoint(marketAssetId, timestamp, REFERENCE_PRICE_TOLERANCE_MS);
    return point?.priceUsd ?? null;
  }

  private async loadReferenceMarketAssetId(
    quote: Exclude<FomoV2MarketRoiQuote, "usd">,
  ): Promise<Types.ObjectId | undefined> {
    if (!this.referenceAssetIdCache.has(quote)) {
      const coingeckoId = REFERENCE_COINGECKO_IDS[quote];
      this.referenceAssetIdCache.set(
        quote,
        this.readModel
          .findOne({
            "providerIds.coingeckoId": coingeckoId,
            trading: "CURRENTLY_TRADING",
            status: "active",
          })
          .select("marketAssetId")
          .lean()
          .then((row: any) => this.toObjectId(row?.marketAssetId)),
      );
    }
    return this.referenceAssetIdCache.get(quote)!;
  }

  private async loadNearestPoint(
    marketAssetId: Types.ObjectId,
    timestamp: Date,
    toleranceMs: number,
  ): Promise<RoiPoint | null> {
    const [historyBefore, historyAfter, snapshotBefore, snapshotAfter] = await Promise.all([
      this.historyModel
        .findOne({
          marketAssetId,
          source: "coingecko",
          price: { $gt: 0 },
          bucketTimestamp: { $lte: timestamp },
        })
        .sort({ bucketTimestamp: -1 })
        .lean(),
      this.historyModel
        .findOne({
          marketAssetId,
          source: "coingecko",
          price: { $gt: 0 },
          bucketTimestamp: { $gte: timestamp },
        })
        .sort({ bucketTimestamp: 1 })
        .lean(),
      this.snapshotModel
        .findOne({
          marketAssetId,
          provider: "coingecko",
          priceUsd: { $gt: 0 },
          timestamp: { $lte: timestamp },
        })
        .sort({ timestamp: -1 })
        .lean(),
      this.snapshotModel
        .findOne({
          marketAssetId,
          provider: "coingecko",
          priceUsd: { $gt: 0 },
          timestamp: { $gte: timestamp },
        })
        .sort({ timestamp: 1 })
        .lean(),
    ]);
    const candidates = [
      this.historyToPoint(historyBefore),
      this.historyToPoint(historyAfter),
      this.snapshotToPoint(snapshotBefore),
      this.snapshotToPoint(snapshotAfter),
    ].filter((point): point is RoiPoint => Boolean(point));
    if (!candidates.length) return null;

    const point = candidates.sort((left, right) => {
      const leftDelta = Math.abs(left.timestamp.getTime() - timestamp.getTime());
      const rightDelta = Math.abs(right.timestamp.getTime() - timestamp.getTime());
      return leftDelta - rightDelta;
    })[0];
    const deltaMs = Math.abs(point.timestamp.getTime() - timestamp.getTime());
    return deltaMs <= toleranceMs ? point : null;
  }

  private historyToPoint(row: any): RoiPoint | null {
    const timestamp = this.toDate(row?.bucketTimestamp || row?.timestamp);
    const priceUsd = this.toFinitePositiveNumber(row?.price);
    if (!timestamp || priceUsd === null) return null;

    return this.cleanObject({
      source: "market_project_histories" as const,
      timestamp,
      priceUsd,
      btcPriceUsd: this.toFinitePositiveNumber(row?.btcPriceUsd) ?? undefined,
      ethPriceUsd: this.toFinitePositiveNumber(row?.ethPriceUsd) ?? undefined,
    }) as RoiPoint;
  }

  private snapshotToPoint(row: any): RoiPoint | null {
    const timestamp = this.toDate(row?.timestamp);
    const priceUsd = this.toFinitePositiveNumber(row?.priceUsd);
    if (!timestamp || priceUsd === null) return null;

    return this.cleanObject({
      source: "project_market_snapshots" as const,
      timestamp,
      priceUsd,
      btcPriceUsd: this.toFinitePositiveNumber(row?.btcPriceUsd) ?? undefined,
      ethPriceUsd: this.toFinitePositiveNumber(row?.ethPriceUsd) ?? undefined,
    }) as RoiPoint;
  }

  private pickLatestPoint(points: Array<RoiPoint | null>): RoiPoint | null {
    const validPoints = points.filter((point): point is RoiPoint => Boolean(point));
    if (!validPoints.length) return null;
    return validPoints.sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())[0];
  }

  private async resolveTarget(target: FomoV2MarketRoiTarget): Promise<ResolvedRoiTarget | null> {
    const marketAssetId = this.toObjectId(target.marketAssetId);
    if (!marketAssetId) return null;

    if (target.coingeckoId && target.symbol && target.tier) {
      return {
        marketAssetId,
        canonicalProjectId: this.toObjectId(target.canonicalProjectId),
        coingeckoId: this.normalizeCoinGeckoId(target.coingeckoId),
        symbol: target.symbol,
        tier: target.tier,
      };
    }

    const row = await this.readModel
      .findOne({ marketAssetId })
      .select("canonicalProjectId marketAssetId providerIds symbol tier")
      .lean();

    return {
      marketAssetId,
      canonicalProjectId: this.toObjectId(target.canonicalProjectId) || this.toObjectId(row?.canonicalProjectId),
      coingeckoId: this.normalizeCoinGeckoId(target.coingeckoId || row?.providerIds?.coingeckoId),
      symbol: target.symbol || row?.symbol,
      tier: target.tier || row?.tier,
    };
  }

  private async bulkWrite(operations: any[]): Promise<number> {
    let changed = 0;
    for (const chunk of this.chunk(operations, 500)) {
      const result = await this.roiMetricModel.bulkWrite(chunk, { ordered: false });
      changed += Number((result as any).modifiedCount || 0) + Number((result as any).upsertedCount || 0);
    }
    return changed;
  }

  private roundTokenPriceUsd(round: any): number | undefined {
    return this.firstPositiveNumber(
      round?.tokenPrice,
      round?.tokenPriceUsd,
      round?.metadata?.tokenPriceUsd,
      round?.metadata?.tokenPrice,
      round?.metadata?.icoPrice?.USD,
    );
  }

  private roundDate(round: any): Date | undefined {
    return this.toDate(round?.announcedDate) || this.toDate(round?.date);
  }

  private confidenceForScore(score: number): string {
    if (score >= 125) return "high";
    if (score >= 110) return "medium";
    return "low";
  }

  private dedupeTargets(targets: FomoV2MarketRoiTarget[]): FomoV2MarketRoiTarget[] {
    const byAsset = new Map<string, FomoV2MarketRoiTarget>();
    for (const target of targets || []) {
      const key = this.toIdString(target.marketAssetId);
      if (!key) continue;
      byAsset.set(key, target);
    }
    return Array.from(byAsset.values());
  }

  private example(target: ResolvedRoiTarget, extra: Record<string, any>): any {
    return this.cleanObject({
      marketAssetId: this.toIdString(target.marketAssetId),
      canonicalProjectId: this.toIdString(target.canonicalProjectId),
      coingeckoId: target.coingeckoId,
      symbol: target.symbol,
      tier: target.tier,
      ...extra,
    });
  }

  private pushExample(target: any[], item: any): void {
    if (target.length < 10) target.push(item);
  }

  private normalizeCoinGeckoId(value: any): string | undefined {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized || undefined;
  }

  private parseObjectId(value: any, fieldName: string): Types.ObjectId {
    const objectId = this.toObjectId(value);
    if (!objectId) throw new Error(`Invalid ${fieldName}: ${value}`);
    return objectId;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    if (value instanceof mongoose.Types.ObjectId) return new Types.ObjectId(value.toHexString());
    const id = String(value?._id || value || "").trim();
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      const text = String(value || "").trim();
      if (text) return text;
    }
    return undefined;
  }

  private firstPositiveNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const numeric = this.toFiniteNumber(value);
      if (numeric !== undefined && numeric > 0) return numeric;
    }
    return undefined;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private toFiniteNumber(value: any): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
  }

  private roundMultiplier(value: number): number {
    return Math.round(value * 10_000) / 10_000;
  }

  private roundPrice(value: number): number {
    return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    if (!items.length) return [];
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(source || {}).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }
}

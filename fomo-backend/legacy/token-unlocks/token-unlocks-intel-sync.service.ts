import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import axios from "axios";
import { Model } from "mongoose";
import { IntelSyncWorkerRunnerService } from "src/intel-sync/intel-sync-worker-runner.service";
import {
  IntelSyncTrigger,
  IntelSyncWorkerLaunchResult,
} from "src/intel-sync/intel-sync.types";
import { CryptoLinkingPublicService } from "src/crypto-linking/services/crypto-linking-public.service";
import {
  TokenUnlock,
  TokenUnlockDocument,
} from "./models/token-unlock.model";

interface IntelUnlockApiItem {
  key?: string;
  source?: string;
  slug?: string;
  coin_slug?: string;
  coinSlug?: string;
  project_slug?: string;
  project_key?: string;
  projectKey?: string;
  symbol?: string;
  coinSymbol?: string;
  name?: string;
  project_name?: string;
  image?: string;
  logo?: string;
  icon?: string;
  image_url?: string;
  cmc_image_url?: string;
  source_url?: string;
  sourceUrl?: string;
  detail_url?: string;
  detailUrl?: string;
  url?: string;
  cryptoId?: number | string;
  coinId?: number | string;
  unlock_date?: string | Date;
  date?: string | Date;
  unlock_usd?: number | string;
  unlock_value_usd?: number | string;
  amount_usd?: number | string;
  usd_value?: number | string;
  value_usd?: number | string;
  tokens_amount?: number | string;
  amount?: number | string;
  unlock_percent?: number | string;
  tokens_percent?: number | string;
  unlock_pct?: number | string;
  allocation?: string;
  allocation_type?: string;
  locked_percent?: number | string;
  unlocked_percent?: number | string;
  circulationSupplyPercent?: number | string;
  market_cap?: number | string;
  fully_diluted_market_cap?: number | string;
  fdv?: number | string;
  circulating_supply?: number | string;
  circulatingSupply?: number | string;
  total_supply?: number | string;
  totalSupply?: number | string;
  max_supply?: number | string;
  maxSupply?: number | string;
  price?: number | string;
  unlock_type?: string;
  type?: string;
  cliff_end?: boolean | string | number;
  updated_at?: string | Date;
  raw?: any;
  [key: string]: any;
}

interface IntelUnlocksApiResponse {
  total?: number;
  offset?: number;
  limit?: number;
  data?: IntelUnlockApiItem[];
  unlocks?: IntelUnlockApiItem[];
  items?: IntelUnlockApiItem[];
  _meta?: Record<string, any>;
}

interface NormalizedIntelUnlockEvent {
  sourceKey: string;
  source: string;
  sourceUrl?: string;
  detailUrl?: string;
  coinSlug: string;
  coinSymbol: string;
  name: string;
  image: string;
  logo: string;
  icon: string;
  coinId?: number;
  projectKey?: string;
  unlockDate: Date;
  unlockValueUsd: number;
  tokensAmount: number;
  tokensPercent: number;
  allocation: string;
  lockedPercent?: number;
  unlockedPercent?: number;
  marketCap?: number;
  fullyDilutedMarketCap?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  priceUsd?: number;
  unlockType?: string;
  cliffEnd?: boolean;
  updatedAt?: Date;
  raw: Record<string, any>;
}

interface AggregatedAllocation {
  id: number;
  name: string;
  events: NormalizedIntelUnlockEvent[];
}

interface TokenUnlocksIntelSyncOptions {
  force?: boolean;
}

@Injectable()
export class TokenUnlocksIntelSyncService implements OnModuleInit {
  private readonly logger = new Logger(TokenUnlocksIntelSyncService.name);
  private readonly batchSize: number;
  private readonly apiPageSize: number;
  private readonly apiTimeoutMs: number;
  private readonly deltaSyncEnabled: boolean;
  private syncInProgress = false;

  constructor(
    @InjectModel(TokenUnlock.name)
    private readonly tokenUnlockModel: Model<TokenUnlockDocument>,
    private readonly configService: ConfigService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
    private readonly cryptoLinkingPublicService: CryptoLinkingPublicService,
  ) {
    this.batchSize = Math.max(
      50,
      Number(this.configService.get("TOKEN_UNLOCKS_INTEL_SYNC_BATCH_SIZE") || 250),
    );
    this.apiPageSize = Math.min(
      500,
      Math.max(
        50,
        Number(this.configService.get("TOKEN_UNLOCKS_INTEL_API_LIMIT") || 200),
      ),
    );
    this.apiTimeoutMs = Math.max(
      1000,
      Number(this.configService.get("TOKEN_UNLOCKS_INTEL_API_TIMEOUT_MS") || 30000),
    );
    this.deltaSyncEnabled =
      String(
        this.configService.get("TOKEN_UNLOCKS_INTEL_DELTA_SYNC_ENABLED") ??
          "true",
      ).toLowerCase() === "true";
  }

  onModuleInit() {
    if (this.isWorkerProcess()) {
      return;
    }

    if (!this.isStartupSyncEnabled()) {
      this.logger.log("Startup sync for intel token unlocks is disabled");
      return;
    }

    setTimeout(() => {
      void this.syncFromIntelUnlocks("startup").catch((error) => {
        this.logBackgroundSyncFailure("startup", error);
      });
    }, 0);
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncFromIntelUnlocksCron(): Promise<void> {
    try {
      await this.syncFromIntelUnlocks("cron");
    } catch (error) {
      this.logBackgroundSyncFailure("cron", error);
    }
  }

  async syncFromIntelUnlocks(
    trigger: IntelSyncTrigger,
    options: TokenUnlocksIntelSyncOptions = {},
  ): Promise<
    | IntelSyncWorkerLaunchResult
    | { trigger: string; skipped: boolean; processed: number; written: number }
  > {
    if (!options.force && !this.isSyncEnabled()) {
      this.logger.log(`Intel token unlock sync skipped for ${trigger}: disabled`);
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    if (!this.isWorkerProcess() && !options.force) {
      return this.intelSyncWorkerRunnerService.runJob(
        "token-unlocks-intel-unlocks",
        trigger,
      );
    }

    return this.executeSyncFromIntelUnlocks(trigger, options);
  }

  async executeSyncFromIntelUnlocks(
    trigger: IntelSyncTrigger,
    options: TokenUnlocksIntelSyncOptions = {},
  ): Promise<{ trigger: string; skipped: boolean; processed: number; written: number }> {
    if (!options.force && !this.isSyncEnabled()) {
      this.logger.log(`Intel token unlock sync skipped for ${trigger}: disabled`);
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    if (this.syncInProgress) {
      this.logger.warn(
        `Intel token unlock sync skipped for ${trigger}: previous sync is still running`,
      );
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    this.syncInProgress = true;

    try {
      const updatedAfter = await this.resolveSourceWatermark();
      this.logger.log(
        `Starting intel token unlock sync (${trigger}) from ${this.getApiUrl()}${
          updatedAfter ? ` updated_after=${updatedAfter.toISOString()}` : " full bootstrap"
        }`,
      );

      const groupedEvents = new Map<string, NormalizedIntelUnlockEvent[]>();
      let offset = 0;
      let total = Number.MAX_SAFE_INTEGER;
      let processed = 0;
      let fetched = 0;
      let maxSourceUpdatedAt: Date | null = null;

      while (offset < total) {
        const page = await this.fetchUnlocksPage(offset, updatedAfter);
        const sourceUnlocks = Array.isArray(page.data)
          ? page.data
          : Array.isArray(page.unlocks)
            ? page.unlocks
            : Array.isArray(page.items)
              ? page.items
              : [];
        total = Number(page.total || sourceUnlocks.length);
        fetched += sourceUnlocks.length;

        if (!sourceUnlocks.length) {
          if (!processed) {
            this.logger.warn(
              `Intel token unlock sync skipped for ${trigger}: API returned no unlocks`,
            );
          }
          break;
        }

        this.logger.log(
          `Intel token unlock sync page loaded (${trigger}): offset=${offset}, received=${sourceUnlocks.length}, total=${total}`,
        );

        for (const sourceUnlock of sourceUnlocks) {
          maxSourceUpdatedAt = this.pickMaxDate(
            maxSourceUpdatedAt,
            this.resolveSourceUpdatedAt(sourceUnlock),
          );
          const normalizedEvent = this.normalizeUnlockEvent(sourceUnlock);
          if (!normalizedEvent) {
            continue;
          }

          const events = groupedEvents.get(normalizedEvent.coinSlug) || [];
          events.push(normalizedEvent);
          groupedEvents.set(normalizedEvent.coinSlug, events);
          processed += 1;
        }

        offset += sourceUnlocks.length;
      }

      const operations: any[] = [];
      let written = 0;

      for (const events of groupedEvents.values()) {
        const document = this.buildTokenUnlockDocument(events);
        if (!document) {
          continue;
        }

        const linkedDocument = await this.cryptoLinkingPublicService.enrichTokenUnlock(document);

        operations.push({
          updateOne: {
            filter: { coinSlug: linkedDocument.coinSlug },
            update: {
              $set: linkedDocument,
            },
            upsert: true,
          },
        });

        if (operations.length >= this.batchSize) {
          written += await this.flushOperations(operations);
          operations.length = 0;
        }
      }

      if (operations.length) {
        written += await this.flushOperations(operations);
      }

      await this.updateSyncState(maxSourceUpdatedAt, {
        trigger,
        fetched,
        processed,
        written,
        delta: Boolean(updatedAfter),
        updatedAfter: updatedAfter?.toISOString() || null,
      });

      this.logger.log(
        `Intel token unlock sync finished (${trigger}), fetched events: ${fetched}, processed events: ${processed}, written tokens: ${written}`,
      );

      return { trigger, skipped: false, processed, written };
    } catch (error) {
      this.logger.error(
        `Intel token unlock sync failed during ${trigger}: ${this.formatErrorMessage(error)}`,
        this.getErrorStack(error),
      );
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async fetchUnlocksPage(
    offset: number,
    updatedAfter?: Date | null,
  ): Promise<IntelUnlocksApiResponse> {
    let attempt = 0;
    let lastError: any;

    while (attempt < 3) {
      try {
        const response = await axios.get<IntelUnlocksApiResponse>(this.getApiUrl(), {
          params: {
            limit: this.apiPageSize,
            offset,
            ...(updatedAfter
              ? {
                  updated_after: updatedAfter.toISOString(),
                  include_related: "true",
                }
              : {}),
          },
          timeout: this.apiTimeoutMs,
        });

        return response.data || {};
      } catch (error) {
        lastError = error;
        attempt += 1;
        this.logger.warn(
          `Failed to fetch intel unlocks page offset=${offset}, attempt=${attempt}: ${this.formatErrorMessage(error)}`,
        );

        if (attempt < 3) {
          await this.sleep(1000 * attempt);
        }
      }
    }

    throw lastError;
  }

  private async resolveSourceWatermark(): Promise<Date | null> {
    if (!this.deltaSyncEnabled) {
      return null;
    }

    const state = await this.syncStateCollection().findOne({
      job: "token-unlocks-intel-unlocks",
    });

    const watermark = this.parseDate(state?.sourceWatermarkAt);
    if (watermark) {
      return watermark;
    }

    this.logger.log(
      "Intel token unlock delta watermark is not initialized; next run will bootstrap from full source response",
    );
    return null;
  }

  private async updateSyncState(
    sourceWatermarkAt: Date | null,
    meta: Record<string, any>,
  ): Promise<void> {
    if (!this.deltaSyncEnabled) {
      return;
    }

    const collection = this.syncStateCollection();
    const current = await collection.findOne({
      job: "token-unlocks-intel-unlocks",
    });
    const nextWatermark = this.pickMaxDate(
      this.parseDate(current?.sourceWatermarkAt) || null,
      sourceWatermarkAt,
    );
    const now = new Date();

    await collection.updateOne(
      { job: "token-unlocks-intel-unlocks" },
      {
        $set: {
          job: "token-unlocks-intel-unlocks",
          source: "intel_unlocks",
          lastCheckedAt: now,
          lastSuccessAt: now,
          lastRunMeta: meta,
          ...(nextWatermark
            ? {
                sourceWatermarkAt: nextWatermark,
                sourceWatermarkIso: nextWatermark.toISOString(),
              }
            : {}),
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  private syncStateCollection() {
    return this.tokenUnlockModel.db.collection("intel_sync_state");
  }

  private resolveSourceUpdatedAt(unlock: IntelUnlockApiItem): Date | null {
    return (
      this.parseDate(unlock.updated_at || unlock.updatedAt || unlock.createdAt) ||
      null
    );
  }

  private normalizeUnlockEvent(
    unlock: IntelUnlockApiItem,
  ): NormalizedIntelUnlockEvent | null {
    const coinSlug =
      this.toNonEmptyString(unlock.project_slug) ||
      this.toNonEmptyString(unlock.coin_slug) ||
      this.toNonEmptyString(unlock.coinSlug) ||
      this.toNonEmptyString(unlock.project_key) ||
      this.toNonEmptyString(unlock.projectKey) ||
      this.toNonEmptyString(unlock.slug);
    const unlockDate = this.parseDate(unlock.unlock_date || unlock.date);

    if (!coinSlug || !unlockDate) {
      return null;
    }

    const allocation =
      this.toNonEmptyString(unlock.allocation_type) ||
      this.toNonEmptyString(unlock.allocation) ||
      "Token Unlock";
    const coinSymbol =
      (this.toNonEmptyString(unlock.symbol) ||
        this.toNonEmptyString(unlock.coinSymbol) ||
        coinSlug).toUpperCase();
    const normalizedCoinSlug = this.slugify(coinSlug);
    const image =
      this.toNonEmptyString(unlock.image) ||
      this.toNonEmptyString(unlock.logo) ||
      this.toNonEmptyString(unlock.icon) ||
      this.toNonEmptyString(unlock.image_url) ||
      this.toNonEmptyString(unlock.cmc_image_url) ||
      "";
    const logo =
      this.toNonEmptyString(unlock.logo) ||
      this.toNonEmptyString(unlock.image) ||
      this.toNonEmptyString(unlock.icon) ||
      this.toNonEmptyString(unlock.image_url) ||
      this.toNonEmptyString(unlock.cmc_image_url) ||
      "";
    const icon =
      this.toNonEmptyString(unlock.icon) ||
      this.toNonEmptyString(unlock.image) ||
      this.toNonEmptyString(unlock.logo) ||
      this.toNonEmptyString(unlock.image_url) ||
      this.toNonEmptyString(unlock.cmc_image_url) ||
      "";

    return {
      sourceKey:
        this.toNonEmptyString(unlock.key) ||
        [
          this.toNonEmptyString(unlock.source) || "intel_unlocks",
          coinSlug,
          unlockDate.toISOString(),
          allocation,
        ].join(":"),
      source: this.toNonEmptyString(unlock.source) || "intel_unlocks",
      sourceUrl:
        this.toNonEmptyString(unlock.sourceUrl) ||
        this.toNonEmptyString(unlock.source_url),
      detailUrl:
        this.toNonEmptyString(unlock.detailUrl) ||
        this.toNonEmptyString(unlock.detail_url) ||
        this.toNonEmptyString(unlock.url),
      coinSlug: normalizedCoinSlug,
      coinSymbol,
      name:
        this.toNonEmptyString(unlock.project_name) ||
        this.toNonEmptyString(unlock.name) ||
        coinSlug,
      image,
      logo,
      icon,
      coinId:
        this.toOptionalNumber(unlock.coinId) ||
        this.toOptionalNumber(unlock.cryptoId),
      projectKey:
        this.toNonEmptyString(unlock.project_key) ||
        this.toNonEmptyString(unlock.projectKey) ||
        `${this.toNonEmptyString(unlock.source) || "intel_unlocks"}:${normalizedCoinSlug}`,
      unlockDate,
      unlockValueUsd:
        this.toNumber(unlock.amount_usd) ||
        this.toNumber(unlock.value_usd) ||
        this.toNumber(unlock.usd_value) ||
        this.toNumber(unlock.unlock_usd) ||
        this.toNumber(unlock.unlock_value_usd),
      tokensAmount:
        this.toNumber(unlock.tokens_amount) || this.toNumber(unlock.amount),
      tokensPercent:
        this.toNumber(unlock.tokens_percent) ||
        this.toNumber(unlock.unlock_percent) ||
        this.toNumber(unlock.unlock_pct),
      allocation,
      lockedPercent: this.toOptionalNumber(unlock.locked_percent),
      unlockedPercent:
        this.toOptionalNumber(unlock.unlocked_percent) ||
        this.toOptionalNumber(unlock.circulationSupplyPercent),
      marketCap: this.toOptionalNumber(unlock.market_cap),
      fullyDilutedMarketCap:
        this.toOptionalNumber(unlock.fully_diluted_market_cap) ||
        this.toOptionalNumber(unlock.fdv),
      circulatingSupply:
        this.toOptionalNumber(unlock.circulating_supply) ||
        this.toOptionalNumber(unlock.circulatingSupply),
      totalSupply:
        this.toOptionalNumber(unlock.total_supply) ||
        this.toOptionalNumber(unlock.totalSupply),
      maxSupply:
        this.toOptionalNumber(unlock.max_supply) ||
        this.toOptionalNumber(unlock.maxSupply),
      priceUsd: this.toOptionalNumber(unlock.price),
      unlockType:
        this.toNonEmptyString(unlock.unlock_type) ||
        this.toNonEmptyString(unlock.type),
      cliffEnd: this.toOptionalBoolean(unlock.cliff_end),
      updatedAt: this.parseDate(unlock.updated_at || unlock.updatedAt),
      raw: this.clonePayload(unlock),
    };
  }

  private buildTokenUnlockDocument(
    rawEvents: NormalizedIntelUnlockEvent[],
  ): Partial<TokenUnlock> & { coinSlug: string; coinId: number } | null {
    const events = this.deduplicateEvents(rawEvents).sort(
      (left, right) => left.unlockDate.getTime() - right.unlockDate.getTime(),
    );

    if (!events.length) {
      return null;
    }

    const now = new Date();
    const primaryEvent = this.pickPrimaryEvent(events);
    const firstEvent = events[0];
    const nextUnlockDate = events.find((item) => item.unlockDate > now)?.unlockDate;
    const lastUnlockDate = [...events]
      .reverse()
      .find((item) => item.unlockDate <= now)?.unlockDate;
    const nextUnlockPercent = events
      .filter(
        (item) =>
          item.unlockDate.getTime() === (nextUnlockDate?.getTime() || Number.NaN),
      )
      .reduce((sum, item) => sum + item.tokensPercent, 0);

    const totalTokensAmount = events.reduce(
      (sum, item) => sum + item.tokensAmount,
      0,
    );
    const totalUnlockedAmount = events
      .filter((item) => item.unlockDate <= now)
      .reduce((sum, item) => sum + item.tokensAmount, 0);
    const totalUnlockedPercentByEvents = this.normalizePercent(
      events
        .filter((item) => item.unlockDate <= now)
        .reduce((sum, item) => sum + item.tokensPercent, 0),
    );
    const explicitUnlockedPercent = this.toBestPercent(
      events.map((item) => item.unlockedPercent),
    );
    const totalTokensUnlockedPercent = this.normalizePercent(
      explicitUnlockedPercent ?? totalUnlockedPercentByEvents,
    );
    const explicitLockedPercent = this.toBestPercent(
      events.map((item) => item.lockedPercent),
    );
    const totalTokensLockedPercent = this.normalizePercent(
      explicitLockedPercent ?? 100 - totalTokensUnlockedPercent,
    );

    const allocations = this.buildAllocations(events, firstEvent.unlockDate, now);
    const chart = this.buildChart(events);
    const vesting = this.buildVesting(allocations, firstEvent.unlockDate);
    const icoPlatforms = [...new Set(events.map((item) => item.source).filter(Boolean))];
    const sourceKey = `${primaryEvent.coinSlug}:${icoPlatforms.join(",") || "intel"}`;
    const sortedRawEvents = [...rawEvents].sort(
      (left, right) => left.unlockDate.getTime() - right.unlockDate.getTime(),
    );
    const intelSourceEvents = sortedRawEvents.map((item) => this.clonePayload(item.raw));
    const intelNormalizedEvents = sortedRawEvents.map((item) =>
      this.serializeNormalizedEvent(item),
    );
    const intelSourceSnapshot = this.buildIntelSourceSnapshot(
      primaryEvent,
      rawEvents.length,
      icoPlatforms,
    );
    const canonicalUnlockEvents = events.map((item) =>
      this.serializeCanonicalUnlockEvent(item, now),
    );
    const nextUnlockEvent = canonicalUnlockEvents.find((item) => item.isUpcoming) || null;
    const largestUnlockEvent = [...canonicalUnlockEvents].sort(
      (left, right) => (right.unlockValueUsd || 0) - (left.unlockValueUsd || 0),
    )[0] || null;
    const circulatingSupply = this.toBestNumber(
      events.map((item) => item.circulatingSupply),
    );
    const totalSupply = this.toBestNumber(events.map((item) => item.totalSupply));
    const maxSupply = this.toBestNumber(events.map((item) => item.maxSupply));
    const fullyDilutedMarketCap = this.toBestNumber(
      events.map((item) => item.fullyDilutedMarketCap),
    );
    const lastSourceUpdatedAt = this.toLatestDate(events.map((item) => item.updatedAt));
    const totalTokensLockedAmount = Math.max(totalTokensAmount - totalUnlockedAmount, 0);
    const image = primaryEvent.image || primaryEvent.logo || primaryEvent.icon || "";
    const logo = primaryEvent.logo || primaryEvent.image || primaryEvent.icon || "";
    const icon = primaryEvent.icon || primaryEvent.image || primaryEvent.logo || "";

    return {
      source: "intel_unlocks",
      sourceKey,
      sourceUrl: primaryEvent.sourceUrl,
      detailUrl: primaryEvent.detailUrl,
      sources: icoPlatforms,
      coinId: primaryEvent.coinId || Math.abs(this.hashToNegativeNumber(primaryEvent.coinSlug)),
      coinSlug: primaryEvent.coinSlug,
      coinSymbol: primaryEvent.coinSymbol,
      image,
      logo,
      icon,
      priceUsd: primaryEvent.priceUsd || 0,
      icoPlatforms,
      icoRoi: 0,
      marketCap: primaryEvent.marketCap || 0,
      fdv: fullyDilutedMarketCap || 0,
      circulatingSupply: circulatingSupply || 0,
      totalSupply: totalSupply || 0,
      maxSupply: maxSupply || 0,
      circulationSupplyPercent: totalTokensUnlockedPercent,
      totalTokensUnlockedPercent,
      totalTokensLockedPercent,
      tgeDate: firstEvent.unlockDate,
      allocations,
      detailed: {
        name: primaryEvent.name,
        symbol: primaryEvent.coinSymbol,
        image,
        logo,
        icon,
        niche: allocations[0]?.name || "Token Unlock",
        price: {
          USD: primaryEvent.priceUsd || 0,
        },
        priceChange24h: 0,
        circulatingSupply: circulatingSupply || 0,
        totalSupply: totalSupply || 0,
        fullyDilutedMarketCap: fullyDilutedMarketCap || 0,
        mainCategory: {
          name: allocations[0]?.name || "Token Unlock",
        },
      },
      publicVestingPercent: this.normalizePercent(nextUnlockPercent),
      nextUnlockPercent: this.normalizePercent(nextUnlockPercent),
      nextUnlockValueUsd: nextUnlockEvent?.unlockValueUsd || 0,
      nextUnlockTokensAmount: nextUnlockEvent?.tokenAmount || 0,
      totalTokensUnlockedAmount: totalUnlockedAmount,
      totalTokensLockedAmount,
      totalTokensUntrackedPercent: 0,
      totalTokensUntrackedAmount: 0,
      lastTokenUnlockDate: lastUnlockDate,
      nextTokenUnlockDate: nextUnlockDate,
      vesting,
      chart,
      unlockEvents: canonicalUnlockEvents,
      nextUnlockEvent,
      largestUnlockEvent,
      rawUnlockData: intelSourceEvents,
      intelSourceEvents,
      intelNormalizedEvents,
      intelSourceSnapshot,
      lastParsedAt: lastSourceUpdatedAt ? new Date(lastSourceUpdatedAt) : new Date(),
      intelSyncMeta: {
        syncedAt: new Date(),
        sourceApiUrl: this.getApiUrl(),
        sourceEventCount: rawEvents.length,
        deduplicatedEventCount: events.length,
        primarySource: primaryEvent.source,
        primarySourceKey: primaryEvent.sourceKey,
        projectKey: primaryEvent.projectKey,
        upstreamSources: icoPlatforms,
        lastSourceUpdatedAt,
      },
    };
  }

  private deduplicateEvents(
    events: NormalizedIntelUnlockEvent[],
  ): NormalizedIntelUnlockEvent[] {
    const bySignature = new Map<string, NormalizedIntelUnlockEvent>();

    for (const event of events) {
      const signature = [
        event.coinSlug,
        event.unlockDate.toISOString(),
        this.slugify(event.allocation || "token-unlock"),
      ].join(":");
      const existing = bySignature.get(signature);

      if (!existing || this.scoreEvent(event) > this.scoreEvent(existing)) {
        bySignature.set(signature, event);
      }
    }

    return [...bySignature.values()];
  }

  private scoreEvent(event: NormalizedIntelUnlockEvent): number {
    return (
      this.getSourcePriority(event.source) +
      (event.tokensAmount ? 5 : 0) +
      (event.tokensPercent ? 5 : 0) +
      (event.unlockValueUsd ? 4 : 0) +
      (event.marketCap ? 2 : 0) +
      (event.fullyDilutedMarketCap ? 2 : 0) +
      (event.circulatingSupply ? 2 : 0) +
      (event.totalSupply ? 2 : 0) +
      (event.priceUsd ? 2 : 0) +
      (event.sourceUrl ? 1 : 0) +
      (event.unlockType ? 1 : 0) +
      (event.image ? 1 : 0)
    );
  }

  private getSourcePriority(source: string): number {
    switch (source.toLowerCase()) {
      case "coinmarketcap":
        return 40;
      case "cryptorank":
        return 30;
      case "dropstab":
        return 20;
      case "chainbroker":
        return 10;
      default:
        return 0;
    }
  }

  private pickPrimaryEvent(events: NormalizedIntelUnlockEvent[]) {
    return [...events].sort((left, right) => this.scoreEvent(right) - this.scoreEvent(left))[0];
  }

  private serializeNormalizedEvent(event: NormalizedIntelUnlockEvent): Record<string, any> {
    return {
      ...event,
      unlockDate: event.unlockDate.toISOString(),
      updatedAt: event.updatedAt?.toISOString(),
      raw: this.clonePayload(event.raw),
    };
  }

  private serializeCanonicalUnlockEvent(
    event: NormalizedIntelUnlockEvent,
    now: Date,
  ): Record<string, any> {
    const unlockTimestamp = event.unlockDate.getTime();
    const daysUntilUnlock = Math.ceil(
      (unlockTimestamp - now.getTime()) / (24 * 60 * 60 * 1000),
    );

    return {
      id: event.sourceKey,
      source: event.source,
      sourceKey: event.sourceKey,
      sourceUrl: event.sourceUrl,
      detailUrl: event.detailUrl,
      coinSlug: event.coinSlug,
      projectKey: event.projectKey,
      name: event.name,
      symbol: event.coinSymbol,
      logo: event.logo || event.image || event.icon,
      icon: event.icon || event.image || event.logo,
      image: event.image || event.logo || event.icon,
      unlockDate: event.unlockDate.toISOString(),
      daysUntilUnlock,
      isUpcoming: unlockTimestamp > now.getTime(),
      isPast: unlockTimestamp <= now.getTime(),
      allocation: event.allocation,
      unlockType: event.unlockType,
      cliffEnd: event.cliffEnd,
      tokenAmount: event.tokensAmount,
      tokensAmount: event.tokensAmount,
      unlockValueUsd: event.unlockValueUsd,
      valueUsd: event.unlockValueUsd,
      percentOfSupply: event.tokensPercent,
      tokensPercent: event.tokensPercent,
      priceUsd: event.priceUsd,
      marketCapUsd: event.marketCap,
      marketCap: event.marketCap,
      circulatingSupply: event.circulatingSupply,
      totalSupply: event.totalSupply,
      maxSupply: event.maxSupply,
      fullyDilutedMarketCapUsd: event.fullyDilutedMarketCap,
      updatedAt: event.updatedAt?.toISOString(),
      rawUnlockData: this.clonePayload(event.raw),
    };
  }

  private buildIntelSourceSnapshot(
    event: NormalizedIntelUnlockEvent,
    sourceEventCount: number,
    upstreamSources: string[],
  ): Record<string, any> {
    const base = this.clonePayload(event.raw);

    return {
      ...base,
      sourceKey: event.sourceKey,
      source: event.source,
      sourceUrl: event.sourceUrl || base.sourceUrl || base.source_url,
      detailUrl: event.detailUrl || base.detailUrl || base.detail_url || base.url,
      coinSlug: event.coinSlug,
      coinSymbol: event.coinSymbol,
      coinId: event.coinId,
      projectKey: event.projectKey,
      image: event.image || base.image || base.logo || base.icon || "",
      logo: event.logo || base.logo || base.image || base.icon || "",
      icon: event.icon || base.icon || base.image || base.logo || "",
      marketCap: event.marketCap || base.market_cap,
      fullyDilutedMarketCap: event.fullyDilutedMarketCap || base.fully_diluted_market_cap || base.fdv,
      circulatingSupply: event.circulatingSupply || base.circulating_supply,
      totalSupply: event.totalSupply || base.total_supply,
      unlockType: event.unlockType || base.unlock_type,
      cliffEnd: event.cliffEnd ?? base.cliff_end,
      sourceEventCount,
      upstreamSources,
    };
  }

  private buildAllocations(
    events: NormalizedIntelUnlockEvent[],
    tgeDate: Date,
    now: Date,
  ) {
    const allocationsMap = new Map<string, AggregatedAllocation>();

    for (const event of events) {
      const allocationName = event.allocation || "Token Unlock";
      const key = this.slugify(allocationName) || "token-unlock";
      const existing = allocationsMap.get(key);

      if (existing) {
        existing.events.push(event);
        continue;
      }

      allocationsMap.set(key, {
        id: Math.abs(this.hashToNegativeNumber(`${events[0].coinSlug}:${allocationName}`)),
        name: allocationName,
        events: [event],
      });
    }

    return [...allocationsMap.values()]
      .map((allocation) => {
        const sortedEvents = allocation.events.sort(
          (left, right) => left.unlockDate.getTime() - right.unlockDate.getTime(),
        );
        const allocatedTokensAmount = sortedEvents.reduce(
          (sum, item) => sum + item.tokensAmount,
          0,
        );
        const allocatedTokensPercent = this.normalizePercent(
          sortedEvents.reduce((sum, item) => sum + item.tokensPercent, 0),
        );
        const unlockedTokensAmount = sortedEvents
          .filter((item) => item.unlockDate <= now)
          .reduce((sum, item) => sum + item.tokensAmount, 0);
        const unlockedTokensPercent = this.normalizePercent(
          sortedEvents
            .filter((item) => item.unlockDate <= now)
            .reduce((sum, item) => sum + item.tokensPercent, 0),
        );
        const nextTokenUnlockDate = sortedEvents.find(
          (item) => item.unlockDate > now,
        )?.unlockDate;
        const lastTokenUnlockDate = [...sortedEvents]
          .reverse()
          .find((item) => item.unlockDate <= now)?.unlockDate;

        return {
          id: allocation.id,
          name: allocation.name,
          tokensAllocatedAmount: allocatedTokensAmount,
          tokensAllocatedPercent: allocatedTokensPercent,
          tokenUnlockProgress: {
            unlockedTokensPercent,
            lockedTokensPercent: this.normalizePercent(
              allocatedTokensPercent - unlockedTokensPercent,
            ),
            totalTokensAmount: allocatedTokensAmount,
            lastTokenUnlockDate: lastTokenUnlockDate?.toISOString() || null,
            nextTokenUnlockDate: nextTokenUnlockDate?.toISOString() || null,
            lockedTokensAmount: Math.max(
              allocatedTokensAmount - unlockedTokensAmount,
              0,
            ),
            unlockedTokensAmount,
          },
          tgeDate: tgeDate.toISOString(),
          vesting: sortedEvents.map((item) => ({
            source: item.source,
            sourceKey: item.sourceKey,
            sourceUrl: item.sourceUrl,
            detailUrl: item.detailUrl,
            date: item.unlockDate.toISOString(),
            amount: item.tokensAmount,
            percent: item.tokensPercent,
            valueUsd: item.unlockValueUsd,
            unlockType: item.unlockType,
            cliffEnd: item.cliffEnd,
          })),
        };
      })
      .sort(
        (left, right) => right.tokensAllocatedPercent - left.tokensAllocatedPercent,
      );
  }

  private buildChart(events: NormalizedIntelUnlockEvent[]) {
    const groupedByDate = new Map<string, NormalizedIntelUnlockEvent[]>();

    for (const event of events) {
      const dateKey = event.unlockDate.toISOString();
      const items = groupedByDate.get(dateKey) || [];
      items.push(event);
      groupedByDate.set(dateKey, items);
    }

    let cumulativeUnlockedPercent = 0;

    return [...groupedByDate.entries()]
      .sort(([left], [right]) => new Date(left).getTime() - new Date(right).getTime())
      .map(([date, items]) => {
        const unlockedPercentInPeriod = this.normalizePercent(
          items.reduce((sum, item) => sum + item.tokensPercent, 0),
        );
        cumulativeUnlockedPercent = this.normalizePercent(
          cumulativeUnlockedPercent + unlockedPercentInPeriod,
        );

        return {
          date,
          unlockedPercentInPeriod,
          cumulativeUnlockedPercent,
          roundSnapshots: items.map((item) => ({
            name: item.allocation || "Token Unlock",
            source: item.source,
            sourceKey: item.sourceKey,
            unlockedPercent: item.tokensPercent,
            unlockedTokens: item.tokensAmount,
            unlockedValueUsd: item.unlockValueUsd,
            unlockType: item.unlockType,
            cliffEnd: item.cliffEnd,
          })),
        };
      });
  }

  private buildVesting(allocations: any[], tgeDate: Date) {
    return allocations.map((allocation) => {
      const firstEvent = Array.isArray(allocation.vesting) ? allocation.vesting[0] : null;
      const firstEventDate = this.parseDate(firstEvent?.date);

      return {
        id: allocation.id,
        tgePercent:
          firstEventDate && firstEventDate.getTime() === tgeDate.getTime()
            ? this.toNumber(firstEvent?.percent)
            : 0,
      };
    });
  }

  private async flushOperations(operations: any[]): Promise<number> {
    if (!operations.length) {
      return 0;
    }

    try {
      await this.tokenUnlockModel.bulkWrite(operations, { ordered: false });
      return operations.length;
    } catch (error) {
      this.logger.error(
        `Bulk write for token unlock sync failed, falling back to single upserts: ${this.formatErrorMessage(error)}`,
        this.getErrorStack(error),
      );

      let written = 0;

      for (const operation of operations) {
        try {
          await this.tokenUnlockModel.updateOne(
            operation.updateOne.filter,
            operation.updateOne.update,
            { upsert: true },
          );
          written += 1;
        } catch (singleError) {
          this.logger.error(
            `Token unlock sync failed for coinSlug=${operation?.updateOne?.filter?.coinSlug || "unknown"}: ${this.formatErrorMessage(singleError)}`,
            this.getErrorStack(singleError),
          );
        }
      }

      return written;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logBackgroundSyncFailure(
    trigger: IntelSyncTrigger,
    error: unknown,
  ): void {
    this.logger.warn(
      `Intel token unlock background sync failed during ${trigger}; backend will continue: ${this.formatErrorMessage(error)}`,
    );
  }

  private formatErrorMessage(error: unknown): string {
    if (!error) {
      return "Unknown error";
    }

    if (typeof error === "string") {
      return error;
    }

    const errorLike = error as {
      code?: string;
      message?: string;
      cause?: { code?: string; message?: string };
      errors?: Array<{ code?: string; message?: string } | string>;
    };
    const messages = [
      errorLike.message,
      errorLike.code,
      errorLike.cause?.message,
      errorLike.cause?.code,
      ...(Array.isArray(errorLike.errors)
        ? errorLike.errors.map((item) =>
          typeof item === "string"
            ? item
            : item?.message || item?.code || "",
        )
        : []),
    ].filter(Boolean);

    return messages.length ? messages.join("; ") : String(error);
  }

  private getErrorStack(error: unknown): string | undefined {
    return typeof error === "object" && error !== null
      ? (error as { stack?: string }).stack
      : undefined;
  }

  private clonePayload<T>(value: T): T {
    if (value === null || value === undefined) {
      return value;
    }

    return JSON.parse(JSON.stringify(value)) as T;
  }

  private toLatestDate(values: Array<Date | undefined>): string | null {
    const timestamps = values
      .filter((value): value is Date => value instanceof Date && !Number.isNaN(value.getTime()))
      .map((value) => value.getTime());

    if (!timestamps.length) {
      return null;
    }

    return new Date(Math.max(...timestamps)).toISOString();
  }

  private pickMaxDate(left: Date | null, right: Date | null): Date | null {
    if (!left) {
      return right;
    }

    if (!right) {
      return left;
    }

    return right.getTime() > left.getTime() ? right : left;
  }

  private parseDate(value?: unknown): Date | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const normalized = value > 1_000_000_000_000 ? value : value * 1000;
      const parsedDate = new Date(normalized);
      return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }

    const parsedDate = new Date(String(value));
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private toNumber(value?: string | number): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const stringValue = this.toNonEmptyString(value);
    if (!stringValue) {
      return 0;
    }

    const normalizedValue = stringValue.replace(/[^0-9.-]/g, "");
    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  private toOptionalNumber(value?: string | number): number | undefined {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }

    const normalizedValue = String(value).trim().replace(/[^0-9.-]/g, "");
    if (!normalizedValue) {
      return undefined;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  private toOptionalBoolean(value?: boolean | string | number): boolean | undefined {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1 ? true : value === 0 ? false : undefined;
    }

    const stringValue = this.toNonEmptyString(value).toLowerCase();
    if (!stringValue) {
      return undefined;
    }

    if (["true", "1", "yes"].includes(stringValue)) {
      return true;
    }

    if (["false", "0", "no"].includes(stringValue)) {
      return false;
    }

    return undefined;
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

  private normalizePercent(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (value < 0) {
      return 0;
    }

    if (value > 100) {
      return 100;
    }

    return Number(value.toFixed(4));
  }

  private toBestPercent(values: Array<number | undefined>): number | undefined {
    const normalized = values.filter(
      (item): item is number => typeof item === "number" && Number.isFinite(item),
    );

    if (!normalized.length) {
      return undefined;
    }

    return Math.max(...normalized);
  }

  private toBestNumber(values: Array<number | undefined>): number | undefined {
    const normalized = values.filter(
      (item): item is number => typeof item === "number" && Number.isFinite(item),
    );

    if (!normalized.length) {
      return undefined;
    }

    return Math.max(...normalized);
  }

  private hashToNegativeNumber(value: string): number {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }

    const normalized = Math.abs(hash) || 1;
    return normalized * -1;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private isSyncEnabled(): boolean {
    return (
      String(
        this.configService.get("TOKEN_UNLOCKS_INTEL_SYNC_ENABLED") ?? "false",
      ).toLowerCase() === "true"
    );
  }

  private isWorkerProcess(): boolean {
    return process.env.INTEL_SYNC_WORKER_PROCESS === "true";
  }

  private isStartupSyncEnabled(): boolean {
    return (
      String(
        this.configService.get("TOKEN_UNLOCKS_INTEL_SYNC_ON_STARTUP") ?? "false",
      ).toLowerCase() === "true"
    );
  }

  private getApiUrl(): string {
    const explicitUrl = this.configService.get<string>("TOKEN_UNLOCKS_INTEL_API_URL");
    if (explicitUrl) {
      return explicitUrl;
    }

    const baseUrl = this.configService.get<string>("INTEL_API_BASE_URL");
    if (baseUrl) {
      return `${baseUrl.replace(/\/+$/, "")}/v1/unlocks`;
    }

    return "http://localhost:8001/api/v1/unlocks";
  }
}

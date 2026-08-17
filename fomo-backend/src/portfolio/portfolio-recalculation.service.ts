import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import mongoose, { Model } from 'mongoose';
import { Portfolio, PortfolioDocument, Transaction, TransactionDocument } from './model/portfolio.model';
import {
    FomoV2MarketProjectHistory,
    FomoV2MarketProjectHistoryDocument,
    FomoV2MarketProjectReadModel,
    FomoV2ProjectMarketSnapshot,
    FomoV2ProjectMarketSnapshotDocument,
} from 'src/fomo-v2/models';
import { PortfolioAutoRecalcService } from './portfolio-auto-recalc.service';
import { PortfolioCalculationResult, PortfolioCalculationService } from './portfolio-calculation.service';
import { retainPortfolioHistoryByAge } from './portfolio-history-retention.util';

type RecalculationReason =
    | 'event:create-portfolio'
    | 'event:add-asset'
    | 'event:update-asset'
    | 'event:reorder-assets'
    | 'event:remove-assets'
    | 'event:duplicate'
    | 'stale-on-read'
    | 'market-data'
    | 'cron'
    | 'global-sweep'
    | 'manual';

interface RecalculationOptions {
    reason: RecalculationReason;
    userId?: string;
    force?: boolean;
    markViewed?: boolean;
    persistTransactionPnL?: boolean;
}

interface RecalculationResult {
    portfolio: PortfolioDocument | null;
    calculation: PortfolioCalculationResult | null;
    recalculated: boolean;
    snapshotAdded: boolean;
    skippedReason?: string;
}

interface RecalculationBatchOptions {
    userId?: string;
    reason?: 'cron' | 'stale-on-read' | 'manual' | 'market-data' | 'global-sweep';
    scope?: 'active' | 'global' | 'snapshot-active' | 'snapshot-baseline';
}

interface RecalculationBatchResult {
    candidates: number;
    limit: number;
    processed: number;
    skipped: number;
    errors: number;
    snapshots: number;
    durationMs: number;
}

interface HistoricalPortfolioPricePoint {
    projectId: string;
    timestamp: number;
    price: number;
}

interface PortfolioProjectMarketDataVersion {
    marketDataUpdatedAt: Date | null;
    price: number | null;
    tier?: string;
}

interface PortfolioMarketDataResult {
    prices: Record<string, number>;
    categories: Record<string, string>;
    versions: Record<string, PortfolioProjectMarketDataVersion>;
}

interface PortfolioMarketSnapshotState {
    fingerprint: string;
    latestUpdatedAt: Date | null;
    trackedProjectCount: number;
    timestampedProjectCount: number;
}

const MAX_PORTFOLIO_SNAPSHOT_INTERVAL_MINUTES = 10;
const PORTFOLIO_HISTORY_BACKFILL_VERSION = 1;
const PORTFOLIO_SNAPSHOT_DISPATCH_HEADROOM_SECONDS = 2 * 60;
const PORTFOLIO_SNAPSHOT_HEADROOM_RECHECK_MINUTES = 0.5;
const PORTFOLIO_SNAPSHOT_HEADROOM_GRACE_MINUTES = 5;

@Injectable()
export class PortfolioRecalculationService {
    private readonly logger = new Logger(PortfolioRecalculationService.name);
    private readonly calculationVersion = 6;
    private readonly staleMinutes = Number(process.env.PORTFOLIO_STALE_MINUTES || 5);
    private readonly activeWindowHours = Number(process.env.PORTFOLIO_ACTIVE_WINDOW_HOURS || 24);
    private readonly baselineSnapshotMinutes = this.snapshotIntervalMinutes(
        process.env.PORTFOLIO_HISTORY_SNAPSHOT_MINUTES,
        MAX_PORTFOLIO_SNAPSHOT_INTERVAL_MINUTES,
    );
    private readonly tokenSnapshotMinutes = this.snapshotIntervalMinutes(
        process.env.PORTFOLIO_TOKEN_SNAPSHOT_MINUTES,
        MAX_PORTFOLIO_SNAPSHOT_INTERVAL_MINUTES,
    );
    private readonly activeSnapshotMinutes = this.snapshotIntervalMinutes(
        process.env.PORTFOLIO_ACTIVE_SNAPSHOT_MINUTES,
        MAX_PORTFOLIO_SNAPSHOT_INTERVAL_MINUTES,
    );
    private readonly veryActiveSnapshotMinutes = this.snapshotIntervalMinutes(
        process.env.PORTFOLIO_VERY_ACTIVE_SNAPSHOT_MINUTES,
        5,
    );
    private readonly activeSnapshotLookbackMinutes = Number(process.env.PORTFOLIO_ACTIVE_SNAPSHOT_LOOKBACK_MINUTES || 180);
    private readonly veryActiveSnapshotLookbackMinutes = Number(process.env.PORTFOLIO_VERY_ACTIVE_SNAPSHOT_LOOKBACK_MINUTES || 30);
    private readonly cronBatchSize = Number(process.env.PORTFOLIO_CRON_BATCH_SIZE || 50);
    private readonly globalSweepBatchSize = Number(process.env.PORTFOLIO_GLOBAL_SWEEP_BATCH_SIZE || 100);
    private readonly snapshotBatchSize = Number(process.env.PORTFOLIO_SNAPSHOT_BATCH_SIZE || 100);
    private readonly batchConcurrency = Number(process.env.PORTFOLIO_BATCH_CONCURRENCY || 4);
    private readonly globalSweepMaxAgeHours = Number(process.env.PORTFOLIO_GLOBAL_SWEEP_MAX_AGE_HOURS || 24);
    private readonly lockSeconds = Number(process.env.PORTFOLIO_RECALCULATION_LOCK_SECONDS || 120);
    private readonly eventSnapshotThrottleMinutes = Number(process.env.PORTFOLIO_EVENT_SNAPSHOT_THROTTLE_MINUTES || 1);
    private readonly snapshotBalanceDeltaPercent = Number(process.env.PORTFOLIO_SNAPSHOT_BALANCE_DELTA_PERCENT || 0.05);
    private readonly historicalBackfillMaxPoints = Math.max(
        2500,
        Number(process.env.PORTFOLIO_HISTORY_BACKFILL_MAX_POINTS || 10000),
    );
    private readonly historicalBackfillMaxSourcePoints = Number(process.env.PORTFOLIO_HISTORY_BACKFILL_MAX_SOURCE_POINTS || 5000);
    private readonly historicalBackfillAssetConcurrency = Number(
        process.env.PORTFOLIO_HISTORY_BACKFILL_ASSET_CONCURRENCY || 5,
    );
    constructor(
        @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(FomoV2MarketProjectReadModel.name)
        private readonly marketReadModel: Model<FomoV2MarketProjectReadModel>,
        private readonly portfolioAutoRecalcService: PortfolioAutoRecalcService,
        private readonly calculationService: PortfolioCalculationService,
        @Optional()
        @InjectModel(FomoV2ProjectMarketSnapshot.name)
        private readonly marketSnapshotModel?: Model<FomoV2ProjectMarketSnapshotDocument>,
        @Optional()
        @InjectModel(FomoV2MarketProjectHistory.name)
        private readonly marketHistoryModel?: Model<FomoV2MarketProjectHistoryDocument>,
    ) { }

    async recalculateActivePortfoliosBatch(options: RecalculationBatchOptions = {}): Promise<RecalculationBatchResult> {
        const reason = options.reason || (options.scope === 'global' ? 'global-sweep' : 'cron');
        if (!this.portfolioAutoRecalcService.shouldRunForBatchReason(reason)) {
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                `service-batch:${options.scope || 'active'}`,
                `context=batch scope=${options.scope || 'active'} reason=${reason}`,
            );
            return {
                candidates: 0,
                limit: 0,
                processed: 0,
                skipped: 0,
                errors: 0,
                snapshots: 0,
                durationMs: 0,
            };
        }

        const startedAt = Date.now();
        const now = new Date();
        const activeSince = new Date(now.getTime() - this.activeWindowHours * 60 * 60 * 1000);
        const staleBefore = new Date(now.getTime() - this.staleMinutes * 60 * 1000);
        const globalSweepBefore = new Date(now.getTime() - this.globalSweepMaxAgeHours * 60 * 60 * 1000);
        const baselineSnapshotDueFilter = this.getSnapshotCandidateDueFilter(
            now,
            this.baselineSnapshotMinutes,
        );
        const tokenSnapshotDueFilter = this.getSnapshotCandidateDueFilter(
            now,
            this.tokenSnapshotMinutes,
        );
        const activeSnapshotDueFilter = this.getSnapshotCandidateDueFilter(
            now,
            this.activeSnapshotMinutes,
        );
        const veryActiveSnapshotDueFilter = this.getSnapshotCandidateDueFilter(
            now,
            this.veryActiveSnapshotMinutes,
        );
        const activeMutationSince = new Date(now.getTime() - this.activeSnapshotLookbackMinutes * 60 * 1000);
        const veryActiveMutationSince = new Date(now.getTime() - this.veryActiveSnapshotLookbackMinutes * 60 * 1000);
        const unlockedFilter = this.unlockedFilter(now);
        const ownerFilter = options.userId
            ? { creator: new mongoose.Types.ObjectId(options.userId) }
            : {};
        const scope = options.scope || 'active';
        const nonEmptyPortfolioFilter = {
            $or: [
                { totalBalance: { $gt: 0 } },
                { 'assets.0': { $exists: true } },
                { 'calculatedAssets.0': { $exists: true } },
                { 'history.0': { $exists: true } },
            ],
        };
        const tokenBearingPortfolioFilter = {
            $or: [
                { 'assets.0': { $exists: true } },
                { 'calculatedAssets.0': { $exists: true } },
            ],
        };
        const candidateFilter = scope === 'global'
            ? {
                $or: [
                    { needsRecalculation: true },
                    { recalculationVersion: { $ne: this.calculationVersion } },
                    { lastRecalculatedAt: { $exists: false } },
                    { lastRecalculatedAt: { $lt: globalSweepBefore } },
                    { lastMarketSyncAt: { $exists: false } },
                    { lastMarketSyncAt: { $lt: globalSweepBefore } },
                ],
            }
            : scope === 'snapshot-baseline'
                ? {
                    $and: [
                        nonEmptyPortfolioFilter,
                        {
                            $or: [
                                {
                                    $and: [
                                        tokenBearingPortfolioFilter,
                                        tokenSnapshotDueFilter,
                                    ],
                                },
                                baselineSnapshotDueFilter,
                            ],
                        },
                    ],
                }
                : scope === 'snapshot-active'
                    ? {
                        $and: [
                            nonEmptyPortfolioFilter,
                            {
                                $or: [
                                    {
                                        $and: [
                                            { lastMutationAt: { $gte: veryActiveMutationSince } },
                                            veryActiveSnapshotDueFilter,
                                        ],
                                    },
                                    {
                                        $and: [
                                            {
                                                lastMutationAt: {
                                                    $gte: activeMutationSince,
                                                    $lt: veryActiveMutationSince,
                                                },
                                            },
                                            activeSnapshotDueFilter,
                                        ],
                                    },
                                ],
                            },
                        ],
                    }
            : {
                $or: [
                    { needsRecalculation: true },
                    { recalculationVersion: { $ne: this.calculationVersion } },
                    {
                        $expr: {
                            $gt: [
                                { $ifNull: ['$lastMutationAt', new Date(0)] },
                                { $ifNull: ['$lastRecalculatedAt', new Date(0)] },
                            ],
                        },
                    },
                    {
                        lastViewedAt: { $gte: activeSince },
                        $or: [
                            { lastRecalculatedAt: { $exists: false } },
                            { lastRecalculatedAt: { $lt: staleBefore } },
                            { lastMarketSyncAt: { $exists: false } },
                            { lastMarketSyncAt: { $lt: staleBefore } },
                        ],
                    },
                ],
            };
        const batchLimit = scope === 'global'
            ? this.globalSweepBatchSize
            : scope === 'snapshot-active' || scope === 'snapshot-baseline'
                ? this.snapshotBatchSize
                : this.cronBatchSize;
        const sort: Record<string, 1 | -1> = scope === 'snapshot-active'
            ? {
                lastMutationAt: -1,
                lastHistorySnapshotAt: 1,
                lastRecalculatedAt: 1,
            }
            : scope === 'snapshot-baseline'
                ? {
                    lastHistorySnapshotCheckAt: 1,
                    lastHistorySnapshotAt: 1,
                    lastMutationAt: -1,
                    lastRecalculatedAt: 1,
                }
                : {
                    needsRecalculation: -1,
                    lastMutationAt: -1,
                    lastViewedAt: -1,
                    lastRecalculatedAt: 1,
                };

        let processed = 0;
        let skipped = 0;
        let errors = 0;
        let snapshots = 0;
        let candidatesCount = 0;
        const attemptedPortfolioIds: mongoose.Types.ObjectId[] = [];
        const shouldDrainDueSnapshots = scope === 'snapshot-baseline';

        while (true) {
            const attemptedFilter = attemptedPortfolioIds.length
                ? { _id: { $nin: attemptedPortfolioIds } }
                : {};
            const candidates = await this.portfolioModel
                .find({
                    $and: [
                        ownerFilter,
                        unlockedFilter,
                        candidateFilter,
                        attemptedFilter,
                    ],
                })
                .sort(sort)
                .limit(batchLimit)
                .select('_id')
                .lean();

            if (!candidates.length) {
                break;
            }

            candidatesCount += candidates.length;
            attemptedPortfolioIds.push(
                ...candidates.map((candidate: any) => new mongoose.Types.ObjectId(candidate._id)),
            );

            let cursor = 0;
            const concurrency = Math.max(1, this.batchConcurrency);
            const workers = Array.from({ length: Math.min(concurrency, candidates.length) }, async () => {
                while (true) {
                    const currentIndex = cursor++;
                    const candidate = candidates[currentIndex];
                    if (!candidate) return;

                    try {
                        const result = await this.recalculatePortfolio(candidate._id.toString(), {
                            reason: options.reason || (scope === 'global' ? 'global-sweep' : 'cron'),
                            persistTransactionPnL: true,
                        });

                        if (result.recalculated) processed += 1;
                        else skipped += 1;
                        if (result.snapshotAdded) snapshots += 1;
                    } catch (error) {
                        errors += 1;
                        this.logger.warn(`Portfolio batch recalculation failed portfolio=${candidate._id}: ${error?.message || error}`);
                    }
                }
            });

            await Promise.all(workers);

            if (!shouldDrainDueSnapshots || candidates.length < batchLimit) {
                break;
            }
        }

        this.logger.log(
            `Portfolio batch finished scope=${scope} candidates=${candidatesCount} processed=${processed} skipped=${skipped} snapshots=${snapshots} errors=${errors} concurrency=${Math.max(1, this.batchConcurrency)} durationMs=${Date.now() - startedAt}`,
        );

        return {
            candidates: candidatesCount,
            limit: batchLimit,
            processed,
            skipped,
            errors,
            snapshots,
            durationMs: Date.now() - startedAt,
        };
    }

    async recalculatePortfolioByEvent(
        portfolioId: string,
        reason: Exclude<RecalculationReason, 'cron' | 'stale-on-read' | 'global-sweep'> = 'manual',
        userId?: string,
    ): Promise<RecalculationResult> {
        if (!this.portfolioAutoRecalcService.shouldRunForReason(reason)) {
            await this.markPortfolioMutated(portfolioId);
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                `event:${reason}`,
                `context=write portfolio=${portfolioId} reason=${reason}`,
            );
            return {
                portfolio: await this.getPortfolioDocument(portfolioId, userId),
                calculation: null,
                recalculated: false,
                snapshotAdded: false,
                skippedReason: 'auto-recalc-disabled',
            };
        }

        await this.markPortfolioMutated(portfolioId);
        return this.recalculatePortfolio(portfolioId, {
            reason,
            userId,
            force: true,
            persistTransactionPnL: true,
        });
    }

    async recalculatePortfolioFromJob(
        portfolioId: string,
        options: {
            reason: RecalculationReason;
            userId?: string;
            force?: boolean;
            markViewed?: boolean;
        },
    ): Promise<RecalculationResult> {
        if (!this.portfolioAutoRecalcService.shouldRunForReason(options.reason)) {
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                `job:${options.reason}`,
                `context=job portfolio=${portfolioId} reason=${options.reason}`,
            );
            return {
                portfolio: await this.getPortfolioDocument(portfolioId, options.userId),
                calculation: null,
                recalculated: false,
                snapshotAdded: false,
                skippedReason: 'auto-recalc-disabled',
            };
        }

        return this.recalculatePortfolio(portfolioId, {
            reason: options.reason,
            userId: options.userId,
            force: options.force,
            markViewed: options.markViewed,
            persistTransactionPnL: true,
        });
    }

    async recalculatePortfolioIfStale(
        portfolioId: string,
        userId?: string,
        markViewed = true,
    ): Promise<RecalculationResult> {
        if (!this.portfolioAutoRecalcService.shouldRunForReason('stale-on-read')) {
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                'stale-on-read',
                `context=read portfolio=${portfolioId} reason=stale-on-read`,
            );
            return {
                portfolio: await this.getPortfolioDocument(portfolioId, userId),
                calculation: null,
                recalculated: false,
                snapshotAdded: false,
                skippedReason: 'auto-recalc-disabled',
            };
        }

        if (markViewed) {
            await this.markPortfolioViewed(portfolioId);
        }

        return this.recalculatePortfolio(portfolioId, {
            reason: 'stale-on-read',
            userId,
            force: false,
            markViewed,
            persistTransactionPnL: true,
        });
    }

    async recalculateUserPortfoliosIfStaleOnRead(userId: string): Promise<void> {
        await this.markUserPortfoliosViewed(userId);

        return;
    }

    async markUserPortfoliosViewed(userId: string): Promise<void> {
        const now = new Date();
        await this.portfolioModel.updateMany(
            { creator: new mongoose.Types.ObjectId(userId) },
            { $set: { lastViewedAt: now } },
        );
    }

    async getCurrentPosition(portfolioId: string, projectId: string): Promise<number> {
        const transactions = await this.transactionModel
            .find({
                portfolioId: new mongoose.Types.ObjectId(portfolioId),
                $or: [
                    { marketAssetId: new mongoose.Types.ObjectId(projectId) },
                    { projectId: new mongoose.Types.ObjectId(projectId) },
                ],
            })
            .lean();

        return transactions.reduce((position, tx: any) => {
            if (tx.type === 'buy') return position + (tx.quantity || 0);
            if (tx.type === 'sell') return position - (tx.quantity || 0);
            return position;
        }, 0);
    }

    async calculatePortfolioView(portfolioId: string, userId?: string): Promise<{ portfolio: PortfolioDocument; calculation: PortfolioCalculationResult }> {
        const filter: any = { _id: new mongoose.Types.ObjectId(portfolioId) };
        if (userId) {
            filter.creator = new mongoose.Types.ObjectId(userId);
        }

        const portfolio = await this.portfolioModel.findOne(filter);
        if (!portfolio) {
            return { portfolio: null, calculation: null } as any;
        }

        const transactions = await this.getLedgerTransactions(portfolio._id);
        const projectIds = [...new Set(transactions.map((tx: any) => this.getTransactionMarketAssetId(tx)).filter(Boolean))];
        const { prices, categories } = await this.getProjectMarketData(projectIds);
        const calculation = this.calculationService.calculateFromTransactions(
            transactions,
            prices,
            categories,
            this.getAssetIndexMap(portfolio),
        );

        return { portfolio, calculation };
    }

    async markPortfolioViewed(portfolioId: string): Promise<void> {
        await this.portfolioModel.updateOne(
            { _id: new mongoose.Types.ObjectId(portfolioId) },
            { $set: { lastViewedAt: new Date() } },
        );
    }

    async markPortfolioMutated(portfolioId: string): Promise<void> {
        await this.portfolioModel.updateOne(
            { _id: new mongoose.Types.ObjectId(portfolioId) },
            {
                $set: {
                    lastMutationAt: new Date(),
                    needsRecalculation: true,
                },
            },
        );
    }

    async markPortfoliosForMarketData(projectIds: string[]): Promise<number> {
        if (!this.portfolioAutoRecalcService.shouldRunForReason('market-data')) {
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                'market-data-invalidation',
                `context=market-data projects=${projectIds.length} reason=market-data`,
            );
            return 0;
        }

        const uniqueProjectIds = [...new Set(projectIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (!uniqueProjectIds.length) return 0;

        const affectedPortfolioIds = await this.transactionModel.distinct('portfolioId', {
            $or: [
                {
                    marketAssetId: {
                        $in: uniqueProjectIds.map((id) => new mongoose.Types.ObjectId(id)),
                    },
                },
                {
                    projectId: {
                        $in: uniqueProjectIds.map((id) => new mongoose.Types.ObjectId(id)),
                    },
                },
            ],
        });

        if (!affectedPortfolioIds.length) return 0;

        const result = await this.portfolioModel.updateMany(
            {
                _id: { $in: affectedPortfolioIds },
            },
            {
                $set: {
                    needsRecalculation: true,
                    lastMarketInvalidatedAt: new Date(),
                },
            },
        );

        return Number(result.modifiedCount || 0);
    }

    async initializeEmptyPortfolio(portfolioId: string): Promise<void> {
        const now = new Date();
        await this.portfolioModel.updateOne(
            { _id: new mongoose.Types.ObjectId(portfolioId) },
            {
                $set: {
                    lastMutationAt: now,
                    lastRecalculatedAt: now,
                    lastMarketSyncAt: now,
                    needsRecalculation: false,
                    recalculationVersion: this.calculationVersion,
                },
            },
        );
    }

    private async recalculatePortfolio(
        portfolioId: string,
        options: RecalculationOptions,
    ): Promise<RecalculationResult> {
        const startedAt = new Date();
        const timerStartedAt = Date.now();
        const portfolio = await this.acquireLock(portfolioId, options.userId, startedAt);

        if (!portfolio) {
            return {
                portfolio: null,
                calculation: null,
                recalculated: false,
                snapshotAdded: false,
                skippedReason: 'locked-or-not-found',
            };
        }

        try {
            if (!options.force && !this.shouldRecalculate(portfolio)) {
                await this.releaseLock(portfolio._id.toString(), {
                    lastRecalculationReason: `${options.reason}:fresh`,
                    lastRecalculationDurationMs: Date.now() - timerStartedAt,
                });
                return {
                    portfolio,
                    calculation: null,
                    recalculated: false,
                    snapshotAdded: false,
                    skippedReason: 'fresh',
                };
            }

            const transactions = await this.getLedgerTransactions(portfolio._id);
            const projectIds = [...new Set(transactions.map((tx: any) => this.getTransactionMarketAssetId(tx)).filter(Boolean))];
            const { prices, categories, versions } = await this.getProjectMarketData(projectIds);
            const { btcPrice, ethPrice } = await this.getBTCAndETHPrices();
            const assetIndexes = this.getAssetIndexMap(portfolio);
            const calculation = this.calculationService.calculateFromTransactions(
                transactions,
                prices,
                categories,
                assetIndexes,
            );
            const marketSnapshotState = this.buildPortfolioMarketSnapshotState(
                calculation,
                versions,
            );
            const snapshotCheckDue = this.isSnapshotDueForPortfolio(portfolio);
            const snapshotAdded = this.shouldAppendHistorySnapshot(
                portfolio,
                calculation,
                options.reason,
                marketSnapshotState,
            );
            const shouldReplaceHistoricalHistory = this.shouldReplaceHistoricalHistoryWindow(options.reason);
            const hadUsableHistory = (portfolio.history || []).some((item: any) => (
                this.toDateMs(item?.date) !== null
                && Number.isFinite(Number(item?.totalBalance))
            ));
            const shouldBuildHistoricalHistory = this.shouldBuildHistoricalHistory(
                portfolio,
                transactions,
                shouldReplaceHistoricalHistory,
            );
            const historicalHistory = shouldBuildHistoricalHistory
                ? await this.buildHistoricalPortfolioHistory(
                    portfolio,
                    transactions,
                    categories,
                    assetIndexes,
                    btcPrice,
                    ethPrice,
                )
                : [];

            const didReplaceHistoricalHistory = shouldReplaceHistoricalHistory
                && (historicalHistory.length > 0 || !transactions.length);
            if (historicalHistory.length) {
                portfolio.history = this.mergePortfolioHistory(
                    portfolio.history || [],
                    historicalHistory,
                    shouldReplaceHistoricalHistory,
                ) as any;
            } else if (shouldReplaceHistoricalHistory && !transactions.length) {
                portfolio.history = [] as any;
                portfolio.lastHistorySnapshotAt = undefined;
            }
            if (
                shouldBuildHistoricalHistory
                && (
                    historicalHistory.length
                    || !transactions.length
                    || (!shouldReplaceHistoricalHistory && hadUsableHistory)
                )
            ) {
                portfolio.historyBackfillVersion = PORTFOLIO_HISTORY_BACKFILL_VERSION;
            } else if (shouldReplaceHistoricalHistory) {
                portfolio.historyBackfillVersion = 0;
            }

            this.calculationService.applyToPortfolio(
                portfolio,
                calculation,
                btcPrice,
                ethPrice,
                snapshotAdded,
                !didReplaceHistoricalHistory,
            );

            if (snapshotAdded && (portfolio.history || []).length) {
                portfolio.lastHistorySnapshotAt = new Date();
                this.captureHistoryMarketSnapshotState(portfolio, marketSnapshotState);
            } else if (!(portfolio.history || []).length) {
                portfolio.lastHistorySnapshotAt = undefined;
                portfolio.lastHistorySnapshotCheckAt = undefined;
                portfolio.lastHistoryMarketDataAt = undefined;
                portfolio.lastHistoryMarketDataFingerprint = undefined;
            } else {
                this.repairFutureHistoryMetadata(portfolio, new Date());
                this.seedLegacyHistoryMarketSnapshotState(portfolio, marketSnapshotState);
            }

            if ((portfolio.history || []).length && (snapshotAdded || snapshotCheckDue)) {
                portfolio.lastHistorySnapshotCheckAt = new Date();
            }
            this.captureCurrentMarketSnapshotState(portfolio, marketSnapshotState);
            await portfolio.save();

            if (options.persistTransactionPnL !== false) {
                await this.updateTransactionsFromCalculation(calculation.transactions);
            }

            const hasNewerMutation = await this.hasNewerMutation(portfolio._id.toString(), startedAt);
            await this.releaseLock(portfolio._id.toString(), {
                lastRecalculatedAt: new Date(),
                lastMarketSyncAt: new Date(),
                needsRecalculation: hasNewerMutation,
                recalculationVersion: this.calculationVersion,
                lastRecalculationReason: options.reason,
                lastRecalculationError: null,
                lastRecalculationDurationMs: Date.now() - timerStartedAt,
                ...(options.markViewed ? { lastViewedAt: new Date() } : {}),
            }, startedAt);

            this.logger.debug?.(
                `Portfolio recalculated id=${portfolio._id} reason=${options.reason} snapshot=${snapshotAdded} durationMs=${Date.now() - timerStartedAt}`,
            );

            return {
                portfolio,
                calculation,
                recalculated: true,
                snapshotAdded,
            };
        } catch (error) {
            await this.releaseLock(portfolio._id.toString(), {
                needsRecalculation: true,
                lastRecalculationReason: options.reason,
                lastRecalculationError: error?.message || String(error),
                lastRecalculationDurationMs: Date.now() - timerStartedAt,
            });
            throw error;
        }
    }

    private shouldRecalculate(portfolio: PortfolioDocument): boolean {
        if (this.hasFutureHistoryMetadata(portfolio, Date.now())) return true;
        if (portfolio.needsRecalculation) return true;
        if (!portfolio.lastRecalculatedAt) return true;
        if (portfolio.recalculationVersion !== this.calculationVersion) return true;
        if (portfolio.lastMutationAt && portfolio.lastMutationAt > portfolio.lastRecalculatedAt) return true;
        if (this.isSnapshotDueForPortfolio(portfolio)) return true;

        const staleBefore = Date.now() - this.staleMinutes * 60 * 1000;
        if (portfolio.lastRecalculatedAt.getTime() < staleBefore) return true;
        if (!portfolio.lastMarketSyncAt || portfolio.lastMarketSyncAt.getTime() < staleBefore) return true;

        return false;
    }

    private shouldAppendHistorySnapshot(
        portfolio: PortfolioDocument,
        calculation: PortfolioCalculationResult,
        reason: RecalculationReason,
        marketSnapshotState?: PortfolioMarketSnapshotState,
    ): boolean {
        const currentBalance = calculation.totals.currentBalance;
        const history = portfolio.history || [];
        const lastHistory = history.length ? history[history.length - 1] : null;
        const lastSnapshotAt = portfolio.lastHistorySnapshotAt || lastHistory?.date;
        if (currentBalance <= 0 && !this.canPortfolioProduceSnapshot(portfolio)) return false;
        if (!lastSnapshotAt) return true;

        const minutesSinceSnapshot = (Date.now() - new Date(lastSnapshotAt).getTime()) / 60000;
        const lastBalance = Number(lastHistory?.totalBalance || 0);
        const balanceDeltaPercent = lastBalance > 0
            ? Math.abs((currentBalance - lastBalance) / lastBalance) * 100
            : 100;
        const isEvent = reason.startsWith('event:') || reason === 'manual';
        const targetSnapshotIntervalMinutes = this.getSnapshotDispatchIntervalMinutes(
            this.getSnapshotIntervalMinutes(portfolio),
        );
        const baselineSnapshotIntervalMinutes = this.getSnapshotDispatchIntervalMinutes(
            this.baselineSnapshotMinutes,
        );

        if (isEvent) {
            return minutesSinceSnapshot >= this.eventSnapshotThrottleMinutes
                || balanceDeltaPercent >= this.snapshotBalanceDeltaPercent;
        }

        if (
            marketSnapshotState?.trackedProjectCount
            && !this.hasMarketDataAdvancedSinceHistory(
                portfolio,
                marketSnapshotState,
                new Date(lastSnapshotAt),
            )
        ) {
            return false;
        }

        if (
            this.hasPortfolioTokens(portfolio)
            && minutesSinceSnapshot >= targetSnapshotIntervalMinutes
        ) {
            return true;
        }

        if (minutesSinceSnapshot >= baselineSnapshotIntervalMinutes) {
            return true;
        }

        return minutesSinceSnapshot >= targetSnapshotIntervalMinutes
            && balanceDeltaPercent >= this.snapshotBalanceDeltaPercent;
    }

    private hasMarketDataAdvancedSinceHistory(
        portfolio: PortfolioDocument,
        state: PortfolioMarketSnapshotState,
        lastSnapshotAt: Date,
    ): boolean {
        if (!state.trackedProjectCount) return true;

        const previousFingerprint = String(
            portfolio.lastHistoryMarketDataFingerprint || '',
        ).trim();
        if (previousFingerprint) {
            return previousFingerprint !== state.fingerprint;
        }

        if (!state.latestUpdatedAt) {
            return false;
        }

        return state.latestUpdatedAt.getTime() > lastSnapshotAt.getTime();
    }

    private captureCurrentMarketSnapshotState(
        portfolio: PortfolioDocument,
        state: PortfolioMarketSnapshotState,
    ): void {
        if (!state.trackedProjectCount) {
            portfolio.lastMarketDataAt = undefined;
            portfolio.lastMarketDataFingerprint = undefined;
            return;
        }

        portfolio.lastMarketDataAt = state.latestUpdatedAt || undefined;
        portfolio.lastMarketDataFingerprint = state.fingerprint;
    }

    private captureHistoryMarketSnapshotState(
        portfolio: PortfolioDocument,
        state: PortfolioMarketSnapshotState,
    ): void {
        if (!state.trackedProjectCount) {
            portfolio.lastHistoryMarketDataAt = undefined;
            portfolio.lastHistoryMarketDataFingerprint = undefined;
            return;
        }

        portfolio.lastHistoryMarketDataAt = state.latestUpdatedAt || undefined;
        portfolio.lastHistoryMarketDataFingerprint = state.fingerprint;
    }

    private seedLegacyHistoryMarketSnapshotState(
        portfolio: PortfolioDocument,
        state: PortfolioMarketSnapshotState,
    ): void {
        if (
            portfolio.lastHistoryMarketDataFingerprint
            || !state.trackedProjectCount
        ) {
            return;
        }

        const lastSnapshotAt = this.getLastSnapshotAt(portfolio);
        if (
            state.latestUpdatedAt
            && lastSnapshotAt
            && state.latestUpdatedAt.getTime() > lastSnapshotAt.getTime()
        ) {
            return;
        }

        this.captureHistoryMarketSnapshotState(portfolio, state);
    }

    private isSnapshotDueForPortfolio(portfolio: PortfolioDocument): boolean {
        const lastSnapshotAt = this.getLastSnapshotAt(portfolio);
        if (!lastSnapshotAt) {
            return this.canPortfolioProduceSnapshot(portfolio);
        }

        const now = Date.now();
        const targetIntervalMinutes = this.getSnapshotIntervalMinutes(portfolio);
        const dispatchIntervalMinutes = this.getSnapshotDispatchIntervalMinutes(
            targetIntervalMinutes,
        );
        const dueIntervalMs = dispatchIntervalMinutes * 60 * 1000;
        if (now - lastSnapshotAt.getTime() < dueIntervalMs) {
            return false;
        }

        const lastSnapshotCheckAt = this.toDateMs(
            portfolio.lastHistorySnapshotCheckAt,
        );
        if (lastSnapshotCheckAt === null) return true;

        const isInsideDispatchHeadroom = dispatchIntervalMinutes < targetIntervalMinutes
            && now - lastSnapshotAt.getTime()
                <= (targetIntervalMinutes + PORTFOLIO_SNAPSHOT_HEADROOM_GRACE_MINUTES) * 60 * 1000;
        const checkIntervalMinutes = isInsideDispatchHeadroom
            ? PORTFOLIO_SNAPSHOT_HEADROOM_RECHECK_MINUTES
            : dispatchIntervalMinutes;

        return now - lastSnapshotCheckAt >= checkIntervalMinutes * 60 * 1000;
    }

    private getSnapshotIntervalMinutes(portfolio: PortfolioDocument): number {
        const now = Date.now();
        const lastMutationAtMs = portfolio.lastMutationAt ? new Date(portfolio.lastMutationAt).getTime() : 0;
        if (lastMutationAtMs && now - lastMutationAtMs <= this.veryActiveSnapshotLookbackMinutes * 60 * 1000) {
            return this.veryActiveSnapshotMinutes;
        }

        if (lastMutationAtMs && now - lastMutationAtMs <= this.activeSnapshotLookbackMinutes * 60 * 1000) {
            return this.activeSnapshotMinutes;
        }

        if (this.hasPortfolioTokens(portfolio)) {
            return this.tokenSnapshotMinutes;
        }

        return this.baselineSnapshotMinutes;
    }

    private getSnapshotDispatchIntervalMinutes(intervalMinutes: number): number {
        const dispatchCeilingMinutes = MAX_PORTFOLIO_SNAPSHOT_INTERVAL_MINUTES
            - PORTFOLIO_SNAPSHOT_DISPATCH_HEADROOM_SECONDS / 60;
        return Math.min(intervalMinutes, dispatchCeilingMinutes);
    }

    private getSnapshotDueBefore(now: Date, intervalMinutes: number): Date {
        return new Date(
            now.getTime()
            - this.getSnapshotDispatchIntervalMinutes(intervalMinutes) * 60 * 1000,
        );
    }

    private getSnapshotCandidateDueFilter(
        now: Date,
        intervalMinutes: number,
    ): Record<string, any> {
        const futureMetadata = {
            $or: [
                { lastHistorySnapshotAt: { $gt: now } },
                { lastHistorySnapshotCheckAt: { $gt: now } },
                { lastHistoryMarketDataAt: { $gt: now } },
            ],
        };
        const dispatchIntervalMinutes = this.getSnapshotDispatchIntervalMinutes(intervalMinutes);
        const dispatchDueBefore = this.getSnapshotDueBefore(now, intervalMinutes);
        const snapshotDue = {
            $or: [
                { lastHistorySnapshotAt: { $exists: false } },
                { lastHistorySnapshotAt: null },
                { lastHistorySnapshotAt: { $lt: dispatchDueBefore } },
            ],
        };
        const snapshotCheckMissing = {
            $or: [
                { lastHistorySnapshotCheckAt: { $exists: false } },
                { lastHistorySnapshotCheckAt: null },
            ],
        };
        const regularSnapshotCheckDue = {
            lastHistorySnapshotCheckAt: { $lt: dispatchDueBefore },
        };

        if (dispatchIntervalMinutes >= intervalMinutes) {
            return {
                $or: [
                    futureMetadata,
                    {
                        $and: [
                            snapshotDue,
                            {
                                $or: [
                                    snapshotCheckMissing,
                                    regularSnapshotCheckDue,
                                ],
                            },
                        ],
                    },
                ],
            };
        }

        const targetDueBefore = new Date(
            now.getTime()
            - (intervalMinutes + PORTFOLIO_SNAPSHOT_HEADROOM_GRACE_MINUTES) * 60 * 1000,
        );
        const headroomRecheckBefore = new Date(
            now.getTime() - PORTFOLIO_SNAPSHOT_HEADROOM_RECHECK_MINUTES * 60 * 1000,
        );
        const snapshotMissingOrPastHeadroom = {
            $or: [
                { lastHistorySnapshotAt: { $exists: false } },
                { lastHistorySnapshotAt: null },
                { lastHistorySnapshotAt: { $lt: targetDueBefore } },
            ],
        };

        return {
            $or: [
                futureMetadata,
                {
                    $and: [
                        snapshotDue,
                        {
                            $or: [
                                snapshotCheckMissing,
                                {
                                    $and: [
                                        { lastHistorySnapshotAt: { $gte: targetDueBefore } },
                                        { lastHistorySnapshotCheckAt: { $lt: headroomRecheckBefore } },
                                    ],
                                },
                                {
                                    $and: [
                                        snapshotMissingOrPastHeadroom,
                                        regularSnapshotCheckDue,
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }

    private hasFutureHistoryMetadata(
        portfolio: PortfolioDocument,
        referenceTimestamp: number,
    ): boolean {
        return [
            portfolio.lastHistorySnapshotAt,
            portfolio.lastHistorySnapshotCheckAt,
            portfolio.lastHistoryMarketDataAt,
        ].some((value) => {
            const timestamp = this.toDateMs(value);
            return timestamp !== null && timestamp > referenceTimestamp;
        });
    }

    private getLastSnapshotAt(portfolio: PortfolioDocument): Date | null {
        if (portfolio.lastHistorySnapshotAt) {
            return new Date(portfolio.lastHistorySnapshotAt);
        }

        const history = portfolio.history || [];
        const lastHistory = history.length ? history[history.length - 1] : null;
        return lastHistory?.date ? new Date(lastHistory.date) : null;
    }

    private canPortfolioProduceSnapshot(portfolio: PortfolioDocument): boolean {
        return Boolean(
            Number(portfolio.totalBalance || 0) > 0
            || (portfolio.assets || []).length
            || (portfolio.calculatedAssets || []).length
            || (portfolio.history || []).length,
        );
    }

    private hasPortfolioTokens(portfolio: PortfolioDocument): boolean {
        return Boolean(
            (portfolio.assets || []).length
            || (portfolio.calculatedAssets || []).length,
        );
    }

    private async buildHistoricalPortfolioHistory(
        portfolio: PortfolioDocument,
        transactions: any[],
        categories: Record<string, string>,
        assetIndexes: Record<string, number>,
        btcPrice: number,
        ethPrice: number,
    ): Promise<any[]> {
        const nowMs = Date.now();
        const backfillUntilMs = nowMs - 60 * 1000;
        const historicalTransactions = (transactions || [])
            .map((tx: any) => ({
                tx,
                projectId: this.getTransactionMarketAssetId(tx),
                timestamp: this.toDateMs(tx?.date),
                price: this.toFiniteNumber(tx?.price),
            }))
            .filter((item) =>
                item.projectId
                && item.timestamp !== null
                && item.timestamp <= nowMs
            )
            .sort((left, right) => {
                if (left.timestamp !== right.timestamp) return left.timestamp - right.timestamp;
                return String(left.tx?._id || '').localeCompare(String(right.tx?._id || ''));
            });

        if (!historicalTransactions.length) return [];

        const earliestTransactionMs = historicalTransactions[0].timestamp;
        if (earliestTransactionMs >= backfillUntilMs) return [];

        const projectIds = [...new Set(historicalTransactions.map((item) => item.projectId))]
            .filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (!projectIds.length) return [];

        const pricePointsByProject = await this.loadHistoricalPricePoints(
            projectIds,
            new Date(earliestTransactionMs),
            new Date(backfillUntilMs),
        );

        for (const item of historicalTransactions) {
            if (item.price !== null && item.price > 0) {
                this.addHistoricalPricePoint(pricePointsByProject, {
                    projectId: item.projectId,
                    timestamp: item.timestamp,
                    price: item.price,
                });
            }
        }

        const transactionTimestamps = new Set(
            historicalTransactions.map((item) => item.timestamp),
        );
        const timeline = this.buildHistoricalTimeline(
            pricePointsByProject,
            transactionTimestamps,
            earliestTransactionMs,
            backfillUntilMs,
        );
        if (!timeline.length) return [];

        const priceCursors = new Map<string, number>();
        const latestPrices: Record<string, number> = {};
        const sortedPricePointsByProject = new Map(
            Array.from(pricePointsByProject.entries()).map(([projectId, points]) => [
                projectId,
                points.sort((left, right) => left.timestamp - right.timestamp),
            ]),
        );
        const snapshots: any[] = [];

        for (const timestamp of timeline) {
            for (const [projectId, points] of sortedPricePointsByProject.entries()) {
                let cursor = priceCursors.get(projectId) || 0;

                while (cursor < points.length && points[cursor].timestamp <= timestamp) {
                    latestPrices[projectId] = points[cursor].price;
                    cursor += 1;
                }

                priceCursors.set(projectId, cursor);
            }

            const transactionsAsOf = historicalTransactions
                .filter((item) => item.timestamp <= timestamp)
                .map((item) => item.tx);
            if (!transactionsAsOf.length) continue;

            const calculation = this.calculationService.calculateFromTransactions(
                transactionsAsOf,
                latestPrices,
                categories,
                assetIndexes,
            );

            if (!this.isMeaningfulHistoryCalculation(calculation)) continue;

            snapshots.push({
                date: new Date(timestamp),
                totalBalance: calculation.totals.currentBalance,
                totalProfit: calculation.totals.totalProfit,
                totalProfitPercent: calculation.totals.totalProfitPercent,
                totalInvested: calculation.totals.totalInvested,
                categoryDistribution: calculation.allocations,
                btcPrice,
                ethPrice,
                isApproximation: true,
            });
        }

        return retainPortfolioHistoryByAge(snapshots, Date.now());
    }

    private async loadHistoricalPricePoints(
        projectIds: string[],
        from: Date,
        to: Date,
    ): Promise<Map<string, HistoricalPortfolioPricePoint[]>> {
        const result = new Map<string, HistoricalPortfolioPricePoint[]>();
        const objectIds = projectIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        if (!objectIds.length || (!this.marketSnapshotModel && !this.marketHistoryModel)) {
            return result;
        }

        try {
            const sourceLimit = Math.max(
                this.historicalBackfillMaxSourcePoints,
                this.historicalBackfillMaxPoints,
            );
            await this.runWithConcurrency(
                objectIds,
                this.historicalBackfillAssetConcurrency,
                async (objectId) => {
                    const [snapshotRows, historyRows] =
                        await this.loadTieredHistoricalPriceRows(
                            objectId,
                            from,
                            to,
                            sourceLimit,
                        );

                    for (const row of snapshotRows as any[]) {
                        const point = this.toHistoricalPricePoint(row?.marketAssetId, row?.timestamp, row?.priceUsd);
                        if (point) this.addHistoricalPricePoint(result, point);
                    }

                    for (const row of historyRows as any[]) {
                        const point = this.toHistoricalPricePoint(
                            row?.marketAssetId,
                            row?.bucketTimestamp || row?.timestamp,
                            row?.price,
                        );
                        if (point) this.addHistoricalPricePoint(result, point);
                    }
                },
            );
        } catch (error) {
            this.logger.warn(`Portfolio historical backfill price lookup failed: ${error?.message || error}`);
        }

        return result;
    }

    private async loadTieredHistoricalPriceRows(
        objectId: mongoose.Types.ObjectId,
        from: Date,
        to: Date,
        sourceLimit: number,
    ): Promise<[any[], any[]]> {
        const dayMs = 24 * 60 * 60 * 1000;
        const fromTimestamp = from.getTime();
        const toTimestamp = to.getTime();
        const recentStartTimestamp = Math.max(fromTimestamp, toTimestamp - dayMs);
        const hourlyStartTimestamp = Math.max(fromTimestamp, toTimestamp - 90 * dayMs);
        const loaders: Array<Promise<[any[], any[]]>> = [];

        if (fromTimestamp < hourlyStartTimestamp) {
            loaders.push(this.loadDailyHistoricalPriceRows(
                objectId,
                from,
                new Date(hourlyStartTimestamp - 1),
            ));
        }
        if (hourlyStartTimestamp < recentStartTimestamp) {
            loaders.push(this.loadHourlyHistoricalPriceRows(
                objectId,
                new Date(hourlyStartTimestamp),
                new Date(recentStartTimestamp - 1),
            ));
        }
        loaders.push(this.loadRawHistoricalPriceRows(
            objectId,
            new Date(recentStartTimestamp),
            to,
            sourceLimit,
        ));

        const chunks = await Promise.all(loaders);
        return [
            chunks.flatMap(([snapshotRows]) => snapshotRows),
            chunks.flatMap(([, historyRows]) => historyRows),
        ];
    }

    private async loadRawHistoricalPriceRows(
        objectId: mongoose.Types.ObjectId,
        from: Date,
        to: Date,
        sourceLimit: number,
    ): Promise<[any[], any[]]> {
        return Promise.all([
            this.marketSnapshotModel
                ? this.marketSnapshotModel
                    .find({
                        marketAssetId: objectId,
                        provider: 'coingecko',
                        priceUsd: { $gt: 0 },
                        timestamp: { $gte: from, $lte: to },
                    })
                    .select('marketAssetId timestamp priceUsd')
                    .sort({ timestamp: 1 })
                    .limit(sourceLimit)
                    .lean()
                : Promise.resolve([]),
            this.marketHistoryModel
                ? this.marketHistoryModel
                    .find({
                        marketAssetId: objectId,
                        bucketTimestamp: { $type: 'date', $gte: from, $lte: to },
                        price: { $gt: 0 },
                    })
                    .select('marketAssetId bucketTimestamp timestamp price')
                    .sort({ bucketTimestamp: 1 })
                    .limit(sourceLimit)
                    .lean()
                : Promise.resolve([]),
        ]);
    }

    private async loadDailyHistoricalPriceRows(
        objectId: mongoose.Types.ObjectId,
        from: Date,
        to: Date,
    ): Promise<[any[], any[]]> {
        return Promise.all([
            this.marketSnapshotModel
                ? this.executeHistoricalAggregate(this.marketSnapshotModel, [
                    {
                        $match: {
                            marketAssetId: objectId,
                            provider: 'coingecko',
                            priceUsd: { $gt: 0 },
                            timestamp: { $gte: from, $lte: to },
                        },
                    },
                    { $sort: { timestamp: 1 } },
                    {
                        $group: {
                            _id: {
                                day: {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: '$timestamp',
                                    },
                                },
                            },
                            marketAssetId: { $last: '$marketAssetId' },
                            timestamp: { $last: '$timestamp' },
                            priceUsd: { $last: '$priceUsd' },
                        },
                    },
                    { $sort: { timestamp: 1 } },
                ])
                : Promise.resolve([]),
            this.marketHistoryModel
                ? this.executeHistoricalAggregate(this.marketHistoryModel, [
                    {
                        $match: {
                            marketAssetId: objectId,
                            bucketTimestamp: { $type: 'date', $gte: from, $lte: to },
                            price: { $gt: 0 },
                        },
                    },
                    { $sort: { bucketTimestamp: 1 } },
                    {
                        $group: {
                            _id: {
                                day: {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: '$bucketTimestamp',
                                    },
                                },
                            },
                            marketAssetId: { $last: '$marketAssetId' },
                            bucketTimestamp: { $last: '$bucketTimestamp' },
                            timestamp: { $last: '$timestamp' },
                            price: { $last: '$price' },
                        },
                    },
                    { $sort: { bucketTimestamp: 1 } },
                ])
                : Promise.resolve([]),
        ]);
    }

    private async loadHourlyHistoricalPriceRows(
        objectId: mongoose.Types.ObjectId,
        from: Date,
        to: Date,
    ): Promise<[any[], any[]]> {
        return Promise.all([
            this.marketSnapshotModel
                ? this.executeHistoricalAggregate(this.marketSnapshotModel, [
                    {
                        $match: {
                            marketAssetId: objectId,
                            provider: 'coingecko',
                            priceUsd: { $gt: 0 },
                            timestamp: { $gte: from, $lte: to },
                        },
                    },
                    { $sort: { timestamp: 1 } },
                    {
                        $group: {
                            _id: {
                                hour: {
                                    $dateToString: {
                                        format: '%Y-%m-%dT%H',
                                        date: '$timestamp',
                                    },
                                },
                            },
                            marketAssetId: { $last: '$marketAssetId' },
                            timestamp: { $last: '$timestamp' },
                            priceUsd: { $last: '$priceUsd' },
                        },
                    },
                    { $sort: { timestamp: 1 } },
                ])
                : Promise.resolve([]),
            this.marketHistoryModel
                ? this.executeHistoricalAggregate(this.marketHistoryModel, [
                    {
                        $match: {
                            marketAssetId: objectId,
                            bucketTimestamp: { $type: 'date', $gte: from, $lte: to },
                            price: { $gt: 0 },
                        },
                    },
                    { $sort: { bucketTimestamp: 1 } },
                    {
                        $group: {
                            _id: {
                                hour: {
                                    $dateToString: {
                                        format: '%Y-%m-%dT%H',
                                        date: '$bucketTimestamp',
                                    },
                                },
                            },
                            marketAssetId: { $last: '$marketAssetId' },
                            bucketTimestamp: { $last: '$bucketTimestamp' },
                            timestamp: { $last: '$timestamp' },
                            price: { $last: '$price' },
                        },
                    },
                    { $sort: { bucketTimestamp: 1 } },
                ])
                : Promise.resolve([]),
        ]);
    }

    private async executeHistoricalAggregate(model: any, pipeline: any[]): Promise<any[]> {
        const aggregate = model.aggregate(pipeline);
        if (typeof aggregate.allowDiskUse === 'function') {
            aggregate.allowDiskUse(true);
        }

        return typeof aggregate.exec === 'function' ? aggregate.exec() : aggregate;
    }

    private toHistoricalPricePoint(
        projectIdValue: any,
        timestampValue: any,
        priceValue: any,
    ): HistoricalPortfolioPricePoint | null {
        const projectId = this.toIdString(projectIdValue);
        const timestamp = this.toDateMs(timestampValue);
        const price = this.toFiniteNumber(priceValue);

        if (!projectId || timestamp === null || price === null || price <= 0) {
            return null;
        }

        return {
            projectId,
            timestamp,
            price,
        };
    }

    private addHistoricalPricePoint(
        pointsByProject: Map<string, HistoricalPortfolioPricePoint[]>,
        point: HistoricalPortfolioPricePoint,
    ): void {
        const existingPoints = pointsByProject.get(point.projectId) || [];
        const existingIndex = existingPoints.findIndex((item) => item.timestamp === point.timestamp);

        if (existingIndex >= 0) {
            existingPoints[existingIndex] = point;
        } else {
            existingPoints.push(point);
        }

        pointsByProject.set(point.projectId, existingPoints);
    }

    private async runWithConcurrency<T>(
        items: T[],
        concurrency: number,
        worker: (item: T) => Promise<void>,
    ): Promise<void> {
        const normalizedConcurrency = Math.max(1, Math.min(concurrency || 1, items.length));
        const workers = Array.from({ length: normalizedConcurrency }, async (_, workerIndex) => {
            for (let index = workerIndex; index < items.length; index += normalizedConcurrency) {
                await worker(items[index]);
            }
        });

        await Promise.all(workers);
    }

    private buildHistoricalTimeline(
        pricePointsByProject: Map<string, HistoricalPortfolioPricePoint[]>,
        transactionTimestamps: Set<number>,
        fromMs: number,
        toMs: number,
    ): number[] {
        const timestamps = new Set<number>();

        for (const points of pricePointsByProject.values()) {
            for (const point of points) {
                if (point.timestamp >= fromMs && point.timestamp <= toMs) {
                    timestamps.add(point.timestamp);
                }
            }
        }

        for (const timestamp of transactionTimestamps) {
            if (timestamp >= fromMs && timestamp <= toMs) {
                timestamps.add(timestamp);
            }
        }

        const sorted = Array.from(timestamps).sort((left, right) => left - right);
        const tieredTimestamps = retainPortfolioHistoryByAge(
            sorted.map((timestamp) => ({ date: timestamp })),
            toMs,
        ).map((item) => Number(item.date));
        const retainedTimestamps = Array.from(new Set([
            ...tieredTimestamps,
            ...Array.from(transactionTimestamps).filter(
                (timestamp) => timestamp >= fromMs && timestamp <= toMs,
            ),
        ])).sort((left, right) => left - right);

        return this.downsampleTimestamps(
            retainedTimestamps,
            this.historicalBackfillMaxPoints,
            transactionTimestamps,
        );
    }

    private downsampleTimestamps(
        timestamps: number[],
        maxPoints: number,
        requiredTimestamps: Set<number>,
    ): number[] {
        if (timestamps.length <= maxPoints) return timestamps;

        const required = timestamps.filter((timestamp) => requiredTimestamps.has(timestamp));
        const optional = timestamps.filter((timestamp) => !requiredTimestamps.has(timestamp));
        const effectiveMaxPoints = Math.max(maxPoints, required.length);
        const optionalBudget = Math.max(0, effectiveMaxPoints - required.length);
        const sampledOptional = this.downsampleEvenly(optional, optionalBudget);

        return Array.from(new Set([...required, ...sampledOptional]))
            .sort((left, right) => left - right)
            .slice(-effectiveMaxPoints);
    }

    private mergePortfolioHistory(
        existingHistory: any[],
        generatedHistory: any[],
        replaceGeneratedWindow = false,
    ): any[] {
        const historyByTimestamp = new Map<number, any>();
        const generatedTimestamps = (generatedHistory || [])
            .map((item) => this.toDateMs(item?.date))
            .filter((timestamp): timestamp is number => timestamp !== null);
        const replaceFrom = replaceGeneratedWindow && generatedTimestamps.length
            ? Number.NEGATIVE_INFINITY
            : generatedTimestamps.length
                ? Math.min(...generatedTimestamps)
                : null;
        const replaceTo = replaceGeneratedWindow && replaceFrom !== null
            ? Date.now()
            : generatedTimestamps.length
                ? Math.max(...generatedTimestamps)
                : null;

        for (const item of existingHistory || []) {
            const timestamp = this.toDateMs(item?.date);
            if (timestamp === null) continue;
            if (
                replaceFrom !== null
                && replaceTo !== null
                && timestamp >= replaceFrom
                && timestamp <= replaceTo
            ) {
                continue;
            }
            historyByTimestamp.set(timestamp, item);
        }

        for (const item of generatedHistory || []) {
            const timestamp = this.toDateMs(item?.date);
            if (timestamp === null) continue;
            historyByTimestamp.set(timestamp, item);
        }

        return retainPortfolioHistoryByAge(
            Array.from(historyByTimestamp.values()),
            Date.now(),
        );
    }

    private shouldReplaceHistoricalHistoryWindow(reason: RecalculationReason): boolean {
        return (
            String(reason).startsWith('event:')
            && reason !== 'event:reorder-assets'
        )
            || reason === 'manual';
    }

    private shouldBuildHistoricalHistory(
        portfolio: PortfolioDocument,
        transactions: any[],
        replaceHistoricalHistory: boolean,
    ): boolean {
        if (replaceHistoricalHistory) return true;
        if (
            Number(portfolio.historyBackfillVersion || 0)
            !== PORTFOLIO_HISTORY_BACKFILL_VERSION
        ) {
            return true;
        }

        const historyTimestamps = (portfolio.history || [])
            .map((item: any) => this.toDateMs(item?.date))
            .filter((timestamp): timestamp is number => timestamp !== null);
        if (!historyTimestamps.length) return true;

        const transactionTimestamps = (transactions || [])
            .map((transaction: any) => this.toDateMs(transaction?.date))
            .filter((timestamp): timestamp is number => timestamp !== null);
        if (!transactionTimestamps.length) return false;

        const earliestHistoryTimestamp = Math.min(...historyTimestamps);
        const earliestTransactionTimestamp = Math.min(...transactionTimestamps);
        return earliestHistoryTimestamp - earliestTransactionTimestamp > 60 * 1000;
    }

    private repairFutureHistoryMetadata(
        portfolio: PortfolioDocument,
        referenceTime: Date,
    ): void {
        const referenceTimestamp = referenceTime.getTime();
        const lastValidHistoryTimestamp = (portfolio.history || []).reduce(
            (latest, item: any) => {
                const timestamp = this.toDateMs(item?.date);
                return timestamp !== null && timestamp <= referenceTimestamp
                    ? Math.max(latest, timestamp)
                    : latest;
            },
            Number.NEGATIVE_INFINITY,
        );
        const lastSnapshotTimestamp = this.toDateMs(portfolio.lastHistorySnapshotAt);

        if (lastSnapshotTimestamp !== null && lastSnapshotTimestamp > referenceTimestamp) {
            portfolio.lastHistorySnapshotAt = Number.isFinite(lastValidHistoryTimestamp)
                ? new Date(lastValidHistoryTimestamp)
                : undefined;
            portfolio.lastHistoryMarketDataAt = undefined;
            portfolio.lastHistoryMarketDataFingerprint = undefined;
        }
        if (
            (this.toDateMs(portfolio.lastHistorySnapshotCheckAt) ?? Number.NEGATIVE_INFINITY)
            > referenceTimestamp
        ) {
            portfolio.lastHistorySnapshotCheckAt = undefined;
        }
        if (
            (this.toDateMs(portfolio.lastHistoryMarketDataAt) ?? Number.NEGATIVE_INFINITY)
            > referenceTimestamp
        ) {
            portfolio.lastHistoryMarketDataAt = undefined;
            portfolio.lastHistoryMarketDataFingerprint = undefined;
        }
    }

    private isMeaningfulHistoryCalculation(calculation: PortfolioCalculationResult): boolean {
        const totals = calculation?.totals || ({} as any);
        const values = [
            totals.currentBalance,
            totals.totalProfit,
            totals.totalProfitPercent,
        ].map((value) => this.toFiniteNumber(value) || 0);

        return values.some((value) => Math.abs(value) > 0.00000001);
    }

    private downsampleEvenly<T>(items: T[], maxItems: number): T[] {
        if (!items.length || maxItems <= 0) return [];
        if (items.length <= maxItems) return items;
        if (maxItems === 1) return [items[items.length - 1]];

        const result: T[] = [];
        const lastIndex = items.length - 1;
        const usedIndexes = new Set<number>();

        for (let index = 0; index < maxItems; index += 1) {
            const sourceIndex = index === maxItems - 1
                ? lastIndex
                : Math.floor((index * lastIndex) / (maxItems - 1));
            if (usedIndexes.has(sourceIndex)) continue;
            usedIndexes.add(sourceIndex);
            result.push(items[sourceIndex]);
        }

        return result;
    }

    private async getLedgerTransactions(portfolioId: mongoose.Types.ObjectId | string) {
        return this.transactionModel
            .find({ portfolioId: new mongoose.Types.ObjectId(portfolioId.toString()) })
            .sort({ date: 1, createdAt: 1 })
            .lean();
    }

    private async getPortfolioDocument(portfolioId: string, userId?: string): Promise<PortfolioDocument | null> {
        const filter: any = { _id: new mongoose.Types.ObjectId(portfolioId) };
        if (userId) {
            filter.creator = new mongoose.Types.ObjectId(userId);
        }

        return this.portfolioModel.findOne(filter);
    }

    private async getProjectMarketData(projectIds: string[]): Promise<PortfolioMarketDataResult> {
        const prices: Record<string, number> = {};
        const categories: Record<string, string> = {};
        const versions: Record<string, PortfolioProjectMarketDataVersion> = {};
        const uniqueProjectIds = [...new Set(projectIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));

        if (!uniqueProjectIds.length) return { prices, categories, versions };

        const projects = await this.marketReadModel
            .find({ marketAssetId: { $in: uniqueProjectIds.map((id) => new mongoose.Types.ObjectId(id)) } })
            .select('marketAssetId price category niche symbol tier marketDataUpdatedAt')
            .lean();

        for (const project of projects as any[]) {
            const projectId = project.marketAssetId.toString();
            const price = Number(project.price || 0);
            prices[projectId] = price;
            categories[projectId] = project.category || project.niche || 'Other';
            versions[projectId] = {
                marketDataUpdatedAt: this.toValidDate(project.marketDataUpdatedAt),
                price: Number.isFinite(price) ? price : null,
                tier: project.tier,
            };
        }

        return { prices, categories, versions };
    }

    private buildPortfolioMarketSnapshotState(
        calculation: PortfolioCalculationResult,
        versions: Record<string, PortfolioProjectMarketDataVersion> = {},
    ): PortfolioMarketSnapshotState {
        const projectIds = [...new Set(
            (calculation.projects || [])
                .map((project) => this.toIdString(project.marketAssetId || project.projectId))
                .filter(Boolean),
        )].sort();
        let latestUpdatedAt: Date | null = null;
        let timestampedProjectCount = 0;

        const fingerprintPayload = projectIds.map((projectId) => {
            const marketDataUpdatedAt = versions[projectId]?.marketDataUpdatedAt || null;
            const timestamp = marketDataUpdatedAt?.getTime();
            const price = versions[projectId]?.price;

            if (Number.isFinite(timestamp)) {
                timestampedProjectCount += 1;
                if (
                    !latestUpdatedAt
                    || marketDataUpdatedAt.getTime() > latestUpdatedAt.getTime()
                ) {
                    latestUpdatedAt = marketDataUpdatedAt;
                }
            }

            return [
                projectId,
                Number.isFinite(timestamp) ? timestamp : 'missing',
                Number.isFinite(price) ? price : 'missing',
            ].join(':');
        });

        return {
            fingerprint: projectIds.length
                ? createHash('sha256').update(fingerprintPayload.join('|')).digest('hex')
                : '',
            latestUpdatedAt,
            trackedProjectCount: projectIds.length,
            timestampedProjectCount,
        };
    }

    private async getBTCAndETHPrices(): Promise<{ btcPrice: number; ethPrice: number }> {
        try {
            const projects = await this.marketReadModel
                .find({
                    trading: 'CURRENTLY_TRADING',
                    $or: [
                        { symbol: { $in: ['BTC', 'ETH'] } },
                        { niche: { $in: ['BTC', 'ETH'] } },
                        { slug: { $in: ['bitcoin', 'ethereum'] } },
                    ],
                })
                .select('symbol niche slug price')
                .lean();
            const btcProject = (projects as any[]).find((project) => project.symbol === 'BTC' || project.niche === 'BTC' || project.slug === 'bitcoin');
            const ethProject = (projects as any[]).find((project) => project.symbol === 'ETH' || project.niche === 'ETH' || project.slug === 'ethereum');

            return {
                btcPrice: Number(btcProject?.price || 1),
                ethPrice: Number(ethProject?.price || 1),
            };
        } catch (error) {
            this.logger.warn(`Failed to load BTC/ETH prices for portfolio performance: ${error?.message || error}`);
            return { btcPrice: 1, ethPrice: 1 };
        }
    }

    private getAssetIndexMap(portfolio: PortfolioDocument): Record<string, number> {
        return (portfolio.assets || []).reduce((acc, asset: any) => {
            const projectId = this.getPortfolioAssetIdentity(asset);
            if (!projectId) return acc;
            acc[projectId] = typeof acc[projectId] === 'number'
                ? Math.max(acc[projectId], asset.index || 0)
                : asset.index || 0;
            return acc;
        }, {} as Record<string, number>);
    }

    private getTransactionMarketAssetId(transaction: any): string {
        return this.toIdString(transaction?.marketAssetId || transaction?.projectId);
    }

    private getPortfolioAssetIdentity(asset: any): string {
        return this.toIdString(asset?.marketAssetId || asset?.projectId);
    }

    private toIdString(value: any): string {
        if (!value) return '';
        if (value.marketAssetId) return value.marketAssetId.toString();
        if (value._id) return value._id.toString();
        return value.toString();
    }

    private toDateMs(value: any): number | null {
        const date = value instanceof Date ? value : new Date(value);
        const timestamp = date.getTime();
        return Number.isFinite(timestamp) ? timestamp : null;
    }

    private toValidDate(value: any): Date | null {
        const timestamp = this.toDateMs(value);
        return timestamp === null ? null : new Date(timestamp);
    }

    private toFiniteNumber(value: any): number | null {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private snapshotIntervalMinutes(
        configuredValue: string | undefined,
        fallback: number,
    ): number {
        const parsed = Number(configuredValue);
        const positiveValue = Number.isFinite(parsed) && parsed > 0
            ? parsed
            : fallback;

        return Math.min(
            positiveValue,
            MAX_PORTFOLIO_SNAPSHOT_INTERVAL_MINUTES,
        );
    }

    private async updateTransactionsFromCalculation(transactions: Array<{ id?: string; gainLoss: number; gainLossPercent: number }>) {
        const updates = transactions
            .filter((tx) => tx.id)
            .map((tx) => this.transactionModel.updateOne(
                { _id: new mongoose.Types.ObjectId(tx.id) },
                {
                    $set: {
                        gainLoss: tx.gainLoss,
                        gainLossPercent: tx.gainLossPercent,
                    },
                },
            ));

        await Promise.all(updates);
    }

    private async acquireLock(
        portfolioId: string,
        userId: string | undefined,
        startedAt: Date,
    ): Promise<PortfolioDocument | null> {
        const lockUntil = new Date(startedAt.getTime() + this.lockSeconds * 1000);
        const filter: any = {
            _id: new mongoose.Types.ObjectId(portfolioId),
            ...this.unlockedFilter(startedAt),
        };

        if (userId) {
            filter.creator = new mongoose.Types.ObjectId(userId);
        }

        return this.portfolioModel.findOneAndUpdate(
            filter,
            {
                $set: {
                    recalculationLockUntil: lockUntil,
                    recalculationStartedAt: startedAt,
                },
            },
            { new: true },
        );
    }

    private async releaseLock(
        portfolioId: string,
        set: Record<string, any>,
        preserveMutationsAfter?: Date,
    ): Promise<void> {
        const filter: Record<string, any> = { _id: new mongoose.Types.ObjectId(portfolioId) };

        if (preserveMutationsAfter && set.needsRecalculation === false) {
            filter.$and = [
                {
                    $or: [
                        { lastMutationAt: { $exists: false } },
                        { lastMutationAt: null },
                        { lastMutationAt: { $lte: preserveMutationsAfter } },
                    ],
                },
                {
                    $or: [
                        { lastMarketInvalidatedAt: { $exists: false } },
                        { lastMarketInvalidatedAt: null },
                        { lastMarketInvalidatedAt: { $lt: preserveMutationsAfter } },
                    ],
                },
            ];
        }

        const result = await this.portfolioModel.updateOne(
            filter,
            {
                $set: set,
                $unset: {
                    recalculationLockUntil: '',
                    recalculationStartedAt: '',
                },
            },
        );

        if (
            preserveMutationsAfter
            && set.needsRecalculation === false
            && Number(result?.matchedCount || 0) === 0
        ) {
            const { needsRecalculation, ...setWithoutNeedsRecalculation } = set;
            await this.portfolioModel.updateOne(
                { _id: new mongoose.Types.ObjectId(portfolioId) },
                {
                    $set: {
                        ...setWithoutNeedsRecalculation,
                        needsRecalculation: true,
                    },
                    $unset: {
                        recalculationLockUntil: '',
                        recalculationStartedAt: '',
                    },
                },
            );
        }
    }

    private async hasNewerMutation(portfolioId: string, startedAt: Date): Promise<boolean> {
        const portfolio = await this.portfolioModel
            .findById(portfolioId)
            .select('lastMutationAt lastMarketInvalidatedAt needsRecalculation')
            .lean();

        const lastMutationTimestamp = this.toDateMs(portfolio?.lastMutationAt);
        const lastMarketInvalidationTimestamp = this.toDateMs(
            portfolio?.lastMarketInvalidatedAt,
        );

        return (
            lastMutationTimestamp !== null
            && lastMutationTimestamp > startedAt.getTime()
        ) || (
            lastMarketInvalidationTimestamp !== null
            && lastMarketInvalidationTimestamp >= startedAt.getTime()
        );
    }

    private unlockedFilter(now: Date) {
        return {
            $or: [
                { recalculationLockUntil: { $exists: false } },
                { recalculationLockUntil: null },
                { recalculationLockUntil: { $lt: now } },
            ],
        };
    }
}

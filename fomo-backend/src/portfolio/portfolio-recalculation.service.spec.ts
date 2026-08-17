jest.mock('src/projects/project.model', () => ({
    Project: class Project { },
}), { virtual: true });

import { PortfolioRecalculationService } from './portfolio-recalculation.service';

describe('PortfolioRecalculationService snapshot strategy', () => {
    const portfolioId = '507f1f77bcf86cd799439011';

    const createService = () => {
        const portfolioModel = {
            findOneAndUpdate: jest.fn(),
            updateOne: jest.fn(),
            updateMany: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
        };
        const transactionModel = {
            find: jest.fn(),
            updateOne: jest.fn(),
            distinct: jest.fn(),
        };
        const projectModel = {
            find: jest.fn(),
        };
        const marketSnapshotModel = {
            find: jest.fn(),
            aggregate: jest.fn(),
        };
        const marketHistoryModel = {
            find: jest.fn(),
            aggregate: jest.fn(),
        };
        const portfolioAutoRecalcService = {
            shouldRunForBatchReason: jest.fn(() => true),
            shouldRunForReason: jest.fn(() => true),
            logAutoRecalcSkipped: jest.fn(),
        };
        const calculationService = {
            calculateFromTransactions: jest.fn(),
            applyToPortfolio: jest.fn(),
        };

        const service = new PortfolioRecalculationService(
            portfolioModel as any,
            transactionModel as any,
            projectModel as any,
            portfolioAutoRecalcService as any,
            calculationService as any,
            marketSnapshotModel as any,
            marketHistoryModel as any,
        );

        return {
            service,
            portfolioModel,
            transactionModel,
            projectModel,
            marketSnapshotModel,
            marketHistoryModel,
            portfolioAutoRecalcService,
            calculationService,
        };
    };

    const createPortfolio = (overrides: Record<string, any> = {}) => ({
        _id: { toString: () => portfolioId },
        history: [],
        assets: [{ projectId: { toString: () => 'project-1' }, index: 0 }],
        totalBalance: 100,
        needsRecalculation: false,
        recalculationVersion: 6,
        historyBackfillVersion: 1,
        lastRecalculatedAt: new Date(),
        lastMarketSyncAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('appends snapshot after 10 minutes even without balance delta', () => {
        const { service } = createService();
        const now = new Date('2026-04-18T10:10:00.000Z').getTime();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
        });
        const calculation = {
            totals: {
                currentBalance: 100,
            },
        };

        const result = (service as any).shouldAppendHistorySnapshot(portfolio, calculation, 'cron');
        expect(result).toBe(true);
    });

    it('uses 10 minute interval for portfolios with tokens', () => {
        const { service } = createService();
        const now = new Date('2026-04-18T10:30:00.000Z').getTime();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        const veryActivePortfolio = createPortfolio({
            lastMutationAt: new Date('2026-04-18T10:25:00.000Z'),
        });
        const tokenPortfolio = createPortfolio({
            lastMutationAt: new Date('2026-04-18T06:00:00.000Z'),
        });
        const emptyPortfolio = createPortfolio({
            assets: [],
            calculatedAssets: [],
            lastMutationAt: new Date('2026-04-18T06:00:00.000Z'),
        });

        expect((service as any).getSnapshotIntervalMinutes(veryActivePortfolio)).toBe(5);
        expect((service as any).getSnapshotIntervalMinutes(tokenPortfolio)).toBe(10);
        expect((service as any).getSnapshotIntervalMinutes(emptyPortfolio)).toBe(10);
    });

    it('caps configured snapshot intervals at 10 minutes', () => {
        const previousHistoryInterval = process.env.PORTFOLIO_HISTORY_SNAPSHOT_MINUTES;
        const previousTokenInterval = process.env.PORTFOLIO_TOKEN_SNAPSHOT_MINUTES;
        process.env.PORTFOLIO_HISTORY_SNAPSHOT_MINUTES = '60';
        process.env.PORTFOLIO_TOKEN_SNAPSHOT_MINUTES = '30';

        try {
            const { service } = createService();

            expect((service as any).baselineSnapshotMinutes).toBe(10);
            expect((service as any).tokenSnapshotMinutes).toBe(10);
        } finally {
            if (previousHistoryInterval === undefined) {
                delete process.env.PORTFOLIO_HISTORY_SNAPSHOT_MINUTES;
            } else {
                process.env.PORTFOLIO_HISTORY_SNAPSHOT_MINUTES = previousHistoryInterval;
            }
            if (previousTokenInterval === undefined) {
                delete process.env.PORTFOLIO_TOKEN_SNAPSHOT_MINUTES;
            } else {
                process.env.PORTFOLIO_TOKEN_SNAPSHOT_MINUTES = previousTokenInterval;
            }
        }
    });

    it('uses a two minute dispatch headroom for 10 minute snapshot candidates', () => {
        const { service } = createService();
        const now = new Date('2026-04-18T10:10:00.000Z');

        expect(
            (service as any).getSnapshotDueBefore(now, 10),
        ).toEqual(new Date('2026-04-18T10:02:00.000Z'));
        expect(
            (service as any).getSnapshotDueBefore(now, 5),
        ).toEqual(new Date('2026-04-18T10:05:00.000Z'));
        expect(
            (service as any).getSnapshotDueBefore(now, 9.5),
        ).toEqual(new Date('2026-04-18T10:02:00.000Z'));
    });

    it('rechecks a skipped snapshot inside dispatch headroom and scheduler grace', () => {
        const { service } = createService();
        const dateNow = jest.spyOn(Date, 'now');
        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
            lastHistorySnapshotCheckAt: new Date('2026-04-18T10:08:00.000Z'),
        });

        dateNow.mockReturnValue(new Date('2026-04-18T10:08:20.000Z').getTime());
        expect((service as any).isSnapshotDueForPortfolio(portfolio)).toBe(false);

        (portfolio as any).lastHistorySnapshotCheckAt = new Date('2026-04-18T10:09:00.084Z');
        dateNow.mockReturnValue(new Date('2026-04-18T10:10:00.006Z').getTime());
        expect((service as any).isSnapshotDueForPortfolio(portfolio)).toBe(true);

        (portfolio as any).lastHistorySnapshotCheckAt = new Date('2026-04-18T10:10:00.000Z');
        dateNow.mockReturnValue(new Date('2026-04-18T10:11:00.000Z').getTime());
        expect((service as any).isSnapshotDueForPortfolio(portfolio)).toBe(true);

        (portfolio as any).lastHistorySnapshotCheckAt = new Date('2026-04-18T10:11:00.000Z');
        dateNow.mockReturnValue(new Date('2026-04-18T10:12:00.000Z').getTime());
        expect((service as any).isSnapshotDueForPortfolio(portfolio)).toBe(true);

        (portfolio as any).lastHistorySnapshotCheckAt = new Date('2026-04-18T10:15:00.000Z');
        dateNow.mockReturnValue(new Date('2026-04-18T10:16:00.000Z').getTime());
        expect((service as any).isSnapshotDueForPortfolio(portfolio)).toBe(false);
    });

    it('uses a short snapshot-check threshold only inside dispatch headroom', () => {
        const { service } = createService();
        const filter = (service as any).getSnapshotCandidateDueFilter(
            new Date('2026-04-18T10:10:00.000Z'),
            10,
        );
        const serializedFilter = JSON.stringify(filter);

        expect(serializedFilter).toContain('2026-04-18T10:02:00.000Z');
        expect(serializedFilter).toContain('2026-04-18T09:55:00.000Z');
        expect(serializedFilter).toContain('2026-04-18T10:09:30.000Z');
    });

    it('repairs future snapshot metadata against retained history', () => {
        const { service } = createService();
        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T09:50:00.000Z'),
                    totalBalance: 90,
                },
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T11:00:00.000Z'),
            lastHistorySnapshotCheckAt: new Date('2026-04-18T11:01:00.000Z'),
            lastHistoryMarketDataAt: new Date('2026-04-18T11:02:00.000Z'),
            lastHistoryMarketDataFingerprint: 'future-state',
        });
        jest.spyOn(Date, 'now').mockReturnValue(
            new Date('2026-04-18T10:10:00.000Z').getTime(),
        );
        const candidateFilter = (service as any).getSnapshotCandidateDueFilter(
            new Date('2026-04-18T10:10:00.000Z'),
            10,
        );

        expect(JSON.stringify(candidateFilter)).toContain(
            '"lastHistorySnapshotAt":{"$gt":"2026-04-18T10:10:00.000Z"}',
        );
        expect((service as any).shouldRecalculate(portfolio)).toBe(true);

        (service as any).repairFutureHistoryMetadata(
            portfolio,
            new Date('2026-04-18T10:10:00.000Z'),
        );

        expect((portfolio as any).lastHistorySnapshotAt).toEqual(
            new Date('2026-04-18T10:00:00.000Z'),
        );
        expect((portfolio as any).lastHistorySnapshotCheckAt).toBeUndefined();
        expect((portfolio as any).lastHistoryMarketDataAt).toBeUndefined();
        expect((portfolio as any).lastHistoryMarketDataFingerprint).toBeUndefined();
    });

    it('timestamps market invalidation even when recalculation is already pending', async () => {
        const { service, transactionModel, portfolioModel } = createService();
        transactionModel.distinct.mockResolvedValue(['portfolio-1']);
        portfolioModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

        const modified = await service.markPortfoliosForMarketData([
            '507f1f77bcf86cd799439021',
        ]);

        expect(modified).toBe(1);
        expect(portfolioModel.updateMany).toHaveBeenCalledWith(
            { _id: { $in: ['portfolio-1'] } },
            {
                $set: {
                    needsRecalculation: true,
                    lastMarketInvalidatedAt: expect.any(Date),
                },
            },
        );
    });

    it('honors the latest snapshot check on read while keeping the 5 minute stale check separate', () => {
        const { service } = createService();
        jest.spyOn(Date, 'now').mockReturnValue(
            new Date('2026-04-18T10:30:00.000Z').getTime(),
        );

        const recentlyChecked = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
            lastHistorySnapshotCheckAt: new Date('2026-04-18T10:29:00.000Z'),
            lastRecalculatedAt: new Date('2026-04-18T10:29:00.000Z'),
            lastMarketSyncAt: new Date('2026-04-18T10:29:00.000Z'),
        });

        expect((service as any).isSnapshotDueForPortfolio(recentlyChecked)).toBe(false);
        expect((service as any).shouldRecalculate(recentlyChecked)).toBe(false);

        recentlyChecked.lastRecalculatedAt = new Date('2026-04-18T10:24:00.000Z');
        recentlyChecked.lastMarketSyncAt = new Date('2026-04-18T10:24:00.000Z');

        expect((service as any).isSnapshotDueForPortfolio(recentlyChecked)).toBe(false);
        expect((service as any).shouldRecalculate(recentlyChecked)).toBe(true);
    });

    it('marks a checked portfolio snapshot due again after the dispatch interval', () => {
        const { service } = createService();
        jest.spyOn(Date, 'now').mockReturnValue(
            new Date('2026-04-18T10:30:00.000Z').getTime(),
        );
        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
            lastHistorySnapshotCheckAt: new Date('2026-04-18T10:21:00.000Z'),
        });

        expect((service as any).isSnapshotDueForPortfolio(portfolio)).toBe(true);
    });

    it('appends token portfolio snapshots every 10 minutes even without balance delta', () => {
        const { service } = createService();
        const now = new Date('2026-04-18T10:10:00.000Z').getTime();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
            lastMutationAt: new Date('2026-04-18T06:00:00.000Z'),
        });
        const calculation = {
            totals: {
                currentBalance: 100,
            },
        };

        const result = (service as any).shouldAppendHistorySnapshot(portfolio, calculation, 'cron');
        expect(result).toBe(true);
    });

    it('appends at the headroom boundary when market data advanced', () => {
        const { service } = createService();
        const dateNow = jest.spyOn(Date, 'now');
        const calculation = {
            projects: [{ projectId: 'warm-token' }],
            totals: {
                currentBalance: 100,
            },
        };
        const previousState = (service as any).buildPortfolioMarketSnapshotState(
            calculation,
            {
                'warm-token': {
                    tier: 'WARM',
                    marketDataUpdatedAt: new Date('2026-04-18T09:50:00.000Z'),
                },
            },
        );
        const currentState = (service as any).buildPortfolioMarketSnapshotState(
            calculation,
            {
                'warm-token': {
                    tier: 'WARM',
                    marketDataUpdatedAt: new Date('2026-04-18T10:05:00.000Z'),
                },
            },
        );
        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
            lastHistoryMarketDataFingerprint: previousState.fingerprint,
        });

        dateNow.mockReturnValue(new Date('2026-04-18T10:07:59.000Z').getTime());
        expect(
            (service as any).shouldAppendHistorySnapshot(
                portfolio,
                calculation,
                'cron',
                currentState,
            ),
        ).toBe(false);

        dateNow.mockReturnValue(new Date('2026-04-18T10:08:00.000Z').getTime());
        expect(
            (service as any).shouldAppendHistorySnapshot(
                portfolio,
                calculation,
                'cron',
                currentState,
            ),
        ).toBe(true);
    });

    it('keeps manual recalculation snapshot semantics independent of market freshness', () => {
        const { service } = createService();
        jest.spyOn(Date, 'now').mockReturnValue(
            new Date('2026-04-18T10:02:00.000Z').getTime(),
        );
        const calculation = {
            projects: [{ projectId: 'warm-token' }],
            totals: {
                currentBalance: 100,
            },
        };
        const marketState = (service as any).buildPortfolioMarketSnapshotState(
            calculation,
            {
                'warm-token': {
                    tier: 'WARM',
                    marketDataUpdatedAt: new Date('2026-04-18T10:00:00.000Z'),
                },
            },
        );
        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
            lastHistoryMarketDataFingerprint: marketState.fingerprint,
        });

        expect(
            (service as any).shouldAppendHistorySnapshot(
                portfolio,
                calculation,
                'manual',
                marketState,
            ),
        ).toBe(true);
    });

    it('skips scheduled snapshots when WARM and COLD market data has not advanced', () => {
        const { service } = createService();
        jest.spyOn(Date, 'now').mockReturnValue(
            new Date('2026-04-18T10:30:00.000Z').getTime(),
        );

        const calculation = {
            projects: [
                { projectId: 'warm-token' },
                { projectId: 'cold-token' },
            ],
            totals: {
                currentBalance: 100,
            },
        };
        const marketState = (service as any).buildPortfolioMarketSnapshotState(
            calculation,
            {
                'warm-token': {
                    tier: 'WARM',
                    marketDataUpdatedAt: new Date('2026-04-18T09:59:00.000Z'),
                },
                'cold-token': {
                    tier: 'COLD',
                    marketDataUpdatedAt: new Date('2026-04-18T08:00:00.000Z'),
                },
            },
        );
        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
            lastHistoryMarketDataFingerprint: marketState.fingerprint,
        });

        expect(
            (service as any).shouldAppendHistorySnapshot(
                portfolio,
                calculation,
                'cron',
                marketState,
            ),
        ).toBe(false);
    });

    it('appends a scheduled snapshot when raw price changes with an unchanged or missing market timestamp', () => {
        const { service } = createService();
        jest.spyOn(Date, 'now').mockReturnValue(
            new Date('2026-04-18T10:08:00.000Z').getTime(),
        );
        const previousCalculation = {
            projects: [{ projectId: 'low-price-token', currentPrice: 0 }],
            totals: {
                currentBalance: 100,
            },
        };
        const currentCalculation = {
            projects: [{ projectId: 'low-price-token', currentPrice: 0 }],
            totals: {
                currentBalance: 100,
            },
        };
        const marketTimestamps = [
            new Date('2026-04-18T10:00:00.000Z'),
            null,
        ];

        for (const marketDataUpdatedAt of marketTimestamps) {
            const previousState = (service as any).buildPortfolioMarketSnapshotState(
                previousCalculation,
                {
                    'low-price-token': {
                        marketDataUpdatedAt,
                        price: 0.00000123,
                    },
                },
            );
            const currentState = (service as any).buildPortfolioMarketSnapshotState(
                currentCalculation,
                {
                    'low-price-token': {
                        marketDataUpdatedAt,
                        price: 0.00000124,
                    },
                },
            );
            const portfolio = createPortfolio({
                history: [
                    {
                        date: new Date('2026-04-18T10:00:00.000Z'),
                        totalBalance: 100,
                    },
                ],
                lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
                lastHistoryMarketDataFingerprint: previousState.fingerprint,
            });

            expect(currentState.latestUpdatedAt).toEqual(previousState.latestUpdatedAt);
            expect(currentState.fingerprint).not.toBe(previousState.fingerprint);
            expect(
                (service as any).shouldAppendHistorySnapshot(
                    portfolio,
                    currentCalculation,
                    'cron',
                    currentState,
                ),
            ).toBe(true);
        }
    });

    it('appends a scheduled snapshot when one WARM token advances behind a newer COLD timestamp', () => {
        const { service } = createService();
        jest.spyOn(Date, 'now').mockReturnValue(
            new Date('2026-04-18T10:30:00.000Z').getTime(),
        );

        const calculation = {
            projects: [
                { projectId: 'warm-token' },
                { projectId: 'cold-token' },
            ],
            totals: {
                currentBalance: 101,
            },
        };
        const previousState = (service as any).buildPortfolioMarketSnapshotState(
            calculation,
            {
                'warm-token': {
                    tier: 'WARM',
                    marketDataUpdatedAt: new Date('2026-04-18T08:00:00.000Z'),
                },
                'cold-token': {
                    tier: 'COLD',
                    marketDataUpdatedAt: new Date('2026-04-18T10:00:00.000Z'),
                },
            },
        );
        const currentState = (service as any).buildPortfolioMarketSnapshotState(
            calculation,
            {
                'warm-token': {
                    tier: 'WARM',
                    marketDataUpdatedAt: new Date('2026-04-18T09:00:00.000Z'),
                },
                'cold-token': {
                    tier: 'COLD',
                    marketDataUpdatedAt: new Date('2026-04-18T10:00:00.000Z'),
                },
            },
        );
        const portfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T10:00:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T10:00:00.000Z'),
            lastHistoryMarketDataFingerprint: previousState.fingerprint,
        });

        expect(currentState.latestUpdatedAt).toEqual(previousState.latestUpdatedAt);
        expect(currentState.fingerprint).not.toBe(previousState.fingerprint);
        expect(
            (service as any).shouldAppendHistorySnapshot(
                portfolio,
                calculation,
                'cron',
                currentState,
            ),
        ).toBe(true);
    });

    it('allows zero-balance snapshots for non-empty portfolios but skips truly empty portfolios', () => {
        const { service } = createService();
        const calculation = {
            totals: {
                currentBalance: 0,
            },
        };

        expect(
            (service as any).shouldAppendHistorySnapshot(
                createPortfolio({ totalBalance: 0, assets: [{ projectId: 'project-1' }] }),
                calculation,
                'cron',
            ),
        ).toBe(true);
        expect(
            (service as any).shouldAppendHistorySnapshot(
                createPortfolio({ totalBalance: 0, assets: [], history: [], needsRecalculation: true }),
                calculation,
                'cron',
            ),
        ).toBe(false);
    });

    it('prevents duplicate snapshot append when two jobs run in parallel', async () => {
        const { service, portfolioModel, calculationService } = createService();
        const now = new Date('2026-04-18T10:30:00.000Z').getTime();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        const lockedPortfolio = createPortfolio({
            history: [
                {
                    date: new Date('2026-04-18T09:55:00.000Z'),
                    totalBalance: 100,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-18T09:55:00.000Z'),
            lastMutationAt: new Date('2026-04-18T10:28:00.000Z'),
        });

        portfolioModel.findOneAndUpdate
            .mockResolvedValueOnce(lockedPortfolio)
            .mockResolvedValueOnce(null);

        jest.spyOn(service as any, 'getLedgerTransactions').mockResolvedValue([]);
        jest.spyOn(service as any, 'getProjectMarketData').mockResolvedValue({ prices: {}, categories: {} });
        jest.spyOn(service as any, 'getBTCAndETHPrices').mockResolvedValue({ btcPrice: 1, ethPrice: 1 });
        jest.spyOn(service as any, 'getAssetIndexMap').mockReturnValue({});
        jest.spyOn(service as any, 'updateTransactionsFromCalculation').mockResolvedValue(undefined);
        jest.spyOn(service as any, 'hasNewerMutation').mockResolvedValue(false);
        jest.spyOn(service as any, 'releaseLock').mockResolvedValue(undefined);

        calculationService.calculateFromTransactions.mockReturnValue({
            totals: {
                currentBalance: 101,
                totalProfit: 1,
                totalProfitPercent: 1,
            },
            allocations: {},
            transactions: [],
        });

        calculationService.applyToPortfolio.mockImplementation(
            (portfolio: any, calculation: any, btcPrice: number, ethPrice: number, appendHistory: boolean) => {
                if (appendHistory) {
                    portfolio.history.push({
                        date: new Date(),
                        totalBalance: calculation.totals.currentBalance,
                        totalProfit: calculation.totals.totalProfit,
                        totalProfitPercent: calculation.totals.totalProfitPercent,
                        categoryDistribution: {},
                        btcPrice,
                        ethPrice,
                    });
                }
            },
        );

        const [first, second] = await Promise.all([
            service.recalculatePortfolioFromJob(portfolioId, { reason: 'cron', force: true }),
            service.recalculatePortfolioFromJob(portfolioId, { reason: 'cron', force: true }),
        ]);

        expect(first.snapshotAdded).toBe(true);
        expect(second.snapshotAdded).toBe(false);
        expect(second.skippedReason).toBe('locked-or-not-found');
        expect(lockedPortfolio.save).toHaveBeenCalledTimes(1);
        expect(lockedPortfolio.history).toHaveLength(2);
    });

    it('drains all due baseline snapshot candidates across multiple batches', async () => {
        const { service, portfolioModel } = createService();
        const portfolioIds = [
            '507f1f77bcf86cd799439011',
            '507f1f77bcf86cd799439012',
            '507f1f77bcf86cd799439013',
        ];
        const createFindChain = (items: Array<{ _id: string }>) => {
            const chain = {
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(items),
            };

            return chain;
        };

        (service as any).snapshotBatchSize = 2;
        portfolioModel.find
            .mockReturnValueOnce(createFindChain([
                { _id: portfolioIds[0] },
                { _id: portfolioIds[1] },
            ]))
            .mockReturnValueOnce(createFindChain([
                { _id: portfolioIds[2] },
            ]));
        jest.spyOn(service as any, 'recalculatePortfolio').mockResolvedValue({
            portfolio: null,
            calculation: null,
            recalculated: true,
            snapshotAdded: true,
        });

        const result = await service.recalculateActivePortfoliosBatch({
            reason: 'cron',
            scope: 'snapshot-baseline',
        });

        expect(portfolioModel.find).toHaveBeenCalledTimes(2);
        expect((service as any).recalculatePortfolio).toHaveBeenCalledTimes(3);
        expect(result.candidates).toBe(3);
        expect(result.processed).toBe(3);
        expect(result.snapshots).toBe(3);
    });

    it('uses the snapshot check throttle in active snapshot candidate selection', async () => {
        const { service, portfolioModel } = createService();
        portfolioModel.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
        });

        await service.recalculateActivePortfoliosBatch({
            reason: 'cron',
            scope: 'snapshot-active',
        });

        expect(
            JSON.stringify(portfolioModel.find.mock.calls[0][0]),
        ).toContain('lastHistorySnapshotCheckAt');
    });

    it('sorts baseline candidates by snapshot check time before stale snapshot time', async () => {
        const { service, portfolioModel } = createService();
        const findChain = {
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
        };
        portfolioModel.find.mockReturnValue(findChain);

        await service.recalculateActivePortfoliosBatch({
            reason: 'cron',
            scope: 'snapshot-baseline',
        });

        const sort = findChain.sort.mock.calls[0][0];
        expect(Object.keys(sort).slice(0, 2)).toEqual([
            'lastHistorySnapshotCheckAt',
            'lastHistorySnapshotAt',
        ]);
        expect(sort).toMatchObject({
            lastHistorySnapshotCheckAt: 1,
            lastHistorySnapshotAt: 1,
        });
    });

    it('builds historical portfolio snapshots from past transaction date and market history', async () => {
        const { service, marketSnapshotModel, marketHistoryModel, calculationService } = createService();
        const marketAssetId = '507f1f77bcf86cd799439021';
        const transaction = {
            _id: '507f1f77bcf86cd799439031',
            marketAssetId,
            projectId: marketAssetId,
            type: 'buy',
            quantity: 2,
            price: 10,
            total: 20,
            feeAmount: 0,
            date: new Date('2026-04-15T10:00:00.000Z'),
            currency: 'abc',
        };
        const findChain = (rows: any[]) => ({
            select: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(rows),
        });
        const aggregateChain = (rows: any[]) => ({
            allowDiskUse: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(rows),
        });

        jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-18T10:00:00.000Z').getTime());
        marketSnapshotModel.find.mockReturnValue(findChain([]));
        marketHistoryModel.find.mockReturnValue(findChain([
            {
                marketAssetId,
                bucketTimestamp: new Date('2026-04-17T10:00:00.000Z'),
                price: 15,
            },
        ]));
        marketSnapshotModel.aggregate.mockReturnValue(aggregateChain([]));
        marketHistoryModel.aggregate.mockReturnValue(aggregateChain([
            {
                marketAssetId,
                bucketTimestamp: new Date('2026-04-16T10:00:00.000Z'),
                price: 12,
            },
        ]));
        calculationService.calculateFromTransactions.mockImplementation(
            (_transactions: any[], prices: Record<string, number>) => {
                const currentBalance = Number(prices[marketAssetId] || 0) * 2;
                return {
                    projects: [],
                    transactions: [],
                    totals: {
                        currentBalance,
                        totalInvested: 20,
                        lifetimeInvested: 20,
                        realizedCostBasis: 0,
                        realizedProfit: 0,
                        unrealizedProfit: currentBalance - 20,
                        totalProfit: currentBalance - 20,
                        totalProfitPercent: ((currentBalance - 20) / 20) * 100,
                        totalFees: 0,
                    },
                    allocations: {},
                };
            },
        );

        const history = await (service as any).buildHistoricalPortfolioHistory(
            createPortfolio(),
            [transaction],
            { [marketAssetId]: 'Other' },
            {},
            1,
            1,
        );

        expect(history.map((item: any) => item.date.toISOString())).toEqual([
            '2026-04-15T10:00:00.000Z',
            '2026-04-16T10:00:00.000Z',
            '2026-04-17T10:00:00.000Z',
        ]);
        expect(history.map((item: any) => item.totalBalance)).toEqual([20, 24, 30]);
        expect(marketHistoryModel.find).toHaveBeenCalledWith(
            expect.objectContaining({
                marketAssetId: expect.any(Object),
                price: { $gt: 0 },
            }),
        );
    });

    it('replaces stale history points inside regenerated event window', () => {
        const { service } = createService();
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-18T10:00:00.000Z').getTime());

        const merged = (service as any).mergePortfolioHistory(
            [
                {
                    date: new Date('2026-04-14T10:00:00.000Z'),
                    totalBalance: 50,
                },
                {
                    date: new Date('2026-04-16T12:00:00.000Z'),
                    totalBalance: 999,
                },
            ],
            [
                {
                    date: new Date('2026-04-15T10:00:00.000Z'),
                    totalBalance: 20,
                },
                {
                    date: new Date('2026-04-17T10:00:00.000Z'),
                    totalBalance: 30,
                },
            ],
            true,
        );

        expect(merged.map((item: any) => item.totalBalance)).toEqual([20, 30]);
    });

    it('rebuilds historical backfill only when history is uncovered or explicitly replaced', () => {
        const { service } = createService();
        const transaction = { date: new Date('2026-04-15T10:00:00.000Z') };
        const coveredPortfolio = createPortfolio({
            historyBackfillVersion: 1,
            history: [
                {
                    date: new Date('2026-04-15T10:00:30.000Z'),
                    totalBalance: 20,
                },
            ],
        });
        const uncoveredPortfolio = createPortfolio({
            historyBackfillVersion: 1,
            history: [
                {
                    date: new Date('2026-04-15T11:00:00.000Z'),
                    totalBalance: 20,
                },
            ],
        });

        expect(
            (service as any).shouldBuildHistoricalHistory(
                coveredPortfolio,
                [transaction],
                false,
            ),
        ).toBe(false);
        expect(
            (service as any).shouldBuildHistoricalHistory(
                uncoveredPortfolio,
                [transaction],
                false,
            ),
        ).toBe(true);
        expect(
            (service as any).shouldBuildHistoricalHistory(
                coveredPortfolio,
                [transaction],
                true,
            ),
        ).toBe(true);
        expect((service as any).shouldReplaceHistoricalHistoryWindow('market-data')).toBe(false);
        expect((service as any).shouldReplaceHistoricalHistoryWindow('event:reorder-assets')).toBe(false);
        expect((service as any).shouldReplaceHistoricalHistoryWindow('manual')).toBe(true);
    });

    it('clears stale history when an event leaves no historical transactions', async () => {
        const { service, portfolioModel, calculationService } = createService();
        const lockedPortfolio = createPortfolio({
            assets: [],
            history: [
                {
                    date: new Date('2026-04-15T10:00:00.000Z'),
                    totalBalance: 100,
                    totalProfit: 10,
                    totalProfitPercent: 10,
                },
            ],
            lastHistorySnapshotAt: new Date('2026-04-15T10:00:00.000Z'),
        });

        portfolioModel.findOneAndUpdate.mockResolvedValueOnce(lockedPortfolio);
        portfolioModel.findById.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ lastMutationAt: null }),
        });
        portfolioModel.updateOne.mockResolvedValue({ matchedCount: 1 });
        jest.spyOn(service as any, 'getLedgerTransactions').mockResolvedValue([]);
        jest.spyOn(service as any, 'getProjectMarketData').mockResolvedValue({ prices: {}, categories: {} });
        jest.spyOn(service as any, 'getBTCAndETHPrices').mockResolvedValue({ btcPrice: 1, ethPrice: 1 });
        jest.spyOn(service as any, 'getAssetIndexMap').mockReturnValue({});
        jest.spyOn(service as any, 'updateTransactionsFromCalculation').mockResolvedValue(undefined);

        calculationService.calculateFromTransactions.mockReturnValue({
            projects: [],
            transactions: [],
            totals: {
                currentBalance: 0,
                totalInvested: 0,
                lifetimeInvested: 0,
                realizedCostBasis: 0,
                realizedProfit: 0,
                unrealizedProfit: 0,
                totalProfit: 0,
                totalProfitPercent: 0,
                totalFees: 0,
            },
            allocations: {},
        });
        calculationService.applyToPortfolio.mockImplementation((portfolio: any) => {
            portfolio.history = portfolio.history || [];
        });

        await service.recalculatePortfolioFromJob(portfolioId, {
            reason: 'event:remove-assets',
            force: true,
        });

        expect(lockedPortfolio.history).toEqual([]);
        expect((lockedPortfolio as any).lastHistorySnapshotAt).toBeUndefined();
        expect(lockedPortfolio.save).toHaveBeenCalled();
    });

    it('keeps existing history when a forced rebuild has transactions but produces no historical points', async () => {
        const { service, portfolioModel, calculationService } = createService();
        const existingHistory = [
            {
                date: new Date('2026-04-15T10:00:00.000Z'),
                totalBalance: 100,
                totalProfit: 10,
                totalProfitPercent: 10,
            },
        ];
        const lockedPortfolio = createPortfolio({
            history: existingHistory,
            lastHistorySnapshotAt: new Date('2026-04-15T10:00:00.000Z'),
        });
        const transaction = {
            date: new Date('2026-04-15T10:00:00.000Z'),
            projectId: '507f1f77bcf86cd799439021',
            price: 1,
        };

        portfolioModel.findOneAndUpdate.mockResolvedValueOnce(lockedPortfolio);
        portfolioModel.findById.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ lastMutationAt: null }),
        });
        portfolioModel.updateOne.mockResolvedValue({ matchedCount: 1 });
        jest.spyOn(service as any, 'getLedgerTransactions').mockResolvedValue([transaction]);
        jest.spyOn(service as any, 'getProjectMarketData').mockResolvedValue({
            prices: {},
            categories: {},
            versions: {},
        });
        jest.spyOn(service as any, 'getBTCAndETHPrices').mockResolvedValue({ btcPrice: 1, ethPrice: 1 });
        jest.spyOn(service as any, 'getAssetIndexMap').mockReturnValue({});
        jest.spyOn(service as any, 'buildHistoricalPortfolioHistory').mockResolvedValue([]);
        jest.spyOn(service as any, 'updateTransactionsFromCalculation').mockResolvedValue(undefined);

        calculationService.calculateFromTransactions.mockReturnValue({
            projects: [],
            transactions: [],
            totals: {
                currentBalance: 100,
                totalInvested: 90,
                lifetimeInvested: 90,
                realizedCostBasis: 0,
                realizedProfit: 0,
                unrealizedProfit: 10,
                totalProfit: 10,
                totalProfitPercent: 10,
                totalFees: 0,
            },
            allocations: {},
        });
        calculationService.applyToPortfolio.mockImplementation((portfolio: any) => {
            portfolio.history = portfolio.history || [];
        });

        await service.recalculatePortfolioFromJob(portfolioId, {
            reason: 'event:remove-assets',
            force: true,
        });

        expect(lockedPortfolio.history).toEqual(existingHistory);
        expect(lockedPortfolio.historyBackfillVersion).toBe(0);
        expect(lockedPortfolio.save).toHaveBeenCalled();
    });

    it('uses daily, hourly, and raw tiers for long historical price ranges', async () => {
        const { service, marketSnapshotModel, marketHistoryModel } = createService();
        const marketAssetId = '507f1f77bcf86cd799439021';
        const aggregateChain = (rows: any[]) => ({
            allowDiskUse: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(rows),
        });
        const findChain = (rows: any[]) => ({
            select: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(rows),
        });

        marketSnapshotModel.aggregate.mockReturnValue(aggregateChain([
            {
                marketAssetId,
                timestamp: new Date('2025-04-18T23:55:00.000Z'),
                priceUsd: 10,
            },
            {
                marketAssetId,
                timestamp: new Date('2026-04-17T23:55:00.000Z'),
                priceUsd: 20,
            },
        ]));
        marketHistoryModel.aggregate.mockReturnValue(aggregateChain([]));
        marketSnapshotModel.find.mockReturnValue(findChain([]));
        marketHistoryModel.find.mockReturnValue(findChain([]));

        const pointsByProject = await (service as any).loadHistoricalPricePoints(
            [marketAssetId],
            new Date('2025-04-18T00:00:00.000Z'),
            new Date('2026-04-18T00:00:00.000Z'),
        );

        expect(marketSnapshotModel.find).toHaveBeenCalled();
        expect(marketSnapshotModel.aggregate).toHaveBeenCalledTimes(2);
        const aggregatePipelines = marketSnapshotModel.aggregate.mock.calls
            .map(([pipeline]) => JSON.stringify(pipeline));
        expect(aggregatePipelines.some((pipeline) => pipeline.includes('%Y-%m-%dT%H'))).toBe(true);
        expect(aggregatePipelines.some((pipeline) => pipeline.includes('%Y-%m-%d'))).toBe(true);
        expect(pointsByProject.get(marketAssetId).map((point: any) => point.price)).toEqual([10, 20]);
    });

    it('keeps recalculation pending when a mutation lands during lock release', async () => {
        const { service, portfolioModel } = createService();
        const startedAt = new Date('2026-04-18T10:00:00.000Z');
        const recalculatedAt = new Date('2026-04-18T10:00:05.000Z');

        portfolioModel.updateOne
            .mockResolvedValueOnce({ matchedCount: 0 })
            .mockResolvedValueOnce({ matchedCount: 1 });

        await (service as any).releaseLock(
            portfolioId,
            {
                lastRecalculatedAt: recalculatedAt,
                needsRecalculation: false,
            },
            startedAt,
        );

        expect(portfolioModel.updateOne).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                _id: expect.any(Object),
                $and: expect.arrayContaining([
                    expect.objectContaining({
                        $or: expect.arrayContaining([
                            { lastMutationAt: { $lte: startedAt } },
                        ]),
                    }),
                    expect.objectContaining({
                        $or: expect.arrayContaining([
                            { lastMarketInvalidatedAt: { $lt: startedAt } },
                        ]),
                    }),
                ]),
            }),
            expect.objectContaining({
                $set: expect.objectContaining({
                    needsRecalculation: false,
                }),
            }),
        );
        expect(portfolioModel.updateOne).toHaveBeenNthCalledWith(
            2,
            { _id: expect.any(Object) },
            expect.objectContaining({
                $set: expect.objectContaining({
                    lastRecalculatedAt: recalculatedAt,
                    needsRecalculation: true,
                }),
            }),
        );
    });
});

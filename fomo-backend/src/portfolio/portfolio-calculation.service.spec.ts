import { PortfolioCalculationService } from './portfolio-calculation.service';

describe('PortfolioCalculationService all-time extrema', () => {
    const service = new PortfolioCalculationService();

    it('preserves stored extrema normally and recomputes them for a history rebuild', () => {
        const portfolio: any = {
            history: [
                { date: new Date('2026-01-01T00:00:00.000Z'), totalBalance: 100 },
                { date: new Date('2026-01-02T00:00:00.000Z'), totalBalance: 200 },
            ],
            ath: 1000,
            athDate: new Date('2025-01-01T00:00:00.000Z'),
            atl: 10,
            atlDate: new Date('2025-01-02T00:00:00.000Z'),
        };

        (service as any).updateAllTimeStats(portfolio, true);
        expect(portfolio).toMatchObject({ ath: 1000, atl: 10 });

        (service as any).updateAllTimeStats(portfolio, false);
        expect(portfolio).toMatchObject({
            ath: 200,
            athDate: new Date('2026-01-02T00:00:00.000Z'),
            atl: 100,
            atlDate: new Date('2026-01-01T00:00:00.000Z'),
        });
    });

    it('ignores invalid balance-like values when calculating extrema', () => {
        const portfolio: any = {
            history: [
                { date: new Date('2026-01-01T00:00:00.000Z'), totalBalance: null },
                { date: new Date('2026-01-02T00:00:00.000Z'), totalBalance: ' ' },
                { date: new Date('2026-01-03T00:00:00.000Z'), totalBalance: false },
                { date: new Date('2026-01-04T00:00:00.000Z'), totalBalance: '125' },
                { date: new Date('2026-01-05T00:00:00.000Z'), totalBalance: 150 },
            ],
        };

        (service as any).updateAllTimeStats(portfolio, false);

        expect(portfolio).toMatchObject({
            ath: 150,
            athDate: new Date('2026-01-05T00:00:00.000Z'),
            atl: 125,
            atlDate: new Date('2026-01-04T00:00:00.000Z'),
        });
    });
});

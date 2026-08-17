import { retainPortfolioHistoryByAge } from './portfolio-history-retention.util';

describe('retainPortfolioHistoryByAge', () => {
    const referenceTime = new Date('2026-08-02T12:00:00.000Z');

    const point = (id: string, date: string | Date) => ({ id, date });

    it('keeps the last point in 10 minute, hourly, and UTC-day buckets', () => {
        const history = [
            point('earliest', '2025-12-31T23:00:00.000Z'),
            point('old-first', '2026-04-24T00:05:00.000Z'),
            point('old-last', '2026-04-24T23:55:00.000Z'),
            point('middle-first', '2026-07-30T10:05:00.000Z'),
            point('middle-last', '2026-07-30T10:55:00.000Z'),
            point('recent-first', '2026-08-02T11:01:00.000Z'),
            point('recent-last', '2026-08-02T11:09:59.000Z'),
            point('latest', '2026-08-02T11:59:00.000Z'),
        ];

        expect(retainPortfolioHistoryByAge(history, referenceTime).map((item) => item.id)).toEqual([
            'earliest',
            'old-last',
            'middle-last',
            'recent-last',
            'latest',
        ]);
    });

    it('preserves chronological endpoints, ordering, and unique timestamps', () => {
        const duplicateDate = '2026-07-30T10:30:00.000Z';
        const history = [
            point('latest', '2026-08-02T11:59:00.000Z'),
            point('duplicate-first', duplicateDate),
            point('earliest', '2026-04-24T00:01:00.000Z'),
            point('same-old-day-later', '2026-04-24T23:59:00.000Z'),
            point('duplicate-last', duplicateDate),
        ];

        const retained = retainPortfolioHistoryByAge(history, referenceTime);
        const timestamps = retained.map((item) => new Date(item.date).getTime());

        expect(retained.map((item) => item.id)).toEqual([
            'earliest',
            'same-old-day-later',
            'duplicate-last',
            'latest',
        ]);
        expect(timestamps).toEqual([...timestamps].sort((left, right) => left - right));
        expect(new Set(timestamps).size).toBe(timestamps.length);
    });

    it('uses the recent tier at 24 hours and the hourly tier at 90 days', () => {
        const referenceTimestamp = referenceTime.getTime();
        const dayMs = 24 * 60 * 60 * 1000;
        const recentBoundary = referenceTimestamp - dayMs;
        const middleBoundary = referenceTimestamp - 90 * dayMs;
        const history = [
            point('old-endpoint', new Date(middleBoundary - dayMs)),
            point('middle-boundary-first', new Date(middleBoundary)),
            point('middle-boundary-last', new Date(middleBoundary + 30 * 60 * 1000)),
            point('recent-boundary-first', new Date(recentBoundary)),
            point('recent-boundary-last', new Date(recentBoundary + 5 * 60 * 1000)),
            point('latest', new Date(referenceTimestamp - 60 * 1000)),
        ];

        expect(retainPortfolioHistoryByAge(history, referenceTime).map((item) => item.id)).toEqual([
            'old-endpoint',
            'middle-boundary-last',
            'recent-boundary-last',
            'latest',
        ]);
    });

    it('drops invalid dates without mutating the input', () => {
        const history = [
            point('latest', '2026-08-02T11:59:00.000Z'),
            point('invalid', 'not-a-date'),
            point('future', '2026-08-02T12:01:00.000Z'),
            point('earliest', '2026-08-02T11:00:00.000Z'),
        ];
        const originalOrder = history.map((item) => item.id);

        expect(retainPortfolioHistoryByAge(history, referenceTime).map((item) => item.id)).toEqual([
            'earliest',
            'latest',
        ]);
        expect(history.map((item) => item.id)).toEqual(originalOrder);
    });

    it('keeps all-time balance extrema even when later points win their buckets', () => {
        const history = [
            { ...point('earliest', '2026-04-24T00:01:00.000Z'), totalBalance: 100 },
            { ...point('minimum', '2026-04-24T08:00:00.000Z'), totalBalance: 10 },
            { ...point('maximum', '2026-04-24T12:00:00.000Z'), totalBalance: 1000 },
            { ...point('daily-close', '2026-04-24T23:59:00.000Z'), totalBalance: 120 },
            { ...point('latest', '2026-08-02T11:59:00.000Z'), totalBalance: 130 },
        ];

        expect(retainPortfolioHistoryByAge(history, referenceTime).map((item) => item.id)).toEqual([
            'earliest',
            'minimum',
            'maximum',
            'daily-close',
            'latest',
        ]);
    });

    it('does not treat null, blank, or boolean balances as a zero ATL', () => {
        const history = [
            { ...point('earliest', '2026-04-24T00:01:00.000Z'), totalBalance: 100 },
            { ...point('null', '2026-04-24T08:00:00.000Z'), totalBalance: null },
            { ...point('blank', '2026-04-24T09:00:00.000Z'), totalBalance: ' ' },
            { ...point('boolean', '2026-04-24T10:00:00.000Z'), totalBalance: false },
            { ...point('daily-close', '2026-04-24T23:59:00.000Z'), totalBalance: 120 },
            { ...point('latest', '2026-08-02T11:59:00.000Z'), totalBalance: 130 },
        ];

        expect(retainPortfolioHistoryByAge(history, referenceTime).map((item) => item.id)).toEqual([
            'earliest',
            'daily-close',
            'latest',
        ]);
    });
});

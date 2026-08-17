export type PortfolioHistoryDate = Date | string | number;

export interface TimestampedPortfolioHistoryPoint {
    date: PortfolioHistoryDate;
    totalBalance?: unknown;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RECENT_WINDOW_MS = DAY_MS;
const MIDDLE_WINDOW_MS = 90 * DAY_MS;

interface IndexedHistoryPoint<T> {
    point: T;
    timestamp: number;
    inputIndex: number;
}

/**
 * Retains the last observation in age-tiered UTC buckets. Chronological
 * endpoints are retained in addition to bucket representatives, so the
 * earliest point is never lost when another point shares its bucket.
 */
export function retainPortfolioHistoryByAge<T extends TimestampedPortfolioHistoryPoint>(
    history: readonly T[],
    referenceTime: PortfolioHistoryDate = Date.now(),
): T[] {
    const referenceTimestamp = toTimestamp(referenceTime);
    if (referenceTimestamp === null) {
        throw new RangeError('Portfolio history retention requires a valid reference time');
    }

    const uniquePoints = new Map<number, IndexedHistoryPoint<T>>();

    history.forEach((point, inputIndex) => {
        const timestamp = toTimestamp(point?.date);
        if (timestamp === null || timestamp > referenceTimestamp) return;

        // Exact timestamp collisions follow the same last-observation-wins rule.
        uniquePoints.set(timestamp, { point, timestamp, inputIndex });
    });

    const orderedPoints = Array.from(uniquePoints.values()).sort((left, right) => {
        return left.timestamp - right.timestamp || left.inputIndex - right.inputIndex;
    });
    if (orderedPoints.length <= 2) {
        return orderedPoints.map((item) => item.point);
    }

    const lastPointByBucket = new Map<string, IndexedHistoryPoint<T>>();
    for (const item of orderedPoints) {
        const ageMs = referenceTimestamp - item.timestamp;
        const { tier, bucketMs } = getRetentionBucket(ageMs);
        const bucketIndex = Math.floor(item.timestamp / bucketMs);
        lastPointByBucket.set(`${tier}:${bucketIndex}`, item);
    }

    const retainedByTimestamp = new Map<number, IndexedHistoryPoint<T>>();
    for (const item of lastPointByBucket.values()) {
        retainedByTimestamp.set(item.timestamp, item);
    }

    const earliest = orderedPoints[0];
    const latest = orderedPoints[orderedPoints.length - 1];
    retainedByTimestamp.set(earliest.timestamp, earliest);
    retainedByTimestamp.set(latest.timestamp, latest);

    let minimumBalancePoint: IndexedHistoryPoint<T> | undefined;
    let maximumBalancePoint: IndexedHistoryPoint<T> | undefined;
    for (const item of orderedPoints) {
        const balance = toFiniteBalance(item.point.totalBalance);
        if (balance === null) continue;

        if (
            !minimumBalancePoint
            || balance < (toFiniteBalance(minimumBalancePoint.point.totalBalance) as number)
        ) {
            minimumBalancePoint = item;
        }
        if (
            !maximumBalancePoint
            || balance > (toFiniteBalance(maximumBalancePoint.point.totalBalance) as number)
        ) {
            maximumBalancePoint = item;
        }
    }

    if (minimumBalancePoint) {
        retainedByTimestamp.set(minimumBalancePoint.timestamp, minimumBalancePoint);
    }
    if (maximumBalancePoint) {
        retainedByTimestamp.set(maximumBalancePoint.timestamp, maximumBalancePoint);
    }

    return Array.from(retainedByTimestamp.values())
        .sort((left, right) => left.timestamp - right.timestamp)
        .map((item) => item.point);
}

function getRetentionBucket(ageMs: number): { tier: string; bucketMs: number } {
    if (ageMs <= RECENT_WINDOW_MS) {
        return { tier: 'recent', bucketMs: 10 * MINUTE_MS };
    }

    if (ageMs <= MIDDLE_WINDOW_MS) {
        return { tier: 'middle', bucketMs: HOUR_MS };
    }

    return { tier: 'old', bucketMs: DAY_MS };
}

function toTimestamp(value: PortfolioHistoryDate): number | null {
    const timestamp = value instanceof Date
        ? value.getTime()
        : typeof value === 'number'
            ? value
            : new Date(value).getTime();

    return Number.isFinite(timestamp) ? timestamp : null;
}

function toFiniteBalance(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value !== 'string' || !value.trim()) return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

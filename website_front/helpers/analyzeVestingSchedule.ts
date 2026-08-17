interface RoundSnapshot {
    name: string;
    unlockedPercent: number; // процент от общей эмиссии, который разблокировался в этот месяц для этого раунда
    unlockedTokens?: number;
}

interface ChartEntry {
    date: string; // ISO
    unlockedPercentInPeriod?: number;
    cumulativeUnlockedPercent?: number;
    roundSnapshots?: RoundSnapshot[]; // опционально — если есть, используем его
}

interface TokenUnlockProgress {
    unlockedTokensPercent: number; // % от этого раунда, уже разблокировано
    lockedTokensPercent: number;
    totalTokensAmount: number;
    lastTokenUnlockDate?: string | null;
    nextTokenUnlockDate?: string | null;
    lockedTokensAmount?:number
    unlockedTokensAmount?:number
}

interface Allocation {
    id: number;
    name: string;
    tokensAllocatedAmount: number;
    tokensAllocatedPercent: number; // % от полной эмиссии (total supply)
    tokenUnlockProgress?: TokenUnlockProgress | null;
}

interface UnlockEntry {
    allocations: Allocation[];
    chart?: ChartEntry[];
    tgeDate?: string | null; // Token Generation Event
    vesting?: any[]
    unlocksData: any
}

// Результат таблицы
export interface UnlockTableRow {
    id: number
    progress?: TokenUnlockProgress | null
    round: string;
    allocatedTokens: number;
    allocatedPercent: number;
    cliffPeriod: string | null;   // дата первой разблокировки (если может быть определена)
    vestingPeriod: string | null; // дата последней разблокировки (если есть)
    monthlyUnlockPercent: number | string; // средний % от самого раунда в месяц (0..100) или 'Varies'
    monthlyUnlockPercentSource: 'chart' | 'estimate' | 'unknown';
    tgePercent?: number
    unlockDetails: any
    timeline?: any
}


function formatMonthsRange(start: Date | null, end: Date | null, tgeDate: Date | null): string | null {
    if (!start && !end) return null;

    if (tgeDate && start) {
        const startM = monthsBetweenInclusive(tgeDate, start);
        const endM = end ? monthsBetweenInclusive(tgeDate, end) : null;

        if (startM && endM && startM !== endM) {
            return `${startM}–${endM} months`;
        } else if (startM) {
            return `${startM} months`;
        }
    }

    if (end && tgeDate) {
        const endM = monthsBetweenInclusive(tgeDate, end);
        return `${endM} months`;
    }

    return null;
}

function formatMonthlyUnlock(value: number | string): string {
    if (typeof value === 'string') {
        if (value === 'Varies') return 'Varies per month';
        if (value === 'Instant') return 'Instant Unlock';
        return value;
    }
    return `${value}% per month`;
}

function monthsBetweenInclusive(start: Date, end: Date): number {
    if (end < start) return 0;
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function safeLowerTrim(s?: string | null) {
    return (s || '').trim().toLowerCase();
}

function formatCliff(firstUnlockDate: Date | null, tgeDate: Date | null): string | null {
    if (!firstUnlockDate || !tgeDate) return null;
    const months = monthsBetweenInclusive(tgeDate, firstUnlockDate) - 1;
    if (months <= 0) return null;
    return `${months} months`;
}

function formatVesting(firstUnlockDate: Date | null, lastUnlockDate: Date | null, tgeDate: Date | null, fullyUnlocked: boolean): string | null {
    if (fullyUnlocked) return "100% at TGE";
    if (!firstUnlockDate || !lastUnlockDate || !tgeDate) return null;

    const startM = monthsBetweenInclusive(tgeDate, firstUnlockDate);
    const endM = monthsBetweenInclusive(tgeDate, lastUnlockDate);

    if (startM !== endM) return `${endM - startM} months`;
    return `${endM} months`;
}


export function analyzeVestingSchedule(entry: UnlockEntry): UnlockTableRow[] {
    const allocations = entry.allocations || [];
    const chart = entry.chart || [];
    const tgeDate = entry.tgeDate ? new Date(entry.tgeDate) : null;

    const chartHasRoundSnapshots = chart.some(c => Array.isArray(c.roundSnapshots) && c.roundSnapshots.length > 0);

    return allocations.map(allocation => {
        const name = allocation.name;
        const allocatedTokens = allocation.tokensAllocatedAmount || 0;
        const allocatedPercent = allocation.tokensAllocatedPercent || 0;
        const progress = allocation.tokenUnlockProgress || null;

        let firstUnlockDate: Date | null = null;
        let lastUnlockDate: Date | null = null;
        let monthlyUnlockPercent: number | string = 'Varies';
        let monthlyUnlockPercentSource: UnlockTableRow['monthlyUnlockPercentSource'] = 'unknown';
        let timeline = '';
        let isInstantUnlock = false;

        if (chartHasRoundSnapshots) {
            const unlocks: { date: string; percentOfAllocation: number }[] = [];

            for (const c of chart) {
                const rs: RoundSnapshot[] = c.roundSnapshots || [];
                const snap = rs.find(r => safeLowerTrim(r.name) === safeLowerTrim(name));

                if (snap && snap.unlockedPercent > 0 && allocatedPercent > 0) {
                    const percentOfAllocation = (snap.unlockedPercent / allocatedPercent) * 100;
                    if (Number.isFinite(percentOfAllocation)) {
                        unlocks.push({ date: c.date, percentOfAllocation });
                    }
                }
            }

            if (unlocks.length > 0) {
                firstUnlockDate = new Date(unlocks[0].date);
                lastUnlockDate = new Date(unlocks[unlocks.length - 1].date);

                // Проверяем, была ли разблокировка 100% в один момент
                const totalUnlocked = unlocks.reduce((sum, u) => sum + u.percentOfAllocation, 0);

                if (Math.abs(totalUnlocked - 100) < 0.01 && unlocks.length === 1) {
                    // 100% разблокировано в один момент
                    isInstantUnlock = true;
                    monthlyUnlockPercent = 'Instant';
                    monthlyUnlockPercentSource = 'chart';
                } else {
                    // Постепенная разблокировка
                    const months = monthsBetweenInclusive(firstUnlockDate, lastUnlockDate);

                    if (months > 0) {
                        const avg = +(totalUnlocked / months).toFixed(2);
                        const isUniform = unlocks.every(u => Math.abs(u.percentOfAllocation - avg) < 0.01);

                        if (isUniform) {
                            monthlyUnlockPercent = avg;
                            monthlyUnlockPercentSource = 'chart';
                        } else {
                            monthlyUnlockPercent = 'Varies';
                            monthlyUnlockPercentSource = 'chart';
                        }
                    }
                }
            }
        }

        // Дополнительная проверка через progress
        if (!isInstantUnlock && progress?.unlockedTokensPercent === 100 && progress?.lastTokenUnlockDate) {
            const unlockDate = new Date(progress.lastTokenUnlockDate);
            if (tgeDate && unlockDate.getTime() === tgeDate.getTime()) {
                isInstantUnlock = true;
                monthlyUnlockPercent = 'Instant';
                monthlyUnlockPercentSource = 'estimate';
                if (!firstUnlockDate) firstUnlockDate = tgeDate;
                if (!lastUnlockDate) lastUnlockDate = tgeDate;
            }
        }

        // Если не Instant, но есть данные о вестинге
        if (!isInstantUnlock && monthlyUnlockPercent === 'Varies' && progress?.lastTokenUnlockDate) {
            const startDate = tgeDate ?? (progress.nextTokenUnlockDate ? new Date(progress.nextTokenUnlockDate) : null);
            const endDate = new Date(progress.lastTokenUnlockDate);

            if (startDate && endDate > startDate) {
                const months = monthsBetweenInclusive(startDate, endDate);
                if (months > 0) {
                    monthlyUnlockPercent = +(100 / months).toFixed(2);
                    monthlyUnlockPercentSource = 'estimate';
                    if (!firstUnlockDate) firstUnlockDate = startDate;
                    if (!lastUnlockDate) lastUnlockDate = endDate;
                }
            }
        }

        // Создаем timeline
        if (isInstantUnlock) {
            const isVestedAtTGE = firstUnlockDate && tgeDate &&
                (firstUnlockDate.getTime() === tgeDate.getTime());

            if (isVestedAtTGE) {
                timeline = 'Vested at TGE';
            } else {
                timeline = '100% at TGE';
            }
        } else if (firstUnlockDate && tgeDate && lastUnlockDate) {
            const cliffMonths = monthsBetweenInclusive(tgeDate, firstUnlockDate) - 1;

            if (cliffMonths > 0) {
                // Есть cliff период
                const years = Math.floor(cliffMonths / 12);
                const months = (cliffMonths % 12);

                let cliffText = '';
                if (years > 0) {
                    cliffText += `${years} year${years > 1 ? 's' : ''}`;
                }
                if (months > 0) {
                    if (cliffText) cliffText += ' ';
                    cliffText += `${months} month${months > 1 ? 's' : ''}`;
                }

                timeline = `${cliffText}-cliff, then `;
            } else {
                timeline = '';
            }

            if (typeof monthlyUnlockPercent === 'number') {
                const vestingMonths = monthsBetweenInclusive(firstUnlockDate, lastUnlockDate) - 1;
                timeline += `${monthlyUnlockPercent}% monthly for ${vestingMonths} month${vestingMonths > 1 ? 's' : ''}`;
            } else {
                timeline += 'variable unlock schedule';
            }
        } else {
            timeline = 'No unlock schedule available';
        }

        const tgePercent: number = entry?.vesting?.find((item: any) => item.id === allocation.id)?.tgePercent || 0;

        return {
            id: allocation.id,
            round: name,
            allocatedTokens,
            allocatedPercent,
            cliffPeriod: isInstantUnlock ? null : formatCliff(firstUnlockDate, tgeDate),
            vestingPeriod: isInstantUnlock ? "100% at TGE" : formatVesting(firstUnlockDate, lastUnlockDate, tgeDate, false),
            monthlyUnlockPercent: monthlyUnlockPercent === 100 ? 'Instant Unlock' : formatMonthlyUnlock(monthlyUnlockPercent),
            monthlyUnlockPercentSource,
            progress: allocation.tokenUnlockProgress,
            tgePercent,
            unlockDetails: entry.unlocksData,
            timeline: timeline
        };
    });
}

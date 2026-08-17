import { Injectable, Logger } from '@nestjs/common';
import { PortfolioHistory, Transaction, TransactionType } from './model/portfolio.model';
import { retainPortfolioHistoryByAge } from './portfolio-history-retention.util';

export interface PortfolioCalculationProject {
    projectId: string;
    marketAssetId?: string;
    canonicalProjectId?: string;
    quantity: number;
    currentPrice: number;
    currentValue: number;
    costBasis: number;
    averageBuyPrice: number;
    realizedProfit: number;
    unrealizedProfit: number;
    totalProfit: number;
    profitPercent: number;
    allocationPercent: number;
    totalBought: number;
    totalSold: number;
    totalFees: number;
    category: string;
    currency: string;
    lastTransactionDate?: Date;
    maxIndex?: number;
}

export interface PortfolioCalculatedTransaction {
    id?: string;
    projectId: string;
    type: TransactionType;
    quantity: number;
    price: number;
    grossAmount: number;
    feeAmount: number;
    netAmount: number;
    gainLoss: number;
    gainLossPercent: number;
    costBasis: number;
    date: Date;
}

export interface PortfolioCalculationResult {
    projects: PortfolioCalculationProject[];
    transactions: PortfolioCalculatedTransaction[];
    totals: {
        currentBalance: number;
        totalInvested: number;
        lifetimeInvested: number;
        realizedCostBasis: number;
        realizedProfit: number;
        unrealizedProfit: number;
        totalProfit: number;
        totalProfitPercent: number;
        totalFees: number;
    };
    allocations: Record<string, number>;
}

interface ProjectState {
    projectId: string;
    marketAssetId?: string;
    canonicalProjectId?: string;
    quantity: number;
    costBasis: number;
    totalBought: number;
    totalSold: number;
    totalBuyCost: number;
    realizedCostBasis: number;
    realizedProfit: number;
    totalFees: number;
    currency: string;
    lastTransactionDate?: Date;
    maxIndex?: number;
}

@Injectable()
export class PortfolioCalculationService {
    private readonly logger = new Logger(PortfolioCalculationService.name);
    private readonly maxReasonableTransactionGross = Number(process.env.PORTFOLIO_MAX_TRANSACTION_GROSS || 1_000_000_000_000);
    private readonly maxGrossToTotalRatio = Number(process.env.PORTFOLIO_MAX_GROSS_TO_TOTAL_RATIO || 1000);
    private readonly maxFeePercent = Number(process.env.PORTFOLIO_MAX_FEE_PERCENT || 100);
    private readonly maxFeeToGrossRatio = Number(process.env.PORTFOLIO_MAX_FEE_TO_GROSS_RATIO || 1);
    private readonly minPerformanceBaseline = Number(process.env.PORTFOLIO_MIN_PERFORMANCE_BASELINE || 0.01);
    private readonly oneHourBaselineToleranceMinutes = Number(process.env.PORTFOLIO_1H_BASELINE_TOLERANCE_MINUTES || 10);

    calculateFromTransactions(
        transactions: Array<Transaction | any>,
        prices: Record<string, number>,
        categories: Record<string, string>,
        assetIndexes: Record<string, number> = {},
    ): PortfolioCalculationResult {
        const states = new Map<string, ProjectState>();
        const calculatedTransactions: PortfolioCalculatedTransaction[] = [];
        const sortedTransactions = [...(transactions || [])].sort((a, b) => {
            const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            return String(a._id || '').localeCompare(String(b._id || ''));
        });

        for (const tx of sortedTransactions) {
            const projectId = this.getProjectId(tx.marketAssetId || tx.projectId);
            if (!projectId) continue;

            const state = this.getProjectState(states, projectId, tx.currency || 'TKN', assetIndexes[projectId]);
            state.marketAssetId = projectId;
            state.canonicalProjectId = this.getProjectId(tx.canonicalProjectId) || state.canonicalProjectId;
            const quantity = this.toNonNegativeNumber(tx.quantity);
            const price = this.toNonNegativeNumber(tx.price);
            const grossAmount = this.getGrossAmount(tx, quantity, price);

            if (!this.isReasonableGross(grossAmount)) {
                this.logger.warn(
                    `Skipping corrupt portfolio transaction id=${tx._id || 'unknown'} project=${projectId} gross=${grossAmount}`,
                );
                continue;
            }

            const feeAmount = this.getFeeValue(tx, grossAmount);
            let gainLoss = 0;
            let gainLossPercent = 0;
            let removedCostBasis = 0;
            let netAmount = grossAmount;

            state.lastTransactionDate = tx.date;

            if (tx.type === 'buy') {
                const buyCost = grossAmount + feeAmount;
                state.quantity += quantity;
                state.costBasis += buyCost;
                state.totalBought += quantity;
                state.totalBuyCost += buyCost;
                state.totalFees += feeAmount;
                netAmount = buyCost;
            }

            if (tx.type === 'sell') {
                const executableQuantity = Math.min(quantity, state.quantity);
                const executableRatio = quantity > 0 ? executableQuantity / quantity : 0;
                const avgCost = state.quantity > 0 ? state.costBasis / state.quantity : 0;
                removedCostBasis = avgCost * executableQuantity;
                const executableNetProceeds = (grossAmount - feeAmount) * executableRatio;

                gainLoss = executableNetProceeds - removedCostBasis;
                gainLossPercent = removedCostBasis > 0 ? (gainLoss / removedCostBasis) * 100 : 0;
                netAmount = grossAmount - feeAmount;

                state.quantity -= executableQuantity;
                state.costBasis -= removedCostBasis;
                state.totalSold += executableQuantity;
                state.realizedCostBasis += removedCostBasis;
                state.realizedProfit += gainLoss;
                state.totalFees += feeAmount;

                if (state.quantity < 0.00000001) state.quantity = 0;
                if (state.costBasis < 0.00000001) state.costBasis = 0;
            }

            calculatedTransactions.push({
                id: tx._id?.toString?.(),
                projectId,
                type: tx.type,
                quantity: this.roundToken(quantity),
                price: this.roundMoney(price),
                grossAmount: this.roundMoney(grossAmount),
                feeAmount: this.roundMoney(feeAmount),
                netAmount: this.roundMoney(netAmount),
                gainLoss: this.roundMoney(gainLoss),
                gainLossPercent: this.roundPercent(gainLossPercent),
                costBasis: this.roundMoney(removedCostBasis),
                date: tx.date,
            });
        }

        const openProjects = Array.from(states.values())
            .filter((state) => state.quantity > 0)
            .map((state) => {
                const currentPrice = prices[state.projectId] || 0;
                const currentValue = state.quantity * currentPrice;
                const unrealizedProfit = currentValue - state.costBasis;
                const totalProfit = state.realizedProfit + unrealizedProfit;

                return {
                    projectId: state.projectId,
                    marketAssetId: state.marketAssetId || state.projectId,
                    canonicalProjectId: state.canonicalProjectId,
                    quantity: this.roundToken(state.quantity),
                    currentPrice: this.roundMoney(currentPrice),
                    currentValue: this.roundMoney(currentValue),
                    costBasis: this.roundMoney(state.costBasis),
                    averageBuyPrice: state.quantity > 0 ? this.roundMoney(state.costBasis / state.quantity) : 0,
                    realizedProfit: this.roundMoney(state.realizedProfit),
                    unrealizedProfit: this.roundMoney(unrealizedProfit),
                    totalProfit: this.roundMoney(totalProfit),
                    profitPercent: state.costBasis > 0
                        ? this.roundPercent((unrealizedProfit / state.costBasis) * 100)
                        : 0,
                    allocationPercent: 0,
                    totalBought: this.roundToken(state.totalBought),
                    totalSold: this.roundToken(state.totalSold),
                    totalFees: this.roundMoney(state.totalFees),
                    category: categories[state.projectId] || 'Other',
                    currency: state.currency,
                    lastTransactionDate: state.lastTransactionDate,
                    maxIndex: state.maxIndex,
                };
            });

        const totals = openProjects.reduce((acc, project) => {
            acc.currentBalance += project.currentValue;
            acc.totalInvested += project.costBasis;
            acc.unrealizedProfit += project.unrealizedProfit;
            return acc;
        }, {
            currentBalance: 0,
            totalInvested: 0,
            lifetimeInvested: 0,
            realizedCostBasis: 0,
            realizedProfit: 0,
            unrealizedProfit: 0,
            totalProfit: 0,
            totalProfitPercent: 0,
            totalFees: 0,
        });

        for (const state of states.values()) {
            totals.lifetimeInvested += state.totalBuyCost;
            totals.realizedCostBasis += state.realizedCostBasis;
            totals.realizedProfit += state.realizedProfit;
            totals.totalFees += state.totalFees;
        }

        totals.totalProfit = totals.realizedProfit + totals.unrealizedProfit;
        totals.totalProfitPercent = totals.lifetimeInvested > 0
            ? (totals.totalProfit / totals.lifetimeInvested) * 100
            : 0;

        const allocations = this.buildAllocations(openProjects, totals.currentBalance);
        const projects = openProjects
            .map((project) => ({
                ...project,
                allocationPercent: allocations[project.category] && totals.currentBalance > 0
                    ? this.roundPercent((project.currentValue / totals.currentBalance) * 100)
                    : 0,
            }))
            .sort((a, b) => {
                const indexA = typeof a.maxIndex === 'number' ? a.maxIndex : -1;
                const indexB = typeof b.maxIndex === 'number' ? b.maxIndex : -1;
                return indexB - indexA;
            });

        return {
            projects,
            transactions: calculatedTransactions,
            totals: {
                currentBalance: this.roundMoney(totals.currentBalance),
                totalInvested: this.roundMoney(totals.totalInvested),
                lifetimeInvested: this.roundMoney(totals.lifetimeInvested),
                realizedCostBasis: this.roundMoney(totals.realizedCostBasis),
                realizedProfit: this.roundMoney(totals.realizedProfit),
                unrealizedProfit: this.roundMoney(totals.unrealizedProfit),
                totalProfit: this.roundMoney(totals.totalProfit),
                totalProfitPercent: this.roundPercent(totals.totalProfitPercent),
                totalFees: this.roundMoney(totals.totalFees),
            },
            allocations,
        };
    }

    applyToPortfolio(
        portfolio: any,
        calculation: PortfolioCalculationResult,
        btcPrice: number,
        ethPrice: number,
        appendHistory = true,
        preserveStoredExtrema = true,
    ): void {
        const historyReferenceTime = new Date();
        portfolio.totalBalance = calculation.totals.currentBalance;
        portfolio.profit = calculation.totals.totalProfit;
        portfolio.profitPercent = calculation.totals.totalProfitPercent;
        portfolio.realizedProfit = calculation.totals.realizedProfit;
        portfolio.unrealizedProfit = calculation.totals.unrealizedProfit;
        portfolio.totalInvested = calculation.totals.totalInvested;
        portfolio.categoryDistribution = calculation.allocations;
        portfolio.calculatedAssets = calculation.projects.map((project) => ({
            projectId: project.projectId,
            marketAssetId: project.marketAssetId || project.projectId,
            canonicalProjectId: project.canonicalProjectId,
            quantity: project.quantity,
            currentPrice: project.currentPrice,
            currentValue: project.currentValue,
            invested: project.costBasis,
            averageBuyPrice: project.averageBuyPrice,
            unrealizedProfit: project.unrealizedProfit,
            profitPercent: project.profitPercent,
            realizedProfit: project.realizedProfit,
            totalProfit: project.totalProfit,
            totalFees: project.totalFees,
            allocationPercent: project.allocationPercent,
            category: project.category,
            currency: project.currency,
            index: project.maxIndex || 0,
            lastTransactionDate: project.lastTransactionDate,
        }));

        const filteredHistory = (portfolio.history || []).filter((h: any) =>
            h.totalBalance !== 0 || h.totalProfit !== 0 || h.totalProfitPercent !== 0
        );

        const hasPortfolioContent =
            calculation.totals.currentBalance > 0
            || (portfolio.assets || []).length > 0
            || filteredHistory.length > 0;

        if (appendHistory && hasPortfolioContent) {
            filteredHistory.push({
                date: historyReferenceTime,
                totalBalance: calculation.totals.currentBalance,
                totalProfit: calculation.totals.totalProfit,
                totalProfitPercent: calculation.totals.totalProfitPercent,
                totalInvested: calculation.totals.totalInvested,
                categoryDistribution: calculation.allocations,
                btcPrice: this.roundMoney(btcPrice || 1),
                ethPrice: this.roundMoney(ethPrice || 1),
                isApproximation: true,
            });
        }

        const retainedHistory = retainPortfolioHistoryByAge(
            filteredHistory,
            historyReferenceTime,
        );
        const currentHistory = portfolio.history || [];
        const historyChanged = retainedHistory.length !== currentHistory.length
            || retainedHistory.some((item, index) => item !== currentHistory[index]);
        if (historyChanged) {
            portfolio.history = retainedHistory;
        }

        this.updateAllTimeStats(portfolio, preserveStoredExtrema);
        this.calculatePerformance(portfolio, btcPrice, ethPrice);
    }

    private getProjectState(
        states: Map<string, ProjectState>,
        projectId: string,
        currency: string,
        maxIndex?: number,
    ): ProjectState {
        if (!states.has(projectId)) {
            states.set(projectId, {
                projectId,
                quantity: 0,
                costBasis: 0,
                totalBought: 0,
                totalSold: 0,
                totalBuyCost: 0,
                realizedCostBasis: 0,
                realizedProfit: 0,
                totalFees: 0,
                currency,
                maxIndex,
            });
        }

        const state = states.get(projectId)!;
        if (typeof maxIndex === 'number') {
            state.maxIndex = typeof state.maxIndex === 'number'
                ? Math.max(state.maxIndex, maxIndex)
                : maxIndex;
        }

        return state;
    }

    private getGrossAmount(tx: Transaction | any, quantity: number, price: number): number {
        const calculatedGross = quantity * price;
        const explicitTotal = this.toNonNegativeNumber(tx.total);

        if (calculatedGross <= 0) return explicitTotal;

        if (explicitTotal > 0) {
            const grossToTotalRatio = calculatedGross / explicitTotal;
            const calculatedLooksCorrupt = calculatedGross > this.maxReasonableTransactionGross
                || grossToTotalRatio > this.maxGrossToTotalRatio;

            if (calculatedLooksCorrupt && explicitTotal <= this.maxReasonableTransactionGross) {
                this.logger.warn(
                    `Using transaction.total instead of quantity*price for transaction id=${tx._id || 'unknown'} gross=${calculatedGross} total=${explicitTotal}`,
                );
                return explicitTotal;
            }
        }

        return calculatedGross;
    }

    private getFeeValue(tx: Transaction | any, grossAmount: number): number {
        const feeAmount = this.toNonNegativeNumber(tx.feeAmount);
        if (!feeAmount) return 0;

        if (tx.feeType === 'percent') {
            if (feeAmount > this.maxFeePercent) {
                this.logger.warn(
                    `Ignoring corrupt percent fee transaction id=${tx._id || 'unknown'} feePercent=${feeAmount}`,
                );
                return 0;
            }

            return (grossAmount * feeAmount) / 100;
        }

        if (grossAmount > 0 && feeAmount / grossAmount > this.maxFeeToGrossRatio) {
            this.logger.warn(
                `Ignoring corrupt USD fee transaction id=${tx._id || 'unknown'} fee=${feeAmount} gross=${grossAmount}`,
            );
            return 0;
        }

        return feeAmount;
    }

    private toNonNegativeNumber(value: unknown): number {
        const parsed = Number(value || 0);
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }

    private isReasonableGross(value: number): boolean {
        return Number.isFinite(value)
            && value >= 0
            && value <= this.maxReasonableTransactionGross;
    }

    private buildAllocations(
        projects: PortfolioCalculationProject[],
        currentBalance: number,
    ): Record<string, number> {
        const categoryBalances = projects.reduce((acc, project) => {
            acc[project.category] = (acc[project.category] || 0) + project.currentValue;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(categoryBalances).reduce((acc, category) => {
            acc[category] = currentBalance > 0
                ? this.roundPercent((categoryBalances[category] / currentBalance) * 100)
                : 0;
            return acc;
        }, {} as Record<string, number>);
    }

    private updateAllTimeStats(
        portfolio: any,
        preserveStoredExtrema: boolean,
    ): void {
        const balances = (portfolio.history || [])
            .map((item: any) => this.toFiniteHistoryBalance(item?.totalBalance))
            .filter((balance: number | null): balance is number => balance !== null);
        if (!balances.length) {
            portfolio.ath = 0;
            portfolio.athDate = undefined;
            portfolio.atl = 0;
            portfolio.atlDate = undefined;
            return;
        }

        const historyMaximum = Math.max(...balances);
        const historyMinimum = Math.min(...balances);
        const storedMaximum = this.toFiniteHistoryBalance(portfolio.ath);
        const storedMinimum = this.toFiniteHistoryBalance(portfolio.atl);
        const storedMaximumDate = new Date(portfolio.athDate).getTime();
        const storedMinimumDate = new Date(portfolio.atlDate).getTime();
        const now = Date.now();
        const keepStoredMaximum = preserveStoredExtrema
            && Boolean(portfolio.athDate)
            && Number.isFinite(storedMaximumDate)
            && storedMaximumDate <= now
            && storedMaximum !== null
            && storedMaximum > historyMaximum;
        const keepStoredMinimum = preserveStoredExtrema
            && Boolean(portfolio.atlDate)
            && Number.isFinite(storedMinimumDate)
            && storedMinimumDate <= now
            && storedMinimum !== null
            && storedMinimum < historyMinimum;

        portfolio.ath = keepStoredMaximum ? storedMaximum : historyMaximum;
        portfolio.athDate = keepStoredMaximum
            ? portfolio.athDate
            : (portfolio.history || []).find(
                (item: any) => this.toFiniteHistoryBalance(item?.totalBalance) === historyMaximum,
            )?.date;
        portfolio.atl = keepStoredMinimum ? storedMinimum : historyMinimum;
        portfolio.atlDate = keepStoredMinimum
            ? portfolio.atlDate
            : (portfolio.history || []).find(
                (item: any) => this.toFiniteHistoryBalance(item?.totalBalance) === historyMinimum,
            )?.date;
    }

    private toFiniteHistoryBalance(value: unknown): number | null {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        if (typeof value !== 'string' || !value.trim()) return null;

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private calculatePerformance(portfolio: any, currentBtcPrice: number, currentEthPrice: number): void {
        const now = new Date();
        const periods = [
            { name: '1h', hours: 1 },
            { name: '24h', hours: 24 },
            { name: '7d', hours: 24 * 7 },
            { name: '30d', hours: 24 * 30 },
            { name: '90d', hours: 24 * 90 },
            { name: '1y', hours: 24 * 365 },
        ];

        const history = this.getValidHistory(portfolio.history);

        for (const period of periods) {
            const periodDate = new Date(now.getTime() - period.hours * 60 * 60 * 1000);
            const historicalRecord = this.findPerformanceBaseline(history, periodDate, period.hours);

            if (historicalRecord) {
                const currentProfitPercent = this.toFiniteNumber(portfolio.profitPercent);
                const historicalProfitPercent = this.toFiniteNumber(historicalRecord.totalProfitPercent);
                const profitPercentDelta = this.calculateSafePercentPointChange(
                    currentProfitPercent,
                    historicalProfitPercent,
                );

                portfolio[`performance${period.name}`] = {
                    usd: this.roundPercent(profitPercentDelta),
                    btc: this.roundPercent(profitPercentDelta),
                    eth: this.roundPercent(profitPercentDelta),
                };
            } else {
                portfolio[`performance${period.name}`] = { usd: 0, btc: 0, eth: 0 };
            }
        }
    }

    private getValidHistory(history: PortfolioHistory[]): PortfolioHistory[] {
        return (history || [])
            .filter((record: any) => {
                const recordDate = new Date(record.date);
                const balance = Number(record.totalBalance);
                return !Number.isNaN(recordDate.getTime())
                    && Number.isFinite(balance)
                    && balance >= this.minPerformanceBaseline;
            })
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    private findPerformanceBaseline(history: PortfolioHistory[], targetDate: Date, periodHours: number): PortfolioHistory | null {
        if (!history || history.length === 0) return null;

        let latestBeforeOrAtTarget: PortfolioHistory | null = null;
        const maxLookbackMs = this.getMaxPerformanceBaselineDistanceMs(periodHours);

        for (const record of history) {
            const recordDate = new Date(record.date);
            if (recordDate.getTime() <= targetDate.getTime()) {
                latestBeforeOrAtTarget = record;
                continue;
            }

            if (latestBeforeOrAtTarget) {
                const baselineAgeMs = targetDate.getTime() - new Date(latestBeforeOrAtTarget.date).getTime();
                return baselineAgeMs <= maxLookbackMs ? latestBeforeOrAtTarget : record;
            }

            const baselineForwardMs = recordDate.getTime() - targetDate.getTime();
            return baselineForwardMs <= maxLookbackMs ? record : null;
        }

        if (!latestBeforeOrAtTarget) return null;

        const baselineAgeMs = targetDate.getTime() - new Date(latestBeforeOrAtTarget.date).getTime();
        return baselineAgeMs <= maxLookbackMs ? latestBeforeOrAtTarget : null;
    }

    private calculateSafePercentPointChange(current: number, baseline: number): number {
        if (!Number.isFinite(current) || !Number.isFinite(baseline)) return 0;
        return current - baseline;
    }

    private getMaxPerformanceBaselineDistanceMs(periodHours: number): number {
        if (periodHours <= 1) {
            return this.oneHourBaselineToleranceMinutes * 60 * 1000;
        }

        return Math.max(
            60 * 60 * 1000,
            periodHours * 60 * 60 * 1000 * 0.25,
        );
    }

    private toFiniteNumber(value: unknown): number {
        const parsed = Number(value || 0);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private getProjectId(projectId: any): string {
        if (!projectId) return '';
        if (projectId.marketAssetId) return projectId.marketAssetId.toString();
        if (projectId._id) return projectId._id.toString();
        return projectId.toString();
    }

    private roundMoney(value: number): number {
        return Number.isFinite(value) ? parseFloat(value.toFixed(2)) : 0;
    }

    private roundPercent(value: number): number {
        return Number.isFinite(value) ? parseFloat(value.toFixed(2)) : 0;
    }

    private roundToken(value: number): number {
        return Number.isFinite(value) ? parseFloat(value.toFixed(8)) : 0;
    }
}

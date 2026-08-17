export const PORTFOLIO_RECALCULATION_QUEUE = 'portfolio-recalculation';

export const PORTFOLIO_RECALCULATION_JOBS = {
    RECALCULATE: 'portfolio-recalculate',
    RECALCULATE_BATCH: 'portfolio-recalculate-batch',
} as const;

export type PortfolioRecalculationJobName =
    typeof PORTFOLIO_RECALCULATION_JOBS[keyof typeof PORTFOLIO_RECALCULATION_JOBS];

export type PortfolioRecalculationJobReason =
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

export interface PortfolioRecalculationJobPayload {
    portfolioId: string;
    userId?: string;
    reason: PortfolioRecalculationJobReason;
    force?: boolean;
    markViewed?: boolean;
    queuedAt: string;
}

export interface PortfolioRecalculationBatchJobPayload {
    userId?: string;
    reason: 'cron' | 'stale-on-read' | 'manual' | 'market-data' | 'global-sweep';
    scope: 'active' | 'global' | 'snapshot-active' | 'snapshot-baseline';
    queuedAt: string;
}

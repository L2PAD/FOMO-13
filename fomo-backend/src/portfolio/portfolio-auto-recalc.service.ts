import { Injectable, Logger } from '@nestjs/common';
import {
    PortfolioRecalculationBatchJobPayload,
    PortfolioRecalculationJobReason,
} from './portfolio-queue.constants';

type PortfolioBatchReason = PortfolioRecalculationBatchJobPayload['reason'];

@Injectable()
export class PortfolioAutoRecalcService {
    private readonly logger = new Logger(PortfolioAutoRecalcService.name);
    private readonly flagName = 'PORTFOLIO_AUTO_RECALC_ENABLED';
    private readonly autoRecalcEnabled = this.parseBoolean(process.env.PORTFOLIO_AUTO_RECALC_ENABLED, true);
    private readonly skipLogThrottleMs = Number(process.env.PORTFOLIO_AUTO_RECALC_SKIP_LOG_THROTTLE_MS || 60_000);
    private readonly lastSkipLogAt = new Map<string, number>();

    isAutoRecalcEnabled(): boolean {
        return this.autoRecalcEnabled;
    }

    isManualReason(reason?: PortfolioRecalculationJobReason | PortfolioBatchReason | string): boolean {
        return reason === 'manual';
    }

    shouldRunForReason(reason?: PortfolioRecalculationJobReason | string): boolean {
        return this.autoRecalcEnabled || this.isManualReason(reason);
    }

    shouldRunForBatchReason(reason?: PortfolioBatchReason | string): boolean {
        return this.autoRecalcEnabled || this.isManualReason(reason);
    }

    logAutoRecalcSkipped(scope: string, details?: string): void {
        if (this.autoRecalcEnabled) return;

        const now = Date.now();
        const lastLoggedAt = this.lastSkipLogAt.get(scope) || 0;
        if (now - lastLoggedAt < this.skipLogThrottleMs) return;

        this.lastSkipLogAt.set(scope, now);
        const suffix = details ? ` ${details}` : '';
        this.logger.log(
            `Skipped portfolio auto recalculation because ${this.flagName}=false.${suffix}`,
        );
    }

    private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
        if (typeof value !== 'string') return defaultValue;

        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off'].includes(normalized)) return false;
        return defaultValue;
    }
}

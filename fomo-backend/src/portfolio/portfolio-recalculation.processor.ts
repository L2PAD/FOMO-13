import { Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
    PORTFOLIO_RECALCULATION_JOBS,
    PORTFOLIO_RECALCULATION_QUEUE,
    PortfolioRecalculationBatchJobPayload,
    PortfolioRecalculationJobPayload,
} from './portfolio-queue.constants';
import { PortfolioRecalculationService } from './portfolio-recalculation.service';
import { PortfolioRecalculationQueueService } from './portfolio-recalculation-queue.service';

@Processor(PORTFOLIO_RECALCULATION_QUEUE)
export class PortfolioRecalculationProcessor {
    private readonly logger = new Logger(PortfolioRecalculationProcessor.name);

    constructor(
        private readonly recalculationService: PortfolioRecalculationService,
        private readonly queueService: PortfolioRecalculationQueueService,
    ) { }

    @Process(PORTFOLIO_RECALCULATION_JOBS.RECALCULATE)
    async handlePortfolioRecalculation(job: Job<PortfolioRecalculationJobPayload>): Promise<void> {
        const startedAt = Date.now();
        const { portfolioId, userId, reason, force, markViewed, queuedAt } = job.data;

        this.logger.log(
            `Portfolio job started id=${job.id} portfolio=${portfolioId} reason=${reason} queuedAt=${queuedAt} attempts=${job.attemptsMade}`,
        );

        const result = await this.recalculationService.recalculatePortfolioFromJob(portfolioId, {
            reason,
            userId,
            force,
            markViewed,
        });

        this.logger.log(
            `Portfolio job finished id=${job.id} portfolio=${portfolioId} reason=${reason} recalculated=${result.recalculated} snapshot=${result.snapshotAdded} skipped=${result.skippedReason || ''} durationMs=${Date.now() - startedAt}`,
        );
    }

    @Process(PORTFOLIO_RECALCULATION_JOBS.RECALCULATE_BATCH)
    async handlePortfolioRecalculationBatch(job: Job<PortfolioRecalculationBatchJobPayload>): Promise<void> {
        const startedAt = Date.now();
        const { userId, reason, scope, queuedAt } = job.data;

        this.logger.log(
            `Portfolio batch job started id=${job.id} scope=${scope} user=${userId || 'all'} reason=${reason} queuedAt=${queuedAt} attempts=${job.attemptsMade}`,
        );

        const result = await this.recalculationService.recalculateActivePortfoliosBatch({
            userId,
            reason,
            scope,
        });

        this.logger.log(
            `Portfolio batch job finished id=${job.id} scope=${scope} user=${userId || 'all'} candidates=${result.candidates} processed=${result.processed} skipped=${result.skipped} snapshots=${result.snapshots} errors=${result.errors} durationMs=${Date.now() - startedAt}`,
        );

        if (result.candidates >= result.limit && scope !== 'active' && scope !== 'snapshot-baseline') {
            await this.queueService.enqueuePortfoliosBatch({
                userId,
                reason,
                scope,
                priority: scope === 'global' ? 20 : scope === 'snapshot-active' ? 8 : 12,
            });

            this.logger.log(
                `Portfolio batch follow-up queued scope=${scope} user=${userId || 'all'} because candidates=${result.candidates} reached limit=${result.limit}`,
            );
        }
    }
}

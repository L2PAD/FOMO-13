import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PortfolioAutoRecalcService } from './portfolio-auto-recalc.service';
import { PortfolioRecalculationQueueService } from './portfolio-recalculation-queue.service';
import { PortfolioWorkerHealthService } from './portfolio-worker-health.service';

@Injectable()
export class PortfolioRecalculationScheduler {
    private readonly logger = new Logger(PortfolioRecalculationScheduler.name);

    constructor(
        private readonly portfolioAutoRecalcService: PortfolioAutoRecalcService,
        private readonly queueService: PortfolioRecalculationQueueService,
        private readonly workerHealthService: PortfolioWorkerHealthService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async updateWorkerHeartbeat(): Promise<void> {
        await this.workerHealthService.heartbeat();
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async enqueueActivePortfolioRefresh(): Promise<void> {
        if (!this.portfolioAutoRecalcService.isAutoRecalcEnabled()) {
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                'scheduler-active-batch',
                'context=scheduler scope=active reason=cron',
            );
            return;
        }

        await this.queueService.enqueueActivePortfoliosBatch({
            reason: 'cron',
            priority: 10,
        });

        this.logger.log('Queued scheduled portfolio recalculation batch');
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async enqueueActivePortfolioSnapshots(): Promise<void> {
        if (!this.portfolioAutoRecalcService.isAutoRecalcEnabled()) {
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                'scheduler-active-snapshot-batch',
                'context=scheduler scope=snapshot-active reason=cron',
            );
            return;
        }

        await this.queueService.enqueueSnapshotPortfoliosBatch({
            reason: 'cron',
            priority: 8,
            scope: 'snapshot-active',
        });

        this.logger.log('Queued scheduled active portfolio snapshot batch');
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async enqueueBaselinePortfolioSnapshots(): Promise<void> {
        if (!this.portfolioAutoRecalcService.isAutoRecalcEnabled()) {
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                'scheduler-baseline-snapshot-batch',
                'context=scheduler scope=snapshot-baseline reason=cron',
            );
            return;
        }

        await this.queueService.enqueueSnapshotPortfoliosBatch({
            reason: 'cron',
            priority: 12,
            scope: 'snapshot-baseline',
        });

        this.logger.log('Queued scheduled baseline portfolio snapshot batch');
    }

    @Cron(process.env.PORTFOLIO_GLOBAL_SWEEP_CRON || CronExpression.EVERY_HOUR)
    async enqueueGlobalPortfolioRefresh(): Promise<void> {
        if (!this.portfolioAutoRecalcService.isAutoRecalcEnabled()) {
            this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                'scheduler-global-batch',
                'context=scheduler scope=global reason=global-sweep',
            );
            return;
        }

        await this.queueService.enqueueGlobalPortfoliosBatch({
            reason: 'global-sweep',
            priority: 20,
        });

        this.logger.log('Queued scheduled global portfolio sweep batch');
    }
}

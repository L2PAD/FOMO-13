import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
    PORTFOLIO_RECALCULATION_JOBS,
    PORTFOLIO_RECALCULATION_QUEUE,
    PortfolioRecalculationBatchJobPayload,
    PortfolioRecalculationJobPayload,
    PortfolioRecalculationJobReason,
} from './portfolio-queue.constants';
import { PortfolioAutoRecalcService } from './portfolio-auto-recalc.service';
import { PortfolioWorkerHealthService } from './portfolio-worker-health.service';

@Injectable()
export class PortfolioRecalculationQueueService {
    private readonly logger = new Logger(PortfolioRecalculationQueueService.name);
    private readonly followUpDelayMs = Number(process.env.PORTFOLIO_QUEUE_FOLLOWUP_DELAY_MS || 15_000);

    constructor(
        @InjectQueue(PORTFOLIO_RECALCULATION_QUEUE)
        private readonly queue: Queue,
        private readonly portfolioAutoRecalcService: PortfolioAutoRecalcService,
        private readonly workerHealthService: PortfolioWorkerHealthService,
    ) { }

    async enqueuePortfolioRecalculation(payload: {
        portfolioId: string;
        userId?: string;
        reason: PortfolioRecalculationJobReason;
        force?: boolean;
        markViewed?: boolean;
        priority?: number;
    }): Promise<void> {
        try {
            if (!this.portfolioAutoRecalcService.shouldRunForReason(payload.reason)) {
                this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                    'queue-single',
                    `context=queue-single portfolio=${payload.portfolioId} reason=${payload.reason}`,
                );
                return;
            }

            await this.workerHealthService.warnIfWorkerUnhealthy(`queueing portfolio=${payload.portfolioId}`);

            const jobPayload = this.buildJobPayload(payload);
            const baseJobId = `${PORTFOLIO_RECALCULATION_JOBS.RECALCULATE}:${payload.portfolioId}`;
            const followUpJobId = `${baseJobId}:followup`;
            const incomingPriority = payload.priority ?? this.getPriority(payload.reason);
            const existingJob = await this.queue.getJob(baseJobId);

            if (!existingJob) {
                await this.addRecalculationJob(baseJobId, jobPayload, incomingPriority);
                return;
            }

            const state = await existingJob.getState();
            if (state === 'completed' || state === 'failed') {
                await existingJob.remove();
                await this.addRecalculationJob(baseJobId, jobPayload, incomingPriority);
                return;
            }

            const existingPayload = existingJob.data as PortfolioRecalculationJobPayload | undefined;
            const mergedPayload = this.mergeJobPayload(existingPayload, jobPayload);
            const existingPriority = Number(existingJob.opts.priority || this.getPriority(existingPayload?.reason || payload.reason));
            const mergedPriority = Math.min(existingPriority, incomingPriority);

            if (state === 'active') {
                if (this.isUpgradeRequired(existingPayload, jobPayload, existingPriority, incomingPriority)) {
                    await this.upsertFollowUpJob(followUpJobId, mergedPayload, mergedPriority);
                }

                this.logger.debug?.(`Skipped immediate duplicate portfolio queue job jobId=${baseJobId} state=${state}`);
                return;
            }

            if (!this.isUpgradeRequired(existingPayload, jobPayload, existingPriority, incomingPriority)) {
                this.logger.debug?.(`Skipped duplicate portfolio queue job jobId=${baseJobId} state=${state}`);
                return;
            }

            await existingJob.remove();
            await this.addRecalculationJob(baseJobId, mergedPayload, mergedPriority);
        } catch (error) {
            this.logger.warn(`Failed to queue portfolio recalculation portfolio=${payload.portfolioId}: ${error?.message || error}`);
        }
    }

    async enqueueActivePortfoliosBatch(payload: {
        userId?: string;
        reason: 'cron' | 'stale-on-read' | 'manual' | 'market-data';
        priority?: number;
    }): Promise<void> {
        await this.enqueuePortfoliosBatch({
            ...payload,
            scope: 'active',
        });
    }

    async enqueueGlobalPortfoliosBatch(payload: {
        reason?: 'global-sweep' | 'manual';
        priority?: number;
    } = {}): Promise<void> {
        await this.enqueuePortfoliosBatch({
            reason: payload.reason || 'global-sweep',
            priority: payload.priority,
            scope: 'global',
        });
    }

    async enqueueSnapshotPortfoliosBatch(payload: {
        reason?: 'cron' | 'manual';
        priority?: number;
        scope: 'snapshot-active' | 'snapshot-baseline';
    }): Promise<void> {
        await this.enqueuePortfoliosBatch({
            reason: payload.reason || 'cron',
            priority: payload.priority,
            scope: payload.scope,
        });
    }

    async enqueuePortfoliosBatch(payload: {
        userId?: string;
        reason: 'cron' | 'stale-on-read' | 'manual' | 'market-data' | 'global-sweep';
        priority?: number;
        scope: 'active' | 'global' | 'snapshot-active' | 'snapshot-baseline';
    }): Promise<void> {
        try {
            if (!this.portfolioAutoRecalcService.shouldRunForBatchReason(payload.reason)) {
                this.portfolioAutoRecalcService.logAutoRecalcSkipped(
                    `queue-batch:${payload.scope}`,
                    `context=queue-batch scope=${payload.scope} reason=${payload.reason}`,
                );
                return;
            }

            await this.workerHealthService.warnIfWorkerUnhealthy(`queueing batch scope=${payload.scope}`);

            const jobPayload: PortfolioRecalculationBatchJobPayload = {
                userId: payload.userId,
                reason: payload.reason,
                scope: payload.scope,
                queuedAt: new Date().toISOString(),
            };
            const jobId = payload.scope === 'global'
                ? `${PORTFOLIO_RECALCULATION_JOBS.RECALCULATE_BATCH}:global`
                : payload.scope === 'snapshot-active'
                    ? `${PORTFOLIO_RECALCULATION_JOBS.RECALCULATE_BATCH}:snapshot-active`
                    : payload.scope === 'snapshot-baseline'
                        ? `${PORTFOLIO_RECALCULATION_JOBS.RECALCULATE_BATCH}:snapshot-baseline`
                : payload.userId
                    ? `${PORTFOLIO_RECALCULATION_JOBS.RECALCULATE_BATCH}:user:${payload.userId}`
                    : `${PORTFOLIO_RECALCULATION_JOBS.RECALCULATE_BATCH}:active`;

            const existingJob = await this.queue.getJob(jobId);
            const incomingPriority = payload.priority ?? this.getBatchPriority(payload.reason, payload.scope);

            if (existingJob) {
                const state = await existingJob.getState();
                if (state === 'completed' || state === 'failed') {
                    await existingJob.remove();
                } else {
                    const existingPriority = Number(existingJob.opts.priority || incomingPriority);
                    const existingPayload = existingJob.data as PortfolioRecalculationBatchJobPayload | undefined;
                    const shouldReplace = existingPayload?.reason !== payload.reason || existingPriority !== incomingPriority;

                    if (!shouldReplace) {
                        this.logger.debug?.(`Skipped duplicate portfolio batch job jobId=${jobId} state=${state}`);
                        return;
                    }

                    if (state === 'active') {
                        this.logger.debug?.(`Skipped replacing active portfolio batch job jobId=${jobId}`);
                        return;
                    }

                    await existingJob.remove();
                }
            }

            await this.queue.add(PORTFOLIO_RECALCULATION_JOBS.RECALCULATE_BATCH, jobPayload, {
                jobId,
                attempts: Number(process.env.PORTFOLIO_QUEUE_ATTEMPTS || 3),
                backoff: {
                    type: 'exponential',
                    delay: Number(process.env.PORTFOLIO_QUEUE_BACKOFF_MS || 5000),
                },
                priority: incomingPriority,
                removeOnComplete: Number(process.env.PORTFOLIO_QUEUE_REMOVE_ON_COMPLETE || 500),
                removeOnFail: Number(process.env.PORTFOLIO_QUEUE_REMOVE_ON_FAIL || 1000),
            });

            this.logger.debug?.(
                `Queued portfolio batch recalculation scope=${payload.scope} user=${payload.userId || 'all'} reason=${payload.reason} jobId=${jobId}`,
            );
        } catch (error) {
            this.logger.warn(`Failed to queue portfolio batch recalculation scope=${payload.scope}: ${error?.message || error}`);
        }
    }

    private buildJobPayload(payload: {
        portfolioId: string;
        userId?: string;
        reason: PortfolioRecalculationJobReason;
        force?: boolean;
        markViewed?: boolean;
    }): PortfolioRecalculationJobPayload {
        return {
            portfolioId: payload.portfolioId,
            userId: payload.userId,
            reason: payload.reason,
            force: payload.force,
            markViewed: payload.markViewed,
            queuedAt: new Date().toISOString(),
        };
    }

    private mergeJobPayload(
        existingPayload: PortfolioRecalculationJobPayload | undefined,
        incomingPayload: PortfolioRecalculationJobPayload,
    ): PortfolioRecalculationJobPayload {
        if (!existingPayload) return incomingPayload;

        const existingPriority = this.getPriority(existingPayload.reason);
        const incomingPriority = this.getPriority(incomingPayload.reason);

        return {
            portfolioId: incomingPayload.portfolioId,
            userId: incomingPayload.userId || existingPayload.userId,
            reason: incomingPriority <= existingPriority ? incomingPayload.reason : existingPayload.reason,
            force: Boolean(existingPayload.force || incomingPayload.force),
            markViewed: Boolean(existingPayload.markViewed || incomingPayload.markViewed),
            queuedAt: new Date().toISOString(),
        };
    }

    private isUpgradeRequired(
        existingPayload: PortfolioRecalculationJobPayload | undefined,
        incomingPayload: PortfolioRecalculationJobPayload,
        existingPriority: number,
        incomingPriority: number,
    ): boolean {
        if (!existingPayload) return true;
        if (Boolean(existingPayload.force) !== Boolean(incomingPayload.force) && incomingPayload.force) return true;
        if (Boolean(existingPayload.markViewed) !== Boolean(incomingPayload.markViewed) && incomingPayload.markViewed) return true;
        if (incomingPriority < existingPriority) return true;
        if (existingPayload.reason !== incomingPayload.reason && incomingPriority <= existingPriority) return true;
        return false;
    }

    private async upsertFollowUpJob(jobId: string, payload: PortfolioRecalculationJobPayload, priority: number): Promise<void> {
        const existingJob = await this.queue.getJob(jobId);

        if (existingJob) {
            const state = await existingJob.getState();
            if (state === 'completed' || state === 'failed') {
                await existingJob.remove();
            } else {
                const mergedPayload = this.mergeJobPayload(existingJob.data as PortfolioRecalculationJobPayload, payload);
                const mergedPriority = Math.min(Number(existingJob.opts.priority || priority), priority);

                if (state !== 'active') {
                    await existingJob.remove();
                    await this.addRecalculationJob(jobId, mergedPayload, mergedPriority, this.followUpDelayMs);
                }
                return;
            }
        }

        await this.addRecalculationJob(jobId, payload, priority, this.followUpDelayMs);
    }

    private async addRecalculationJob(
        jobId: string,
        payload: PortfolioRecalculationJobPayload,
        priority: number,
        delay = 0,
    ): Promise<void> {
        await this.queue.add(PORTFOLIO_RECALCULATION_JOBS.RECALCULATE, payload, {
            jobId,
            attempts: Number(process.env.PORTFOLIO_QUEUE_ATTEMPTS || 3),
            backoff: {
                type: 'exponential',
                delay: Number(process.env.PORTFOLIO_QUEUE_BACKOFF_MS || 5000),
            },
            priority,
            delay,
            removeOnComplete: Number(process.env.PORTFOLIO_QUEUE_REMOVE_ON_COMPLETE || 500),
            removeOnFail: Number(process.env.PORTFOLIO_QUEUE_REMOVE_ON_FAIL || 1000),
        });

        this.logger.debug?.(
            `Queued portfolio recalculation portfolio=${payload.portfolioId} reason=${payload.reason} jobId=${jobId} priority=${priority} delay=${delay}`,
        );
    }

    private getPriority(reason: PortfolioRecalculationJobReason): number {
        if (reason.startsWith('event:')) return 1;
        if (reason === 'stale-on-read') return 2;
        if (reason === 'manual') return 3;
        if (reason === 'market-data') return 4;
        if (reason === 'global-sweep') return 15;
        return 10;
    }

    private getBatchPriority(
        reason: 'cron' | 'stale-on-read' | 'manual' | 'market-data' | 'global-sweep',
        scope: 'active' | 'global' | 'snapshot-active' | 'snapshot-baseline',
    ): number {
        if (reason === 'stale-on-read') return 2;
        if (reason === 'manual') return 3;
        if (reason === 'market-data') return 6;
        if (scope === 'global') return 20;
        if (scope === 'snapshot-baseline') return 12;
        if (scope === 'snapshot-active') return 8;
        return 10;
    }
}

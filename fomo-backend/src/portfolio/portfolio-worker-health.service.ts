import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PortfolioSystemState, PortfolioSystemStateDocument } from './model/portfolio.model';

const PORTFOLIO_WORKER_STATE_KEY = 'portfolio-worker';

@Injectable()
export class PortfolioWorkerHealthService {
    private readonly logger = new Logger(PortfolioWorkerHealthService.name);
    private readonly workerHeartbeatTtlMs = Number(process.env.PORTFOLIO_WORKER_HEARTBEAT_TTL_MS || 3 * 60 * 1000);
    private readonly warningThrottleMs = Number(process.env.PORTFOLIO_WORKER_WARNING_THROTTLE_MS || 60 * 1000);
    private readonly instanceId = `${process.pid}:${Math.random().toString(36).slice(2, 8)}`;
    private lastWarningAt = 0;

    constructor(
        @InjectModel(PortfolioSystemState.name)
        private readonly stateModel: Model<PortfolioSystemStateDocument>,
    ) { }

    async heartbeat(): Promise<void> {
        await this.stateModel.updateOne(
            { key: PORTFOLIO_WORKER_STATE_KEY },
            {
                $set: {
                    key: PORTFOLIO_WORKER_STATE_KEY,
                    lastWorkerHeartbeatAt: new Date(),
                    workerInstanceId: this.instanceId,
                },
            },
            { upsert: true },
        );
    }

    async isWorkerHealthy(): Promise<boolean> {
        const state = await this.stateModel
            .findOne({ key: PORTFOLIO_WORKER_STATE_KEY })
            .select('lastWorkerHeartbeatAt')
            .lean();

        if (!state?.lastWorkerHeartbeatAt) {
            return false;
        }

        const ageMs = Date.now() - new Date(state.lastWorkerHeartbeatAt).getTime();
        return ageMs <= this.workerHeartbeatTtlMs;
    }

    async warnIfWorkerUnhealthy(context: string): Promise<void> {
        const healthy = await this.isWorkerHealthy();
        if (healthy) return;

        const now = Date.now();
        if (now - this.lastWarningAt < this.warningThrottleMs) return;

        this.lastWarningAt = now;
        this.logger.warn(
            `Portfolio worker heartbeat is stale or missing while ${context}. Queue-based recalculation may be delayed until the worker is running.`,
        );
    }
}

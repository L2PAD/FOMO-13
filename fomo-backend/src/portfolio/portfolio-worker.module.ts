import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PortfolioModule } from './portfolio.module';
import { PortfolioRecalculationProcessor } from './portfolio-recalculation.processor';
import { PortfolioRecalculationScheduler } from './portfolio-recalculation.scheduler';
import { PORTFOLIO_RECALCULATION_QUEUE } from './portfolio-queue.constants';
import { getBullModuleOptions } from '../config/bull.config';
import { isCronEnabled } from '../config/cron.config';
import { buildMongoUri } from '../config/mongo.config';

@Module({
    imports: [
        ConfigModule.forRoot(),
        BullModule.forRoot(getBullModuleOptions()),
        MongooseModule.forRoot(buildMongoUri(), {
            maxPoolSize: parseInt(process.env.PORTFOLIO_WORKER_DB_MAX_POOL_SIZE || process.env.DB_MAX_POOL_SIZE || '10'),
            minPoolSize: parseInt(process.env.PORTFOLIO_WORKER_DB_MIN_POOL_SIZE || process.env.DB_MIN_POOL_SIZE || '2'),
            autoIndex: process.env.DB_AUTO_INDEX === 'true',
        }),
        BullModule.registerQueue({
            name: PORTFOLIO_RECALCULATION_QUEUE,
        }),
        ...(isCronEnabled() ? [ScheduleModule.forRoot()] : []),
        PortfolioModule,
    ],
    providers: [
        PortfolioRecalculationProcessor,
        PortfolioRecalculationScheduler,
    ],
})
export class PortfolioWorkerModule { }

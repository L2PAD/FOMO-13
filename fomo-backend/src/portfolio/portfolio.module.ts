import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioCalculationService } from './portfolio-calculation.service';
import { PortfolioAutoRecalcService } from './portfolio-auto-recalc.service';
import { PortfolioRecalculationService } from './portfolio-recalculation.service';
import { PortfolioRecalculationQueueService } from './portfolio-recalculation-queue.service';
import { PortfolioWorkerHealthService } from './portfolio-worker-health.service';
import { PORTFOLIO_RECALCULATION_QUEUE } from './portfolio-queue.constants';
import { Portfolio, PortfolioHistory, PortfolioHistorySchema, PortfolioSchema, PortfolioSystemState, PortfolioSystemStateSchema, Transaction, TransactionSchema } from './model/portfolio.model';
import { User, UserSchema } from 'src/user/user.model';
import {
  FomoV2MarketProjectHistory,
  FomoV2MarketProjectHistorySchema,
  FomoV2MarketProjectReadModel,
  FomoV2MarketProjectReadModelSchema,
  FomoV2ProjectMarketSnapshot,
  FomoV2ProjectMarketSnapshotSchema,
} from 'src/fomo-v2/models';
import { HttpModule } from '@nestjs/axios';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from 'src/files/files.module';
import { UserActionLogsModule } from 'src/user-action-logs/user-action-logs.module';

@Module({
  imports: [
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    BullModule.registerQueue({
      name: PORTFOLIO_RECALCULATION_QUEUE,
    }),
    MongooseModule.forFeature([
      { name: Portfolio.name, schema: PortfolioSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: PortfolioHistory.name, schema: PortfolioHistorySchema },
      { name: PortfolioSystemState.name, schema: PortfolioSystemStateSchema },
      { name: User.name, schema: UserSchema },
      { name: FomoV2MarketProjectReadModel.name, schema: FomoV2MarketProjectReadModelSchema },
      { name: FomoV2ProjectMarketSnapshot.name, schema: FomoV2ProjectMarketSnapshotSchema },
      { name: FomoV2MarketProjectHistory.name, schema: FomoV2MarketProjectHistorySchema },
    ]),
    FilesModule,
    UserActionLogsModule,
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioCalculationService, PortfolioAutoRecalcService, PortfolioRecalculationService, PortfolioRecalculationQueueService, PortfolioWorkerHealthService],
  exports: [PortfolioService, PortfolioCalculationService, PortfolioAutoRecalcService, PortfolioRecalculationService, PortfolioRecalculationQueueService, PortfolioWorkerHealthService],
})
export class PortfolioModule { }

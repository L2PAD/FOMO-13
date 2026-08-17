import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CryptoActivity, CryptoActivitySchema } from './models/crypto-activity.model';
import { CryptoActivityFavorite, CryptoActivityFavoriteSchema } from './models/crypto-activity-favorite.model';
import { CryptoActivityReaction, CryptoActivityReactionSchema } from './models/crypto-activity-reaction.model';
import { CryptoActivityReport, CryptoActivityReportSchema } from './models/crypto-activity-report.model';
import { CryptoActivityCalendarItem, CryptoActivityCalendarItemSchema } from './models/crypto-activity-calendar-item.model';
import { CryptoActivityBoard, CryptoActivityBoardSchema } from './models/crypto-activity-board.model';
import { CryptoActivityBoardColumn, CryptoActivityBoardColumnSchema } from './models/crypto-activity-board-column.model';
import { CryptoActivityBoardTask, CryptoActivityBoardTaskSchema } from './models/crypto-activity-board-task.model';
import { CryptoActivityStepProgress, CryptoActivityStepProgressSchema } from './models/crypto-activity-step-progress.model';
import { CryptoActivitiesSyncService } from './services/crypto-activities-sync.service';
import { CryptoActivitiesSyncRun, CryptoActivitiesSyncRunSchema } from './models/crypto-activities-sync-run.model';
import { CryptoActivitiesSyncLock, CryptoActivitiesSyncLockSchema } from './models/crypto-activities-sync-lock.model';
import { Investor, InvestorSchema } from 'src/investors/investor.model';
import { Funds, FundsSchema } from 'src/funds/funds.model';
import { InternalSyncGuard } from 'src/common/guards/internal-sync.guard';
import { IntelSyncModule } from 'src/intel-sync/intel-sync.module';
import { FomoV2Module } from 'src/fomo-v2/fomo-v2.module';
import { FomoV2ActivityCompatibilityService } from './services/fomo-v2-activity-compatibility.service';
import { Task, TaskSchema } from 'src/tasks/models/task.model';
import {
  EarlylandTaskUserState,
  EarlylandTaskUserStateSchema,
} from 'src/tasks/models/earlyland-task-user-state.model';
import { User, UserSchema } from 'src/user/user.model';
import { XpModule } from 'src/xp/xp.module';

@Module({
  imports: [
    HttpModule,
    IntelSyncModule,
    FomoV2Module,
    XpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: CryptoActivity.name, schema: CryptoActivitySchema },
      { name: CryptoActivityFavorite.name, schema: CryptoActivityFavoriteSchema },
      { name: CryptoActivityReaction.name, schema: CryptoActivityReactionSchema },
      { name: CryptoActivityReport.name, schema: CryptoActivityReportSchema },
      { name: CryptoActivityCalendarItem.name, schema: CryptoActivityCalendarItemSchema },
      { name: CryptoActivityBoard.name, schema: CryptoActivityBoardSchema },
      { name: CryptoActivityBoardColumn.name, schema: CryptoActivityBoardColumnSchema },
      { name: CryptoActivityBoardTask.name, schema: CryptoActivityBoardTaskSchema },
      { name: CryptoActivityStepProgress.name, schema: CryptoActivityStepProgressSchema },
      { name: CryptoActivitiesSyncRun.name, schema: CryptoActivitiesSyncRunSchema },
      { name: CryptoActivitiesSyncLock.name, schema: CryptoActivitiesSyncLockSchema },
      { name: Investor.name, schema: InvestorSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Task.name, schema: TaskSchema },
      { name: EarlylandTaskUserState.name, schema: EarlylandTaskUserStateSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    CryptoActivitiesSyncService,
    InternalSyncGuard,
    FomoV2ActivityCompatibilityService,
  ],
  exports: [
    ActivitiesService,
    CryptoActivitiesSyncService,
    FomoV2ActivityCompatibilityService,
  ],
})
export class CryptoActivitiesModule { }

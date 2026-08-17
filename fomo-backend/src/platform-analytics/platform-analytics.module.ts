import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { User, UserSchema } from "src/user/user.model";
import { XpTransaction, XpTransactionSchema } from "src/xp/xp-transaction.model";
import { UserActionLog, UserActionLogSchema } from "src/user-action-logs/user-action-log.model";
import {
  UserSession,
  UserSessionSchema,
  UserActivityEvent,
  UserActivityEventSchema,
  UserActivityDaily,
  UserActivityDailySchema,
} from "./platform-analytics.models";
import { Task, TaskSchema } from "src/tasks/models/task.model";
import {
  TaskUserProgress,
  TaskUserProgressSchema,
} from "src/tasks/models/task-user-progress.model";
import { TrackingService } from "./tracking.service";
import { TrackingController } from "./tracking.controller";
import { StatisticsService } from "./statistics.service";
import { StatisticsController } from "./statistics.controller";
import { RatingCanonicalModule } from "src/rating/unified/rating-canonical.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: XpTransaction.name, schema: XpTransactionSchema },
      { name: UserActionLog.name, schema: UserActionLogSchema },
      { name: UserSession.name, schema: UserSessionSchema },
      { name: UserActivityEvent.name, schema: UserActivityEventSchema },
      { name: UserActivityDaily.name, schema: UserActivityDailySchema },
      { name: Task.name, schema: TaskSchema },
      { name: TaskUserProgress.name, schema: TaskUserProgressSchema },
    ]),
    JwtModule.register({}),
    ConfigModule.forRoot(),
    RatingCanonicalModule,
  ],
  controllers: [TrackingController, StatisticsController],
  providers: [TrackingService, StatisticsService],
  exports: [TrackingService],
})
export class PlatformAnalyticsModule {}

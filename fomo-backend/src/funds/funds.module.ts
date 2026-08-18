import { Module } from "@nestjs/common";
import { FundsController } from "./funds.controller";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { NestjsFormDataModule } from "nestjs-form-data";

import { FundsService } from "./funds.service";
import { FundsAnalyticsSnapshotService } from "./funds-analytics-snapshot.service";
import { FundsRatingService } from "./funds-rating.service";
import { FilesService } from "../files/files.service";
import { RatingService } from "src/rating/rating.service";
import { CommentsService } from "src/comments/comments.service";
import { DiscussionSummary, DiscussionSummarySchema } from "src/comments/models/discussion-summary.model";
import { ActionsService } from "src/actions/actions.service";
import { LimitsModule } from "src/limits/limits.module";

import { Funds, FundsSchema } from "./funds.model";
import { User, UserSchema } from "src/user/user.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";
import { Action, ActionSchema } from "src/actions/models/action.model";
import { Project, ProjectSchema } from "../projects/project.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { PersonsRatingService } from "src/persons/persons-rating.service";
import { Event, EventSchema } from "src/events/models/event.model";
import { News, NewsSchema } from "src/news/models/news.model";
import { Nft, NftSchema } from "src/nft/nft.model";
import { ActionsModule } from "src/actions/actions.module";
import {
  Notification,
  NotificationSchema,
} from "src/notifications/model/notification.model";
import { NotificationsService } from "src/notifications/notifications.service";
import { TelegramService } from "src/telegram/telegram.service";
import { EmailService } from "src/email/email.service";
import { Activity, ActivitySchema } from "src/activity/models/activity.model";
import { ActivityService } from "src/activity/activity.service";
import {
  ProjectTwitter,
  ProjectTwitterSchema,
} from "src/twitter/project-twitter.model";
import { AuthModule } from "src/auth/auth.module";
import { TelegramModule } from "src/telegram/telegram.module";
import { MessageModule } from "src/message/message.module";
import { EntitlementsModule } from "src/entitlements/entitlements.module";
import { FundsIntelInvestorsSyncService } from "./funds-intel-investors-sync.service";
import { IntelSyncModule } from "src/intel-sync/intel-sync.module";
import { Investor, InvestorSchema } from "src/investors/investor.model";
import { FomoV2PersistenceModule } from "src/fomo-v2/persistence";
import { FomoV2ParserControlPolicyModule } from "src/fomo-v2/domains/parser-control";
import { InternalSyncGuard } from "src/common/guards/internal-sync.guard";
import {
  FundsAnalyticsSnapshot,
  FundsAnalyticsSnapshotSchema,
} from "./funds-analytics-snapshot.model";

@Module({
  imports: [
    NestjsFormDataModule,
    HttpModule,
    JwtModule,
    MongooseModule.forFeature([
      { name: Funds.name, schema: FundsSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: DiscussionSummary.name, schema: DiscussionSummarySchema },
      { name: User.name, schema: UserSchema },
      { name: Action.name, schema: ActionSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Event.name, schema: EventSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: News.name, schema: NewsSchema },
      { name: Nft.name, schema: NftSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: ProjectTwitter.name, schema: ProjectTwitterSchema },
      { name: Investor.name, schema: InvestorSchema },
      { name: FundsAnalyticsSnapshot.name, schema: FundsAnalyticsSnapshotSchema },
    ]),
    TelegramModule,
    MessageModule,
    IntelSyncModule,
    LimitsModule,
    FomoV2PersistenceModule,
    FomoV2ParserControlPolicyModule,
    EntitlementsModule,
  ],
  controllers: [FundsController],
  providers: [
    FundsService,
    FundsAnalyticsSnapshotService,
    FundsRatingService,
    ConfigService,
    FilesService,
    CommentsService,
    ActionsService,
    RatingService,
    NotificationsService,
    EmailService,
    ActivityService,
    FundsIntelInvestorsSyncService,
    PersonsRatingService,
    InternalSyncGuard,
  ],
  exports: [FundsService],
})
export class FundsModule {}

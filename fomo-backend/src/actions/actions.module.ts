import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { ActionsService } from "./actions.service";
import { ActionsController } from "./actions.controller";

import { User, UserSchema } from "src/user/user.model";
import { Action, ActionSchema } from "./models/action.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import { News, NewsSchema } from "src/news/models/news.model";
import { Event, EventSchema } from "src/events/models/event.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Nft, NftSchema } from "src/nft/nft.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";
import { DiscussionSummary, DiscussionSummarySchema } from "src/comments/models/discussion-summary.model";
import { FundsModule } from "src/funds/funds.module";
import { FilesService } from "src/files/files.service";
import { CommentsService } from "src/comments/comments.service";
import {
  Notification,
  NotificationSchema,
} from "src/notifications/model/notification.model";
import { NotificationsService } from "src/notifications/notifications.service";
import { TelegramService } from "src/telegram/telegram.service";
import { HttpModule, HttpService } from "@nestjs/axios";
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

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Action.name, schema: ActionSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: News.name, schema: NewsSchema },
      { name: Event.name, schema: EventSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Nft.name, schema: NftSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: DiscussionSummary.name, schema: DiscussionSummarySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: ProjectTwitter.name, schema: ProjectTwitterSchema },
    ]),
    TelegramModule,
    MessageModule,
    EntitlementsModule
  ],
  providers: [
    ActionsService,
    FilesService,
    CommentsService,
    NotificationsService,
    EmailService,
    ActivityService,
  ],
  controllers: [ActionsController],
  exports: [ActionsService],
})
export class ActionsModule {}

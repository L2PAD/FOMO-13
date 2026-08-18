import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { MongooseModule } from "@nestjs/mongoose";
import { NestjsFormDataModule } from "nestjs-form-data";
import { ProjectsController } from "./projects.controller";

import { ProjectsService } from "./projects.service";
import { FilesService } from "../files/files.service";
import { CommentsService } from "src/comments/comments.service";
import { DiscussionSummary, DiscussionSummarySchema } from "src/comments/models/discussion-summary.model";
import { ActionsService } from "src/actions/actions.service";
import { LimitsModule } from "src/limits/limits.module";

import { ProjectSchema, Project } from "./project.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";
import { User, UserSchema } from "src/user/user.model";
import { Action, ActionSchema } from "src/actions/models/action.model";
import { News, NewsSchema } from "src/news/models/news.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { Event, EventSchema } from "src/events/models/event.model";
import { Nft, NftSchema } from "src/nft/nft.model";
import { NotificationsService } from "src/notifications/notifications.service";
import {
  Notification,
  NotificationSchema,
} from "src/notifications/model/notification.model";
import { EmailService } from "src/email/email.service";
import { Activity, ActivitySchema } from "src/activity/models/activity.model";
import { ActivityService } from "src/activity/activity.service";
import {
  ProjectTwitter,
  ProjectTwitterSchema,
} from "src/twitter/project-twitter.model";
import { TelegramModule } from "src/telegram/telegram.module";
import { MessageModule } from "src/message/message.module";
import { EntitlementsModule } from "src/entitlements/entitlements.module";

@Module({
  imports: [
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    LimitsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: DiscussionSummary.name, schema: DiscussionSummarySchema },
      { name: Action.name, schema: ActionSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Event.name, schema: EventSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: News.name, schema: NewsSchema },
      { name: Nft.name, schema: NftSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: ProjectTwitter.name, schema: ProjectTwitterSchema },
    ]),
    TelegramModule,
    MessageModule,
    EntitlementsModule,
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    FilesService,
    CommentsService,
    ActionsService,
    NotificationsService,
    EmailService,
    ActivityService,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}

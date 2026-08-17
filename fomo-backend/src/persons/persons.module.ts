import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { MongooseModule } from "@nestjs/mongoose";
import { NestjsFormDataModule } from "nestjs-form-data";
import { PersonsController } from "./persons.controller";

import { PersonsService } from "./persons.service";
import { PersonsRatingService } from "./persons-rating.service";
import { FilesService } from "../files/files.service";
import { RatingService } from "src/rating/rating.service";
import { CommentsService } from "src/comments/comments.service";
import { ActionsService } from "src/actions/actions.service";
import { LimitsModule } from "src/limits/limits.module";

import { Person, PersonSchema } from "./person.model";
import { User, UserSchema } from "src/user/user.model";
import { Event, EventSchema } from "src/events/models/event.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { News, NewsSchema } from "src/news/models/news.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";
import { Action, ActionSchema } from "src/actions/models/action.model";
import { Nft, NftSchema } from "src/nft/nft.model";
import { NotificationsService } from "src/notifications/notifications.service";
import { TelegramService } from "src/telegram/telegram.service";
import {
  Notification,
  NotificationSchema,
} from "src/notifications/model/notification.model";
import { EmailService } from "src/email/email.service";
import { Activity, ActivitySchema } from "src/activity/models/activity.model";
import { ActivityService } from "src/activity/activity.service";
import { ProjectTwitter, ProjectTwitterSchema } from "src/twitter/project-twitter.model";
import { AuthModule } from "src/auth/auth.module";
import { TelegramModule } from "src/telegram/telegram.module";
import { MessageModule } from "src/message/message.module";
import { SpaceportNftModule } from "src/spaceport-nft/spaceport-nft.module";
import { XpModule } from "src/xp/xp.module";
import { EntitlementsModule } from "src/entitlements/entitlements.module";
import { ContentInfluenceService } from "src/comments/content-influence.service";

@Module({
  imports: [
    HttpModule,
    NestjsFormDataModule,
    JwtModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema },
      { name: Action.name, schema: ActionSchema },

      { name: Project.name, schema: ProjectSchema },
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
    SpaceportNftModule,
    LimitsModule,
    XpModule,
    EntitlementsModule
  ],
  controllers: [PersonsController],
  providers: [
    PersonsService,
    PersonsRatingService,
    FilesService,
    ConfigService,
    RatingService,
    CommentsService,
    ContentInfluenceService,
    ActionsService,
    NotificationsService,
    EmailService,
    ActivityService,
  ],
})
export class PersonsModule {}

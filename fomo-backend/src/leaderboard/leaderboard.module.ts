import { Module } from "@nestjs/common";

import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { LeaderboardController } from "./leaderboard.controller";

import { LeaderboardService } from "./leaderboard.service";
import { FilesService } from "src/files/files.service";
import { RatingService } from "src/rating/rating.service";
import { CommentsService } from "src/comments/comments.service";

import { User, UserSchema } from "src/user/user.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";
import { Action, ActionSchema } from "src/actions/models/action.model";
import { News, NewsSchema } from "src/news/models/news.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { Event, EventSchema } from "src/events/models/event.model";
import { Nft, NftSchema } from "src/nft/nft.model";
import { TwitterAccsParcingService } from "src/social-parcing/twitter-accs-parcing.service";
import {
  TwitterAcc,
  TwitterAccSchema,
} from "src/social-parcing/models/twitter-acc.model";
import {
  TwitterPerson,
  TwitterPersonSchema,
} from "src/social-parcing/models/twitter-person.model";
import { HttpModule } from "@nestjs/axios";
import {
  Notification,
  NotificationSchema,
} from "src/notifications/model/notification.model";
import { NotificationsService } from "src/notifications/notifications.service";
import { TelegramService } from "src/telegram/telegram.service";
import { EmailService } from "src/email/email.service";
import { LiveNews, LiveNewsSchema } from "src/twitter/livenews.model";
import { Activity, ActivitySchema } from "src/activity/models/activity.model";
import { ActivityService } from "src/activity/activity.service";
import { MessageModule } from "src/message/message.module";
import { TwitterModule } from "src/twitter/twitter.module";
import { TelegramModule } from "src/telegram/telegram.module";
import { EntitlementsModule } from "src/entitlements/entitlements.module";

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    JwtModule.register({}),
    TwitterModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Action.name, schema: ActionSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Event.name, schema: EventSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: News.name, schema: NewsSchema },
      { name: Nft.name, schema: NftSchema },
      { name: TwitterAcc.name, schema: TwitterAccSchema },
      { name: TwitterPerson.name, schema: TwitterPersonSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: LiveNews.name, schema: LiveNewsSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
    TelegramModule,
    MessageModule,
    EntitlementsModule
  ],
  controllers: [LeaderboardController],
  providers: [
    LeaderboardService,
    FilesService,
    RatingService,
    CommentsService,
    TwitterAccsParcingService,
    NotificationsService,
    EmailService,
    ActivityService
  ],
})
export class LeaderboardModule {}

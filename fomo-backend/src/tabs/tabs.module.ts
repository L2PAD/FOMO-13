import { Module } from "@nestjs/common";
import { TabsController } from "./tabs.controller";
import { AdminTabsController } from "./admin-tabs.controller";
import { TabsService } from "./tabs.service";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/user.model";
import { Asset, AssetSchema } from "src/assets/models/asset.model";
import { CryptoTab, CryptoTabSchema } from "./model/tab.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { News, NewsSchema } from "src/news/models/news.model";
import {
  Notification,
  NotificationSchema,
} from "src/notifications/model/notification.model";
import { FilesService } from "src/files/files.service";
import { RatingService } from "src/rating/rating.service";
import { CommentsService } from "src/comments/comments.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { Event, EventSchema } from "src/events/models/event.model";
import { Action, ActionSchema } from "src/actions/models/action.model";
import { Nft, NftSchema } from "src/nft/nft.model";
import { LiveNews, LiveNewsSchema } from "src/twitter/livenews.model";
import { TelegramService } from "src/telegram/telegram.service";
import { EmailService } from "src/email/email.service";
import { FomoV2Module } from "src/fomo-v2/fomo-v2.module";
import { Activity, ActivitySchema } from "src/activity/models/activity.model";
import { ActivityService } from "src/activity/activity.service";
import { MessageModule } from "src/message/message.module";
import { TwitterModule } from "src/twitter/twitter.module";
import { TelegramModule } from "src/telegram/telegram.module";
import { EntitlementsModule } from "src/entitlements/entitlements.module";

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    FomoV2Module,
    TwitterModule,
    MongooseModule.forFeature([
      { name: CryptoTab.name, schema: CryptoTabSchema },
      { name: User.name, schema: UserSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: News.name, schema: NewsSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Event.name, schema: EventSchema },
      { name: Action.name, schema: ActionSchema },
      { name: Nft.name, schema: NftSchema },
      { name: LiveNews.name, schema: LiveNewsSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
    TelegramModule,
    MessageModule,
    EntitlementsModule
  ],
  controllers: [TabsController, AdminTabsController],
  providers: [
    TabsService,
    FilesService,
    RatingService,
    CommentsService,
    NotificationsService,
    EmailService,
    ActivityService
  ],
})
export class TabsModule {}

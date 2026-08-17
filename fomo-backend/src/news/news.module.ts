import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { NestjsFormDataModule } from "nestjs-form-data";
import { MongooseModule } from '@nestjs/mongoose';

import { NewsController } from "./news.controller";

import { NewsService } from "./news.service";
import { ActionsService } from "src/actions/actions.service";
import { FilesService } from "src/files/files.service";
import { LimitsModule } from "src/limits/limits.module";

import { News, NewsSchema} from "./models/news.model";
import {
  NEWS_ARTICLES_CONNECTION,
  NewsArticleSource,
  NewsArticleSourceSchema,
} from "./models/news-article-source.model";
import { Action,ActionSchema } from "src/actions/models/action.model";
import { User, UserSchema } from "src/user/user.model";
import { Funds,FundsSchema } from "src/funds/funds.model";
import { Event,EventSchema } from "src/events/models/event.model";
import { Project,ProjectSchema } from "../projects/project.model";
import { Person,PersonSchema } from "src/persons/person.model";
import { Nft,NftSchema } from 'src/nft/nft.model';
import { Notification, NotificationSchema } from "src/notifications/model/notification.model";
import { NotificationsService } from "src/notifications/notifications.service";
import { TelegramService } from "src/telegram/telegram.service";
import { HttpModule } from "@nestjs/axios";
import { EmailService } from "src/email/email.service";
import { AuthModule } from "src/auth/auth.module";
import { TelegramModule } from "src/telegram/telegram.module";

@Module({
  imports:[
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      connectionName: NEWS_ARTICLES_CONNECTION,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>("NEWS_ARTICLES_MONGO_URL") ||
          configService.get<string>("API_BACKEND_MONGO_URL") ||
          configService.get<string>("MONGO_URL") ||
          configService.get<string>("DB_URL") ||
          "mongodb://localhost:27017",
        dbName:
          configService.get<string>("NEWS_ARTICLES_DB_NAME") ||
          configService.get<string>("API_BACKEND_DB_NAME") ||
          "fomo_market",
        maxPoolSize: parseInt(configService.get<string>("NEWS_ARTICLES_DB_MAX_POOL_SIZE") || "5"),
        minPoolSize: 0,
        autoIndex: false,
      }),
    }),
    MongooseModule.forFeature([
      {name: News.name, schema: NewsSchema},
      {name: Project.name, schema: ProjectSchema},    
      {name: User.name, schema: UserSchema},    
      {name: Action.name, schema: ActionSchema},    
      {name: Person.name,schema: PersonSchema},
      {name: Event.name,schema: EventSchema},
      {name: Funds.name,schema: FundsSchema},
      {name: Nft.name,schema: NftSchema},
      {name: Notification.name,schema: NotificationSchema},
    ]),
    MongooseModule.forFeature([
      { name: NewsArticleSource.name, schema: NewsArticleSourceSchema },
    ], NEWS_ARTICLES_CONNECTION),
    LimitsModule,
    TelegramModule
  ],
  controllers: [NewsController],
  providers: [
    NewsService, FilesService, 
    ActionsService,
    NotificationsService,
    EmailService
  ],
  exports:[NewsService]
})
export class NewsModule {}

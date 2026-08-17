import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NftController } from './nft.controller';
import { NftService } from './nft.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsFormDataModule } from "nestjs-form-data";

import { FilesService } from '../files/files.service';
import { ActionsService } from 'src/actions/actions.service';

import { Nft, NftSchema } from "./nft.model";
import { ModeratorNft,ModeratorNftSchema } from "./moderator-nft.model";
import { AdminNft,AdminNftSchema } from "./admin-nft.model";
import { Action,ActionSchema } from 'src/actions/models/action.model';
import { User, UserSchema } from 'src/user/user.model';
import { Project,ProjectSchema} from "../projects/project.model";
import { Event,EventSchema } from "src/events/models/event.model";
import { Person,PersonSchema } from "src/persons/person.model";
import { Funds,FundsSchema } from 'src/funds/funds.model';
import { News,NewsSchema } from 'src/news/models/news.model';
import { Notification, NotificationSchema } from 'src/notifications/model/notification.model';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { EmailService } from 'src/email/email.service';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports:[
    HttpModule,
    NestjsFormDataModule,
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([
      {name: Nft.name,schema: NftSchema},
      {name: ModeratorNft.name,schema: ModeratorNftSchema},
      {name: AdminNft.name,schema: AdminNftSchema},
      {name: Action.name,schema: ActionSchema},
      {name: User.name,schema: UserSchema},
      {name: Person.name,schema: PersonSchema},
      {name: Event.name,schema: EventSchema},
      {name: Funds.name,schema: FundsSchema},
      {name: Project.name, schema: ProjectSchema},    
      {name: News.name, schema: NewsSchema},    
      {name: Notification.name,schema: NotificationSchema},
    ]),
    TelegramModule
  ],  
  controllers: [NftController],
  providers: 
  [
    NftService,FilesService,ConfigService,ActionsService,
    NotificationsService,EmailService
  ]
})
export class NftModule {}

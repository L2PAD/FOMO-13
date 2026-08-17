import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SocialNotificationsService } from './social-notifications.service';
import { HttpModule } from '@nestjs/axios';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/user.model';
import { Notification, NotificationSchema } from './model/notification.model';
import { SocialNotification, SocialNotificationSchema } from './model/social-notification.model';
import { TelegramService } from 'src/telegram/telegram.service';
import { EmailService } from 'src/email/email.service';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports:[
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name: User.name,schema: UserSchema},
      {name: Notification.name,schema: NotificationSchema},
      {name: SocialNotification.name,schema: SocialNotificationSchema},
      // {name: Project.name,schema: ProjectSchema},
      // {name: Comment.name,schema: CommentSchema},
      // {name: Action.name,schema: ActionSchema},
      // {name: Person.name,schema: PersonSchema},
      // {name: Event.name,schema: EventSchema},
      // {name: Funds.name,schema: FundsSchema},
      // {name: News.name,schema: NewsSchema},
      // {name: Nft.name,schema: NftSchema},
      // {name: TwitterAcc.name,schema: TwitterAccSchema},
      // {name: TwitterPerson.name,schema: TwitterPersonSchema},
    ]),
    TelegramModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService,EmailService,SocialNotificationsService],
  exports: [NotificationsService,SocialNotificationsService]
})
export class NotificationsModule {}

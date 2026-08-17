import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { ActionsService } from "src/actions/actions.service";
import { EventSchema , Event} from "./models/event.model";
import { ProjectSchema , Project} from "../projects/project.model";
import { FilesService } from "src/files/files.service";
import { NestjsFormDataModule } from "nestjs-form-data";
import { Nft,NftSchema } from "src/nft/nft.model";
import { Action,ActionSchema } from "src/actions/models/action.model";
import { Person,PersonSchema } from "src/persons/person.model";
import { Funds,FundsSchema } from 'src/funds/funds.model';
import { News,NewsSchema } from "src/news/models/news.model";
import { User,UserSchema } from "src/user/user.model";
import { HttpModule } from "@nestjs/axios";
import { Notification, NotificationSchema } from "src/notifications/model/notification.model";
import { NotificationsService } from "src/notifications/notifications.service";
import { TelegramService } from "src/telegram/telegram.service";
import { EmailService } from "src/email/email.service";
import { AuthModule } from "src/auth/auth.module";
import { TelegramModule } from "src/telegram/telegram.module";
import { CalendarService } from "./calendar/calendar.service";
import { AdminCalendarController } from "./calendar/admin-calendar.controller";
import { PublicCalendarController } from "./calendar/public-calendar.controller";
import { Digest, DigestSchema } from "./calendar/digest.model";
import { DigestService } from "./calendar/digest.service";
import { AdminDigestController, PublicDigestController } from "./calendar/digest.controller";
import { EntitlementsModule } from "src/entitlements/entitlements.module";

@Module({
  imports:[
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    EntitlementsModule,
    MongooseModule.forFeature([
      {name: Event.name,schema: EventSchema},
      {name: Project.name, schema: ProjectSchema},
      {name: Nft.name, schema: NftSchema},
      {name: Action.name, schema: ActionSchema},
      {name: Person.name,schema: PersonSchema},
      {name: Event.name,schema: EventSchema},
      {name: Funds.name,schema: FundsSchema},
      {name: Project.name, schema: ProjectSchema},    
      {name: News.name, schema: NewsSchema},    
      {name: User.name, schema: UserSchema},    
      {name: Notification.name,schema: NotificationSchema},
      {name: Digest.name, schema: DigestSchema},
    ]),
    TelegramModule
  ],
  controllers: [EventsController, AdminCalendarController, PublicCalendarController, AdminDigestController, PublicDigestController],
  providers: [
    EventsService, FilesService,ActionsService,
    NotificationsService,EmailService,
    CalendarService,
    DigestService,
  ],
})
export class EventsModule {}
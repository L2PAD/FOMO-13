import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EmailModule } from "src/email/email.module";
import { Event, EventSchema } from "src/events/models/event.model";
import { TelegramModule } from "src/telegram/telegram.module";
import { User, UserSchema } from "src/user/user.model";
import { FomoV2UnlockReminderService } from "./services/unlock-reminder.service";

@Module({
  imports: [
    EmailModule,
    TelegramModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [FomoV2UnlockReminderService],
  exports: [FomoV2UnlockReminderService],
})
export class FomoV2UnlockReminderModule {}

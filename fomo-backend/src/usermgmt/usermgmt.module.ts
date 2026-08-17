import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { UsermgmtController } from "./usermgmt.controller";
import { UsermgmtService } from "./usermgmt.service";
import { UserInvite, UserInviteSchema } from "./models/user-invite.model";
import { EmailSettings, EmailSettingsSchema } from "./models/email-settings.model";
import { User, UserSchema } from "../user/user.model";

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: UserInvite.name, schema: UserInviteSchema },
      { name: EmailSettings.name, schema: EmailSettingsSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [UsermgmtController],
  providers: [UsermgmtService],
  exports: [UsermgmtService],
})
export class UsermgmtModule {}

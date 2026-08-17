import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/user.model";
import {
  UserActionLog,
  UserActionLogSchema,
} from "./user-action-log.model";
import { UserActionLogsService } from "./user-action-logs.service";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserActionLog.name, schema: UserActionLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [UserActionLogsService],
  exports: [UserActionLogsService],
})
export class UserActionLogsModule {}

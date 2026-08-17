import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { User, UserSchema } from "src/user/user.model";
import { XpModule } from "src/xp/xp.module";
import { SpaceportStakingModule } from "src/spaceport-staking/spaceport-staking.module";
import { SpaceportService } from "./spaceport.service";
import { SpaceportController, AdminSpaceportController } from "./spaceport.controller";
import {
  SpaceportConfig,
  SpaceportConfigSchema,
  SpaceportUserState,
  SpaceportUserStateSchema,
} from "./spaceport.models";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: SpaceportConfig.name, schema: SpaceportConfigSchema },
      { name: SpaceportUserState.name, schema: SpaceportUserStateSchema },
    ]),
    XpModule,
    SpaceportStakingModule,
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [SpaceportController, AdminSpaceportController],
  providers: [SpaceportService],
  exports: [SpaceportService],
})
export class SpaceportModule {}

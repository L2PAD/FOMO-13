import { Module } from "@nestjs/common";
import { TokenUnlocksController } from "./token-unlocks.controller";
import { TokenUnlocksService } from "./token-unlocks.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { IntelSyncModule } from "src/intel-sync/intel-sync.module";
import { TokenUnlock, TokenUnlockSchema } from "./models/token-unlock.model";
import { TokenUnlocksIntelSyncService } from "./token-unlocks-intel-sync.service";
import { HttpModule } from "@nestjs/axios";
import { Event, EventSchema } from "src/events/models/event.model";
import { User, UserSchema } from "src/user/user.model";
import { EmailModule } from "src/email/email.module";
import { TelegramModule } from "src/telegram/telegram.module";
import { CryptoLinkingModule } from "src/crypto-linking/crypto-linking.module";
import { ProjectIntelInternalSyncGuard } from "src/projects/intel-sync/project-intel-internal-sync.guard";
import { Project, ProjectSchema } from "src/projects/project.model";
import { FomoV2Module } from "src/fomo-v2/fomo-v2.module";

@Module({
  imports: [
    HttpModule,
    EmailModule,
    IntelSyncModule,
    TelegramModule,
    CryptoLinkingModule,
    FomoV2Module,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: TokenUnlock.name, schema: TokenUnlockSchema },
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [TokenUnlocksController],
  providers: [TokenUnlocksService, TokenUnlocksIntelSyncService, ProjectIntelInternalSyncGuard],
  exports: [TokenUnlocksService],
})
export class TokenUnlocksModule {}

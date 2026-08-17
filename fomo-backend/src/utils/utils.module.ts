import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { UtilsController } from "./utils.controller";

import { UtilsService } from "./utils.service";
import { TwitterAccsParcingService } from "src/social-parcing/twitter-accs-parcing.service";

import { AiResults, AiResultsSchema } from "./models/ai-results.model";
import {
  TwitterAcc,
  TwitterAccSchema,
} from "src/social-parcing/models/twitter-acc.model";
import {
  TwitterPerson,
  TwitterPersonSchema,
} from "src/social-parcing/models/twitter-person.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import { TelegramService } from "src/telegram/telegram.service";
import { User, UserSchema } from "src/user/user.model";
import { AuthModule } from "src/auth/auth.module";
import { TelegramModule } from "src/telegram/telegram.module";
import { TwitterKeywords, TwitterKeywordsSchema } from "src/social-parcing/models/twitter-keywords.model";

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: TwitterAcc.name, schema: TwitterAccSchema },
      { name: TwitterPerson.name, schema: TwitterPersonSchema },
      { name: AiResults.name, schema: AiResultsSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    TelegramModule,
  ],
  controllers: [UtilsController],
  providers: [UtilsService, TwitterAccsParcingService],
})
export class UtilsModule {}

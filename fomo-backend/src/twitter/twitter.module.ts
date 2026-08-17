import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { TwitterStrategy } from "./twitter.strategy";
import { TwitterController } from "./twitter.controller";
import { TwitterService } from "./twitter.service";
import { HttpModule } from "@nestjs/axios";
import { MongooseModule } from "@nestjs/mongoose";
import { LiveNews, LiveNewsSchema } from "./livenews.model";
import { BullModule } from "@nestjs/bull";
import { TwitterParserProcessor } from "./twitter.processor";
import { ProjectTwitter, ProjectTwitterSchema } from "./project-twitter.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { User, UserSchema } from "src/user/user.model";
import { RatingModule } from "src/rating/rating.module";
import { TwitterAcc, TwitterAccSchema } from "src/social-parcing/models/twitter-acc.model";
import { TwitterPerson, TwitterPersonSchema } from "src/social-parcing/models/twitter-person.model";
import { AuthModule } from "src/auth/auth.module";
import { TwitterOAuthState, TwitterOAuthStateSchema } from "./twitter-oauth-state.model";
import { TwitterLinkStateGuard } from "./twitter-link-state.guard";
import { TwitterStartGuard } from "./twitter-start.guard";
import { TwitterOAuthExceptionFilter } from "./twitter-oauth-exception.filter";

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({
      name: "twitter-parser",
    }),
    PassportModule.register({ defaultStrategy: "twitter" }),
    ConfigModule.forRoot(),
    JwtModule.register({}),
    RatingModule,
    MongooseModule.forFeature([
      { name: LiveNews.name, schema: LiveNewsSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: User.name, schema: UserSchema },
      { name: ProjectTwitter.name, schema: ProjectTwitterSchema },
      { name: TwitterOAuthState.name, schema: TwitterOAuthStateSchema },
      { name: TwitterAcc.name, schema: TwitterAccSchema },
      { name: TwitterPerson.name, schema: TwitterPersonSchema },
    ]),
    AuthModule
  ],
  controllers: [TwitterController],
  providers: [
    TwitterStrategy,
    TwitterService,
    TwitterParserProcessor,
    TwitterLinkStateGuard,
    TwitterStartGuard,
    TwitterOAuthExceptionFilter,
  ],
  exports: [TwitterService],
})
export class TwitterModule {
}

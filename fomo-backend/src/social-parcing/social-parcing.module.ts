import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { MongooseModule } from '@nestjs/mongoose';
import { SocialParcingController } from "./social-parcing.controller";
import { SocialParcingService } from "./social-pacing.service";
import { TwitterAccSchema , TwitterAcc} from "./models/twitter-acc.model";
import { TwitterPersonSchema , TwitterPerson} from "./models/twitter-person.model";
import { TwitterKeywords, TwitterKeywordsSchema } from "./models/twitter-keywords.model";
import { NestjsFormDataModule } from "nestjs-form-data";
import { TwitterAccsParcingService } from './twitter-accs-parcing.service';
import { HttpModule } from '@nestjs/axios';
import { TwitterModule } from "src/twitter/twitter.module";

@Module({
  imports:[
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    TwitterModule,
    MongooseModule.forFeature([
      {name: TwitterAcc.name,schema: TwitterAccSchema},
      {name: TwitterPerson.name,schema: TwitterPersonSchema},
      {name: TwitterKeywords.name,schema: TwitterKeywordsSchema},
    ]),
  ],
  controllers: [SocialParcingController],
  providers: [SocialParcingService, TwitterAccsParcingService],
  exports: [SocialParcingService, TwitterAccsParcingService],
})
export class SocialParcingModule {}
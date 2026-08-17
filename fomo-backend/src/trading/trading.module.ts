import { Module } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Trading, TradingSchema } from './models/trading.model';
import { ProjectTwitter, ProjectTwitterSchema } from 'src/twitter/project-twitter.model';
import { Project, ProjectSchema } from "src/projects/project.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { User, UserSchema } from "src/user/user.model";
import { RatingModule } from "src/rating/rating.module";
import { TwitterAcc, TwitterAccSchema } from "src/social-parcing/models/twitter-acc.model";
import { TwitterPerson, TwitterPersonSchema } from "src/social-parcing/models/twitter-person.model";
import { LiveNews, LiveNewsSchema } from 'src/twitter/livenews.model';
import { TwitterModule } from 'src/twitter/twitter.module';
import { SocialParcingModule } from '../social-parcing/social-parcing.module';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: LiveNews.name, schema: LiveNewsSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: User.name, schema: UserSchema },
      { name: ProjectTwitter.name, schema: ProjectTwitterSchema },
      { name: TwitterAcc.name, schema: TwitterAccSchema },
      { name: TwitterPerson.name, schema: TwitterPersonSchema },
      { name: Trading.name, schema: TradingSchema },
    ]),
    TwitterModule,
    SocialParcingModule
  ],
  providers: [TradingService],
  controllers: [TradingController]
})
export class TradingModule { }

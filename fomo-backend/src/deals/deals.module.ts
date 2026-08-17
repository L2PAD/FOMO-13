import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { DealsController } from './deals.controller';

import { DealsService } from './deals.service';

import { User, UserSchema } from 'src/user/user.model';
import { Deal, DealSchema } from './model/deal.model';
import { Appeal, AppealSchema } from './model/appeal.model';
import { PaymentMethod, PaymentMethodSchema } from './model/payment-method.model';
import { OtcMember, OtcMemberSchema } from './model/otcMember';
import { Review, ReviewSchema } from './model/review.model';
import { Activity, ActivitySchema } from 'src/activity/models/activity.model';
import { Chat, ChatSchema } from 'src/chat/models/chat.model';
import { Message, MessageSchema } from 'src/message/models/message.model';
import { Portfolio, PortfolioSchema } from 'src/portfolio/model/portfolio.model';
import { CollectionNft, CollectionNftSchema } from 'src/collection-nft/model/collection-nft.model';
import { ActivityService } from 'src/activity/activity.service';
import { FilesService } from 'src/files/files.service';
import { LimitsModule } from 'src/limits/limits.module';
import { MessageModule } from 'src/message/message.module';
import { ChatModule } from 'src/chat/chat.module';
import { FomoV2Module } from 'src/fomo-v2/fomo-v2.module';
import { FomoV2MarketProjectReadModel, FomoV2MarketProjectReadModelSchema } from 'src/fomo-v2/models';

@Module({
  imports: [
    HttpModule,
    NestjsFormDataModule,
    ConfigModule.forRoot(),
    JwtModule.register({}),
    LimitsModule,
    MessageModule,
    ChatModule,
    FomoV2Module,
    MongooseModule.forFeature([
      { name: Deal.name, schema: DealSchema },
      { name: User.name, schema: UserSchema },
      { name: OtcMember.name, schema: OtcMemberSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: PaymentMethod.name, schema: PaymentMethodSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Appeal.name, schema: AppealSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Portfolio.name, schema: PortfolioSchema },
      { name: CollectionNft.name, schema: CollectionNftSchema },
      { name: FomoV2MarketProjectReadModel.name, schema: FomoV2MarketProjectReadModelSchema },
    ])
  ],
  controllers: [DealsController],
  providers: [DealsService, ActivityService, FilesService]
})
export class DealsModule { }

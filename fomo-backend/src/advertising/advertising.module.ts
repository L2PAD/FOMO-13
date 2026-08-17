import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdvertisingController } from './advertising.controller';
import { AdvertisingService } from './advertising.service';
import { DeliveryService } from './delivery.service';
import { AdCampaign, AdCampaignSchema } from './models/campaign.model';
import { AdCreative, AdCreativeSchema } from './models/creative.model';
import { AdAdvertiser, AdAdvertiserSchema } from './models/advertiser.model';
import { AdRequest, AdRequestSchema } from './models/ad-request.model';
import { AdDeliveryEvent, AdDeliveryEventSchema } from './models/delivery-event.model';
import { AdDailyAggregate, AdDailyAggregateSchema } from './models/daily-aggregate.model';
import { AdPlacementSetting, AdPlacementSettingSchema } from './models/placement-setting.model';
import { AdReport, AdReportSchema } from './models/ad-report.model';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot(),
    EmailModule,
    MongooseModule.forFeature([
      { name: AdCampaign.name, schema: AdCampaignSchema },
      { name: AdCreative.name, schema: AdCreativeSchema },
      { name: AdAdvertiser.name, schema: AdAdvertiserSchema },
      { name: AdRequest.name, schema: AdRequestSchema },
      { name: AdDeliveryEvent.name, schema: AdDeliveryEventSchema },
      { name: AdDailyAggregate.name, schema: AdDailyAggregateSchema },
      { name: AdPlacementSetting.name, schema: AdPlacementSettingSchema },
      { name: AdReport.name, schema: AdReportSchema },
    ]),
  ],
  controllers: [AdvertisingController],
  providers: [AdvertisingService, DeliveryService],
  exports: [AdvertisingService, DeliveryService],
})
export class AdvertisingModule {}

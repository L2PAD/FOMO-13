import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SpaceportPurchasesController } from './spaceport-purchases.controller';
import { SpaceportPurchasesService } from './spaceport-purchases.service';
import {
  SpaceportPurchase,
  SpaceportPurchaseSchema,
} from './model/spaceport-purchase.model';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: SpaceportPurchase.name, schema: SpaceportPurchaseSchema },
    ]),
  ],
  controllers: [SpaceportPurchasesController],
  providers: [SpaceportPurchasesService],
  exports: [SpaceportPurchasesService],
})
export class SpaceportPurchasesModule {}

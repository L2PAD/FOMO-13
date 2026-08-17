import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CoinMarketCapService } from './coinmarketcap.service';
import { Coinmarketcap, CoinmarketcapSchema } from './models/coinmarketcap.model';

@Module({
  imports:[
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name:Coinmarketcap.name,schema:CoinmarketcapSchema},
    ]),
  ],
  providers: [CoinMarketCapService],
  exports: [CoinMarketCapService],
})
export class CoinmarketcapModule {}

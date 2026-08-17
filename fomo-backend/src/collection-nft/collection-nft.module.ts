import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CollectionNftService } from './collection-nft.service';

import { CollectionNftController } from './collection-nft.controller';

import { CollectionNft, CollectionNftSchema } from './model/collection-nft.model';
import { Project, ProjectSchema } from 'src/projects/project.model';
import { Collection, CollectionSchema } from 'src/collections/models/collection.model';
import { User, UserSchema } from 'src/user/user.model';
import { CollectionsService } from 'src/collections/collections.service';
import {
  CollectionNftMarketSnapshot,
  CollectionNftMarketSnapshotSchema,
} from './model/collection-nft-market-snapshot.model';
import {
  CollectionNftPeriodStats,
  CollectionNftPeriodStatsSchema,
} from './model/collection-nft-period-stats.model';
import {
  CollectionNftSale,
  CollectionNftSaleSchema,
} from './model/collection-nft-sale.model';
import {
  CollectionNftSaleStats,
  CollectionNftSaleStatsSchema,
} from './model/collection-nft-sale-stats.model';
import { Cart, CartSchema } from 'src/cart/model/cart.model';
import {
  Coinmarketcap,
  CoinmarketcapSchema,
} from 'src/coinmarketcap/models/coinmarketcap.model';
import { Order, OrderSchema } from 'src/orders/model/order.model';

@Module({
  imports:[
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name: CollectionNft.name,schema: CollectionNftSchema},
      {name: Collection.name,schema: CollectionSchema},
      {name: Project.name,schema: ProjectSchema},
      {name: User.name,schema: UserSchema},
      {name: Project.name,schema: ProjectSchema},
      {name: CollectionNftMarketSnapshot.name,schema: CollectionNftMarketSnapshotSchema},
      {name: CollectionNftPeriodStats.name,schema: CollectionNftPeriodStatsSchema},
      {name: CollectionNftSale.name,schema: CollectionNftSaleSchema},
      {name: CollectionNftSaleStats.name,schema: CollectionNftSaleStatsSchema},
      {name: Coinmarketcap.name,schema: CoinmarketcapSchema},
      {name: Cart.name,schema: CartSchema},
      {name: Order.name,schema: OrderSchema},
    ]),
  ],
  controllers: [CollectionNftController],
  providers: [CollectionNftService,CollectionsService]
})
export class CollectionNftModule {}

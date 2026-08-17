import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CollectionsController } from './collections.controller';

import { CollectionsService } from './collections.service';
import { Project, ProjectSchema } from 'src/projects/project.model';
import { Collection, CollectionSchema } from './models/collection.model';
import { CollectionNft, CollectionNftSchema } from 'src/collection-nft/model/collection-nft.model';
import {
  CollectionNftSale,
  CollectionNftSaleSchema,
} from 'src/collection-nft/model/collection-nft-sale.model';
import {
  Coinmarketcap,
  CoinmarketcapSchema,
} from 'src/coinmarketcap/models/coinmarketcap.model';
import { User, UserSchema } from 'src/user/user.model';

@Module({
  imports:[
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name: Collection.name,schema: CollectionSchema},
      {name: Project.name,schema: ProjectSchema},
      {name: CollectionNft.name,schema: CollectionNftSchema},
      {name: CollectionNftSale.name,schema: CollectionNftSaleSchema},
      {name: Coinmarketcap.name,schema: CoinmarketcapSchema},
      {name: User.name,schema: UserSchema},
    ]),
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService]
})
export class CollectionsModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { OrdersController } from './orders.controller';

import { OrdersService } from './orders.service';

import { Project, ProjectSchema } from 'src/projects/project.model';
import { User, UserSchema } from 'src/user/user.model';
import { Order, OrderSchema } from './model/order.model';
import { CollectionNft, CollectionNftSchema } from 'src/collection-nft/model/collection-nft.model';
import { Collection, CollectionSchema } from 'src/collections/models/collection.model';

@Module({
  imports:[
    HttpModule,
    NestjsFormDataModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name: Project.name, schema: ProjectSchema},    
      {name: User.name, schema: UserSchema},    
      {name: Order.name, schema: OrderSchema},    
      {name: CollectionNft.name, schema: CollectionNftSchema},    
      {name: Collection.name, schema: CollectionSchema},    
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}

import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionNft, CollectionNftSchema } from 'src/collection-nft/model/collection-nft.model';
import { User, UserSchema } from 'src/user/user.model';
import { Cart, CartSchema } from './model/cart.model';

@Module({
  imports:[
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      {name: CollectionNft.name,schema: CollectionNftSchema},
      {name: User.name,schema: UserSchema},
      {name: Cart.name,schema: CartSchema},
    ]),
  ],
  controllers: [CartController],
  providers: [CartService]
})
export class CartModule {}

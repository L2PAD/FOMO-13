import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CollectionNft, CollectionNftDocument } from 'src/collection-nft/model/collection-nft.model';
import { User, UserDocument } from 'src/user/user.model';
import { Cart, CartDocument } from './model/cart.model';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(CollectionNft.name) private collectionNftModel: Model<CollectionNftDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    ){}

    async getUserCart(ownerId:string) : Promise<any> {
        const cartItems = await this.cartModel
          .find({ ownerId: new mongoose.Types.ObjectId(ownerId) })
          .populate('nftId')
          .exec();

        const filteredCartItems = cartItems.filter(item => item.nftId);

        return filteredCartItems
    }

    async addNft(data:{ownerId:string,nftId:string}) : Promise<Cart> {
        const isIncludes : any = await this.cartModel.findOneAndDelete({
            ownerId:new mongoose.Types.ObjectId(data.ownerId),
            nftId:new mongoose.Types.ObjectId(data.nftId),
        })

        if(!!isIncludes) return isIncludes
        
        return this.cartModel.create({
            ownerId:new mongoose.Types.ObjectId(data.ownerId),
            nftId:new mongoose.Types.ObjectId(data.nftId),
        })
    }

    async removeNft(data:{ownerId:string,nftId:string}) : Promise<Cart> {
        return this.cartModel.findOneAndDelete({
            ownerId:new mongoose.Types.ObjectId(data.ownerId),
            nftId:new mongoose.Types.ObjectId(data.nftId),
        })
    }
}

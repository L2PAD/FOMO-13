import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CartDocument = HydratedDocument<Cart>;

@Schema()
export class Cart {
    @Prop({type:mongoose.Types.ObjectId,ref: 'User',required:true})
    ownerId:mongoose.Types.ObjectId

    @Prop({type:mongoose.Types.ObjectId,ref: 'CollectionNft',required:true})
    nftId:mongoose.Types.ObjectId

    @Prop({default:new Date()})
    created:Date
}

export const CartSchema = SchemaFactory.createForClass(Cart);
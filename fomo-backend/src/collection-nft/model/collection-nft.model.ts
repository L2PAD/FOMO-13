import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type CollectionNftDocument = HydratedDocument<CollectionNft>;

@Schema()
export class CollectionNft {
    @Prop()
    description:string

    @Prop()
    external_url:string

    @Prop()
    image:string

    @Prop()
    name:string

    @Prop()
    attributes:Array<any>

    @Prop()
    collectionId:mongoose.Types.ObjectId

    @Prop()
    nftId:number

    @Prop()
    price:number 

    @Prop({ default: null })
    orderId:number | null

    @Prop({ default: null })
    endDate: Date | null

    @Prop()
    isEth:boolean 

    @Prop()
    isUsdc:boolean

    @Prop({default:true})
    isActive:boolean

    @Prop({ default: 0 })
    viewsCount:number

    @Prop({ type: [Types.ObjectId], default: [] })
    viewedBy:Array<Types.ObjectId>

    @Prop()
    ownerId:mongoose.Types.ObjectId

    @Prop({default:''})
    tokenAddress:string
}

export const CollectionNftSchema = SchemaFactory.createForClass(CollectionNft);

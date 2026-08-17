import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type AssetDocument = HydratedDocument<Asset>;

export type AssetTypes = 'buy' | 'sell' 

@Schema()
export class Asset {
    @Prop({required:true})
    type:AssetTypes

    @Prop({required:true,default:''})
    name:string 

    @Prop({required:true,default:''})
    ticker:string 

    @Prop({required:true,default:0})
    amount:number 
    
    @Prop({required:true,default:0})
    price:number 

    @Prop({required:true})
    date:Date 

    @Prop({default:0})
    totalPrice:number 

    @Prop({default:0})
    fee:number

    @Prop()
    note:string

    @Prop({default:new Date()})
    createAt:Date 

    @Prop()
    creator:mongoose.Types.ObjectId

    @Prop()
    logo:string

    @Prop()
    isSelectedAsset:boolean
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
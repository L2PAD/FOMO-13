import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type OrderDocument = HydratedDocument<Order>;

@Schema()
export class Order {
  @Prop({ required: true })
  userId:mongoose.Types.ObjectId

  @Prop({ required: true })
  collectionNftId:mongoose.Types.ObjectId

  @Prop({ required: true })
  collectionId:mongoose.Types.ObjectId

  @Prop({ required: true })
  projectId:mongoose.Types.ObjectId

  @Prop({default:new Date()})
  created:Date

  @Prop({default:0})
  belowFloor:number

  @Prop({default:0})
  price:number

  @Prop({default:false})
  isEth:boolean

  @Prop({default:false})
  isUsdc:boolean

  @Prop({default:new Date()})
  endDate:Date

  @Prop({default:false})
  isConfirm:boolean

  @Prop({ default: null })
  smartOrderId:number | null

  @Prop({default:true})
  isActive:boolean
}

export const OrderSchema = SchemaFactory.createForClass(Order);

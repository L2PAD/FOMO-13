import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Mongoose, Types } from "mongoose";

export type ActivityTypes = "investments" | "deals" | 'comments' | 'other';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema()
export class Activity {
  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({default:new Date()})
  createdAt:Date 

  @Prop({default:''})
  title:string

  @Prop({default:'other'})
  type:ActivityTypes

  @Prop({default:''})
  link:string
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

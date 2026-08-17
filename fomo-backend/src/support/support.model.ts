import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type SupportDocument = HydratedDocument<Support>;

@Schema()
export class Support {
  @Prop({default:new Date()})
  date:Date

  @Prop({ required: true })
  theme:string

  @Prop({ required: true })
  message: string;

  @Prop()
  project: mongoose.Types.ObjectId;
  
  @Prop({required:true})
  user:mongoose.Types.ObjectId

  @Prop({ required: false })
  file: string;

  @Prop()
  category:string
}

export const SupportSchema = SchemaFactory.createForClass(Support);

SupportSchema.index({ user: 1, date: -1 });

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { NotificationsTypes } from "../dto/create-alert.dto";

export type AiResultsDocument = HydratedDocument<AiResults>;

export type AiResultItem = {
  id:string
  result:{
    label:string 
    score:number
  }
}

@Schema()
export class AiResults {
  @Prop()
  name:string

  @Prop()
  sensitivity:Array<number>

  @Prop()
  notificationTypes:Array<NotificationsTypes>

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  projectId: mongoose.Types.ObjectId;

  @Prop()
  results:Array<AiResultItem>
}

export const AiResultsSchema = SchemaFactory.createForClass(AiResults);

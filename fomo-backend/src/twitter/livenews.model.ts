import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type LiveNewsDocument = HydratedDocument<LiveNews>;

@Schema()
export class LiveNews {
  @Prop()
  page:string

  @Prop()
  tweets:Array<any>

  @Prop()
  entityId:mongoose.Types.ObjectId
}

export const LiveNewsSchema = SchemaFactory.createForClass(LiveNews);

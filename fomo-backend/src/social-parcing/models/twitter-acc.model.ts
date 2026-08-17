import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type TwitterAccDocument = HydratedDocument<TwitterAcc>;

@Schema({ timestamps: true })
export class TwitterAcc {
  @Prop({ default:'' })
  link: string;

  @Prop({ default:'' })
  isFavorites: string;
}

export const TwitterAccSchema = SchemaFactory.createForClass(TwitterAcc);

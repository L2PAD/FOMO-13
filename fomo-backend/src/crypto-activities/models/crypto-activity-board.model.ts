import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoActivityBoardDocument = HydratedDocument<CryptoActivityBoard>;

@Schema({ timestamps: true })
export class CryptoActivityBoard {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: "folder" })
  icon: string;

  @Prop({ default: 0 })
  order: number;
}

export const CryptoActivityBoardSchema = SchemaFactory.createForClass(CryptoActivityBoard);

CryptoActivityBoardSchema.index({ userId: 1, order: 1 });

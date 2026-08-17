import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoActivityBoardColumnDocument = HydratedDocument<CryptoActivityBoardColumn>;

@Schema({ timestamps: true })
export class CryptoActivityBoardColumn {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: 0 })
  order: number;
}

export const CryptoActivityBoardColumnSchema = SchemaFactory.createForClass(CryptoActivityBoardColumn);

CryptoActivityBoardColumnSchema.index({ userId: 1, order: 1 });

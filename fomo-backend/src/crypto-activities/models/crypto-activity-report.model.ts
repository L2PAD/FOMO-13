import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoActivityReportDocument = HydratedDocument<CryptoActivityReport>;

@Schema({ timestamps: true })
export class CryptoActivityReport {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  userId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  activityId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  v2ActivityId?: mongoose.Types.ObjectId;

  @Prop({ enum: ["legacy", "fomo_v2"], default: "legacy", index: true })
  activityEntity?: "legacy" | "fomo_v2";

  @Prop({ required: true })
  reason: string;

  @Prop()
  message?: string;
}

export const CryptoActivityReportSchema = SchemaFactory.createForClass(CryptoActivityReport);

CryptoActivityReportSchema.index(
  { v2ActivityId: 1, createdAt: -1 },
  { name: "idx_crypto_activity_reports_v2_activity_created" },
);

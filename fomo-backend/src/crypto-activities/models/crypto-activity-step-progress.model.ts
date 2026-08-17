import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoActivityStepProgressDocument = HydratedDocument<CryptoActivityStepProgress>;

@Schema({ timestamps: true })
export class CryptoActivityStepProgress {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  activityId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  v2ActivityId?: mongoose.Types.ObjectId;

  @Prop({ enum: ["legacy", "fomo_v2"], default: "legacy", index: true })
  activityEntity?: "legacy" | "fomo_v2";

  @Prop({ type: [String], default: [] })
  completedStepIds: string[];
}

export const CryptoActivityStepProgressSchema = SchemaFactory.createForClass(CryptoActivityStepProgress);

CryptoActivityStepProgressSchema.index({ userId: 1, activityId: 1 }, { unique: true });
CryptoActivityStepProgressSchema.index(
  { userId: 1, v2ActivityId: 1 },
  {
    unique: true,
    name: "uniq_crypto_activity_steps_user_v2_activity",
    partialFilterExpression: { v2ActivityId: { $type: "objectId" } },
  }
);

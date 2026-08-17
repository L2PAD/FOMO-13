import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoActivityFavoriteDocument = HydratedDocument<CryptoActivityFavorite>;

@Schema({ timestamps: true })
export class CryptoActivityFavorite {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  activityId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  v2ActivityId?: mongoose.Types.ObjectId;

  @Prop({ enum: ["legacy", "fomo_v2"], default: "legacy", index: true })
  activityEntity?: "legacy" | "fomo_v2";
}

export const CryptoActivityFavoriteSchema = SchemaFactory.createForClass(CryptoActivityFavorite);

CryptoActivityFavoriteSchema.index(
  { userId: 1, activityId: 1 },
  { unique: true }
);
CryptoActivityFavoriteSchema.index(
  { userId: 1, v2ActivityId: 1 },
  {
    unique: true,
    name: "uniq_crypto_activity_favorites_user_v2_activity",
    partialFilterExpression: { v2ActivityId: { $type: "objectId" } },
  }
);

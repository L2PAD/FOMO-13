import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoActivityCalendarItemDocument =
  HydratedDocument<CryptoActivityCalendarItem>;

@Schema({ timestamps: true })
export class CryptoActivityCalendarItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  activityId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  v2ActivityId?: mongoose.Types.ObjectId;

  @Prop({ enum: ["legacy", "fomo_v2"], default: "legacy", index: true })
  activityEntity?: "legacy" | "fomo_v2";

  @Prop()
  date?: Date;

  @Prop()
  note?: string;
}

export const CryptoActivityCalendarItemSchema = SchemaFactory.createForClass(
  CryptoActivityCalendarItem
);

CryptoActivityCalendarItemSchema.index(
  { userId: 1, activityId: 1 },
  { unique: true }
);
CryptoActivityCalendarItemSchema.index(
  { userId: 1, v2ActivityId: 1 },
  {
    unique: true,
    name: "uniq_crypto_activity_calendar_user_v2_activity",
    partialFilterExpression: { v2ActivityId: { $type: "objectId" } },
  }
);
CryptoActivityCalendarItemSchema.index(
  { userId: 1, date: 1, createdAt: 1 },
  { name: "idx_crypto_activity_calendar_user_date_created" }
);

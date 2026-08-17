import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type XpTxStatus = "pending" | "awarded" | "rejected" | "reversed";

/**
 * Authoritative XP change log. `user.activityXP` is a denormalized projection of
 * SUM(finalXp) over statuses in {awarded, reversed(negative comp entries)}.
 * Negative corrections are compensating entries, never edits of past rows.
 */
@Schema({ collection: "xp_transactions", timestamps: true })
export class XpTransaction extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  eventType: string;

  @Prop({ default: "system" })
  source: string; // system | demo-seed | migration | admin

  @Prop({ default: "" })
  sourceType: string;

  @Prop({ default: "" })
  sourceId: string;

  @Prop({ default: 0 })
  baseXp: number;

  @Prop({ default: 1 })
  multiplier: number;

  @Prop({ required: true, default: 0 })
  finalXp: number;

  @Prop({ required: true, default: "awarded", index: true })
  status: XpTxStatus;

  @Prop({ required: true, unique: true })
  idempotencyKey: string;

  @Prop({ default: "" })
  reason: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: () => new Date() })
  occurredAt: Date;

  @Prop({ type: Date, default: null })
  awardedAt: Date | null;

  @Prop({ type: Date, default: null })
  reversedAt: Date | null;
}

export const XpTransactionSchema = SchemaFactory.createForClass(XpTransaction);
XpTransactionSchema.index({ userId: 1, eventType: 1, status: 1 });
XpTransactionSchema.index({ userId: 1, awardedAt: -1 });
XpTransactionSchema.index({ source: 1 });

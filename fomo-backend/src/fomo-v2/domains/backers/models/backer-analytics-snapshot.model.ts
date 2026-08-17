import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { FOMO_V2_BACKER_TYPES, FomoV2BackerType } from "../types";

export type FomoV2BackerAnalyticsSnapshotDocument =
  HydratedDocument<FomoV2BackerAnalyticsSnapshot>;

export type FomoV2BackerAnalyticsSnapshotStatus =
  | "building"
  | "ready"
  | "failed";

@Schema({
  collection: "backer_analytics_snapshots",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2BackerAnalyticsSnapshot {
  @Prop({ required: true })
  snapshotKey: string;

  @Prop({ required: true, enum: FOMO_V2_BACKER_TYPES, index: true })
  backerType: FomoV2BackerType;

  @Prop({ required: true, index: true })
  scope: string;

  @Prop({ required: true, index: true })
  version: string;

  @Prop({ required: true, default: "building", index: true })
  status: FomoV2BackerAnalyticsSnapshotStatus;

  @Prop({ index: true })
  generatedAt?: Date;

  @Prop({ index: true })
  startedAt?: Date;

  @Prop({ index: true })
  completedAt?: Date;

  @Prop({ index: true })
  expiresAt?: Date;

  @Prop({ default: 0 })
  durationMs?: number;

  @Prop()
  trigger?: string;

  @Prop()
  error?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  data: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  meta: Record<string, any>;
}

export const FomoV2BackerAnalyticsSnapshotSchema = SchemaFactory.createForClass(
  FomoV2BackerAnalyticsSnapshot
);

FomoV2BackerAnalyticsSnapshotSchema.index(
  { snapshotKey: 1 },
  { unique: true, name: "uniq_backer_analytics_snapshots_key" }
);
FomoV2BackerAnalyticsSnapshotSchema.index(
  { scope: 1, version: 1, backerType: 1, status: 1, generatedAt: -1 },
  { name: "idx_backer_analytics_snapshots_scope_status" }
);
FomoV2BackerAnalyticsSnapshotSchema.index(
  { expiresAt: 1 },
  { name: "idx_backer_analytics_snapshots_expires_at" }
);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type FundsAnalyticsSnapshotDocument = HydratedDocument<FundsAnalyticsSnapshot>;

export type FundsAnalyticsSnapshotStatus = "building" | "ready" | "failed";

@Schema({
  collection: "funds_analytics_snapshots",
  strict: false,
  timestamps: true,
})
export class FundsAnalyticsSnapshot {
  @Prop({ required: true, index: true })
  scope: string;

  @Prop({ required: true, index: true })
  version: string;

  @Prop({ required: true, index: true })
  generatedAt: Date;

  @Prop({ index: true })
  startedAt?: Date;

  @Prop({ index: true })
  completedAt?: Date;

  @Prop({ default: 0 })
  durationMs?: number;

  @Prop({ required: true, default: "building", index: true })
  status: FundsAnalyticsSnapshotStatus;

  @Prop()
  trigger?: string;

  @Prop()
  error?: string;

  @Prop({ type: Object, default: {} })
  fundingDynamics: Record<string, any>;

  @Prop({ type: Object, default: {} })
  topSectorsByPeriod: Record<string, any>;

  @Prop({ type: [Object], default: [] })
  topSectors: Array<Record<string, any>>;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;
}

export const FundsAnalyticsSnapshotSchema =
  SchemaFactory.createForClass(FundsAnalyticsSnapshot);

FundsAnalyticsSnapshotSchema.index({ scope: 1, version: 1 }, { unique: true });
FundsAnalyticsSnapshotSchema.index({ scope: 1, status: 1, generatedAt: -1 });
FundsAnalyticsSnapshotSchema.index({ generatedAt: -1 });

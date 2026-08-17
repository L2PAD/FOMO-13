import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CryptoActivitiesSyncRunDocument = HydratedDocument<CryptoActivitiesSyncRun>;

export type CryptoActivitiesSyncRunStatus = "running" | "completed" | "failed" | "partial";

@Schema({
  timestamps: true,
  collection: "crypto_activities_sync_runs",
  supressReservedKeysWarning: true,
})
export class CryptoActivitiesSyncRun {
  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  finishedAt?: Date;

  @Prop({ required: true, enum: ["running", "completed", "failed", "partial"], index: true })
  status: CryptoActivitiesSyncRunStatus;

  @Prop({ default: 0 })
  fetched: number;

  @Prop({ default: 0 })
  created: number;

  @Prop({ default: 0 })
  updated: number;

  @Prop({ default: 0 })
  linked: number;

  @Prop({ default: 0 })
  skipped: number;

  @Prop({ default: 0 })
  failed: number;

  @Prop({ default: 0 })
  duplicatesPrevented: number;

  @Prop({ default: false })
  dryRun: boolean;

  @Prop({ default: "manual", index: true })
  trigger: string;

  @Prop({
    type: [
      {
        sourceId: { type: String, default: "" },
        slug: { type: String, default: "" },
        error: { type: String, default: "" },
      },
    ],
    default: [],
  })
  errors: Array<{
    sourceId?: string;
    slug?: string;
    error: string;
  }>;
}

export const CryptoActivitiesSyncRunSchema =
  SchemaFactory.createForClass(CryptoActivitiesSyncRun);

CryptoActivitiesSyncRunSchema.index({ startedAt: -1 });
CryptoActivitiesSyncRunSchema.index({ finishedAt: -1 });

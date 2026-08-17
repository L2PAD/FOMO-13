import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PersonsAnalyticsSnapshotDocument =
  HydratedDocument<PersonsAnalyticsSnapshot>;

export type PersonsAnalyticsSnapshotStatus = "building" | "ready" | "failed";

@Schema({
  collection: "persons_analytics_snapshots",
  strict: false,
  timestamps: true,
})
export class PersonsAnalyticsSnapshot {
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
  status: PersonsAnalyticsSnapshotStatus;

  @Prop()
  trigger?: string;

  @Prop()
  error?: string;

  @Prop({ type: [Object], default: [] })
  topSectors: Array<Record<string, any>>;

  @Prop({ type: [Object], default: [] })
  personsByCountry: Array<Record<string, any>>;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;
}

export const PersonsAnalyticsSnapshotSchema =
  SchemaFactory.createForClass(PersonsAnalyticsSnapshot);

PersonsAnalyticsSnapshotSchema.index(
  { scope: 1, version: 1 },
  { unique: true },
);
PersonsAnalyticsSnapshotSchema.index({ scope: 1, status: 1, generatedAt: -1 });
PersonsAnalyticsSnapshotSchema.index({ generatedAt: -1 });

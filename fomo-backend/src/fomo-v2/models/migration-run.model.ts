import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import {
  FOMO_V2_MIGRATION_RUN_STATUSES,
  FOMO_V2_MIGRATION_RUN_TYPES,
  FomoV2MigrationRunStatus,
  FomoV2MigrationRunType,
} from "../fomo-v2.types";

export type FomoV2MigrationRunDocument = HydratedDocument<FomoV2MigrationRun>;

@Schema({ collection: "migration_runs", timestamps: true, autoIndex: false })
export class FomoV2MigrationRun {
  @Prop({ required: true })
  runKey: string;

  @Prop({ type: String, required: true, enum: FOMO_V2_MIGRATION_RUN_TYPES })
  type: FomoV2MigrationRunType;

  @Prop({ type: String, required: true, enum: FOMO_V2_MIGRATION_RUN_STATUSES, default: "pending" })
  status: FomoV2MigrationRunStatus;

  @Prop({ required: true, default: true })
  dryRun: boolean;

  @Prop()
  dbName?: string;

  @Prop({ required: true, default: Date.now })
  startedAt: Date;

  @Prop()
  finishedAt?: Date;

  @Prop()
  requestedBy?: string;

  @Prop()
  codeVersion?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  options?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  counters?: Record<string, any>;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  errorItems?: Record<string, any>[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2MigrationRunSchema = SchemaFactory.createForClass(FomoV2MigrationRun);

FomoV2MigrationRunSchema.index({ runKey: 1 }, { unique: true, name: "uniq_migration_runs_run_key" });
FomoV2MigrationRunSchema.index({ type: 1, startedAt: -1 }, { name: "idx_migration_runs_type_started" });
FomoV2MigrationRunSchema.index({ status: 1, startedAt: -1 }, { name: "idx_migration_runs_status_started" });
FomoV2MigrationRunSchema.index({ dryRun: 1, status: 1 }, { name: "idx_migration_runs_dry_status" });

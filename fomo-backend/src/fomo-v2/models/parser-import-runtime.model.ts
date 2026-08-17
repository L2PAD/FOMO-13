import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export const FOMO_V2_PARSER_IMPORT_RUN_STATUSES = [
  "running",
  "completed",
  "partial",
  "failed",
  "abandoned",
] as const;

export type FomoV2ParserImportRunStatus =
  (typeof FOMO_V2_PARSER_IMPORT_RUN_STATUSES)[number];

export const FOMO_V2_PARSER_IMPORT_FAILURE_STATUSES = [
  "retrying",
  "quarantined",
  "resolved",
] as const;

export type FomoV2ParserImportFailureStatus =
  (typeof FOMO_V2_PARSER_IMPORT_FAILURE_STATUSES)[number];

export type FomoV2ParserImportRunDocument =
  HydratedDocument<FomoV2ParserImportRun>;
export type FomoV2ParserImportCheckpointDocument =
  HydratedDocument<FomoV2ParserImportCheckpoint>;
export type FomoV2ParserImportFailureDocument =
  HydratedDocument<FomoV2ParserImportFailure>;

/**
 * One observable execution of a parser import pipeline. `sourceType` is part
 * of the identity on purpose: Dropstab, ICODrops, Intel and future providers
 * must never share a run, cursor, lease, or failure budget.
 */
@Schema({
  collection: "parser_import_runs",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ParserImportRun {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  runKey: string;

  @Prop({ required: true })
  pipeline: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop({ required: true })
  sourceDatabase: string;

  @Prop({ required: true })
  sourceCollection: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_PARSER_IMPORT_RUN_STATUSES,
    default: "running",
  })
  status: FomoV2ParserImportRunStatus;

  @Prop({ required: true, default: true })
  dryRun: boolean;

  @Prop({ required: true, default: Date.now })
  startedAt: Date;

  @Prop()
  finishedAt?: Date;

  @Prop()
  cutoffAt?: Date;

  @Prop()
  cursorStart?: string;

  @Prop()
  cursorEnd?: string;

  @Prop({ required: true })
  leaseOwner: string;

  @Prop()
  heartbeatAt?: Date;

  @Prop()
  schemaVersion?: string;

  @Prop()
  resolverVersion?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  options?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  counters?: Record<string, any>;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  errorSamples?: Record<string, any>[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2ParserImportRunSchema = SchemaFactory.createForClass(
  FomoV2ParserImportRun
);

FomoV2ParserImportRunSchema.index(
  { runKey: 1 },
  { unique: true, name: "uniq_parser_import_runs_run_key" }
);
FomoV2ParserImportRunSchema.index(
  { pipeline: 1, sourceType: 1, startedAt: -1 },
  { name: "idx_parser_import_runs_pipeline_source_started" }
);
FomoV2ParserImportRunSchema.index(
  { status: 1, startedAt: -1 },
  { name: "idx_parser_import_runs_status_started" }
);

/** Durable source-scoped cursor and distributed lease. */
@Schema({
  collection: "parser_import_checkpoints",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ParserImportCheckpoint {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  pipeline: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop({ required: true })
  sourceDatabase: string;

  @Prop({ required: true })
  sourceCollection: string;

  @Prop()
  cursor?: string;

  @Prop()
  cutoffAt?: Date;

  @Prop()
  leaseOwner?: string;

  @Prop()
  leaseExpiresAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: FomoV2ParserImportRun.name,
  })
  activeRunId?: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: FomoV2ParserImportRun.name,
  })
  lastRunId?: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: FomoV2ParserImportRun.name,
  })
  lastCompletedRunId?: Types.ObjectId;

  @Prop()
  lastRunAt?: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2ParserImportCheckpointSchema = SchemaFactory.createForClass(
  FomoV2ParserImportCheckpoint
);

FomoV2ParserImportCheckpointSchema.index(
  {
    pipeline: 1,
    sourceType: 1,
    sourceDatabase: 1,
    sourceCollection: 1,
  },
  { unique: true, name: "uniq_parser_import_checkpoints_source" }
);
FomoV2ParserImportCheckpointSchema.index(
  { leaseExpiresAt: 1, pipeline: 1, sourceType: 1 },
  { name: "idx_parser_import_checkpoints_lease" }
);

/** Per-source poison-document retry and quarantine state. */
@Schema({
  collection: "parser_import_failures",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ParserImportFailure {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  pipeline: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop({ required: true })
  sourceDatabase: string;

  @Prop({ required: true })
  sourceCollection: string;

  @Prop({ required: true })
  sourceDocumentId: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_PARSER_IMPORT_FAILURE_STATUSES,
    default: "retrying",
  })
  status: FomoV2ParserImportFailureStatus;

  @Prop({ required: true, default: 0 })
  attempts: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: FomoV2ParserImportRun.name,
  })
  lastRunId?: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  firstFailedAt: Date;

  @Prop({ required: true, default: Date.now })
  lastFailedAt: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop({ required: true })
  errorMessage: string;

  @Prop()
  errorStack?: string;

  /**
   * Retry attempts belong to one semantic payload generation. A changed
   * parser document must not inherit quarantine from an older payload.
   */
  @Prop()
  payloadHash?: string;

  @Prop()
  schemaVersion?: string;

  /** Durable, source-scoped exact-document replay request. */
  @Prop()
  replayRequestedAt?: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2ParserImportFailureSchema = SchemaFactory.createForClass(
  FomoV2ParserImportFailure
);

FomoV2ParserImportFailureSchema.index(
  {
    pipeline: 1,
    sourceType: 1,
    sourceDatabase: 1,
    sourceCollection: 1,
    sourceDocumentId: 1,
  },
  { unique: true, name: "uniq_parser_import_failures_source_document" }
);
FomoV2ParserImportFailureSchema.index(
  { status: 1, lastFailedAt: -1 },
  { name: "idx_parser_import_failures_status_last_failed" }
);
FomoV2ParserImportFailureSchema.index(
  {
    pipeline: 1,
    sourceType: 1,
    sourceDatabase: 1,
    sourceCollection: 1,
    status: 1,
    replayRequestedAt: 1,
    _id: 1,
  },
  {
    name: "idx_parser_import_failures_replay_queue",
    partialFilterExpression: {
      status: "retrying",
      replayRequestedAt: { $exists: true },
    },
  }
);

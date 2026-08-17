import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export const FOMO_V2_PARSER_CONTROL_MODES = ["test", "prod"] as const;
export type FomoV2ParserControlMode =
  (typeof FOMO_V2_PARSER_CONTROL_MODES)[number];

export const FOMO_V2_PARSER_RUN_MODES = ["dry-run", "write"] as const;
export type FomoV2ParserRunMode = (typeof FOMO_V2_PARSER_RUN_MODES)[number];

export const FOMO_V2_PARSER_CONTROL_RUN_STATUSES = [
  "queued",
  "recovering",
  "running",
  "completed",
  "partial",
  "failed",
  "abandoned",
  "cancelled",
  "skipped",
] as const;
export type FomoV2ParserControlRunStatus =
  (typeof FOMO_V2_PARSER_CONTROL_RUN_STATUSES)[number];

export type FomoV2ParserGlobalControlDocument =
  HydratedDocument<FomoV2ParserGlobalControl>;
export type FomoV2ParserControlConfigDocument =
  HydratedDocument<FomoV2ParserControlConfig>;
export type FomoV2ParserControlRunDocument =
  HydratedDocument<FomoV2ParserControlRun>;
export type FomoV2UpstreamParserFlowDocument =
  HydratedDocument<FomoV2UpstreamParserFlow>;
export type FomoV2UpstreamParserPolicyDocument =
  HydratedDocument<FomoV2UpstreamParserPolicy>;

/**
 * Persistent kill switch for every parser import managed by FOMO v2.
 * Safe bootstrap values are deliberately OFF + TEST.
 */
@Schema({
  collection: "parser_control_global",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ParserGlobalControl {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_PARSER_CONTROL_MODES,
    default: "test",
  })
  mode: FomoV2ParserControlMode;

  @Prop({ required: true, default: 0 })
  revision: number;

  /**
   * A global write fence shared by all managed parser replicas. Besides
   * serialising post-write materialization, it makes PROD -> TEST/OFF an
   * atomic decision with respect to an already admitted domain write.
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2ParserControlRun" })
  activeWriteRunId?: Types.ObjectId;

  @Prop()
  activeWriteLeaseOwner?: string;

  @Prop()
  activeWriteLeaseExpiresAt?: Date;

  @Prop()
  updatedByAdminId?: string;
}

export const FomoV2ParserGlobalControlSchema = SchemaFactory.createForClass(
  FomoV2ParserGlobalControl
);

/** One independently controlled pipeline + provider source. */
@Schema({
  collection: "parser_control_configs",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ParserControlConfig {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  parserKey: string;

  @Prop({ required: true })
  pipeline: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop({ required: true, default: false })
  paused: boolean;

  @Prop({ required: true, default: false })
  scheduleEnabled: boolean;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_PARSER_RUN_MODES,
    default: "dry-run",
  })
  defaultRunMode: FomoV2ParserRunMode;

  @Prop({ required: true, default: 60 })
  intervalMinutes: number;

  @Prop()
  nextRunAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2ParserControlRun" })
  activeRunId?: Types.ObjectId;

  @Prop()
  activeLeaseOwner?: string;

  @Prop()
  activeLeaseExpiresAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2ParserControlRun" })
  lastRunId?: Types.ObjectId;

  @Prop({ type: String, enum: FOMO_V2_PARSER_CONTROL_RUN_STATUSES })
  lastStatus?: FomoV2ParserControlRunStatus;

  @Prop()
  lastRunAt?: Date;

  @Prop()
  lastFinishedAt?: Date;

  @Prop()
  lastError?: string;

  @Prop()
  updatedByAdminId?: string;
}

export const FomoV2ParserControlConfigSchema = SchemaFactory.createForClass(
  FomoV2ParserControlConfig
);

FomoV2ParserControlConfigSchema.index(
  { parserKey: 1 },
  { unique: true, name: "uniq_parser_control_configs_parser_key" }
);
FomoV2ParserControlConfigSchema.index(
  { scheduleEnabled: 1, paused: 1, nextRunAt: 1 },
  { name: "idx_parser_control_configs_due" }
);

/** Operational history. TEST still writes these status rows, never domain data. */
@Schema({
  collection: "parser_control_runs",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ParserControlRun {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  parserKey: string;

  @Prop({ required: true })
  pipeline: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop({ type: String, required: true, enum: ["manual", "schedule"] })
  trigger: "manual" | "schedule";

  @Prop({ type: String, required: true, enum: FOMO_V2_PARSER_RUN_MODES })
  requestedMode: FomoV2ParserRunMode;

  @Prop({ type: String, required: true, enum: FOMO_V2_PARSER_RUN_MODES })
  effectiveMode: FomoV2ParserRunMode;

  @Prop({ type: String, required: true, enum: FOMO_V2_PARSER_CONTROL_MODES })
  globalMode: FomoV2ParserControlMode;

  @Prop({ required: true, default: true })
  dryRun: boolean;

  @Prop({ required: true, default: false })
  writesDomainData: boolean;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_PARSER_CONTROL_RUN_STATUSES,
    default: "queued",
  })
  status: FomoV2ParserControlRunStatus;

  @Prop()
  requestedByAdminId?: string;

  @Prop({ required: true, default: Date.now })
  queuedAt: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  heartbeatAt?: Date;

  @Prop()
  finishedAt?: Date;

  @Prop()
  leaseOwner?: string;

  @Prop()
  leaseExpiresAt?: Date;

  @Prop({ required: true, default: 1 })
  attempt: number;

  @Prop({ required: true, default: 0 })
  recoveryCount: number;

  @Prop()
  lastRecoveredAt?: Date;

  @Prop()
  previousLeaseOwner?: string;

  @Prop()
  limit?: number;

  /** Immutable parser snapshot selected for this import, when present. */
  @Prop()
  snapshotId?: string;

  @Prop({ enum: ["test", "prod"] })
  upstreamEnvironment?: "test" | "prod";

  /** apiintel run which produced snapshotId. Kept for end-to-end audit. */
  @Prop()
  upstreamRunId?: string;

  /** Stable caller key used to make automatic downstream imports idempotent. */
  @Prop()
  idempotencyKey?: string;

  /** Live import/materialization phase exposed to the admin status page. */
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  progress?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  summary?: Record<string, any>;

  @Prop()
  error?: string;

  @Prop()
  policyReason?: string;
}

export const FomoV2ParserControlRunSchema = SchemaFactory.createForClass(
  FomoV2ParserControlRun
);

FomoV2ParserControlRunSchema.index(
  { parserKey: 1, queuedAt: -1 },
  { name: "idx_parser_control_runs_parser_queued" }
);
FomoV2ParserControlRunSchema.index(
  { status: 1, queuedAt: 1 },
  { name: "idx_parser_control_runs_status_queued" }
);
FomoV2ParserControlRunSchema.index(
  { status: 1, leaseExpiresAt: 1, snapshotId: 1 },
  { name: "idx_parser_control_runs_expired_snapshot_lease" }
);
FomoV2ParserControlRunSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    sparse: true,
    name: "uniq_parser_control_runs_idempotency_key",
  }
);

/** Deployment-local downstream policy for newly created apiintel snapshots. */
@Schema({
  collection: "upstream_parser_policies",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2UpstreamParserPolicy {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  parserKey: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop({ required: true, enum: ["off", "dry-run", "write"], default: "off" })
  autoImportMode: "off" | FomoV2ParserRunMode;

  @Prop({ type: [String], default: [] })
  autoImportTargets: string[];

  @Prop({ required: true, default: () => new Date() })
  effectiveFromAt: Date;

  @Prop({ required: true, default: 1 })
  revision: number;

  @Prop()
  updatedByAdminId?: string;
}

export const FomoV2UpstreamParserPolicySchema = SchemaFactory.createForClass(
  FomoV2UpstreamParserPolicy
);
FomoV2UpstreamParserPolicySchema.index(
  { parserKey: 1 },
  { unique: true, name: "uniq_upstream_parser_policies_parser_key" }
);

export const FOMO_V2_UPSTREAM_FLOW_STATUSES = [
  "creating",
  "queued",
  "running",
  "pause_requested",
  "paused",
  "resume_requested",
  "cancel_requested",
  "cancelled",
  "succeeded",
  "partial",
  "failed",
  "stale",
  "unreachable",
] as const;
export type FomoV2UpstreamFlowStatus =
  (typeof FOMO_V2_UPSTREAM_FLOW_STATUSES)[number];

/**
 * Local audit/reconciliation state for one apiintel parser run. This model
 * deliberately stores no M2M credentials and survives restarts/replicas.
 */
@Schema({
  collection: "upstream_parser_flows",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2UpstreamParserFlow {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  flowId: string;

  @Prop({ required: true })
  idempotencyKey: string;

  @Prop({ required: true })
  parserKey: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_PARSER_CONTROL_MODES,
  })
  globalMode: FomoV2ParserControlMode;

  @Prop()
  requestedByAdminId?: string;

  @Prop({ required: true })
  entityLimit: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  filters?: Record<string, any>;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_UPSTREAM_FLOW_STATUSES,
    default: "creating",
  })
  status: FomoV2UpstreamFlowStatus;

  @Prop()
  upstreamStatus?: string;

  @Prop()
  externalRunId?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  progress?: Record<string, any>;

  @Prop()
  snapshotId?: string;

  @Prop({ enum: ["test", "prod"] })
  upstreamEnvironment?: "test" | "prod";

  @Prop({ type: mongoose.Schema.Types.Mixed })
  snapshot?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  autoImport?: {
    pipelineKey?: string;
    mode?: FomoV2ParserRunMode;
    limit?: number;
    targets?: Array<{
      pipelineKey: string;
      requestedMode: FomoV2ParserRunMode;
      mode: FomoV2ParserRunMode;
      limit?: number;
    }>;
  };

  @Prop({
    type: String,
    enum: [
      "pending",
      "queueing",
      "queued",
      "running",
      "completed",
      "partial",
      "cancelled",
      "failed",
    ],
  })
  autoImportStatus?:
    | "pending"
    | "queueing"
    | "queued"
    | "running"
    | "completed"
    | "partial"
    | "cancelled"
    | "failed";

  @Prop()
  autoImportAttemptAt?: Date;

  @Prop()
  autoImportRunId?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  autoImportRunIds?: Record<string, string>;

  @Prop()
  autoImportError?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  autoImportResult?: Record<string, any>;

  @Prop()
  autoImportFinishedAt?: Date;

  @Prop({ required: true, default: false })
  upstreamReachable: boolean;

  @Prop()
  lastSyncedAt?: Date;

  @Prop()
  lastError?: string;
}

export const FomoV2UpstreamParserFlowSchema = SchemaFactory.createForClass(
  FomoV2UpstreamParserFlow
);

FomoV2UpstreamParserFlowSchema.index(
  { flowId: 1 },
  { unique: true, name: "uniq_upstream_parser_flows_flow_id" }
);
FomoV2UpstreamParserFlowSchema.index(
  { idempotencyKey: 1 },
  { unique: true, name: "uniq_upstream_parser_flows_idempotency_key" }
);
FomoV2UpstreamParserFlowSchema.index(
  { externalRunId: 1 },
  {
    unique: true,
    sparse: true,
    name: "uniq_upstream_parser_flows_external_run_id",
  }
);
FomoV2UpstreamParserFlowSchema.index(
  { status: 1, updatedAt: 1 },
  { name: "idx_upstream_parser_flows_reconcile" }
);
FomoV2UpstreamParserFlowSchema.index(
  { snapshotId: 1 },
  { sparse: true, name: "idx_upstream_parser_flows_snapshot" }
);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { FOMO_V2_SOURCE_ENTITY_TYPES, FomoV2SourceEntityType } from "../fomo-v2.types";

export type FomoV2SourceSnapshotDocument = HydratedDocument<FomoV2SourceSnapshot>;

@Schema({ collection: "source_snapshots", timestamps: true, strict: true, autoIndex: false })
export class FomoV2SourceSnapshot {
  @Prop({ required: true })
  source: string;

  @Prop({ type: String, required: true, enum: FOMO_V2_SOURCE_ENTITY_TYPES })
  sourceEntityType: FomoV2SourceEntityType;

  @Prop()
  sourceId?: string;

  @Prop()
  sourceSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  sourceEntityKey?: string;

  @Prop({ required: true })
  payloadHash: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  rawPayload: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  normalizedPreview?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MigrationRun" })
  migrationRunId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2ParserImportRun" })
  parserImportRunId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceEntity" })
  sourceEntityId?: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  capturedAt: Date;

  @Prop()
  providerUpdatedAt?: Date;

  @Prop()
  parserVersion?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  request?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2SourceSnapshotSchema = SchemaFactory.createForClass(FomoV2SourceSnapshot);

FomoV2SourceSnapshotSchema.index(
  { source: 1, sourceEntityType: 1, sourceId: 1, payloadHash: 1 },
  {
    unique: true,
    name: "uniq_source_snapshots_source_type_id_hash",
    partialFilterExpression: { sourceId: { $type: "string" } },
  },
);
FomoV2SourceSnapshotSchema.index({ sourceEntityKey: 1, payloadHash: 1 }, { name: "idx_source_snapshots_entity_hash" });
FomoV2SourceSnapshotSchema.index({ payloadHash: 1 }, { name: "idx_source_snapshots_payload_hash" });
FomoV2SourceSnapshotSchema.index({ migrationRunId: 1 }, { name: "idx_source_snapshots_migration_run" });
FomoV2SourceSnapshotSchema.index(
  { parserImportRunId: 1 },
  { name: "idx_source_snapshots_parser_import_run" },
);
FomoV2SourceSnapshotSchema.index({ capturedAt: -1 }, { name: "idx_source_snapshots_captured" });

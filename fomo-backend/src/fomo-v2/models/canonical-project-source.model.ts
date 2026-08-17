import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FOMO_V2_LINK_STATUSES,
  FOMO_V2_SOURCE_ENTITY_TYPES,
  FomoV2Confidence,
  FomoV2LinkStatus,
  FomoV2SourceEntityType,
} from "../fomo-v2.types";

export type FomoV2CanonicalProjectSourceDocument = HydratedDocument<FomoV2CanonicalProjectSource>;

@Schema({ collection: "canonical_project_sources", timestamps: true, strict: true, autoIndex: false })
export class FomoV2CanonicalProjectSource {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject", required: true })
  canonicalProjectId: Types.ObjectId;

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
  websiteDomain?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceEntity" })
  sourceEntityId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceSnapshot" })
  sourceSnapshotId?: Types.ObjectId;

  @Prop({ type: String, enum: FOMO_V2_CONFIDENCE_LEVELS, default: "none" })
  confidence?: FomoV2Confidence;

  @Prop()
  matchedBy?: string;

  @Prop()
  reason?: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ type: String, required: true, enum: FOMO_V2_LINK_STATUSES, default: "proposed" })
  status: FomoV2LinkStatus;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2CanonicalProjectSourceSchema = SchemaFactory.createForClass(FomoV2CanonicalProjectSource);

FomoV2CanonicalProjectSourceSchema.index(
  { source: 1, sourceEntityType: 1, sourceId: 1 },
  {
    unique: true,
    name: "uniq_canonical_project_sources_source_type_id",
    partialFilterExpression: { sourceId: { $type: "string" } },
  },
);
FomoV2CanonicalProjectSourceSchema.index(
  { canonicalProjectId: 1, source: 1 },
  { name: "idx_canonical_project_sources_project_source" },
);
FomoV2CanonicalProjectSourceSchema.index(
  { source: 1, sourceEntityType: 1, status: 1, canonicalProjectId: 1 },
  { name: "idx_canonical_project_sources_duplicate_scan" },
);
FomoV2CanonicalProjectSourceSchema.index(
  { sourceEntityId: 1 },
  { name: "idx_canonical_project_sources_source_entity", sparse: true },
);
FomoV2CanonicalProjectSourceSchema.index({ status: 1, verified: 1 }, { name: "idx_canonical_project_sources_status" });

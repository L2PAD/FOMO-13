import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FOMO_V2_RESOLUTION_STATUSES,
  FOMO_V2_SOURCE_ENTITY_TYPES,
  FomoV2Confidence,
  FomoV2ProviderIds,
  FomoV2ResolutionStatus,
  FomoV2SourceEntityType,
} from "../fomo-v2.types";

export type FomoV2SourceEntityDocument = HydratedDocument<FomoV2SourceEntity>;

@Schema({ collection: "source_entities", timestamps: true, strict: true, autoIndex: false })
export class FomoV2SourceEntity {
  @Prop({ required: true })
  entityKey: string;

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

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  providerIds?: FomoV2ProviderIds;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  canonicalProjectId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceSnapshot" })
  latestSourceSnapshotId?: Types.ObjectId;

  @Prop({ type: String, required: true, enum: FOMO_V2_RESOLUTION_STATUSES, default: "unresolved" })
  resolutionStatus: FomoV2ResolutionStatus;

  @Prop({ type: String, enum: FOMO_V2_CONFIDENCE_LEVELS, default: "none" })
  confidence?: FomoV2Confidence;

  @Prop()
  matchedBy?: string;

  @Prop()
  reason?: string;

  @Prop({ required: true, default: Date.now })
  firstSeenAt: Date;

  @Prop({ required: true, default: Date.now })
  lastSeenAt: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2SourceEntitySchema = SchemaFactory.createForClass(FomoV2SourceEntity);

FomoV2SourceEntitySchema.index({ entityKey: 1 }, { unique: true, name: "uniq_source_entities_entity_key" });
FomoV2SourceEntitySchema.index(
  { source: 1, sourceEntityType: 1, sourceId: 1 },
  {
    unique: true,
    name: "uniq_source_entities_source_type_id",
    partialFilterExpression: { sourceId: { $type: "string" } },
  },
);
FomoV2SourceEntitySchema.index(
  { source: 1, sourceEntityType: 1, sourceSlug: 1 },
  {
    name: "idx_source_entities_source_type_slug",
    partialFilterExpression: { sourceSlug: { $type: "string" } },
  },
);
FomoV2SourceEntitySchema.index({ canonicalProjectId: 1 }, { name: "idx_source_entities_canonical_project" });
FomoV2SourceEntitySchema.index({ resolutionStatus: 1, lastSeenAt: -1 }, { name: "idx_source_entities_resolution" });

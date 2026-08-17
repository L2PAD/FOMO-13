import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CanonicalProjectLinkDocument = HydratedDocument<CanonicalProjectLink>;

export type CanonicalProjectLinkEntityType =
  | "project"
  | "fundingRound"
  | "tokenUnlock"
  | "projectChartHistory"
  | "projectComparisonSnapshot"
  | "cryptoActivity"
  | "projectExchangeTickerCache"
  | "fund"
  | "person"
  | "investor";

export type CanonicalProjectLinkProjectType = "market" | "project" | "ico" | "raw";
export type CanonicalProjectLinkStatus = "proposed" | "verified" | "rejected" | "conflict" | "stale";
export type CanonicalProjectLinkCreatedBy = "system" | "manual";

@Schema({ collection: "canonical_project_links", timestamps: true, strict: false })
export class CanonicalProjectLink {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "CanonicalProject", required: true, index: true })
  canonicalProjectId: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      "project",
      "fundingRound",
      "tokenUnlock",
      "projectChartHistory",
      "projectComparisonSnapshot",
      "cryptoActivity",
      "projectExchangeTickerCache",
      "fund",
      "person",
      "investor",
    ],
    index: true,
  })
  entityType: CanonicalProjectLinkEntityType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  entityId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true })
  legacyProjectId?: mongoose.Types.ObjectId;

  @Prop({ enum: ["market", "project", "ico", "raw"], index: true })
  projectType?: CanonicalProjectLinkProjectType;

  @Prop({ index: true })
  source?: string;

  @Prop({ index: true })
  sourceId?: string;

  @Prop({ index: true })
  sourceSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ required: true, min: 0, max: 100, index: true })
  confidence: number;

  @Prop()
  matchedBy?: string;

  @Prop()
  reason?: string;

  @Prop({
    required: true,
    enum: ["proposed", "verified", "rejected", "conflict", "stale"],
    default: "proposed",
    index: true,
  })
  status: CanonicalProjectLinkStatus;

  @Prop({ default: false })
  dryRun?: boolean;

  @Prop({ required: true, enum: ["system", "manual"], default: "system" })
  createdBy: CanonicalProjectLinkCreatedBy;
}

export const CanonicalProjectLinkSchema = SchemaFactory.createForClass(CanonicalProjectLink);

CanonicalProjectLinkSchema.index({ entityType: 1, entityId: 1 });
CanonicalProjectLinkSchema.index({ canonicalProjectId: 1, entityType: 1 });
CanonicalProjectLinkSchema.index({ status: 1, confidence: -1 });
CanonicalProjectLinkSchema.index({ source: 1, sourceId: 1 });
CanonicalProjectLinkSchema.index({ legacyProjectId: 1 });
CanonicalProjectLinkSchema.index(
  { entityType: 1, entityId: 1, canonicalProjectId: 1 },
  { unique: true, name: "uniq_canonical_link_entity_canonical" },
);
CanonicalProjectLinkSchema.index(
  { entityType: 1, entityId: 1, status: 1 },
  {
    unique: true,
    name: "uniq_verified_canonical_link_per_entity",
    partialFilterExpression: { status: "verified" },
  },
);


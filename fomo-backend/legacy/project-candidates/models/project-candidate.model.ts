import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type ProjectCandidateDocument = HydratedDocument<ProjectCandidate>;

export type ProjectCandidateSource =
  | "dropstab"
  | "icodrops"
  | "coinmarketcap"
  | "coingecko"
  | "cryptorank"
  | "intel_unlocks"
  | "crypto_activity"
  | "unknown";

export type ProjectCandidateEvidenceType =
  | "fundingRound"
  | "tokenUnlock"
  | "cryptoActivity"
  | "investorPortfolio"
  | "projectIntel"
  | "projectUnlocks"
  | "unknown";

export type ProjectCandidateSuggestedProjectType = "project" | "market" | "unknown";

export type ProjectCandidateStatus =
  | "new"
  | "matched_existing_project"
  | "ready_to_create_project"
  | "created_project"
  | "rejected"
  | "duplicate"
  | "conflict";

@Schema({ collection: "project_candidates", timestamps: true, strict: false })
export class ProjectCandidate {
  @Prop()
  name?: string;

  @Prop({ index: true })
  normalizedName?: string;

  @Prop()
  symbol?: string;

  @Prop({ index: true })
  normalizedSymbol?: string;

  @Prop({ index: true })
  slug?: string;

  @Prop({ index: true })
  normalizedSlug?: string;

  @Prop({
    required: true,
    enum: ["dropstab", "icodrops", "coinmarketcap", "coingecko", "cryptorank", "intel_unlocks", "crypto_activity", "unknown"],
    default: "unknown",
    index: true,
  })
  source: ProjectCandidateSource;

  @Prop({ index: true })
  sourceId?: string;

  @Prop({ index: true })
  sourceSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({
    required: true,
    enum: ["fundingRound", "tokenUnlock", "cryptoActivity", "investorPortfolio", "projectIntel", "projectUnlocks", "unknown"],
    default: "unknown",
    index: true,
  })
  evidenceType: ProjectCandidateEvidenceType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true })
  evidenceEntityId?: mongoose.Types.ObjectId;

  @Prop({
    type: [
      {
        entityType: { type: String, required: true, index: true },
        entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
        source: { type: String },
        sourceId: { type: String },
        sourceSlug: { type: String },
        sourceUrl: { type: String },
        confidence: { type: Number },
        matchedBy: { type: String },
        reason: { type: String },
        raw: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    default: [],
  })
  evidenceRefs?: Array<{
    entityType: string;
    entityId?: mongoose.Types.ObjectId;
    source?: string;
    sourceId?: string;
    sourceSlug?: string;
    sourceUrl?: string;
    confidence?: number;
    matchedBy?: string;
    reason?: string;
    raw?: any;
  }>;

  @Prop({ required: true, enum: ["project", "market", "unknown"], default: "unknown", index: true })
  suggestedProjectType: ProjectCandidateSuggestedProjectType;

  @Prop({
    required: true,
    enum: ["new", "matched_existing_project", "ready_to_create_project", "created_project", "rejected", "duplicate", "conflict"],
    default: "new",
    index: true,
  })
  status: ProjectCandidateStatus;

  @Prop({ required: true, min: 0, max: 100, default: 0, index: true })
  confidence: number;

  @Prop()
  matchedBy?: string;

  @Prop()
  reason?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true })
  matchedProjectId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true })
  createdProjectId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "CanonicalProject", index: true })
  canonicalProjectId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  rawEvidence?: any;

  @Prop({
    type: {
      hasFundingRounds: { type: Boolean, default: false },
      hasUnlocks: { type: Boolean, default: false },
      hasActivities: { type: Boolean, default: false },
      hasProviderId: { type: Boolean, default: false },
      hasSourceUrl: { type: Boolean, default: false },
      warnings: { type: [String], default: [] },
    },
    default: {},
  })
  dataQuality?: {
    hasFundingRounds?: boolean;
    hasUnlocks?: boolean;
    hasActivities?: boolean;
    hasProviderId?: boolean;
    hasSourceUrl?: boolean;
    warnings?: string[];
  };
}

export const ProjectCandidateSchema = SchemaFactory.createForClass(ProjectCandidate);

ProjectCandidateSchema.index({ source: 1, sourceId: 1 });
ProjectCandidateSchema.index({ source: 1, sourceSlug: 1 });
ProjectCandidateSchema.index({ normalizedSlug: 1 });
ProjectCandidateSchema.index({ normalizedName: 1, normalizedSymbol: 1 });
ProjectCandidateSchema.index({ status: 1 });
ProjectCandidateSchema.index({ evidenceType: 1, evidenceEntityId: 1 });
ProjectCandidateSchema.index({ matchedProjectId: 1 });
ProjectCandidateSchema.index({ createdProjectId: 1 });
ProjectCandidateSchema.index({ canonicalProjectId: 1 });
ProjectCandidateSchema.index(
  { source: 1, sourceId: 1, evidenceType: 1 },
  {
    unique: true,
    name: "uniq_project_candidate_source_evidence",
    partialFilterExpression: { sourceId: { $type: "string" } },
  },
);
ProjectCandidateSchema.index(
  { evidenceType: 1, evidenceEntityId: 1, normalizedSlug: 1 },
  {
    unique: true,
    name: "uniq_project_candidate_entity_slug",
    partialFilterExpression: {
      evidenceEntityId: { $exists: true },
      normalizedSlug: { $type: "string" },
    },
  },
);

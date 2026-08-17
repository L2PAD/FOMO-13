import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type InvestorCandidateDocument = HydratedDocument<InvestorCandidate>;

export type InvestorCandidateType = "fund" | "person" | "unknown";
export type InvestorCandidateEvidenceType =
  | "fundingRound"
  | "fundPortfolio"
  | "personPortfolio"
  | "investorParser"
  | "unknown";
export type InvestorCandidateStatus =
  | "new"
  | "matched_existing_fund"
  | "matched_existing_person"
  | "ready_to_create_fund"
  | "ready_to_create_person"
  | "created_fund"
  | "created_person"
  | "duplicate"
  | "rejected"
  | "conflict";

@Schema({ collection: "investor_candidates", timestamps: true, strict: false })
export class InvestorCandidate {
  @Prop({ index: true })
  name?: string;

  @Prop({ index: true })
  normalizedName?: string;

  @Prop({ index: true })
  slug?: string;

  @Prop({ index: true })
  normalizedSlug?: string;

  @Prop({ index: true })
  source?: string;

  @Prop({ index: true })
  sourceInvestorId?: string;

  @Prop({ index: true })
  sourceInvestorSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ required: true, enum: ["fund", "person", "unknown"], default: "unknown", index: true })
  candidateType: InvestorCandidateType;

  @Prop({
    required: true,
    enum: ["fundingRound", "fundPortfolio", "personPortfolio", "investorParser", "unknown"],
    default: "unknown",
    index: true,
  })
  evidenceType: InvestorCandidateEvidenceType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true })
  evidenceEntityId?: Types.ObjectId;

  @Prop({
    type: [
      {
        entityType: { type: String, required: true, index: true },
        entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
        fundingRoundId: { type: mongoose.Schema.Types.ObjectId, ref: "FundingRound", index: true },
        canonicalProjectId: { type: mongoose.Schema.Types.ObjectId, ref: "CanonicalProject", index: true },
        source: { type: String },
        sourceInvestorId: { type: String },
        sourceInvestorSlug: { type: String },
        sourceInvestorName: { type: String },
        role: { type: String },
        raw: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    default: [],
  })
  evidenceRefs?: Array<{
    entityType: string;
    entityId?: Types.ObjectId;
    fundingRoundId?: Types.ObjectId;
    canonicalProjectId?: Types.ObjectId;
    source?: string;
    sourceInvestorId?: string;
    sourceInvestorSlug?: string;
    sourceInvestorName?: string;
    role?: string;
    raw?: any;
  }>;

  @Prop({
    required: true,
    enum: [
      "new",
      "matched_existing_fund",
      "matched_existing_person",
      "ready_to_create_fund",
      "ready_to_create_person",
      "created_fund",
      "created_person",
      "duplicate",
      "rejected",
      "conflict",
    ],
    default: "new",
    index: true,
  })
  status: InvestorCandidateStatus;

  @Prop({ required: true, min: 0, max: 100, default: 0, index: true })
  confidence: number;

  @Prop()
  matchedBy?: string;

  @Prop()
  reason?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Funds", index: true })
  matchedFundId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Person", index: true })
  matchedPersonId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Funds", index: true })
  createdFundId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Person", index: true })
  createdPersonId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  rawEvidence?: any;

  @Prop({
    type: {
      hasSourceId: { type: Boolean, default: false },
      hasSlug: { type: Boolean, default: false },
      hasWebsite: { type: Boolean, default: false },
      hasSocials: { type: Boolean, default: false },
      warnings: { type: [String], default: [] },
    },
    default: {},
  })
  dataQuality?: {
    hasSourceId?: boolean;
    hasSlug?: boolean;
    hasWebsite?: boolean;
    hasSocials?: boolean;
    warnings?: string[];
  };
}

export const InvestorCandidateSchema = SchemaFactory.createForClass(InvestorCandidate);

InvestorCandidateSchema.index({ source: 1, sourceInvestorId: 1 });
InvestorCandidateSchema.index({ source: 1, sourceInvestorSlug: 1 });
InvestorCandidateSchema.index({ normalizedSlug: 1 });
InvestorCandidateSchema.index({ normalizedName: 1 });
InvestorCandidateSchema.index({ candidateType: 1 });
InvestorCandidateSchema.index({ evidenceType: 1, evidenceEntityId: 1 });
InvestorCandidateSchema.index({ status: 1 });
InvestorCandidateSchema.index({ matchedFundId: 1 });
InvestorCandidateSchema.index({ matchedPersonId: 1 });
InvestorCandidateSchema.index({ createdFundId: 1 });
InvestorCandidateSchema.index({ createdPersonId: 1 });
InvestorCandidateSchema.index(
  { source: 1, sourceInvestorId: 1 },
  {
    unique: true,
    name: "uniq_investor_candidate_source_id",
    partialFilterExpression: { sourceInvestorId: { $type: "string" } },
  },
);
InvestorCandidateSchema.index(
  { source: 1, sourceInvestorSlug: 1 },
  {
    unique: true,
    name: "uniq_investor_candidate_source_slug",
    partialFilterExpression: { sourceInvestorSlug: { $type: "string" } },
  },
);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FundingRoundParticipantDocument = HydratedDocument<FundingRoundParticipant>;

export type FundingRoundParticipantType = "fund" | "person" | "unknown";
export type FundingRoundParticipantRole = "lead" | "participant" | "unknown";
export type FundingRoundParticipantAllocationMethod =
  | "exact"
  | "lead_estimate"
  | "equal_split_estimate"
  | "unknown";
export type FundingRoundParticipantMatchStatus = "verified" | "proposed" | "conflict" | "unmatched";

@Schema({ collection: "funding_round_participants", timestamps: true })
export class FundingRoundParticipant {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FundingRound", required: true })
  fundingRoundId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "CanonicalProject", default: null })
  canonicalProjectId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null })
  legacyProjectId?: Types.ObjectId | null;

  @Prop({ required: true, enum: ["fund", "person", "unknown"], default: "unknown" })
  participantType: FundingRoundParticipantType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Funds", default: null })
  fundId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Person", default: null })
  personId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "InvestorCandidate", default: null })
  investorCandidateId?: Types.ObjectId | null;

  @Prop({ required: true, enum: ["lead", "participant", "unknown"], default: "unknown" })
  role: FundingRoundParticipantRole;

  @Prop()
  source?: string;

  @Prop()
  sourceInvestorId?: string;

  @Prop()
  sourceInvestorSlug?: string;

  @Prop()
  sourceInvestorName?: string;

  @Prop()
  amountUsd?: number;

  @Prop({
    required: true,
    enum: ["exact", "lead_estimate", "equal_split_estimate", "unknown"],
    default: "unknown",
  })
  allocationMethod: FundingRoundParticipantAllocationMethod;

  @Prop({ required: true, default: 0 })
  confidence: number;

  @Prop()
  matchedBy?: string;

  @Prop({ required: true, enum: ["verified", "proposed", "conflict", "unmatched"], default: "unmatched" })
  matchStatus: FundingRoundParticipantMatchStatus;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  rawInvestor?: any;
}

export const FundingRoundParticipantSchema = SchemaFactory.createForClass(FundingRoundParticipant);

FundingRoundParticipantSchema.index({ fundingRoundId: 1 });
FundingRoundParticipantSchema.index({ canonicalProjectId: 1 });
FundingRoundParticipantSchema.index({ fundId: 1 });
FundingRoundParticipantSchema.index({ personId: 1 });
FundingRoundParticipantSchema.index({ investorCandidateId: 1 });
FundingRoundParticipantSchema.index({ sourceInvestorId: 1 });
FundingRoundParticipantSchema.index({ sourceInvestorSlug: 1 });
FundingRoundParticipantSchema.index({ matchStatus: 1 });
FundingRoundParticipantSchema.index({ confidence: -1 });
FundingRoundParticipantSchema.index({ fundingRoundId: 1, investorCandidateId: 1 });
FundingRoundParticipantSchema.index(
  { fundingRoundId: 1, fundId: 1, personId: 1, sourceInvestorSlug: 1 },
  {
    unique: true,
    sparse: true,
    name: "funding_round_participant_idempotency",
  },
);

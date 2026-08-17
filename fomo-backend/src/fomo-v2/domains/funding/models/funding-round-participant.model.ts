import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
  FomoV2Source,
} from "../../../fomo-v2.types";
import {
  FOMO_V2_FUNDING_PARTICIPANT_ROLES,
  FOMO_V2_FUNDING_PARTICIPANT_STATUSES,
  FomoV2FundingParticipantRole,
  FomoV2FundingParticipantStatus,
  FomoV2FundingSourceRef,
} from "../types";
import { FomoV2FundingSourceRefSchema } from "./funding-source-ref.schema";

export type FomoV2FundingRoundParticipantDocument =
  HydratedDocument<FomoV2FundingRoundParticipant>;

@Schema({
  collection: "funding_round_participants",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2FundingRoundParticipant {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
  })
  canonicalProjectId: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2FundingRound",
    required: true,
  })
  fundingRoundId: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2Backer",
    required: true,
  })
  backerId: Types.ObjectId;

  @Prop()
  backerName?: string;

  @Prop()
  normalizedBackerName?: string;

  @Prop()
  sourceBackerRef?: string;

  @Prop()
  sourceBackerId?: string;

  @Prop()
  sourceBackerSlug?: string;

  @Prop()
  sourceBackerUrl?: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_FUNDING_PARTICIPANT_ROLES,
    default: "participant",
  })
  role: FomoV2FundingParticipantRole;

  @Prop({ default: false })
  isLead: boolean;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_FUNDING_PARTICIPANT_STATUSES,
    default: "proposed",
  })
  status: FomoV2FundingParticipantStatus;

  @Prop({ type: String })
  primarySource?: FomoV2Source;

  @Prop()
  sourceEntityKey?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceEntity" })
  sourceEntityId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceSnapshot" })
  sourceSnapshotId?: Types.ObjectId;

  @Prop({ type: [FomoV2FundingSourceRefSchema], default: [] })
  sourceRefs?: FomoV2FundingSourceRef[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  provenance?: Record<string, any>;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_CONFIDENCE_LEVELS,
    default: "none",
  })
  confidence: FomoV2Confidence;

  @Prop({ required: true })
  canonicalFingerprint: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2FundingRoundParticipantSchema = SchemaFactory.createForClass(
  FomoV2FundingRoundParticipant
);

FomoV2FundingRoundParticipantSchema.index(
  { fundingRoundId: 1, backerId: 1 },
  {
    unique: true,
    name: "uniq_funding_participants_round_backer",
    partialFilterExpression: { backerId: { $type: "objectId" } },
  }
);
FomoV2FundingRoundParticipantSchema.index(
  { canonicalFingerprint: 1 },
  {
    unique: true,
    name: "uniq_funding_participants_canonical_fingerprint",
    partialFilterExpression: { canonicalFingerprint: { $type: "string" } },
  }
);
FomoV2FundingRoundParticipantSchema.index(
  { primarySource: 1, sourceBackerId: 1 },
  {
    name: "idx_funding_participants_source_backer",
    partialFilterExpression: {
      primarySource: { $type: "string" },
      sourceBackerId: { $type: "string" },
    },
  }
);
FomoV2FundingRoundParticipantSchema.index(
  { canonicalProjectId: 1, fundingRoundId: 1 },
  { name: "idx_funding_participants_project_round" }
);
FomoV2FundingRoundParticipantSchema.index(
  { fundingRoundId: 1, status: 1, isLead: -1, backerName: 1, _id: 1 },
  { name: "idx_funding_participants_round_status_display" }
);
FomoV2FundingRoundParticipantSchema.index(
  { sourceEntityId: 1 },
  { name: "idx_funding_participants_source_entity", sparse: true }
);
FomoV2FundingRoundParticipantSchema.index(
  { status: 1, confidence: 1 },
  { name: "idx_funding_participants_status_confidence" }
);

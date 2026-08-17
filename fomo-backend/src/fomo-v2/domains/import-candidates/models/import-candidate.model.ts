import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_IMPORT_CANDIDATE_STATUSES,
  FomoV2ImportCandidateStatus,
} from "../types";

export type FomoV2ImportCandidateDocument =
  HydratedDocument<FomoV2ImportCandidate>;

@Schema({
  collection: "import_candidates",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ImportCandidate {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  entityType: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop()
  sourceId?: string;

  @Prop()
  sourceSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  sourcePath?: string;

  @Prop()
  name?: string;

  @Prop()
  symbol?: string;

  @Prop()
  slug?: string;

  @Prop()
  normalizedName?: string;

  @Prop()
  normalizedSymbol?: string;

  @Prop()
  normalizedSlug?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  payload?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  normalizedPayload?: Record<string, any>;

  @Prop({ required: true })
  candidateFingerprint: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_IMPORT_CANDIDATE_STATUSES,
    default: "open",
  })
  status: FomoV2ImportCandidateStatus;

  @Prop({ required: true, default: Date.now })
  firstSeenAt: Date;

  @Prop({ required: true, default: Date.now })
  lastSeenAt: Date;

  @Prop({ required: true, default: 1 })
  seenCount: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  createdBySyncRunId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  updatedBySyncRunId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2ImportCandidateSchema =
  SchemaFactory.createForClass(FomoV2ImportCandidate);

FomoV2ImportCandidateSchema.index(
  { candidateFingerprint: 1 },
  {
    unique: true,
    name: "uniq_import_candidates_candidate_fingerprint",
    partialFilterExpression: { candidateFingerprint: { $type: "string" } },
  }
);
FomoV2ImportCandidateSchema.index(
  { status: 1, domain: 1, entityType: 1 },
  { name: "idx_import_candidates_status_domain_entity" }
);
FomoV2ImportCandidateSchema.index(
  { sourceType: 1, entityType: 1, normalizedName: 1 },
  { name: "idx_import_candidates_source_entity_normalized_name" }
);
FomoV2ImportCandidateSchema.index(
  { lastSeenAt: -1 },
  { name: "idx_import_candidates_last_seen" }
);

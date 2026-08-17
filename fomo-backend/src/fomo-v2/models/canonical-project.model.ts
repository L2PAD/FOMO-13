import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_ALIAS_TYPES,
  FOMO_V2_CANONICAL_PROJECT_STATUSES,
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Alias,
  FomoV2AliasType,
  FomoV2CanonicalProjectStatus,
  FomoV2Confidence,
  FomoV2ProviderIds,
} from "../fomo-v2.types";

export type FomoV2CanonicalProjectDocument =
  HydratedDocument<FomoV2CanonicalProject>;
export type FomoV2CanonicalProjectScoreVersion = "canonical-project-v1";
export type FomoV2CanonicalProjectScoreMode =
  | "hybrid"
  | "market"
  | "pre_market"
  | "identity_only";

export type FomoV2CanonicalProjectScorePenalty = {
  key: string;
  value: number;
  reason: string;
};

export type FomoV2CanonicalProjectScoreCap = {
  key: string;
  value: number;
  reason: string;
};

export type FomoV2CanonicalProjectScoreResult = {
  version: FomoV2CanonicalProjectScoreVersion;
  mode: FomoV2CanonicalProjectScoreMode;
  score: number;
  components: Record<string, number>;
  componentWeights?: Record<string, number>;
  penalties?: FomoV2CanonicalProjectScorePenalty[];
  caps?: FomoV2CanonicalProjectScoreCap[];
  inputs?: Record<string, any>;
  calculatedAt: Date;
};

@Schema({
  collection: "canonical_projects",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2CanonicalProject {
  @Prop({ required: true })
  name: string;

  @Prop()
  normalizedName?: string;

  @Prop()
  slug?: string;

  @Prop()
  symbol?: string;

  @Prop()
  normalizedSymbol?: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_CANONICAL_PROJECT_STATUSES,
    default: "proposed",
  })
  status: FomoV2CanonicalProjectStatus;

  @Prop()
  primaryWebsiteDomain?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  providerIds?: FomoV2ProviderIds;

  @Prop({
    type: [
      {
        type: { type: String, enum: FOMO_V2_ALIAS_TYPES, required: true },
        value: { type: String, required: true },
        normalizedValue: { type: String, required: true },
        source: { type: String },
        confidence: { type: String, enum: FOMO_V2_CONFIDENCE_LEVELS },
      },
    ],
    default: [],
  })
  aliases?: Array<
    FomoV2Alias & { type: FomoV2AliasType; confidence?: FomoV2Confidence }
  >;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  mergeTargetCanonicalProjectId?: Types.ObjectId;

  @Prop({ type: String, required: true, default: "system" })
  createdBy: "system" | "manual" | "import";

  @Prop({ type: Boolean })
  hasMarketData?: boolean;

  @Prop({ type: Boolean, default: false })
  isVestingReview?: boolean;

  @Prop({ type: Boolean, default: false })
  createdForLaunchpad?: boolean;

  @Prop({ type: String })
  launchpadIdentityKey?: string;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  fomoScore?: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  rating?: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  fullness?: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  ratingBreakdown?: FomoV2CanonicalProjectScoreResult;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  fullnessBreakdown?: FomoV2CanonicalProjectScoreResult;

  @Prop()
  lastRatingCalculatedAt?: Date;

  @Prop()
  originSourceType?: string;

  @Prop()
  identitySource?: string;

  @Prop()
  identityConfidence?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  sourceEvidence?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2CanonicalProjectSchema = SchemaFactory.createForClass(
  FomoV2CanonicalProject
);

FomoV2CanonicalProjectSchema.index(
  { slug: 1 },
  { sparse: true, name: "idx_canonical_projects_slug" }
);
FomoV2CanonicalProjectSchema.index(
  { normalizedName: 1 },
  { name: "idx_canonical_projects_normalized_name" }
);
FomoV2CanonicalProjectSchema.index(
  { normalizedSymbol: 1 },
  { name: "idx_canonical_projects_normalized_symbol" }
);
FomoV2CanonicalProjectSchema.index(
  { status: 1 },
  { name: "idx_canonical_projects_status" }
);
FomoV2CanonicalProjectSchema.index(
  { "aliases.type": 1, "aliases.normalizedValue": 1 },
  { name: "idx_canonical_projects_alias" }
);
FomoV2CanonicalProjectSchema.index(
  { primaryWebsiteDomain: 1 },
  { name: "idx_canonical_projects_primary_domain", sparse: true }
);
FomoV2CanonicalProjectSchema.index(
  { status: 1, fomoScore: -1 },
  { name: "idx_canonical_projects_status_fomo_score" }
);
FomoV2CanonicalProjectSchema.index(
  { hasMarketData: 1, fomoScore: -1 },
  { name: "idx_canonical_projects_market_fomo_score" }
);
FomoV2CanonicalProjectSchema.index(
  { isVestingReview: 1 },
  { name: "idx_canonical_projects_is_vesting_review", sparse: true }
);
FomoV2CanonicalProjectSchema.index(
  { launchpadIdentityKey: 1 },
  {
    unique: true,
    name: "uniq_canonical_projects_launchpad_identity_key",
    partialFilterExpression: { launchpadIdentityKey: { $type: "string" } },
  }
);
FomoV2CanonicalProjectSchema.index(
  { createdForLaunchpad: 1, status: 1, createdAt: -1 },
  {
    name: "idx_canonical_projects_created_for_launchpad",
    partialFilterExpression: { createdForLaunchpad: true },
  }
);
FomoV2CanonicalProjectSchema.index(
  { lastRatingCalculatedAt: -1 },
  { name: "idx_canonical_projects_last_rating_calculated_at", sparse: true }
);

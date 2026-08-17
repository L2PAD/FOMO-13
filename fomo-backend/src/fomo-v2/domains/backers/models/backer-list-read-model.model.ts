import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { FOMO_V2_BACKER_TYPES, FomoV2BackerType } from "../types";

export type FomoV2BackerListReadModelDocument =
  HydratedDocument<FomoV2BackerListReadModel>;

@Schema({
  collection: "backer_list_read_models",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2BackerListReadModel {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2Backer",
    required: true,
  })
  backerId: Types.ObjectId;

  @Prop({ type: String, enum: FOMO_V2_BACKER_TYPES, required: true })
  backerType: FomoV2BackerType;

  @Prop({ default: true })
  visible: boolean;

  @Prop({ default: "active" })
  status?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  normalizedName: string;

  @Prop()
  slug?: string;

  @Prop()
  routeId?: string;

  @Prop()
  logo?: string;

  @Prop()
  avatar?: string;

  @Prop()
  type?: string;

  @Prop()
  niche?: string;

  @Prop()
  specialization?: string;

  @Prop({ type: [String], default: [] })
  specializations?: string[];

  @Prop()
  country?: string;

  @Prop()
  location?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  regionData?: Record<string, any>;

  @Prop()
  descriptionText?: string;

  @Prop()
  bio?: string;

  @Prop()
  websiteUrl?: string;

  @Prop()
  twitterUrl?: string;

  @Prop()
  linkedinUrl?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  socialLinks?: Record<string, string>;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  socialmedia?: Array<Record<string, any>>;

  @Prop({ type: [String], default: [] })
  sectors?: string[];

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ default: 0 })
  rating?: number;

  @Prop({ default: 0 })
  fomoScore?: number;

  @Prop({ default: 0 })
  fullness?: number;

  @Prop({ default: 0 })
  roi?: number;

  @Prop()
  roiDisplay?: string;

  @Prop({ default: 0 })
  totalInvested?: number;

  @Prop({ default: 0 })
  projectsCount?: number;

  @Prop({ default: 0 })
  supportedProjectsCount?: number;

  @Prop({ default: 0 })
  portfolioCoinsCount?: number;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  supportedProjectsPreview?: Array<Record<string, any>>;

  @Prop({ default: 0 })
  leadInvestments?: number;

  @Prop({ default: 0 })
  followersCount?: number;

  @Prop({ default: false })
  isSponsored?: boolean;

  @Prop({ default: false })
  isEralash?: boolean;

  @Prop()
  eralashAdded?: Date;

  @Prop({ default: 0 })
  redFlags?: number;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  redFlagsList?: Array<Record<string, any>>;

  @Prop({ default: false })
  redStatus?: boolean;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  likes?: Array<Record<string, any>>;

  @Prop()
  lastRoundDate?: Date;

  @Prop()
  lastFunding?: Date;

  @Prop()
  lastUpdatedAt?: Date;

  @Prop({ type: [String], default: [] })
  nicheKeys?: string[];

  @Prop({ type: [String], default: [] })
  sectorKeys?: string[];

  @Prop({ type: [String], default: [] })
  countryKeys?: string[];

  @Prop({ type: [String], default: [] })
  regionKeys?: string[];

  @Prop({ type: [String], default: [] })
  searchTokens?: string[];

  @Prop()
  sourceUpdatedAt?: Date;

  @Prop()
  materializedAt?: Date;

  @Prop({ default: 1 })
  schemaVersion?: number;
}

export const FomoV2BackerListReadModelSchema =
  SchemaFactory.createForClass(FomoV2BackerListReadModel);

FomoV2BackerListReadModelSchema.index(
  { backerId: 1 },
  { unique: true, name: "uniq_backer_list_read_models_backer" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, visible: 1, rating: -1, name: 1 },
  { name: "idx_backer_list_type_rating" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, visible: 1, fullness: -1, name: 1 },
  { name: "idx_backer_list_type_fullness" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, visible: 1, roi: -1, name: 1 },
  { name: "idx_backer_list_type_roi" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, visible: 1, supportedProjectsCount: -1, name: 1 },
  { name: "idx_backer_list_type_projects" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, visible: 1, lastUpdatedAt: -1 },
  { name: "idx_backer_list_type_updated" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, visible: 1, isSponsored: 1, rating: -1 },
  { name: "idx_backer_list_type_sponsored" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, visible: 1, isEralash: 1, eralashAdded: -1 },
  { name: "idx_backer_list_type_eralash" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, nicheKeys: 1 },
  { name: "idx_backer_list_type_niche_keys" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, sectorKeys: 1 },
  { name: "idx_backer_list_type_sector_keys" },
);
FomoV2BackerListReadModelSchema.index(
  { backerType: 1, countryKeys: 1 },
  { name: "idx_backer_list_type_country_keys" },
);
FomoV2BackerListReadModelSchema.index(
  { searchTokens: 1 },
  { name: "idx_backer_list_search_tokens" },
);

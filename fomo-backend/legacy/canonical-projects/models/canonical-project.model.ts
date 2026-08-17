import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CanonicalProjectDocument = HydratedDocument<CanonicalProject>;

export type CanonicalProjectStatus = "active" | "proposed" | "merged" | "deprecated";
export type CanonicalProjectCreatedBy = "system" | "manual";
export type CanonicalProjectSourceProjectType = "market" | "project" | "ico" | "raw";
export type CanonicalProjectAliasType = "name" | "slug" | "symbol" | "contract" | "providerId";

@Schema({ collection: "canonical_projects", timestamps: true, strict: false })
export class CanonicalProject {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ index: true })
  normalizedName?: string;

  @Prop({ index: true })
  symbol?: string;

  @Prop({ index: true })
  normalizedSymbol?: string;

  @Prop({ index: true })
  slug?: string;

  @Prop({
    required: true,
    enum: ["active", "proposed", "merged", "deprecated"],
    default: "proposed",
    index: true,
  })
  status: CanonicalProjectStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true })
  primaryProjectId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true })
  primaryMarketProjectId?: mongoose.Types.ObjectId;

  @Prop({
    type: {
      coingeckoId: { type: String, index: true },
      coinmarketcapId: { type: String, index: true },
      coinMarketCapId: { type: String, index: true },
      dropstabId: { type: String, index: true },
      cryptorankId: { type: String, index: true },
      icodropsId: { type: String, index: true },
    },
    default: {},
  })
  providerIds?: {
    coingeckoId?: string;
    coinmarketcapId?: string;
    coinMarketCapId?: string;
    dropstabId?: string;
    cryptorankId?: string;
    icodropsId?: string;
  };

  @Prop({
    type: [
      {
        type: { type: String, enum: ["name", "slug", "symbol", "contract", "providerId"], required: true },
        value: { type: String, required: true },
        normalizedValue: { type: String, index: true },
        source: { type: String },
        confidence: { type: Number },
      },
    ],
    default: [],
  })
  aliases?: Array<{
    type: CanonicalProjectAliasType;
    value: string;
    normalizedValue?: string;
    source?: string;
    confidence?: number;
  }>;

  @Prop({
    type: [
      {
        source: { type: String, required: true, index: true },
        sourceId: { type: String, index: true },
        sourceSlug: { type: String, index: true },
        sourceUrl: { type: String },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
        projectType: { type: String, enum: ["market", "project", "ico", "raw"] },
        confidence: { type: Number },
        matchedBy: { type: String },
        reason: { type: String },
        verified: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  sourceRefs?: Array<{
    source: string;
    sourceId?: string;
    sourceSlug?: string;
    sourceUrl?: string;
    projectId?: mongoose.Types.ObjectId;
    projectType?: CanonicalProjectSourceProjectType;
    confidence?: number;
    matchedBy?: string;
    reason?: string;
    verified?: boolean;
  }>;

  @Prop({
    type: {
      hasMarketProject: { type: Boolean, default: false },
      hasProjectProfile: { type: Boolean, default: false },
      hasIcoProject: { type: Boolean, default: false },
      hasFundingRounds: { type: Boolean, default: false },
      hasUnlocks: { type: Boolean, default: false },
      hasChartHistory: { type: Boolean, default: false },
      hasActivities: { type: Boolean, default: false },
      hasExchangeListings: { type: Boolean, default: false },
    },
    default: {},
  })
  dataQuality?: {
    hasMarketProject?: boolean;
    hasProjectProfile?: boolean;
    hasIcoProject?: boolean;
    hasFundingRounds?: boolean;
    hasUnlocks?: boolean;
    hasChartHistory?: boolean;
    hasActivities?: boolean;
    hasExchangeListings?: boolean;
  };

  @Prop({ required: true, enum: ["system", "manual"], default: "system" })
  createdBy: CanonicalProjectCreatedBy;
}

export const CanonicalProjectSchema = SchemaFactory.createForClass(CanonicalProject);

CanonicalProjectSchema.index({ slug: 1 }, { sparse: true });
CanonicalProjectSchema.index({ normalizedName: 1 });
CanonicalProjectSchema.index({ normalizedSymbol: 1 });
CanonicalProjectSchema.index({ status: 1 });
CanonicalProjectSchema.index({ primaryProjectId: 1 }, { sparse: true });
CanonicalProjectSchema.index({ primaryMarketProjectId: 1 }, { sparse: true });
CanonicalProjectSchema.index({ "providerIds.coingeckoId": 1 }, { sparse: true });
CanonicalProjectSchema.index({ "providerIds.coinmarketcapId": 1 }, { sparse: true });
CanonicalProjectSchema.index({ "providerIds.coinMarketCapId": 1 }, { sparse: true });
CanonicalProjectSchema.index({ "providerIds.dropstabId": 1 }, { sparse: true });
CanonicalProjectSchema.index({ "providerIds.cryptorankId": 1 }, { sparse: true });
CanonicalProjectSchema.index({ "providerIds.icodropsId": 1 }, { sparse: true });
CanonicalProjectSchema.index({ "sourceRefs.projectId": 1 });
CanonicalProjectSchema.index({ "sourceRefs.source": 1, "sourceRefs.sourceId": 1 });
CanonicalProjectSchema.index({ "aliases.type": 1, "aliases.normalizedValue": 1 });

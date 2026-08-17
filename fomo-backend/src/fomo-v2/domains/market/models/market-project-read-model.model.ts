import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import { FomoV2ProviderIds } from "../../../fomo-v2.types";

export const FOMO_V2_MARKET_PROJECT_KINDS = ["market", "ico_market", "market_only"] as const;
export type FomoV2MarketProjectKind = (typeof FOMO_V2_MARKET_PROJECT_KINDS)[number];
export type FomoV2MarketProjectTier = MarketDataTier;
export type FomoV2MarketPerformanceQuote = "usd" | "btc" | "eth" | "sol";

export interface FomoV2MarketPerformancePeriodSet {
  change1h?: number | null;
  change24h?: number | null;
  change7d?: number | null;
  change30d?: number | null;
  change90d?: number | null;
  change1y?: number | null;
}

export type FomoV2MarketPerformance = Partial<Record<FomoV2MarketPerformanceQuote, FomoV2MarketPerformancePeriodSet>>;

export type FomoV2MarketProjectReadModelDocument = HydratedDocument<FomoV2MarketProjectReadModel>;

@Schema({ collection: "market_project_read_models", timestamps: true, strict: true, autoIndex: false })
export class FomoV2MarketProjectReadModel {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project" })
  legacyProjectId?: Types.ObjectId;

  @Prop()
  legacyRouteId?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  canonicalProjectId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset", required: true })
  marketAssetId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: FOMO_V2_MARKET_PROJECT_KINDS, default: "market_only" })
  projectKind: FomoV2MarketProjectKind;

  @Prop({ required: true })
  name: string;

  @Prop()
  symbol?: string;

  @Prop()
  slug?: string;

  @Prop()
  logo?: string;

  @Prop()
  niche?: string;

  @Prop()
  category?: string;

  @Prop()
  rank?: number;

  @Prop({ type: String, enum: ["HOT", "WARM", "COLD"] })
  tier?: FomoV2MarketProjectTier;

  @Prop({ default: "CURRENTLY_TRADING" })
  trading?: string;

  @Prop({ default: "active" })
  status?: string;

  @Prop()
  price?: number;

  @Prop()
  priceChange?: number;

  @Prop()
  priceBTC?: number;

  @Prop()
  priceETH?: number;

  @Prop()
  priceSOL?: number;

  @Prop()
  marketCap?: number;

  @Prop()
  fullyDilutedMarketCap?: number;

  @Prop()
  volume24h?: number;

  @Prop()
  volume24hChange?: number;

  @Prop()
  circulatingSupply?: number;

  @Prop()
  totalSupply?: number;

  @Prop()
  maxSupply?: number;

  @Prop()
  circulatingSupplyPercent?: number;

  @Prop()
  athUsd?: number;

  @Prop()
  athUsdDate?: Date;

  @Prop()
  athUsdChangePercent?: number;

  @Prop()
  atlUsd?: number;

  @Prop()
  atlUsdDate?: Date;

  @Prop()
  atlUsdChangePercent?: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  usdQuote?: {
    price?: number;
    volume_24h?: number;
    percent_change_1h?: number;
    percent_change_24h?: number;
    percent_change_7d?: number;
    market_cap?: number;
    fully_diluted_market_cap?: number;
    last_updated?: string | Date;
  };

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  performance?: FomoV2MarketPerformance;

  @Prop()
  performanceUpdatedAt?: Date;

  @Prop()
  performanceSource?: string;

  @Prop()
  performanceProvider?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  performanceMissing?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  performanceMeta?: Record<string, any>;

  @Prop()
  marketDataUpdatedAt?: Date;

  @Prop()
  dateAdded?: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  chart7d?: any;

  @Prop()
  chart7dUpdatedAt?: Date;

  @Prop()
  chart7dSource?: string;

  @Prop()
  chart7dPointsCount?: number;

  @Prop()
  chart7dTrend?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  fomoScore?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  rating?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  fullness?: any;

  @Prop({ type: Boolean, default: false })
  isVestingReview?: boolean;

  @Prop({ type: Boolean, default: false })
  isSponsored?: boolean;

  @Prop({ type: Boolean, default: false })
  isEralash?: boolean;

  @Prop()
  eralashAdded?: Date;

  @Prop()
  description?: string;

  @Prop()
  descriptionText?: string;

  @Prop()
  bio?: string;

  @Prop({ type: [String], default: [] })
  categories?: string[];

  @Prop({ type: [String], default: [] })
  topCategories?: string[];

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  contracts?: any[];

  @Prop({ type: [String], default: [] })
  website?: string[];

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  socialmedia?: any[];

  @Prop({ type: [String], default: [] })
  explorers?: string[];

  @Prop({ type: [String], default: [] })
  bridge?: string[];

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  links?: any[];

  @Prop()
  coingeckoDetailsUpdatedAt?: Date;

  @Prop()
  coingeckoDetailsSource?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  providerIds?: FomoV2ProviderIds;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  sourceCoverage?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  debug?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FomoV2MarketProjectReadModelSchema =
  SchemaFactory.createForClass(FomoV2MarketProjectReadModel);

FomoV2MarketProjectReadModelSchema.index(
  { marketAssetId: 1 },
  { unique: true, name: "uniq_market_project_read_models_market_asset" },
);
FomoV2MarketProjectReadModelSchema.index(
  { canonicalProjectId: 1 },
  {
    unique: true,
    sparse: true,
    name: "uniq_market_project_read_models_canonical_project",
  },
);
FomoV2MarketProjectReadModelSchema.index(
  { legacyProjectId: 1 },
  {
    unique: true,
    sparse: true,
    name: "uniq_market_project_read_models_legacy_project",
  },
);
FomoV2MarketProjectReadModelSchema.index({ legacyRouteId: 1 }, { sparse: true, name: "idx_market_project_read_models_legacy_route" });
FomoV2MarketProjectReadModelSchema.index({ rank: 1 }, { sparse: true, name: "idx_market_project_read_models_rank" });
FomoV2MarketProjectReadModelSchema.index({ tier: 1, rank: 1 }, { sparse: true, name: "idx_market_project_read_models_tier_rank" });
FomoV2MarketProjectReadModelSchema.index({ marketCap: -1 }, { sparse: true, name: "idx_market_project_read_models_market_cap" });
FomoV2MarketProjectReadModelSchema.index({ volume24h: -1 }, { sparse: true, name: "idx_market_project_read_models_volume24h" });
FomoV2MarketProjectReadModelSchema.index({ volume24hChange: -1 }, { sparse: true, name: "idx_market_project_read_models_volume24h_change" });
FomoV2MarketProjectReadModelSchema.index({ performanceUpdatedAt: -1 }, { sparse: true, name: "idx_market_project_read_models_performance_updated_at" });
FomoV2MarketProjectReadModelSchema.index({ coingeckoDetailsUpdatedAt: -1 }, { sparse: true, name: "idx_market_project_read_models_coingecko_details_updated_at" });
FomoV2MarketProjectReadModelSchema.index({ isSponsored: 1, rank: 1 }, { name: "idx_market_project_read_models_sponsored_rank" });
FomoV2MarketProjectReadModelSchema.index({ isEralash: 1, eralashAdded: -1, rank: 1 }, { name: "idx_market_project_read_models_eralash_rank" });
FomoV2MarketProjectReadModelSchema.index({ updatedAt: -1 }, { name: "idx_market_project_read_models_updated_at" });
FomoV2MarketProjectReadModelSchema.index({ trading: 1, status: 1 }, { name: "idx_market_project_read_models_trading_status" });
FomoV2MarketProjectReadModelSchema.index(
  { "providerIds.coingeckoId": 1 },
  { sparse: true, name: "idx_market_project_read_models_coingecko_id" },
);

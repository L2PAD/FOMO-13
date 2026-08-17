import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { FOMO_V2_BACKER_TYPES, FomoV2BackerType } from "../types";

export type FomoV2BackerPortfolioHoldingDocument =
  HydratedDocument<FomoV2BackerPortfolioHolding>;

@Schema({
  collection: "backer_portfolio_holdings",
  timestamps: { createdAt: false, updatedAt: true },
  strict: true,
  autoIndex: false,
})
export class FomoV2BackerPortfolioHolding {
  _id?: Types.ObjectId;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2Backer",
    required: true,
  })
  backerId: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
  })
  canonicalProjectId: Types.ObjectId;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "FomoV2FundingRound" })
  roundIds: Types.ObjectId[];

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: "FomoV2FundingRoundParticipant",
  })
  participantIds: Types.ObjectId[];

  @Prop()
  firstRoundDate?: Date;

  @Prop()
  lastRoundDate?: Date;

  @Prop({ type: [String], default: [] })
  roundTypes: string[];

  @Prop({ default: false })
  isLead: boolean;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "FomoV2FundingRound" })
  leadRoundIds: Types.ObjectId[];

  @Prop({ required: true, default: 0 })
  roundsCount: number;

  @Prop({ required: true, default: 0 })
  leadRoundsCount: number;

  @Prop()
  totalKnownRaisedAmountUsd?: number;

  @Prop()
  backerName?: string;

  @Prop({ type: String, enum: FOMO_V2_BACKER_TYPES })
  backerType?: FomoV2BackerType;

  @Prop()
  projectName?: string;

  @Prop()
  projectSlug?: string;

  @Prop()
  projectSymbol?: string;

  @Prop()
  projectLogoUrl?: string;

  @Prop({ default: false })
  hasMarketData?: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset" })
  marketAssetId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  sourceTypes: string[];

  @Prop({ type: [String], default: [] })
  sourceFeeds: string[];
}

export const FomoV2BackerPortfolioHoldingSchema =
  SchemaFactory.createForClass(FomoV2BackerPortfolioHolding);

FomoV2BackerPortfolioHoldingSchema.index(
  { backerId: 1, canonicalProjectId: 1 },
  { unique: true, name: "uniq_backer_portfolio_holdings_backer_project" }
);
FomoV2BackerPortfolioHoldingSchema.index(
  { backerId: 1 },
  { name: "idx_backer_portfolio_holdings_backer" }
);
FomoV2BackerPortfolioHoldingSchema.index(
  { canonicalProjectId: 1 },
  { name: "idx_backer_portfolio_holdings_project" }
);
FomoV2BackerPortfolioHoldingSchema.index(
  { isLead: 1 },
  { name: "idx_backer_portfolio_holdings_is_lead" }
);
FomoV2BackerPortfolioHoldingSchema.index(
  { firstRoundDate: 1 },
  { name: "idx_backer_portfolio_holdings_first_round_date", sparse: true }
);
FomoV2BackerPortfolioHoldingSchema.index(
  { hasMarketData: 1 },
  { name: "idx_backer_portfolio_holdings_has_market_data" }
);

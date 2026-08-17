import {
  FomoV2Backer,
  FomoV2BackerAnalyticsSnapshot,
  FomoV2BackerAnalyticsSnapshotSchema,
  FomoV2BackerListReadModel,
  FomoV2BackerListReadModelSchema,
  FomoV2BackerPortfolioHolding,
  FomoV2BackerPortfolioHoldingSchema,
  FomoV2BackerReadModel,
  FomoV2BackerReadModelSchema,
  FomoV2BackerSchema,
  FomoV2BackerSourceProfile,
  FomoV2BackerSourceProfileSchema,
  FomoV2IntelInvestorSource,
  FomoV2IntelInvestorSourceSchema,
} from "../models";

export const FOMO_V2_BACKER_MODEL_DEFINITIONS = [
  { name: FomoV2Backer.name, schema: FomoV2BackerSchema },
  {
    name: FomoV2BackerAnalyticsSnapshot.name,
    schema: FomoV2BackerAnalyticsSnapshotSchema,
  },
  {
    name: FomoV2BackerSourceProfile.name,
    schema: FomoV2BackerSourceProfileSchema,
  },
  {
    name: FomoV2BackerReadModel.name,
    schema: FomoV2BackerReadModelSchema,
  },
  {
    name: FomoV2BackerListReadModel.name,
    schema: FomoV2BackerListReadModelSchema,
  },
  {
    name: FomoV2BackerPortfolioHolding.name,
    schema: FomoV2BackerPortfolioHoldingSchema,
  },
];

export const FOMO_V2_BACKER_PARSER_MODEL_DEFINITIONS = [
  {
    name: FomoV2IntelInvestorSource.name,
    schema: FomoV2IntelInvestorSourceSchema,
  },
];

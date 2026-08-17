import {
  FomoV2MarketAsset,
  FomoV2MarketAssetSchema,
  FomoV2MarketHistoryImportRun,
  FomoV2MarketHistoryImportRunSchema,
  FomoV2MarketProjectHistory,
  FomoV2MarketProjectHistorySchema,
  FomoV2MarketProjectPerformance,
  FomoV2MarketProjectPerformanceSchema,
  FomoV2MarketProjectReadModel,
  FomoV2MarketProjectReadModelSchema,
  FomoV2MarketProjectRoiMetric,
  FomoV2MarketProjectRoiMetricSchema,
  FomoV2MarketSyncState,
  FomoV2MarketSyncStateSchema,
  FomoV2ProjectAssetLink,
  FomoV2ProjectAssetLinkSchema,
  FomoV2ProjectExchangeMarket,
  FomoV2ProjectExchangeMarketSchema,
  FomoV2ProjectExchangeOverview,
  FomoV2ProjectExchangeOverviewSchema,
  FomoV2ProjectMarketSnapshot,
  FomoV2ProjectMarketSnapshotSchema,
} from "../models";

export const FOMO_V2_MARKET_MODEL_DEFINITIONS = [
  { name: FomoV2MarketAsset.name, schema: FomoV2MarketAssetSchema },
  {
    name: FomoV2MarketHistoryImportRun.name,
    schema: FomoV2MarketHistoryImportRunSchema,
  },
  {
    name: FomoV2MarketProjectReadModel.name,
    schema: FomoV2MarketProjectReadModelSchema,
  },
  {
    name: FomoV2MarketProjectHistory.name,
    schema: FomoV2MarketProjectHistorySchema,
  },
  {
    name: FomoV2MarketProjectPerformance.name,
    schema: FomoV2MarketProjectPerformanceSchema,
  },
  {
    name: FomoV2MarketProjectRoiMetric.name,
    schema: FomoV2MarketProjectRoiMetricSchema,
  },
  {
    name: FomoV2MarketSyncState.name,
    schema: FomoV2MarketSyncStateSchema,
  },
  { name: FomoV2ProjectAssetLink.name, schema: FomoV2ProjectAssetLinkSchema },
  {
    name: FomoV2ProjectExchangeMarket.name,
    schema: FomoV2ProjectExchangeMarketSchema,
  },
  {
    name: FomoV2ProjectExchangeOverview.name,
    schema: FomoV2ProjectExchangeOverviewSchema,
  },
  {
    name: FomoV2ProjectMarketSnapshot.name,
    schema: FomoV2ProjectMarketSnapshotSchema,
  },
];

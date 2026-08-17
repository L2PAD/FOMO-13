import type {
  FundPortfolioAsset,
  FundPortfolioAssetItem,
  FundPortfolioAssetsPage,
  FundPortfolioResponse,
} from "../funds/fetchFundPortfolio";
import {
  fetchFomoV2Persons,
  isFomoV2PersonsDetailEnabled,
} from "./personsV2Api";

export type {
  FundPortfolioAsset as PersonPortfolioAsset,
  FundPortfolioAssetItem as PersonPortfolioAssetItem,
  FundPortfolioAssetsPage as PersonPortfolioAssetsPage,
  FundPortfolioResponse as PersonPortfolioResponse,
};

interface FetchPersonPortfolioParams {
  offset?: number;
  limit?: number;
  includeSummary?: boolean;
}

const emptyResponse = (
  limit = 20,
  offset = 0
): FundPortfolioResponse => ({
  ok: false,
  isSuccess: false,
  assets: {
    items: [],
    total: 0,
    limit,
    offset,
    hasMore: false,
  },
  items: [],
  portfolioAssets: [],
  total: 0,
  limit,
  offset,
  hasMore: false,
  summaryIncluded: false,
  categoryDistribution: [],
  roundsByCategory: [],
  lockedUnlockedDistribution: [],
  fundraisingRounds: [],
  totalInvested: 0,
  totalAllocated: 0,
  supportedProjectsCount: 0,
  portfolioCoinsCount: 0,
});

export default async function fetchPersonPortfolio(
  id: string,
  params: FetchPersonPortfolioParams = {}
): Promise<FundPortfolioResponse> {
  const offset = Math.max(Number(params.offset) || 0, 0);
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);

  if (!id || !isFomoV2PersonsDetailEnabled()) return emptyResponse(limit, offset);

  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    includeSummary: params.includeSummary === false ? "false" : "true",
  });

  try {
    const { data, res } = await fetchFomoV2Persons(
      `${encodeURIComponent(id)}/portfolio`,
      `?${query.toString()}`
    );
    const assetPage = data?.assets || {};
    const items = Array.isArray(assetPage?.items)
      ? assetPage.items
      : Array.isArray(data?.items)
        ? data.items
        : [];
    const total = Number(assetPage?.total ?? data?.total ?? 0);
    const responseLimit = Number(assetPage?.limit ?? data?.limit ?? limit);
    const responseOffset = Number(assetPage?.offset ?? data?.offset ?? offset);
    const hasMore =
      typeof assetPage?.hasMore === "boolean"
        ? assetPage.hasMore
        : typeof data?.hasMore === "boolean"
          ? data.hasMore
          : responseOffset + items.length < total;

    return {
      ok: res.ok && data?.ok !== false && !data?.message,
      isSuccess: res.ok && data?.isSuccess !== false && data?.ok !== false && !data?.message,
      assets: {
        items,
        total,
        limit: responseLimit,
        offset: responseOffset,
        hasMore,
      },
      items,
      portfolioAssets: items,
      total,
      limit: responseLimit,
      offset: responseOffset,
      hasMore,
      summaryIncluded: Boolean(data?.summaryIncluded),
      categoryDistribution: Array.isArray(data?.categoryDistribution)
        ? data.categoryDistribution
        : [],
      roundsByCategory: Array.isArray(data?.roundsByCategory)
        ? data.roundsByCategory
        : [],
      lockedUnlockedDistribution: Array.isArray(data?.lockedUnlockedDistribution)
        ? data.lockedUnlockedDistribution
        : [],
      fundraisingRounds: Array.isArray(data?.fundraisingRounds)
        ? data.fundraisingRounds
        : [],
      totalInvested: Number(data?.totalInvested || 0),
      totalAllocated: Number(data?.totalAllocated || data?.totalInvested || 0),
      supportedProjectsCount: Number(data?.supportedProjectsCount || 0),
      portfolioCoinsCount: Number(data?.portfolioCoinsCount || 0),
      error: data?.error || data?.message,
    };
  } catch {
    return emptyResponse(limit, offset);
  }
}

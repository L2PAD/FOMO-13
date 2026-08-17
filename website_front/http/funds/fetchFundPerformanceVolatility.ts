import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

export type FundVolatilitySortField =
  | "name"
  | "investedRound"
  | "volatility"
  | "status";

export type FundVolatilitySortDirection = "asc" | "desc";

export type FundVolatilityProject = {
  _id?: string;
  id?: string;
  projectId?: string;
  marketAssetId?: string;
  logo?: string;
  image?: string;
  name: string;
  symbol?: string;
  niche?: string;
  category?: string;
  investedRound?: string;
  volatility?: number | null;
  volatilityPct?: number | null;
  annualizedVolatilityPct?: number | null;
  rangeVolatilityPct?: number | null;
  status?: "Low" | "Medium" | "High" | "Insufficient" | string;
  riskLevel?: "Low" | "Medium" | "High" | "Insufficient" | string;
  dataQuality?: "ok" | "insufficient_history" | "missing_history" | string;
  pointsCount?: number;
  returnsCount?: number;
  availableFrom?: string;
  availableTo?: string;
};

export type FundPerformanceVolatilityResponse = {
  ok: boolean;
  isSuccess: boolean;
  range: string;
  items: FundVolatilityProject[];
  projects: FundVolatilityProject[];
  total: number;
  page: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  meta?: Record<string, any>;
  error?: string;
};

const emptyResponse = (error?: string): FundPerformanceVolatilityResponse => ({
  ok: !error,
  isSuccess: !error,
  range: "90D",
  items: [],
  projects: [],
  total: 0,
  page: 1,
  limit: 10,
  offset: 0,
  hasMore: false,
  error,
});

export default async function fetchFundPerformanceVolatility(
  id: string,
  params: {
    range?: string;
    page?: number;
    limit?: number;
    sortBy?: FundVolatilitySortField;
    sortOrder?: FundVolatilitySortDirection;
  } = {},
): Promise<FundPerformanceVolatilityResponse> {
  if (!id || !isFomoV2FundsDetailEnabled()) return emptyResponse();

  const query = new URLSearchParams();
  query.set("range", params.range || "90D");
  query.set("page", String(params.page || 1));
  query.set("limit", String(params.limit || 10));
  query.set("sortBy", params.sortBy || "volatility");
  query.set("sortOrder", params.sortOrder || "desc");

  try {
    const { data, res } = await fetchFomoV2Funds(
      `${encodeURIComponent(id)}/performance/volatility`,
      `?${query.toString()}`,
    );

    if (!res.ok || data?.ok === false || data?.message) {
      return emptyResponse(data?.error || data?.message || "Failed to load volatility");
    }

    const items = Array.isArray(data?.items) ? data.items : [];

    return {
      ok: true,
      isSuccess: data?.isSuccess !== false,
      range: data?.range || params.range || "90D",
      items,
      projects: Array.isArray(data?.projects) ? data.projects : items,
      total: Number(data?.total || items.length || 0),
      page: Number(data?.page || params.page || 1),
      limit: Number(data?.limit || params.limit || 10),
      offset: Number(data?.offset || 0),
      hasMore: Boolean(data?.hasMore),
      meta: data?.meta || {},
    };
  } catch {
    return emptyResponse("Failed to load volatility");
  }
}

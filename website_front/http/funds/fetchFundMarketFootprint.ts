import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

export type FundMarketFootprintTab = "30D" | "90D" | "6M" | "YTD" | "All Time";

export type FundMarketFootprintProject = {
  id?: string;
  logo?: string;
  name: string;
  symbol?: string;
  slug?: string;
  nich?: string;
  a: number;
  b: number;
  marketCap?: number;
  fdv?: number;
  marketValueType?: "marketCap" | "fdv" | "";
};

export type FundMarketFootprintCategory = {
  name: string;
  a: number;
  b: number;
  items: FundMarketFootprintProject[];
};

export type FundMarketFootprintResponse = {
  ok: boolean;
  isSuccess: boolean;
  byTab: Record<FundMarketFootprintTab, FundMarketFootprintCategory[]>;
  categoriesByTab: Record<FundMarketFootprintTab, FundMarketFootprintCategory[]>;
  marketFootprint?: {
    byTab?: Record<FundMarketFootprintTab, FundMarketFootprintCategory[]>;
    categoriesByTab?: Record<FundMarketFootprintTab, FundMarketFootprintCategory[]>;
  };
  meta?: Record<string, any>;
  error?: string;
};

const emptyByTab = (): Record<FundMarketFootprintTab, FundMarketFootprintCategory[]> => ({
  "30D": [],
  "90D": [],
  "6M": [],
  YTD: [],
  "All Time": [],
});

const emptyResponse = (error?: string): FundMarketFootprintResponse => {
  const byTab = emptyByTab();

  return {
    ok: !error,
    isSuccess: !error,
    byTab,
    categoriesByTab: byTab,
    error,
  };
};

export default async function fetchFundMarketFootprint(
  id: string,
): Promise<FundMarketFootprintResponse> {
  if (!id || !isFomoV2FundsDetailEnabled()) return emptyResponse();

  try {
    const { data, res } = await fetchFomoV2Funds(
      `${encodeURIComponent(id)}/performance/market-footprint`,
    );

    if (!res.ok || data?.ok === false || data?.message) {
      return emptyResponse(data?.error || data?.message || "Failed to load market footprint");
    }

    const byTab =
      data?.byTab ||
      data?.categoriesByTab ||
      data?.marketFootprint?.byTab ||
      data?.marketFootprint?.categoriesByTab ||
      emptyByTab();
    const normalizedByTab = {
      ...emptyByTab(),
      ...byTab,
    };

    return {
      ok: true,
      isSuccess: data?.isSuccess !== false,
      byTab: normalizedByTab,
      categoriesByTab: normalizedByTab,
      marketFootprint: {
        byTab: normalizedByTab,
        categoriesByTab: normalizedByTab,
      },
      meta: data?.meta || {},
    };
  } catch {
    return emptyResponse("Failed to load market footprint");
  }
}

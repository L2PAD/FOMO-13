import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

export type FundComparisonTab = "30D" | "90D" | "6M" | "YTD" | "All Time";
export type FundComparisonSection =
  | "table"
  | "roiTrend"
  | "riskScatter"
  | "bestWorst"
  | "entryAgeRoi";
export type FundComparisonSearchScope = "roiTrend" | "riskScatter";

export type FundComparisonLine = {
  label: string;
  color: string;
};

export type FundComparisonFund = {
  id?: string;
  backerId?: string;
  name: string;
  slug?: string;
  routeId?: string;
  logo?: string;
  avatar?: string;
  niche?: string;
};

export type FundComparisonSearchItem = FundComparisonFund & {
  label?: string;
  metricLabel?: string;
  currentRoiDisplay?: string;
  eligibility?: {
    scope?: FundComparisonSearchScope;
    roiCandidates?: number;
    averageProjectRoi?: number;
    volatilityPct?: number;
    volatilityAssets?: number;
    volatilityAssetsTotal?: number;
    riskLevel?: string;
    dataQuality?: string;
  };
};

export type FundComparisonPoint = {
  name: string;
  date?: string;
  [key: string]: any;
};

export type FundComparisonInvestment = {
  id?: string;
  roundId?: string;
  name: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  image?: string;
  category?: string;
  roundName?: string;
  value?: number;
  roi?: number;
  returnPct?: number;
};

export type FundComparisonTableRow = {
  id?: string;
  backerId?: string;
  name: string;
  slug?: string;
  logo?: string;
  avatar?: string;
  niche?: string;
  portfolioRoundsRaised?: number;
  holdingsCount?: number;
  supportedProjectsCount?: number;
  projectsCount?: number;
  totalRaised?: number;
  averageProjectRoi?: number;
  avgRoi?: number;
  bestInvestmentRoi?: FundComparisonInvestment;
  volatility?: number;
  volatilityPct?: number;
  riskLevel?: string;
  isCurrent?: boolean;
};

export type FundComparisonBestWorstRow = FundComparisonTableRow & {
  bestInvestment?: FundComparisonInvestment;
  worstInvestment?: FundComparisonInvestment;
};

export type FundComparisonScatterItem = {
  id?: string;
  name: string;
  slug?: string;
  logo?: string;
  niche?: string;
  x: number;
  y: number;
  volatility?: number;
  averageProjectRoi?: number;
  riskLevel?: string;
  color?: string;
  categories?: string[];
  dataQuality?: {
    roiCandidates?: number;
    volatilityAssets?: number;
    volatilityAssetsTotal?: number;
    volatility?: string;
  };
};

export type FundComparisonEntryAgeItem = {
  id?: string;
  logo?: string;
  name: string;
  niche?: string;
  roundName?: string;
  roundNames?: string[];
  roundDate?: string;
  roundDates?: string[];
  fundId?: string;
  fundName?: string;
  fundIds?: string[];
  fundNames?: string[];
  fundsCount?: number;
  entriesCount?: number;
  a: number;
  roi?: number;
};

export type FundComparisonEntryAgeCategory = {
  key?: string;
  name: string;
  bgColor?: "green" | "red" | "yellow" | "blue";
  a: number;
  items: FundComparisonEntryAgeItem[];
};

export type FundComparisonResponse = {
  ok: boolean;
  isSuccess: boolean;
  backer?: FundComparisonFund;
  peers?: FundComparisonFund[];
  table: { rows: FundComparisonTableRow[] };
  roiTrend: {
    lines: FundComparisonLine[];
    dataByTab: Record<FundComparisonTab, FundComparisonPoint[]>;
    byTab?: Record<FundComparisonTab, FundComparisonPoint[]>;
    leftLabels?: number[];
    leftLabelsByTab?: Record<FundComparisonTab, number[]>;
  };
  riskScatter: {
    items: FundComparisonScatterItem[];
    categories?: string[];
  };
  bestWorst: { rows: FundComparisonBestWorstRow[] };
  entryAgeRoi: { categories: FundComparisonEntryAgeCategory[] };
  meta?: Record<string, any>;
  error?: string;
};

const tabs: FundComparisonTab[] = ["30D", "90D", "6M", "YTD", "All Time"];

const emptyByTab = (): Record<FundComparisonTab, FundComparisonPoint[]> =>
  tabs.reduce(
    (acc, tab) => {
      acc[tab] = [];
      return acc;
    },
    {} as Record<FundComparisonTab, FundComparisonPoint[]>,
  );

const emptyResponse = (error?: string): FundComparisonResponse => ({
  ok: !error,
  isSuccess: !error,
  error,
  peers: [],
  table: { rows: [] },
  roiTrend: {
    lines: [],
    dataByTab: emptyByTab(),
    byTab: emptyByTab(),
    leftLabels: [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0],
    leftLabelsByTab: {
      "30D": [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0],
      "90D": [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0],
      "6M": [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0],
      YTD: [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0],
      "All Time": [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0],
    },
  },
  riskScatter: { items: [], categories: [] },
  bestWorst: { rows: [] },
  entryAgeRoi: { categories: [] },
  meta: {},
});

export default async function fetchFundComparison(
  id: string,
  params: {
    section?: FundComparisonSection;
    peerIds?: string[];
    peerLimit?: number;
  } = {},
): Promise<FundComparisonResponse> {
  if (!id || !isFomoV2FundsDetailEnabled()) return emptyResponse();

  try {
    const searchParams = new URLSearchParams();
    if (params.section) searchParams.set("section", params.section);
    if (Object.prototype.hasOwnProperty.call(params, "peerIds")) {
      searchParams.set(
        "peerIds",
        params.peerIds?.length ? params.peerIds.join(",") : "__empty",
      );
    }
    if (params.peerLimit) searchParams.set("peerLimit", String(params.peerLimit));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const { data, res } = await fetchFomoV2Funds(
      `${encodeURIComponent(id)}/comparison`,
      query,
    );

    if (!res.ok || data?.ok === false || data?.message) {
      return emptyResponse(data?.error || data?.message || "Failed to load comparison");
    }

    const roiTrend = data?.roiTrend || {};
    const dataByTab = roiTrend.dataByTab || roiTrend.byTab || {};

    return {
      ok: true,
      isSuccess: data?.isSuccess !== false,
      backer: data?.backer,
      peers: Array.isArray(data?.peers) ? data.peers : [],
      table: {
        rows: Array.isArray(data?.table?.rows) ? data.table.rows : [],
      },
      roiTrend: {
        lines: Array.isArray(roiTrend.lines) ? roiTrend.lines : [],
        dataByTab: {
          ...emptyByTab(),
          ...dataByTab,
        },
        byTab: {
          ...emptyByTab(),
          ...(roiTrend.byTab || dataByTab),
        },
        leftLabels: Array.isArray(roiTrend.leftLabels)
          ? roiTrend.leftLabels
          : emptyResponse().roiTrend.leftLabels,
        leftLabelsByTab:
          roiTrend.leftLabelsByTab || emptyResponse().roiTrend.leftLabelsByTab,
      },
      riskScatter: {
        items: Array.isArray(data?.riskScatter?.items)
          ? data.riskScatter.items
          : [],
        categories: Array.isArray(data?.riskScatter?.categories)
          ? data.riskScatter.categories
          : [],
      },
      bestWorst: {
        rows: Array.isArray(data?.bestWorst?.rows) ? data.bestWorst.rows : [],
      },
      entryAgeRoi: {
        categories: Array.isArray(data?.entryAgeRoi?.categories)
          ? data.entryAgeRoi.categories
          : [],
      },
      meta: data?.meta || {},
    };
  } catch {
    return emptyResponse("Failed to load comparison");
  }
}

export async function fetchFundComparisonSearch(
  id: string,
  params: {
    scope: FundComparisonSearchScope;
    search?: string;
    excludeIds?: string[];
    limit?: number;
  },
): Promise<{
  ok: boolean;
  isSuccess: boolean;
  scope: FundComparisonSearchScope;
  items: FundComparisonSearchItem[];
  funds: FundComparisonSearchItem[];
  total: number;
  limit: number;
  maxSelected: number;
  error?: string;
}> {
  if (!id || !isFomoV2FundsDetailEnabled()) {
    return {
      ok: false,
      isSuccess: false,
      scope: params.scope,
      items: [],
      funds: [],
      total: 0,
      limit: params.limit || 20,
      maxSelected: 5,
    };
  }

  const query = new URLSearchParams({
    scope: params.scope,
    search: params.search || "",
    limit: String(params.limit || 20),
  });

  if (params.excludeIds?.length) {
    query.set("exclude", params.excludeIds.join(","));
  }

  try {
    const { data, res } = await fetchFomoV2Funds(
      `${encodeURIComponent(id)}/comparison/search`,
      `?${query.toString()}`,
    );
    const items = Array.isArray(data?.items) ? data.items : [];

    return {
      ok: res.ok && data?.ok !== false && !data?.message,
      isSuccess: res.ok && data?.isSuccess !== false && data?.ok !== false && !data?.message,
      scope: data?.scope || params.scope,
      items,
      funds: items,
      total: Number(data?.total || items.length || 0),
      limit: Number(data?.limit || params.limit || 20),
      maxSelected: Number(data?.maxSelected || 5),
      error: data?.error || data?.message,
    };
  } catch {
    return {
      ok: false,
      isSuccess: false,
      scope: params.scope,
      items: [],
      funds: [],
      total: 0,
      limit: params.limit || 20,
      maxSelected: 5,
      error: "Failed to search comparison funds",
    };
  }
}

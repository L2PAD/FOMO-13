import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

export type FundPerformanceTab = "30D" | "90D" | "6M" | "YTD" | "All Time";

export type FundPerformanceLine = {
  label: string;
  color: string;
};

export type FundPerformancePoint = {
  name: string;
  date?: string;
  companyType?: string;
  totalInvestment?: number;
  keyProjects?: Array<{ name: string; amount: number; category?: string }>;
  categories?: string[];
  [key: string]: any;
};

export type FundRoiPerformance = {
  lines: FundPerformanceLine[];
  dataByTab: Record<FundPerformanceTab, FundPerformancePoint[]>;
  byTab?: Record<FundPerformanceTab, FundPerformancePoint[]>;
  leftLabels: number[];
  leftLabelsByTab?: Record<FundPerformanceTab, number[]>;
  labels?: number[];
  selectedRounds: Array<Record<string, any>>;
  meta?: Record<string, any>;
};

export type FundPerformanceSearchItem = {
  _id?: string;
  id: string;
  roundId: string;
  projectKey?: string;
  projectName: string;
  projectSlug?: string;
  projectSymbol?: string;
  projectLogo?: string;
  name: string;
  label: string;
  symbol?: string;
  logo?: string;
  image?: string;
  roundName?: string;
  roundLabel?: string;
  tokenPrice?: number;
  currentPrice?: number;
  currentRoi?: number;
  currentRoiDisplay?: string;
};

export type FundPerformanceResponse = {
  ok: boolean;
  isSuccess: boolean;
  roiPerformance: FundRoiPerformance;
  error?: string;
};

const tabs: FundPerformanceTab[] = ["30D", "90D", "6M", "YTD", "All Time"];

const emptyByTab = (): Record<FundPerformanceTab, FundPerformancePoint[]> =>
  tabs.reduce(
    (acc, tab) => {
      acc[tab] = [];
      return acc;
    },
    {} as Record<FundPerformanceTab, FundPerformancePoint[]>,
  );

const emptyResponse = (error?: string): FundPerformanceResponse => ({
  ok: !error,
  isSuccess: !error,
  error,
  roiPerformance: {
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
    labels: [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0],
    selectedRounds: [],
    meta: {},
  },
});

export default async function fetchFundPerformance(
  id: string,
  params: { selectedRoundIds?: string[] } = {},
): Promise<FundPerformanceResponse> {
  if (!id || !isFomoV2FundsDetailEnabled()) return emptyResponse();

  const query = new URLSearchParams();
  if (Object.prototype.hasOwnProperty.call(params, "selectedRoundIds")) {
    query.set(
      "selectedRoundIds",
      params.selectedRoundIds?.length ? params.selectedRoundIds.join(",") : "__empty",
    );
  }

  try {
    const { data, res } = await fetchFomoV2Funds(
      `${encodeURIComponent(id)}/performance`,
      query.toString() ? `?${query.toString()}` : "",
    );
    const roiPerformance = data?.roiPerformance || {};
    const dataByTab = roiPerformance.dataByTab || roiPerformance.byTab || {};

    if (!res.ok || data?.ok === false || data?.message) {
      return emptyResponse(data?.error || data?.message || "Failed to load performance");
    }

    return {
      ok: true,
      isSuccess: data?.isSuccess !== false,
      roiPerformance: {
        lines: Array.isArray(roiPerformance.lines) ? roiPerformance.lines : [],
        dataByTab: {
          ...emptyByTab(),
          ...dataByTab,
        },
        byTab: {
          ...emptyByTab(),
          ...(roiPerformance.byTab || dataByTab),
        },
        leftLabels: Array.isArray(roiPerformance.leftLabels)
          ? roiPerformance.leftLabels
          : Array.isArray(roiPerformance.labels)
            ? roiPerformance.labels
            : emptyResponse().roiPerformance.leftLabels,
        leftLabelsByTab: roiPerformance.leftLabelsByTab || emptyResponse().roiPerformance.leftLabelsByTab,
        labels: Array.isArray(roiPerformance.labels)
          ? roiPerformance.labels
          : Array.isArray(roiPerformance.leftLabels)
            ? roiPerformance.leftLabels
            : emptyResponse().roiPerformance.labels,
        selectedRounds: Array.isArray(roiPerformance.selectedRounds)
          ? roiPerformance.selectedRounds
          : [],
        meta: roiPerformance.meta || {},
      },
    };
  } catch {
    return emptyResponse("Failed to load performance");
  }
}

export async function fetchFundPerformanceSearch(
  id: string,
  search = "",
  limit = 20,
): Promise<{
  ok: boolean;
  isSuccess: boolean;
  items: FundPerformanceSearchItem[];
  projects: FundPerformanceSearchItem[];
  total: number;
  maxSelected: number;
  error?: string;
}> {
  if (!id || !isFomoV2FundsDetailEnabled()) {
    return {
      ok: false,
      isSuccess: false,
      items: [],
      projects: [],
      total: 0,
      maxSelected: 5,
    };
  }

  const query = new URLSearchParams({
    search,
    limit: String(limit),
  });

  try {
    const { data, res } = await fetchFomoV2Funds(
      `${encodeURIComponent(id)}/performance/search`,
      `?${query.toString()}`,
    );
    const items = Array.isArray(data?.items) ? data.items : [];

    return {
      ok: res.ok && data?.ok !== false && !data?.message,
      isSuccess: res.ok && data?.isSuccess !== false && data?.ok !== false && !data?.message,
      items,
      projects: items,
      total: Number(data?.total || items.length || 0),
      maxSelected: Number(data?.maxSelected || 5),
      error: data?.error || data?.message,
    };
  } catch {
    return {
      ok: false,
      isSuccess: false,
      items: [],
      projects: [],
      total: 0,
      maxSelected: 5,
      error: "Failed to search performance projects",
    };
  }
}

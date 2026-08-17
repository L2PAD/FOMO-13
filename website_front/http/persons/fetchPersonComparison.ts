import type {
  FundComparisonBestWorstRow,
  FundComparisonEntryAgeCategory,
  FundComparisonFund,
  FundComparisonLine,
  FundComparisonPoint,
  FundComparisonResponse,
  FundComparisonScatterItem,
  FundComparisonSearchItem,
  FundComparisonSearchScope,
  FundComparisonSection,
  FundComparisonTab,
  FundComparisonTableRow,
} from "../funds/fetchFundComparison";
import {
  fetchFomoV2Persons,
  isFomoV2PersonsDetailEnabled,
} from "./personsV2Api";

export type {
  FundComparisonBestWorstRow as PersonComparisonBestWorstRow,
  FundComparisonEntryAgeCategory as PersonComparisonEntryAgeCategory,
  FundComparisonFund as PersonComparisonPerson,
  FundComparisonLine as PersonComparisonLine,
  FundComparisonPoint as PersonComparisonPoint,
  FundComparisonResponse as PersonComparisonResponse,
  FundComparisonScatterItem as PersonComparisonScatterItem,
  FundComparisonSearchItem as PersonComparisonSearchItem,
  FundComparisonSearchScope as PersonComparisonSearchScope,
  FundComparisonSection as PersonComparisonSection,
  FundComparisonTab as PersonComparisonTab,
  FundComparisonTableRow as PersonComparisonTableRow,
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

export default async function fetchPersonComparison(
  id: string,
  params: {
    section?: FundComparisonSection;
    peerIds?: string[];
    peerLimit?: number;
  } = {},
): Promise<FundComparisonResponse> {
  if (!id || !isFomoV2PersonsDetailEnabled()) return emptyResponse();

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
    const { data, res } = await fetchFomoV2Persons(
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

export async function fetchPersonComparisonSearch(
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
  persons: FundComparisonSearchItem[];
  total: number;
  limit: number;
  maxSelected: number;
  error?: string;
}> {
  if (!id || !isFomoV2PersonsDetailEnabled()) {
    return {
      ok: false,
      isSuccess: false,
      scope: params.scope,
      items: [],
      persons: [],
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
    const { data, res } = await fetchFomoV2Persons(
      `${encodeURIComponent(id)}/comparison/search`,
      `?${query.toString()}`,
    );
    const items = Array.isArray(data?.items) ? data.items : [];

    return {
      ok: res.ok && data?.ok !== false && !data?.message,
      isSuccess: res.ok && data?.isSuccess !== false && data?.ok !== false && !data?.message,
      scope: data?.scope || params.scope,
      items,
      persons: items,
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
      persons: [],
      total: 0,
      limit: params.limit || 20,
      maxSelected: 5,
      error: "Failed to search comparison persons",
    };
  }
}

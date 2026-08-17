import fetchFundsAnalytics from "../funds/fetchFundsAnalytics";
import type { BackersAnalyticsResponse } from "../funds/fetchFundsAnalytics";
import { fetchFomoV2Backers, isFomoV2BackersEnabled } from "./backersApi";

export type {
  BackersAnalyticsChartItem,
  BackersAnalyticsCountryItem,
  BackersFundingDynamics,
  BackersFundingDynamicsPoint,
  BackersFundingDynamicsProject,
  BackersGlobalInvestmentMap,
  BackersGlobalInvestmentMapCategory,
  BackersGlobalInvestmentMapCountry,
  BackersGlobalInvestmentMapEntity,
  BackersIndustryAllocationByPeriod,
  BackersAnalyticsResponse,
} from "../funds/fetchFundsAnalytics";

const emptyAnalytics: BackersAnalyticsResponse = {
  summary: {
    totalBackers: 0,
    totalProjectsSupported: 0,
    averageRating: 0,
    averageFullness: 0,
    withSocialLinks: 0,
    withPortfolio: 0,
  },
  backersByType: [],
  topSectors: [],
  topSectorsByPeriod: {
    chart24h: [],
    chart7d: [],
    chart30d: [],
    chart90d: [],
    chart1y: [],
    chartAll: [],
  },
  backersByCountry: [],
  globalInvestmentMap: {
    metric: "totalKnownRaisedAmountUsd",
    countries: [],
    dataQuality: {},
  },
  fundingDynamics: {
    chart90d: [],
    chart1y: [],
    chartAll: [],
  },
};

export default async function fetchBackersFundsAnalytics(
  query = ""
): Promise<{ isSuccess: boolean; data: BackersAnalyticsResponse }> {
  if (!isFomoV2BackersEnabled()) {
    return fetchFundsAnalytics(query);
  }

  try {
    const { data, res } = await fetchFomoV2Backers("funds/analytics", query);

    return {
      isSuccess: res.ok && !data?.message,
      data: {
        ...emptyAnalytics,
        ...(data || {}),
        summary: {
          ...emptyAnalytics.summary,
          ...(data?.summary || {}),
        },
        fundingDynamics: {
          ...emptyAnalytics.fundingDynamics,
          ...(data?.fundingDynamics || {}),
        },
        topSectorsByPeriod: {
          ...emptyAnalytics.topSectorsByPeriod,
          ...(data?.topSectorsByPeriod || {}),
        },
        globalInvestmentMap: {
          ...emptyAnalytics.globalInvestmentMap,
          ...(data?.globalInvestmentMap || {}),
          dataQuality: {
            ...emptyAnalytics.globalInvestmentMap.dataQuality,
            ...(data?.globalInvestmentMap?.dataQuality || {}),
          },
        },
      },
    };
  } catch {
    return { isSuccess: false, data: emptyAnalytics };
  }
}

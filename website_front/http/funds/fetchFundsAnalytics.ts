import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";
import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

export type BackersAnalyticsChartItem = {
  label: string;
  value: number;
  projectsCount?: number;
  dealsCount?: number;
  backersCount?: number;
  topProjects?: Array<{
    name?: string;
    image?: string;
    logo?: string;
    amount?: number;
  }>;
};

export type BackersAnalyticsCountryItem = {
  country: string;
  countryCode?: string;
  value: number;
};

export type BackersGlobalInvestmentMapEntity = {
  id?: string;
  backerId?: string;
  name: string;
  slug?: string;
  logo?: string;
  image?: string;
  symbol?: string;
  category?: string;
  amount?: number;
  backersCount?: number;
  dealsCount?: number;
  rating?: number;
  projectsCount?: number;
  investAmount?: number;
};

export type BackersGlobalInvestmentMapCategory = {
  label: string;
  value: number;
  amount?: number;
  projectsCount?: number;
};

export type BackersGlobalInvestmentMapCountry = BackersAnalyticsCountryItem & {
  totalInvestAmount?: number;
  fundsCount?: number;
  projectsCount?: number;
  dealsCount?: number;
  sourceCountries?: string[];
  portfolioCoins?: BackersGlobalInvestmentMapEntity[];
  keyProjects?: BackersGlobalInvestmentMapEntity[];
  topProjects?: BackersGlobalInvestmentMapEntity[];
  topCategories?: BackersGlobalInvestmentMapCategory[];
  topInvestors?: BackersGlobalInvestmentMapEntity[];
  topCategory?: string;
  topCategoryCount?: number;
};

export type BackersGlobalInvestmentMap = {
  metric: string;
  amountScope?: string;
  countries: BackersGlobalInvestmentMapCountry[];
  dataQuality?: {
    totalFunds?: number;
    fundsWithKnownCountry?: number;
    fundsWithoutCountry?: number;
    countryCoveragePercent?: number;
    countriesCount?: number;
    totalInvestAmount?: number;
  };
  updatedAt?: string;
};

export type BackersFundingDynamicsProject = {
  name: string;
  amount: number;
  category?: string;
};

export type BackersFundingDynamicsPoint = {
  name: string;
  date: string;
  periodEnd?: string;
  totalInvestment: number;
  categories: string[];
  keyProjects: BackersFundingDynamicsProject[];
  investments0?: number;
  investments1?: number;
  investments2?: number;
  investments3?: number;
  investments4?: number;
  investments5?: number;
};

export type BackersFundingDynamics = {
  chart90d: BackersFundingDynamicsPoint[];
  chart1y: BackersFundingDynamicsPoint[];
  chartAll: BackersFundingDynamicsPoint[];
};

export type BackersIndustryAllocationByPeriod = {
  chart24h: BackersAnalyticsChartItem[];
  chart7d: BackersAnalyticsChartItem[];
  chart30d: BackersAnalyticsChartItem[];
  chart90d: BackersAnalyticsChartItem[];
  chart1y: BackersAnalyticsChartItem[];
  chartAll: BackersAnalyticsChartItem[];
};

export type BackersAnalyticsResponse = {
  summary: {
    totalBackers: number;
    totalProjectsSupported: number;
    averageRating: number;
    averageFullness: number;
    withSocialLinks: number;
    withPortfolio: number;
  };
  backersByType: BackersAnalyticsChartItem[];
  topSectors: BackersAnalyticsChartItem[];
  topSectorsByPeriod: BackersIndustryAllocationByPeriod;
  backersByCountry: BackersAnalyticsCountryItem[];
  globalInvestmentMap: BackersGlobalInvestmentMap;
  fundingDynamics: BackersFundingDynamics;
};

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

export default async function fetchFundsAnalytics(
  query = ""
): Promise<{ isSuccess: boolean; data: BackersAnalyticsResponse }> {
  if (isFomoV2FundsDetailEnabled()) {
    try {
      const { data, res } = await fetchFomoV2Funds("analytics", query);

      if (res.ok && data?.ok !== false && !data?.message) {
        return {
          isSuccess: true,
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
      }
    } catch (error) {
      console.log(error);
    }
  }

  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/funds/analytics${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();

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
  } catch (error) {
    console.log(error);
    return { isSuccess: false, data: emptyAnalytics };
  }
}

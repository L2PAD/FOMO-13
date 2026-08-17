import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface UserActivityStats {
  portfolioSnapshot: {
    totalInvestedUsd: number;
    numberOfDeals: number;
    averageInvestmentUsd: number;
    projectsSupported: number;
    lastInvestmentAt: string | null;
    averageRoiPercent: number | null;
  };
  statistics: {
    points: number;
    score: number;
    balance: number;
    partners: number;
    awards: number;
  };
  otcP2p: {
    ratingPercent: number;
    sells: number;
    buys: number;
    revenueUsd: number;
  };
}

export const EMPTY_USER_ACTIVITY_STATS: UserActivityStats = {
  portfolioSnapshot: {
    totalInvestedUsd: 0,
    numberOfDeals: 0,
    averageInvestmentUsd: 0,
    projectsSupported: 0,
    lastInvestmentAt: null,
    averageRoiPercent: null,
  },
  statistics: {
    points: 0,
    score: 0,
    balance: 0,
    partners: 0,
    awards: 0,
  },
  otcP2p: {
    ratingPercent: 0,
    sells: 0,
    buys: 0,
    revenueUsd: 0,
  },
};

const fetchUserActivityStats = async (): Promise<{
  isSuccess: boolean;
  data: UserActivityStats;
}> => {
  try {
    const accessToken = getAuthToken();

    if (!accessToken) {
      return { isSuccess: false, data: EMPTY_USER_ACTIVITY_STATS };
    }

    const res = await fetch(`${API}/user/activity-stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status >= 300) {
      return { isSuccess: false, data: EMPTY_USER_ACTIVITY_STATS };
    }

    const data = await res.json();

    return {
      isSuccess: true,
      data: {
        ...EMPTY_USER_ACTIVITY_STATS,
        ...data,
        portfolioSnapshot: {
          ...EMPTY_USER_ACTIVITY_STATS.portfolioSnapshot,
          ...(data?.portfolioSnapshot || {}),
        },
        statistics: {
          ...EMPTY_USER_ACTIVITY_STATS.statistics,
          ...(data?.statistics || {}),
        },
        otcP2p: {
          ...EMPTY_USER_ACTIVITY_STATS.otcP2p,
          ...(data?.otcP2p || {}),
        },
      },
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: EMPTY_USER_ACTIVITY_STATS };
  }
};

export default fetchUserActivityStats;

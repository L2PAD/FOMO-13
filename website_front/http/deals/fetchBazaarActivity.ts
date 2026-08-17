import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface BazaarActivity {
  rating: {
    percent: number;
    likes: number;
    dislikes: number;
    totalReviews: number;
  };
  sells: number;
  buys: number;
  profit: {
    usd: number;
    completedSellUsd: number;
    completedBuyUsd: number;
    excludedNonUsdDeals: number;
    formula: "completed_usd_sells_minus_completed_usd_buys";
  };
  deals: {
    total: number;
    completed: number;
    active: number;
    cancelled: number;
  };
  sections: {
    otc: number;
    p2p: number;
  };
}

export const EMPTY_BAZAAR_ACTIVITY: BazaarActivity = {
  rating: {
    percent: 0,
    likes: 0,
    dislikes: 0,
    totalReviews: 0,
  },
  sells: 0,
  buys: 0,
  profit: {
    usd: 0,
    completedSellUsd: 0,
    completedBuyUsd: 0,
    excludedNonUsdDeals: 0,
    formula: "completed_usd_sells_minus_completed_usd_buys",
  },
  deals: {
    total: 0,
    completed: 0,
    active: 0,
    cancelled: 0,
  },
  sections: {
    otc: 0,
    p2p: 0,
  },
};

const fetchBazaarActivity = async (): Promise<{
  isSuccess: boolean;
  data: BazaarActivity;
}> => {
  try {
    const accessToken = getAuthToken();

    if (!accessToken) {
      return { isSuccess: false, data: EMPTY_BAZAAR_ACTIVITY };
    }

    const res = await fetch(`${API}/deals/bazaar-activity`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status >= 300) {
      return { isSuccess: false, data: EMPTY_BAZAAR_ACTIVITY };
    }

    const data = await res.json();

    return {
      isSuccess: true,
      data: {
        ...EMPTY_BAZAAR_ACTIVITY,
        ...data,
        rating: {
          ...EMPTY_BAZAAR_ACTIVITY.rating,
          ...(data?.rating || {}),
        },
        profit: {
          ...EMPTY_BAZAAR_ACTIVITY.profit,
          ...(data?.profit || {}),
        },
        deals: {
          ...EMPTY_BAZAAR_ACTIVITY.deals,
          ...(data?.deals || {}),
        },
        sections: {
          ...EMPTY_BAZAAR_ACTIVITY.sections,
          ...(data?.sections || {}),
        },
      },
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, data: EMPTY_BAZAAR_ACTIVITY };
  }
};

export default fetchBazaarActivity;

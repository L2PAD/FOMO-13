import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export type FundingRoundFilterOption = {
  key: string;
  label: string;
  count?: number;
};

export default async (
  limit = 8
): Promise<{
  isSuccess: boolean;
  categories: FundingRoundFilterOption[];
  fundingTypes: FundingRoundFilterOption[];
}> => {
  try {
    const accessToken = getAuthToken();
    const params = new URLSearchParams();

    params.set("limit", String(limit));

    const res = await fetch(`${API}/fomo-v2/funding-feed/filters?${params.toString()}`, {
      method: "GET",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      categories: Array.isArray(data?.categories) ? data.categories : [],
      fundingTypes: Array.isArray(data?.fundingTypes) ? data.fundingTypes : [],
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      categories: [],
      fundingTypes: [],
    };
  }
};

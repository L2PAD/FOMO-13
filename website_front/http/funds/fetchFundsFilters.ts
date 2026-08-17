import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export type FundsFilterOption = {
  key: string;
  label: string;
  count?: number;
};

export type FundsFiltersResponse = {
  fundTypes: FundsFilterOption[];
  industryFocus: FundsFilterOption[];
};

const emptyFilters: FundsFiltersResponse = {
  fundTypes: [],
  industryFocus: [],
};

export default async function fetchFundsFilters(): Promise<FundsFiltersResponse> {
  try {
    const accessToken = getAuthToken();
    const res = await fetch(`${API}/funds/filters`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return emptyFilters;

    const data = await res.json();

    return {
      fundTypes: Array.isArray(data?.fundTypes) ? data.fundTypes : [],
      industryFocus: Array.isArray(data?.industryFocus) ? data.industryFocus : [],
    };
  } catch (error) {
    console.log(error);

    return emptyFilters;
  }
}

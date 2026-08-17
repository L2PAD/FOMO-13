import fetchFundsFilters from "../funds/fetchFundsFilters";
import type {
  FundsFilterOption,
  FundsFiltersResponse,
} from "../funds/fetchFundsFilters";
import { fetchFomoV2Backers, isFomoV2BackersEnabled } from "./backersApi";

export type { FundsFilterOption, FundsFiltersResponse };

const emptyFilters: FundsFiltersResponse = {
  fundTypes: [],
  industryFocus: [],
};

export default async function fetchBackersFundsFilters(): Promise<FundsFiltersResponse> {
  if (!isFomoV2BackersEnabled()) {
    return fetchFundsFilters();
  }

  try {
    const { data, res } = await fetchFomoV2Backers("funds/filters");

    if (!res.ok) return emptyFilters;

    return {
      fundTypes: Array.isArray(data?.fundTypes) ? data.fundTypes : [],
      industryFocus: Array.isArray(data?.industryFocus)
        ? data.industryFocus
        : [],
    };
  } catch {
    return emptyFilters;
  }
}

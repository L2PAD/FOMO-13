import fetchPersonsAnalytics from "../investors/fetchPersonsAnalytics";
import type {
  PersonsAnalyticsResponse,
} from "../investors/fetchPersonsAnalytics";
import { fetchFomoV2Backers, isFomoV2BackersEnabled } from "./backersApi";

export type {
  PersonsAnalyticsChartItem,
  PersonsAnalyticsCountryItem,
  PersonsAnalyticsResponse,
} from "../investors/fetchPersonsAnalytics";

const emptyAnalytics: PersonsAnalyticsResponse = {
  summary: {
    totalPersons: 0,
    totalProjectsSupported: 0,
    averageRating: 0,
    averageFullness: 0,
    withSocialLinks: 0,
    withPortfolio: 0,
  },
  personsBySpecialization: [],
  topSectors: [],
  personsByCountry: [],
  filterOptions: {
    sectors: [],
    specializations: [],
  },
};

export default async function fetchBackersPersonsAnalytics(
  query = ""
): Promise<{ isSuccess: boolean; data: PersonsAnalyticsResponse }> {
  if (!isFomoV2BackersEnabled()) {
    return fetchPersonsAnalytics(query);
  }

  try {
    const { data, res } = await fetchFomoV2Backers("persons/analytics", query);

    return {
      isSuccess: res.ok && !data?.message,
      data: {
        ...emptyAnalytics,
        ...(data || {}),
        summary: {
          ...emptyAnalytics.summary,
          ...(data?.summary || {}),
        },
        filterOptions: {
          ...emptyAnalytics.filterOptions,
          ...(data?.filterOptions || {}),
        },
      },
    };
  } catch {
    return { isSuccess: false, data: emptyAnalytics };
  }
}

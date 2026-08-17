import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export type PersonsAnalyticsChartItem = {
  label: string;
  value: number;
  topRoles?: string;
  keyRegions?: string;
  sectors?: string;
  topProjects?: string;
  growth?: string;
};

export type PersonsAnalyticsCountryItem = {
  country: string;
  countryCode?: string;
  value: number;
};

export type PersonsAnalyticsResponse = {
  summary: {
    totalPersons: number;
    totalProjectsSupported: number;
    averageRating: number;
    averageFullness: number;
    withSocialLinks: number;
    withPortfolio: number;
  };
  personsBySpecialization: PersonsAnalyticsChartItem[];
  topSectors: PersonsAnalyticsChartItem[];
  personsByCountry: PersonsAnalyticsCountryItem[];
  filterOptions?: {
    sectors?: string[];
    specializations?: string[];
  };
  dataQuality?: {
    knownCountries?: number;
    unknownCountries?: number;
    countryCoveragePercent?: number;
  };
};

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

export default async function fetchPersonsAnalytics(
  query = ""
): Promise<{ isSuccess: boolean; data: PersonsAnalyticsResponse }> {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/investors/persons/analytics${query}`, {
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
        filterOptions: {
          ...emptyAnalytics.filterOptions,
          ...(data?.filterOptions || {}),
        },
      },
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: emptyAnalytics };
  }
}

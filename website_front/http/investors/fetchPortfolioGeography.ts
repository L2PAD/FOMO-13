import { API } from "../../config/api";
import {
  PortfolioGeographyResponse,
} from "../../types/portfolioGeography";
import getAuthToken from "../getAuthToken";

export interface FetchPortfolioGeographyOptions {
  projectSlug?: string;
  region?: string;
  includeUnknown?: boolean;
  minCoInvestors?: number;
  selectedOnly?: boolean;
}

export default async (
  slug: string,
  options: FetchPortfolioGeographyOptions = {}
): Promise<{
  isSuccess: boolean;
  data: PortfolioGeographyResponse | null;
}> => {
  if (!slug) {
    return { isSuccess: false, data: null };
  }

  try {
    const accessToken: string | null = getAuthToken();
    const params = new URLSearchParams();

    if (options.projectSlug) params.set("projectSlug", options.projectSlug);
    if (options.region) params.set("region", options.region);
    if (options.selectedOnly) params.set("selectedOnly", "true");
    params.set("includeUnknown", String(options.includeUnknown ?? true));
    params.set("minCoInvestors", String(options.minCoInvestors ?? 1));

    const res = await fetch(
      `${API}/investors/${encodeURIComponent(slug)}/portfolio-geography?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await res.json();

    return {
      isSuccess: res.status < 300 && Boolean(data?.ok),
      data,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: null };
  }
};

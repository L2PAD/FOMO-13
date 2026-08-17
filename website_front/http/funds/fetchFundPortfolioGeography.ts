import {
  PortfolioGeographyResponse,
} from "../../types/portfolioGeography";
import fetchLegacyPortfolioGeography, {
  FetchPortfolioGeographyOptions,
} from "../investors/fetchPortfolioGeography";
import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

export default async function fetchFundPortfolioGeography(
  slug: string,
  options: FetchPortfolioGeographyOptions = {}
): Promise<{
  isSuccess: boolean;
  data: PortfolioGeographyResponse | null;
}> {
  if (!slug) {
    return { isSuccess: false, data: null };
  }

  if (isFomoV2FundsDetailEnabled()) {
    try {
      const params = new URLSearchParams();

      if (options.projectSlug) params.set("projectSlug", options.projectSlug);
      if (options.region) params.set("region", options.region);
      if (options.selectedOnly) params.set("selectedOnly", "true");
      params.set("includeUnknown", String(options.includeUnknown ?? true));
      params.set("minCoInvestors", String(options.minCoInvestors ?? 1));

      const { data, res } = await fetchFomoV2Funds(
        `${encodeURIComponent(slug)}/portfolio-geography`,
        `?${params.toString()}`
      );

      if (res.ok && data?.ok !== false && !data?.message) {
        return {
          isSuccess: true,
          data,
        };
      }
    } catch (error) {
      console.log(error);
    }
  }

  return fetchLegacyPortfolioGeography(slug, options);
}

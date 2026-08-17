import { API } from "../../config/api";
import {
  getInvestorRating,
  sortInvestorsByRating,
} from "../../helpers/investorRating";

export interface FetchProjectTopInvestorsOptions {
  source?: "legacy" | "fomo-v2";
  lookup?: string;
}

export default async function fetchProjectTopInvestors(
  projectIdOrSlug: string,
  limit: number | "all" = 100,
  options: FetchProjectTopInvestorsOptions = {}
): Promise<{ isSuccess: boolean; investors: Array<any>; total: number }> {
  if (!projectIdOrSlug) {
    return { isSuccess: false, investors: [], total: 0 };
  }

  try {
    const params = new URLSearchParams();
    if (limit === "all") {
      params.set("all", "true");
    } else {
      params.set("limit", String(limit));
    }
    if (options.lookup) {
      params.set("lookup", options.lookup);
    }

    const path =
      options.source === "fomo-v2"
        ? `${API}/fomo-v2/funding-feed/projects/${encodeURIComponent(
            projectIdOrSlug
          )}/investors?${params.toString()}`
        : `${API}/investors/project/${encodeURIComponent(
            projectIdOrSlug
          )}/top?${params.toString()}`;

    const res = await fetch(path, {
      method: "GET",
    });
    const data = await res.json();
    const investors: Array<any> = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.investors)
        ? data.investors
        : [];
    const normalizedInvestors = sortInvestorsByRating(
      investors.map((investor) => {
        const rating = getInvestorRating(investor);

        return {
          ...investor,
          rating,
          fomoScore: rating,
        };
      })
    );

    return {
      isSuccess:
        res.status < 300 && Boolean(data?.ok ?? data?.isSuccess ?? true),
      investors: normalizedInvestors,
      total: Number(
        data?.totalAvailable || data?.total || normalizedInvestors.length || 0
      ),
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, investors: [], total: 0 };
  }
}

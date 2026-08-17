import { API } from "../../config/api";
import { IcoComparisonPeer } from "../../types/icoComparison";

const logComparisonFetch = (
  label: string,
  startedAt: number,
  url: string,
  status?: number
) => {
  if (process.env.NEXT_PUBLIC_COMPARISON_PERF_LOGS !== "true") return;
  // Debug-only performance signal for Comparison tab request dedupe/timing.
  console.debug(
    `[comparison] ${label} ${Date.now() - startedAt}ms status=${status ?? "error"} url=${url}`
  );
};

export default async (
  slugOrId: string,
  options: {
    search?: string;
    metric?: string;
    limit?: number;
    excludeIds?: string[];
    readModel?: "v2" | string;
    lookup?: string;
  } = {}
): Promise<{
  isSuccess: boolean;
  projects: IcoComparisonPeer[];
  total: number;
}> => {
  try {
    const params = new URLSearchParams();

    if (options.search) {
      params.set("search", options.search);
    }

    if (options.metric) {
      params.set("metric", options.metric);
    }

    if (options.limit !== undefined) {
      params.set("limit", String(options.limit));
    }

    if (options.excludeIds?.length) {
      params.set("excludeIds", options.excludeIds.join(","));
    }

    if (options.lookup) {
      params.set("lookup", options.lookup);
    }

    const query = params.toString();
    const path =
      options.readModel === "v2"
        ? `/fomo-v2/ico-projects/${encodeURIComponent(slugOrId)}/comparison/search`
        : `/projects/${encodeURIComponent(slugOrId)}/ico-comparison/search`;
    const url = `${API}${path}${query ? `?${query}` : ""}`;
    const startedAt = Date.now();
    const res = await fetch(url, {
      method: "GET",
    });
    const data = await res.json();
    logComparisonFetch("ico-comparison-search", startedAt, url, res.status);

    return {
      isSuccess: res.status < 300,
      projects: Array.isArray(data?.projects) ? data.projects : [],
      total: Number.isFinite(Number(data?.total)) ? Number(data.total) : 0,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, projects: [], total: 0 };
  }
};

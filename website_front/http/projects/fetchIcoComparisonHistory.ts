import { API } from "../../config/api";
import {
  IcoComparisonHistoryRange,
  IcoComparisonHistoryResponse,
} from "../../types/icoComparison";

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
    range?: IcoComparisonHistoryRange;
    peerLimit?: number;
    includeIndustry?: boolean;
    projectIds?: string[];
    readModel?: "v2" | string;
    lookup?: string;
  } = {}
): Promise<{
  isSuccess: boolean;
  data: IcoComparisonHistoryResponse | null;
}> => {
  try {
    const params = new URLSearchParams();

    if (options.range) {
      params.set("range", options.range);
    }

    if (options.peerLimit !== undefined) {
      params.set("peerLimit", String(options.peerLimit));
    }

    if (options.includeIndustry !== undefined) {
      params.set("includeIndustry", String(options.includeIndustry));
    }

    if (options.projectIds?.length) {
      params.set("projectIds", options.projectIds.join(","));
    }

    if (options.lookup) {
      params.set("lookup", options.lookup);
    }

    const query = params.toString();
    const path =
      options.readModel === "v2"
        ? `/fomo-v2/ico-projects/${encodeURIComponent(slugOrId)}/comparison/history`
        : `/projects/${encodeURIComponent(slugOrId)}/ico-comparison/history`;
    const url = `${API}${path}${query ? `?${query}` : ""}`;
    const startedAt = Date.now();
    const res = await fetch(url, {
      method: "GET",
    });
    const data = await res.json();
    logComparisonFetch("ico-comparison-history", startedAt, url, res.status);

    return { isSuccess: res.status < 300, data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: null };
  }
};

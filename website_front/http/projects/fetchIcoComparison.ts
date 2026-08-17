import { API } from "../../config/api";
import { IcoComparisonResponse } from "../../types/icoComparison";

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
    peerLimit?: number;
    includePeers?: boolean;
    readModel?: "v2" | string;
    lookup?: string;
  } = {}
): Promise<{ isSuccess: boolean; data: IcoComparisonResponse | null }> => {
  try {
    const params = new URLSearchParams();

    if (options.peerLimit !== undefined) {
      params.set("peerLimit", String(options.peerLimit));
    }

    if (options.includePeers !== undefined) {
      params.set("includePeers", String(options.includePeers));
    }

    if (options.lookup) {
      params.set("lookup", options.lookup);
    }

    const query = params.toString();
    const path =
      options.readModel === "v2"
        ? `/fomo-v2/ico-projects/${encodeURIComponent(slugOrId)}/comparison`
        : `/projects/${encodeURIComponent(slugOrId)}/ico-comparison`;
    const url = `${API}${path}${query ? `?${query}` : ""}`;
    const startedAt = Date.now();
    const res = await fetch(url, {
      method: "GET",
    });
    const data = await res.json();
    logComparisonFetch("ico-comparison", startedAt, url, res.status);

    return { isSuccess: res.status < 300, data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: null };
  }
};

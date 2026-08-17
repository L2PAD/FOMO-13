import { API } from "../../config/api";
import { IChartPriceData } from "../../types/global_types";

type MarketProjectChartRange = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";

export default async function fetchMarketProjectChart({
  id,
  range = "30D",
  from,
  to,
}: {
  id: string;
  range?: MarketProjectChartRange | string;
  from?: Date | number | string;
  to?: Date | number | string;
}): Promise<{
  isSuccess: boolean;
  data: Array<IChartPriceData>;
  project?: any;
  meta?: any;
}> {
  if (!id) return { isSuccess: false, data: [] };

  try {
    const queryParams = new URLSearchParams({ range });
    if (from !== undefined && from !== null) {
      queryParams.set(
        "from",
        from instanceof Date ? from.toISOString() : String(from)
      );
    }
    if (to !== undefined && to !== null) {
      queryParams.set(
        "to",
        to instanceof Date ? to.toISOString() : String(to)
      );
    }
    const query = queryParams.toString();
    const response = await fetch(
      `${API}/fomo-v2/projects/${encodeURIComponent(id)}/chart?${query}`,
      { method: "GET" },
    );
    const payload = await response.json();

    return {
      isSuccess: response.ok,
      data: Array.isArray(payload?.points)
        ? payload.points
        : Array.isArray(payload?.history)
          ? payload.history
          : [],
      project: payload?.project,
      meta: payload?.meta,
    };
  } catch (error) {
    console.error("Error fetching FOMO v2 market chart data:", error);
    return { isSuccess: false, data: [] };
  }
}

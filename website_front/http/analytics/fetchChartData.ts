import { API } from "../../config/api";
import { IChartPriceData } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

interface PriceData {
  USD: number;
  BTC: number;
  ETH: number;
  SOL: number;
}

export default async function fetchChartData({
  ids,
  entityType = "project",
  chartType = "chart30d",
}: {
  ids: string;
  entityType?: string;
  chartType?: string;
}): Promise<{ isSuccess: boolean; data: Array<IChartPriceData> }> {
  try {
    const token = getAuthToken();

    const query = new URLSearchParams({
      ids,
      entityType,
      chartType,
    }).toString();

    const res = await fetch(`${API}/analytics/charts?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.ok,
      data: data[chartType] || [],
    };
  } catch (err) {
    console.error("Error fetching chart data:", err);
    return {
      isSuccess: false,
      data: [],
    };
  }
}

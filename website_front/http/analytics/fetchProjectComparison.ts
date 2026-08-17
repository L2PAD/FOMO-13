import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async function fetchProjectComparison({
  category,
  sortBy,
  limit = 50,
}: {
  category: string;
  sortBy?: any;
  limit?: number;
}): Promise<{ isSuccess: boolean; data: {fdvComparison:{tag:any,competitors:Array<IProject>}[],marketCapComparison:{tag:any,competitors:Array<IProject>}[]} }> {
  try {
    const token = getAuthToken();

    const query = new URLSearchParams({
      category,
      sortBy,
      limit: String(limit),
    }).toString();

    const res = await fetch(`${API}/analytics/comparison?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.ok,
      data,
    };
  } catch (err) {
    console.error("Error fetching comparison data:", err);
    return {
      isSuccess: false,
      data: {fdvComparison:[{tag:{},competitors:[]}],marketCapComparison:[{tag:{},competitors:[]}]},
    };
  }
}

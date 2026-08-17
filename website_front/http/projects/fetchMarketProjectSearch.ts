import { API } from "../../config/api";

export default async function fetchMarketProjectSearch(
  searchValue: string,
  limit = 25,
): Promise<{ isSuccess: boolean; assets: Array<any> }> {
  try {
    const query = new URLSearchParams({
      searchValue,
      limit: String(limit),
    }).toString();
    const response = await fetch(`${API}/fomo-v2/projects/market/search?${query}`, {
      method: "GET",
    });
    const payload = await response.json();

    return {
      isSuccess: response.ok,
      assets: Array.isArray(payload?.assets)
        ? payload.assets
        : Array.isArray(payload?.projects)
          ? payload.projects
          : [],
    };
  } catch (error) {
    console.error("Error searching FOMO v2 market projects:", error);
    return { isSuccess: false, assets: [] };
  }
}

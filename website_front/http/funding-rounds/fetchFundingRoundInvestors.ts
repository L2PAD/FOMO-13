import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (
  search: string
): Promise<{ isSuccess: boolean; investors: Array<any> }> => {
  try {
    const accessToken = getAuthToken();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    const res = await fetch(`${API}/fomo-v2/funding-feed/investors/search?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      investors: Array.isArray(data?.items) ? data.items : [],
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, investors: [] };
  }
};

import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  page: string
): Promise<{ success: boolean; watchlist: Array<any> }> => {
  try {
    const token = getAuthToken();

    if (!token) return { success: false, watchlist: [] };

    const res = await fetch(`${API}/watchlist/${page}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const watchlist = await res.json();

    return { success: !watchlist?.status, watchlist: watchlist };
  } catch (error) {
    console.log(error);

    return { success: false, watchlist: [] };
  }
};

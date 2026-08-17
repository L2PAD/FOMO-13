import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (
  page: string,
  projectId: string
): Promise<{ success: boolean; watchlist: any }> => {
  try {
    const token = getAuthToken();

    const res = await fetch(`${API}/watchlist/${page}/${projectId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const watchlist = await res.json();

    return { success: !watchlist?.status, watchlist };
  } catch (error) {
    console.log(error);

    return { success: false, watchlist: {} };
  }
};

import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export const isFomoV2BackersEnabled = () =>
  process.env.NEXT_PUBLIC_BACKERS_V2 !== "false";

export const fetchFomoV2Backers = async (path: string, query = "") => {
  const accessToken: string | null = getAuthToken();
  const normalizedQuery = query || "";
  const res = await fetch(`${API}/fomo-v2/backers/${path}${normalizedQuery}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await res.json();

  return { data, res };
};

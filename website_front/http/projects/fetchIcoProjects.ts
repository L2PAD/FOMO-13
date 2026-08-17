import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  query = ""
): Promise<{
  isSuccess: boolean;
  projects: Array<IProject>;
  total: number;
}> => {
  try {
    const accessToken = getAuthToken();
    const normalizedQuery = query
      ? `${query.startsWith("?") ? query : `?${query}`}`
      : "";

    const res = await fetch(`${API}/fomo-v2/ico-projects${normalizedQuery}`, {
      method: "GET",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });
    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      projects: Array.isArray(data?.projects) ? data.projects : [],
      total: Number(data?.total) || 0,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, projects: [], total: 0 };
  }
};

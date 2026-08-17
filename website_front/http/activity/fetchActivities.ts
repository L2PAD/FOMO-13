import { API } from "../../config/api";
import { ActivityTypes, IActivity } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  type: ActivityTypes,
  query?: string
): Promise<{
  isSuccess: boolean;
  activity: Array<IActivity>;
  totalCount: number;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    let path = `/activity/${type}`;

    if (query) path = path + query;

    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      activity: data.activities || [],
      totalCount: data.totalCount || 0,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, activity: [], totalCount: 0 };
  }
};

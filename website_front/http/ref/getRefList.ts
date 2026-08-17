import { API } from "../../config/api";
import { IDeal } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  type: "refLvlOne" | "refLvlTwo",
  query?: string
): Promise<{ isSuccess: boolean; refList: Array<IDeal>; total: number }> => {
  try {
    const accessToken: string | null = getAuthToken();

    let path: string = `${API}/ref/list/${type}`;

    if (query) path = `${path}${query}`;

    const res = await fetch(path, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: !data?.message,
      refList: data || [],
      total: data?.total || 0,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, refList: [], total: 0 };
  }
};

import { API } from "../../config/api";
import { IDeal } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  type: "buy" | "sell" | "all" | string,
  query: string,
  section?: "otc" | "p2p" | "allocation" | "promoted"
): Promise<{ isSuccess: boolean; deals: Array<IDeal>; total: number }> => {
  try {
    const accessToken: string | null = getAuthToken();

    let path: string = `${API}/deals/${section ? section : "otc"}/${type}`;

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
      deals: data?.deals || data?.members || data?.comments || [],
      total: data?.total || 0,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, deals: [], total: 0 };
  }
};

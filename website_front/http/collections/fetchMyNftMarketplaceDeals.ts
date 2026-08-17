import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

interface IParams {
  limit?: number;
  offset?: number;
}

export default async (
  params: IParams = {}
): Promise<{ isSuccess: boolean; deals: Array<any>; total: number }> => {
  try {
    const accessToken: string | null = getAuthToken();
    const query = new URLSearchParams();

    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));

    const queryString = query.toString();
    const res = await fetch(
      `${API}/collectionNft/my-deals${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      deals: data?.deals || [],
      total: Number(data?.total || 0),
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, deals: [], total: 0 };
  }
};

import { API } from "../../config/api";
import { IFlattenedTicker } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  query?: string
): Promise<{
  isSuccess: boolean;
  exchanges: Array<IFlattenedTicker>;
  total: number;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    let path = ``;

    if (query) path = path + query;

    const res = await fetch(`${API}/exchanges${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      exchanges: data?.items || [],
      total: data?.total,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, exchanges: [], total: 0 };
  }
};

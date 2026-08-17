import { API } from "../../config/api";
import { IGlobalAsset } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  type?: string,
  query?: string
): Promise<{ isSuccess: boolean; assets: Array<IGlobalAsset> }> => {
  try {
    const accessToken: string | null = getAuthToken();

    let path = type ? `/assets/${type}` : `/assets`;

    if (query) path = query;

    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, assets: data || [] };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, assets: [] };
  }
};

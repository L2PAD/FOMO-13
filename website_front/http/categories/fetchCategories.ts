import { API } from "../../config/api";
import { ICategory } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (): Promise<{
  isSuccess: boolean;
  categories: Array<ICategory>;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    if (!accessToken) return { isSuccess: false, categories: [] };

    const res = await fetch(`${API}/categories`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, categories: data || [] };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, categories: [] };
  }
};

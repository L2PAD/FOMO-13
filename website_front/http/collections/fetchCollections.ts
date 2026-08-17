import { API } from "../../config/api";
import { ICollection } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (): Promise<{
  isSuccess: boolean;
  collections: Array<ICollection>;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/collections`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, collections: data || [] };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, collections: [] };
  }
};

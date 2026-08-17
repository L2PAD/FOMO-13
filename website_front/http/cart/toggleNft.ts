import { API } from "../../config/api";
import { ICollection } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  nftId: string,
  method: "POST" | "DELETE"
): Promise<{ isSuccess: boolean; cart: any }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/cart/${nftId}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, cart: data || {} };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, cart: {} };
  }
};

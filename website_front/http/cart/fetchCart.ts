import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (): Promise<{ isSuccess: boolean; cart: any }> => {
  try {
    const accessToken: string | null = getAuthToken();

    if (!accessToken) return { isSuccess: false, cart: [] };

    const res = await fetch(`${API}/cart`, {
      method: "GET",
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

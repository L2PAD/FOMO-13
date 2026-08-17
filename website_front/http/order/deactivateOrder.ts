import { API } from "../../config/api";
import { IOrder } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  orderId: string
): Promise<{ isSuccess: boolean; order: IOrder | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/orders/deactivate/${orderId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, order: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, order: null };
  }
};

import { API } from "../../config/api";
import { IOrder } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  orderId: string,
  smartOrderId: number
): Promise<{ isSuccess: boolean; order: IOrder | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/orders/confirm/${orderId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ smartOrderId }),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, order: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, order: null };
  }
};

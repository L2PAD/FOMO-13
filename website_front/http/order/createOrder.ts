import { API } from "../../config/api";
import { ICreateOrder, INews } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  path: string,
  orderData: ICreateOrder
): Promise<{ isSuccess: boolean; order: INews | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, order: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, order: null };
  }
};

import { API } from "../../config/api";
import { ICreateDeal, IDeal } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  orderData: ICreateDeal,
  isOffer?: boolean,
  dealId?: string
): Promise<{ isSuccess: boolean; deal: IDeal | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const path: string = isOffer ? `/deals/offer/${dealId}` : `/deals`;

    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, deal: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, deal: null };
  }
};

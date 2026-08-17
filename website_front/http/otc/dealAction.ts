import { API } from "../../config/api";
import { ICreateDeal, IDeal } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

type actionType =
  | "start"
  | "close"
  | "block"
  | "reserve"
  | "mark-payment"
  | "return"
  | "feedback"
  | "pin"
  | "unpin"
  | "confirm/sell"
  | "reaction";

export default async (
  action: actionType,
  id: string,
  method?: "PUT" | "PATCH" | 'POST',
  body?: any
): Promise<{ isSuccess: boolean; deal: IDeal | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/deals/${action}/${id}`, {
      method: method || "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, deal: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, deal: null };
  }
};

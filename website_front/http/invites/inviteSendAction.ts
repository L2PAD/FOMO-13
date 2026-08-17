import { API } from "../../config/api";
import { IUpdateInvite } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  action: "reject" | "confirm",
  body: IUpdateInvite
): Promise<{ isSuccess: boolean; data: any }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/invites/${action}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, data: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: "" };
  }
};

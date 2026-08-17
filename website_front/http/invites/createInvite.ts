import { API } from "../../config/api";
import { ICreateInvite, IInvite } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  invite: ICreateInvite
): Promise<{ isSuccess: boolean; invites: Array<IInvite> }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/invites`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invite),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, invites: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, invites: [] };
  }
};

import { API } from "../../config/api";
import { IUpdateInvite } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  boardId: string,
  inviterId: string
): Promise<{ isSuccess: boolean; data: any }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/invites/exclude`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ boardId, inviterId }),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, data: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: "" };
  }
};

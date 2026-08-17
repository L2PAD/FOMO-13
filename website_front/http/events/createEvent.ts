import { API } from "../../config/api";
import { IEvent, IProject } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  event: IEvent
): Promise<{ isSuccess: boolean; event: IEvent | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/events/create/user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, event: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, event: null };
  }
};

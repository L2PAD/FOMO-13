import { API } from "../../config/api";
import { IEvent, IProject } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  isPrivate: boolean,
  page: string
): Promise<{ isSuccess: boolean; events: Array<IEvent> }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const path: string = isPrivate ? `private/${page}` : `${page}`;

    const res = await fetch(`${API}/events/${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: !data?.message, events: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, events: [] };
  }
};

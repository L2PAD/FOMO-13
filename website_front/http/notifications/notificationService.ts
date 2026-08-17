import { API } from "../../config/api";
import { INotification } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  path: string,
  method: "POST" | "DELETE"
): Promise<{ isSuccess: boolean; notification: INotification | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/${path}`, {
      method: method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, notification: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, notification: null };
  }
};

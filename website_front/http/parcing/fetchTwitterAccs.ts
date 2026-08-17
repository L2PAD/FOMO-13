import { API } from "../../config/api";
import { IParcingTwitterAcc } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  query?: string
): Promise<{ isSuccess: boolean; accs: Array<IParcingTwitterAcc> }> => {
  try {
    const token: string | null = getAuthToken();

    let path = "/socialparcing";

    if (query) path += query;

    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, accs: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, accs: [] };
  }
};

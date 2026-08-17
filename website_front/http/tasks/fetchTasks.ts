import { API } from "../../config/api";
import { ITask } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  path: string
): Promise<{ isSuccess: boolean; tasks: Array<ITask> }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/tasks/${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: !data?.message, tasks: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, tasks: [] };
  }
};

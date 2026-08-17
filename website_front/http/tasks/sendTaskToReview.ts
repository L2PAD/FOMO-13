import { API } from "../../config/api";
import { ITask } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (id: string): Promise<{ isSuccess: boolean }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/tasks/request/new/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return { isSuccess: res.status < 300 };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
};

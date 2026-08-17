import { API } from "../../config/api";
import { ITask } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (id: string): Promise<{ isSuccess: boolean }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/tasks/claim/${id}`, {
      method: "POST",
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

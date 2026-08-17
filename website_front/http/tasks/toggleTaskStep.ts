import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (
  taskId: string,
  stepId: string,
  done: boolean
): Promise<{ isSuccess: boolean; allRequiredDone?: boolean }> => {
  try {
    const accessToken = getAuthToken();
    const res = await fetch(`${API}/tasks/step/${taskId}/${stepId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ done }),
    });
    const data = await res.json().catch(() => ({}));
    return { isSuccess: res.status < 300, allRequiredDone: data?.allRequiredDone };
  } catch (error) {
    console.log(error);
    return { isSuccess: false };
  }
};

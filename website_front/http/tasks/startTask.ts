import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (
  taskId: string
): Promise<{ isSuccess: boolean; message?: string }> => {
  try {
    const accessToken = getAuthToken();
    const res = await fetch(`${API}/tasks/my/start/${taskId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json().catch(() => ({}));
    return { isSuccess: res.status < 300, message: data?.message };
  } catch (error) {
    console.log(error);
    return { isSuccess: false };
  }
};

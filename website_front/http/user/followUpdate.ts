import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (
  action: "follow" | "unfollow",
  id: string,
  sourceTopicId?: string
): Promise<any> => {
  try {
    const token = getAuthToken();

    const res = await fetch(`${API}/user/${action}/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sourceTopicId ? { sourceTopicId } : {}),
    });

    const userData = await res.json();

    return userData;
  } catch (error) {
    console.log(error);

    return false;
  }
};

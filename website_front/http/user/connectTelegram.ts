import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (telegramData: {
  username?: string;
  name?: string;
  telegramId: string;
}): Promise<any> => {
  try {
    const token = getAuthToken();

    const res = await fetch(`${API}/user/social/telegram/connect`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(telegramData),
    });

    const userData = await res.json();

    return userData;
  } catch (error) {
    console.log(error);

    return false;
  }
};

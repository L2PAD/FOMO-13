import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (badgeKey: string): Promise<any> => {
  try {
    const accessToken = getAuthToken();

    if (!accessToken) {
      return { success: false, message: "Unauthorized" };
    }

    const res = await fetch(`${API}/user/spaceport/rewards/${badgeKey}/claim`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return await res.json();
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

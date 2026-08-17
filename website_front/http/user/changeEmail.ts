import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (email: string): Promise<boolean> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/user/change/${email}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
};

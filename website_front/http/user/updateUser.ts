import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (data: any): Promise<any> => {
  try {
    const token = getAuthToken();

    const res = await fetch(`${API}/user/initial`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const userData = await res.json();

    return userData;
  } catch (error) {
    console.log(error);

    return false;
  }
};

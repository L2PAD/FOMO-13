import getAuthToken from "../getAuthToken";
import { API } from "../../config/api";

export default async (path: string, data: any): Promise<any> => {
  try {
    const token: string | null = getAuthToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const responce = await fetch(`${API}/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });

    return { success: responce.status < 300, data: "Project updated" };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};

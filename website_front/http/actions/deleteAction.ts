import getAuthToken from "../getAuthToken";
import { API } from "../../config/api";

export default async (id: string): Promise<any> => {
  try {
    const token: string | null = getAuthToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const responce = await fetch(`${API}/actions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    return { success: responce.status < 300, data: "Project updated" };
  } catch (error) {
    console.log(error);

    return { success: false, data: error };
  }
};

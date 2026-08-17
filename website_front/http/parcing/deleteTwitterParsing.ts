import getAuthToken from "../getAuthToken";
import { IReturnData } from "../../helpers/types";
import { API } from "../../config/api";

export default async function deleteTwitterPerson(
  id: string
): Promise<IReturnData> {
  try {
    const token = getAuthToken();
    if (!token) throw new Error("Not auth");

    const response = await fetch(`${API}/socialparcing/person/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const message = await response.json();
    return { success: true, data: message };
  } catch (error) {
    console.error(error);
    return { success: false, data: error };
  }
}

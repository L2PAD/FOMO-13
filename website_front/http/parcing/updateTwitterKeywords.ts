import getAuthToken from "../getAuthToken";
import { IReturnData } from "../../helpers/types";
import { API } from "../../config/api";

export interface UpdateTwitterKeywordsData {
  id: string;
  keywords: string;
}

export default async ({
  id,
  keywords,
}: UpdateTwitterKeywordsData): Promise<IReturnData> => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error("Not auth");

    const response = await fetch(`${API}/socialparcing/${id}/keywords`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
      credentials: "include",
    });

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, data: error };
  }
};

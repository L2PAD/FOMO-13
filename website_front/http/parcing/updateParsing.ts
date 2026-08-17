import getAuthToken from "../getAuthToken";
import { IReturnData } from "../../helpers/types";
import { API } from "../../config/api";
import { UpdateParsingAccount } from "../../components/layouts/projects/modals/CreateParsingModal";

export default async (data: UpdateParsingAccount): Promise<IReturnData> => {
  try {
    const token: string | null = getAuthToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const responce = await fetch(`${API}/socialparcing/user`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const message = await responce.json();

    return { success: true, data: message };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};

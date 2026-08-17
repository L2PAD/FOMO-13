import getAuthToken from "../getAuthToken";
import { API } from "../../config/api";

export interface IUpdateFundProjects {
  oldFunds: Array<string>;
  newFunds: Array<string>;
  newProjectIds: Array<string>;
  oldProjectIds: Array<string>;
}

export default async (
  path: string,
  data: IUpdateFundProjects
): Promise<any> => {
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

    return { success: true, data: "Project updated" };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};

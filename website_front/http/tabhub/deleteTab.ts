import getAuthToken from "../getAuthToken";
import { buildTabHubUrl } from "./tabhubApi";

export default async (id: string): Promise<any> => {
  try {
    const token: string | null = getAuthToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const response = await fetch(buildTabHubUrl(id), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    const data = await response.json();

    return {
      success: response.status < 300 && data?.success !== false,
      action: data?.action,
      data,
    };
  } catch (error) {
    console.log(error);

    return { success: false, data: error };
  }
};

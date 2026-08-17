import getAuthToken from "../getAuthToken";
import { buildTabHubActionPath, buildTabHubUrl } from "./tabhubApi";

export default async (id: string): Promise<any> => {
  try {
    const token: string | null = getAuthToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const response = await fetch(
      buildTabHubUrl(buildTabHubActionPath("pin", id)),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );
    const data = await response.json();

    return {
      success: response.status < 300 && data?.success !== false,
      data,
    };
  } catch (error) {
    console.log(error);

    return { success: false, data: error };
  }
};

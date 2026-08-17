import { ICryptoTab } from "../../components/layouts/projects/CryptoMarket/createTabContext";
import {
  buildTabHubActionPath,
  buildTabHubUrl,
  getTabHubAuthHeaders,
} from "./tabhubApi";

export default async (
  id: string
): Promise<{ isSuccess: boolean; tab: ICryptoTab | null; isSaved?: boolean }> => {
  try {
    const res = await fetch(buildTabHubUrl(buildTabHubActionPath("save", id)), {
      method: "POST",
      headers: getTabHubAuthHeaders("json"),
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300 && data?.success !== false,
      tab: data?.tab || data,
      isSaved: data?.isSaved,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, tab: null };
  }
};

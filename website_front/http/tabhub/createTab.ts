import { ICryptoTab } from "../../components/layouts/projects/CryptoMarket/createTabContext";
import { buildTabHubUrl, getTabHubAuthHeaders } from "./tabhubApi";

export default async (
  tab: ICryptoTab
): Promise<{ isSuccess: boolean; tab: ICryptoTab | null }> => {
  try {
    const res = await fetch(buildTabHubUrl(), {
      method: "POST",
      headers: getTabHubAuthHeaders("json"),
      body: JSON.stringify(tab),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, tab: data?.tab || data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, tab: null };
  }
};

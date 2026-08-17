import { ICryptoTab } from "../../components/layouts/projects/CryptoMarket/createTabContext";
import { ICustomTabs } from "../../staticContent/tabs";
import { buildTabHubUrl, getTabHubAuthHeaders } from "./tabhubApi";

export default async (
  id: string,
  tabData: { tabs: Array<ICustomTabs> }
): Promise<{ isSuccess: boolean; tab: ICryptoTab | null }> => {
  try {
    const res = await fetch(buildTabHubUrl(id), {
      method: "PUT",
      headers: getTabHubAuthHeaders("json"),
      body: JSON.stringify(tabData),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, tab: data?.tab || data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, tab: null };
  }
};

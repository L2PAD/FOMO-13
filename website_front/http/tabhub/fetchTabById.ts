import { ICryptoTab } from "../../components/layouts/projects/CryptoMarket/createTabContext";
import { buildTabHubUrl, getTabHubAuthHeaders } from "./tabhubApi";

export default async (
  query?: string
): Promise<{
  isSuccess: boolean;
  tabData: ICryptoTab | null;
  total: number;
  projects: Array<any>;
  projection: any;
}> => {
  try {
    let path = query;

    const res = await fetch(buildTabHubUrl(path), {
      method: "GET",
      headers: getTabHubAuthHeaders(),
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      tabData: data.tabData,
      total: data.total,
      projects: data.projects,
      projection: data.projection,
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      tabData: null,
      projects: [],
      total: 0,
      projection: {},
    };
  }
};

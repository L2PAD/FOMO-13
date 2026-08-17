import { ICryptoTab } from "../../components/layouts/projects/CryptoMarket/createTabContext";
import { buildTabHubUrl, getTabHubAuthHeaders } from "./tabhubApi";

export default async (
  query?: string
): Promise<{
  isSuccess: boolean;
  items: Array<ICryptoTab>;
  tabs: Array<ICryptoTab>;
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    let path = query;

    const res = await fetch(buildTabHubUrl(path), {
      method: "GET",
      headers: getTabHubAuthHeaders(),
    });

    const data = await res.json();
    const items = data?.items || data?.tabs || [];

    return {
      isSuccess: res.status < 300,
      items,
      tabs: items,
      total: data?.total || data?.totalCount || 0,
      page: data?.page || 1,
      limit: data?.limit || 10,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, items: [], tabs: [], total: 0, page: 1, limit: 10 };
  }
};

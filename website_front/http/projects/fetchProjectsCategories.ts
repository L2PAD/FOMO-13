import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import getAuthToken from "../getAuthToken";
import { parseProjectReadQuery, withQuery } from "./projectReadQuery";

export interface ICryptoMarketCategories {
  recentlyAdded: Array<IProject>;
  topGainers: Array<IProject>;
  trending: Array<IProject>;
  accumulation: Array<IProject>;
  hotProjects: Array<IProject>;
}

export default async (type: string): Promise<{
  isSuccess: boolean;
  recentlyAdded: Array<IProject>;
  topGainers: Array<IProject>;
  trending: Array<IProject>;
  accumulation: Array<IProject>;
  hotProjects: Array<IProject>;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    const [, query = ""] = type.split("?", 2);
    const { params } = parseProjectReadQuery(query);
    const path = withQuery("/fomo-v2/projects/categories", params);

    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, ...data };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      recentlyAdded: [],
      topGainers: [],
      trending: [],
      accumulation: [],
      hotProjects: [],
    };
  }
};

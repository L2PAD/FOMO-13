import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import getAccessToken from "../getAuthToken";
import { parseProjectReadQuery, withQuery } from "./projectReadQuery";

export default async (
  id: string,
  query = ""
): Promise<{ isSuccess: boolean; project: IProject | any }> => {
  try {
    const { isV2, params } = parseProjectReadQuery(query);
    const path = isV2
      ? `/fomo-v2/projects/${encodeURIComponent(id)}/detail`
      : `/projects/data/${encodeURIComponent(id)}`;
    const accessToken = getAccessToken();
    const res = await fetch(`${API}${withQuery(path, params)}`, {
      method: "GET",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, project: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, project: {} };
  }
};

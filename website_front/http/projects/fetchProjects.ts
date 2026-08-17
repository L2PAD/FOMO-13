import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import getAuthToken from "../getAuthToken";
import { parseProjectReadQuery, withQuery } from "./projectReadQuery";

export interface FetchProjectsOptions {
  source?: "community" | "fomo-v2";
}

const buildV2ProjectsPath = (
  type: string,
  status?: string,
  sortValue?: any,
  query?: string,
  options: FetchProjectsOptions = {}
): string | null => {
  const [typePath, embeddedQuery = ""] = type.split("?", 2);
  const embedded = parseProjectReadQuery(embeddedQuery);
  const supplied = parseProjectReadQuery(query || "");

  if (
    options.source !== "fomo-v2" &&
    !embedded.isV2 &&
    !supplied.isV2
  ) {
    return null;
  }

  const params = new URLSearchParams(embedded.params);
  supplied.params.forEach((value, key) => params.append(key, value));

  if (status && !params.has("status")) params.set("status", status);
  if (sortValue && !params.has("sort")) params.set("sort", String(sortValue));

  const normalizedType = typePath.replace(/^\/+|\/+$/g, "");
  const path = normalizedType === "market"
    ? "/fomo-v2/projects/market"
    : normalizedType.startsWith("category/")
      ? `/fomo-v2/projects/category/${encodeURIComponent(
          normalizedType.slice("category/".length)
        )}`
      : null;

  return path ? withQuery(path, params) : null;
};

export default async (
  type: string,
  status?: string,
  sortValue?: any,
  query?: string,
  options: FetchProjectsOptions = {}
): Promise<{
  isSuccess: boolean;
  projects: Array<IProject>;
  total: number;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    let path = buildV2ProjectsPath(type, status, sortValue, query, options);

    if (!path) {
      path = `/projects/${type}`;

      if (status) path = path + `?status=${status}`;
      if (sortValue) path = path + `&sort=${sortValue}`;
      if (query) path = path + query;
    }

    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      projects: data?.projects || [],
      total: data?.total,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, projects: [], total: 0 };
  }
};

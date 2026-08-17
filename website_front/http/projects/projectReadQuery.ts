export interface ProjectReadQuery {
  isV2: boolean;
  params: URLSearchParams;
}

export const parseProjectReadQuery = (query = ""): ProjectReadQuery => {
  const params = new URLSearchParams(String(query).replace(/^\?/, ""));
  const isV2 =
    params.get("readModel") === "v2" || params.has("projectType");

  params.delete("readModel");

  return { isV2, params };
};

export const withQuery = (
  path: string,
  params: URLSearchParams
): string => {
  const query = params.toString();

  return query ? `${path}?${query}` : path;
};

type RouteQueryValue = string | string[] | undefined;

const getQueryValue = (value: RouteQueryValue): string => {
  if (Array.isArray(value)) return value[0] || "";

  return value || "";
};

const normalizeRouteValue = (value: RouteQueryValue): string =>
  getQueryValue(value).trim().toLowerCase();

export const shouldHideTopEditPageAction = (
  pathname: string,
  query: Partial<Record<string, RouteQueryValue>>
): boolean => {
  const normalizedPathname = pathname.toLowerCase();

  if (normalizedPathname === "/crypto/persons/[id]") {
    return true;
  }

  if (normalizedPathname === "/crypto/funds/[id]") {
    return normalizeRouteValue(query.id) === "a16z-andreessen-horowitz";
  }

  if (normalizedPathname === "/echo/[slug]") {
    return true;
  }

  return false;
};

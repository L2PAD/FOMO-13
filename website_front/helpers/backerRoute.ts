export const getBackerRouteId = (item: any): string => {
  if (!item) return "";

  const rawId = item?._id;
  const objectId =
    rawId && typeof rawId === "object" && rawId.$oid ? rawId.$oid : rawId;

  return String(
    item.routeId ||
      item.slug ||
      item.id ||
      item.backerId ||
      item.canonicalBackerId ||
      objectId ||
      ""
  ).trim();
};

export const getBackerHref = (
  item: any,
  type: "fund" | "person"
): string => {
  const routeId = getBackerRouteId(item);
  if (!routeId) return "#";

  return `/crypto/${type === "person" ? "persons" : "funds"}/${encodeURIComponent(routeId)}`;
};

export default getBackerRouteId;

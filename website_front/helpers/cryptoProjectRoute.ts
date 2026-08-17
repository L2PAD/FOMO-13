export type CryptoProjectLinkType = "market" | "project";

type ProjectLinkLike = {
  projectId?: any;
  projectType?: any;
  id?: any;
  _id?: any;
};

const stringifyId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value.$oid) return String(value.$oid);
  if (value._id) return stringifyId(value._id);
  if (value.id) return stringifyId(value.id);
  return "";
};

const normalizeProjectType = (value: any): CryptoProjectLinkType | null => {
  const projectType = String(value || "").trim().toLowerCase();
  if (projectType === "market" || projectType === "project") return projectType;
  return null;
};

const buildProjectRoute = (projectType: CryptoProjectLinkType, projectId: string): string =>
  projectType === "market"
    ? `/market/${encodeURIComponent(projectId)}`
    : `/echo/${encodeURIComponent(projectId)}`;

const getLinkProjectId = (link: ProjectLinkLike): string =>
  stringifyId(link?.projectId || link?._id || link?.id);

export const resolveCryptoEntityProjectRoute = (item: any): string => {
  const links: ProjectLinkLike[] = Array.isArray(item?.projectLinks) ? item.projectLinks : [];
  const marketLink = links.find(
    (link) => normalizeProjectType(link?.projectType) === "market" && getLinkProjectId(link)
  );

  if (marketLink) {
    return buildProjectRoute("market", getLinkProjectId(marketLink));
  }

  const projectLink = links.find(
    (link) => normalizeProjectType(link?.projectType) === "project" && getLinkProjectId(link)
  );

  if (projectLink) {
    return buildProjectRoute("project", getLinkProjectId(projectLink));
  }

  const explicitMarketId = stringifyId(item?.marketProjectId || item?.marketProject);
  if (explicitMarketId) return buildProjectRoute("market", explicitMarketId);

  const explicitProjectId = stringifyId(item?.projectProjectId || item?.icoProjectId || item?.projectProject);
  if (explicitProjectId) return buildProjectRoute("project", explicitProjectId);

  const projectId = stringifyId(item?.projectId || item?.project);
  const projectType = normalizeProjectType(
    item?.projectType || item?.projectId?.projectType || item?.project?.projectType
  );

  if (!projectId) return "";

  return buildProjectRoute(projectType || "project", projectId);
};

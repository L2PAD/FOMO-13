import { fetchFomoV2Backers, isFomoV2BackersEnabled } from "./backersApi";

export interface BackerProjectItem {
  _id?: string;
  id?: string;
  canonicalProjectId?: string;
  marketAssetId?: string;
  name?: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  image?: string;
  category?: string;
  roundTypes?: string[];
  roundsCount?: number;
  leadRoundsCount?: number;
  isLead?: boolean;
  totalKnownRaisedAmountUsd?: number;
  firstRoundDate?: string;
  lastRoundDate?: string;
  hasMarketData?: boolean;
  coingeckoId?: string;
  href?: string;
  projectLinks?: Array<{ projectType: "market" | "project"; projectId: string }>;
}

export interface BackerProjectsResponse {
  isSuccess: boolean;
  projects: BackerProjectItem[];
  items: BackerProjectItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  error?: string;
}

interface FetchBackerProjectsParams {
  offset?: number;
  limit?: number;
  search?: string;
}

const emptyResponse: BackerProjectsResponse = {
  isSuccess: false,
  projects: [],
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false,
};

export default async function fetchBackerProjects(
  backerId: string,
  params: FetchBackerProjectsParams = {}
): Promise<BackerProjectsResponse> {
  if (!isFomoV2BackersEnabled() || !backerId) return emptyResponse;

  const offset = Math.max(Number(params.offset) || 0, 0);
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);
  const search = String(params.search || "").trim();
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });

  if (search) query.set("search", search);

  try {
    const { data, res } = await fetchFomoV2Backers(
      `funds/${encodeURIComponent(backerId)}/projects`,
      `?${query.toString()}`
    );
    const projects = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.projects)
        ? data.projects
        : [];
    const total = Number(data?.total || 0);

    return {
      isSuccess: res.ok && data?.ok !== false && !data?.message,
      projects,
      items: projects,
      total,
      limit: Number(data?.limit || limit),
      offset: Number(data?.offset || offset),
      hasMore:
        typeof data?.hasMore === "boolean"
          ? data.hasMore
          : offset + projects.length < total,
      error: data?.error || data?.message,
    };
  } catch {
    return {
      ...emptyResponse,
      limit,
      offset,
    };
  }
}

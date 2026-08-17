import { API } from "../../config/api";
import {
  LaunchpadPlacement,
  LaunchpadPlacementSurface,
  LaunchpadPlacementsResponse,
} from "../../types/launchpadPlacements";

export interface FetchLaunchpadPlacementsParams {
  surface: LaunchpadPlacementSurface;
  limit?: number;
  offset?: number;
}

const normalizePlacement = (value: any): LaunchpadPlacement => ({
  ...value,
  id: String(value?.id || value?._id || ""),
  launchpadPoolId: String(
    value?.launchpadPoolId || value?.pool?.id || value?.pool?._id || ""
  ),
  surface: value?.surface as LaunchpadPlacementSurface,
  enabled: value?.enabled === true,
  featured: value?.featured === true,
  ad: value?.ad === true,
  sortOrder: Number(value?.sortOrder || 0),
  banner: value?.banner || {},
  pool: {
    ...(value?.pool || {}),
    id: String(value?.pool?.id || value?.pool?._id || ""),
  },
  canonicalProject: {
    ...(value?.canonicalProject || {}),
    id: String(value?.canonicalProject?.id || value?.canonicalProject?._id || ""),
    name: String(value?.canonicalProject?.name || "Untitled project"),
  },
});

export const fetchLaunchpadPlacements = async ({
  surface,
  limit = 30,
  offset = 0,
}: FetchLaunchpadPlacementsParams): Promise<LaunchpadPlacementsResponse> => {
  const search = new URLSearchParams({
    surface,
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(
    `${API}/fomo-v2/launchpad/placements?${search.toString()}`,
    { credentials: "include" }
  );

  if (!response.ok) {
    let message = `Failed to load launchpad placements (${response.status})`;
    try {
      const errorBody = await response.json();
      message = Array.isArray(errorBody?.message)
        ? errorBody.message.join(", ")
        : errorBody?.message || errorBody?.error || message;
    } catch {
      // The status code remains useful when the response has no JSON body.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  const body = payload?.data ?? payload;
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  const items = rawItems
    .map(normalizePlacement)
    .filter(
      (placement: LaunchpadPlacement) =>
        placement.enabled &&
        placement.surface === surface &&
        Boolean(placement.id) &&
        Boolean(placement.launchpadPoolId)
    );

  return {
    items,
    total: Number(body?.total ?? items.length),
    limit: Number(body?.limit ?? limit),
    offset: Number(body?.offset ?? offset),
  };
};

export default fetchLaunchpadPlacements;

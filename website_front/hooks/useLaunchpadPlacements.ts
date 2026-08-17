import { useQuery } from "react-query";
import fetchLaunchpadPlacements from "../http/launchpad/fetchLaunchpadPlacements";
import { LaunchpadPlacementSurface } from "../types/launchpadPlacements";

interface UseLaunchpadPlacementsOptions {
  surface: LaunchpadPlacementSurface;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

const useLaunchpadPlacements = ({
  surface,
  limit = 30,
  offset = 0,
  enabled = true,
}: UseLaunchpadPlacementsOptions) =>
  useQuery(
    ["fomo-v2-launchpad-placements", surface, limit, offset],
    () => fetchLaunchpadPlacements({ surface, limit, offset }),
    {
      enabled,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    }
  );

export default useLaunchpadPlacements;

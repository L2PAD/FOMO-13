import { useQuery } from "react-query";
import { getPromotedCryptoActivities } from "../../../../http/cryptoActivities";

const DEFAULT_PROMOTED_ACTIVITIES_LIMIT = 10;

const usePromotedActivities = (
  options: { enabled?: boolean; limit?: number } = {}
) => {
  const limit = options.limit || DEFAULT_PROMOTED_ACTIVITIES_LIMIT;

  return useQuery(
    ["earlyland-promoted-activities", limit],
    () => getPromotedCryptoActivities(limit),
    {
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      enabled: options.enabled ?? true,
    }
  );
};

export default usePromotedActivities;

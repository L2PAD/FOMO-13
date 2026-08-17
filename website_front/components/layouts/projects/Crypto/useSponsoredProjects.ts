import { useQuery } from "react-query";
import fetchProjects from "../../../../http/projects/fetchProjects";

const DEFAULT_SPONSORED_PROJECTS_LIMIT = 30;

const useSponsoredProjects = (
  options: { enabled?: boolean; limit?: number } = {}
) => {
  const limit = options.limit || DEFAULT_SPONSORED_PROJECTS_LIMIT;

  return useQuery(
    ["projects-spotlight-v2-market", limit],
    () =>
      fetchProjects(
        "market",
        undefined,
        "",
        `?offset=0&limit=${limit}&sortKey=rank&sortNumberValue=1&additionalStatus=sponsored`,
        { source: "fomo-v2" }
      ),
    {
      refetchOnWindowFocus: false,
      enabled: options.enabled ?? true,
    }
  );
};

export default useSponsoredProjects;

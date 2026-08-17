import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import getAuthToken from "../getWalletToken";

const SEARCH_LIMIT = 3;

export interface IEntityResult<T> {
  items: T[];
  total: number;
  limit: number;
}

export interface ISearchMetaTab {
  name: string;
  key: string;
  total: number;
}

export interface ISearchMeta {
  query: string;
  totalAll: number;
  tabs: ISearchMetaTab[];
}

export interface ISearchResults {
  projects: IEntityResult<IProject>;
  persons: IEntityResult<IProject>;
  funds: IEntityResult<IProject>;
  news: IEntityResult<any>;
  deals: IEntityResult<any>;
  meta: ISearchMeta;
}

const createEntityResult = <T>(
  items: T[] = [],
  total = items.length
): IEntityResult<T> => ({
  items,
  total,
  limit: SEARCH_LIMIT,
});

const readJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const fetchLegacySearch = async (
  value: string,
  accessToken: string | null
): Promise<{ isSuccess: boolean; results: ISearchResults | null }> => {
  const res = await fetch(`${API}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: value }),
  });

  const data = await readJson(res);

  return {
    isSuccess: res.status < 300,
    results: data,
  };
};

const fetchV2Projects = async (
  value: string
): Promise<IEntityResult<IProject>> => {
  const query = new URLSearchParams({
    searchValue: value,
    limit: String(SEARCH_LIMIT),
  }).toString();
  const res = await fetch(`${API}/fomo-v2/projects/market/search?${query}`, {
    method: "GET",
  });
  const data = await readJson(res);
  const items = Array.isArray(data?.assets)
    ? data.assets
    : Array.isArray(data?.projects)
      ? data.projects
      : [];

  return createEntityResult(items, Number(data?.total || items.length));
};

const fetchV2Backers = async (
  type: "funds" | "persons",
  value: string,
  accessToken: string | null
): Promise<IEntityResult<IProject>> => {
  const query = new URLSearchParams({
    name: value,
    searchValue: value,
    limit: String(SEARCH_LIMIT),
    offset: "0",
  }).toString();
  const res = await fetch(`${API}/fomo-v2/backers/${type}?${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await readJson(res);
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.[type])
      ? data[type]
      : [];

  return createEntityResult(
    items,
    Number(data?.total ?? data?.totalCount ?? items.length)
  );
};

const buildResults = (
  query: string,
  projects: IEntityResult<IProject>,
  funds: IEntityResult<IProject>,
  persons: IEntityResult<IProject>,
  deals: IEntityResult<any>
): ISearchResults => {
  const totalAll =
    projects.total + funds.total + persons.total + deals.total;

  return {
    projects,
    funds,
    persons,
    news: createEntityResult([]),
    deals,
    meta: {
      query,
      totalAll,
      tabs: [
        {
          name: "All",
          key: "all",
          total: totalAll,
        },
        {
          name: "Assets",
          key: "projects",
          total: projects.total,
        },
        {
          name: "Funds",
          key: "funds",
          total: funds.total,
        },
        {
          name: "Persons",
          key: "persons",
          total: persons.total,
        },
        {
          name: "Deals",
          key: "deals",
          total: deals.total,
        },
      ],
    },
  };
};

export default async (
  value: string
): Promise<{ isSuccess: boolean; results: ISearchResults | null }> => {
  try {
    const accessToken: string | null = getAuthToken();
    const query = value.trim();

    if (!query) {
      return {
        isSuccess: true,
        results: buildResults(
          query,
          createEntityResult([]),
          createEntityResult([]),
          createEntityResult([]),
          createEntityResult([])
        ),
      };
    }

    const [projectsResult, fundsResult, personsResult, legacyResult] =
      await Promise.allSettled([
        fetchV2Projects(query),
        fetchV2Backers("funds", query, accessToken),
        fetchV2Backers("persons", query, accessToken),
        fetchLegacySearch(query, accessToken),
      ]);

    const projects =
      projectsResult.status === "fulfilled"
        ? projectsResult.value
        : createEntityResult<IProject>([]);
    const funds =
      fundsResult.status === "fulfilled"
        ? fundsResult.value
        : createEntityResult<IProject>([]);
    const persons =
      personsResult.status === "fulfilled"
        ? personsResult.value
        : createEntityResult<IProject>([]);
    const legacySearch =
      legacyResult.status === "fulfilled" ? legacyResult.value : null;
    const deals =
      legacySearch?.results?.deals || createEntityResult<any>([]);

    return {
      isSuccess:
        projectsResult.status === "fulfilled" ||
        fundsResult.status === "fulfilled" ||
        personsResult.status === "fulfilled" ||
        Boolean(legacySearch?.isSuccess),
      results: buildResults(query, projects, funds, persons, deals),
    };
  } catch {
    return {
      isSuccess: false,
      results: null,
    };
  }
};

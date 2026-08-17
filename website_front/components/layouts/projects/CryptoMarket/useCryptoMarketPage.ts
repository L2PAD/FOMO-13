import { useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import fetchItems from "../../../../http/fetchItems";
import { getCryptoActivities } from "../../../../http/cryptoActivities";
import fetchProjects from "../../../../http/projects/fetchProjects";
import fetchProjectsCategories from "../../../../http/projects/fetchProjectsCategories";
import fetchHomeTabs from "../../../../http/tabhub/fetchHomeTabs";
import fetchTabs from "../../../../http/tabhub/fetchTabs";
import useComments from "../../../../hooks/useComments";
import { AuthContext } from "../../../global/Layout";

export const limit = 100;
const billion = 1000000000;
const HIGHLIGHTS_STORAGE_KEY = "crypto-market-highlights";

interface FilterItem {
  isActive: boolean;
  key: string;
  label: string;
}

type SortValue = { name: string; value: 1 | -1 };

const getActiveFilterKeys = (items: FilterItem[] = []): string[] => {
  const activeItems = items.filter((item) => item.isActive);

  if (
    !activeItems.length ||
    activeItems.some((item) => item.key === "all") ||
    activeItems.length === items.length
  ) {
    return [];
  }

  return activeItems.map((item) => item.key).filter(Boolean);
};

export const buildQueryString = (
  page: number,
  sortValue: { name: string; value: any } | undefined,
  searchValue: string,
  status?: any,
  customLimit?: number
): string => {
  const params: any = {
    limit: customLimit || limit,
    offset: (page - 1) * (customLimit || limit),
  };

  if (searchValue) {
    params.searchValue = searchValue;
  }

  if (sortValue?.name) {
    params.sortKey = sortValue.name;
    params.sortNumberValue = sortValue.value;
  }

  if (status) params.status = status;

  const queryString = new URLSearchParams(params).toString();
  return `?${queryString}`;
};

export const buildFilterSummary = (filters: any | undefined): string => {
  if (!filters) return "";

  const queryParts: string[] = [];

  for (const key in filters) {
    const value = filters[key];

    if (!Array.isArray(value)) continue;

    if (key === "investors") {
      queryParts.push(`${key}=${value.map((item: any) => item._id)}`);
      continue;
    }

    if (
      (key === "tradeLaunchDate" || key === "tradeLaunchDate_checkboxes") &&
      typeof value[0] === "number"
    ) {
      const activeRange = value as number[];
      if (activeRange.length === 2 && activeRange[1] !== 0) {
        queryParts.push(
          key === "tradeLaunchDate_checkboxes"
            ? `tradeLaunchDate=${activeRange[0]}-${activeRange[1]}`
            : `${key}=${activeRange[0]}-${activeRange[1]}`
        );
      }
      continue;
    }

    if (
      (key === "fdv" || key === "fdv_checkboxes") &&
      typeof value[0] === "number"
    ) {
      const activeRange = value as number[];
      if (activeRange.length === 2 && activeRange[1] !== 0) {
        queryParts.push(
          key === "fdv_checkboxes"
            ? `fdv=${activeRange[0] * billion}-${activeRange[1] * billion}`
            : `${key}=${activeRange[0]}-${activeRange[1]}`
        );
      }
      continue;
    }

    if (typeof value[0] === "object") {
      const activeItems = getActiveFilterKeys(value as FilterItem[]);
      if (activeItems.length) {
        queryParts.push(`${key}=${activeItems.join(",")}`);
      }
    }

    if (typeof value[0] === "number") {
      const activeRange = value as number[];
      if (activeRange.length === 2 && activeRange[1] !== 0) {
        queryParts.push(
          key === "marketCap_checkboxes"
            ? `marketCap=${activeRange[0] * billion}-${activeRange[1] * billion}`
            : `${key}=${activeRange[0]}-${activeRange[1]}`
        );
      }
    }
  }

  return `&${queryParts.join("&")}`;
};

const useCryptoMarketPage = () => {
  const { userData } = useContext(AuthContext);
  const router = useRouter();
  const [sortValue, setSortValue] = useState<SortValue>({
    name: "Asset",
    value: 1,
  });
  const [filterValue, setFilterValue] = useState("Full Market");
  const [filterData, setFilterData] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [queryString, setQueryString] = useState("");
  const [tabHub, setTabHub] = useState(false);
  const [newAsset, setNewAsset] = useState(false);
  const [isSearchModal, setIsSearchModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHighlights, setIsHighlights] = useState(true);
  const { comments, confirmAddComment, refetch } = useComments(
    "comments/market",
    "comments/market"
  );

  const tabsData = useQuery(
    "market-categories",
    () => fetchProjectsCategories("categories/all"),
    {
      refetchOnWindowFocus: false,
      refetchInterval: 60000,
    }
  );

  const activitiesQuery = useQuery(
    "crypto-activities",
    () => getCryptoActivities({ offset: 0, limit: 5, sort: "newest", accessTier: "public" }),
    {
      refetchOnWindowFocus: false,
    }
  );

  const { data, isLoading } = useQuery(
    ["crypto-market", queryString],
    () =>
      fetchProjects("market", "", "", queryString, {
        source: "fomo-v2",
      }),
    {
      refetchOnWindowFocus: false,
      refetchInterval: 8000,
    }
  );

  const userTabs = useQuery(
    ["user-tabs", userData?._id, !!userData?.isFullAuth],
    () => fetchTabs("all/saved"),
    {
      refetchOnWindowFocus: false,
      enabled: !!userData?.isFullAuth,
    }
  );

  const homeTabs = useQuery(["home-tabs"], fetchHomeTabs, {
    refetchOnWindowFocus: false,
  });

  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  const handleHighlightsChange = (value: boolean) => {
    setIsHighlights(value);
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, String(value));
  };

  useEffect(() => {
    const highLightsStatus = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);

    if (!highLightsStatus) {
      localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, "true");
      setIsHighlights(true);
      return;
    }

    setIsHighlights(highLightsStatus === "true");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryString(
        `${buildQueryString(page, sortValue, searchValue)}${buildFilterSummary(
          filterData
        )}`
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [searchValue, page, sortValue, filterData]);

  return {
    activitiesQuery,
    comments,
    confirmAddComment,
    filterValue,
    handleHighlightsChange,
    homeTabs,
    isFavorite,
    isHighlights,
    isLoading,
    isSearchModal,
    limit,
    newAsset,
    page,
    projects: data?.projects || [],
    refetch,
    router,
    searchValue,
    setFilterData,
    setFilterValue,
    setIsFavorite,
    setIsSearchModal,
    setNewAsset,
    setPage,
    setSearchValue,
    setTabHub,
    sortValue,
    tabHub,
    tabsData,
    total: Number(data?.total || 0),
    updateSortValue,
    userTabs,
  };
};

export default useCryptoMarketPage;

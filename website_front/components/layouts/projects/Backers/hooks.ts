import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import fetchBackersFundsByQuery from "../../../../http/backers/fetchBackersFundsByQuery";
import fetchBackersPersonsByQuery from "../../../../http/backers/fetchBackersPersonsByQuery";

export type BackersTab = "Funds" | "Persons" | "Ecosystem";
export type SortOrderValue = 1 | -1;

export interface BackersSortOption {
  label: string;
  value: string;
  sortName: string;
  sortOrder: SortOrderValue;
}

export interface IFundsState {
  analyticsQueryString: string;
  data?: Awaited<ReturnType<typeof fetchBackersFundsByQuery>>;
  error?: unknown;
  isFavorite: boolean;
  isLoading: boolean;
  isSearchModal: boolean;
  page: number;
  quickFilter: string;
  searchValue: string;
  sortValue: { name: string; value: SortOrderValue };
  setFilterOptions: React.Dispatch<React.SetStateAction<any>>;
  setIsFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSearchModal: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setQuickFilter: React.Dispatch<React.SetStateAction<string>>;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  updateSortValue: (name: string, value: SortOrderValue) => void;
}

export interface IPersonsState {
  analyticsQueryString: string;
  data?: Awaited<ReturnType<typeof fetchBackersPersonsByQuery>>;
  error?: unknown;
  grid: boolean;
  isFavorite: boolean;
  isLoading: boolean;
  page: number;
  quickFilter: string;
  searchValue: string;
  sortValue: { name: string; value: SortOrderValue };
  setFilterData: React.Dispatch<React.SetStateAction<any>>;
  setGrid: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setQuickFilter: React.Dispatch<React.SetStateAction<string>>;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  updateSortValue: (name: string, value: SortOrderValue) => void;
}

export const PERSONS_GRID_LIMIT = 12;
export const PERSONS_TABLE_LIMIT = 100;
export const FUNDS_LIMIT = 100;

export const getBackersTab = (
  value: string | string[] | undefined
): BackersTab | null => {
  if (!value) return null;

  const normalizedValue = String(value).toLowerCase();

  if (normalizedValue === "funds") return "Funds";
  if (normalizedValue === "persons") return "Persons";
  if (normalizedValue === "ecosystem") return "Ecosystem";

  return null;
};

const buildFundsQueryString = (filters: Record<string, any> | undefined) => {
  if (!filters) return "";

  const queryParams: string[] = [];
  const appendQueryParam = (key: string, value: string) => {
    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  };
  const normalizeRangeValue = (key: string, range: number[]) => {
    if (range.length !== 2) return "";

    const [rawMin, rawMax] = range;
    if (!Number.isFinite(rawMin) || !Number.isFinite(rawMax)) return "";
    if (rawMin === 0 && rawMax === 0) return "";
    if (key === "investAmount_checkboxes" && rawMin === 0 && rawMax === 10) {
      return "";
    }

    const multiplier = key === "investAmount_checkboxes" ? 1000000000 : 1;
    const min = Math.min(rawMin, rawMax) * multiplier;
    const max = Math.max(rawMin, rawMax) * multiplier;

    return `${Math.round(min)}-${Math.round(max)}`;
  };
  const getActiveItems = (value: any[]) => {
    const activeItems = value
      .filter((item: any) =>
        typeof item === "object" ? item.isActive : true
      )
      .map((item: any) => (typeof item === "object" ? item.key : item))
      .filter((item: any) => item !== undefined && item !== null && item !== "");

    if (
      activeItems.includes("all") ||
      (value.length > 0 && activeItems.length === value.length)
    ) {
      return [];
    }

    return activeItems;
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (key.endsWith("_checkboxes")) {
        const range = value
          .map((item: any) => Number(item))
          .filter((item: number) => Number.isFinite(item));
        const rangeValue = normalizeRangeValue(key, range);

        if (rangeValue) {
          appendQueryParam(key.replace(/_checkboxes$/, ""), rangeValue);
        }

        return;
      }

      const activeItems = getActiveItems(value);

      if (activeItems.length > 0) {
        appendQueryParam(key, activeItems.join(","));
      }
    }

    if (key === "name" && value) {
      appendQueryParam("name", String(value));
    }
  });

  return queryParams.join("&");
};

const fundsSortMap: Record<string, string> = {
  "Fund Name": "name",
  "Investment Amount": "projectsCount",
  "Invested Amount": "projectsCount",
  ROI: "roi",
  "Projects Supported": "supportedProjectsCount",
  Rating: "rating",
  Fullness: "fullness",
  Region: "country",
  "Last Updated": "lastUpdatedAt",
};

const fundsQuickSortMap: Record<string, { sortBy: string; sortOrder: "asc" | "desc" }> = {
  rating_desc: { sortBy: "rating", sortOrder: "desc" },
  rating_asc: { sortBy: "rating", sortOrder: "asc" },
  fullness_desc: { sortBy: "fullness", sortOrder: "desc" },
  fullness_asc: { sortBy: "fullness", sortOrder: "asc" },
  roi_desc: { sortBy: "roi", sortOrder: "desc" },
  roi_asc: { sortBy: "roi", sortOrder: "asc" },
  projects_desc: { sortBy: "supportedProjectsCount", sortOrder: "desc" },
  projects_asc: { sortBy: "supportedProjectsCount", sortOrder: "asc" },
  name_asc: { sortBy: "name", sortOrder: "asc" },
  name_desc: { sortBy: "name", sortOrder: "desc" },
  region_asc: { sortBy: "country", sortOrder: "asc" },
  region_desc: { sortBy: "country", sortOrder: "desc" },
};

const getFundsQuickFilterBySort = (name: string, value: SortOrderValue) => {
  const fieldMap: Record<string, string> = {
    "Fund Name": "name",
    "Investment Amount": "projects",
    "Invested Amount": "projects",
    "Projects Supported": "projects",
    Rating: "rating",
    Fullness: "fullness",
    ROI: "roi",
    Region: "region",
  };
  const field = fieldMap[name];

  return field ? `${field}_${value === 1 ? "asc" : "desc"}` : "rating_desc";
};

const getPersonsQuickFilterBySort = (name: string, value: SortOrderValue) => {
  const fieldMap: Record<string, string> = {
    "ATH ROI": "roi",
    ROI: "roi",
    Investments: "investments",
    "Projects Supported": "projects",
    "FOMO Score": "rating",
    Rating: "rating",
    Fullness: "fullness",
    "Last Updated": "updated",
  };
  const field = fieldMap[name];

  return field ? `${field}_${value === 1 ? "asc" : "desc"}` : "rating_desc";
};

const appendParam = (params: string[], key: string, value: string | number) => {
  if (value === undefined || value === null || value === "") return;
  params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
};

const buildFundsRequestQuery = ({
  filterOptions,
  page,
  limit,
  quickFilter,
  sortValue,
}: {
  filterOptions: Record<string, any>;
  page?: number;
  limit?: number;
  quickFilter: string;
  sortValue: { name: string; value: SortOrderValue };
}) => {
  const params = buildFundsQueryString(filterOptions)
    .split("&")
    .filter(Boolean);
  const quickSort = fundsQuickSortMap[quickFilter];
  const sortBy = fundsSortMap[sortValue.name] || quickSort?.sortBy || "rating";
  const sortOrder =
    fundsSortMap[sortValue.name]
      ? sortValue.value === 1
        ? "asc"
        : "desc"
      : quickSort?.sortOrder || "desc";

  appendParam(params, "sortBy", sortBy);
  appendParam(params, "sortOrder", sortOrder);
  if (page) appendParam(params, "page", page);
  if (limit) appendParam(params, "limit", limit);

  return `?${params.join("&")}`;
};

const personsSortMap: Record<string, string> = {
  "ATH ROI": "roi",
  ROI: "roi",
  Investments: "supportedProjectsCount",
  "Projects Supported": "supportedProjectsCount",
  "FOMO Score": "rating",
  Rating: "rating",
  Fullness: "fullness",
  "Last Updated": "lastUpdatedAt",
};

const personsQuickSortMap: Record<
  string,
  { sortBy: string; sortOrder: "asc" | "desc" }
> = {
  rating_desc: { sortBy: "rating", sortOrder: "desc" },
  rating_asc: { sortBy: "rating", sortOrder: "asc" },
  fullness_desc: { sortBy: "fullness", sortOrder: "desc" },
  fullness_asc: { sortBy: "fullness", sortOrder: "asc" },
  roi_desc: { sortBy: "roi", sortOrder: "desc" },
  roi_asc: { sortBy: "roi", sortOrder: "asc" },
  projects_desc: { sortBy: "supportedProjectsCount", sortOrder: "desc" },
  projects_asc: { sortBy: "supportedProjectsCount", sortOrder: "asc" },
  investments_desc: { sortBy: "supportedProjectsCount", sortOrder: "desc" },
  investments_asc: { sortBy: "supportedProjectsCount", sortOrder: "asc" },
  updated_desc: { sortBy: "lastUpdatedAt", sortOrder: "desc" },
  updated_asc: { sortBy: "lastUpdatedAt", sortOrder: "asc" },
};

const buildPersonsFilterParams = (filters: any | undefined) => {
  if (!filters) return [];

  const params: string[] = [];
  const appendQueryParam = (key: string, value: string) => {
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  };
  const normalizeRangeValue = (key: string, range: number[]) => {
    if (range.length !== 2) return "";
    const [rawMin, rawMax] = range;
    if (!Number.isFinite(rawMin) || !Number.isFinite(rawMax)) return "";
    if (rawMin === 0 && rawMax === 0) return "";

    const multiplier = key === "totalInvestments_checkboxes" ? 1000000000 : 1;
    const min = Math.min(rawMin, rawMax) * multiplier;
    const max = Math.max(rawMin, rawMax) * multiplier;

    return `${Math.round(min)}-${Math.round(max)}`;
  };
  const getActiveItems = (value: any[]) => {
    const activeItems = value
      .filter((item: any) =>
        typeof item === "object" ? item.isActive : true
      )
      .map((item: any) => (typeof item === "object" ? item.key : item))
      .filter((item: any) => item !== undefined && item !== null && item !== "");

    if (
      activeItems.includes("all") ||
      (value.length > 0 && activeItems.length === value.length)
    ) {
      return [];
    }

    return activeItems;
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (key === "sortBy") return;

    if (!Array.isArray(value)) return;

    if (key.endsWith("_checkboxes")) {
      const range = value
        .map((item: any) => Number(item))
        .filter((item: number) => Number.isFinite(item));
      const rangeValue = normalizeRangeValue(key, range);

      if (rangeValue) {
        appendQueryParam(key.replace(/_checkboxes$/, ""), rangeValue);
      }

      return;
    }

    const activeItems = getActiveItems(value);
    if (activeItems.length > 0) {
      appendQueryParam(key, activeItems.join(","));
    }
  });

  return params;
};

const buildPersonsRequestQuery = ({
  filterData,
  page,
  limit,
  quickFilter,
  searchValue,
  sortValue,
  includePagination = true,
  includeSort = true,
}: {
  filterData: Record<string, any> | null;
  page?: number;
  limit?: number;
  quickFilter: string;
  searchValue: string;
  sortValue: { name: string; value: SortOrderValue };
  includePagination?: boolean;
  includeSort?: boolean;
}) => {
  const params = buildPersonsFilterParams(filterData);

  if (searchValue) appendParam(params, "name", searchValue);

  if (includeSort) {
    const quickSort = personsQuickSortMap[quickFilter];
    const sortBy = personsSortMap[sortValue.name] || quickSort?.sortBy || "rating";
    const sortOrder =
      personsSortMap[sortValue.name]
        ? sortValue.value === 1
          ? "asc"
          : "desc"
        : quickSort?.sortOrder || "desc";

    appendParam(params, "sortBy", sortBy);
    appendParam(params, "sortOrder", sortOrder);
  }

  if (includePagination) {
    if (page) appendParam(params, "page", page);
    if (limit) appendParam(params, "limit", limit);
  }

  return params.length ? `?${params.join("&")}` : "";
};

export const useFundsSection = (enabled: boolean): IFundsState => {
  const [isSearchModal, setIsSearchModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState<{ name: string; value: SortOrderValue }>({
    name: "Rating",
    value: -1,
  });
  const [quickFilter, setQuickFilter] = useState("rating_desc");
  const [isFavorite, setIsFavorite] = useState(false);
  const [filterOptions, setFilterOptions] = useState<any>({});

  const fundsQueryString = buildFundsRequestQuery({
    filterOptions,
    page,
    limit: FUNDS_LIMIT,
    quickFilter,
    sortValue,
  });
  const analyticsQueryString = buildFundsRequestQuery({
    filterOptions,
    quickFilter,
    sortValue,
  });

  const { data, isLoading, error } = useQuery(
    ["backers-funds", fundsQueryString],
    () =>
      fetchBackersFundsByQuery(fundsQueryString),
    {
      enabled,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterOptions((prev: any) => ({
        ...prev,
        name: searchValue,
      }));
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const updateSortValue = (name: string, value: SortOrderValue) => {
    setSortValue({ name, value });
    setQuickFilter(getFundsQuickFilterBySort(name, value));
    setPage(1);
  };

  return {
    analyticsQueryString,
    data,
    error,
    isFavorite,
    isLoading,
    isSearchModal,
    page,
    quickFilter,
    searchValue,
    sortValue,
    setFilterOptions,
    setIsFavorite,
    setIsSearchModal,
    setPage,
    setQuickFilter,
    setSearchValue,
    updateSortValue,
  };
};

export const usePersonsSection = (enabled: boolean): IPersonsState => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [filterData, setFilterData] = useState<any | null>({});
  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<{ name: string; value: SortOrderValue }>({
    name: "FOMO Score",
    value: -1,
  });
  const [quickFilter, setQuickFilter] = useState("rating_desc");
  const currentLimit = grid ? PERSONS_GRID_LIMIT : PERSONS_TABLE_LIMIT;
  const personsQueryString = buildPersonsRequestQuery({
    filterData,
    page,
    limit: currentLimit,
    quickFilter,
    searchValue: debouncedSearchValue,
    sortValue,
  });
  const analyticsQueryString = buildPersonsRequestQuery({
    filterData,
    quickFilter,
    searchValue: debouncedSearchValue,
    sortValue,
    includePagination: false,
    includeSort: false,
  });

  const { data, isLoading, error } = useQuery(
    ["backers-persons", personsQueryString],
    () => fetchBackersPersonsByQuery(personsQueryString),
    {
      enabled,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const updateSortValue = (name: string, value: SortOrderValue) => {
    setSortValue({ name, value });
    setQuickFilter(getPersonsQuickFilterBySort(name, value));
    setPage(1);
  };

  return {
    analyticsQueryString,
    data,
    error,
    grid,
    isFavorite,
    isLoading,
    page,
    quickFilter,
    searchValue,
    sortValue,
    setFilterData,
    setGrid,
    setIsFavorite,
    setPage,
    setQuickFilter,
    setSearchValue,
    updateSortValue,
  };
};

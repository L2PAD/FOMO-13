/* eslint-disable */
import React, { useState, useContext, useMemo, useEffect } from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import { Info } from "lucide-react";
import { EchoNFTTabs, ProjectsProjectsTabs } from "../../../../staticContent/tabs";
import { LocationContext } from "../../../global/Layout";
import FilterSortHeader from "../../../global/FilterSortHeader";
import ViewTable from "../../../global/Tables/ViewTable";
import Tabs from "../../../global/Tabs";
import fetchIcoProjects from "../../../../http/projects/fetchIcoProjects";
import fetchIcoProjectFilters, {
  IcoProjectFilterOption,
} from "../../../../http/projects/fetchIcoProjectFilters";
import Pagination from "../../../global/Pagintaion";
import useComments from "../../../../hooks/useComments";
import Typography from "../../../global/common/Typography";
import getProjectType from "../../../../helpers/getProjectType";
import { Subtitle } from "../FomoChat/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { SearchInput, SearchWrapper } from "../P2PExchange/styles";
import { Investor, IProject } from "../../../../types/global_types";
import CommentBlock from "../../../global/CommentBlock";
import fetchFunds from "../../../../http/funds/fetchFunds";
import BannerList from "../../../global/BannerList";
import Filter from "../../../global/Filter";
import PlaceholderGrid from "../../../global/common/PlaceholderGrid";
import { TableGridBtn } from "../Persons/styles";
import { AssetIcon, GearIcon, SortIcon } from "../../../global/Icons";
import TabHub from "../../../global/Icons/TabHub";
import UniversalTable from "../../../global/common/UniversalTable";
import {
  projectsIcoGridColumns,
  projectsIcoSortHeader,
} from "../../../../staticContent/tables";
import UniversalFilter, {
  ICheckbox,
  IFilterBlock,
} from "../../../global/UniversalFilter";
import { icoProjectFilter } from "../../../../staticContent/projects/crypto_market";
import EmptyList from "../../../global/EmptyList";
import HallOfFame from "../Eralash/HallOfFame";
import PromotedProjects from "./PromotedProjects";
import { buildQueryString } from "../CryptoMarket";
import PageHeader from "../../../global/PageHeader";
import CreateOwnAsset from "../modals/CreateOwnAsset";
import useMediaQuery from "../../../../hooks/useMediaQuery";
import TabHubContext from "../CryptoMarket/tabHub";
import SortDropdown from "../../../global/common/SortDropdown";
import {
  MainInfo,
  MainInfoDescription,
  PageWrapper,
  SearchContainer,
  TableHeaderLeftWrapper,
} from "../CryptoMarket/styles";
import {
  CryptoDesktopTabsWrapper,
  CryptoHeaderActions,
  CryptoHeaderIconActions,
  CryptoHeaderRight,
  CryptoHeaderTitleGroup,
  CryptoMobileContent,
  ProjectCardItem,
  ProjectsWrapper,
  ProjectCardLink,
  HeaderWrapper,
  LeftHeaderWrapper,
  MainTitleWrapper,
} from "./styles";
import ButtonSwitch from "../../../UI/inputs/button-switch";
import { useTranslation } from "i18n";
import { useFavorites } from "../../../../hooks/useFavourite";

const ICO_STATUS_TABS = new Set(["Active", "Upcoming", "Ended"]);
const EMPTY_ICO_PROJECT_TABS = new Set(["ICO Stats"]);
const SANDBOX_TAB = "Sandbox";
const PROJECTS_ICO_FAV_KEY = "FOMO-FOMONAUTS-ICO-FAV";

type ProjectSortOptionValue =
  | "lastFundingDesc"
  | "lastFundingAsc"
  | "totalRaisedAsc"
  | "totalRaisedDesc"
  | "investorsCountAsc"
  | "investorsCountDesc"
  | "fomoScoreDesc"
  | "fomoScoreAsc";

const projectSortOptions: Array<{
  label: string;
  value: ProjectSortOptionValue;
}> = [
    { label: "New", value: "lastFundingDesc" },
    { label: "Old", value: "lastFundingAsc" },
    { label: "Total Raised Low to High", value: "totalRaisedAsc" },
    { label: "Total Raised High to Low", value: "totalRaisedDesc" },
    { label: "Investors Low to High", value: "investorsCountAsc" },
    { label: "Investors High to Low", value: "investorsCountDesc" },
    { label: "FOMO Score High to Low", value: "fomoScoreDesc" },
    { label: "FOMO Score Low to High", value: "fomoScoreAsc" },
  ];

const projectSortMap: Record<
  ProjectSortOptionValue,
  { name: string; value: 1 | -1 }
> = {
  lastFundingDesc: { name: "lastFunding", value: -1 },
  lastFundingAsc: { name: "lastFunding", value: 1 },
  totalRaisedAsc: { name: "totalRaised", value: 1 },
  totalRaisedDesc: { name: "totalRaised", value: -1 },
  investorsCountAsc: { name: "investorsCount", value: 1 },
  investorsCountDesc: { name: "investorsCount", value: -1 },
  fomoScoreDesc: { name: "fomoScore", value: -1 },
  fomoScoreAsc: { name: "fomoScore", value: 1 },
};

const staticIcoProjectFilters = icoProjectFilter.flatMap(
  (filterBlock) => filterBlock.filters
);
const dynamicIcoFilterOptionsLimit = 8;
const billion = 1000000000;

const cloneFilterValue = (value: any) => {
  if (!Array.isArray(value)) return value;

  return value.map((item) =>
    item && typeof item === "object" ? { ...item } : item
  );
};

const getStaticFilterValues = (filterKey: string): ICheckbox[] => {
  const filter = staticIcoProjectFilters.find((item) => item.key === filterKey);

  return filter && Array.isArray(filter.values)
    ? cloneFilterValue(filter.values)
    : [];
};

const buildDynamicCheckboxValues = (
  filterKey: "categories" | "fundingType",
  options: IcoProjectFilterOption[] = [],
  currentValues?: ICheckbox[]
): ICheckbox[] => {
  const fallbackValues = getStaticFilterValues(filterKey);
  const showAllOption =
    fallbackValues.find((item) => item.key === "all") || {
      isActive: true,
      key: "all",
      label: "Show all",
    };
  const currentStateByKey = new Map(
    Array.isArray(currentValues)
      ? currentValues.map((item) => [item.key, Boolean(item.isActive)])
      : []
  );
  const hasActiveSpecificOption = Array.isArray(currentValues)
    ? currentValues.some((item) => item.key !== "all" && item.isActive)
    : false;
  const optionLimit = Math.max(fallbackValues.length - 1, 0);
  const uniqueOptions = options.reduce<IcoProjectFilterOption[]>(
    (acc, item) => {
      if (!item?.key || item.key === "all") return acc;
      if (acc.some((existing) => existing.key === item.key)) return acc;

      acc.push(item);
      return acc;
    },
    []
  );
  const fallbackOptions = fallbackValues
    .filter((item) => item.key !== "all")
    .filter(
      (item) => !uniqueOptions.some((dynamicOption) => dynamicOption.key === item.key)
    )
    .map((item) => ({
      key: item.key,
      label: item.label,
    }));
  const finalOptions = [...uniqueOptions, ...fallbackOptions].slice(0, optionLimit);

  return [
    {
      ...showAllOption,
      isActive: hasActiveSpecificOption
        ? false
        : currentStateByKey.has("all")
          ? Boolean(currentStateByKey.get("all"))
          : showAllOption.isActive,
    },
    ...finalOptions.map((item) => ({
      isActive: currentStateByKey.has(item.key)
        ? Boolean(currentStateByKey.get(item.key))
        : false,
      key: item.key,
      label: item.label,
    })),
  ];
};

const normalizeIcoFilterState = (
  filterState: Record<string, any> | null,
  dynamicOptions: {
    categories: IcoProjectFilterOption[];
    fundingTypes: IcoProjectFilterOption[];
  }
): Record<string, any> | null => {
  if (!filterState) return null;

  return {
    ...filterState,
    categories: buildDynamicCheckboxValues(
      "categories",
      dynamicOptions.categories,
      filterState.categories
    ),
    fundingType: buildDynamicCheckboxValues(
      "fundingType",
      dynamicOptions.fundingTypes,
      filterState.fundingType
    ),
  };
};

const getIcoFilterConfig = (
  filterState: Record<string, any> | null,
  dynamicOptions: {
    categories: IcoProjectFilterOption[];
    fundingTypes: IcoProjectFilterOption[];
  }
): IFilterBlock[] => {
  return icoProjectFilter.map((filterBlock) => ({
    ...filterBlock,
    filters: filterBlock.filters.map((filter) => {
      const values =
        filter.key === "categories"
          ? buildDynamicCheckboxValues(
            "categories",
            dynamicOptions.categories,
            filterState?.categories
          )
          : filter.key === "fundingType"
            ? buildDynamicCheckboxValues(
              "fundingType",
              dynamicOptions.fundingTypes,
              filterState?.fundingType
            )
            : filterState && filterState[filter.key] !== undefined
              ? cloneFilterValue(filterState[filter.key])
              : cloneFilterValue(filter.values);
      const nextFilter = {
        ...filter,
        values,
      };

      if (filter.isCheckboxRange) {
        nextFilter.checkboxRangesValues =
          filterState && Array.isArray(filterState[`${filter.key}_checkboxes`])
            ? [...filterState[`${filter.key}_checkboxes`]]
            : cloneFilterValue(filter.checkboxRangesValues);
      }

      return nextFilter;
    }),
  }));
};

const getActiveFilterKeys = (items: any[] = []): string[] => {
  if (!Array.isArray(items)) return [];

  const activeItems = items.filter((item) => item?.isActive);
  const activeSpecificItems = activeItems.filter((item) => item.key !== "all");

  if (!activeItems.length || activeItems.length === items.length) {
    return [];
  }

  if (activeSpecificItems.length) {
    return activeSpecificItems.map((item) => item.key).filter(Boolean);
  }

  if (
    activeItems.some((item) => item.key === "all") ||
    activeItems.length === items.length
  ) {
    return [];
  }

  return activeItems.map((item) => item.key).filter(Boolean);
};

const getRangeParam = (
  range?: number[],
  options?: { multiplier?: number }
): string | undefined => {
  if (!Array.isArray(range) || range.length !== 2 || range[1] === 0) {
    return undefined;
  }

  const multiplier = options?.multiplier || 1;

  return `${range[0] * multiplier}-${range[1] * multiplier}`;
};

const buildIcoFilterSummary = (
  filterData: Record<string, any> | null
): string => {
  if (!filterData) return "";

  const params = new URLSearchParams();
  const setActiveKeys = (sourceKey: string, targetKey = sourceKey) => {
    const keys = getActiveFilterKeys(filterData[sourceKey]);

    if (keys.length) {
      params.set(targetKey, keys.join(","));
    }
  };

  setActiveKeys("categories");
  setActiveKeys("fundingType");
  setActiveKeys("fundingDates");
  setActiveKeys("red-flags");
  setActiveKeys("fomoScore");

  const fundsRaisedRange = getRangeParam(filterData.fundsRaised_checkboxes, {
    multiplier: billion,
  });
  const fundsRaisedKeys = getActiveFilterKeys(filterData.fundsRaised);

  if (fundsRaisedRange) {
    params.set("fundsRaised", fundsRaisedRange);
  } else if (fundsRaisedKeys.length) {
    params.set("fundsRaised", fundsRaisedKeys.join(","));
  }

  if (Array.isArray(filterData.investors) && filterData.investors.length) {
    const investorNames = filterData.investors
      .map((item: any) => item?.name)
      .filter(Boolean);

    if (investorNames.length) {
      params.set("investorNames", investorNames.join(","));
    }
  }

  const queryString = params.toString();

  return queryString ? `&${queryString}` : "";
};

type IcoProjectView = IProject & {
  category?: string;
  platform?: string;
  dateAdded?: Date | string;
  mainCategory?: { name?: string } | string | null;
};

const firstNonEmptyText = (...values: Array<any>): string => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstNonEmptyText(...value);
      if (nested) return nested;
      continue;
    }

    if (value && typeof value === "object") {
      const nested = firstNonEmptyText(
        value.platformName,
        value.platform,
        value.launchpad,
        value.blockchain,
        value.ecosystem,
        value.name,
        value.title
      );
      if (nested) return nested;
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
};

const firstMeaningfulPlatform = (...values: Array<any>): string => {
  for (const value of values) {
    const text = firstNonEmptyText(value);

    if (text && text.toLowerCase() !== "icodrops") {
      return text;
    }
  }

  return "";
};

const normalizeIcoInvestors = (project: IcoProjectView, primaryFundraising?: any): Investor[] => {
  const rawIcoData = project.rawIcoData || {};
  const candidates = [
    project.investors,
    primaryFundraising?.investors,
    rawIcoData.uiInvestors,
    rawIcoData.investors,
    rawIcoData.fundraising?.investors,
  ];

  for (const value of candidates) {
    if (Array.isArray(value) && value.length) {
      return value;
    }
  }

  return [];
};

const resolveIcoStatus = (tab: string): string | undefined => {
  if (ICO_STATUS_TABS.has(tab)) {
    return tab;
  }

  return undefined;
};

const normalizeIcoProject = (project: IProject): IcoProjectView => {
  const sourceProject = project as IcoProjectView;
  const primaryFundraising = Array.isArray(sourceProject?.fundraising)
    ? sourceProject.fundraising[0]
    : undefined;
  const primaryFundingPlatform = primaryFundraising as any;
  const category =
    sourceProject.category ||
    (typeof sourceProject.mainCategory === "object"
      ? sourceProject.mainCategory?.name
      : sourceProject.mainCategory) ||
    sourceProject?.categories?.[0] ||
    "-";
  const investors: Investor[] =
    normalizeIcoInvestors(sourceProject, primaryFundraising);
  const type =
    sourceProject?.type ||
    primaryFundraising?.type ||
    sourceProject?.round ||
    category;
  const saleRounds = Array.isArray(sourceProject.saleRounds)
    ? sourceProject.saleRounds
    : Array.isArray(sourceProject.rawIcoData?.saleRounds)
      ? sourceProject.rawIcoData.saleRounds
      : [];
  const roundPlatforms = saleRounds.map((round: any) =>
    firstNonEmptyText(
      round?.platformName,
      round?.platform,
      round?.launchpad,
      round?.raw?.infoBlocks?.Platform?.text
    )
  );
  const platform =
    firstMeaningfulPlatform(
      sourceProject.platform,
      sourceProject.rawIcoData?.platform,
      sourceProject.launchpads,
      sourceProject.rawIcoData?.launchpads,
      primaryFundingPlatform?.platformName,
      primaryFundingPlatform?.platform,
      primaryFundingPlatform?.launchpad,
      roundPlatforms,
      sourceProject.ecosystems,
      sourceProject.rawIcoData?.ecosystems,
      sourceProject.tokenMetrics?.blockchain
    ) || category;
  const totalRaised =
    Number(sourceProject?.totalRaised) ||
    Number(sourceProject?.fundsRaised) ||
    Number(primaryFundraising?.raised) ||
    0;
  const lastFunding =
    sourceProject?.lastFunding ||
    primaryFundraising?.startDate ||
    sourceProject.dateAdded;

  return {
    ...sourceProject,
    niche: sourceProject?.niche || sourceProject?.symbol || "",
    category,
    type,
    platform,
    investors,
    totalRaised: String(totalRaised),
    lastFunding,
    logo: sourceProject?.logo || "",
  };
};

const getIcoProjectStatusRouteParam = (project: IProject): string => {
  const status = String(project?.status || "Active").trim();

  return encodeURIComponent(status || "Active");
};

const getIcoProjectHref = (project: IProject): string => {
  const projectItem = project as IcoProjectView;
  const routeIdentifier = String(
    projectItem.slug || projectItem.sourceId || projectItem._id || ""
  );
  const statusParam = getIcoProjectStatusRouteParam(project);

  return `/echo/${encodeURIComponent(routeIdentifier)}?status=${statusParam}`;
};

const Projects = () => {
  const { t, translateText } = useTranslation();
  const [isFavourite, setIsFavourite] = useState(false);
  const [investorsFilter, setInvestorsFilter] = useState<Array<string>>([]);
  const [rangeFilterValues, setRangeFilterValues] = useState<Array<number>>([
    0, 10000000,
  ]);
  const [searchValue, setSearchValue] = useState("");
  const [filterData, setFilterData] = useState<any | null>(null);
  const [sortValue, setSortValue] = useState<{ name: string; value: 1 | -1 }>({
    name: "lastFunding",
    value: -1,
  });
  const [currentSection, setCurrentSection] = useState<'ICO Projects' | 'Mint NFT'>('ICO Projects')
  const [activeTab, setActiveTab] = useState(currentSection === 'ICO Projects' ? ProjectsProjectsTabs[2] : EchoNFTTabs[0]);
  const [queryString, setQueryString] = useState<string>("");
  const [page, setPage] = useState(1);
  const [grid, setGrid] = useState(true);
  const [tabHub, setTabHub] = useState(false);
  const [newAsset, setNewAsset] = useState(false);
  const router = useRouter();
  const limit: number = 30;
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    useState<boolean>(false);

  const { path } = useContext(LocationContext);
  const { favorites: projectFavorites, toggleFavorite: toggleProjectFavorite } =
    useFavorites(PROJECTS_ICO_FAV_KEY);
  const isSandboxProjectTab =
    currentSection === "ICO Projects" && activeTab === SANDBOX_TAB;
  const isEmptyProjectTab =
    currentSection === "ICO Projects" && EMPTY_ICO_PROJECT_TABS.has(activeTab);
  const { comments, confirmAddComment, refetch } = useComments(
    `comments/${path}`,
    `comments/${path}`
  );
  const { data, isLoading } = useQuery(
    ["crypto-ico-v2", queryString],
    () => fetchIcoProjects(queryString),
    {
      refetchOnWindowFocus: false,
      enabled: !isEmptyProjectTab,
    }
  );
  const investors = useQuery("investors", fetchFunds, {
    refetchOnWindowFocus: false,
  });
  const icoFilterOptions = useQuery(
    ["ico-project-filter-options", dynamicIcoFilterOptionsLimit],
    () => fetchIcoProjectFilters(dynamicIcoFilterOptionsLimit),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const dynamicFilterOptions = useMemo(
    () => ({
      categories: icoFilterOptions.data?.categories || [],
      fundingTypes: icoFilterOptions.data?.fundingTypes || [],
    }),
    [icoFilterOptions.data]
  );
  const normalizedFilterData = useMemo(
    () => normalizeIcoFilterState(filterData, dynamicFilterOptions),
    [filterData, dynamicFilterOptions]
  );
  const filterConfig = useMemo(
    () => getIcoFilterConfig(normalizedFilterData, dynamicFilterOptions),
    [normalizedFilterData, dynamicFilterOptions]
  );
  const dynamicFilterOptionsKey = useMemo(
    () =>
      JSON.stringify({
        categories: dynamicFilterOptions.categories.map((item) => item.key),
        fundingTypes: dynamicFilterOptions.fundingTypes.map((item) => item.key),
      }),
    [dynamicFilterOptions]
  );
  const filterStateKey = useMemo(
    () =>
      JSON.stringify({
        filterState: normalizedFilterData || {},
        dynamicOptions: dynamicFilterOptionsKey,
      }),
    [normalizedFilterData, dynamicFilterOptionsKey]
  );

  const updateActiveTab = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev: any) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  const handleSearchChange = (value: string): void => {
    setSearchValue(value);
    setPage(1);
  };

  const selectedProjectSortOption = useMemo(() => {
    return (
      Object.entries(projectSortMap).find(
        ([, config]) =>
          config.name === sortValue.name && config.value === sortValue.value
      )?.[0] || null
    ) as ProjectSortOptionValue | null;
  }, [sortValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const tabStatus =
        currentSection === "ICO Projects" && !isSandboxProjectTab
          ? resolveIcoStatus(activeTab)
          : undefined;
      const sandboxQuery = isSandboxProjectTab ? "&sandbox=true" : "";

      setQueryString(
        `${buildQueryString(
          page,
          sortValue,
          searchValue,
          tabStatus,
          limit
        )}${sandboxQuery}${buildIcoFilterSummary(normalizedFilterData)}`
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [
    searchValue,
    page,
    activeTab,
    sortValue,
    normalizedFilterData,
    currentSection,
    isSandboxProjectTab,
  ]);

  const normalizedProjects = useMemo(
    () => (data?.projects || []).map((project: IProject) => normalizeIcoProject(project)),
    [data?.projects]
  );
  const isFavoriteTab = currentSection === "ICO Projects" && activeTab === "FAV";
  const nonSandboxProjectFavorites = useMemo(
    () => projectFavorites.filter((project: IProject) => !project.isSandbox),
    [projectFavorites]
  );
  const renderedProjects = useMemo(
    () => {
      if (isEmptyProjectTab) return [];

      return isFavoriteTab ? nonSandboxProjectFavorites : normalizedProjects;
    },
    [isEmptyProjectTab, isFavoriteTab, normalizedProjects, nonSandboxProjectFavorites]
  );
  const isContentLoading = isLoading && !isFavoriteTab && !isEmptyProjectTab;

  const handleSectionSwitch = () => {
    const nextSection =
      currentSection === "ICO Projects" ? "Mint NFT" : "ICO Projects";

    setCurrentSection(nextSection);
    setActiveTab(
      nextSection === "ICO Projects" ? ProjectsProjectsTabs[2] : EchoNFTTabs[0]
    );
    setPage(1);
  };

  return (
    <PageWrapper>
      <PageHeader className="crypto-projects-header">
        <CryptoHeaderTitleGroup>
          <button className="tooltip-button">
            <Info size={16} color="#738094" />
            <span
              className="tooltip-text"
              style={{
                width: 320,
              }}
            >
              {translateText("Your Signal for the Next Big Move")}
              <br />
              {t("echo.tooltip")}
            </span>
          </button>
          <h1>{t("echo.title")}</h1>
          <PromotedProjects placementSurface="crypto_projects" />
        </CryptoHeaderTitleGroup>
        <CryptoHeaderRight>
          <div className="search-section">
            <SearchInput
              className="crypto-market-search width100"
              type="text"
              placeholder={t("common.placeholders.search")}
              onChange={handleSearchChange}
              leftIcon={<SearchIconStyle />}
              value={searchValue}
            />
          </div>
          <CryptoHeaderActions>
            <SortDropdown
              value={selectedProjectSortOption}
              options={projectSortOptions}
              onChange={(value) => {
                setSortValue(projectSortMap[value as ProjectSortOptionValue]);
                setPage(1);
              }}
              icon={<SortIcon />}
            />
            <div className="header-filter">
              <UniversalFilter
                key={`ico-project-desktop-${filterStateKey}`}
                filters={filterConfig}
                onChange={(filterData: any) => {
                  setFilterData(filterData);
                  setPage(1);
                }}
                onReset={() => {
                  setFilterData(null);
                  setPage(1);
                }}
              />
            </div>
            <button type="button" onClick={() => setTabHub(true)}>
              <TabHub />
              {translateText("Tab Hub")}
            </button>
            <button type="button" onClick={() => setNewAsset(true)}>
              <AssetIcon />
              {translateText("Add Asset")}
            </button>
            <CryptoHeaderIconActions>
              <TableGridBtn
                style={{ display: "flex" }}
                onClick={() => setGrid(true)}
                isActive={grid}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M15.8333 2.5C16.7538 2.5 17.5 3.23597 17.5 4.14383L17.5 6.94994C17.5 7.8578 16.7538 8.59377 15.8333 8.59377H13.3333C12.4129 8.59377 11.6667 7.8578 11.6667 6.94994L11.6667 4.14383C11.6667 3.23597 12.4129 2.5 13.3333 2.5L15.8333 2.5Z"
                    stroke="#04A584"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.16667 2.5C3.24619 2.5 2.5 3.23597 2.5 4.14383L2.50001 6.94994C2.50001 7.8578 3.2462 8.59377 4.16667 8.59377H6.66667C7.58715 8.59377 8.33334 7.8578 8.33334 6.94994L8.33333 4.14383C8.33333 3.23597 7.58714 2.5 6.66667 2.5L4.16667 2.5Z"
                    stroke="#04A584"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.8333 11.4063C16.7538 11.4063 17.5 12.1422 17.5 13.0501V15.8562C17.5 16.764 16.7538 17.5 15.8333 17.5H13.3333C12.4129 17.5 11.6667 16.764 11.6667 15.8562L11.6667 13.0501C11.6667 12.1422 12.4129 11.4063 13.3333 11.4063H15.8333Z"
                    stroke="#04A584"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.16667 11.4063C3.2462 11.4063 2.50001 12.1422 2.50001 13.0501L2.50001 15.8562C2.50001 16.764 3.2462 17.5 4.16668 17.5H6.66667C7.58715 17.5 8.33334 16.764 8.33334 15.8562L8.33334 13.0501C8.33334 12.1422 7.58715 11.4063 6.66667 11.4063H4.16667Z"
                    stroke="#04A584"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TableGridBtn>
              <TableGridBtn onClick={() => setGrid(false)} isActive={!grid}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M2.88491 12.517H17.5M2.88491 7.50849H17.5M15.6504 17.5H4.11851C3.22463 17.5 2.5 16.764 2.5 15.8562L2.5 4.14384C2.5 3.23597 3.22463 2.5 4.11851 2.5L15.6504 2.5C16.5443 2.5 17.2689 3.23597 17.2689 4.14384V15.8562C17.2689 16.764 16.5443 17.5 15.6504 17.5Z"
                    stroke="#738094"
                  />
                </svg>
              </TableGridBtn>
            </CryptoHeaderIconActions>
          </CryptoHeaderActions>
        </CryptoHeaderRight>
      </PageHeader>

      <CryptoMobileContent>
        <MainInfo className="crypto-market">
          <MainInfoDescription>
            <MainTitleWrapper>
              <Typography variant="h1">{t("echo.title")}</Typography>
              <ButtonSwitch
                className="bg-switch"
                checked={currentSection !== "ICO Projects"}
                onChange={handleSectionSwitch}
                rightLabel={t("echo.sections.mintNft")}
                leftLabel={t("echo.sections.icoProjects")}
              />
            </MainTitleWrapper>
            <br />
            {translateText("Your Signal for the Next Big Move")}
            <div className="description-container">
              <p className={isDescriptionExpanded ? "expanded" : "collapsed"}>
                {t("echo.tooltip")}
              </p>
              <button
                className="toggle-description-btn"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {" "}
                {isDescriptionExpanded
                  ? translateText("See Less")
                  : translateText("See more")}
              </button>
            </div>
            <SearchContainer>
              <SearchWrapper>
                <SearchInput
                  className="width100"
                  type="text"
                  placeholder={translateText("Search projects, funds, or person")}
                  onChange={handleSearchChange}
                  leftIcon={<SearchIconStyle />}
                  value={searchValue}
                />
              </SearchWrapper>
            </SearchContainer>
          </MainInfoDescription>
        </MainInfo>
        <br />
        <HeaderWrapper>
          <LeftHeaderWrapper>
            <Tabs
              descriptions={
                currentSection === 'ICO Projects'
                  ?
                  [
                    {
                      index: 1,
                      text: "Projects added to the site within the last 7 days",
                    },
                    {
                      index: 5,
                      text: "Community-driven section for projects with missing data or uncertain status. Help improve their profiles!",
                    },
                  ]
                  :
                  [
                    {
                      index: 3,
                      text: "Projects added to the site within the last 7 days",
                    },
                  ]
              }
              items={currentSection === 'ICO Projects' ? ProjectsProjectsTabs : EchoNFTTabs}
              activeItem={activeTab}
              onClick={updateActiveTab}
            />
          </LeftHeaderWrapper>
          {
            currentSection === 'ICO Projects'
              ?
              <TableHeaderLeftWrapper>
                <TableGridBtn
                  style={{ display: "flex" }}
                  onClick={() => setGrid(true)}
                  isActive={grid}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M15.8333 2.5C16.7538 2.5 17.5 3.23597 17.5 4.14383L17.5 6.94994C17.5 7.8578 16.7538 8.59377 15.8333 8.59377H13.3333C12.4129 8.59377 11.6667 7.8578 11.6667 6.94994L11.6667 4.14383C11.6667 3.23597 12.4129 2.5 13.3333 2.5L15.8333 2.5Z"
                      stroke="#04A584"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4.16667 2.5C3.24619 2.5 2.5 3.23597 2.5 4.14383L2.50001 6.94994C2.50001 7.8578 3.2462 8.59377 4.16667 8.59377H6.66667C7.58715 8.59377 8.33334 7.8578 8.33334 6.94994L8.33333 4.14383C8.33333 3.23597 7.58714 2.5 6.66667 2.5L4.16667 2.5Z"
                      stroke="#04A584"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.8333 11.4063C16.7538 11.4063 17.5 12.1422 17.5 13.0501V15.8562C17.5 16.764 16.7538 17.5 15.8333 17.5H13.3333C12.4129 17.5 11.6667 16.764 11.6667 15.8562L11.6667 13.0501C11.6667 12.1422 12.4129 11.4063 13.3333 11.4063H15.8333Z"
                      stroke="#04A584"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4.16667 11.4063C3.2462 11.4063 2.50001 12.1422 2.50001 13.0501L2.50001 15.8562C2.50001 16.764 3.2462 17.5 4.16668 17.5H6.66667C7.58715 17.5 8.33334 16.764 8.33334 15.8562L8.33334 13.0501C8.33334 12.1422 7.58715 11.4063 6.66667 11.4063H4.16667Z"
                      stroke="#04A584"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </TableGridBtn>
                <TableGridBtn onClick={() => setGrid(false)} isActive={!grid}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M2.88491 12.517H17.5M2.88491 7.50849H17.5M15.6504 17.5H4.11851C3.22463 17.5 2.5 16.764 2.5 15.8562L2.5 4.14384C2.5 3.23597 3.22463 2.5 4.11851 2.5L15.6504 2.5C16.5443 2.5 17.2689 3.23597 17.2689 4.14384V15.8562C17.2689 16.764 16.5443 17.5 15.6504 17.5Z"
                      stroke="#738094"
                    />
                  </svg>
                </TableGridBtn>
                <SortDropdown
                  value={selectedProjectSortOption}
                  options={projectSortOptions}
                  onChange={(value) => {
                    setSortValue(projectSortMap[value as ProjectSortOptionValue]);
                    setPage(1);
                  }}
                  icon={<SortIcon />}
                />
                <UniversalFilter
                  key={`ico-project-mobile-${filterStateKey}`}
                  filters={filterConfig}
                  onChange={(filterData: any) => {
                    setFilterData(filterData);
                    setPage(1);
                  }}
                  onReset={() => {
                    setFilterData(null);
                    setPage(1);
                  }}
                />
                <button onClick={() => setTabHub(true)}>
                  <GearIcon />
                  {translateText("Customize tab")}
                </button>
                <button onClick={() => setNewAsset(true)}>
                  <AssetIcon />
                  {translateText("Assets")}
                </button>
              </TableHeaderLeftWrapper>
              :
              <TableHeaderLeftWrapper>
                <UniversalFilter
                  key={`ico-project-nft-mobile-${filterStateKey}`}
                  filters={filterConfig}
                  onChange={(filterData: any) => {
                    setFilterData(filterData);
                    setPage(1);
                  }}
                  onReset={() => {
                    setFilterData(null);
                    setPage(1);
                  }}
                />
              </TableHeaderLeftWrapper>
          }
        </HeaderWrapper>
      </CryptoMobileContent>

      <CryptoDesktopTabsWrapper>
        <HeaderWrapper>
          <LeftHeaderWrapper>
            <Tabs
              descriptions={
                currentSection === 'ICO Projects'
                  ?
                  [
                    {
                      index: 1,
                      text: "Projects added to the site within the last 7 days",
                    },
                    {
                      index: 5,
                      text: "Community-driven section for projects with missing data or uncertain status. Help improve their profiles!",
                    },
                  ]
                  :
                  [
                    {
                      index: 3,
                      text: "Projects added to the site within the last 7 days",
                    },
                  ]
              }
              items={currentSection === 'ICO Projects' ? ProjectsProjectsTabs : EchoNFTTabs}
              activeItem={activeTab}
              onClick={updateActiveTab}
            />
          </LeftHeaderWrapper>
        </HeaderWrapper>
      </CryptoDesktopTabsWrapper>

      {isContentLoading ? (
        <PlaceholderGrid mobileSingleColumn />
      ) : renderedProjects.length ? (
        <ProjectsWrapper>
          {grid ? (
            (currentSection === 'ICO Projects' ? renderedProjects : [])?.map((item: IProject, i) => {
              return (
                <ProjectCardLink
                  href={getIcoProjectHref(item)}
                  key={i}
                >
                  <ProjectCardItem
                    type="default"
                    //@ts-ignore
                    cardData={item}
                    isFavorite={!!projectFavorites.find((favorite) => favorite._id === item._id)}
                    onToggleFavorite={() => toggleProjectFavorite(item)}
                    searchValue={searchValue}
                  />
                </ProjectCardLink>
              );
            })
          ) : (
            <UniversalTable
              isFavorite={isFavourite}
              setIsFavorite={setIsFavourite}
              link=""
              type={"projects-ico"}
              favKey={PROJECTS_ICO_FAV_KEY}
              gridColumns={projectsIcoGridColumns}
              sortHeaders={projectsIcoSortHeader}
              updateSortValue={updateSortValue}
              isLoading={isContentLoading}
              sortValue={{ name: "", value: 1 }}
              page={page}
              items={currentSection === 'ICO Projects' ? renderedProjects : []}
              searchValue={searchValue}
            />
          )}
          {Number(data?.total) > limit && !isFavoriteTab ? (
            <Pagination
              page={page}
              total={Number(data?.total)}
              limit={
                Number(data?.total) < page * limit ? data?.total : page * limit
              }
              totalPage={Math.ceil(Number(data?.total) / limit)}
              onChange={(value) => {
                setPage(value);
              }}
            />
          ) : (
            <></>
          )}
          <CommentBlock
            items={comments}
            addComment={confirmAddComment}
            refetch={refetch}
          />
        </ProjectsWrapper>
      ) : (
        <>
          <br />
          <br />
          <EmptyList />
        </>
      )}
      <TabHubContext isMainModal={tabHub} setIsMainModal={setTabHub} />
      <CreateOwnAsset isVisible={newAsset} onClose={() => setNewAsset(false)} />
    </PageWrapper>
  );
};

export default Projects;

/* eslint-disable */
import React, { useState, useContext, useMemo } from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import { Info } from "lucide-react";
import { EralashTabs } from "../../../../staticContent/tabs";
import { LocationContext } from "../../../global/Layout";
import FilterSortHeader from "../../../global/FilterSortHeader";
import ViewTable from "../../../global/Tables/ViewTable";
import Tabs from "../../../global/Tabs";
import fetchProjects from "../../../../http/projects/fetchProjects";
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
import { Investor, IPerson, IProject } from "../../../../types/global_types";
import CommentBlock from "../../../global/CommentBlock";
import fetchFunds from "../../../../http/funds/fetchFunds";
import BannerList from "../../../global/BannerList";
import type { PersonFilterOptionsResponse } from "../../../../http/investors/fetchPersonFilterOptions";
import fetchBackersPersonsFilterOptions from "../../../../http/backers/fetchBackersPersonsFilterOptions";
import {
  MainInfo,
  MainInfoDescription,
  PageWrapper,
  SearchContainer,
  TableHeaderLeftWrapper,
  TableHeaderRightWrapper,
  TableHeaderWrapper,
} from "../CryptoMarket/styles";
import Filter from "../../../global/Filter";
import PlaceholderGrid from "../../../global/common/PlaceholderGrid";
import { CardLinkWrapper, CardWrapper, TableGridBtn } from "../Persons/styles";
import { GearIcon } from "../../../global/Icons";
import UniversalTable from "../../../global/common/UniversalTable";
import {
  personsGridColumns,
  personsSortHeader,
  projectsIcoGridColumns,
  projectsIcoSortHeader,
} from "../../../../staticContent/tables";
import UniversalFilter from "../../../global/UniversalFilter";
import type { ICheckbox, IFilterBlock } from "../../../global/UniversalFilter";
import {
  icoProjectFilter,
  personsFilter,
} from "../../../../staticContent/projects/crypto_market";
import AllIcon from "../../../../assets/icons/all-sort.svg";
import SortCashIcon from "../../../../assets/icons/sort-cash.svg";
import SmartIcon from "../../../../assets/icons/smart-sort.svg";
import SmileIcon from "../../../../assets/icons/smile-sort.svg";
import RegionIcon from "../../../../assets/icons/region.svg";
import PageHeader from "../../../global/PageHeader";
import {
  HeaderWrapper,
  LeftHeaderWrapper,
  ProjectCardItem,
  ProjectCardLink,
  ProjectsWrapper,
} from "../Crypto/styles";
import Image from "next/image";
import fetchItems from "../../../../http/fetchItems";
import EmptyList from "../../../global/EmptyList";
import ButtonSwitch from "../../../UI/inputs/button-switch";
import {
  EralashHeaderActions,
  EralashHeaderIconActions,
  EralashHeaderLeft,
  EralashHeaderRight,
  EralashMobileContent,
} from "./styles";
import { useTranslation } from "i18n";
import { useFavorites } from "../../../../hooks/useFavourite";

const billion = 1000000000;
const PROJECTS_ICO_FAV_KEY = "FOMO-PROJECTS-ICO-FAV";
const dynamicIcoFilterOptionsLimit = 8;
const staticIcoProjectFilters = icoProjectFilter.flatMap(
  (filterBlock) => filterBlock.filters
);

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
      (item) =>
        !uniqueOptions.some((dynamicOption) => dynamicOption.key === item.key)
    )
    .map((item) => ({
      key: item.key,
      label: item.label,
    }));
  const finalOptions = [...uniqueOptions, ...fallbackOptions].slice(
    0,
    optionLimit
  );

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

const toDynamicFilterValues = (options?: Array<{ key?: string; label?: string } | string>) => {
  const seen = new Set<string>();

  return (options || [])
    .map((option) =>
      typeof option === "string" ? { key: option, label: option } : option
    )
    .filter((option) => option?.key && option?.label)
    .filter((option) => {
      const key = String(option.key).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((option) => ({
      isActive: true,
      key: String(option.key),
      label: String(option.label),
    }))
    .slice(0, 9);
};

const mergePersonsFilterOptions = (
  filters: typeof personsFilter,
  options?: PersonFilterOptionsResponse
) => {
  const specializationValues = toDynamicFilterValues(
    options?.sectors?.length ? options.sectors : options?.specializations
  );

  if (!specializationValues.length) return filters;

  return filters.map((filterBlock) => ({
    ...filterBlock,
    filters: filterBlock.filters.map((filter) => {
      if (filter.key === "specialization") {
        return { ...filter, values: specializationValues };
      }

      return filter;
    }),
  }));
};

const getActiveFilterKeys = (items: any[] = []): string[] => {
  if (!Array.isArray(items)) return [];

  const activeItems = items.filter((item) => item?.isActive);
  const specificItems = items.filter((item) => item?.key !== "all");
  const activeSpecificItems = activeItems.filter((item) => item?.key !== "all");

  if (
    specificItems.length &&
    activeSpecificItems.length === specificItems.length
  ) {
    return [];
  }

  if (activeSpecificItems.length) {
    return activeSpecificItems.map((item) => item.key).filter(Boolean);
  }

  if (
    activeItems.some((item) => item?.key === "all") ||
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

  return params.toString();
};

const buildPersonsFilterSummary = (
  filterData: Record<string, any> | null,
  quickCategory = ""
): string => {
  const params = new URLSearchParams();
  const quickCategoryValue = quickCategory !== "all" ? quickCategory : "";

  if (!filterData) {
    if (quickCategoryValue) params.set("specialization", quickCategoryValue);
    return params.toString();
  }

  for (const key in filterData) {
    const value = filterData[key];

    if (!Array.isArray(value)) continue;

    if (typeof value[0] === "number") {
      const range = getRangeParam(value, {
        multiplier: key === "totalInvestments_checkboxes" ? billion : 1,
      });
      if (range) {
        params.set(key.replace("_checkboxes", ""), range);
      }
      continue;
    }

    if (typeof value[0] === "object") {
      const activeKeys = getActiveFilterKeys(value);

      if (activeKeys.length) {
        const values =
          key === "specialization" && quickCategoryValue
            ? Array.from(new Set([...activeKeys, quickCategoryValue]))
            : activeKeys;

        params.set(key, values.join(","));
      }
    }
  }

  if (quickCategoryValue && !params.has("specialization")) {
    params.set("specialization", quickCategoryValue);
  }

  return params.toString();
};

const buildEralashQueryPath = ({
  activeTab,
  filterData,
  limit,
  page,
  searchValue,
  sortValue,
  quickPersonCategory,
}: {
  activeTab: string;
  filterData: Record<string, any> | null;
  limit: number;
  page: number;
  quickPersonCategory?: string;
  searchValue: string;
  sortValue?: { name: string; value: 1 | -1 };
}): string => {
  const params = new URLSearchParams({
    offset: String((page - 1) * limit),
    limit: String(limit),
    additionalStatus: "eralash",
  });
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue) {
    params.set("searchValue", trimmedSearchValue);
  }

  if (sortValue?.name) {
    params.set("sortKey", sortValue.name);
    params.set("sortNumberValue", String(sortValue.value));
  }

  const filterSummary =
    activeTab === "Projects"
      ? buildIcoFilterSummary(filterData)
      : buildPersonsFilterSummary(filterData, quickPersonCategory);

  return `${activeTab === "Projects" ? "fomo-v2/projects/market" : "fomo-v2/backers/persons"}?${params.toString()}${filterSummary ? `&${filterSummary}` : ""
    }`;
};

const getEralashProjectHref = (item: IProject): string => {
  const coingeckoId =
    (item as any)?.coingeckoId ||
    (item as any)?.providerIds?.coingeckoId ||
    "";

  if ((item?.projectType === "market" || (item as any)?.projectKind === "market") && coingeckoId) {
    return `/market/${encodeURIComponent(String(coingeckoId))}`;
  }

  const routeId =
    (item as any)?.sourceId ||
    (item as any)?.slug ||
    item._id;

  return `/crypto/projects/${encodeURIComponent(String(routeId))}?status=${encodeURIComponent(
    String(item.status || "Active")
  )}`;
};

const EralashLayout = () => {
  const { t, translateText } = useTranslation();
  const [isFavourite, setIsFavourite] = useState(false);
  const [investorsFilter, setInvestorsFilter] = useState<Array<string>>([]);
  const [rangeFilterValues, setRangeFilterValues] = useState<Array<number>>([
    0, 10000000,
  ]);
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<any>();
  const [activeTab, setActiveTab] = useState(EralashTabs[0]);
  const [filterData, setFilterData] = useState<Record<string, any> | null>(
    null
  );
  const [filterValue, setFilterValue] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [grid, setGrid] = useState(false);
  const router = useRouter();
  const limit: number = 50;
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    useState<boolean>(false);
  const { path } = useContext(LocationContext);
  const { favorites: projectFavorites, toggleFavorite: toggleProjectFavorite } =
    useFavorites(PROJECTS_ICO_FAV_KEY);
  const { comments, confirmAddComment, refetch } = useComments(
    `comments/${path}`,
    `comments/${path}`
  );
  const icoFilterOptions = useQuery(
    ["eralash-ico-project-filter-options", dynamicIcoFilterOptionsLimit],
    () => fetchIcoProjectFilters(dynamicIcoFilterOptionsLimit),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const personsFilterOptions = useQuery(
    ["eralash-persons-filter-options"],
    () => fetchBackersPersonsFilterOptions("?additionalStatus=eralash"),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const dynamicIcoFilterOptions = useMemo(
    () => ({
      categories: icoFilterOptions.data?.categories || [],
      fundingTypes: icoFilterOptions.data?.fundingTypes || [],
    }),
    [icoFilterOptions.data]
  );
  const normalizedFilterData = useMemo(
    () =>
      activeTab === "Projects"
        ? normalizeIcoFilterState(filterData, dynamicIcoFilterOptions)
        : filterData,
    [activeTab, filterData, dynamicIcoFilterOptions]
  );
  const projectFilterConfig = useMemo(
    () => getIcoFilterConfig(normalizedFilterData, dynamicIcoFilterOptions),
    [normalizedFilterData, dynamicIcoFilterOptions]
  );
  const personsFilterConfig = useMemo(
    () => mergePersonsFilterOptions(personsFilter, personsFilterOptions.data),
    [personsFilterOptions.data]
  );
  const quickPersonCategories = useMemo(
    () =>
      toDynamicFilterValues(
        personsFilterOptions.data?.sectors?.length
          ? personsFilterOptions.data.sectors
          : personsFilterOptions.data?.specializations
      ),
    [personsFilterOptions.data]
  );
  const queryPath = useMemo(
    () =>
      buildEralashQueryPath({
        activeTab,
        filterData: normalizedFilterData,
        limit,
        page,
        quickPersonCategory: filterValue,
        searchValue,
        sortValue,
      }),
    [activeTab, normalizedFilterData, filterValue, limit, page, searchValue, sortValue]
  );
  const { data, isLoading } = useQuery(
    ["eralash", queryPath],
    () => fetchItems(queryPath),
    {
      refetchOnWindowFocus: false,
    }
  );
  const items: Array<any> =
    (activeTab === "Projects" ? data?.data?.projects : data?.data?.items) || [];

  const updateActiveTab = (value: string) => {
    setActiveTab(value);
    setFilterData(null);
    setFilterValue("all");
    setSortValue(undefined);
    setPage(1);
  };

  const handleSectionSwitch = () => {
    setActiveTab((prev) => (prev === "Projects" ? "Persons" : "Projects"));
    setFilterData(null);
    setFilterValue("all");
    setSortValue(undefined);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  const handleFilterChange = (data: Record<string, any>) => {
    setFilterData(data);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterData(null);
    setPage(1);
  };

  const currentFilters =
    activeTab === "Projects" ? projectFilterConfig : personsFilterConfig;

  const rangeValidation = (
    project: IProject,
    minValue: number,
    maxValue: number
  ): boolean => {
    return (
      Number(project.totalRaised) <= maxValue &&
      Number(project.totalRaised) >= minValue
    );
  };

  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev: any) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  const getContent = (): React.ReactNode => {
    if (activeTab === "Projects") {
      return (
        <ProjectsWrapper style={{ marginTop: "0px" }}>
          {grid ? (
            isLoading ? (
              <PlaceholderGrid />
            ) : (
              items?.map((item: IProject, i) => {
                return (
                  <ProjectCardLink
                    href={getEralashProjectHref(item)}
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
            )
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
              isLoading={isLoading}
              sortValue={sortValue || { name: "", value: 1 }}
              page={page}
              items={items || []}
              searchValue={searchValue}
            />
          )}
          {Number(data?.data?.total) > limit ? (
            <Pagination
              page={page}
              total={Number(data?.data?.total)}
              limit={
                Number(data?.data?.total) < page * limit
                  ? data?.data?.total
                  : page * limit
              }
              totalPage={Math.ceil(Number(data?.data?.total) / limit)}
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
      );
    }

    if (activeTab === "Persons") {
      return (
        <>
          <TableHeaderWrapper style={{ marginTop: "20px" }} id="scroll-header">
            <TableHeaderRightWrapper>
              <button
                className={filterValue === "all" ? "selectedSort" : ""}
                onClick={() => {
                  setFilterValue("all");
                  setPage(1);
                }}
              >
                <Image src={AllIcon} alt="all" />
                {translateText("All")}
              </button>
              {quickPersonCategories.map((item) => (
                <button
                  key={item.key}
                  className={filterValue === item.key ? "selectedSort" : ""}
                  onClick={() => {
                    setFilterValue(item.key);
                    setPage(1);
                  }}
                >
                  {translateText(item.label)}
                </button>
              ))}
            </TableHeaderRightWrapper>
          </TableHeaderWrapper>
          {grid ? (
            isLoading ? (
              <PlaceholderGrid />
            ) : (
              <ProjectsWrapper>
                {items?.length ? (
                  items.map((item: any) => {
                    return (
                      <CardLinkWrapper
                        href={`persons/${item._id}`}
                        key={item._id}
                      >
                        {/*//@ts-ignore*/}
                        <CardWrapper
                          redFlagsList={item.redFlagsList}
                          banner={item.banner}
                          logo={String(item.logo)}
                          name={item.name}
                          rating={item.rating}
                          redFlags={item.redFlagsList?.length}
                        />
                      </CardLinkWrapper>
                    );
                  })
                ) : (
                  <></>
                )}
              </ProjectsWrapper>
            )
          ) : (
            <UniversalTable
              isFavorite={isFavourite}
              setIsFavorite={setIsFavourite}
              link=""
              type={"persons"}
              favKey="FOMO-BACKER-PERSONS-FAV"
              gridColumns={personsGridColumns}
              sortHeaders={personsSortHeader}
              updateSortValue={updateSortValue}
              isLoading={isLoading}
              sortValue={sortValue || { name: "", value: 1 }}
              page={page}
              items={items || []}
              searchValue={searchValue}
            />
          )}
        </>
      );
    }
  };

  return (
    <PageWrapper>
      <PageHeader className="crypto-projects-header">
        <EralashHeaderLeft>
          <button className="tooltip-button">
            <Info size={16} color="#738094" />
            <span
              className="tooltip-text"
              style={{
                width: 320,
              }}
            >
              {t("eralash.tooltip")}
              <br />
              {t("eralash.tooltipSecondLine")}
            </span>
          </button>
          <h1>{t("eralash.title")}</h1>
          <ButtonSwitch
            className="bg-switch"
            checked={activeTab === "Persons"}
            onChange={handleSectionSwitch}
            rightLabel={translateText("Persons")}
            leftLabel={translateText("Projects")}
          />
        </EralashHeaderLeft>
        <EralashHeaderRight>
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
          <EralashHeaderActions>
            <div className="header-filter">
              <UniversalFilter
                key={`eralash-desktop-filter-${activeTab}`}
                filters={currentFilters}
                onChange={handleFilterChange}
                onReset={handleFilterReset}
              />
            </div>
            <EralashHeaderIconActions>
              <TableGridBtn onClick={() => setGrid(true)} isActive={grid}>
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
            </EralashHeaderIconActions>
          </EralashHeaderActions>
        </EralashHeaderRight>
      </PageHeader>

      <EralashMobileContent>
        <MainInfo className="crypto-market">
          <MainInfoDescription>
            <Typography variant="h1">{t("eralash.title")}</Typography>
            <br />
            <div className="description-container">
              <p className={isDescriptionExpanded ? "expanded" : "collapsed"}>
                {t("eralash.tooltip")}
                <p style={{ marginTop: "0px" }}>
                  {t("eralash.mobileSecondLine")}
                </p>
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
                  placeholder={translateText("Search on this page")}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M8.57924 1.26159C8.75138 0.912803 9.24874 0.912803 9.42088 1.26159L11.6492 5.77669C11.7176 5.9152 11.8497 6.0112 12.0026 6.03341L16.9853 6.75744C17.3702 6.81337 17.5239 7.28639 17.2453 7.55788L13.6398 11.0724C13.5292 11.1802 13.4787 11.3355 13.5049 11.4878L14.356 16.4504C14.4218 16.8337 14.0194 17.126 13.6751 16.9451L9.21843 14.602C9.08172 14.5302 8.9184 14.5302 8.78169 14.602L4.32501 16.9451C3.98074 17.126 3.57837 16.8337 3.64412 16.4504L4.49526 11.4878C4.52137 11.3355 4.4709 11.1802 4.3603 11.0724L0.754778 7.55788C0.476254 7.28639 0.629947 6.81337 1.01486 6.75744L5.99757 6.03341C6.15042 6.0112 6.28255 5.9152 6.35091 5.77669L8.57924 1.26159Z"
                stroke="#738094"
                stroke-linejoin="round"
              />
            </svg>
            <Tabs
              items={EralashTabs}
              activeItem={activeTab}
              onClick={updateActiveTab}
            />
          </LeftHeaderWrapper>
          <TableHeaderLeftWrapper>
            <TableGridBtn onClick={() => setGrid(true)} isActive={grid}>
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
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4.16667 2.5C3.24619 2.5 2.5 3.23597 2.5 4.14383L2.50001 6.94994C2.50001 7.8578 3.2462 8.59377 4.16667 8.59377H6.66667C7.58715 8.59377 8.33334 7.8578 8.33334 6.94994L8.33333 4.14383C8.33333 3.23597 7.58714 2.5 6.66667 2.5L4.16667 2.5Z"
                  stroke="#04A584"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M15.8333 11.4063C16.7538 11.4063 17.5 12.1422 17.5 13.0501V15.8562C17.5 16.764 16.7538 17.5 15.8333 17.5H13.3333C12.4129 17.5 11.6667 16.764 11.6667 15.8562L11.6667 13.0501C11.6667 12.1422 12.4129 11.4063 13.3333 11.4063H15.8333Z"
                  stroke="#04A584"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4.16667 11.4063C3.2462 11.4063 2.50001 12.1422 2.50001 13.0501L2.50001 15.8562C2.50001 16.764 3.2462 17.5 4.16668 17.5H6.66667C7.58715 17.5 8.33334 16.764 8.33334 15.8562L8.33334 13.0501C8.33334 12.1422 7.58715 11.4063 6.66667 11.4063H4.16667Z"
                  stroke="#04A584"
                  stroke-linecap="round"
                  stroke-linejoin="round"
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
            <UniversalFilter
              key={`eralash-mobile-filter-${activeTab}`}
              filters={currentFilters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
            />
            <button onClick={() => console.log("test")}>
              <GearIcon />
              {translateText("Customize tab")}
            </button>
          </TableHeaderLeftWrapper>
        </HeaderWrapper>
      </EralashMobileContent>

      {isLoading || items?.length ? (
        getContent()
      ) : (
        <>
          <br />
          <br />
          <br />
          <EmptyList />
        </>
      )}
    </PageWrapper>
  );
};

export default EralashLayout;

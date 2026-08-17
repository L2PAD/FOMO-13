import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Info } from "lucide-react";
import useComments from "../../../../hooks/useComments";
import Filter from "../../../global/Filter";
import CreateOwnAsset from "../modals/CreateOwnAsset";
import UsersModal from "../modals/UsersModal";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../FomoChat/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { SearchInput, SearchWrapper } from "../P2PExchange/styles";
import CommentBlock from "../../../global/CommentBlock";
import NewsBlock from "../../../global/NewsBlock";
import { CommentsTitle } from "../../../global/CommentBlock/styles";
import { PageDescription } from "../Networks/styles";
import { Sort } from "../../../global/common/Sort";
import fetchFundingRounds from "../../../../http/funding-rounds/fetchFundingRounds";
import getProjectType from "../../../../helpers/getProjectType";
import TabHub from "../../../global/Icons/TabHub";
import {
  HeaderPaginationWrapper,
  MainInfo,
  MainInfoDescription,
  PageWrapper,
  SearchContainer,
} from "../CryptoMarket/styles";
import { AssetIcon, GearIcon, SortIcon } from "../../../global/Icons";
import Pagination from "../../../global/Pagintaion";
import { IProject } from "../../../../types/global_types";
import UniversalTable from "../../../global/common/UniversalTable";
import BannerList from "../../../global/BannerList";
import {
  fundingFeedGridColumns,
  fundingFeedSortHeader,
} from "../../../../staticContent/tables";
import getLiveNews from "../../../../http/news/getLiveNews";
import fetchFundingRoundFilters, {
  FundingRoundFilterOption,
} from "../../../../http/funding-rounds/fetchFundingRoundFilters";
import PageHeader from "../../../global/PageHeader";
import UniversalFilter, {
  ICheckbox,
  IFilterBlock,
} from "../../../global/UniversalFilter";
import { fundingFeedFilter } from "../../../../staticContent/projects/crypto_market";
import {
  FundingFeedHeaderActions,
  FundingFeedHeaderLeft,
  FundingFeedHeaderRight,
  FundingFeedMobileActions,
  FundingFeedMobileContent,
} from "./styles";
import TabHubContext from "../CryptoMarket/tabHub";
import SortDropdown from "../../../global/common/SortDropdown";
import { useTranslation } from "i18n";
import TopModal from "../Crypto/Modals/top_modal";
import LocalAdBadge from "../../../global/LocalAdBadge";

type FundingFeedSortValue =
  | "all"
  | "new"
  | "old"
  | "fundsRaisedAsc"
  | "fundsRaisedDesc"
  | "preValuationAsc"
  | "preValuationDesc"
  | "fomoScoreAsc"
  | "fomoScoreDesc";

const fundingFeedSortOptions: Array<{
  label: string;
  value: FundingFeedSortValue;
}> = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Old", value: "old" },
  { label: "Funds Raised Low to High", value: "fundsRaisedAsc" },
  { label: "Funds Raised High to Low", value: "fundsRaisedDesc" },
  { label: "Pre-valuation Low to High", value: "preValuationAsc" },
  { label: "Pre-valuation High to Low", value: "preValuationDesc" },
  { label: "FOMO Score Low to High", value: "fomoScoreAsc" },
  { label: "FOMO Score High to Low", value: "fomoScoreDesc" },
];

const fundingFeedHeaderSortModes: Record<
  string,
  Record<1 | -1, FundingFeedSortValue>
> = {
  "Pre-valuation": {
    1: "preValuationAsc",
    [-1]: "preValuationDesc",
  },
  "FOMO Score": {
    1: "fomoScoreAsc",
    [-1]: "fomoScoreDesc",
  },
};

const getFundingFeedHeaderSortValue = (
  value: FundingFeedSortValue
): { name: string; value: 1 | -1 } => {
  switch (value) {
    case "preValuationAsc":
      return { name: "Pre-valuation", value: 1 };
    case "preValuationDesc":
      return { name: "Pre-valuation", value: -1 };
    case "fomoScoreAsc":
      return { name: "FOMO Score", value: 1 };
    case "fomoScoreDesc":
      return { name: "FOMO Score", value: -1 };
    default:
      return { name: "", value: 1 };
  }
};

const billion = 1000000000;
const staticFundingFeedFilters = fundingFeedFilter.flatMap(
  (filterBlock) => filterBlock.filters
);
const dynamicFundingFeedOptionsLimit = 8;
const roundInvestorsModalTabs: Array<"Funds"> = ["Funds"];

const cloneFilterValue = (value: any) => {
  if (!Array.isArray(value)) return value;

  return value.map((item) =>
    item && typeof item === "object" ? { ...item } : item
  );
};

const getStaticFilterValues = (filterKey: string): ICheckbox[] => {
  const filter = staticFundingFeedFilters.find(
    (item) => item.key === filterKey
  );

  return filter && Array.isArray(filter.values)
    ? cloneFilterValue(filter.values)
    : [];
};

const buildDynamicCheckboxValues = (
  filterKey: "categories" | "fundingType",
  options: FundingRoundFilterOption[] = [],
  currentValues?: ICheckbox[]
): ICheckbox[] => {
  const fallbackValues = getStaticFilterValues(filterKey);
  const showAllOption = fallbackValues.find((item) => item.key === "all") || {
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
  const uniqueOptions = options.reduce<FundingRoundFilterOption[]>(
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

const normalizeFundingFeedFilterState = (
  filterState: Record<string, any> | null,
  dynamicOptions: {
    categories: FundingRoundFilterOption[];
    fundingTypes: FundingRoundFilterOption[];
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

const getActiveFilterKeys = (items: any[] = []): string[] => {
  const activeItems = items.filter((item) => item.isActive);

  if (
    activeItems.some((item) => item.key === "all") ||
    activeItems.length === items.length
  ) {
    return [];
  }

  return activeItems.map((item) => item.key);
};

const getRangeParam = (
  range?: number[],
  options?: { multiplier?: number; ignore?: number[] }
): string | undefined => {
  if (!Array.isArray(range) || range.length !== 2 || range[1] === 0) {
    return undefined;
  }

  if (
    options?.ignore &&
    range[0] === options.ignore[0] &&
    range[1] === options.ignore[1]
  ) {
    return undefined;
  }

  const multiplier = options?.multiplier || 1;

  return `${range[0] * multiplier}-${range[1] * multiplier}`;
};

const buildFundingFeedFilters = (
  filterData: Record<string, any> | null
): Record<string, string> => {
  if (!filterData) return {};

  const filters: Record<string, string> = {};

  const setActiveKeys = (sourceKey: string, targetKey = sourceKey) => {
    const keys = getActiveFilterKeys(filterData[sourceKey]);
    if (keys.length) filters[targetKey] = keys.join(",");
  };

  setActiveKeys("categories");
  setActiveKeys("fundingType");
  setActiveKeys("fundingDates");
  setActiveKeys("has-token", "hasToken");
  setActiveKeys("red-flags", "redFlags");
  setActiveKeys("fomoScore");

  const fundsRaisedRange = getRangeParam(filterData.fundsRaised_checkboxes, {
    multiplier: billion,
  });
  const fundsRaisedKeys = getActiveFilterKeys(filterData.fundsRaised);
  if (fundsRaisedRange) {
    filters.fundsRaised = fundsRaisedRange;
  } else if (fundsRaisedKeys.length) {
    filters.fundsRaised = fundsRaisedKeys.join(",");
  }

  const preValuationRange = getRangeParam(
    filterData["pre-valuation_checkboxes"],
    {
      multiplier: billion,
      ignore: [0, 10],
    }
  );
  const preValuationKeys = getActiveFilterKeys(filterData["pre-valuation"]);
  if (preValuationRange) {
    filters.preValuation = preValuationRange;
  } else if (preValuationKeys.length) {
    filters.preValuation = preValuationKeys.join(",");
  }

  if (typeof filterData.chain === "string" && filterData.chain.trim()) {
    filters.chain = filterData.chain.trim();
  }

  if (Array.isArray(filterData.investors) && filterData.investors.length) {
    const investorIds = filterData.investors
      .map((item: any) => item._id)
      .filter(Boolean);
    const investorDropstabIds = filterData.investors
      .map((item: any) => item.dropstabId)
      .filter(Boolean);
    const investorSlugs = filterData.investors
      .map((item: any) => item.slug)
      .filter(Boolean);
    const investorNames = filterData.investors
      .map((item: any) => item.name)
      .filter(Boolean);

    if (investorIds.length) filters.investors = investorIds.join(",");
    if (investorDropstabIds.length) {
      filters.investorDropstabIds = investorDropstabIds.join(",");
    }
    if (investorSlugs.length) filters.investorSlugs = investorSlugs.join(",");
    if (investorNames.length) filters.investorNames = investorNames.join(",");
  }

  return filters;
};

const getFundingFeedFilterConfig = (
  filterState: Record<string, any> | null,
  dynamicOptions: {
    categories: FundingRoundFilterOption[];
    fundingTypes: FundingRoundFilterOption[];
  }
): IFilterBlock[] => {
  return fundingFeedFilter.map((filterBlock) => ({
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

const CryptoMarketPageLayout = () => {
  const { t, translateText } = useTranslation();
  const limit = 100;
  const { comments, confirmAddComment, refetch } = useComments(
    "comments/crypto",
    "comments/crypto"
  );
  const [page, setPage] = useState(1);
  const [isFavourite, setIsFavourite] = useState(false);
  const [sortValue, setSortValue] = useState<FundingFeedSortValue>("all");
  const [filterData, setFilterData] = useState<Record<string, any> | null>(
    null
  );
  const [tabHub, setTabHub] = useState(false);
  const [newAsset, setNewAsset] = useState(false);
  const [recentlyModal, setRecentlyModal] = useState(false);
  const [biggestModal, setBiggestModal] = useState(false);
  const [trendingModal, setTrendingModal] = useState(false);
  const [accModal, setAccModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [roundInvestorsModal, setRoundInvestorsModal] = useState(false);
  const [roundInvestors, setRoundInvestors] = useState<any[]>([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    useState<boolean>(false);
  const mode = sortValue;
  const fundingRoundFilterOptions = useQuery(
    ["funding-feed-filter-options", dynamicFundingFeedOptionsLimit],
    () => fetchFundingRoundFilters(dynamicFundingFeedOptionsLimit),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const dynamicFilterOptions = useMemo(
    () => ({
      categories: fundingRoundFilterOptions.data?.categories || [],
      fundingTypes: fundingRoundFilterOptions.data?.fundingTypes || [],
    }),
    [fundingRoundFilterOptions.data]
  );
  const normalizedFilterData = useMemo(
    () => normalizeFundingFeedFilterState(filterData, dynamicFilterOptions),
    [filterData, dynamicFilterOptions]
  );
  const activeFilters = useMemo(
    () => buildFundingFeedFilters(normalizedFilterData),
    [normalizedFilterData]
  );
  const filterConfig = useMemo(
    () =>
      getFundingFeedFilterConfig(normalizedFilterData, dynamicFilterOptions),
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
  const liveNews = useQuery(
    "live-news",
    () => {
      return getLiveNews("twitter/livenews/crypto");
    },
    { refetchOnWindowFocus: false }
  );
  const { data, isLoading } = useQuery(
    ["funding-feed", page, debouncedSearchValue, mode, activeFilters],
    () =>
      fetchFundingRounds({
        offset: (page - 1) * limit,
        limit,
        search: debouncedSearchValue,
        mode,
        filters: activeFilters,
      })
  );
  const tableSortValue = useMemo(
    () => getFundingFeedHeaderSortValue(sortValue),
    [sortValue]
  );

  const updateSortValue = (name: string, value: 1 | -1): void => {
    const nextValue = tableSortValue.name === name ? value : -1;
    const nextMode = fundingFeedHeaderSortModes[name]?.[nextValue];

    if (!nextMode) return;

    setSortValue(nextMode);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
      setPage(1);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchValue]);

  return (
    <PageWrapper>
      <div id="scroll-header">
        <PageHeader className="funding-feed-header">
          <FundingFeedHeaderLeft>
            <button className="tooltip-button">
              <Info size={16} color="#738094" />
              <span
                className="tooltip-text"
                style={{
                  width: 320,
                }}
              >
                {t("fundingFeed.tooltip")}
              </span>
            </button>
            <h1>{t("fundingFeed.title")}</h1>
            <LocalAdBadge placement="FUNDING_FEED" placementLabel="Funding Feed" />
          </FundingFeedHeaderLeft>
          <FundingFeedHeaderRight>
            <div className="search-section">
              <SearchInput
                className="crypto-market-search width100"
                type="text"
                placeholder={t("common.placeholders.search")}
                onChange={(value: string) => setSearchValue(value)}
                leftIcon={<SearchIconStyle />}
                value={searchValue}
              />
            </div>
            <FundingFeedHeaderActions>
              <SortDropdown
                value={sortValue}
                options={fundingFeedSortOptions}
                onChange={(value) => {
                  setSortValue(value as FundingFeedSortValue);
                  setPage(1);
                }}
                icon={<SortIcon />}
              />
              <div className="header-filter">
                <UniversalFilter
                  key={`funding-feed-desktop-${filterStateKey}`}
                  filters={filterConfig}
                  onChange={(data: any) => {
                    setFilterData(data);
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
            </FundingFeedHeaderActions>
          </FundingFeedHeaderRight>
        </PageHeader>
      </div>

      <FundingFeedMobileContent>
        <MainInfo className="crypto-market">
          <MainInfoDescription>
            <Typography className="main-title" variant="h1">
              {t("fundingFeed.title")}
            </Typography>
            <br />
            {translateText("Knowledge is Key to Predicting Success")}
            <br />
            <div className="description-container">
              <p className={isDescriptionExpanded ? "expanded" : "collapsed"}>
                {t("fundingFeed.mobileDescription")}
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
                  placeholder={translateText(
                    "Search projects, funds, or person"
                  )}
                  onChange={(value: string) => setSearchValue(value)}
                  leftIcon={<SearchIconStyle />}
                  value={searchValue}
                />
              </SearchWrapper>
            </SearchContainer>
          </MainInfoDescription>
        </MainInfo>
        <br />
        <FundingFeedMobileActions>
          <SortDropdown
            value={sortValue}
            options={fundingFeedSortOptions}
            onChange={(value) => {
              setSortValue(value as FundingFeedSortValue);
              setPage(1);
            }}
            icon={<SortIcon />}
          />
          <UniversalFilter
            key={`funding-feed-mobile-${filterStateKey}`}
            filters={filterConfig}
            onChange={(data: any) => {
              setFilterData(data);
              setPage(1);
            }}
            onReset={() => {
              setFilterData(null);
              setPage(1);
            }}
          />
          <button type="button" onClick={() => setTabHub(true)}>
            <GearIcon />
            {translateText("Customize tab")}
          </button>
          <button type="button" onClick={() => setNewAsset(true)}>
            <AssetIcon />
            {translateText("Assets")}
          </button>
        </FundingFeedMobileActions>
      </FundingFeedMobileContent>
      <div>
        {!isFavourite ? (
          <HeaderPaginationWrapper>
            {Number(data?.total) > limit ? (
              <Pagination
                page={page}
                total={Number(data?.total)}
                limit={
                  Number(data?.total) < page * limit
                    ? data?.total
                    : page * limit
                }
                totalPage={Math.ceil(Number(data?.total) / limit)}
                onChange={(value: any) => {
                  setPage(value);
                }}
              />
            ) : (
              <></>
            )}
          </HeaderPaginationWrapper>
        ) : (
          <></>
        )}
        <UniversalTable
          isFavorite={isFavourite}
          setIsFavorite={setIsFavourite}
          link=""
          type="funding-feed"
          favKey="FOMO-FUNDING-FEED-FAV"
          gridColumns={fundingFeedGridColumns}
          sortHeaders={fundingFeedSortHeader}
          updateSortValue={updateSortValue}
          isLoading={isLoading}
          sortValue={tableSortValue}
          page={page}
          items={data?.fundraising || []}
          searchValue={searchValue}
          onFundingFeedInvestorsClick={(investors) => {
            setRoundInvestors(investors);
            setRoundInvestorsModal(true);
          }}
        />
        {!isFavourite ? (
          Number(data?.total) > limit ? (
            <Pagination
              page={page}
              total={Number(data?.total)}
              limit={
                Number(data?.total) < page * limit ? data?.total : page * limit
              }
              totalPage={Math.ceil(Number(data?.total) / limit)}
              onChange={(value: any) => {
                setPage(value);
                document.querySelector("#scroll-header")?.scrollIntoView();
              }}
            />
          ) : (
            <></>
          )
        ) : (
          <></>
        )}
        <CommentsTitle>{translateText("Live news")}</CommentsTitle>
        <br />
        <br />
        <NewsBlock page="crypto" />
        <CommentBlock
          items={comments}
          addComment={confirmAddComment}
          refetch={refetch}
        />
      </div>
      {/* {customizeModal && (
        <CustomizeTabModal onClose={() => setCustomizeModal(false)} />
      )} */}
      <TabHubContext isMainModal={tabHub} setIsMainModal={setTabHub} />
      <CreateOwnAsset isVisible={newAsset} onClose={() => setNewAsset(false)} />
      <TopModal
        isVisible={roundInvestorsModal}
        onClose={() => setRoundInvestorsModal(false)}
        initialTab="Funds"
        funds={roundInvestors}
        title="Investors"
        tabs={roundInvestorsModalTabs}
      />
      {/* {recentlyModal && (
        <UsersModal
          title="Recently added"
          onClose={() => setRecentlyModal(false)}
        />
      )}
      {biggestModal && (
        <UsersModal
          title="Biggest Gainers"
          onClose={() => setBiggestModal(false)}
        />
      )}
      {trendingModal && (
        <UsersModal title="Trending" onClose={() => setTrendingModal(false)} />
      )}
      {accModal && (
        <UsersModal title="Accumulation" onClose={() => setAccModal(false)} />
      )} */}
    </PageWrapper>
  );
};

export default CryptoMarketPageLayout;

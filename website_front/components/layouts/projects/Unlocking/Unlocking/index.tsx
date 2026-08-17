import React, { useContext, useEffect, useMemo, useState } from "react";
import { BarChart3, Info, LayoutGrid, Table2 } from "lucide-react";
import Pagination from "../../../../global/Pagintaion";
import Typography from "../../../../global/common/Typography";
import PageHeader from "../../../../global/PageHeader";
import {
  HeaderPaginationWrapper,
  HeaderTitleWrapper,
  MainInfo,
  MainInfoDescription,
  PageWrapper,
  SearchContainer,
} from "../../CryptoMarket/styles";
import { SearchInput, SearchWrapper } from "../../P2PExchange/styles";
import { SearchIconStyle } from "../../../../global/Navigation/styles";
import {
  unlockingGridColumns,
  unlockingSortHeaders,
} from "../../../../../staticContent/tables";
import UniversalTable from "../../../../global/common/UniversalTable";
import NewsBlock from "../../../../global/NewsBlock";
import { CommentsTitle } from "../../../../global/CommentBlock/styles";
import useComments from "../../../../../hooks/useComments";
import CommentBlock from "../../../../global/CommentBlock";
import {
  MobileHeroContent,
  MobileTableActions,
  UnlockingContentModeActions,
  UnlockingContentModeButton,
  UnlockingMobileHeaderActions,
  UnlockingMobileSearchContainer,
} from "../styles";
import { useQuery } from "react-query";
import fetchTokenUnlocks, {
  fetchTokenUnlockCategories,
  fetchTokenUnlockUserActions,
  ITokenUnlockCategory,
} from "../../../../../http/unlocks/fetchTokenUnlocks";
import { TableGridBtn } from "../../Persons/styles";
import { SortIcon } from "../../../../global/Icons";
import {
  CryptoHeaderActions,
  CryptoHeaderIconActions,
  CryptoHeaderRight,
  CryptoHeaderTitleGroup,
} from "../../Crypto/styles";
import { useTranslation } from "i18n";
import UnlockingAnalytics from "./UnlockingAnalytics";
import SortDropdown from "../../../../global/common/SortDropdown";
import Switch from "../../../../UI/inputs/switch";
import { AuthContext } from "../../../../global/Layout";
import { getUnlockActionSourceId } from "../../../../../helpers/unlockingDisplay";
import LocalAdBadge from "../../../../global/LocalAdBadge";

type UnlockingContentMode = "analytics" | "table";
type UnlockingMode = "all" | "trending" | "new";
type UnlockingSortOption =
  | "nextUnlockAsc"
  | "nextUnlockDesc"
  | "unlockValueDesc"
  | "unlockValueAsc"
  | "unlockPercentDesc"
  | "marketCapDesc"
  | "marketCapAsc"
  | "priceDesc"
  | "priceAsc";
type UnlockingCategoryDropdownValue =
  | `mode:${UnlockingMode}`
  | `category:${string}`;

const unlockingSortOptions: Array<{
  label: string;
  value: UnlockingSortOption;
  sortBy: string;
  sortOrder: "asc" | "desc";
  tableLabel: string;
}> = [
  {
    label: "Next Unlock Soonest",
    value: "nextUnlockAsc",
    sortBy: "nextTokenUnlockDate",
    sortOrder: "asc",
    tableLabel: "Date",
  },
  {
    label: "Next Unlock Latest",
    value: "nextUnlockDesc",
    sortBy: "nextTokenUnlockDate",
    sortOrder: "desc",
    tableLabel: "Date",
  },
  {
    label: "Unlock Value High to Low",
    value: "unlockValueDesc",
    sortBy: "nextUnlockValueUsd",
    sortOrder: "desc",
    tableLabel: "Next Unlock",
  },
  {
    label: "Unlock Value Low to High",
    value: "unlockValueAsc",
    sortBy: "nextUnlockValueUsd",
    sortOrder: "asc",
    tableLabel: "Next Unlock",
  },
  {
    label: "Unlock Progress High to Low",
    value: "unlockPercentDesc",
    sortBy: "totalTokensUnlockedPercent",
    sortOrder: "desc",
    tableLabel: "Unlock Progress",
  },
  {
    label: "Market Cap High to Low",
    value: "marketCapDesc",
    sortBy: "marketCap",
    sortOrder: "desc",
    tableLabel: "Market Cap Short",
  },
  {
    label: "Market Cap Low to High",
    value: "marketCapAsc",
    sortBy: "marketCap",
    sortOrder: "asc",
    tableLabel: "Market Cap Short",
  },
  {
    label: "Price High to Low",
    value: "priceDesc",
    sortBy: "priceUsd",
    sortOrder: "desc",
    tableLabel: "Price",
  },
  {
    label: "Price Low to High",
    value: "priceAsc",
    sortBy: "priceUsd",
    sortOrder: "asc",
    tableLabel: "Price",
  },
];

const sortConfigByValue = unlockingSortOptions.reduce(
  (acc, item) => {
    acc[item.value] = item;
    return acc;
  },
  {} as Record<UnlockingSortOption, (typeof unlockingSortOptions)[number]>
);

const unlockingSortByHeaderLabel: Record<string, string> = {
  Price: "priceUsd",
  "Next Unlock": "nextUnlockValueUsd",
  "Market Cap Short": "marketCap",
  "Circulating Supply": "circulationSupplyPercent",
  "Unlock Progress": "totalTokensUnlockedPercent",
  Date: "nextTokenUnlockDate",
};

const ContentModeButtons = ({
  mode,
  onChange,
}: {
  mode: UnlockingContentMode;
  onChange: (nextMode: UnlockingContentMode) => void;
}) => {
  return (
    <UnlockingContentModeActions className="unlocking-action-group">
      <UnlockingContentModeButton
        type="button"
        onClick={() => onChange("table")}
        isActive={mode === "table"}
      >
        <Table2 size={18} />
      </UnlockingContentModeButton>
      <UnlockingContentModeButton
        type="button"
        onClick={() => onChange("analytics")}
        isActive={mode === "analytics"}
      >
        <BarChart3 size={18} />
      </UnlockingContentModeButton>
    </UnlockingContentModeActions>
  );
};

const Unlocking = () => {
  const { t, translateText } = useTranslation();
  const { userData } = useContext(AuthContext);
  const limit = 50;
  const { comments, confirmAddComment, refetch } = useComments(
    "comments/crypto",
    "comments/crypto"
  );
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("");
  const [mode, setMode] = useState<UnlockingMode>("all");
  const [selectedCategory, setSelectedCategory] =
    useState<ITokenUnlockCategory | null>(null);
  const [selectedSortOption, setSelectedSortOption] = useState<
    UnlockingSortOption | "custom"
  >("nextUnlockAsc");
  const [sortValue, setSortValue] = useState<{ name: string; value: 1 | -1 }>({
    name: "Next Unlock",
    value: 1,
  });
  const [page, setPage] = useState(1);
  const [isDesktopGridView, setIsDesktopGridView] = useState<boolean>(false);
  const [contentMode, setContentMode] = useState<UnlockingContentMode>("table");
  const [showSmallUnlocks, setShowSmallUnlocks] = useState<boolean>(false);
  const currentSortConfig =
    selectedSortOption === "custom"
      ? null
      : sortConfigByValue[selectedSortOption];
  const { data: categoriesData } = useQuery(
    ["token-unlock-categories", showSmallUnlocks],
    () =>
      fetchTokenUnlockCategories(
        `?status=upcoming&limit=8&small_unlocks=${String(showSmallUnlocks)}`
      ),
    {
      refetchOnWindowFocus: false,
    }
  );
  const { data, isLoading } = useQuery(
    [
      "token-unlocks",
      page,
      debouncedSearchValue,
      mode,
      selectedCategory?.key,
      selectedSortOption,
      sortValue,
      showSmallUnlocks,
    ],
    () => {
      const querySortBy =
        selectedSortOption === "custom"
          ? unlockingSortByHeaderLabel[sortValue.name] || "nextTokenUnlockDate"
          : currentSortConfig?.sortBy || "nextTokenUnlockDate";
      const querySortOrder =
        selectedSortOption === "custom"
          ? sortValue.value === 1
            ? "asc"
            : "desc"
          : currentSortConfig?.sortOrder || "asc";
      const query = new URLSearchParams({
        offset: String((page - 1) * limit),
        limit: String(limit),
        status: "upcoming",
        sortBy: querySortBy,
        sortOrder: querySortOrder,
        small_unlocks: String(showSmallUnlocks),
      });

      if (debouncedSearchValue) {
        query.set("search", debouncedSearchValue);
      }

      if (mode === "new") {
        query.set("days", "7");
      }

      if (selectedCategory?.label) {
        query.set("category", selectedCategory.label);
      }

      return fetchTokenUnlocks(`?${query.toString()}`);
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  const unlockActionIds = useMemo(
    () =>
      (data?.unlocks || [])
        .map((item) => getUnlockActionSourceId(item))
        .filter((id): id is string => Boolean(id)),
    [data?.unlocks]
  );
  const { data: userActionsData } = useQuery(
    [
      "token-unlock-user-actions",
      userData?._id,
      unlockActionIds.join("|"),
    ],
    () => fetchTokenUnlockUserActions(unlockActionIds),
    {
      enabled: Boolean(userData?.isFullAuth && unlockActionIds.length),
      refetchOnWindowFocus: false,
    }
  );
  const unlocksWithUserActions = useMemo(
    () =>
      (data?.unlocks || []).map((item) => {
        const sourceId = getUnlockActionSourceId(item);

        return {
          ...item,
          userActions: sourceId
            ? userActionsData?.actions?.[sourceId] || item.userActions
            : item.userActions,
        };
      }),
    [data?.unlocks, userActionsData?.actions]
  );
  const dynamicCategories = useMemo(
    () =>
      (categoriesData?.categories || []).filter((category) => {
        const label =
          typeof category?.label === "string"
            ? category.label.trim().toLowerCase()
            : "";

        return label !== "multiple";
      }),
    [categoriesData?.categories]
  );
  const categoryDropdownOptions = useMemo(
    () => [
      { label: "All", value: "mode:all" as UnlockingCategoryDropdownValue },
      {
        label: "Trending",
        value: "mode:trending" as UnlockingCategoryDropdownValue,
      },
      { label: "New", value: "mode:new" as UnlockingCategoryDropdownValue },
      ...dynamicCategories.map((category) => ({
        label: category.label,
        value: `category:${category.key}` as UnlockingCategoryDropdownValue,
      })),
    ],
    [dynamicCategories]
  );
  const selectedCategoryDropdownValue: UnlockingCategoryDropdownValue =
    selectedCategory?.key ? `category:${selectedCategory.key}` : `mode:${mode}`;

  const applySortOption = (value: UnlockingSortOption) => {
    const config = sortConfigByValue[value];

    setSelectedSortOption(value);
    setSortValue({
      name: config.tableLabel,
      value: config.sortOrder === "asc" ? 1 : -1,
    });
    setPage(1);
  };

  const updateSortValue = (name: string, value: 1 | -1): void => {
    const sortBy = unlockingSortByHeaderLabel[name];

    if (!sortBy) return;

    setSortValue({ name, value });
    setSelectedSortOption("custom");
    setPage(1);
  };

  const selectMode = (nextMode: UnlockingMode) => {
    setMode(nextMode);
    setSelectedCategory(null);
    setPage(1);

    if (nextMode === "trending") {
      applySortOption("unlockValueDesc");
      return;
    }

    if (nextMode === "new") {
      applySortOption("nextUnlockAsc");
      return;
    }

    if (nextMode === "all") {
      applySortOption("nextUnlockAsc");
    }
  };

  const selectCategory = (category: ITokenUnlockCategory) => {
    setMode("all");
    setSelectedCategory(category);
    setPage(1);
  };

  const handleCategoryDropdownChange = (value: string) => {
    if (value.startsWith("mode:")) {
      selectMode(value.replace("mode:", "") as UnlockingMode);
      return;
    }

    const categoryKey = value.replace("category:", "");
    const category = dynamicCategories.find((item) => item.key === categoryKey);

    if (category) {
      selectCategory(category);
    }
  };

  const handleSmallUnlocksChange = (value: boolean) => {
    setShowSmallUnlocks(value);
    setPage(1);
  };

  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

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
              {t("unlocking.tooltip")}
            </span>
          </button>
          <h1>{t("unlocking.title")}</h1>
          <LocalAdBadge placement="UNLOCKING_FEED" placementLabel="Unlocking" />
        </CryptoHeaderTitleGroup>
        <CryptoHeaderRight>
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
          <Switch
            checked={showSmallUnlocks}
            onChange={handleSmallUnlocksChange}
            rightLabel={translateText("Small Unlocks")}
            leftLabel=""
          />
          <CryptoHeaderActions>
            {contentMode === "table" ? (
              <SortDropdown
                value={selectedCategoryDropdownValue}
                options={categoryDropdownOptions}
                onChange={handleCategoryDropdownChange}
                label="Categories"
                icon={<LayoutGrid size={18} color="#738094" />}
              />
            ) : null}
            <SortDropdown
              value={
                selectedSortOption === "custom" ? null : selectedSortOption
              }
              options={unlockingSortOptions}
              onChange={(value) =>
                applySortOption(value as UnlockingSortOption)
              }
              icon={<SortIcon />}
            />
            <ContentModeButtons mode={contentMode} onChange={setContentMode} />
          </CryptoHeaderActions>
        </CryptoHeaderRight>
      </PageHeader>
      <MobileHeroContent>
        <MainInfo className="crypto-market">
          <MainInfoDescription>
            <HeaderTitleWrapper>
              <Typography className="main-title" variant="h1">
                {t("unlocking.title")}
              </Typography>
              <Switch
                checked={showSmallUnlocks}
                onChange={handleSmallUnlocksChange}
                rightLabel={translateText("Small Unlocks")}
                leftLabel=""
              />
            </HeaderTitleWrapper>
            <div className="description-container">
              <p className={isDescriptionExpanded ? "expanded" : "collapsed"}>
                {t("unlocking.tooltip")}
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
            <UnlockingMobileSearchContainer>
              <SearchWrapper>
                <SearchInput
                  className="width100"
                  value={searchValue}
                  onChange={(value) => setSearchValue(value)}
                  placeholder={translateText("Search token")}
                  type="text"
                  leftIcon={<SearchIconStyle />}
                />
              </SearchWrapper>
            </UnlockingMobileSearchContainer>
          </MainInfoDescription>
        </MainInfo>
      </MobileHeroContent>
      <MobileTableActions>
        <UnlockingMobileHeaderActions>
          <ContentModeButtons mode={contentMode} onChange={setContentMode} />
          {contentMode === "table" ? (
            <SortDropdown
              className="unlocking-dropdown"
              value={selectedCategoryDropdownValue}
              options={categoryDropdownOptions}
              onChange={handleCategoryDropdownChange}
              label="Categories"
              icon={<LayoutGrid size={18} color="#738094" />}
            />
          ) : null}
          <SortDropdown
            className="unlocking-dropdown"
            value={selectedSortOption === "custom" ? null : selectedSortOption}
            options={unlockingSortOptions}
            onChange={(value) => applySortOption(value as UnlockingSortOption)}
            icon={<SortIcon />}
          />
          {contentMode === "table" ? (
            <CryptoHeaderIconActions className="unlocking-action-group">
              <TableGridBtn
                type="button"
                style={{ display: "flex" }}
                onClick={() => setIsDesktopGridView(true)}
                isActive={isDesktopGridView}
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
              <TableGridBtn
                type="button"
                onClick={() => setIsDesktopGridView(false)}
                isActive={!isDesktopGridView}
              >
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
          ) : null}
        </UnlockingMobileHeaderActions>
      </MobileTableActions>
      {contentMode === "analytics" ? (
        <UnlockingAnalytics
          translateText={translateText}
          unlocks={data?.unlocks || []}
        />
      ) : (
        <>
          <HeaderPaginationWrapper>
            {Number(data?.total) > limit && !isFavorite ? (
              <Pagination
                page={page}
                total={Number(data?.total)}
                limit={
                  Number(data?.total) < page * limit
                    ? data?.total
                    : page * limit
                }
                totalPage={Math.ceil(Number(data?.total) / limit)}
                onChange={(value) => {
                  setPage(value);
                }}
              />
            ) : (
              <></>
            )}
            <UniversalTable
              type="unlocking"
              link=""
              sortHeaders={unlockingSortHeaders}
              favKey="FOMO-CRYPTO-UNLOCKING-FAV"
              gridColumns={unlockingGridColumns}
              minWidth={1120}
              isFavorite={isFavorite}
              setIsFavorite={setIsFavorite}
              isLoading={isLoading}
              sortValue={sortValue}
              updateSortValue={updateSortValue}
              page={page}
              items={unlocksWithUserActions}
              searchValue={searchValue}
            />
            {Number(data?.total) > limit && !isFavorite ? (
              <Pagination
                page={page}
                total={Number(data?.total)}
                limit={
                  Number(data?.total) < page * limit
                    ? data?.total
                    : page * limit
                }
                totalPage={Math.ceil(Number(data?.total) / limit)}
                onChange={(value) => {
                  setPage(value);
                  document.querySelector("#scroll-header")?.scrollIntoView();
                }}
              />
            ) : (
              <></>
            )}
          </HeaderPaginationWrapper>
        </>
      )}
      <HeaderPaginationWrapper>
        <CommentsTitle>{translateText("Live news")}</CommentsTitle>
        <br />
        <NewsBlock />
        <CommentBlock
          items={comments}
          addComment={confirmAddComment}
          refetch={refetch}
        />
      </HeaderPaginationWrapper>
    </PageWrapper>
  );
};

export default Unlocking;

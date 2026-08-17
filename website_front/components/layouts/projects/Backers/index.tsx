import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { Info, Sparkles } from "lucide-react";
import useComments from "../../../../hooks/useComments";
import CommentBlock from "../../../global/CommentBlock";
import Typography from "../../../global/common/Typography";
import PageHeader from "../../../global/PageHeader";
import { SearchInput, SearchWrapper } from "../P2PExchange/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import {
  SearchContainer,
  MainInfo,
  MainInfoDescription,
  PageWrapper,
} from "../CryptoMarket/styles";
import {
  fundsFilter,
  personsFilter,
} from "../../../../staticContent/projects/crypto_market";
import {
  BackersGraphSearchAnchor,
  BackersHeaderLeft,
  BackersHeaderRight,
  BackersIntelBadge,
  BackersMobileContent,
  BackersMobileGraphTools,
  BackersMobileTitleRow,
  BackersTabButton,
  BackersTabSwitcher,
} from "./styles";
import BackersAnalytics from "./BackersAnalytics";
import BackersActionsBar from "./BackersControls";
import BackersEcosystemGraph from "./BackersEcosystemGraph";
import {
  FundsTableContent,
  PersonsTableContent,
} from "./BackersTableContent";
import SearchResults from "../Connection/SearchResultsPortal";
import fetchBackersFundsFilters, {
  type FundsFilterOption,
  type FundsFiltersResponse,
} from "../../../../http/backers/fetchBackersFundsFilters";
import fetchBackersPersonsFilterOptions, {
  type PersonFilterOptionsResponse,
} from "../../../../http/backers/fetchBackersPersonsFilterOptions";
import fetchCryptoLinkingSearch, {
  type CryptoLinkingSearchItem,
} from "../../../../http/crypto-linking/fetchCryptoLinkingSearch";
import {
  type BackersSortOption,
  type BackersTab,
  getBackersTab,
  useFundsSection,
  usePersonsSection,
} from "./hooks";
import { useTranslation } from "i18n";
import LocalAdBadge from "../../../global/LocalAdBadge";

type BackersContentMode = "analytics" | "table";

interface IBackersProps {
  defaultTab?: BackersTab;
}

const fundsSortOptions: BackersSortOption[] = [
  { label: "Rating: High to Low", value: "rating_desc", sortName: "Rating", sortOrder: -1 },
  { label: "Rating: Low to High", value: "rating_asc", sortName: "Rating", sortOrder: 1 },
  { label: "Fullness: High to Low", value: "fullness_desc", sortName: "Fullness", sortOrder: -1 },
  { label: "Fullness: Low to High", value: "fullness_asc", sortName: "Fullness", sortOrder: 1 },
  { label: "ROI: High to Low", value: "roi_desc", sortName: "ROI", sortOrder: -1 },
  { label: "ROI: Low to High", value: "roi_asc", sortName: "ROI", sortOrder: 1 },
  { label: "Projects: High to Low", value: "projects_desc", sortName: "Projects Supported", sortOrder: -1 },
  { label: "Projects: Low to High", value: "projects_asc", sortName: "Projects Supported", sortOrder: 1 },
];

const personsSortOptions: BackersSortOption[] = [
  { label: "FOMO Score: High to Low", value: "rating_desc", sortName: "FOMO Score", sortOrder: -1 },
  { label: "FOMO Score: Low to High", value: "rating_asc", sortName: "FOMO Score", sortOrder: 1 },
  { label: "Fullness: High to Low", value: "fullness_desc", sortName: "Fullness", sortOrder: -1 },
  { label: "Fullness: Low to High", value: "fullness_asc", sortName: "Fullness", sortOrder: 1 },
  { label: "ATH ROI: High to Low", value: "roi_desc", sortName: "ATH ROI", sortOrder: -1 },
  { label: "ATH ROI: Low to High", value: "roi_asc", sortName: "ATH ROI", sortOrder: 1 },
  { label: "Investments: High to Low", value: "investments_desc", sortName: "Investments", sortOrder: -1 },
  { label: "Investments: Low to High", value: "investments_asc", sortName: "Investments", sortOrder: 1 },
];

const backersTabs: BackersTab[] = ["Funds", "Persons", "Ecosystem"];

const toDynamicFilterValues = (options?: Array<FundsFilterOption | string>) => {
  const seen = new Set<string>();

  return (options || [])
    .map((option) =>
      typeof option === "string"
        ? { key: option, label: option }
        : option
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
      key: option.key,
      label: option.label,
    }))
    .slice(0, 9);
};

const mergeFundsFilterOptions = (
  filters: typeof fundsFilter,
  options?: FundsFiltersResponse
) => {
  const fundTypeValues = toDynamicFilterValues(options?.fundTypes);
  const industryFocusValues = toDynamicFilterValues(options?.industryFocus);

  if (!fundTypeValues.length && !industryFocusValues.length) return filters;

  return filters.map((filterBlock) => ({
    ...filterBlock,
    filters: filterBlock.filters.map((filter) => {
      if (filter.key === "niche" && fundTypeValues.length) {
        return { ...filter, values: fundTypeValues };
      }

      if (filter.key === "industryFocus" && industryFocusValues.length) {
        return { ...filter, values: industryFocusValues };
      }

      return filter;
    }),
  }));
};

const mergePersonsFilterOptions = (
  filters: typeof personsFilter,
  options?: PersonFilterOptionsResponse
) => {
  const specializationValues = toDynamicFilterValues(
    options?.sectors?.length ? options.sectors : options?.specializations
  );

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

const Backers = ({ defaultTab = "Funds" }: IBackersProps) => {
  const { t, translateText } = useTranslation();
  const router = useRouter();
  const initialTab =
    router.pathname === "/crypto/backers"
      ? getBackersTab(router.query.tab) || defaultTab
      : defaultTab;
  const [activeTab, setActiveTab] = useState<BackersTab>(initialTab);
  const [visitedTabs, setVisitedTabs] = useState<Record<BackersTab, boolean>>({
    Funds: initialTab === "Funds",
    Persons: initialTab === "Persons",
    Ecosystem: initialTab === "Ecosystem",
  });
  const [contentMode, setContentMode] = useState<BackersContentMode>(
    "table"
  );
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [ecosystemSearchValue, setEcosystemSearchValue] = useState("");
  const [isEcosystemSearchOpen, setIsEcosystemSearchOpen] = useState(false);
  const [selectedEcosystemEntity, setSelectedEcosystemEntity] =
    useState<CryptoLinkingSearchItem | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const ecosystemDesktopSearchAnchorRef = useRef<HTMLDivElement | null>(null);
  const ecosystemMobileSearchAnchorRef = useRef<HTMLDivElement | null>(null);
  const { comments, confirmAddComment, refetch } = useComments(
    "comments/crypto",
    "comments/crypto"
  );

  const fundsSection = useFundsSection(visitedTabs.Funds);
  const personsSection = usePersonsSection(visitedTabs.Persons);
  const fundsFiltersQuery = useQuery(
    ["backers-funds-filter-options"],
    fetchBackersFundsFilters,
    {
      enabled: visitedTabs.Funds,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const personsFiltersQuery = useQuery(
    ["backers-persons-filter-options"],
    () => fetchBackersPersonsFilterOptions(),
    {
      enabled: visitedTabs.Persons,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const isEcosystemTab = activeTab === "Ecosystem";
  const deferredEcosystemSearchValue = useDeferredValue(ecosystemSearchValue);
  const ecosystemSearchQuery = useQuery(
    ["crypto-linking-search", deferredEcosystemSearchValue],
    () => fetchCryptoLinkingSearch(deferredEcosystemSearchValue),
    {
      enabled:
        isEcosystemTab && deferredEcosystemSearchValue.trim().length >= 2,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    }
  );
  const deferredActiveTab = useDeferredValue(activeTab);
  const activeFundsFilter = useMemo(
    () => mergeFundsFilterOptions(fundsFilter, fundsFiltersQuery.data),
    [fundsFiltersQuery.data]
  );
  const activePersonsFilter = useMemo(
    () => mergePersonsFilterOptions(personsFilter, personsFiltersQuery.data),
    [personsFiltersQuery.data]
  );
  const sortedFunds = useMemo(
    () => fundsSection.data?.funds || [],
    [fundsSection.data?.funds]
  );
  const sortedPersons = useMemo(
    () => personsSection.data?.persons || [],
    [personsSection.data?.persons]
  );
  const filteredEcosystemResults = ecosystemSearchQuery.data?.items || [];

  useEffect(() => {
    setVisitedTabs((prev) => ({
      ...prev,
      [activeTab]: true,
    }));
  }, [activeTab]);

  useEffect(() => {
    if (router.pathname !== "/crypto/backers") return;

    const nextTab = getBackersTab(router.query.tab);

    if (nextTab && nextTab !== activeTab) {
      startTransition(() => {
        setActiveTab(nextTab);
      });
    }
  }, [activeTab, router.pathname, router.query.tab]);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth <= 767);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const activeSection = activeTab === "Funds" ? fundsSection : personsSection;
  const activeSortOptions =
    activeTab === "Funds" ? fundsSortOptions : personsSortOptions;
  const activeEcosystemSearchAnchorRef = isMobileViewport
    ? ecosystemMobileSearchAnchorRef
    : ecosystemDesktopSearchAnchorRef;

  const backersDescription = t("backers.tooltip");

  const handleTabChange = (nextTab: BackersTab) => {
    if (nextTab === activeTab) return;

    startTransition(() => {
      setActiveTab(nextTab);
    });

    if (router.pathname === "/crypto/backers") {
      router.replace(
        {
          pathname: "/crypto/backers",
          query: {
            ...(router.query || {}),
            tab: nextTab.toLowerCase(),
          },
        },
        undefined,
        { shallow: true, scroll: false }
      );
      return;
    }

    router.push(`/crypto/backers?tab=${nextTab.toLowerCase()}`);
  };

  const handleContentModeChange = (nextMode: BackersContentMode) => {
    startTransition(() => {
      setContentMode(nextMode);
    });
  };

  const handleSortChange = (value: string) => {
    const selectedOption = activeSortOptions.find((option) => option.value === value);

    activeSection.setQuickFilter(value);
    if (selectedOption) {
      activeSection.updateSortValue(
        selectedOption.sortName,
        selectedOption.sortOrder
      );
    } else {
      activeSection.setPage(1);
    }
  };

  const renderTabSwitcher = () => (
    <BackersTabSwitcher>
      {backersTabs.map((tabItem) => (
        <BackersTabButton
          key={tabItem}
          type="button"
          isActive={activeTab === tabItem}
          onClick={() => handleTabChange(tabItem)}
        >
          {translateText(tabItem)}
        </BackersTabButton>
      ))}
    </BackersTabSwitcher>
  );

  const renderIntelBadge = () => (
    <BackersIntelBadge>
      <Sparkles size={16} strokeWidth={1.8} />
      <span>{translateText("FOMO Intel")}</span>
      <span className="pro-badge">PRO</span>
    </BackersIntelBadge>
  );

  const renderEcosystemSearch = (
    anchorRef: React.RefObject<HTMLDivElement>
  ) => (
    <BackersGraphSearchAnchor ref={anchorRef}>
      <SearchInput
        className="crypto-market-search width100"
        type="text"
        placeholder={translateText("Enter entity name")}
        onFocus={(value: boolean) => setIsEcosystemSearchOpen(value)}
        onChange={(value: string) => {
          setEcosystemSearchValue(value);
          setIsEcosystemSearchOpen(true);
          if (!value.trim()) {
            setSelectedEcosystemEntity(null);
          }
        }}
        leftIcon={<SearchIconStyle />}
        value={ecosystemSearchValue}
      />
    </BackersGraphSearchAnchor>
  );

  return (
    <PageWrapper>
      <PageHeader className="crypto-projects-header">
        <BackersHeaderLeft>
          <button className="tooltip-button">
            <Info size={16} color="#738094" />
            <span
              className="tooltip-text"
              style={{
                width: 320,
              }}
            >
              {backersDescription}
            </span>
          </button>
          <h1>{t("backers.title")}</h1>
          <LocalAdBadge placement="BAKERS_FEED" placementLabel="Backers" />
          {renderTabSwitcher()}
        </BackersHeaderLeft>
        <BackersHeaderRight
          className={isEcosystemTab ? "ecosystem-header-right" : undefined}
        >
          {isEcosystemTab ? (
            <>
              {renderIntelBadge()}
              <div className="search-section">
                {renderEcosystemSearch(ecosystemDesktopSearchAnchorRef)}
              </div>
            </>
          ) : (
            <>
              <div className="search-section">
                <SearchInput
                  className="crypto-market-search width100"
                  type="text"
                  placeholder={t("common.placeholders.search")}
                  onChange={(value: string) => activeSection.setSearchValue(value)}
                  leftIcon={<SearchIconStyle />}
                  value={activeSection.searchValue}
                />
              </div>
              <BackersActionsBar
                activeQuickFilter={activeSection.quickFilter}
                activeSortOptions={activeSortOptions}
                activeTab={activeTab}
                fundsFilter={activeFundsFilter}
                mode={contentMode}
                onFundsFilterChange={(data: any) => {
                  fundsSection.setFilterOptions(data);
                  fundsSection.setPage(1);
                }}
                onFundsFilterReset={() => {
                  fundsSection.setFilterOptions({});
                  fundsSection.setPage(1);
                }}
                onModeChange={handleContentModeChange}
                onPersonsFilterChange={(data: any) => {
                  personsSection.setFilterData(data);
                  personsSection.setPage(1);
                }}
                onPersonsFilterReset={() => {
                  personsSection.setFilterData({});
                  personsSection.setPage(1);
                }}
                onQuickFilterChange={handleSortChange}
                personsFilter={activePersonsFilter}
                personsGrid={personsSection.grid}
                setPersonsGrid={personsSection.setGrid}
                showPersonsViewMode={
                  activeTab === "Persons" && contentMode === "table"
                }
                translateText={translateText}
              />
            </>
          )}
        </BackersHeaderRight>
      </PageHeader>
      <SearchResults
        isVisible={
          isEcosystemTab &&
          isEcosystemSearchOpen &&
          ecosystemSearchValue.trim().length >= 2
        }
        results={filteredEcosystemResults}
        isLoading={ecosystemSearchQuery.isLoading || ecosystemSearchQuery.isFetching}
        onSelect={(item: CryptoLinkingSearchItem) => {
          setSelectedEcosystemEntity(item);
          setEcosystemSearchValue(item.name);
          setIsEcosystemSearchOpen(false);
        }}
        anchorRef={activeEcosystemSearchAnchorRef}
      />

      {/* <BackersDesktopSpotlight>{renderDesktopSpotlight()}</BackersDesktopSpotlight> */}

      <BackersMobileContent>
        <MainInfo className="crypto-market">
          <MainInfoDescription>
            <BackersMobileTitleRow>
              <Typography className="main-title" variant="h1">
                {t("backers.title")}
              </Typography>
              {renderTabSwitcher()}
            </BackersMobileTitleRow>
            {isEcosystemTab ? (
              <BackersMobileGraphTools>
                {renderIntelBadge()}
                <SearchContainer>
                  {renderEcosystemSearch(ecosystemMobileSearchAnchorRef)}
                </SearchContainer>
              </BackersMobileGraphTools>
            ) : (
              <>
                <div className="description-container">
                  <p className={isDescriptionExpanded ? "expanded" : "collapsed"}>
                    {backersDescription}
                  </p>
                  <button
                    className="toggle-description-btn"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                  >
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
                      placeholder={
                        activeTab === "Funds"
                          ? translateText("Search fund")
                          : translateText("Search person")
                      }
                      onChange={(value: string) =>
                        activeSection.setSearchValue(value)
                      }
                      leftIcon={<SearchIconStyle />}
                      value={activeSection.searchValue}
                    />
                  </SearchWrapper>
                </SearchContainer>
              </>
            )}
          </MainInfoDescription>
          {/* {activeTab === "Funds" ? <FundsFomoSpotlight /> : <PersonsFomoSpotlight />} */}
        </MainInfo>
        {!isEcosystemTab && (
          <>
            <br />
            <BackersActionsBar
              activeQuickFilter={activeSection.quickFilter}
              activeSortOptions={activeSortOptions}
              activeTab={activeTab}
              fundsFilter={activeFundsFilter}
              mode={contentMode}
              onFundsFilterChange={(data: any) => {
                fundsSection.setFilterOptions(data);
                fundsSection.setPage(1);
              }}
              onFundsFilterReset={() => {
                fundsSection.setFilterOptions({});
                fundsSection.setPage(1);
              }}
              onModeChange={handleContentModeChange}
              onPersonsFilterChange={(data: any) => {
                personsSection.setFilterData(data);
                personsSection.setPage(1);
              }}
              onPersonsFilterReset={() => {
                personsSection.setFilterData({});
                personsSection.setPage(1);
              }}
              onQuickFilterChange={handleSortChange}
              personsFilter={activePersonsFilter}
              personsGrid={personsSection.grid}
              setPersonsGrid={personsSection.setGrid}
              showPersonsViewMode={
                activeTab === "Persons" && contentMode === "table"
              }
              translateText={translateText}
            />
          </>
        )}
      </BackersMobileContent>

      {deferredActiveTab === "Ecosystem" ? (
        <BackersEcosystemGraph selectedEntity={selectedEcosystemEntity} />
      ) : contentMode === "analytics" ? (
        <BackersAnalytics
          activeTab={deferredActiveTab}
          fundsQueryString={fundsSection.analyticsQueryString}
          personsQueryString={personsSection.analyticsQueryString}
          translateText={translateText}
        />
      ) : deferredActiveTab === "Funds" ? (
        <FundsTableContent fundsSection={fundsSection} sortedFunds={sortedFunds} />
      ) : (
        <PersonsTableContent
          personsSection={personsSection}
          sortedPersons={sortedPersons}
        />
      )}

      {deferredActiveTab !== "Ecosystem" && (
        <CommentBlock
          items={comments}
          addComment={confirmAddComment}
          refetch={refetch}
        />
      )}
    </PageWrapper>
  );
};

export default Backers;

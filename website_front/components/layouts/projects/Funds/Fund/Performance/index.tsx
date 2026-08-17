import React, { useEffect, useMemo, useRef, useState } from "react";
import { Title } from "../Overview/styles";
import PhotoIcon from "../../../../../global/Icons/PhotoIcon";
import FundsCompareChart from "../../../../../global/common/FundsCompareChart";
import PortfolioVolatility from "../PortfolioVolatility";
import InvestmentsGrowChart from "../../../../../global/common/InvestmentsGrowChart";
import { useTranslation } from "i18n";
import { IFund } from "../../../../../../types/global_types";
import { useQuery } from "react-query";
import fetchFundPerformance, {
  fetchFundPerformanceSearch,
  FundPerformanceSearchItem,
} from "../../../../../../http/funds/fetchFundPerformance";
import fetchFundMarketFootprint from "../../../../../../http/funds/fetchFundMarketFootprint";
import fetchFundPerformanceVolatility, {
  FundVolatilitySortDirection,
  FundVolatilitySortField,
} from "../../../../../../http/funds/fetchFundPerformanceVolatility";
import SaveShareModal from "../../../../../global/modals/SaveShareModal";

interface IProps {
  fund: IFund;
}

const VOLATILITY_LIMIT = 10;

function toRoiSelectionItem(item: any): FundPerformanceSearchItem {
  const id = String(item?.roundId || item?.id || "");
  const projectName = String(item?.projectName || item?.name || "");
  const roundName = String(item?.roundName || item?.roundLabel || "");

  return {
    ...(item || {}),
    id,
    roundId: id,
    projectName,
    name: projectName,
    label: [projectName, roundName].filter(Boolean).join(" - "),
    logo: item?.logo || item?.projectLogo,
    roundLabel: roundName,
  };
}

const FundPerformance: React.FC<IProps> = ({ fund }) => {
  const { translateText } = useTranslation();
  const roiRef = useRef<HTMLDivElement | null>(null);
  const volatilityRef = useRef<HTMLDivElement | null>(null);
  const growthRef = useRef<HTMLDivElement | null>(null);
  const [shareModal, setShareModal] = useState<{
    title: string;
    html: HTMLDivElement | null;
  } | null>(null);
  const [roiSearchValue, setRoiSearchValue] = useState("");
  const [debouncedRoiSearchValue, setDebouncedRoiSearchValue] = useState("");
  const [isRoiSearchOpen, setIsRoiSearchOpen] = useState(false);
  const [selectedRoiItems, setSelectedRoiItems] = useState<
    FundPerformanceSearchItem[]
  >([]);
  const [hasCustomRoiSelection, setHasCustomRoiSelection] = useState(false);
  const [volatilityPage, setVolatilityPage] = useState(1);
  const [volatilitySortField, setVolatilitySortField] =
    useState<FundVolatilitySortField>("volatility");
  const [volatilitySortDirection, setVolatilitySortDirection] =
    useState<FundVolatilitySortDirection>("desc");
  const fundIdentifier =
    fund?.slug ||
    (fund as any)?.routeId ||
    (fund as any)?.backerId ||
    fund?.id ||
    fund?.name;
  const emptyRoiByTab = useMemo(
    () => ({
      "30D": [],
      "90D": [],
      "6M": [],
      YTD: [],
      "All Time": [],
    }),
    [],
  );
  const emptyMarketFootprintByTab = useMemo(
    () => ({
      "30D": [],
      "90D": [],
      "6M": [],
      YTD: [],
      "All Time": [],
    }),
    [],
  );

  const selectedRoundIds = useMemo(
    () => selectedRoiItems.map((item) => item.roundId || item.id).filter(Boolean),
    [selectedRoiItems],
  );

  const {
    data: performanceResponse,
    isLoading: isRoiPerformanceLoading,
    isFetching: isRoiPerformanceFetching,
  } = useQuery(
    [
      "fund-performance",
      fundIdentifier,
      hasCustomRoiSelection ? selectedRoundIds.join(",") : "default",
    ],
    () =>
      fetchFundPerformance(
        String(fundIdentifier || ""),
        hasCustomRoiSelection ? { selectedRoundIds } : {},
      ),
    {
      enabled: Boolean(fundIdentifier),
      refetchOnWindowFocus: false,
    },
  );

  const { data: roiSearchResponse, isFetching: isRoiSearchFetching } = useQuery(
    ["fund-performance-search", fundIdentifier, debouncedRoiSearchValue],
    () =>
      fetchFundPerformanceSearch(
        String(fundIdentifier || ""),
        debouncedRoiSearchValue,
        20,
      ),
    {
      enabled: Boolean(fundIdentifier && isRoiSearchOpen),
      refetchOnWindowFocus: false,
    },
  );

  const {
    data: volatilityResponse,
    isLoading: isVolatilityLoading,
    isFetching: isVolatilityFetching,
  } = useQuery(
    [
      "fund-performance-volatility",
      fundIdentifier,
      volatilityPage,
      volatilitySortField,
      volatilitySortDirection,
    ],
    () =>
      fetchFundPerformanceVolatility(String(fundIdentifier || ""), {
        range: "90D",
        page: volatilityPage,
        limit: VOLATILITY_LIMIT,
        sortBy: volatilitySortField,
        sortOrder: volatilitySortDirection,
      }),
    {
      enabled: Boolean(fundIdentifier),
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    },
  );

  const {
    data: marketFootprintResponse,
    isLoading: isMarketFootprintLoading,
    isFetching: isMarketFootprintFetching,
  } = useQuery(
    ["fund-performance-market-footprint", fundIdentifier],
    () => fetchFundMarketFootprint(String(fundIdentifier || "")),
    {
      enabled: Boolean(fundIdentifier),
      refetchOnWindowFocus: false,
    },
  );
  const roiPerformance = performanceResponse?.roiPerformance;
  const defaultRoiItems = useMemo(
    () => (roiPerformance?.selectedRounds || []).map(toRoiSelectionItem),
    [roiPerformance?.selectedRounds],
  );
  const visibleSelectedRoiItems =
    !hasCustomRoiSelection && !selectedRoiItems.length
      ? defaultRoiItems
      : selectedRoiItems;
  const maxSelectedRoiItems =
    Number(
      roiPerformance?.meta?.maxSelectedRounds || roiSearchResponse?.maxSelected || 5,
    ) || 5;
  const isRoiSearchLocked =
    visibleSelectedRoiItems.length >= maxSelectedRoiItems;
  const selectedRoiIds = useMemo(
    () =>
      new Set(
        visibleSelectedRoiItems
          .map((item) => item.roundId || item.id)
          .filter(Boolean),
      ),
    [visibleSelectedRoiItems],
  );
  const roiSearchItems = useMemo(
    () =>
      (roiSearchResponse?.items || []).filter((item) => {
        const id = item.roundId || item.id;
        return id && !selectedRoiIds.has(id);
      }),
    [roiSearchResponse?.items, selectedRoiIds],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRoiSearchValue(roiSearchValue);
    }, 350);

    return () => clearTimeout(handler);
  }, [roiSearchValue]);

  useEffect(() => {
    if (hasCustomRoiSelection || selectedRoiItems.length) return;
    if (!defaultRoiItems.length) return;

    setSelectedRoiItems(defaultRoiItems);
  }, [
    defaultRoiItems,
    hasCustomRoiSelection,
    selectedRoiItems.length,
  ]);

  useEffect(() => {
    setVolatilityPage(1);
  }, [fundIdentifier]);

  const openShareModal = (title: string, html: HTMLDivElement | null): void => {
    setShareModal({ title, html });
  };

  const addRoiItem = (item: FundPerformanceSearchItem): void => {
    const normalizedItem = toRoiSelectionItem(item);
    const id = normalizedItem.roundId || normalizedItem.id;
    if (!id || selectedRoiIds.has(id) || isRoiSearchLocked) return;

    setHasCustomRoiSelection(true);
    setSelectedRoiItems((items) => {
      const baseItems =
        !hasCustomRoiSelection && !items.length ? defaultRoiItems : items;

      return [...baseItems, normalizedItem].slice(0, maxSelectedRoiItems);
    });
    setRoiSearchValue("");
    setIsRoiSearchOpen(false);
  };

  const removeRoiItem = (id: string): void => {
    setHasCustomRoiSelection(true);
    setSelectedRoiItems((items) => {
      const baseItems =
        !hasCustomRoiSelection && !items.length ? defaultRoiItems : items;

      return baseItems.filter((item) => (item.roundId || item.id) !== id);
    });
  };

  const removeRoiLine = (index: number): void => {
    const item = visibleSelectedRoiItems[index];
    const id = item?.roundId || item?.id;

    if (id) {
      removeRoiItem(id);
    }
  };

  const handleVolatilitySort = (
    field: FundVolatilitySortField,
    direction: FundVolatilitySortDirection,
  ): void => {
    setVolatilitySortField(field);
    setVolatilitySortDirection(direction);
    setVolatilityPage(1);
  };

  return (
    <div>
      <Title>
        <span>{translateText("ROI Performance Over Time")}</span>
        <button
          onClick={() =>
            openShareModal(translateText("ROI Performance Over Time"), roiRef.current)
          }
        >
          <PhotoIcon />
        </button>
      </Title>
      <div ref={roiRef}>
        <FundsCompareChart
          title={translateText("Compare")}
          dataByTab={roiPerformance?.dataByTab || emptyRoiByTab}
          lines={roiPerformance?.lines || []}
          leftLabels={
            roiPerformance?.leftLabels || [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0]
          }
          leftLabelsByTab={roiPerformance?.leftLabelsByTab}
          searchValue={roiSearchValue}
          onSearchValueChange={setRoiSearchValue}
          onSearchFocusChange={setIsRoiSearchOpen}
          searchPlaceholder={translateText("Search project")}
          searchItems={
            isRoiSearchOpen && !isRoiSearchLocked ? roiSearchItems : []
          }
          isSearchLoading={
            isRoiSearchOpen && !isRoiSearchLocked && isRoiSearchFetching
          }
          isSearchDisabled={isRoiSearchLocked}
          isSearchDropdownOpen={isRoiSearchOpen && !isRoiSearchLocked}
          loadingSearchText={translateText("Loading")}
          emptySearchText={translateText("No projects found")}
          onSearchItemSelect={(item) => addRoiItem(toRoiSelectionItem(item))}
          onRemoveLine={removeRoiLine}
          filterLinesBySearch={false}
          isLoading={isRoiPerformanceLoading || isRoiPerformanceFetching}
        />
      </div>
      <Title style={{ marginTop: "20px" }}>
        {translateText("Portfolio Volatility")}
      </Title>
      <div ref={volatilityRef}>
        <PortfolioVolatility
          projects={volatilityResponse?.items || []}
          isLoading={isVolatilityLoading || isVolatilityFetching}
          page={volatilityResponse?.page || volatilityPage}
          limit={volatilityResponse?.limit || VOLATILITY_LIMIT}
          total={volatilityResponse?.total || 0}
          sortField={volatilitySortField}
          sortDirection={volatilitySortDirection}
          onSortChange={handleVolatilitySort}
          onPageChange={setVolatilityPage}
        />
      </div>
      <Title style={{ marginTop: "20px" }}>
        <span>{translateText("Portfolio Market Footprint")}</span>
        <button
          onClick={() =>
            openShareModal(
              translateText("Portfolio Market Footprint"),
              growthRef.current,
            )
          }
        >
          <PhotoIcon />
        </button>
      </Title>
      <div ref={growthRef}>
        <InvestmentsGrowChart
          categoriesByTab={marketFootprintResponse?.byTab || emptyMarketFootprintByTab}
          primaryLabel={translateText("Total Raised")}
          secondaryLabel={translateText("Market Value")}
          defaultMode="All Time"
          isLoading={isMarketFootprintLoading || isMarketFootprintFetching}
        />
      </div>
      <SaveShareModal
        isVisible={Boolean(shareModal)}
        onClose={() => setShareModal(null)}
        name={shareModal?.title}
        link={typeof window !== "undefined" ? window.location.href : ""}
        html={shareModal?.html || null}
      />
    </div>
  );
};

export default FundPerformance;

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useTranslation } from "i18n";
import { IFund } from "../../../../../../types/global_types";
import fetchFundComparison, {
  fetchFundComparisonSearch,
  FundComparisonFund,
  FundComparisonSection,
  FundComparisonSearchItem,
} from "../../../../../../http/funds/fetchFundComparison";
import ComparisonTable from "../ComparisonTable";
import { DescriptionWrapper, InfoWrapper, Wrapper } from "./styles";
import { Title } from "../Overview/styles";
import PhotoIcon from "../../../../../global/Icons/PhotoIcon";
import FundsCompareChart from "../../../../../global/common/FundsCompareChart";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import ScatterChart from "../../../../../global/common/ScatterChart";
import PerformingInvestments from "../PerformingInvestments";
import CompareGrowChart from "../../../../../global/common/CompareGrowChart";

interface IProps {
  fund: IFund;
}

const MAX_COMPARISON_SELECTED_PEERS = 5;

const fundSelectionId = (item?: Partial<FundComparisonFund>): string => {
  return String(item?.id || item?.routeId || item?.slug || item?.backerId || "");
};

const toFundSelectionItem = (item: any): FundComparisonSearchItem => {
  const id = String(item?.id || item?.routeId || item?.slug || item?.backerId || "");
  const name = String(item?.name || item?.label || "");

  return {
    ...(item || {}),
    id,
    label: item?.label || name,
    name,
    logo: item?.logo || item?.avatar,
  };
};

const Comparison: React.FC<IProps> = ({ fund }) => {
  const { translateText } = useTranslation();
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const [roiSearchValue, setRoiSearchValue] = useState("");
  const [debouncedRoiSearchValue, setDebouncedRoiSearchValue] = useState("");
  const [isRoiSearchOpen, setIsRoiSearchOpen] = useState(false);
  const [selectedRoiPeers, setSelectedRoiPeers] = useState<
    FundComparisonSearchItem[]
  >([]);
  const [hasCustomRoiPeers, setHasCustomRoiPeers] = useState(false);
  const [riskSearchValue, setRiskSearchValue] = useState("");
  const [debouncedRiskSearchValue, setDebouncedRiskSearchValue] = useState("");
  const [isRiskSearchOpen, setIsRiskSearchOpen] = useState(false);
  const [selectedRiskPeers, setSelectedRiskPeers] = useState<
    FundComparisonSearchItem[]
  >([]);
  const [hasCustomRiskPeers, setHasCustomRiskPeers] = useState(false);
  const fundIdentifier =
    fund?.slug ||
    (fund as any)?.routeId ||
    (fund as any)?.backerId ||
    fund?.id ||
    fund?.name;
  const isQueryEnabled = Boolean(fundIdentifier);
  const comparisonSectionStaleTime = 5 * 60 * 1000;
  const selectedRoiPeerIds = useMemo(
    () => selectedRoiPeers.map(fundSelectionId).filter(Boolean),
    [selectedRoiPeers],
  );
  const selectedRiskPeerIds = useMemo(
    () => selectedRiskPeers.map(fundSelectionId).filter(Boolean),
    [selectedRiskPeers],
  );
  const loadComparisonSection = (
    section: FundComparisonSection,
    peerIds?: string[],
  ) =>
    fetchFundComparison(
      String(fundIdentifier || ""),
      peerIds ? { section, peerIds } : { section },
    );
  const tableQuery = useQuery(
    ["fund-comparison", fundIdentifier, "table"],
    () => loadComparisonSection("table"),
    {
      enabled: isQueryEnabled,
      refetchOnWindowFocus: false,
      staleTime: comparisonSectionStaleTime,
    },
  );
  const isTableReady = !isQueryEnabled || tableQuery.isSuccess || tableQuery.isError;
  const roiTrendQuery = useQuery(
    [
      "fund-comparison",
      fundIdentifier,
      "roiTrend",
      hasCustomRoiPeers ? selectedRoiPeerIds.join(",") : "default",
    ],
    () =>
      loadComparisonSection(
        "roiTrend",
        hasCustomRoiPeers ? selectedRoiPeerIds : undefined,
      ),
    {
      enabled: isQueryEnabled && isTableReady,
      refetchOnWindowFocus: false,
      staleTime: comparisonSectionStaleTime,
    },
  );
  const isRoiTrendReady = !isQueryEnabled ||
    roiTrendQuery.isSuccess ||
    roiTrendQuery.isError;
  const riskScatterQuery = useQuery(
    [
      "fund-comparison",
      fundIdentifier,
      "riskScatter",
      hasCustomRiskPeers ? selectedRiskPeerIds.join(",") : "default",
    ],
    () =>
      loadComparisonSection(
        "riskScatter",
        hasCustomRiskPeers ? selectedRiskPeerIds : undefined,
      ),
    {
      enabled: isQueryEnabled && isRoiTrendReady,
      refetchOnWindowFocus: false,
      staleTime: comparisonSectionStaleTime,
    },
  );
  const isRiskScatterReady = !isQueryEnabled ||
    riskScatterQuery.isSuccess ||
    riskScatterQuery.isError;
  const bestWorstQuery = useQuery(
    ["fund-comparison", fundIdentifier, "bestWorst"],
    () => loadComparisonSection("bestWorst"),
    {
      enabled: isQueryEnabled && isRiskScatterReady,
      refetchOnWindowFocus: false,
      staleTime: comparisonSectionStaleTime,
    },
  );
  const isBestWorstReady = !isQueryEnabled ||
    bestWorstQuery.isSuccess ||
    bestWorstQuery.isError;
  const entryAgeRoiQuery = useQuery(
    ["fund-comparison", fundIdentifier, "entryAgeRoi"],
    () => loadComparisonSection("entryAgeRoi"),
    {
      enabled: isQueryEnabled && isBestWorstReady,
      refetchOnWindowFocus: false,
      staleTime: comparisonSectionStaleTime,
    },
  );
  const isComparisonTableLoading =
    isQueryEnabled && (tableQuery.isLoading || tableQuery.isFetching);
  const isRoiTrendLoading =
    isQueryEnabled &&
    (!isTableReady || roiTrendQuery.isLoading || roiTrendQuery.isFetching);
  const isRiskScatterLoading =
    isQueryEnabled &&
    (!isRoiTrendReady ||
      riskScatterQuery.isLoading ||
      riskScatterQuery.isFetching);
  const isBestWorstLoading =
    isQueryEnabled &&
    (!isRiskScatterReady || bestWorstQuery.isLoading || bestWorstQuery.isFetching);
  const isEntryAgeRoiLoading =
    isQueryEnabled &&
    (!isBestWorstReady ||
      entryAgeRoiQuery.isLoading ||
      entryAgeRoiQuery.isFetching);
  const roiTrend = roiTrendQuery.data?.roiTrend;
  const roiDefaultPeers = useMemo(
    () => (roiTrendQuery.data?.peers || []).map(toFundSelectionItem),
    [roiTrendQuery.data?.peers],
  );
  const riskDefaultPeers = useMemo(
    () => (riskScatterQuery.data?.peers || []).map(toFundSelectionItem),
    [riskScatterQuery.data?.peers],
  );
  const visibleRoiPeers = hasCustomRoiPeers ? selectedRoiPeers : roiDefaultPeers;
  const visibleRiskPeers = hasCustomRiskPeers
    ? selectedRiskPeers
    : riskDefaultPeers;
  const visibleRoiPeerIds = useMemo(
    () => visibleRoiPeers.map(fundSelectionId).filter(Boolean),
    [visibleRoiPeers],
  );
  const visibleRiskPeerIds = useMemo(
    () => visibleRiskPeers.map(fundSelectionId).filter(Boolean),
    [visibleRiskPeers],
  );
  const maxSelectedRoiPeers = MAX_COMPARISON_SELECTED_PEERS;
  const maxSelectedRiskPeers = MAX_COMPARISON_SELECTED_PEERS;
  const isRoiSearchLocked = visibleRoiPeers.length >= maxSelectedRoiPeers;
  const isRiskSearchLocked = visibleRiskPeers.length >= maxSelectedRiskPeers;
  const { data: roiSearchResponse, isFetching: isRoiSearchFetching } = useQuery(
    [
      "fund-comparison-search",
      fundIdentifier,
      "roiTrend",
      debouncedRoiSearchValue,
      visibleRoiPeerIds.join(","),
    ],
    () =>
      fetchFundComparisonSearch(String(fundIdentifier || ""), {
        scope: "roiTrend",
        search: debouncedRoiSearchValue,
        excludeIds: visibleRoiPeerIds,
        limit: 10,
      }),
    {
      enabled: Boolean(fundIdentifier && isRoiSearchOpen && !isRoiSearchLocked),
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  );
  const { data: riskSearchResponse, isFetching: isRiskSearchFetching } = useQuery(
    [
      "fund-comparison-search",
      fundIdentifier,
      "riskScatter",
      debouncedRiskSearchValue,
      visibleRiskPeerIds.join(","),
    ],
    () =>
      fetchFundComparisonSearch(String(fundIdentifier || ""), {
        scope: "riskScatter",
        search: debouncedRiskSearchValue,
        excludeIds: visibleRiskPeerIds,
        limit: 10,
      }),
    {
      enabled: Boolean(fundIdentifier && isRiskSearchOpen && !isRiskSearchLocked),
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  );
  const roiSearchItems = useMemo(() => {
    const selectedIds = new Set(visibleRoiPeerIds);
    return (roiSearchResponse?.items || []).filter((item) => {
      const id = fundSelectionId(item);
      return id && !selectedIds.has(id);
    });
  }, [roiSearchResponse?.items, visibleRoiPeerIds]);
  const riskSearchItems = useMemo(() => {
    const selectedIds = new Set(visibleRiskPeerIds);
    return (riskSearchResponse?.items || []).filter((item) => {
      const id = fundSelectionId(item);
      return id && !selectedIds.has(id);
    });
  }, [riskSearchResponse?.items, visibleRiskPeerIds]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRoiSearchValue(roiSearchValue);
    }, 350);

    return () => clearTimeout(handler);
  }, [roiSearchValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRiskSearchValue(riskSearchValue);
    }, 350);

    return () => clearTimeout(handler);
  }, [riskSearchValue]);

  useEffect(() => {
    setRoiSearchValue("");
    setDebouncedRoiSearchValue("");
    setIsRoiSearchOpen(false);
    setSelectedRoiPeers([]);
    setHasCustomRoiPeers(false);
    setRiskSearchValue("");
    setDebouncedRiskSearchValue("");
    setIsRiskSearchOpen(false);
    setSelectedRiskPeers([]);
    setHasCustomRiskPeers(false);
  }, [fundIdentifier]);

  const addRoiPeer = (item: FundComparisonSearchItem): void => {
    const normalizedItem = toFundSelectionItem(item);
    const id = fundSelectionId(normalizedItem);
    const basePeers = hasCustomRoiPeers ? selectedRoiPeers : roiDefaultPeers;
    const baseIds = new Set(basePeers.map(fundSelectionId));
    if (!id || baseIds.has(id) || basePeers.length >= maxSelectedRoiPeers) return;

    setHasCustomRoiPeers(true);
    setSelectedRoiPeers([...basePeers, normalizedItem].slice(0, maxSelectedRoiPeers));
    setRoiSearchValue("");
    setIsRoiSearchOpen(false);
  };

  const removeRoiPeer = (id: string): void => {
    const basePeers = hasCustomRoiPeers ? selectedRoiPeers : roiDefaultPeers;
    setHasCustomRoiPeers(true);
    setSelectedRoiPeers(basePeers.filter((item) => fundSelectionId(item) !== id));
  };

  const removeRoiLine = (index: number): void => {
    if (index <= 0) return;
    const peer = visibleRoiPeers[index - 1];
    const id = fundSelectionId(peer);
    if (id) removeRoiPeer(id);
  };

  const addRiskPeer = (item: FundComparisonSearchItem): void => {
    const normalizedItem = toFundSelectionItem(item);
    const id = fundSelectionId(normalizedItem);
    const basePeers = hasCustomRiskPeers ? selectedRiskPeers : riskDefaultPeers;
    const baseIds = new Set(basePeers.map(fundSelectionId));
    if (!id || baseIds.has(id) || basePeers.length >= maxSelectedRiskPeers) return;

    setHasCustomRiskPeers(true);
    setSelectedRiskPeers([...basePeers, normalizedItem].slice(0, maxSelectedRiskPeers));
    setRiskSearchValue("");
    setIsRiskSearchOpen(false);
  };

  const removeRiskPeer = (id: string): void => {
    const basePeers = hasCustomRiskPeers ? selectedRiskPeers : riskDefaultPeers;
    setHasCustomRiskPeers(true);
    setSelectedRiskPeers(basePeers.filter((item) => fundSelectionId(item) !== id));
  };

  return (
    <Wrapper>
      <Title>
        <span>{translateText("Fund Comparison Table")}</span>
        <button>
          <PhotoIcon />
        </button>
      </Title>
      <ComparisonTable
        rows={tableQuery.data?.table?.rows || []}
        isLoading={isComparisonTableLoading}
      />
      <Title style={{ marginTop: "20px" }}>
        <span>{translateText("Peer ROI Trend Comparison")}</span>
        <button>
          <PhotoIcon />
        </button>
      </Title>
      <FundsCompareChart
        title={translateText("Compare")}
        tooltip="comparison"
        dataByTab={roiTrend?.dataByTab}
        lines={roiTrend?.lines || []}
        leftLabels={roiTrend?.leftLabels}
        leftLabelsByTab={roiTrend?.leftLabelsByTab}
        searchValue={roiSearchValue}
        onSearchValueChange={setRoiSearchValue}
        onSearchFocusChange={setIsRoiSearchOpen}
        searchPlaceholder={translateText("Search fund")}
        searchItems={isRoiSearchOpen && !isRoiSearchLocked ? roiSearchItems : []}
        isSearchLoading={
          isRoiSearchOpen && !isRoiSearchLocked && isRoiSearchFetching
        }
        isSearchDisabled={isRoiSearchLocked}
        isSearchDropdownOpen={isRoiSearchOpen && !isRoiSearchLocked}
        loadingSearchText={translateText("Loading")}
        emptySearchText={translateText("No funds found")}
        onSearchItemSelect={(item) => addRoiPeer(toFundSelectionItem(item))}
        onRemoveLine={removeRoiLine}
        nonRemovableLineIndexes={[0]}
        filterLinesBySearch={false}
        isLoading={isRoiTrendLoading}
      />
      <Title style={{ marginTop: "20px" }}>
        <InfoWrapper>
          <span>{translateText("Average ROI vs. Portfolio Volatility")}</span>
          <button
            onMouseEnter={() => setIsDescription(true)}
            onMouseLeave={() => setIsDescription(false)}
          >
            <InfoIcon />
          </button>
          <DescriptionWrapper>
            <DescriptionComponent
              className="comparison"
              isVisible={isDescription}
              date={new Date()}
              isDate={false}
              text={translateText("Average ROI vs. Portfolio Volatility description")}
            />
          </DescriptionWrapper>
        </InfoWrapper>
        <button>
          <PhotoIcon />
        </button>
      </Title>
      <ScatterChart
        items={riskScatterQuery.data?.riskScatter?.items || []}
        categories={riskScatterQuery.data?.riskScatter?.categories || []}
        searchValue={riskSearchValue}
        onSearchValueChange={setRiskSearchValue}
        onSearchFocusChange={setIsRiskSearchOpen}
        searchPlaceholder={translateText("Search fund")}
        searchItems={
          isRiskSearchOpen && !isRiskSearchLocked ? riskSearchItems : []
        }
        isSearchLoading={
          isRiskSearchOpen && !isRiskSearchLocked && isRiskSearchFetching
        }
        isSearchDisabled={isRiskSearchLocked}
        isSearchDropdownOpen={isRiskSearchOpen && !isRiskSearchLocked}
        loadingSearchText={translateText("Loading")}
        emptySearchText={translateText("No funds found")}
        onSearchItemSelect={addRiskPeer}
        selectedItems={visibleRiskPeers}
        onRemoveItem={removeRiskPeer}
        isLoading={isRiskScatterLoading}
      />
      <Title style={{ marginTop: "20px" }}>
        <span>{translateText("Best & Worst Performing Portfolio Assets")}</span>
        <button>
          <PhotoIcon />
        </button>
      </Title>
      <PerformingInvestments
        rows={bestWorstQuery.data?.bestWorst?.rows || []}
        isLoading={isBestWorstLoading}
      />
      <Title style={{ marginTop: "20px" }}>
        <span>{translateText("Portfolio Entry Age vs. Average ROI")}</span>
        <button>
          <PhotoIcon />
        </button>
      </Title>
      <CompareGrowChart
        categories={entryAgeRoiQuery.data?.entryAgeRoi?.categories || []}
        isLoading={isEntryAgeRoiLoading}
      />
    </Wrapper>
  );
};

export default Comparison;

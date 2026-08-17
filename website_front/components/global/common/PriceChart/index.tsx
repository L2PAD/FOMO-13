import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  ChangeValues,
  ChartBody,
  ChartContainer,
  ChartHeader,
  ChartRow,
  ChartsWrapper,
  ChartTokens,
  ChartViews,
  CompareWrapper,
  PriceDetails,
  TimeButton,
  TimeRangeButtons,
  TimelineBar,
  TimelineBarSlot,
  TimelineBars,
  TimelineLabels,
  TimelineSection,
  TimelineSectionBars,
  TimelineTooltip,
  TimelineTooltipDate,
  TimelineTooltipRow,
  TimelineWrapper,
  YearsWrapper,
} from "./styles";
import ChartLoadingSkeleton from "./ChartLoadingSkeleton";
import SaveShareModal, {
  captureElementAsPng,
} from "../../modals/SaveShareModal";
import UniversalChartBody, { MetricType, RangeType } from "./ChartBody";
import moment from "moment";
import CompareProjects from "../CompareProjects";
import { IProject } from "../../../../types/global_types";
import ComparisonChartBody, {
  CompareChartSeries,
  getMetricValue,
} from "./CompareBody";
import TradingViewChart from "./TradingViewBody";
import { fakeChartData } from "../../../../staticContent/global";
import useMediaQuery from "../../../../hooks/useMediaQuery";
import { useQuery } from "react-query";
import fetchChartData from "../../../../http/analytics/fetchChartData";
import fetchMarketProjectChart from "../../../../http/projects/fetchMarketProjectChart";
import {
  Camera,
  ChartCandlestick,
  ChartLine,
  GitCompareArrows,
  Maximize2,
  Minimize2,
  PanelRightOpen,
  PanelTopOpen,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
export const generateDateRange = (
  selectedRange: RangeType,
  projectHistory?: Array<{ createdAt: string }>,
  projectStartDate?: string
): string[] => {
  if (!projectHistory || projectHistory.length === 0) return [];

  const sortedHistory = [...projectHistory]
    .map((item) => moment(item.createdAt))
    .filter((date) => date.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf());

  const endDate = sortedHistory[sortedHistory.length - 1];

  let rangeStartDate: moment.Moment;

  switch (selectedRange) {
    case "24H":
      rangeStartDate = endDate.clone().subtract(24, "hours");
      break;
    case "7D":
      rangeStartDate = endDate.clone().subtract(7, "days");
      break;
    case "30D":
      rangeStartDate = endDate.clone().subtract(30, "days");
      break;
    case "90D":
      rangeStartDate = endDate.clone().subtract(90, "days");
      break;
    case "1Y":
      rangeStartDate = endDate.clone().subtract(1, "years");
      break;
    case "ALL":
      rangeStartDate = projectStartDate
        ? moment(projectStartDate)
        : sortedHistory[0];
      break;
    default:
      return [];
  }

  const filteredDates = sortedHistory.filter(
    (date) => date.isSameOrAfter(rangeStartDate) && date.isSameOrBefore(endDate)
  );

  if (filteredDates.length <= 8) {
    return filteredDates.map((date) => date.toISOString());
  }

  const step = (filteredDates.length - 1) / 7;
  const result: string[] = [];

  for (let i = 0; i < 8; i++) {
    const index = Math.round(i * step);
    result.push(filteredDates[index].toISOString());
  }

  return result;
};

export const getDateFormatByRange = (range: RangeType): string => {
  switch (range) {
    case "24H":
      return "HH:mm";
    case "7D":
    case "30D":
    case "90D":
      return "MMM D";
    case "1Y":
      return "MMM YY";
    case "ALL":
      return "MMM YYYY";
    default:
      return "MMM D, YYYY";
  }
};

export const getChartType = (range: RangeType): string => {
  switch (range) {
    case "24H":
      return "chart24h";
    case "7D":
      return "chart7d";
    case "30D":
      return "chart30d";
    case "90D":
      return "chart90d";
    case "1Y":
      return "chart1y";
    case "ALL":
      return "chartAll";
    default:
      return "DD MMM YYYY";
  }
};

const getChartTokenSymbol = (item?: any): string => {
  const symbol =
    item?.symbol ||
    item?.ticker ||
    item?.projectData?.symbol ||
    item?.projectData?.ticker ||
    item?.name ||
    "";

  return String(symbol).trim().toUpperCase();
};

const COMPARE_LINE_COLORS = ["#7C3AED", "#2563EB", "#F59E0B"];

const getChartProjectIdentity = (item?: any): string => {
  const projectData = item?.projectData || {};

  return String(
    projectData?.coingeckoId ||
      item?.coingeckoId ||
      projectData?.marketAssetId ||
      item?.marketAssetId ||
      projectData?._id ||
      item?._id ||
      item?.id ||
      ""
  ).trim();
};

const normalizeHistoryTimestamp = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;

  const numericTimestamp = Number(value);
  if (Number.isFinite(numericTimestamp)) {
    return numericTimestamp > 0 && numericTimestamp < 10000000000
      ? numericTimestamp * 1000
      : numericTimestamp;
  }

  const parsedTimestamp = moment(value);
  return parsedTimestamp.isValid() ? parsedTimestamp.valueOf() : 0;
};

const getHistoryTimestamp = (item: any): number => {
  return (
    normalizeHistoryTimestamp(item?.timestamp) ||
    normalizeHistoryTimestamp(item?.createdAt) ||
    normalizeHistoryTimestamp(item?.date)
  );
};

const getTimelineValue = (selectedMetric: MetricType, item: any): number | null => {
  const value = Number(getMetricValue(selectedMetric, item));
  return Number.isFinite(value) ? value : null;
};

const getTimelineLabelFormat = (range: RangeType): string => {
  switch (range) {
    case "24H":
      return "HH:mm";
    case "7D":
    case "30D":
      return "MMM D";
    case "90D":
      return "MMM D";
    case "1Y":
      return "MMM YY";
    case "ALL":
      return "MMM YYYY";
    default:
      return "MMM D";
  }
};

const formatTimelineValue = (selectedMetric: MetricType, value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: selectedMetric === "marketCap" ? "compact" : "standard",
    maximumFractionDigits: selectedMetric === "marketCap" ? 2 : value >= 1 ? 2 : 8,
  }).format(value);
};

const formatTimelineChange = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

type TimelineBarDatum = {
  height: number;
  variant: "positive" | "negative" | "neutral";
  timestamp: number;
  value: number;
  changePercent: number | null;
  dateLabel: string;
  metricLabel: string;
  valueLabel: string;
  changeLabel: string | null;
  ariaLabel: string;
};

type TimelineSectionDatum = {
  index: number;
  startTimestamp: number;
  endTimestamp: number;
  label: string;
  ariaLabel: string;
  bars: Array<TimelineBarDatum & { globalIndex: number }>;
};

const buildTimelineBars = (
  history: Array<any>,
  selectedMetric: MetricType,
  selectedRange: RangeType
): TimelineBarDatum[] => {
  const sortedPoints = history
    .map((item) => ({
      timestamp: getHistoryTimestamp(item),
      value: getTimelineValue(selectedMetric, item),
    }))
    .filter((item): item is { timestamp: number; value: number } =>
      Boolean(item.timestamp && Number.isFinite(item.value))
    )
    .sort((a, b) => a.timestamp - b.timestamp);
  const points = Array.from(
    sortedPoints
      .reduce(
        (acc, item) => acc.set(item.timestamp, item),
        new Map<number, { timestamp: number; value: number }>()
      )
      .values()
  );

  if (!points.length) return [];

  const barCount = Math.min(64, points.length);
  const sampled = Array.from({ length: barCount }, (_, index) => {
    const pointIndex = Math.round((index / Math.max(1, barCount - 1)) * (points.length - 1));
    return points[pointIndex];
  });
  const values = sampled.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return sampled.map((item, index) => {
    const previous = index > 0 ? sampled[index - 1].value : item.value;
    const delta = item.value - previous;
    const changePercent =
      index > 0 && previous !== 0 ? (delta / Math.abs(previous)) * 100 : null;
    const dateLabel = moment(item.timestamp).format(
      selectedRange === "24H" ? "MMM D, HH:mm" : "MMM D, YYYY"
    );
    const metricLabel = selectedMetric === "marketCap" ? "Market Cap" : "Price";
    const valueLabel = formatTimelineValue(selectedMetric, item.value);
    const changeLabel =
      changePercent === null ? null : formatTimelineChange(changePercent);

    return {
      height: 8 + ((item.value - minValue) / range) * 34,
      timestamp: item.timestamp,
      value: item.value,
      changePercent,
      dateLabel,
      metricLabel,
      valueLabel,
      changeLabel,
      ariaLabel: [
        dateLabel,
        `${metricLabel.toLowerCase()} ${valueLabel}`,
        changeLabel ? `change ${changeLabel}` : null,
      ]
        .filter(Boolean)
        .join(", "),
      variant:
        Math.abs(delta) / Math.max(1, Math.abs(previous)) < 0.001
          ? "neutral"
          : delta > 0
            ? "positive"
            : "negative",
    };
  });
};

const getTimelineSectionCount = (selectedRange: RangeType): number =>
  selectedRange === "ALL" ? 5 : 4;

const formatTimelineSectionLabel = (
  startTimestamp: number,
  endTimestamp: number,
  selectedRange: RangeType
): string => {
  const format = getTimelineLabelFormat(selectedRange);
  const start = moment(startTimestamp).format(format);
  const end = moment(endTimestamp).format(format);

  return start === end ? start : `${start} - ${end}`;
};

const buildTimelineSections = (
  bars: TimelineBarDatum[],
  selectedRange: RangeType
): TimelineSectionDatum[] => {
  if (!bars.length) return [];

  const sectionCount = Math.min(getTimelineSectionCount(selectedRange), bars.length);

  return Array.from({ length: sectionCount }, (_, sectionIndex) => {
    const startIndex = Math.floor((sectionIndex * bars.length) / sectionCount);
    const endIndex =
      sectionIndex === sectionCount - 1
        ? bars.length - 1
        : Math.max(
            startIndex,
            Math.floor(((sectionIndex + 1) * bars.length) / sectionCount) - 1
          );
    const sectionBars = bars
      .slice(startIndex, endIndex + 1)
      .map((bar, index) => ({ ...bar, globalIndex: startIndex + index }));
    const startTimestamp = sectionBars[0]?.timestamp || 0;
    const endTimestamp = sectionBars[sectionBars.length - 1]?.timestamp || startTimestamp;
    const label = formatTimelineSectionLabel(
      startTimestamp,
      endTimestamp,
      selectedRange
    );

    return {
      index: sectionIndex,
      startTimestamp,
      endTimestamp,
      label,
      ariaLabel: `Show chart range ${label}`,
      bars: sectionBars,
    };
  });
};

const getHistoryRangeBounds = (
  history: Array<any>,
  selectedRange: RangeType
): [Date, Date] | null => {
  const timestamps = history
    .map(getHistoryTimestamp)
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0)
    .sort((left, right) => left - right);

  if (!timestamps.length) return null;

  const startTimestamp = timestamps[0];
  const endTimestamp = timestamps[timestamps.length - 1];
  const end = moment(endTimestamp);
  let start = moment(startTimestamp);

  switch (selectedRange) {
    case "24H":
      start = end.clone().subtract(24, "hours");
      break;
    case "7D":
      start = end.clone().subtract(7, "days");
      break;
    case "30D":
      start = end.clone().subtract(30, "days");
      break;
    case "90D":
      start = end.clone().subtract(90, "days");
      break;
    case "1Y":
      start = end.clone().subtract(1, "years");
      break;
    case "ALL":
    default:
      start = moment(startTimestamp);
      break;
  }

  return [
    new Date(Math.max(start.valueOf(), startTimestamp)),
    new Date(endTimestamp),
  ];
};

const filterHistoryByRange = (
  history: Array<any>,
  range: [Date, Date] | null
): Array<any> => {
  if (!range) return history;

  const startTimestamp = range[0].getTime();
  const endTimestamp = range[1].getTime();

  return history.filter((item) => {
    const timestamp = getHistoryTimestamp(item);
    return timestamp >= startTimestamp && timestamp <= endTimestamp;
  });
};

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

interface PriceChartProps {
  project?: any;
  compactMode?: boolean;
  onCompactModeChange?: (value: boolean) => void;
  onLoadingStateChange?: (value: boolean) => void;
}

const PriceChart: React.FC<PriceChartProps> = ({
  project,
  compactMode = false,
  onCompactModeChange,
  onLoadingStateChange,
}) => {
  const router = useRouter();
  const isDesktopChartLayout = useMediaQuery("(min-width: 1025px)");
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("price");
  const [selectedRange, setSelectedRange] = useState<RangeType>("30D");
  const [customRange, setCustomRange] = useState<[Date, Date] | null>(null);
  const [isScreenModal, setIsScreenModal] = useState<boolean>(false);
  const [htmlData, setHtmlData] = useState<HTMLDivElement | null>(null);
  const [isCompareDropdownOpen, setIsCompareDropdownOpen] = useState(false);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [activeTimelineTooltipIndex, setActiveTimelineTooltipIndex] = useState<
    number | null
  >(null);
  const [activeTimelineSectionIndex, setActiveTimelineSectionIndex] = useState<
    number | null
  >(null);
  const [chartView, setChartView] = useState<"Line" | "Candles" | "Compare">(
    "Line"
  );
  const [projectsToCompare, setProjectsToCompare] = useState<Array<any>>([]);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const projectHistory = project?.history || [];
  const hasLocalChartHistory = Array.isArray(projectHistory) && projectHistory.length > 0;
  const isV2MarketProject =
    project?.projectType === "market" && Boolean(project?.coingeckoId);
  const isMarketProjectRoute =
    router.pathname === "/market/[coingeckoId]" ||
    router.asPath?.startsWith("/market/");
  const useMarketProjectChartLayout = isMarketProjectRoute;
  const projectChartIdentity =
    project?.coingeckoId || project?.marketAssetId || project?._id || "";
  const compareProject1 = projectsToCompare[0];
  const compareProject2 = projectsToCompare[1];
  const compareProject3 = projectsToCompare[2];
  const compareChartIdentity1 = getChartProjectIdentity(compareProject1);
  const compareChartIdentity2 = getChartProjectIdentity(compareProject2);
  const compareChartIdentity3 = getChartProjectIdentity(compareProject3);
  const projectTokenSymbol = getChartTokenSymbol(project);
  const allChartDataRange: RangeType = "ALL";
  const selectedChartDataRange: RangeType = selectedRange;
  const shouldFetchAllChartHistory = selectedChartDataRange !== allChartDataRange;
  const customRangeStartMs = customRange?.[0]?.getTime() ?? null;
  const customRangeEndMs = customRange?.[1]?.getTime() ?? null;
  const hasValidCustomRange =
    customRangeStartMs !== null &&
    customRangeEndMs !== null &&
    customRangeEndMs > customRangeStartMs;

  const {
    data: selectedProjectChartData,
    isLoading: isSelectedProjectChartLoading,
    isFetching: isSelectedProjectChartFetching,
  } = useQuery(
    ["project-chart", project?._id, selectedChartDataRange],
    () => {
      return fetchChartData({
        ids: project?._id || "",
        entityType: "project",
        chartType: getChartType(selectedChartDataRange),
      });
    },
    {
      enabled:
        Boolean(project?._id) && !hasLocalChartHistory && !isV2MarketProject,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const {
    data: allProjectChartData,
    isLoading: isAllProjectChartLoading,
    isFetching: isAllProjectChartFetching,
  } = useQuery(
    ["project-chart", project?._id, allChartDataRange],
    () => {
      return fetchChartData({
        ids: project?._id || "",
        entityType: "project",
        chartType: getChartType(allChartDataRange),
      });
    },
    {
      enabled:
        shouldFetchAllChartHistory &&
        Boolean(project?._id) &&
        !hasLocalChartHistory &&
        !isV2MarketProject,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const selectedMarketChartData = useQuery(
    ["market-project-chart-v2", projectChartIdentity, selectedChartDataRange],
    () =>
      fetchMarketProjectChart({
        id: String(projectChartIdentity),
        range: selectedChartDataRange,
      }),
    {
      enabled: isV2MarketProject && Boolean(projectChartIdentity),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const allMarketChartData = useQuery(
    ["market-project-chart-v2", projectChartIdentity, allChartDataRange],
    () =>
      fetchMarketProjectChart({
        id: String(projectChartIdentity),
        range: allChartDataRange,
      }),
    {
      enabled:
        shouldFetchAllChartHistory &&
        isV2MarketProject &&
        Boolean(projectChartIdentity),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const customMarketChartData = useQuery(
    [
      "market-project-chart-v2-custom",
      projectChartIdentity,
      customRangeStartMs,
      customRangeEndMs,
    ],
    () =>
      fetchMarketProjectChart({
        id: String(projectChartIdentity),
        range: "CUSTOM",
        from: customRangeStartMs ?? undefined,
        to: customRangeEndMs ?? undefined,
      }),
    {
      enabled:
        hasValidCustomRange &&
        isV2MarketProject &&
        Boolean(projectChartIdentity),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const fetchCompareChartData = (
    compareProject: any,
    compareIdentity: string,
    range: RangeType | "CUSTOM",
    customDates?: { from?: number | null; to?: number | null }
  ) => {
    if (isV2MarketProject) {
      return fetchMarketProjectChart({
        id: String(compareIdentity),
        range,
        from: customDates?.from ?? undefined,
        to: customDates?.to ?? undefined,
      });
    }

    return fetchChartData({
      ids: compareProject?._id || "",
      entityType: "project",
      chartType: getChartType(range === "CUSTOM" ? selectedChartDataRange : range),
    });
  };
  const compareChartData1 = useQuery(
    ["project-chart-compare", 1, compareChartIdentity1, selectedChartDataRange, isV2MarketProject],
    () => fetchCompareChartData(compareProject1, compareChartIdentity1, selectedChartDataRange),
    {
      enabled: chartView === "Compare" && Boolean(isV2MarketProject ? compareChartIdentity1 : compareProject1?._id),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const compareChartData2 = useQuery(
    ["project-chart-compare", 2, compareChartIdentity2, selectedChartDataRange, isV2MarketProject],
    () => fetchCompareChartData(compareProject2, compareChartIdentity2, selectedChartDataRange),
    {
      enabled: chartView === "Compare" && Boolean(isV2MarketProject ? compareChartIdentity2 : compareProject2?._id),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const compareChartData3 = useQuery(
    ["project-chart-compare", 3, compareChartIdentity3, selectedChartDataRange, isV2MarketProject],
    () => fetchCompareChartData(compareProject3, compareChartIdentity3, selectedChartDataRange),
    {
      enabled: chartView === "Compare" && Boolean(isV2MarketProject ? compareChartIdentity3 : compareProject3?._id),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const allCompareChartData1 = useQuery(
    ["project-chart-compare", 1, compareChartIdentity1, allChartDataRange, isV2MarketProject],
    () => fetchCompareChartData(compareProject1, compareChartIdentity1, allChartDataRange),
    {
      enabled:
        shouldFetchAllChartHistory &&
        chartView === "Compare" &&
        Boolean(isV2MarketProject ? compareChartIdentity1 : compareProject1?._id),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const allCompareChartData2 = useQuery(
    ["project-chart-compare", 2, compareChartIdentity2, allChartDataRange, isV2MarketProject],
    () => fetchCompareChartData(compareProject2, compareChartIdentity2, allChartDataRange),
    {
      enabled:
        shouldFetchAllChartHistory &&
        chartView === "Compare" &&
        Boolean(isV2MarketProject ? compareChartIdentity2 : compareProject2?._id),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const allCompareChartData3 = useQuery(
    ["project-chart-compare", 3, compareChartIdentity3, allChartDataRange, isV2MarketProject],
    () => fetchCompareChartData(compareProject3, compareChartIdentity3, allChartDataRange),
    {
      enabled:
        shouldFetchAllChartHistory &&
        chartView === "Compare" &&
        Boolean(isV2MarketProject ? compareChartIdentity3 : compareProject3?._id),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const customCompareChartData1 = useQuery(
    [
      "project-chart-compare-custom",
      1,
      compareChartIdentity1,
      customRangeStartMs,
      customRangeEndMs,
      isV2MarketProject,
    ],
    () =>
      fetchCompareChartData(compareProject1, compareChartIdentity1, "CUSTOM", {
        from: customRangeStartMs,
        to: customRangeEndMs,
      }),
    {
      enabled:
        hasValidCustomRange &&
        chartView === "Compare" &&
        isV2MarketProject &&
        Boolean(compareChartIdentity1),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const customCompareChartData2 = useQuery(
    [
      "project-chart-compare-custom",
      2,
      compareChartIdentity2,
      customRangeStartMs,
      customRangeEndMs,
      isV2MarketProject,
    ],
    () =>
      fetchCompareChartData(compareProject2, compareChartIdentity2, "CUSTOM", {
        from: customRangeStartMs,
        to: customRangeEndMs,
      }),
    {
      enabled:
        hasValidCustomRange &&
        chartView === "Compare" &&
        isV2MarketProject &&
        Boolean(compareChartIdentity2),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const customCompareChartData3 = useQuery(
    [
      "project-chart-compare-custom",
      3,
      compareChartIdentity3,
      customRangeStartMs,
      customRangeEndMs,
      isV2MarketProject,
    ],
    () =>
      fetchCompareChartData(compareProject3, compareChartIdentity3, "CUSTOM", {
        from: customRangeStartMs,
        to: customRangeEndMs,
      }),
    {
      enabled:
        hasValidCustomRange &&
        chartView === "Compare" &&
        isV2MarketProject &&
        Boolean(compareChartIdentity3),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const selectedCompareQueries = [compareChartData1, compareChartData2, compareChartData3];
  const allCompareQueries = [
    shouldFetchAllChartHistory ? allCompareChartData1 : compareChartData1,
    shouldFetchAllChartHistory ? allCompareChartData2 : compareChartData2,
    shouldFetchAllChartHistory ? allCompareChartData3 : compareChartData3,
  ];
  const customCompareQueries = [
    customCompareChartData1,
    customCompareChartData2,
    customCompareChartData3,
  ];
  const activeCompareQueries =
    hasValidCustomRange && isV2MarketProject
      ? customCompareQueries
      : customRange
        ? allCompareQueries
        : selectedCompareQueries;
  const isCompareChartFetching =
    chartView === "Compare" &&
    Boolean(projectsToCompare.length) &&
    activeCompareQueries.some((query, index) =>
      Boolean(projectsToCompare[index]) && (query.isLoading || query.isFetching)
    );
  const selectedBaseChartHistory = isV2MarketProject
    ? selectedMarketChartData.data?.data || []
    : hasLocalChartHistory
      ? projectHistory
      : selectedProjectChartData?.data || [];
  const customBaseChartHistory =
    isV2MarketProject && hasValidCustomRange
      ? customMarketChartData.data?.data || []
      : [];
  const hasCustomBaseChartResponse =
    isV2MarketProject &&
    hasValidCustomRange &&
    (customMarketChartData.isSuccess || Boolean(customMarketChartData.data));
  const allBaseChartHistory = isV2MarketProject
    ? shouldFetchAllChartHistory
      ? allMarketChartData.data?.data || selectedBaseChartHistory
      : selectedBaseChartHistory
    : hasLocalChartHistory
      ? projectHistory
      : shouldFetchAllChartHistory
      ? allProjectChartData?.data || selectedBaseChartHistory
      : selectedBaseChartHistory;
  const chartBaseHistory =
    customRange && isV2MarketProject
      ? hasCustomBaseChartResponse
        ? customBaseChartHistory
        : selectedBaseChartHistory
      : customRange
        ? allBaseChartHistory
        : selectedBaseChartHistory;
  const activeChartRange = useMemo(
    () => customRange || getHistoryRangeBounds(chartBaseHistory, selectedRange),
    [chartBaseHistory, customRange, selectedRange]
  );
  const activeTimelineHistory = useMemo(() => {
    const chartRangeHistory = filterHistoryByRange(chartBaseHistory, activeChartRange);
    if (chartRangeHistory.length) return chartRangeHistory;

    const allRangeHistory = filterHistoryByRange(allBaseChartHistory, activeChartRange);
    if (allRangeHistory.length) return allRangeHistory;

    return chartBaseHistory.length ? chartBaseHistory : allBaseChartHistory;
  }, [activeChartRange, allBaseChartHistory, chartBaseHistory]);
  const timelineBars = useMemo(
    () => buildTimelineBars(activeTimelineHistory, selectedMetric, selectedRange),
    [activeTimelineHistory, selectedMetric, selectedRange]
  );
  const timelineSections = useMemo(
    () => buildTimelineSections(timelineBars, selectedRange),
    [selectedRange, timelineBars]
  );
  const compareSeries: CompareChartSeries[] = useMemo(
    () =>
      projectsToCompare.slice(0, 3).map((item, index) => {
        const projectData = item?.projectData || {};
        return {
          key: getChartProjectIdentity(item) || String(index),
          name: projectData?.name || item?.name || getChartTokenSymbol(item),
          symbol: getChartTokenSymbol(item),
          logo: projectData?.logo || item?.logo || "",
          color: COMPARE_LINE_COLORS[index],
          history: activeCompareQueries[index]?.data?.data || [],
        };
      }),
    [
      customRange,
      compareChartData1.data?.data,
      compareChartData2.data?.data,
      compareChartData3.data?.data,
      allCompareChartData1.data?.data,
      allCompareChartData2.data?.data,
      allCompareChartData3.data?.data,
      customCompareChartData1.data?.data,
      customCompareChartData2.data?.data,
      customCompareChartData3.data?.data,
      projectsToCompare,
    ]
  );
  const hasBaseChartData = Array.isArray(chartBaseHistory) && chartBaseHistory.length > 0;
  const isSelectedBaseChartFetching =
    chartView !== "Candles" &&
    (isV2MarketProject
      ? selectedMarketChartData.isLoading || selectedMarketChartData.isFetching
      : !hasLocalChartHistory &&
        (isSelectedProjectChartLoading || isSelectedProjectChartFetching));
  const isAllBaseChartFetching =
    chartView !== "Candles" &&
    customRange !== null &&
    !isV2MarketProject &&
    shouldFetchAllChartHistory &&
    !hasLocalChartHistory &&
    (isAllProjectChartLoading || isAllProjectChartFetching);
  const isCustomBaseChartFetching =
    chartView !== "Candles" &&
    hasValidCustomRange &&
    isV2MarketProject &&
    (customMarketChartData.isLoading || customMarketChartData.isFetching);
  const isBaseChartFetching =
    isSelectedBaseChartFetching ||
    isAllBaseChartFetching ||
    isCustomBaseChartFetching;
  const isChartBusy =
    chartView !== "Candles" && (isBaseChartFetching || isCompareChartFetching);
  const isInitialChartLoading = isChartBusy && !hasBaseChartData;
  const isChartUpdating = isChartBusy && !isInitialChartLoading;
  const shouldShowChartSkeleton = isInitialChartLoading;
  const shouldDimChartBody = isChartUpdating && !isInitialChartLoading;
  const shouldFillCompactChart =
    useMarketProjectChartLayout && compactMode && isDesktopChartLayout;
  const shouldFillChartHeight = isChartFullscreen || shouldFillCompactChart;
  const chartHeight = shouldFillChartHeight ? "100%" : 340;

  useEffect(() => {
    onLoadingStateChange?.(isChartUpdating);

    return () => onLoadingStateChange?.(false);
  }, [isChartUpdating, onLoadingStateChange]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsChartFullscreen(document.fullscreenElement === chartRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleTimeRangeChange = (range: any): void => {
    setSelectedRange(range);
    setCustomRange(null);
    setActiveTimelineTooltipIndex(null);
    setActiveTimelineSectionIndex(null);
  };

  const handleChartCustomRangeChange = (range: [Date, Date]): void => {
    setCustomRange(range);
    setActiveTimelineSectionIndex(null);
    setActiveTimelineTooltipIndex(null);
  };

  const toggleProjectToCompate = (items: Array<any>): void => {
    const nextItems = items.slice(0, 3);
    setProjectsToCompare(nextItems);
    setChartView(nextItems.length ? "Compare" : "Line");
    setCustomRange(null);
    setActiveTimelineSectionIndex(null);
  };

  const removeCompareProject = (identity: string): void => {
    toggleProjectToCompate(
      projectsToCompare.filter((item) => getChartProjectIdentity(item) !== identity)
    );
  };

  const resetCompareProjects = (): void => {
    setProjectsToCompare([]);
    setChartView("Line");
    setIsCompareDropdownOpen(false);
    setCustomRange(null);
    setActiveTimelineSectionIndex(null);
    setActiveTimelineTooltipIndex(null);
  };

  const toggleChartFullscreen = async (): Promise<void> => {
    const element = chartRef.current;
    if (!element) return;

    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen();
        return;
      }

      await element.requestFullscreen();
    } catch (error) {
      console.error("Could not toggle chart fullscreen", error);
    }
  };

  const handleScreenshotClick = async (): Promise<void> => {
    const element = chartRef.current;
    if (!element) return;

    setHtmlData(element);

    if (document.fullscreenElement === element || isChartFullscreen) {
      try {
        await captureElementAsPng(element, {
          download: true,
          fileName: `${project?.coingeckoId || project?.name || "fomo"}-price-chart.png`,
          preserveRenderedSize: true,
        });
      } catch (error) {
        console.error("Could not capture fullscreen chart", error);
        toast.error("Failed to capture the screenshot.");
      }
      return;
    }

    setIsScreenModal(true);
  };

  const handleTimelineSectionClick = (section: TimelineSectionDatum): void => {
    if (!section.bars.length) return;
    setActiveTimelineTooltipIndex(null);

    const startTimestamp = section.startTimestamp;
    const endTimestamp = section.endTimestamp;

    if (!startTimestamp || !endTimestamp || startTimestamp === endTimestamp) return;
    setCustomRange([new Date(startTimestamp), new Date(endTimestamp)]);
    setActiveTimelineSectionIndex(section.index);
  };

  return (
    <>
      <ChartContainer
        ref={chartRef}
        $compactFill={shouldFillCompactChart}
        className={useMarketProjectChartLayout ? "market-project-price-chart" : undefined}
      >
        <ChartHeader>
          <ChangeValues>
            <div className="price">
              <TimeButton
                onClick={() => setSelectedMetric("price")}
                active={selectedMetric === "price"}
              >
                Price
              </TimeButton>
              <TimeButton
                onClick={() => setSelectedMetric("marketCap")}
                active={selectedMetric === "marketCap"}
              >
                Market Cap
              </TimeButton>
            </div>
            <div className="compare">
              <TimeButton
                onClick={() => {
                  setChartView("Line");
                  setIsCompareDropdownOpen(false);
                }}
                active={chartView === "Line"}
                className="img-btn"
                style={{ width: "fit-content" }}
              >
                <ChartLine />
              </TimeButton>
              <TimeButton
                onClick={() => {
                  setChartView("Candles");
                  setIsCompareDropdownOpen(false);
                }}
                active={chartView === "Candles"}
                className="img-btn"
                style={{ width: "fit-content" }}
              >
                <ChartCandlestick />
              </TimeButton>
              <CompareWrapper>
                <TimeButton
                  className="compare-btn"
                  onClick={() => {
                    setChartView("Compare");
                    setIsCompareDropdownOpen((value) => !value);
                  }}
                  active={chartView === "Compare" || isCompareDropdownOpen}
                >
                  <GitCompareArrows />
                  Compare
                </TimeButton>
                <CompareProjects
                  projectsToCompare={projectsToCompare}
                  toggleProjectToCompate={toggleProjectToCompate}
                  isVisible={isCompareDropdownOpen}
                  initialProject={project}
                  onRequestClose={() => setIsCompareDropdownOpen(false)}
                />
              </CompareWrapper>
              {chartView === "Compare" ? (
                <TimeButton
                  className="compare-btn"
                  onClick={resetCompareProjects}
                  active={false}
                  type="button"
                >
                  <RotateCcw />
                  Reset
                </TimeButton>
              ) : null}
            </div>
          </ChangeValues>

          <TimeRangeButtons>
            <div className="time-range-presets">
              {["24H", "7D", "30D", "90D", "1Y", "ALL"].map((range: any) => (
                <TimeButton
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  active={!customRange && selectedRange === range}
                >
                  {range}
                </TimeButton>
              ))}
            </div>
            <div className="chart-utility-actions">
              <button
                type="button"
                aria-label={isChartFullscreen ? "Download chart screenshot" : "Open screenshot preview"}
                onClick={handleScreenshotClick}
                className="photo-btn"
              >
                <Camera />
              </button>
              <button
                type="button"
                aria-label={isChartFullscreen ? "Exit fullscreen" : "Open fullscreen"}
                onClick={toggleChartFullscreen}
                className="fullscreen-btn"
              >
                {isChartFullscreen ? <Minimize2 /> : <Maximize2 />}
              </button>
              <button
                type="button"
                aria-label={compactMode ? "Full view" : "Compact view"}
                onClick={() => onCompactModeChange?.(!compactMode)}
                className="compact-btn"
              >
                {compactMode ? <PanelTopOpen /> : <PanelRightOpen />}
              </button>
            </div>
          </TimeRangeButtons>
        </ChartHeader>
        <ChartTokens>
          <button>
            <div className="green" />
            <span>{projectTokenSymbol}</span>
          </button>
          {projectsToCompare?.length ? (
            projectsToCompare.map((item: any, index: number) => {
              const identity = getChartProjectIdentity(item);
              return (
                <button key={identity || index} onClick={() => removeCompareProject(identity)}>
                  <div style={{ background: COMPARE_LINE_COLORS[index] }} />
                  <span>{getChartTokenSymbol(item)}</span>
                  <X />
                </button>
              );
            })
          ) : (
            <></>
          )}
        </ChartTokens>
        <ChartBody
          aria-busy={isChartBusy}
          $isUpdating={shouldDimChartBody}
          $compactFill={shouldFillCompactChart}
        >
          {shouldShowChartSkeleton ? (
            <ChartLoadingSkeleton
              height={shouldFillChartHeight ? "100%" : "340px"}
              marginTop="0"
              variant={compactMode ? "compact" : "default"}
            />
          ) : chartView === "Candles" ? (
            <TradingViewChart
              symbol={`BINANCE:${project.symbol || "BTC"}USDT`}
              height={shouldFillChartHeight ? "100%" : 500}
            />
          ) : projectsToCompare?.length && chartView === "Compare" ? (
            <ComparisonChartBody
              selectedMetric={selectedMetric}
              selectedRange={selectedRange}
              name1={project.name}
              history1={chartBaseHistory}
              timelineHistory1={allBaseChartHistory}
              logo1={project.logo || ""}
              compareSeries={compareSeries}
              customRange={activeChartRange}
              setCustomRange={handleChartCustomRangeChange}
              noTopMargin
              chartVariant="dark"
              rangeSelectorVariant="dark"
              chartHeight={chartHeight}
              fillHeight={shouldFillChartHeight}
            />
          ) : (
            <UniversalChartBody
              name={project?.name || ""}
              selectedMetric={selectedMetric}
              selectedRange={selectedRange}
              setSelectedMetric={setSelectedMetric}
              setSelectedRange={setSelectedRange}
              history={chartBaseHistory}
              timelineHistory={allBaseChartHistory}
              customRange={activeChartRange}
              setCustomRange={handleChartCustomRangeChange}
              noTopMargin
              chartVariant="dark"
              rangeSelectorVariant="dark"
              chartHeight={chartHeight}
              fillHeight={shouldFillChartHeight}
              priceChange={project?.priceChange ?? null}
            />
          )}
        </ChartBody>
        <ChartsWrapper />

        <PriceDetails>
          {isInitialChartLoading ? (
            <></>
          ) : timelineSections.length ? (
            <TimelineWrapper>
              <TimelineBars $sectionCount={timelineSections.length}>
                {timelineSections.map((section) => {
                  const isActive =
                    customRange !== null &&
                    activeTimelineSectionIndex === section.index;

                  return (
                    <TimelineSection
                      key={`${section.startTimestamp}-${section.endTimestamp}`}
                      role="button"
                      tabIndex={0}
                      aria-label={section.ariaLabel}
                      $active={isActive}
                      onClick={() => handleTimelineSectionClick(section)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setActiveTimelineTooltipIndex(null);
                          return;
                        }

                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleTimelineSectionClick(section);
                        }
                      }}
                    >
                      <TimelineSectionBars>
                        {section.bars.map((bar) => {
                          const tooltipId = `timeline-bar-tooltip-${bar.globalIndex}`;
                          const placement =
                            section.index === 0
                              ? "start"
                              : section.index === timelineSections.length - 1
                                ? "end"
                                : "center";

                          return (
                            <TimelineBarSlot
                              key={bar.globalIndex}
                              onMouseEnter={() =>
                                setActiveTimelineTooltipIndex(bar.globalIndex)
                              }
                              onMouseLeave={() =>
                                setActiveTimelineTooltipIndex(null)
                              }
                            >
                              <TimelineBar
                                aria-label={bar.ariaLabel}
                                aria-describedby={tooltipId}
                                $height={bar.height}
                                $variant={bar.variant}
                              />
                              {activeTimelineTooltipIndex === bar.globalIndex ? (
                                <TimelineTooltip
                                  id={tooltipId}
                                  role="tooltip"
                                  $placement={placement}
                                >
                                  <TimelineTooltipDate>
                                    {bar.dateLabel}
                                  </TimelineTooltipDate>
                                  <TimelineTooltipRow>
                                    <span>{bar.metricLabel}</span>
                                    <span>{bar.valueLabel}</span>
                                  </TimelineTooltipRow>
                                  {bar.changeLabel ? (
                                    <TimelineTooltipRow $variant={bar.variant}>
                                      <span>Change</span>
                                      <span>{bar.changeLabel}</span>
                                    </TimelineTooltipRow>
                                  ) : null}
                                </TimelineTooltip>
                              ) : null}
                            </TimelineBarSlot>
                          );
                        })}
                      </TimelineSectionBars>
                    </TimelineSection>
                  );
                })}
              </TimelineBars>
              <TimelineLabels $sectionCount={timelineSections.length}>
                {timelineSections.map((section) => {
                  const labelParts = section.label.split(" - ");

                  return (
                    <span key={`${section.label}-${section.index}`}>
                      {labelParts.map((labelPart, labelPartIndex) => (
                        <React.Fragment key={`${labelPart}-${labelPartIndex}`}>
                          {labelPartIndex > 0 ? (
                            <span
                              aria-hidden="true"
                              className="timeline-label-separator"
                            >
                              {" - "}
                            </span>
                          ) : null}
                          <span className="timeline-label-part">{labelPart}</span>
                        </React.Fragment>
                      ))}
                    </span>
                  );
                })}
              </TimelineLabels>
            </TimelineWrapper>
          ) : (
            <></>
          )}
        </PriceDetails>
      </ChartContainer>
      <SaveShareModal
        name={`${project?.name}/Price Chart`}
        link={`https://www.fomo.cx/${project?.coingeckoId ? `market/${project.coingeckoId}` : `crypto/project/${project?._id}`}`}
        html={htmlData || chartRef.current}
        isVisible={isScreenModal}
        onClose={() => setIsScreenModal(false)}
      />
    </>
  );
};

export default PriceChart;

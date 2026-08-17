import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "react-query";
import { Camera, Maximize2, Minimize2 } from "lucide-react";
import { fetchPortfolioChart } from "../../../../../http/portfolio";
import {
  IPortfolio,
  IPortfolioPriceData,
} from "../../../../../types/global_types";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";
import SaveShareModal from "../../../../global/modals/SaveShareModal";
import { PORTFOLIO_DETAIL_REFETCH_INTERVAL_MS } from "../constants";
import {
  buildSensitiveDomain,
  createPortfolioAxisFormatter,
  getReadableAuxiliaryValues,
} from "./chartModel";
import {
  ChartCard,
  Content,
  ControlButton,
  ControlGroup,
  ControlSection,
  EmptyState,
  ErrorNotice,
  Header,
  IconButton,
  Legend,
  LegendItem,
  MetricChange,
  MetricLabel,
  MetricSummary,
  MetricValue,
  MetricValueBlock,
  MetricValueRow,
  Plot,
  RangeDot,
  ScreenReaderStatus,
  Skeleton,
  SkeletonHeader,
  SkeletonTrace,
  Toolbar,
  TooltipCard,
  TooltipDate,
  TooltipHeader,
  TooltipLabel,
  TooltipRow,
  TooltipRows,
  TooltipTitle,
  TooltipValue,
  UpdatingBadge,
} from "./styles";

export const CORE_PORTFOLIO_CHART_RANGES = [
  "24H",
  "7D",
  "30D",
  "90D",
  "1Y",
  "ALL",
] as const;

export type CorePortfolioChartRange =
  (typeof CORE_PORTFOLIO_CHART_RANGES)[number];
export type CorePortfolioChartMetric = "balance" | "profit" | "roi";

export interface CorePortfolioChartProps {
  portfolio: IPortfolio;
  isPublic?: boolean;
  className?: string;
}

type PortfolioHistoryPayload = IPortfolioPriceData;

type NormalizedPortfolioPoint = {
  timestamp: number;
  totalBalance: number;
  totalProfit: number;
  totalProfitPercent: number;
  netInvested: number;
  isCurrent: boolean;
  isApproximation: boolean;
};

type RenderedPortfolioPoint = NormalizedPortfolioPoint & {
  value: number;
};

type ChangeVariant = "positive" | "negative" | "neutral";

type AxisModel = {
  domain: [number, number];
  ticks: number[];
  gutterWidth: number;
  formatValue: (value: number) => string;
  showInvestedLine: boolean;
};

const METRICS: Array<{
  value: CorePortfolioChartMetric;
  label: string;
}> = [
  { value: "balance", label: "Balance" },
  { value: "profit", label: "P&L" },
  { value: "roi", label: "ROI" },
];

const NEGATIVE_COLOR = "#ff5858";
const POSITIVE_COLOR = "var(--main-green)";
const INVESTED_COLOR = "#738094";

const getChartType = (range: CorePortfolioChartRange): string => {
  const chartTypes: Record<CorePortfolioChartRange, string> = {
    "24H": "chart24h",
    "7D": "chart7d",
    "30D": "chart30d",
    "90D": "chart90d",
    "1Y": "chart1y",
    ALL: "chartAll",
  };

  return chartTypes[range];
};

const toFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const normalizedValue =
    typeof value === "string" ? value.replace(/[$,%\s,]/g, "") : value;
  const numericValue = Number(normalizedValue);

  return Number.isFinite(numericValue) ? numericValue : null;
};

const toTimestamp = (value: unknown): number | null => {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === "number") {
    const timestamp =
      value > 0 && value < 10_000_000_000 ? value * 1000 : value;
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) {
    return toTimestamp(Number(value));
  }

  const parsedTimestamp = new Date(String(value || "")).getTime();
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : null;
};

const normalizePortfolioHistory = (
  history: IPortfolioPriceData[] | undefined,
  portfolio: IPortfolio
): NormalizedPortfolioPoint[] => {
  if (!Array.isArray(history)) return [];

  const totalInvested = toFiniteNumber(portfolio.totalInvested);
  const currentProfit = toFiniteNumber(portfolio.profit);
  const currentProfitPercent = toFiniteNumber(portfolio.profitPercent);
  const deduplicated = new Map<
    number,
    { payload: PortfolioHistoryPayload; balance: number }
  >();

  history.forEach((sourcePoint) => {
    const payload = sourcePoint as PortfolioHistoryPayload;
    const timestamp = toTimestamp(payload.date);
    const balance = toFiniteNumber(payload.totalBalance);

    if (timestamp === null || balance === null) return;
    deduplicated.set(timestamp, { payload, balance });
  });

  const sortedPoints = Array.from(deduplicated.entries()).sort(
    ([leftTimestamp], [rightTimestamp]) => leftTimestamp - rightTimestamp
  );

  return sortedPoints.map(([timestamp, source], index) => {
    const { payload, balance } = source;
    const isLatestPoint = index === sortedPoints.length - 1;
    const payloadProfit = toFiniteNumber(payload.totalProfit);
    const payloadInvested = toFiniteNumber(payload.totalInvested);
    const fallbackProfit =
      isLatestPoint && currentProfit !== null
        ? currentProfit
        : totalInvested !== null
          ? balance - totalInvested
          : 0;
    const totalProfit = payloadProfit ?? fallbackProfit;
    const payloadRoi = toFiniteNumber(payload.totalProfitPercent);
    const investedFromRoi =
      payloadProfit !== null && payloadRoi !== null && payloadRoi !== 0
        ? Math.abs(payloadProfit / (payloadRoi / 100))
        : null;
    const netInvested =
      payloadInvested ??
      investedFromRoi ??
      (payloadProfit !== null
        ? balance - payloadProfit
        : isLatestPoint && totalInvested !== null
          ? totalInvested
          : balance - totalProfit);
    const fallbackRoi =
      isLatestPoint && currentProfitPercent !== null
        ? currentProfitPercent
        : netInvested !== 0
          ? (totalProfit / Math.abs(netInvested)) * 100
          : 0;
    const totalProfitPercent = payloadRoi ?? fallbackRoi;
    const hasDerivedProfit = payloadProfit === null;
    const hasDerivedRoi = payloadRoi === null;

    return {
      timestamp,
      totalBalance: balance,
      totalProfit,
      totalProfitPercent,
      netInvested,
      isCurrent: Boolean(payload.isCurrent),
      isApproximation:
        Boolean(payload.isApproximation) || hasDerivedProfit || hasDerivedRoi,
    };
  });
};

const getMetricValue = (
  point: NormalizedPortfolioPoint,
  metric: CorePortfolioChartMetric
): number => {
  if (metric === "profit") return point.totalProfit;
  if (metric === "roi") return point.totalProfitPercent;
  return point.totalBalance;
};

const getMetricLabel = (metric: CorePortfolioChartMetric): string => {
  if (metric === "profit") return "Total P&L";
  if (metric === "roi") return "Return on investment";
  return "Portfolio balance";
};

const getChangeVariant = (value: number): ChangeVariant =>
  value > 0 ? "positive" : value < 0 ? "negative" : "neutral";

const formatCurrency = (
  value: number,
  options: { signed?: boolean; compact?: boolean } = {}
): string => {
  const absoluteValue = Math.abs(value);
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: options.compact ? "compact" : "standard",
    minimumFractionDigits: options.compact ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(absoluteValue);

  if (!options.signed || value === 0) return formattedValue;
  return `${value > 0 ? "+" : "-"}${formattedValue}`;
};

const formatPercent = (value: number, signed = false): string => {
  const sign = signed && value > 0 ? "+" : "";
  const maximumFractionDigits = value !== 0 && Math.abs(value) < 0.01 ? 4 : 2;

  return `${sign}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value)}%`;
};

const formatMetricValue = (
  value: number,
  metric: CorePortfolioChartMetric,
  compact = false
): string => {
  if (metric === "roi") return formatPercent(value, true);
  return formatCurrency(value, {
    signed: metric === "profit",
    compact,
  });
};

const formatMetricDelta = (
  value: number,
  metric: CorePortfolioChartMetric
): string => {
  if (metric === "roi") {
    const sign = value > 0 ? "+" : "";
    const maximumFractionDigits = value !== 0 && Math.abs(value) < 0.01 ? 4 : 2;
    const formattedValue = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits,
    }).format(value);

    return `${sign}${formattedValue} pp`;
  }

  return formatCurrency(value, { signed: true });
};

const getAxisPaddingRatio = (range: CorePortfolioChartRange): number => {
  const ratios: Record<CorePortfolioChartRange, number> = {
    "24H": 0.12,
    "7D": 0.1,
    "30D": 0.09,
    "90D": 0.085,
    "1Y": 0.075,
    ALL: 0.07,
  };

  return ratios[range];
};

const formatDateTime = (timestamp: number): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

const buildAxisModel = (
  points: RenderedPortfolioPoint[],
  metric: CorePortfolioChartMetric,
  range: CorePortfolioChartRange
): AxisModel => {
  const selectedValues = points
    .map((point) => point.value)
    .filter(Number.isFinite);
  const investedCandidates =
    metric === "balance" &&
    points.some((point) => Math.abs(point.netInvested) > 0)
      ? points.map((point) => point.netInvested)
      : [];
  const readableInvestedValues = getReadableAuxiliaryValues(
    selectedValues,
    investedCandidates
  );
  const showInvestedLine =
    investedCandidates.length > 0 && readableInvestedValues.length > 0;
  const plottedValues = [
    ...selectedValues,
    ...(showInvestedLine ? readableInvestedValues : []),
  ];
  const finiteValues = plottedValues.filter(Number.isFinite);

  if (!finiteValues.length) {
    return {
      domain: [0, 1],
      ticks: [0, 0.5, 1],
      gutterWidth: 80,
      formatValue: (value) => String(value),
      showInvestedLine: false,
    };
  }

  const minimum = Math.min(...finiteValues);
  const maximum = Math.max(...finiteValues);
  const reference = Math.max(1, Math.abs(minimum), Math.abs(maximum));
  const flatPadding =
    metric === "roi"
      ? Math.max(reference * 0.02, 0.25)
      : Math.max(reference * 0.01, metric === "profit" ? 0.5 : 0.01);
  const domain = buildSensitiveDomain(finiteValues, {
    clampMinimumAtZero: metric === "balance",
    flatPadding,
    paddingRatio: getAxisPaddingRatio(range),
  });
  const tickCount = 5;
  const currentValue = selectedValues[selectedValues.length - 1];
  const domainSpan = domain[1] - domain[0];
  const ticks = Array.from(
    { length: tickCount },
    (_, index) => domain[0] + (domainSpan * index) / (tickCount - 1)
  ).filter(
    (tick) =>
      !Number.isFinite(currentValue) ||
      (Math.abs(tick - currentValue) / domainSpan) * 330 >= 30
  );
  const formatValue = createPortfolioAxisFormatter(
    [...ticks, currentValue],
    metric
  );
  const labels = [
    ...ticks.map((tick) => formatValue(tick)),
    formatValue(currentValue),
  ];
  const gutterWidth = Math.max(
    78,
    Math.min(154, Math.max(...labels.map((label) => label.length * 7 + 24)))
  );

  return {
    domain,
    ticks,
    gutterWidth,
    formatValue,
    showInvestedLine,
  };
};

const getChartOffset = (props: any) => {
  const offset = props?.offset || {};

  return {
    left: Number(offset.left || 0),
    top: Number(offset.top || 0),
    width: Number(offset.width || 0),
    height: Number(offset.height || 0),
  };
};

const CurrentValueLayer = ({
  value,
  label,
  color,
  ...props
}: {
  value: number;
  label: string;
  color: string;
  [key: string]: any;
}) => {
  const yAxisMap = props?.yAxisMap || {};
  const yAxis = Object.values(yAxisMap)[0] as any;
  const y = Number(yAxis?.scale?.(value));
  const offset = getChartOffset(props);
  const svgWidth = Number(props?.width || offset.left + offset.width + 100);

  if (!Number.isFinite(y) || offset.width <= 0) return null;

  const badgeWidth = Math.max(62, Math.min(150, label.length * 7 + 18));
  const desiredBadgeX = offset.left + offset.width + 7;
  const badgeX = Math.min(desiredBadgeX, svgWidth - badgeWidth - 4);

  return (
    <g className="core-portfolio-current-axis" pointerEvents="none">
      <line
        x1={offset.left}
        x2={offset.left + offset.width}
        y1={y}
        y2={y}
        stroke="rgba(255, 255, 255, 0.82)"
        strokeWidth={2.5}
        strokeDasharray="3 4"
      />
      <line
        x1={offset.left}
        x2={offset.left + offset.width}
        y1={y}
        y2={y}
        stroke={color}
        strokeWidth={1.25}
        strokeDasharray="3 4"
        opacity={0.78}
      />
      <rect
        x={badgeX}
        y={y - 12}
        width={badgeWidth}
        height={24}
        rx={7}
        fill={mainGlobalDark.background}
      />
      <text
        x={badgeX + badgeWidth / 2}
        y={y}
        dy={4}
        fill={color}
        fontSize={11}
        fontWeight={600}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
};

const HoverCursor = ({
  points,
  viewBox,
}: {
  points?: Array<{ x?: number }>;
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
}) => {
  const x = Number(points?.[0]?.x);
  const top = Number(viewBox?.y || 0);
  const height = Number(viewBox?.height || 0);

  if (!Number.isFinite(x) || !Number.isFinite(top) || height <= 0) return null;

  return (
    <line
      x1={x}
      x2={x}
      y1={top}
      y2={top + height}
      stroke="rgba(12, 26, 43, 0.78)"
      strokeWidth={1.3}
      strokeDasharray="4 4"
      pointerEvents="none"
    />
  );
};

const PortfolioChartTooltip = ({
  active,
  payload,
  metric,
  accent,
  portfolioName,
}: {
  active?: boolean;
  payload?: any[];
  metric: CorePortfolioChartMetric;
  accent: string;
  portfolioName: string;
}) => {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as RenderedPortfolioPoint | undefined;
  if (!point) return null;

  const profitVariant = getChangeVariant(point.totalProfit);

  return (
    <TooltipCard>
      <TooltipHeader>
        <TooltipTitle>
          <RangeDot $color={accent} />
          <span>{portfolioName || "Portfolio"}</span>
        </TooltipTitle>
        <TooltipDate>
          {formatDateTime(point.timestamp)}
          {point.isApproximation
            ? point.isCurrent
              ? " · Live estimate"
              : " · Estimate"
            : ""}
        </TooltipDate>
      </TooltipHeader>
      <TooltipRows>
        <TooltipRow>
          <TooltipLabel>{getMetricLabel(metric)}</TooltipLabel>
          <TooltipValue
            $variant={
              metric === "profit" || metric === "roi"
                ? profitVariant
                : undefined
            }
          >
            {formatMetricValue(point.value, metric)}
          </TooltipValue>
        </TooltipRow>
        {metric !== "balance" ? (
          <TooltipRow>
            <TooltipLabel>Balance</TooltipLabel>
            <TooltipValue>{formatCurrency(point.totalBalance)}</TooltipValue>
          </TooltipRow>
        ) : null}
        {metric !== "profit" ? (
          <TooltipRow>
            <TooltipLabel>Total P&amp;L</TooltipLabel>
            <TooltipValue $variant={profitVariant}>
              {formatCurrency(point.totalProfit, { signed: true })}
            </TooltipValue>
          </TooltipRow>
        ) : null}
        {metric !== "roi" ? (
          <TooltipRow>
            <TooltipLabel>ROI</TooltipLabel>
            <TooltipValue $variant={profitVariant}>
              {formatPercent(point.totalProfitPercent, true)}
            </TooltipValue>
          </TooltipRow>
        ) : null}
        <TooltipRow>
          <TooltipLabel>Net invested</TooltipLabel>
          <TooltipValue>{formatCurrency(point.netInvested)}</TooltipValue>
        </TooltipRow>
      </TooltipRows>
    </TooltipCard>
  );
};

const ChartLoadingState = () => (
  <Skeleton aria-label="Loading portfolio performance history" role="status">
    <SkeletonHeader />
    <SkeletonTrace viewBox="0 0 620 240" preserveAspectRatio="none">
      <path d="M0 194 C42 188 65 166 99 171 C139 177 156 137 199 144 C236 150 260 111 302 120 C352 131 373 76 420 94 C460 109 489 52 526 70 C558 86 584 47 620 33" />
    </SkeletonTrace>
  </Skeleton>
);

const CorePortfolioChart: React.FC<CorePortfolioChartProps> = ({
  portfolio,
  isPublic = false,
  className,
}) => {
  const [selectedRange, setSelectedRange] =
    useState<CorePortfolioChartRange>("30D");
  const [selectedMetric, setSelectedMetric] =
    useState<CorePortfolioChartMetric>("balance");
  const [history, setHistory] = useState<NormalizedPortfolioPoint[]>([]);
  const [hasRequestError, setHasRequestError] = useState(false);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartCardRef = useRef<HTMLDivElement | null>(null);
  const gradientId = `core-portfolio-gradient-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    setHistory([]);
    setHasRequestError(false);
  }, [portfolio._id]);

  const chartQuery = useQuery(
    ["core-portfolio-chart", portfolio._id, selectedRange, isPublic],
    () =>
      fetchPortfolioChart({
        portfolioId: portfolio._id,
        chartType: getChartType(selectedRange),
        isPublic,
      }),
    {
      enabled: Boolean(portfolio._id),
      refetchOnWindowFocus: false,
      refetchInterval: PORTFOLIO_DETAIL_REFETCH_INTERVAL_MS,
      refetchIntervalInBackground: false,
      keepPreviousData: true,
      onSuccess: (response) => {
        if (!response?.isSuccess) {
          setHasRequestError(true);
          return;
        }

        setHistory(normalizePortfolioHistory(response.data, portfolio));
        setHasRequestError(false);
      },
      onError: () => setHasRequestError(true),
    }
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === chartCardRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const visiblePoints = useMemo<RenderedPortfolioPoint[]>(() => {
    return history.map((point) => ({
      ...point,
      value: getMetricValue(point, selectedMetric),
    }));
  }, [history, selectedMetric]);

  const latestPoint = visiblePoints[visiblePoints.length - 1];
  const firstPoint = visiblePoints[0];
  const periodDelta =
    latestPoint && firstPoint ? latestPoint.value - firstPoint.value : 0;
  const periodDeltaPercent =
    firstPoint?.value && selectedMetric !== "roi"
      ? (periodDelta / Math.abs(firstPoint.value)) * 100
      : null;
  const changeVariant = getChangeVariant(periodDelta);
  const accent = periodDelta < 0 ? NEGATIVE_COLOR : POSITIVE_COLOR;
  const axisModel = useMemo(
    () => buildAxisModel(visiblePoints, selectedMetric, selectedRange),
    [selectedMetric, selectedRange, visiblePoints]
  );
  const showInvestedLine = axisModel.showInvestedLine;
  const isInitialLoading =
    history.length === 0 && (chartQuery.isLoading || chartQuery.isFetching);
  const isUpdating = chartQuery.isFetching && history.length > 0;
  const hasChartHistory = history.length > 1;
  const screenshotLink =
    portfolio.shareLink ||
    (typeof window !== "undefined" ? window.location.href : "");

  const handleRangeChange = (range: CorePortfolioChartRange): void => {
    if (range === selectedRange) return;
    setSelectedRange(range);
    setHasRequestError(false);
  };

  const toggleFullscreen = async (): Promise<void> => {
    const element = chartCardRef.current;
    if (!element) return;

    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch (error) {
      console.error("Could not toggle portfolio chart fullscreen", error);
    }
  };

  return (
    <>
      <ChartCard
        ref={chartCardRef}
        className={className}
        aria-busy={isInitialLoading || isUpdating}
        aria-label="Portfolio performance chart"
      >
        <Header>
          <Toolbar aria-label="Portfolio chart controls">
            <ControlSection>
              <ControlGroup role="tablist" aria-label="Chart metric">
                {METRICS.map((metric) => (
                  <ControlButton
                    key={metric.value}
                    type="button"
                    role="tab"
                    aria-selected={selectedMetric === metric.value}
                    $active={selectedMetric === metric.value}
                    onClick={() => setSelectedMetric(metric.value)}
                  >
                    {metric.label}
                  </ControlButton>
                ))}
              </ControlGroup>
            </ControlSection>
            <ControlSection $align="end">
              <ControlGroup aria-label="Chart time range">
                {CORE_PORTFOLIO_CHART_RANGES.map((range) => (
                  <ControlButton
                    key={range}
                    type="button"
                    aria-pressed={selectedRange === range}
                    $active={selectedRange === range}
                    onClick={() => handleRangeChange(range)}
                  >
                    {range}
                  </ControlButton>
                ))}
              </ControlGroup>
              {!isFullscreen ? (
                <IconButton
                  type="button"
                  aria-label="Export portfolio chart"
                  title="Export chart"
                  onClick={() => setIsScreenshotOpen(true)}
                >
                  <Camera />
                </IconButton>
              ) : null}
              <IconButton
                type="button"
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Open fullscreen"
                }
                title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
                $emphasis
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 /> : <Maximize2 />}
              </IconButton>
            </ControlSection>
          </Toolbar>
        </Header>

        <Content>
          {hasRequestError ? (
            <ErrorNotice role="status">
              <span>
                Could not refresh this range. The previous chart is still shown.
              </span>
              <button type="button" onClick={() => chartQuery.refetch()}>
                Retry
              </button>
            </ErrorNotice>
          ) : null}

          {isInitialLoading ? (
            <ChartLoadingState />
          ) : hasChartHistory && latestPoint ? (
            <>
              <MetricSummary>
                <MetricValueBlock>
                  <MetricLabel>{getMetricLabel(selectedMetric)}</MetricLabel>
                  <MetricValueRow>
                    <MetricValue>
                      {formatMetricValue(
                        latestPoint.value,
                        selectedMetric,
                        true
                      )}
                    </MetricValue>
                    <MetricChange $variant={changeVariant}>
                      {formatMetricDelta(periodDelta, selectedMetric)}
                      {periodDeltaPercent !== null
                        ? ` (${formatPercent(periodDeltaPercent, true)})`
                        : ""}
                    </MetricChange>
                  </MetricValueRow>
                </MetricValueBlock>
              </MetricSummary>

              <Plot
                $updating={isUpdating}
                role="img"
                aria-label={`${getMetricLabel(selectedMetric)} history`}
              >
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <ComposedChart
                    data={visiblePoints}
                    margin={{ top: 12, right: 0, bottom: 4, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={gradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={accent}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="72%"
                          stopColor={accent}
                          stopOpacity={0.06}
                        />
                        <stop
                          offset="100%"
                          stopColor={accent}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="rgba(115, 128, 148, 0.13)"
                      strokeDasharray="3 4"
                    />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      hide
                    />
                    <YAxis
                      orientation="right"
                      width={axisModel.gutterWidth}
                      domain={axisModel.domain}
                      ticks={axisModel.ticks}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      tick={{
                        fill: "#738094",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      tickFormatter={axisModel.formatValue}
                    />
                    {selectedMetric !== "balance" &&
                    axisModel.domain[0] <= 0 &&
                    axisModel.domain[1] >= 0 ? (
                      <ReferenceLine
                        y={0}
                        stroke="rgba(12, 26, 43, 0.28)"
                        strokeWidth={1}
                      />
                    ) : null}
                    <Tooltip
                      allowEscapeViewBox={{ x: false, y: false }}
                      offset={10}
                      wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
                      cursor={<HoverCursor />}
                      content={(props: any) => (
                        <PortfolioChartTooltip
                          {...props}
                          metric={selectedMetric}
                          accent={accent}
                          portfolioName={portfolio.name}
                        />
                      )}
                    />
                    <Area
                      type="linear"
                      dataKey="value"
                      stroke="none"
                      fill={`url(#${gradientId})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                    {showInvestedLine ? (
                      <Line
                        type="stepAfter"
                        dataKey="netInvested"
                        stroke={INVESTED_COLOR}
                        strokeWidth={1.45}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={false}
                        opacity={0.72}
                        isAnimationActive={false}
                      />
                    ) : null}
                    <Line
                      type="linear"
                      dataKey="value"
                      stroke={accent}
                      strokeWidth={2.55}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={visiblePoints.length === 1 ? { r: 4 } : false}
                      activeDot={{
                        r: 5.6,
                        fill: accent,
                        stroke: "#ffffff",
                        strokeWidth: 2.4,
                      }}
                      isAnimationActive={false}
                    />
                    <Customized
                      component={(props: any) => (
                        <CurrentValueLayer
                          {...props}
                          value={latestPoint.value}
                          label={axisModel.formatValue(latestPoint.value)}
                          color={accent}
                        />
                      )}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Plot>

              <Legend aria-label="Chart legend">
                <LegendItem $color={accent}>
                  {getMetricLabel(selectedMetric)}
                </LegendItem>
                {showInvestedLine ? (
                  <LegendItem $color={INVESTED_COLOR} $dashed>
                    Net invested
                  </LegendItem>
                ) : null}
              </Legend>
            </>
          ) : (
            <EmptyState>
              <strong>Performance history is still being built</strong>
              <span>
                At least two portfolio snapshots are needed to draw a reliable
                trend.
              </span>
            </EmptyState>
          )}

          {isUpdating ? (
            <UpdatingBadge role="status">Updating range</UpdatingBadge>
          ) : null}
          <ScreenReaderStatus aria-live="polite">
            {isUpdating
              ? "Updating portfolio chart while keeping the previous data visible"
              : "Portfolio chart is up to date"}
          </ScreenReaderStatus>
        </Content>
      </ChartCard>

      <SaveShareModal
        name={`${portfolio.name || "Portfolio"} / Performance`}
        link={screenshotLink}
        html={chartCardRef.current}
        isVisible={isScreenshotOpen}
        onClose={() => setIsScreenshotOpen(false)}
      />
    </>
  );
};

export default CorePortfolioChart;

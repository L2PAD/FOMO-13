import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import moment from "moment";
import {
  ResponsiveContainer,
  Tooltip,
  YAxis,
  Area,
  Line,
  ComposedChart,
  Customized,
} from "recharts";
import styled from "styled-components";
import { IChartPriceData } from "../../../../../types/global_types";
import RangeSelector, { RangeSelectorVariant } from "../RangeSelector";
import { getMetricValue } from "../CompareBody";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";
import { buildChartAxis, type ChartAxisMetric } from "./priceAxis";

const Wrapper = styled.div<{ $noTopMargin?: boolean; $fillHeight?: boolean }>`
  margin-top: ${({ $noTopMargin }) => ($noTopMargin ? "0" : "25px")};
  width: 100%;
  position: relative;
  height: ${({ $fillHeight }) => ($fillHeight ? "100%" : "auto")};
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

type ChartBodyVariant = "default" | "dark";

const ChartContainer = styled.div<{
  $variant?: ChartBodyVariant;
  $fillHeight?: boolean;
}>`
  width: 100%;
  position: relative;
  height: auto;
  min-height: 0;
  flex: ${({ $fillHeight }) => ($fillHeight ? "1 1 0" : "0 0 auto")};
  padding: 0;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "dark" ? "transparent" : "transparent"};
  border-radius: ${({ $variant }) => ($variant === "dark" ? "0" : "0")};
  background: transparent;
  box-shadow: none;

  .recharts-wrapper,
  .recharts-surface {
    cursor: crosshair;
  }

  .recharts-cartesian-axis-tick text {
    font-family: inherit;
    paint-order: stroke;
    fill: ${({ $variant }) =>
      $variant === "dark" ? mainGlobalDark.textMuted : "#738094"};
  }

`;

const TooltipCard = styled.div`
  min-width: 238px;
  max-width: 280px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);
  color: ${mainGlobalDark.text};

  @media (max-width: 575px) {
    min-width: 190px;
    max-width: min(236px, calc(100vw - 40px));
    padding: 10px;
  }
`;

const TooltipHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const TooltipTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  color: ${mainGlobalDark.white};
`;

const TooltipSeriesDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const TooltipDate = styled.div`
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 15px;
  color: ${mainGlobalDark.textMuted};
`;

const TooltipRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
`;

const TooltipLabel = styled.span`
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 15px;
  color: ${mainGlobalDark.textMuted};
`;

const TooltipValue = styled.span`
  min-width: 0;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17px;
  color: ${mainGlobalDark.white};
  text-align: right;
  overflow-wrap: anywhere;
`;

const TooltipDelta = styled(TooltipValue)<{ $variant: "positive" | "negative" | "neutral" }>`
  color: ${({ $variant }) =>
    $variant === "positive"
      ? "#04a584"
      : $variant === "negative"
        ? "#ff5858"
        : mainGlobalDark.textMuted};
`;

export const RANGES = ["24H", "7D", "30D", "90D", "1Y", "ALL"] as const;
export type RangeType = (typeof RANGES)[number];
export type MetricType = ChartAxisMetric;

const getMetricLabel = (metric: MetricType): string => {
  switch (metric) {
    case "marketCap":
      return "Market Cap";
    case "totalBalance":
      return "Total Balance";
    case "price":
    default:
      return "Price";
  }
};

const toFiniteNumber = (value: unknown): number | null => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getPriceFractionDigits = (value: number): number => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1000) return 2;
  if (absoluteValue >= 1) return 2;
  if (absoluteValue >= 0.01) return 4;
  return 8;
};

const formatUsdValue = (value: unknown, metric: MetricType): string => {
  const numericValue = toFiniteNumber(value);
  if (numericValue === null) return "--";

  if (metric === "marketCap" || metric === "totalBalance") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  const fractionDigits = getPriceFractionDigits(numericValue);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: numericValue >= 1 ? 2 : 0,
    maximumFractionDigits: fractionDigits,
  }).format(numericValue);
};

type AxisVisualItem = {
  value: number;
  label: string;
  isCurrent?: boolean;
  color?: string;
};

const getChartOffset = (props: any) => {
  const offset = props?.offset || {};
  const width = Number(props?.width || 0);
  const height = Number(props?.height || 0);

  return {
    left: Number(offset.left || 0),
    top: Number(offset.top || 0),
    width: Number(offset.width || width),
    height: Number(offset.height || height),
  };
};

const getYAxisScale = (props: any): ((value: number) => number) | null => {
  const yAxisMap = props?.yAxisMap || {};
  const yAxis = Object.values(yAxisMap)[0] as any;

  return typeof yAxis?.scale === "function" ? yAxis.scale : null;
};

const getAxisY = (
  value: number,
  props: any,
  domain: [number, number]
): number | null => {
  const scale = getYAxisScale(props);
  const scaledValue = scale?.(value);

  if (Number.isFinite(scaledValue)) return Number(scaledValue);

  const offset = getChartOffset(props);
  const [minValue, maxValue] = domain;
  const range = maxValue - minValue;

  if (!Number.isFinite(range) || range === 0) return null;

  return offset.top + ((maxValue - value) / range) * offset.height;
};

const ChartHoverCursor = ({
  points,
  viewBox,
  chartVariant,
  left,
  top,
  width,
  height,
}: {
  points?: Array<{ x?: number; y?: number }>;
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
  chartVariant?: ChartBodyVariant;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}) => {
  const cursorX = Number(points?.[0]?.x);
  const pointYValues = (points || [])
    .map((point) => Number(point.y))
    .filter((value) => Number.isFinite(value));
  const fallbackTop = pointYValues.length ? Math.min(...pointYValues) : 0;
  const fallbackHeight = pointYValues.length
    ? Math.max(...pointYValues) - fallbackTop
    : 0;
  const boxX = Number(viewBox?.x ?? left ?? 0);
  const boxY = Number(viewBox?.y ?? top ?? fallbackTop);
  const boxWidth = Number(viewBox?.width ?? width ?? 0);
  const boxHeight = Number(viewBox?.height ?? height ?? fallbackHeight);

  if (
    !Number.isFinite(cursorX) ||
    !Number.isFinite(boxX) ||
    !Number.isFinite(boxY) ||
    !Number.isFinite(boxWidth) ||
    !Number.isFinite(boxHeight) ||
    boxWidth <= 0 ||
    boxHeight <= 0
  ) {
    return null;
  }

  const boundedX = Math.max(boxX, Math.min(cursorX, boxX + boxWidth));
  const lineStroke = "rgba(0, 0, 0, 0.92)";

  return (
    <g className="market-chart-hover-cursor" pointerEvents="none">
      <line
        x1={boundedX}
        x2={boundedX}
        y1={boxY}
        y2={boxY + boxHeight}
        stroke={lineStroke}
        strokeWidth={1.7}
        strokeDasharray="4 4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
};

const ChartGridLayer = ({
  ticks,
  domain,
  stroke,
  currentStroke,
  currentHaloStroke,
  showRegular = true,
  showCurrent = true,
  ...props
}: {
  ticks: AxisVisualItem[];
  domain: [number, number];
  stroke: string;
  currentStroke?: string;
  currentHaloStroke?: string;
  showRegular?: boolean;
  showCurrent?: boolean;
  [key: string]: any;
}) => {
  const offset = getChartOffset(props);
  const currentX2 = offset.left + offset.width;
  const points = ticks
    .map((tick: AxisVisualItem) => {
      const y = getAxisY(tick.value, props, domain);
      return y === null
        ? null
        : {
            y,
            isCurrent: Boolean(tick.isCurrent),
          };
    })
    .filter(
      (point): point is { y: number; isCurrent: boolean } => point !== null
    )
    .reduce((acc, point) => {
      const existingIndex = acc.findIndex((item) => Math.abs(item.y - point.y) < 0.5);

      if (existingIndex >= 0) {
        acc[existingIndex] = {
          ...acc[existingIndex],
          isCurrent: acc[existingIndex].isCurrent || point.isCurrent,
        };
        return acc;
      }

      acc.push(point);
      return acc;
    }, [] as Array<{ y: number; isCurrent: boolean }>);
  const regularPoints = points.filter((point) => !point.isCurrent);
  const currentPoints = points.filter((point) => point.isCurrent);

  return (
    <g className="market-chart-grid-layer" pointerEvents="none">
      {showRegular ? regularPoints.map((point, index) => (
        <line
          key={`chart-grid-line-${index}-${Math.round(point.y * 100)}`}
          x1={offset.left}
          x2={offset.left + offset.width}
          y1={point.y}
          y2={point.y}
          stroke={stroke}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )) : null}
      {showCurrent ? currentPoints.map((point, index) => (
        <g
          key={`chart-current-price-line-${index}-${Math.round(point.y * 100)}`}
          className="market-chart-current-price-line"
        >
          <line
            x1={offset.left}
            x2={currentX2}
            y1={point.y}
            y2={point.y}
            stroke={currentHaloStroke || "rgba(255, 255, 255, 0.68)"}
            strokeWidth={2.4}
            strokeDasharray="2 3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={offset.left}
            x2={currentX2}
            y1={point.y}
            y2={point.y}
            stroke={currentStroke || "rgba(17, 24, 39, 0.54)"}
            strokeWidth={1.4}
            strokeDasharray="2 3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      )) : null}
    </g>
  );
};

const PriceAxisLabelsLayer = ({
  ticks,
  domain,
  axisWidth,
  ...props
}: {
  ticks: AxisVisualItem[];
  domain: [number, number];
  axisWidth: number;
  [key: string]: any;
}) => {
  const offset = getChartOffset(props);
  const svgWidth = Number(props?.width || offset.left + offset.width + axisWidth);
  const axisRight = Math.min(
    svgWidth - 8,
    offset.left + offset.width + Number(axisWidth || 0) - 8
  );
  const positionedTicks = ticks
    .map((tick: AxisVisualItem) => {
      const y = getAxisY(tick.value, props, domain);
      return y === null ? null : { tick, y };
    })
    .filter(
      (item): item is { tick: AxisVisualItem; y: number } => item !== null
    );

  return (
    <g className="market-chart-axis-labels" pointerEvents="none">
      {positionedTicks.map(({ tick, y }) => {
        const isCompactAxis = axisWidth <= 62;
        const axisInset = isCompactAxis ? 4 : 8;
        const minimumBadgeWidth = isCompactAxis ? 40 : 54;
        const badgeWidth = Math.min(
          Math.max(
            minimumBadgeWidth,
            tick.label.length * (isCompactAxis ? 5.6 : 6.5) +
              (isCompactAxis ? 8 : 14)
          ),
          Math.max(minimumBadgeWidth, axisWidth - (isCompactAxis ? 2 : 8))
        );
        const textX = axisRight - axisInset;
        const tickColor = tick.isCurrent
          ? tick.color || mainGlobalDark.positive
          : mainGlobalDark.textMuted;

        return (
          <g
            key={`price-axis-label-${tick.value}-${tick.label}`}
            aria-label={`Price level ${tick.label}`}
          >
            {tick.isCurrent ? (
              <rect
                x={axisRight - badgeWidth}
                y={y - 13}
                width={badgeWidth}
                height={26}
                rx={8}
                fill={mainGlobalDark.background}
                opacity={0.98}
              />
            ) : null}
            <text
              x={textX}
              y={y}
              dy={4}
              fill={tickColor}
              style={{ fill: tickColor }}
              fontSize={isCompactAxis ? 10 : axisWidth <= 96 ? 11 : 12}
              fontWeight={600}
              textAnchor="end"
            >
              {tick.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

const formatSignedUsdValue = (value: number, metric: MetricType): string => {
  const formattedValue = formatUsdValue(Math.abs(value), metric);
  if (formattedValue === "--") return "--";
  if (value === 0) return formattedValue;
  return `${value > 0 ? "+" : "-"}${formattedValue}`;
};

const formatPercentChange = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
};

const getAxisPaddingRatio = (
  range: RangeType,
  metric: MetricType
): number => {
  if (metric === "marketCap" || metric === "totalBalance") return 0.08;

  switch (range) {
    case "24H":
      return 0.12;
    case "7D":
      return 0.1;
    case "30D":
      return 0.09;
    case "90D":
      return 0.085;
    case "1Y":
      return 0.075;
    case "ALL":
      return 0.07;
    default:
      return 0.09;
  }
};

type LineChartProps = {
  selectedMetric: MetricType;
  setSelectedMetric: any;
  setSelectedRange: any;
  selectedRange: RangeType;
  history: IChartPriceData[];
  timelineHistory?: IChartPriceData[];
  isArea?: boolean;
  children?: React.ReactNode;
  name?: string;
  customRange: [Date, Date] | null;
  setCustomRange: any;
  noTopMargin?: boolean;
  chartVariant?: ChartBodyVariant;
  rangeSelectorVariant?: RangeSelectorVariant;
  chartHeight?: number | string;
  fillHeight?: boolean;
  priceChange?: number | null;
};

const UniversalChartBody: React.FC<LineChartProps> = ({
  selectedMetric,
  selectedRange,
  history,
  timelineHistory,
  name,
  isArea = true,
  customRange,
  setCustomRange,
  noTopMargin = false,
  chartVariant = "default",
  rangeSelectorVariant = "default",
  chartHeight = 340,
  fillHeight = false,
}) => {
  const [hoverCursorX, setHoverCursorX] = useState<number | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const hoverClipId = `market-chart-hover-left-${useId().replace(/:/g, "")}`;
  const rangeHistory = timelineHistory?.length ? timelineHistory : history;
  const updateChartSize = useCallback(() => {
    const bounds = chartContainerRef.current?.getBoundingClientRect();
    const width = bounds?.width || 0;
    const height = bounds?.height || 0;

    setChartSize((currentSize) =>
      Math.abs(currentSize.width - width) < 0.5 &&
      Math.abs(currentSize.height - height) < 0.5
        ? currentSize
        : { width, height }
    );
  }, []);

  useEffect(() => {
    updateChartSize();

    const element = chartContainerRef.current;
    if (!element) return undefined;

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateChartSize);
      observer.observe(element);

      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateChartSize);

    return () => window.removeEventListener("resize", updateChartSize);
  }, [updateChartSize]);

  const availableRange: [Date, Date] = useMemo(() => {
    const allTimestamps = [...rangeHistory.map((item) => item.timestamp)];

    if (allTimestamps.length === 0) {
      return [new Date(), new Date()];
    }

    const minTimestamp = Math.min(...allTimestamps);
    const maxTimestamp = Math.max(...allTimestamps);

    return [new Date(minTimestamp), new Date(maxTimestamp)];
  }, [rangeHistory]);

  const data = useMemo(() => {
    const filteredHistory = history.filter(
      (item) =>
        !customRange ||
        (item.timestamp >= customRange[0].getTime() &&
          item.timestamp <= customRange[1].getTime())
    );

    return filteredHistory.map((item, index) => {
      const previousItem = index > 0 ? filteredHistory[index - 1] : null;
      const value: any = history?.length
        ? getMetricValue(selectedMetric, item)
        : null;
      const previousValue: any =
        previousItem && history?.length
          ? getMetricValue(selectedMetric, previousItem)
          : null;
      return {
        ...item,
        name: moment(item.timestamp).format("MM/DD"),
        date: item.timestamp,
        value,
        previousValue,
      };
    });
  }, [customRange, history, selectedMetric]);

  const allTimeHistory = useMemo(() => {
    const formatKey = (ts: number) => moment(ts).format("MM/DD HH:mm");

    return rangeHistory.map((item) => {
      const value: any = rangeHistory?.length
        ? getMetricValue(selectedMetric, item)
        : null;

      return {
        name: formatKey(item.timestamp),
        date: item.timestamp,
        [name || "Token"]: value,
      };
    });
  }, [rangeHistory, name, selectedMetric]);

  const values = data.map((item) => item.value);
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const hasChartData = data.length > 0 && numericValues.length > 0;
  const currentAxisValue = numericValues.length
    ? numericValues[numericValues.length - 1]
    : null;
  const effectiveChartHeight =
    chartSize.height || (typeof chartHeight === "number" ? chartHeight : 340);
  const axisModel = buildChartAxis({
    values: numericValues,
    currentValue: currentAxisValue,
    metric: selectedMetric,
    paddingRatio: getAxisPaddingRatio(selectedRange, selectedMetric),
    chartWidth: chartSize.width,
    chartHeight: effectiveChartHeight,
  });
  const [axisMinValue, axisMaxValue] = axisModel.domain;

  const isGrowing = useMemo(() => {
    if (numericValues.length < 2) return false;

    const n = numericValues.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = numericValues.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * numericValues[i], 0);
    const sumX2 = x.reduce((acc, val) => acc + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope >= 0;
  }, [numericValues]);

  const strokeColor =
    selectedMetric === "marketCap" ? "#007BFF" : isGrowing ? "#04A584" : "#ff5858";
  const gradientId =
    selectedMetric === "marketCap"
      ? "gradient-blue"
      : isGrowing
        ? "gradient-up"
        : "gradient-down";
  const axisTicks = axisModel.ticks.map((tick) => tick.value);
  const axisVisualTicks: AxisVisualItem[] = axisModel.ticks.map((tick) => ({
    ...tick,
    color: tick.isCurrent ? strokeColor : mainGlobalDark.textMuted,
  }));
  const yAxisWidth = axisModel.gutterWidth;
  const currentPriceLineStroke =
    chartVariant === "dark"
      ? "rgba(255, 255, 255, 0.6)"
      : "rgba(17, 24, 39, 0.54)";
  const currentPriceLineHaloStroke =
    chartVariant === "dark"
      ? "rgba(0, 0, 0, 0.22)"
      : "rgba(255, 255, 255, 0.68)";

  const handleRangeChange = (range: [Date, Date]) => {
    setCustomRange(range);
  };
  const handleChartMouseMove = (state: any): void => {
    const x = Number(state?.activeCoordinate?.x);
    setHoverCursorX(Number.isFinite(x) ? x : null);
  };
  const handleChartMouseLeave = (): void => {
    setHoverCursorX(null);
  };
  const hasHoverCursor = hoverCursorX !== null;

  return (
    <Wrapper $noTopMargin={noTopMargin} $fillHeight={fillHeight}>
      <ChartContainer
        ref={chartContainerRef}
        $variant={chartVariant}
        $fillHeight={fillHeight}
      >
        {hasChartData ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart
              key={selectedMetric}
              data={data}
              margin={{ top: 8, right: 0, bottom: 14, left: 0 }}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
            <defs>
              <linearGradient id="gradient-up" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#04A584" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#04A584" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradient-down" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="red" stopOpacity={0.4} />
                <stop offset="100%" stopColor="red" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#007BFF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#007BFF" stopOpacity={0} />
              </linearGradient>
              <clipPath id={hoverClipId}>
                <rect
                  x={0}
                  y={-10000}
                  width={Math.max(0, hoverCursorX || 0)}
                  height={20000}
                />
              </clipPath>
            </defs>

            <Customized
              component={(props: any) => (
                <ChartGridLayer
                  {...props}
                  ticks={axisVisualTicks}
                  domain={[axisMinValue, axisMaxValue]}
                  stroke={
                    chartVariant === "dark"
                      ? "rgba(115, 128, 148, 0.14)"
                      : "rgba(115, 128, 148, 0.12)"
                  }
                  currentStroke={currentPriceLineStroke}
                  currentHaloStroke={currentPriceLineHaloStroke}
                />
              )}
            />
            <YAxis
              domain={[axisMinValue, axisMaxValue]}
              hide={false}
              orientation="right"
              width={yAxisWidth}
              axisLine={false}
              tickLine={false}
              ticks={axisTicks}
              interval={0}
              padding={{ top: 16, bottom: 16 }}
              tickMargin={0}
              tick={false}
            />

            <Tooltip
              allowEscapeViewBox={{ x: false, y: true }}
              wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  const value = toFiniteNumber(p.value);
                  const previousValue = toFiniteNumber(p.previousValue);
                  const hasDelta =
                    value !== null &&
                    previousValue !== null &&
                    previousValue !== 0;
                  const delta = hasDelta ? value - previousValue : 0;
                  const deltaPercent = hasDelta
                    ? (delta / previousValue) * 100
                    : 0;
                  const deltaVariant =
                    delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
                  const metricLabel = getMetricLabel(selectedMetric);

                  return (
                    <TooltipCard>
                      <TooltipHeader>
                        <TooltipTitle>
                          <TooltipSeriesDot $color={strokeColor} />
                          <span>{name || "Token"}</span>
                        </TooltipTitle>
                        <TooltipDate>
                          {moment(p.date).format("MMM D, YYYY, HH:mm")}
                        </TooltipDate>
                      </TooltipHeader>
                      <TooltipRows>
                        <TooltipRow>
                          <TooltipLabel>{metricLabel}</TooltipLabel>
                          <TooltipValue>
                            {formatUsdValue(value, selectedMetric)}
                          </TooltipValue>
                        </TooltipRow>
                        {hasDelta ? (
                          <TooltipRow>
                            <TooltipLabel>Change</TooltipLabel>
                            <TooltipDelta $variant={deltaVariant}>
                              {formatSignedUsdValue(delta, selectedMetric)}
                              {" "}
                              ({formatPercentChange(deltaPercent)})
                            </TooltipDelta>
                          </TooltipRow>
                        ) : null}
                      </TooltipRows>
                    </TooltipCard>
                  );
                }
                return null;
              }}
              cursor={<ChartHoverCursor chartVariant={chartVariant} />}
            />

            <Area
              type="linear"
              dataKey="value"
              stroke="none"
              fill={isArea ? `url(#${gradientId})` : "transparent"}
              fillOpacity={1}
              opacity={hasHoverCursor ? 0.45 : 1}
              dot={false}
              isAnimationActive={false}
            />
            {hasHoverCursor ? (
              <Area
                type="linear"
                dataKey="value"
                stroke="none"
                fill={isArea ? `url(#${gradientId})` : "transparent"}
                fillOpacity={1}
                dot={false}
                isAnimationActive={false}
                clipPath={`url(#${hoverClipId})`}
              />
            ) : null}
            <Line
              type="linear"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.55}
              dot={false}
              opacity={hasHoverCursor ? 0.46 : 1}
              activeDot={{
                r: 5.6,
                fill: strokeColor,
                stroke: chartVariant === "dark" ? mainGlobalDark.background : "#fff",
                strokeWidth: 2.4,
              }}
              isAnimationActive={false}
            />
            {hasHoverCursor ? (
              <Line
                type="linear"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2.55}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                clipPath={`url(#${hoverClipId})`}
              />
            ) : null}
            <Customized
              component={(props: any) => (
                <PriceAxisLabelsLayer
                  {...props}
                  ticks={axisVisualTicks}
                  domain={[axisMinValue, axisMaxValue]}
                  axisWidth={yAxisWidth}
                />
              )}
            />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: chartHeight }} />
        )}
      </ChartContainer>
      {hasChartData ? (
        <RangeSelector
          initialRange={customRange || availableRange}
          availableRange={availableRange}
          onChange={handleRangeChange}
          data={allTimeHistory}
          name={name || ""}
          metric={selectedMetric}
          variant={rangeSelectorVariant}
          lineColor={strokeColor}
          commitOnRelease
        />
      ) : null}
    </Wrapper>
  );
};

export default UniversalChartBody;

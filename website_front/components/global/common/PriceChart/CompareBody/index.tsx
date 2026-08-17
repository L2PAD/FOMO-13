import React, { useId, useMemo, useState } from "react";
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
import imageLoader from "../../../../../helpers/imageLoader";
import { MetricType } from "../ChartBody";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";

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

`;

const TooltipCard = styled.div`
  min-width: 250px;
  max-width: 320px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);
  color: ${mainGlobalDark.text};
`;

const TooltipDate = styled.div`
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: ${mainGlobalDark.textMuted};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 15px;
`;

const TooltipRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
`;

const TooltipAsset = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;

  img {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    min-width: 0;
    color: ${mainGlobalDark.text};
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const TooltipSeriesDot = styled.i<{ $color: string }>`
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const TooltipValue = styled.div<{ $variant: "positive" | "negative" | "neutral" }>`
  color: ${({ $variant }) =>
    $variant === "positive"
      ? "#04a584"
      : $variant === "negative"
        ? "#ff5858"
        : mainGlobalDark.textMuted};
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  text-align: right;
  white-space: nowrap;
`;

type RangeType = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";

export type CompareChartSeries = {
  key: string;
  name: string;
  symbol?: string;
  logo?: string;
  color: string;
  history: IChartPriceData[];
};

type Props = {
  selectedMetric: MetricType;
  selectedRange: RangeType;
  history1: IChartPriceData[];
  timelineHistory1?: IChartPriceData[];
  name1: string;
  logo1: string;
  compareSeries: CompareChartSeries[];
  customRange: [Date, Date] | null;
  setCustomRange: any;
  noTopMargin?: boolean;
  chartVariant?: ChartBodyVariant;
  rangeSelectorVariant?: RangeSelectorVariant;
  chartHeight?: number | string;
  fillHeight?: boolean;
};

export const getMetricValue = (
  selectedMetric: MetricType,
  item: IChartPriceData
) => {
  return selectedMetric === "price"
    ? (item.price?.USD ?? null)
    : (item.marketCap ?? null);
};

const toPercent = (value: number | null, base: number | null): number | null => {
  if (value == null || base == null || base === 0) return null;
  return ((value - base) / base) * 100;
};

const toFiniteNumber = (value: unknown): number | null => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatPercent = (value: unknown): string => {
  const numericValue = toFiniteNumber(value);
  if (numericValue === null) return "--";

  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericValue)}%`;
};

const getPercentVariant = (value: unknown): "positive" | "negative" | "neutral" => {
  const numericValue = toFiniteNumber(value);
  if (numericValue === null || Math.abs(numericValue) < 0.005) return "neutral";
  return numericValue > 0 ? "positive" : "negative";
};

type CompareLatestLabel = {
  key: string;
  value: number;
  label: string;
  variant: "positive" | "negative" | "neutral";
};

const getPercentBadgeColor = (
  variant: "positive" | "negative" | "neutral"
): string => {
  if (variant === "positive") return "#04A584";
  if (variant === "negative") return "#FF5858";
  return mainGlobalDark.backgroundHover;
};

const getPercentLabelWidth = (label: string): number =>
  Math.max(68, Math.min(158, label.length * 7.2 + 22));

const getAxisTicks = (
  minValue: number,
  maxValue: number,
  latestLabels: CompareLatestLabel[] = []
): number[] => {
  if (minValue === maxValue) {
    return [
      minValue - 2,
      minValue - 1,
      minValue,
      minValue + 1,
      minValue + 2,
      minValue + 3,
    ];
  }

  const tickCount = 6;
  const range = Math.abs(maxValue - minValue);
  const step = (maxValue - minValue) / (tickCount - 1);
  const latestValues = latestLabels.map((item) => item.value);
  const latestCollisionTolerance = Math.max(range * 0.026, Math.abs(step) * 0.34, 1e-9);
  const neutralTicks = Array.from(
    { length: tickCount },
    (_, index) => minValue + step * index
  ).filter(
    (tick) =>
      !latestValues.some(
        (latestValue) => Math.abs(latestValue - tick) < latestCollisionTolerance
      )
  );
  const sortedTicks = [...neutralTicks, ...latestValues].sort((a, b) => a - b);
  const uniqueTicks: number[] = [];
  const usedLabels = new Set<string>();

  sortedTicks.forEach((tick) => {
    const formattedTick = formatPercent(tick);

    if (usedLabels.has(formattedTick)) return;

    uniqueTicks.push(tick);
    usedLabels.add(formattedTick);
  });

  return uniqueTicks;
};

type CompareAxisVisualItem = {
  value: number;
  label: string;
  isLatest?: boolean;
  variant: "positive" | "negative" | "neutral";
  offsetY?: number;
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
    <g className="market-compare-hover-cursor" pointerEvents="none">
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

const CompareGridLayer = ({
  ticks,
  domain,
  stroke,
  ...props
}: {
  ticks: CompareAxisVisualItem[];
  domain: [number, number];
  stroke: string;
  [key: string]: any;
}) => {
  const offset = getChartOffset(props);
  const points = ticks
    .map((tick: CompareAxisVisualItem) => {
      const y = getAxisY(tick.value, props, domain);
      return y === null ? null : y + Number(tick.offsetY || 0);
    })
    .filter((y): y is number => y !== null)
    .filter((y: number, index: number, items: number[]) =>
      items.findIndex((item: number) => Math.abs(item - y) < 0.5) === index
    );

  return (
    <g className="market-compare-grid-layer" pointerEvents="none">
      {points.map((y, index) => (
        <line
          key={`compare-grid-line-${index}-${Math.round(y * 100)}`}
          x1={offset.left}
          x2={offset.left + offset.width}
          y1={y}
          y2={y}
          stroke={stroke}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
};

const CompareAxisLabelsLayer = ({
  ticks,
  domain,
  axisWidth,
  chartVariant,
  ...props
}: {
  ticks: CompareAxisVisualItem[];
  domain: [number, number];
  axisWidth: number;
  chartVariant?: ChartBodyVariant;
  [key: string]: any;
}) => {
  const offset = getChartOffset(props);
  const svgWidth = Number(props?.width || offset.left + offset.width + axisWidth);
  const axisRight = Math.min(
    svgWidth - 4,
    offset.left + offset.width + Number(axisWidth || 0) - 4
  );

  return (
    <g className="market-compare-axis-labels" pointerEvents="none">
      {ticks.map((tick: CompareAxisVisualItem) => {
        const yValue = getAxisY(tick.value, props, domain);
        if (yValue === null) return null;

        const y = yValue + Number(tick.offsetY || 0);
        const labelWidth = getPercentLabelWidth(tick.label);
        const tickColor = tick.isLatest
          ? "#FFFFFF"
          : chartVariant === "dark"
            ? mainGlobalDark.textMuted
            : "#738094";

        return (
          <g
            key={`compare-axis-label-${tick.value}-${tick.label}`}
            aria-label={`Percent level ${tick.label}`}
          >
            {tick.isLatest ? (
              <rect
                x={axisRight - labelWidth}
                y={y - 13}
                width={labelWidth}
                height={26}
                rx={8}
                fill={getPercentBadgeColor(tick.variant)}
              />
            ) : null}
            <text
              x={axisRight - 8}
              y={y}
              dy={4}
              fill={tickColor}
              style={{ fill: tickColor }}
              fontSize={12}
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

const buildLatestLabelOffsets = (
  labels: CompareLatestLabel[],
  minValue: number,
  maxValue: number,
  chartHeight: number | string
): Record<string, number> => {
  if (!labels.length || minValue === maxValue) return {};

  const height = typeof chartHeight === "number" ? chartHeight : 340;
  const plotHeight = Math.max(180, height - 48);
  const range = maxValue - minValue;
  const minGap = 28;
  const topBound = 14;
  const bottomBound = plotHeight - 14;
  const positioned = labels
    .map((label) => ({
      ...label,
      originalY: ((maxValue - label.value) / range) * plotHeight,
    }))
    .sort((left, right) => left.originalY - right.originalY);

  const adjusted = positioned.map((item) => ({ ...item, y: item.originalY }));

  for (let index = 1; index < adjusted.length; index += 1) {
    adjusted[index].y = Math.max(adjusted[index].y, adjusted[index - 1].y + minGap);
  }

  const bottomOverflow = adjusted[adjusted.length - 1].y - bottomBound;
  if (bottomOverflow > 0) {
    adjusted.forEach((item) => {
      item.y -= bottomOverflow;
    });
  }

  for (let index = adjusted.length - 2; index >= 0; index -= 1) {
    adjusted[index].y = Math.min(adjusted[index].y, adjusted[index + 1].y - minGap);
  }

  const topOverflow = topBound - adjusted[0].y;
  if (topOverflow > 0) {
    adjusted.forEach((item) => {
      item.y += topOverflow;
    });
  }

  return adjusted.reduce<Record<string, number>>((acc, item) => {
    acc[item.key] = item.y - item.originalY;
    return acc;
  }, {});
};

const ComparisonChartBody: React.FC<Props> = ({
  selectedMetric,
  history1,
  timelineHistory1,
  name1,
  logo1,
  compareSeries,
  customRange,
  setCustomRange,
  noTopMargin = false,
  chartVariant = "default",
  rangeSelectorVariant = "default",
  chartHeight = 340,
  fillHeight = false,
}) => {
  const [hoverCursorX, setHoverCursorX] = useState<number | null>(null);
  const hoverClipId = `market-compare-hover-left-${useId().replace(/:/g, "")}`;
  const baseSeries: CompareChartSeries = useMemo(
    () => ({
      key: "base",
      name: name1,
      logo: logo1,
      color: "#04A584",
      history: history1,
    }),
    [history1, logo1, name1]
  );
  const allSeries = useMemo(
    () => [baseSeries, ...compareSeries].filter((item) => item.history?.length),
    [baseSeries, compareSeries]
  );
  const rangeHistory1 = timelineHistory1?.length ? timelineHistory1 : history1;

  const availableRange: [Date, Date] = useMemo(() => {
    const allTimestamps = rangeHistory1.map((item) => item.timestamp);

    if (allTimestamps.length === 0) {
      return [new Date(), new Date()];
    }

    return [new Date(Math.min(...allTimestamps)), new Date(Math.max(...allTimestamps))];
  }, [rangeHistory1]);

  const { mergedData, dataKeys } = useMemo(() => {
    const formatKey = (ts: number) => moment(ts).format("MM/DD HH:mm");
    const mergedMap = new Map<string, any>();
    const keys: string[] = [];

    allSeries.forEach((series, seriesIndex) => {
      const key = `series_${seriesIndex}`;
      keys.push(key);

      const filteredHistory = series.history.filter(
        (item) =>
          !customRange ||
          (item.timestamp >= customRange[0].getTime() &&
            item.timestamp <= customRange[1].getTime())
      );
      const baseValue = filteredHistory.length
        ? toFiniteNumber(getMetricValue(selectedMetric, filteredHistory[0]))
        : null;

      filteredHistory.forEach((item) => {
        const dateKey = formatKey(item.timestamp);
        const existing = mergedMap.get(dateKey) || {
          name: dateKey,
          date: item.timestamp,
        };
        existing[key] = toPercent(
          toFiniteNumber(getMetricValue(selectedMetric, item)),
          baseValue
        );
        existing[`${key}Meta`] = series;
        mergedMap.set(dateKey, existing);
      });
    });

    return {
      mergedData: Array.from(mergedMap.values()).sort((a, b) => a.date - b.date),
      dataKeys: keys,
    };
  }, [allSeries, customRange, selectedMetric]);

  const allTimeHistory = useMemo(() => {
    const formatKey = (ts: number) => moment(ts).format("MM/DD HH:mm");

    return rangeHistory1.map((item) => ({
      name: formatKey(item.timestamp),
      date: item.timestamp,
      [name1]: getMetricValue(selectedMetric, item),
    }));
  }, [rangeHistory1, name1, selectedMetric]);

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

  const allValues = mergedData
    .flatMap((item) => dataKeys.map((key) => item[key]))
    .map(toFiniteNumber)
    .filter((value): value is number => value !== null);
  const latestLabels = dataKeys
    .map((key) => {
      for (let index = mergedData.length - 1; index >= 0; index -= 1) {
        const value = toFiniteNumber(mergedData[index]?.[key]);

        if (value !== null) {
          return {
            key,
            value,
            label: formatPercent(value),
            variant: getPercentVariant(value),
          };
        }
      }

      return null;
    })
    .filter((item): item is CompareLatestLabel => item !== null);
  const dataMinValue = allValues.length ? Math.min(...allValues) : -10;
  const dataMaxValue = allValues.length ? Math.max(...allValues) : 10;
  const dataRange =
    Math.abs(dataMaxValue - dataMinValue) ||
    Math.max(Math.abs(dataMaxValue), Math.abs(dataMinValue), 10);
  const axisPadding = dataRange * 0.08;
  const minValue = dataMinValue - axisPadding;
  const maxValue = dataMaxValue + axisPadding;
  const ticks = getAxisTicks(minValue, maxValue, latestLabels);
  const yAxisWidth = Math.min(
    178,
    Math.max(
      82,
      ...ticks.map((tick) => getPercentLabelWidth(formatPercent(tick)) + 10),
      ...latestLabels.map((item) => getPercentLabelWidth(item.label) + 10)
    )
  );
  const latestLabelOffsets = buildLatestLabelOffsets(
    latestLabels,
    minValue,
    maxValue,
    chartHeight
  );
  const latestValueTolerance = Math.max(Math.abs(maxValue - minValue) * 0.000001, 1e-9);
  const axisVisualTicks: CompareAxisVisualItem[] = ticks.map((tick) => {
    const latestLabel = latestLabels.find(
      (item: CompareLatestLabel) => Math.abs(item.value - tick) <= latestValueTolerance
    );

    return {
      value: tick,
      label: formatPercent(tick),
      isLatest: Boolean(latestLabel),
      variant: latestLabel?.variant || "neutral",
      offsetY: latestLabel ? latestLabelOffsets[latestLabel.key] || 0 : 0,
    };
  });

  return (
    <Wrapper $noTopMargin={noTopMargin} $fillHeight={fillHeight}>
      <ChartContainer $variant={chartVariant} $fillHeight={fillHeight}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart
            data={mergedData}
            margin={{ top: 8, right: 0, bottom: 14, left: 0 }}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
          >
            <defs>
              {allSeries.map((series, index) => (
                <linearGradient
                  key={series.key}
                  id={`compare-gradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={series.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={series.color} stopOpacity={0} />
                </linearGradient>
              ))}
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
                <CompareGridLayer
                  {...props}
                  ticks={axisVisualTicks}
                  domain={[minValue, maxValue]}
                  stroke={
                    chartVariant === "dark"
                      ? "rgba(115, 128, 148, 0.14)"
                      : "rgba(115, 128, 148, 0.12)"
                  }
                />
              )}
            />

            <YAxis
              domain={[minValue, maxValue]}
              orientation="right"
              width={yAxisWidth}
              axisLine={false}
              tickLine={false}
              tickMargin={0}
              ticks={ticks}
              interval={0}
              padding={{ top: 12, bottom: 12 }}
              tick={false}
            />

            <Tooltip
              allowEscapeViewBox={{ x: false, y: true }}
              wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload;

                return (
                  <TooltipCard>
                    <TooltipDate>
                      {moment(point.date).format("MMM D, YYYY, HH:mm")}
                    </TooltipDate>
                    <TooltipRows>
                      {dataKeys.map((key) => {
                        const series = point[`${key}Meta`] as CompareChartSeries | undefined;
                        if (!series || point[key] == null) return null;

                        return (
                          <TooltipRow key={key}>
                            <TooltipAsset>
                              {series.logo ? (
                                <img src={imageLoader(series.logo)} alt={series.name} />
                              ) : null}
                              <TooltipSeriesDot $color={series.color} />
                              <span>{series.symbol || series.name}</span>
                            </TooltipAsset>
                            <TooltipValue $variant={getPercentVariant(point[key])}>
                              {formatPercent(point[key])}
                            </TooltipValue>
                          </TooltipRow>
                        );
                      })}
                    </TooltipRows>
                  </TooltipCard>
                );
              }}
              cursor={<ChartHoverCursor chartVariant={chartVariant} />}
            />

            {allSeries.map((series, index) => {
              const key = dataKeys[index];
              return (
                <React.Fragment key={series.key}>
                  <Area
                    type="linear"
                    dataKey={key}
                    stroke="none"
                    fill={`url(#compare-gradient-${index})`}
                    dot={false}
                    opacity={hasHoverCursor ? 0.42 : 1}
                    connectNulls
                    isAnimationActive={false}
                  />
                  {hasHoverCursor ? (
                    <Area
                      type="linear"
                      dataKey={key}
                      stroke="none"
                      fill={`url(#compare-gradient-${index})`}
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                      clipPath={`url(#${hoverClipId})`}
                    />
                  ) : null}
                  <Line
                    type="linear"
                    dataKey={key}
                    stroke={series.color}
                    strokeWidth={index === 0 ? 2.7 : 2.45}
                    dot={false}
                    opacity={hasHoverCursor ? 0.48 : 1}
                    activeDot={{
                      r: index === 0 ? 5.4 : 5,
                      fill: series.color,
                      stroke: chartVariant === "dark" ? mainGlobalDark.background : "#fff",
                      strokeWidth: 2.3,
                    }}
                    connectNulls
                    isAnimationActive={false}
                  />
                  {hasHoverCursor ? (
                    <Line
                      type="linear"
                      dataKey={key}
                      stroke={series.color}
                      strokeWidth={index === 0 ? 2.7 : 2.45}
                      dot={false}
                      activeDot={false}
                      connectNulls
                      isAnimationActive={false}
                      clipPath={`url(#${hoverClipId})`}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
            <Customized
              component={(props: any) => (
                <CompareAxisLabelsLayer
                  {...props}
                  ticks={axisVisualTicks}
                  domain={[minValue, maxValue]}
                  axisWidth={yAxisWidth}
                  chartVariant={chartVariant}
                />
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
      <RangeSelector
        initialRange={customRange || availableRange}
        availableRange={availableRange}
        onChange={handleRangeChange}
        data={allTimeHistory}
        name={name1}
        metric={selectedMetric}
        variant={rangeSelectorVariant}
        lineColor={baseSeries.color}
        commitOnRelease
      />
    </Wrapper>
  );
};

export default ComparisonChartBody;

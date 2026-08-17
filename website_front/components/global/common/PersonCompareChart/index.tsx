import React, { ReactNode, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Body,
  Bottom,
  Header,
  Labels,
  LeftHeader,
  SearchField,
  Tabs,
  Wrapper,
} from "./styles";
import { ButtonsWrapper } from "../BarDoubleChart/styles";
import { TimeButton } from "../PriceChart/styles";
import { SearchIconStyle } from "../../Navigation/styles";
import { SearchInput } from "../../../layouts/projects/P2PExchange/styles";
import { SearchWrapper } from "../../../layouts/projects/Funds/FundsBio/styles";
import GainChange from "../GainChange";
import imageLoader from "../../../../helpers/imageLoader";
import UserAvatar from "../UserAvatar";
import Placeholder from "../Placeholder";
import { Button } from "../Button";
import EmptySection from "../../EmptySection";

interface CompareChartPoint {
  timestamp: string | number;
  value: number | null;
}

interface CompareChartSeriesItem {
  id: string;
  label: string;
  username?: string;
  logo?: string;
  color: string;
  removable?: boolean;
  isPrimary?: boolean;
  hasPublicPortfolio?: boolean;
  hasHistory?: boolean;
  hasBaseline?: boolean;
  points?: CompareChartPoint[];
}

interface IProps {
  title: string;
  items?: CompareChartSeriesItem[];
  points?: Array<Record<string, string | number | null>>;
  series?: CompareChartSeriesItem[];
  rangeOptions?: string[];
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
  onRemoveItem?: (value: string) => void;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onSearchFocusChange?: (value: boolean) => void;
  searchPlaceholder?: string;
  searchDropdown?: ReactNode;
  filterItemsBySearch?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  noResultsTitle?: string;
  noResultsDescription?: string;
  noChartTitle?: string;
  noChartDescription?: string;
  noBaselineTitle?: string;
  noBaselineDescription?: string;
}

type ChartRow = Record<string, string | number | null>;

const DEFAULT_ROI_LABELS = [15, 10, 5, 0, -5, -10, -15];

const normalizeTimestamp = (
  value: string | number | null | undefined
): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const timestamp = new Date(value).getTime();

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return null;
};

const formatChartDate = (value: string | number): string => {
  const timestamp = normalizeTimestamp(value);

  if (timestamp === null) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
};

const getSeriesStatus = (
  item: CompareChartSeriesItem
): { label: string; isMuted: boolean } | null => {
  if (item.hasPublicPortfolio === false) {
    return { label: "No public portfolio", isMuted: true };
  }

  if (item.hasHistory === false) {
    return { label: "No history", isMuted: true };
  }

  if (item.hasBaseline === false) {
    return { label: "No baseline", isMuted: true };
  }

  return null;
};

const PersonCompareChart: React.FC<IProps> = ({
  title,
  items = [],
  points = [],
  series,
  rangeOptions = [],
  selectedRange,
  onRangeChange,
  onRemoveItem,
  searchValue,
  onSearchValueChange,
  onSearchFocusChange,
  searchPlaceholder = "Filter compared users",
  searchDropdown,
  filterItemsBySearch = true,
  isLoading = false,
  isError = false,
  isFetching = false,
  onRetry,
  emptyTitle = "No data",
  emptyDescription = "No public portfolios were found for the selected users.",
  noResultsTitle = "No matching users",
  noResultsDescription = "Try another search query.",
  noChartTitle = "No chart data",
  noChartDescription = "There isn't enough data to render the chart.",
  noBaselineTitle = "No baseline",
  noBaselineDescription = "The selected users do not have a baseline for this range yet.",
}) => {
  const [internalSelectedTab, setInternalSelectedTab] = useState<string>(
    rangeOptions[0] || ""
  );
  const [internalSearchValue, setInternalSearchValue] = useState<string>("");

  const activeTab = selectedRange || internalSelectedTab;
  const currentSearchValue =
    typeof searchValue === "string" ? searchValue : internalSearchValue;
  const normalizedSearch = currentSearchValue.trim().toLowerCase();

  const resolvedSeries = useMemo(() => {
    if (series?.length) {
      return series.map((item, index) => ({
        ...item,
        isPrimary: item.isPrimary ?? index === 0,
        points: (item.points || [])
          .map((point) => {
            const timestamp = normalizeTimestamp(point.timestamp);

            if (timestamp === null) {
              return null;
            }

            return {
              timestamp,
              value:
                typeof point.value === "number" && Number.isFinite(point.value)
                  ? point.value
                  : null,
            };
          })
          .filter(Boolean) as Array<{
          timestamp: number;
          value: number | null;
        }>,
      }));
    }

    return items.map((item, index) => ({
      ...item,
      isPrimary: item.isPrimary ?? index === 0,
      points: points
        .map((point) => {
          const timestamp = normalizeTimestamp(point.date);
          const value = point[item.id];

          if (
            timestamp === null ||
            typeof value !== "number" ||
            !Number.isFinite(value)
          ) {
            return null;
          }

          return {
            timestamp,
            value,
          };
        })
        .filter(Boolean) as Array<{ timestamp: number; value: number }>,
    }));
  }, [items, points, series]);

  const filteredSeries = useMemo(() => {
    if (!filterItemsBySearch || !normalizedSearch) {
      return resolvedSeries;
    }

    return resolvedSeries.filter((item) =>
      [item.label, item.username || ""].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      )
    );
  }, [filterItemsBySearch, normalizedSearch, resolvedSeries]);

  const chartData = useMemo(() => {
    const mergedPoints = new Map<number, ChartRow>();

    filteredSeries.forEach((item) => {
      (item.points || []).forEach((point) => {
        if (!mergedPoints.has(point.timestamp)) {
          mergedPoints.set(point.timestamp, {
            timestamp: point.timestamp,
            date: new Date(point.timestamp).toISOString(),
          });
        }

        mergedPoints.get(point.timestamp)![item.id] = point.value;
      });
    });

    return Array.from(mergedPoints.values()).sort(
      (left, right) => Number(left.timestamp) - Number(right.timestamp)
    );
  }, [filteredSeries]);

  const visibleDataKeys = filteredSeries.map((item) => item.id);

  const visibleValues = useMemo(() => {
    const values: number[] = [];

    chartData.forEach((point) => {
      visibleDataKeys.forEach((key) => {
        const nextValue = point[key];

        if (typeof nextValue === "number" && Number.isFinite(nextValue)) {
          values.push(nextValue);
        }
      });
    });

    return values;
  }, [chartData, visibleDataKeys]);

  const leftLabels = useMemo(() => {
    if (!visibleValues.length) {
      return DEFAULT_ROI_LABELS;
    }

    const min = Math.min(...visibleValues);
    const max = Math.max(...visibleValues);

    if (min === max) {
      return [max + 3, max + 2, max + 1, max, max - 1, max - 2, max - 3].map(
        (value) => Number(value.toFixed(1))
      );
    }

    const steps = 6;

    return Array.from({ length: 7 }).map((_, index) => {
      const factor = (steps - index) / steps;
      return Number((min + (max - min) * factor).toFixed(1));
    });
  }, [visibleValues]);

  const bottomLabels = useMemo(() => {
    if (!chartData.length) {
      return [];
    }

    const maxLabels = 7;
    const step = Math.max(1, Math.ceil(chartData.length / maxLabels));

    return chartData
      .filter((_, index) => index % step === 0)
      .slice(0, maxLabels)
      .map((item) => formatChartDate(Number(item.timestamp)));
  }, [chartData]);

  const hasSearchResults = filteredSeries.length > 0;
  const hasAnyPortfolio = filteredSeries.some(
    (item) => item.hasPublicPortfolio !== false
  );
  const hasAnyMissingBaseline = filteredSeries.some(
    (item) =>
      item.hasPublicPortfolio !== false &&
      item.hasHistory !== false &&
      item.hasBaseline === false
  );
  const hasAnyChartSeries = filteredSeries.some((item) =>
    (item.points || []).some(
      (point) => typeof point.value === "number" && Number.isFinite(point.value)
    )
  );
  const isNoResultsState =
    filterItemsBySearch && Boolean(normalizedSearch) && !hasSearchResults;
  const isEmptyState = !isNoResultsState && !hasAnyPortfolio;
  const isNoBaselineState =
    !isNoResultsState &&
    !isEmptyState &&
    !hasAnyChartSeries &&
    hasAnyMissingBaseline;
  const isNoChartState =
    !isNoResultsState &&
    !isEmptyState &&
    !isNoBaselineState &&
    !hasAnyChartSeries;
  const shouldRenderChart =
    !isLoading &&
    !isError &&
    !isNoResultsState &&
    !isEmptyState &&
    !isNoBaselineState &&
    !isNoChartState;
  const chartRenderKey = useMemo(
    () =>
      [
        activeTab,
        filteredSeries.map((item) => item.id).join(","),
        chartData.length,
        chartData.map((point) => String(point.timestamp)).join(","),
      ].join("::"),
    [activeTab, chartData, filteredSeries]
  );

  return (
    <Wrapper variant="main">
      <Header>
        <LeftHeader>
          <h3>{title}</h3>
          <SearchWrapper className="white-input">
            <SearchField>
              <SearchInput
                className="small-input"
                value={currentSearchValue}
                onChange={(value) =>
                  onSearchValueChange
                    ? onSearchValueChange(value)
                    : setInternalSearchValue(value)
                }
                onFocus={onSearchFocusChange}
                placeholder={searchPlaceholder}
                type="text"
                leftIcon={<SearchIconStyle />}
              />
              {searchDropdown}
            </SearchField>
          </SearchWrapper>
        </LeftHeader>

        <ButtonsWrapper>
          {rangeOptions.map((item) => (
            <TimeButton
              key={item}
              onClick={() =>
                onRangeChange
                  ? onRangeChange(item)
                  : setInternalSelectedTab(item)
              }
              active={activeTab === item}
            >
              {item}
            </TimeButton>
          ))}
        </ButtonsWrapper>
      </Header>
      <Tabs>
        {filteredSeries.map((item) => {
          const status = getSeriesStatus(item);

          return (
            <div
              style={{ background: "transparent" }}
              key={item.id}
              className={`tab btn${status?.isMuted ? " is-muted" : ""}`}
            >
              <UserAvatar
                variant="default"
                size="small"
                name="person"
                avatar={imageLoader(item.logo || "")}
              />
              <span
                className="color"
                style={{
                  background: item.color,
                  opacity: status?.isMuted ? 0.5 : 1,
                }}
              />
              <span>{item.label}</span>
              {status ? (
                <span className="status-badge">{status.label}</span>
              ) : null}
              {item.removable && onRemoveItem ? (
                <button
                  type="button"
                  className="remove-btn"
                  aria-label={`Remove ${item.label}`}
                  onClick={() => onRemoveItem(item.id)}
                >
                  x
                </button>
              ) : null}
            </div>
          );
        })}
      </Tabs>
      <Body>
        <Labels>
          {(shouldRenderChart ? leftLabels : []).map((item, index) => (
            <GainChange key={index} label="x" value={Number(item)} />
          ))}
        </Labels>
        <div style={{ width: "calc(100% - 50px)" }}>
          {isLoading ? (
            <Placeholder
              width="100%"
              height="320px"
              borderRadius="16px"
              marginBottom="0"
            />
          ) : isError ? (
            <div style={{ padding: "24px 12px" }}>
              <div style={{ fontWeight: "var(--font-weight-semibold)", marginBottom: 8 }}>
                Unable to load portfolio ROI
              </div>
              <div style={{ color: "var(--main-gray)", marginBottom: 12 }}>
                The comparison data could not be loaded right now.
              </div>
              {onRetry ? (
                <Button variant="outlined" onClick={onRetry}>
                  {isFetching ? "Retrying..." : "Retry"}
                </Button>
              ) : null}
            </div>
          ) : isNoResultsState ? (
            <div style={{ padding: "24px 12px" }}>
              <div style={{ fontWeight: "var(--font-weight-semibold)", marginBottom: 8 }}>
                {noResultsTitle}
              </div>
              <div style={{ color: "var(--main-gray)" }}>
                {noResultsDescription}
              </div>
            </div>
          ) : isEmptyState ? (
            <div style={{ padding: "24px 12px" }}>
              <div style={{ fontWeight: "var(--font-weight-semibold)", marginBottom: 8 }}>
                {emptyTitle}
              </div>
              <div style={{ color: "var(--main-gray)" }}>
                {emptyDescription}
              </div>
            </div>
          ) : isNoBaselineState ? (
            <div
              style={{
                minHeight: "320px",
                display: "grid",
                placeItems: "center",
                padding: "24px 12px",
              }}
            >
              <EmptySection
                className="small-empty-section"
                title={noBaselineTitle}
                description={noBaselineDescription}
              />
            </div>
          ) : isNoChartState ? (
            <div style={{ padding: "24px 12px" }}>
              <div style={{ fontWeight: "var(--font-weight-semibold)", marginBottom: 8 }}>
                {noChartTitle}
              </div>
              <div style={{ color: "var(--main-gray)" }}>
                {noChartDescription}
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="92%">
              <LineChart key={chartRenderKey} data={chartData}>
                <CartesianGrid strokeDasharray="1 1" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  hide
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    const visiblePayload = (payload || []).filter(
                      (entry) =>
                        typeof entry.value === "number" &&
                        Number.isFinite(Number(entry.value))
                    );

                    if (active && visiblePayload.length) {
                      const pointTimestamp =
                        typeof label === "number"
                          ? label
                          : normalizeTimestamp(String(label || ""));

                      return (
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: "8px",
                            padding: "10px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            fontFamily: "Arial",
                            fontSize: "12px",
                            color: "#070B35",
                          }}
                        >
                          <p style={{ margin: "5px 0" }}>
                            <strong>Date:</strong>{" "}
                            {pointTimestamp !== null
                              ? formatChartDate(pointTimestamp)
                              : "-"}
                          </p>
                          {visiblePayload.map((entry, index) => (
                            <p
                              key={`${entry.dataKey}-${index}`}
                              style={{ margin: "5px 0" }}
                            >
                              <strong>{entry.name}:</strong>{" "}
                              {typeof entry.value === "number"
                                ? `${entry.value > 0 ? "+" : ""}${entry.value.toFixed(1)}%`
                                : "-"}
                            </p>
                          ))}
                        </div>
                      );
                    }

                    return null;
                  }}
                />
                {filteredSeries.map((item) => {
                  const status = getSeriesStatus(item);

                  return (
                    <Line
                      key={item.id}
                      type="linear"
                      dataKey={item.id}
                      stroke={item.color}
                      strokeOpacity={status?.isMuted ? 0.35 : 1}
                      strokeWidth={item.isPrimary ? 3 : 2}
                      isAnimationActive={false}
                      activeDot={{ r: item.isPrimary ? 7 : 6 }}
                      dot={false}
                      name={item.label}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
          <Bottom>
            {(shouldRenderChart ? bottomLabels : []).map((item, index) => (
              <div key={index}>{item}</div>
            ))}
          </Bottom>
        </div>
      </Body>
    </Wrapper>
  );
};

export default PersonCompareChart;

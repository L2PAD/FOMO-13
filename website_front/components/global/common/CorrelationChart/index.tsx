import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import {
  ComposedChart,
  Line,
  CartesianGrid,
  Scatter,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartWrapper,
  HeaderWrapper,
  Labels,
  LabelsDescription,
  OverflowChart,
  Wrapper,
} from "./styles";
import { ButtonsWrapper, Overflow } from "../BarDoubleChart/styles";
import { TimeButton } from "../PriceChart/styles";
import PhotoIcon from "../../Icons/PhotoIcon";
import { SearchIconStyle } from "../../Navigation/styles";
import {
  SearchInput,
  SearchWrapper,
} from "../../../layouts/projects/Networks/styles";
import { SearchContainer } from "../../../layouts/projects/CryptoMarket/styles";
import { Bottom } from "../LineDoubleChart/styles";
import SaveShareModal from "../../modals/SaveShareModal";
import { getUnlockEvents } from "../../../../helpers/unlockingDisplay";
import fetchTokenUnlocks from "../../../../http/unlocks/fetchTokenUnlocks";
import SearchResults from "../../Navigation/SearchResults";

const tabs = ["24H", "7D", "MTD", "30D"];

interface ICorrelationPoint {
  date: Date;
  hasPreUnlockPrice: boolean;
  hasTokenPrice: boolean;
  name: string;
  tokenPrice: number;
  preUnlockPrice: number;
  unlockMarker: number | null;
  unlockValueUsd?: number;
  unlockedPercent?: number;
  category?: string;
}

const toNumber = (value: unknown): number | null => {
  const numberValue =
    typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
};

const toTimestamp = (value: unknown): number | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  if (typeof value === "string") {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return numericValue > 1_000_000_000_000 ? numericValue : numericValue * 1000;
    }

    const dateValue = new Date(value).getTime();

    return Number.isNaN(dateValue) ? null : dateValue;
  }

  return null;
};

const getPointTimestamp = (point: any): number | null =>
  toTimestamp(
    point?.date ||
    point?.timestamp ||
    point?.time ||
    point?.unlockDate ||
    point?.unlock_date ||
    point?.createdAt
  );

const getPriceValue = (point: any): number | null =>
  toNumber(
    point?.priceUsd ||
    point?.price_usd ||
    point?.price ||
    point?.close ||
    point?.value ||
    point?.y
  );

const getUnlockValue = (point: any): number | null =>
  toNumber(
    point?.unlockValueUsd ||
    point?.valueUsd ||
    point?.unlockedValueUsd ||
    point?.roundSnapshots?.[0]?.unlockedValueUsd
  );

const getUnlockPercent = (point: any): number | null =>
  toNumber(
    point?.unlockedPercentInPeriod ||
    point?.unlockedPercent ||
    point?.tokensPercent ||
    point?.percent ||
    point?.roundSnapshots?.[0]?.unlockedPercent
  );

const formatCompactNumber = (value: number): string => {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;

  return value.toFixed(value < 10 ? 2 : 0);
};

const formatPrice = (value: number): string => {
  if (Math.abs(value) >= 1) return `$${formatCompactNumber(value)}`;
  if (Math.abs(value) > 0) return `$${value.toFixed(6)}`;

  return "$0";
};

const getRangeBounds = (tab: string): { start: number | null; end: number | null } => {
  const now = Date.now();

  if (tab === "24H") return { start: now - 24 * 60 * 60 * 1000, end: now + 24 * 60 * 60 * 1000 };
  if (tab === "7D") return { start: now, end: now + 7 * 24 * 60 * 60 * 1000 };
  if (tab === "30D") return { start: now, end: now + 30 * 24 * 60 * 60 * 1000 };
  if (tab === "MTD") {
    const start = new Date();
    const end = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start: start.getTime(), end: end.getTime() };
  }

  return { start: null, end: null };
};

const getTokenName = (unlock: any): string =>
  unlock?.detailed?.name || unlock?.name || unlock?.coinSlug || "Token";

const getTokenSymbol = (unlock: any): string =>
  String(unlock?.coinSymbol || unlock?.detailed?.symbol || unlock?.symbol || "")
    .trim()
    .toUpperCase();

const getCurrentPrice = (unlock: any): number =>
  toNumber(unlock?.priceUsd || unlock?.detailed?.price?.USD || unlock?.detailed?.priceUsd) || 0;

const getUnlockSearchKey = (unlock: any): string =>
  String(unlock?._id || unlock?.sourceKey || unlock?.coinSlug || unlock?.coinId || "");

const mapUnlockToSearchResult = (unlock: any) => ({
  ...unlock,
  _id: getUnlockSearchKey(unlock),
  banner: getTokenSymbol(unlock) || unlock?.coinSlug || "Token Unlock",
  logo: unlock?.detailed?.image || unlock?.logo || unlock?.image || unlock?.icon,
  metadataLogo: unlock?.detailed?.image || unlock?.logo || unlock?.image || unlock?.icon,
  name: getTokenName(unlock),
  unlockItem: unlock,
});

const buildCorrelationData = (
  unlock: any,
  selectedTab: string
): ICorrelationPoint[] => {
  if (!unlock) return [];

  const rangeBounds = getRangeBounds(selectedTab);
  const events = getUnlockEvents(unlock) as Array<any>;
  const sourcePoints: Array<any> = Array.isArray(unlock?.chart) && unlock.chart.length
    ? unlock.chart
    : events.map((event) => ({
      date: event.dateValue,
      priceUsd: event.priceUsd,
      unlockValueUsd: event.raw?.unlockValueUsd || event.raw?.valueUsd,
      unlockedPercent: event.tokensPercent,
      category: event.allocation,
    }));
  const currentPrice = getCurrentPrice(unlock);
  const eventByDate = new Map<string, any>();

  events.forEach((event) => {
    const timestamp = toTimestamp(event?.dateValue || event?.raw?.unlockDate || event?.raw?.date);

    if (!timestamp) return;

    eventByDate.set(new Date(timestamp).toDateString(), event);
  });

  const mappedPoints: Array<ICorrelationPoint | null> = sourcePoints
    .map((point: any) => {
      const timestamp = getPointTimestamp(point);

      if (!timestamp) return null;

      const event = eventByDate.get(new Date(timestamp).toDateString());
      const explicitPrice = getPriceValue(point);
      const unlockValueUsd =
        getUnlockValue(point) ||
        toNumber(event?.raw?.unlockValueUsd || event?.raw?.valueUsd) ||
        null;
      const unlockedPercent =
        getUnlockPercent(point) ||
        toNumber(event?.tokensPercent || event?.raw?.tokensPercent) ||
        null;
      const priceValue =
        explicitPrice ||
        toNumber(event?.priceUsd) ||
        currentPrice ||
        null;
      const tokenPrice =
        priceValue || 0;

      return {
        category:
          point?.category ||
          point?.roundSnapshots?.[0]?.name ||
          event?.allocation ||
          "Token Unlock",
        date: new Date(timestamp),
        name: new Date(timestamp).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
        }),
        hasPreUnlockPrice: Boolean(priceValue),
        hasTokenPrice: Boolean(priceValue),
        preUnlockPrice: tokenPrice,
        tokenPrice,
        unlockMarker: event || unlockValueUsd || unlockedPercent ? tokenPrice : null,
        unlockValueUsd: unlockValueUsd || undefined,
        unlockedPercent: unlockedPercent || undefined,
      };
    })
  const points: ICorrelationPoint[] = mappedPoints
    .filter((point: ICorrelationPoint | null): point is ICorrelationPoint => Boolean(point))
    .sort((left: ICorrelationPoint, right: ICorrelationPoint) => left.date.getTime() - right.date.getTime());
  const rangedPoints = points.filter((point: ICorrelationPoint) => {
    const timestamp = point.date.getTime();
    const isAfterStart = !rangeBounds.start || timestamp >= rangeBounds.start;
    const isBeforeEnd = !rangeBounds.end || timestamp <= rangeBounds.end;

    return isAfterStart && isBeforeEnd;
  });
  const visiblePoints = rangedPoints.length ? rangedPoints : points.slice(0, 12);

  return visiblePoints.map((point: ICorrelationPoint, index: number, items: ICorrelationPoint[]) => ({
    ...point,
    hasPreUnlockPrice: index > 0 ? items[index - 1].hasTokenPrice : point.hasTokenPrice,
    preUnlockPrice: index > 0 ? items[index - 1].tokenPrice : point.tokenPrice,
  }));
};

const CorrelationChart = () => {
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedUnlock, setSelectedUnlock] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<string>("MTD");
  const [isScreenModal, setIsScreenModal] = useState<boolean>(false);
  const [htmlData, setHtmlData] = useState<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const { data: searchData, isLoading: isSearchLoading } = useQuery(
    ["unlocking-correlation-search", debouncedQuery],
    () => {
      const params = new URLSearchParams({
        limit: "10",
        search: debouncedQuery,
        status: "all",
      });

      return fetchTokenUnlocks(`?${params.toString()}`);
    },
    {
      enabled: debouncedQuery.length > 1,
      refetchOnWindowFocus: false,
    }
  );
  const searchResults = useMemo(
    () => (searchData?.unlocks || []).map(mapUnlockToSearchResult),
    [searchData?.unlocks]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isSearchOpen]);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setSelectedUnlock(null);
    setIsSearchOpen(true);
  };

  const handleSelectProject = (item: any) => {
    const unlock = item?.unlockItem || item;

    setSelectedUnlock(unlock);
    setQuery(getTokenName(unlock));
    setIsSearchOpen(false);
  };

  const chartData = useMemo(
    () => buildCorrelationData(selectedUnlock, selectedTab),
    [selectedTab, selectedUnlock]
  );
  const yLabels = useMemo(() => {
    const values = chartData
      .flatMap((item) => [item.tokenPrice, item.preUnlockPrice])
      .filter((value) => Number.isFinite(value));

    if (!values.length || values.every((value) => value === 0)) {
      return ["0", "0", "0", "0", "0", "0"];
    }

    const maxValue = Math.max(...values, 0);
    const minValue = Math.min(...values, 0);
    const step = (maxValue - minValue) / 5 || 1;

    return Array.from({ length: 6 }, (_, index) =>
      formatCompactNumber(maxValue - step * index)
    );
  }, [chartData]);
  const xLabels = useMemo(() => {
    if (chartData.length <= 7) return chartData.map((item) => item.name);

    const step = (chartData.length - 1) / 6;

    return Array.from({ length: 7 }, (_, index) => {
      const item = chartData[Math.round(step * index)];

      return item?.name || "";
    });
  }, [chartData]);
  const tokenName = selectedUnlock ? getTokenName(selectedUnlock) : "";
  const tokenSymbol = selectedUnlock ? getTokenSymbol(selectedUnlock) : "";
  const modalTitle = selectedUnlock
    ? `Correlation with Price - ${tokenName}${tokenSymbol ? ` [${tokenSymbol}]` : ""}`
    : "Correlation with Price";
  const shareLink =
    typeof window !== "undefined" ? window.location.href : "";

  const CustomCross = (props: any) => {
    const { cx, cy, payload } = props;

    if (!payload?.unlockMarker) return null;

    return (
      <svg
        x={cx - 4}
        y={cy - 4}
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.33366 0.667969L0.666992 7.33463M7.33366 7.33463L0.666993 0.667967"
          stroke="#FF5858"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <>
      <Wrapper ref={chartRef}>
        <HeaderWrapper>
          <h3>{modalTitle}</h3>
          <ButtonsWrapper>
            {tabs.map((item: string) => (
              <TimeButton
                key={item}
                onClick={() => setSelectedTab(item)}
                active={selectedTab === item}
              >
                {item}
              </TimeButton>
            ))}
            <button
              type="button"
              className="photo-button"
              onClick={() => {
                setHtmlData(chartRef.current);
                setIsScreenModal(true);
              }}
            >
              <PhotoIcon />
            </button>
          </ButtonsWrapper>
        </HeaderWrapper>
        <div ref={searchRef}>
          <SearchContainer>
            <SearchWrapper>
              <SearchInput
                className="white-input"
                value={query}
                onFocus={() => setIsSearchOpen(true)}
                onChange={handleSearchChange}
                placeholder="Select project"
                type="text"
                leftIcon={<SearchIconStyle />}
              />
            </SearchWrapper>
            <SearchResults
              isLoading={isSearchLoading}
              isVisible={isSearchOpen && query.trim().length > 1}
              funds={[]}
              projects={searchResults as any}
              persons={[]}
              onClick={handleSelectProject}
            />
          </SearchContainer>
        </div>
        <ChartContainer>
          <Labels>
            {yLabels.map((item: string, index: number) => {
              return <div key={index}>{item}</div>;
            })}
          </Labels>
          <OverflowChart>
            <ChartWrapper>
              {selectedUnlock ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <ComposedChart width={500} height={400} data={chartData}>
                  <CartesianGrid stroke="#F0F2F5" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;

                      const point = payload.find((item) => item?.payload)?.payload as
                        | ICorrelationPoint
                        | undefined;

                      if (!point) return null;

                      return (
                        <div
                          style={{
                            background: "rgba(255, 255, 255, 0.9)",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            color: "#070B35",
                            fontSize: "12px",
                            padding: "10px",
                          }}
                        >
                          <p style={{ margin: "0 0 8px", fontWeight: "var(--font-weight-semibold)" }}>
                            {point.date.toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <strong>Token price:</strong>{" "}
                            {point.hasTokenPrice ? formatPrice(point.tokenPrice) : "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <strong>Price before unlock:</strong>{" "}
                            {point.hasPreUnlockPrice
                              ? formatPrice(point.preUnlockPrice)
                              : "-"}
                          </p>
                          {point.unlockMarker ? (
                            <>
                              <p style={{ margin: "4px 0" }}>
                                <strong>Unlock event:</strong> {point.category || "-"}
                              </p>
                              <p style={{ margin: "4px 0" }}>
                                <strong>Unlock value:</strong>{" "}
                                {point.unlockValueUsd !== undefined
                                  ? `$${formatCompactNumber(point.unlockValueUsd)}`
                                  : "-"}
                              </p>
                              <p style={{ margin: "4px 0" }}>
                                <strong>Unlock percent:</strong>{" "}
                                {point.unlockedPercent !== undefined
                                  ? `${point.unlockedPercent.toFixed(2)}%`
                                  : "-"}
                              </p>
                            </>
                          ) : null}
                        </div>
                      );
                    }}
                  />
                  <Line type="linear" dataKey="tokenPrice" stroke="#4F85BD" dot={false} />
                  <Line
                    type="step"
                    dataKey="preUnlockPrice"
                    stroke="#738094"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Scatter dataKey="unlockMarker" shape={<CustomCross />} />
                </ComposedChart>
              </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    alignItems: "center",
                    color: "#738094",
                    display: "flex",
                    fontSize: 16,
                    fontWeight: "var(--font-weight-medium)",
                    justifyContent: "center",
                    minHeight: 300,
                    textAlign: "center",
                  }}
                >
                  Select a project to view correlation with price
                </div>
              )}
            </ChartWrapper>
            <Bottom className="rotate">
              {xLabels.map((item, index) => (
                <div key={`${item}-${index}`}>
                  <span>{item}</span>
                </div>
              ))}
            </Bottom>
          </OverflowChart>
        </ChartContainer>
        <LabelsDescription>
          <div className="description-item">
            <div className="blue-line" />
            <span>Token price</span>
          </div>

          <div className="description-item">
            <div>
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.33366 0.667969L0.666992 7.33463M7.33366 7.33463L0.666993 0.667967"
                  stroke="#FF5858"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span>Unlock events</span>
          </div>

          <div className="description-item">
            <div className="dashed-line" />
            <span>Price before unlock</span>
          </div>
        </LabelsDescription>
      </Wrapper>
      <SaveShareModal
        name={modalTitle}
        link={shareLink}
        html={htmlData || chartRef.current}
        isVisible={isScreenModal}
        onClose={() => setIsScreenModal(false)}
      />
    </>
  );
};

export default CorrelationChart;

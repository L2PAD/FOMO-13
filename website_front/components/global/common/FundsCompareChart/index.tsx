import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  Body,
  Bottom,
  Header,
  Labels,
  LeftHeader,
  SearchDropdown,
  SearchField,
  SearchOption,
  Tabs,
  Wrapper,
} from "./styles";
import { ButtonsWrapper } from "../BarDoubleChart/styles";
import { TimeButton } from "../PriceChart/styles";
import ChartLoadingSkeleton from "../PriceChart/ChartLoadingSkeleton";
import { SearchIconStyle } from "../../Navigation/styles";
import { SearchInput } from "../../../layouts/projects/P2PExchange/styles";
import { SearchWrapper } from "../../../layouts/projects/Funds/FundsBio/styles";
import GainChange from "../GainChange";

const tabs = ["30D", "90D", "6M", "YTD", "All Time"];

const data = [
  {
    companyType: "Alpha Ventures",
    name: "23 Dec",
    totalInvestment: 25,
    keyProjects: [
      { name: "OpenAI Vision", amount: 50 },
      { name: "DeepMind Next", amount: 15 },
      { name: "AI Core Labs", amount: 5 },
    ],
    investments0: 1290,
    investments1: 4290,
    investments2: 2490,
    investments3: 2490,
    investments4: 3490,
  },
  {
    companyType: "DeFi Capital",
    name: "24 Dec",
    totalInvestment: 70,
    keyProjects: [
      { name: "OpenAI Vision", amount: 50 },
      { name: "DeepMind Next", amount: 15 },
      { name: "AI Core Labs", amount: 5 },
    ],
    investments0: 6000,
    investments1: 1200,
    investments2: 1000,
    investments3: 2000,
    investments4: 3200,
  },
  {
    companyType: "AI Nexus Fund",
    name: "25 Dec",
    totalInvestment: 50,
    keyProjects: [
      { name: "OpenAI Vision", amount: 50 },
      { name: "DeepMind Next", amount: 15 },
      { name: "AI Core Labs", amount: 5 },
    ],
    investments0: 2400,
    investments1: 2200,
    investments2: 3000,
    investments3: 1200,
    investments4: 3000,
  },
  {
    companyType: "The Sandbox",
    name: "25 Dec",
    totalInvestment: 120,
    keyProjects: [
      { name: "OpenAI Vision", amount: 50 },
      { name: "DeepMind Next", amount: 15 },
      { name: "AI Core Labs", amount: 5 },
    ],
    investments0: 2700,
    investments1: 1200,
    investments2: 3000,
    investments3: 1200,
    investments4: 3000,
  },
  {
    companyType: "The Sandbox",
    name: "25 Dec",
    totalInvestment: 120,
    keyProjects: [
      { name: "OpenAI Vision", amount: 50 },
      { name: "DeepMind Next", amount: 15 },
      { name: "AI Core Labs", amount: 5 },
    ],
    investments0: 2200,
    investments1: 1800,
    investments2: 3200,
    investments3: 1200,
    investments4: 3000,
  },
  {
    companyType: "The Sandbox",
    name: "25 Dec",
    totalInvestment: 120,
    keyProjects: [
      { name: "OpenAI Vision", amount: 50 },
      { name: "DeepMind Next", amount: 15 },
      { name: "AI Core Labs", amount: 5 },
    ],
    investments0: 2400,
    investments1: 800,
    investments2: 2400,
    investments3: 1200,
    investments4: 3000,
  },
  {
    companyType: "The Sandbox",
    name: "25 Dec",
    totalInvestment: 120,
    keyProjects: [
      { name: "OpenAI Vision", amount: 50 },
      { name: "DeepMind Next", amount: 15 },
      { name: "AI Core Labs", amount: 5 },
    ],
    investments0: 1200,
    investments1: 1500,
    investments2: 3200,
    investments3: 1200,
    investments4: 3000,
  },
];

export type FundsCompareChartLine = {
  label: string;
  color: string;
};

export type FundsCompareChartSearchItem = {
  id?: string;
  roundId?: string;
  projectName?: string;
  name?: string;
  label?: string;
  roundName?: string;
  roundLabel?: string;
  currentRoiDisplay?: string;
};

export type FundsCompareChartPoint = {
  name: string;
  companyType?: string;
  totalInvestment?: number;
  keyProjects?: Array<{ name: string; amount: number; category?: string }>;
  categories?: string[];
  [key: string]: any;
};

interface IProps {
  title: string;
  tooltip?: "default" | "comparison";
  dataByTab?: Record<string, FundsCompareChartPoint[]>;
  lines?: FundsCompareChartLine[];
  leftLabels?: Array<number | string>;
  leftLabelsByTab?: Record<string, Array<number | string>>;
  disableLineHiding?: boolean;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onSearchFocusChange?: (value: boolean) => void;
  searchPlaceholder?: string;
  searchItems?: FundsCompareChartSearchItem[];
  isSearchLoading?: boolean;
  isSearchDisabled?: boolean;
  isSearchDropdownOpen?: boolean;
  loadingSearchText?: string;
  emptySearchText?: string;
  onSearchItemSelect?: (item: FundsCompareChartSearchItem) => void;
  onRemoveLine?: (index: number) => void;
  nonRemovableLineIndexes?: number[];
  filterLinesBySearch?: boolean;
  isLoading?: boolean;
}

export const LINE_CHART_COLORS = ["#4F85BD", "#EB609C", "#D87D9B"];

const sectionTabs = [
  { color: LINE_CHART_COLORS[0], label: "Alpha Ventures" },
  { color: LINE_CHART_COLORS[1], label: "DeFi Capital" },
  { color: LINE_CHART_COLORS[2], label: "AI Nexus Fund" },
];

const marketCapLabels = [
  "$2B",
  "$1B",
  "$800M",
  "$500M",
  "$300M",
  "$100M",
  "$0",
];

const roiLabels = [15, 10, 5, 0, -5, -10, -15];

const FundsCompareChart: React.FC<IProps> = ({
  title,
  tooltip = "default",
  dataByTab,
  lines,
  leftLabels: customLeftLabels,
  leftLabelsByTab,
  disableLineHiding = false,
  searchValue,
  onSearchValueChange,
  onSearchFocusChange,
  searchPlaceholder = "Search project",
  searchItems = [],
  isSearchLoading = false,
  isSearchDisabled = false,
  isSearchDropdownOpen = false,
  loadingSearchText = "Loading",
  emptySearchText = "No projects found",
  onSearchItemSelect,
  onRemoveLine,
  nonRemovableLineIndexes = [],
  filterLinesBySearch,
  isLoading = false,
}) => {
  const selectedMode = "ROI";
  const [selectedTab, setSelectedTab] = useState<string>("30D");
  const [internalSearchValue, setInternalSearchValue] = useState<string>("");
  const [hiddenLineIndexes, setHiddenLineIndexes] = useState<number[]>([]);
  const chartData = useMemo(
    () => (dataByTab ? dataByTab[selectedTab] || [] : data),
    [dataByTab, selectedTab],
  );
  const chartLines = lines || sectionTabs;
  const currentSearchValue =
    typeof searchValue === "string" ? searchValue : internalSearchValue;
  const hasExternalSearch = Boolean(onSearchValueChange || onSearchItemSelect);
  const shouldFilterLinesBySearch =
    filterLinesBySearch ?? !hasExternalSearch;
  const nonRemovableLineIndexSet = useMemo(
    () => new Set(nonRemovableLineIndexes),
    [nonRemovableLineIndexes],
  );
  const normalizedSearchValue = currentSearchValue.trim().toLowerCase();
  const visibleLines = chartLines
    .map((line, index) => ({ ...line, originalIndex: index }))
    .filter((line) => {
      if (!onRemoveLine && hiddenLineIndexes.includes(line.originalIndex)) return false;
      if (!shouldFilterLinesBySearch || !normalizedSearchValue) return true;
      return line.label.toLowerCase().includes(normalizedSearchValue);
    });

  useEffect(() => {
    setHiddenLineIndexes((currentIndexes) =>
      currentIndexes.filter((index) => index < chartLines.length),
    );
  }, [chartLines.length]);

  useEffect(() => {
    if (!dataByTab || dataByTab[selectedTab]) return;
    const firstAvailableTab = tabs.find((tab) => dataByTab[tab]?.length);
    if (firstAvailableTab) setSelectedTab(firstAvailableTab);
  }, [dataByTab, selectedTab]);

  const hideLine = (index: number): void => {
    setHiddenLineIndexes((currentIndexes) =>
      currentIndexes.includes(index)
        ? currentIndexes
        : [...currentIndexes, index],
    );
  };

  const changeSearchValue = (value: string): void => {
    if (onSearchValueChange) {
      onSearchValueChange(value);
      return;
    }

    setInternalSearchValue(value);
  };

  const selectSearchItem = (item: FundsCompareChartSearchItem): void => {
    if (onSearchItemSelect) {
      onSearchItemSelect(item);
    }
  };

  const getTooltip = (): any => {
    if (tooltip === "default") {
      return (
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const { companyType, keyProjects, totalInvestment } = payload[0].payload;
              const roiItems = payload
                .filter((item: any) => {
                  return (
                    String(item?.dataKey || "").startsWith("investments") &&
                    item?.value !== null &&
                    item?.value !== undefined
                  );
                })
                .map((item: any) => {
                  const lineIndex = Number(String(item.dataKey).replace("investments", ""));
                  const line = chartLines[lineIndex];

                  return {
                    color: line?.color || item.color,
                    label: line?.label || item.name || "Project",
                    value: Number(item.value || 0),
                  };
                });
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
                    <strong>Fund Name:</strong> {companyType || title}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Date / Investment Amount:</strong>{" "}
                    {payload[0].payload.name}
                    {totalInvestment
                      ? ` - $${Number(totalInvestment).toLocaleString()} Raised`
                      : ""}
                  </p>
                  {roiItems.length ? (
                    <div style={{ margin: "5px 0" }}>
                      <strong>Project ROI:</strong>
                      {roiItems.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 4,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 8,
                              background: item.color,
                              flex: "0 0 8px",
                            }}
                          />
                          <span>{item.label}</span>
                          <span className="green">
                            {item.value.toFixed(2).replace(/\.00$/, "")}x
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p style={{ margin: "5px 0" }}>
                    <strong>Key Projects:</strong>{" "}
                    {(keyProjects || [])
                      .map((item: any) => item.name)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(", ") || "-"}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
      );
    }

    if (tooltip === "comparison") {
      return (
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const { keyProjects, totalInvestment, categories } = payload[0].payload;
              const roiItems = payload
                .filter((item: any) => {
                  return (
                    String(item?.dataKey || "").startsWith("investments") &&
                    item?.value !== null &&
                    item?.value !== undefined
                  );
                })
                .map((item: any) => {
                  const lineIndex = Number(String(item.dataKey).replace("investments", ""));
                  const line = chartLines[lineIndex];

                  return {
                    color: line?.color || item.color,
                    label: line?.label || item.name || "Fund",
                    value: Number(item.value || 0),
                  };
                });

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
                    <strong>Date:</strong> {payload[0].payload.name}
                    {totalInvestment
                      ? ` - $${Number(totalInvestment).toLocaleString()} Raised`
                      : ""}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Category:</strong> {(categories || []).slice(0, 2).join(", ") || "-"}
                  </p>
                  {roiItems.length ? (
                    <div style={{ margin: "5px 0" }}>
                      <strong>Average ROI:</strong>
                      {roiItems.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 4,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 8,
                              background: item.color,
                              flex: "0 0 8px",
                            }}
                          />
                          <span>{item.label}</span>
                          <span className="green">
                            {item.value.toFixed(2).replace(/\.00$/, "")}x
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p style={{ margin: "5px 0" }}>
                    <strong>Key Projects:</strong>{" "}
                    {(keyProjects || [])
                      .map((item: any) => item.name)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(", ") || "-"}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
      );
    }

    return null;
  };

  const { bottomLabels, leftLabels } = useMemo(() => {
    if (selectedMode === "ROI") {
      return {
        bottomLabels: chartData.map((item) => item.name),
        leftLabels: leftLabelsByTab?.[selectedTab]?.length
          ? leftLabelsByTab[selectedTab]
          : customLeftLabels?.length
            ? customLeftLabels
            : roiLabels,
      };
    }

    return {
      bottomLabels: chartData.map((item) => item.name),
      leftLabels: customLeftLabels?.length ? customLeftLabels : marketCapLabels,
    };
  }, [chartData, customLeftLabels, leftLabelsByTab, selectedTab]);

  return (
    <Wrapper variant="main">
      <Header>
        <LeftHeader>
          <h3>{title}</h3>
          <SearchWrapper className="white-input">
            <SearchField>
              <SearchInput
                value={currentSearchValue}
                onChange={changeSearchValue}
                onFocus={onSearchFocusChange}
                placeholder={searchPlaceholder}
                type="text"
                leftIcon={<SearchIconStyle />}
                disabled={isSearchDisabled}
              />
              {isSearchDropdownOpen && onSearchItemSelect ? (
                <SearchDropdown>
                  {isSearchLoading ? (
                    <SearchOption type="button" disabled>
                      <span className="name">{loadingSearchText}</span>
                    </SearchOption>
                  ) : searchItems.length ? (
                    searchItems.map((item, index) => {
                      const name =
                        item.projectName || item.name || item.label || "Project";
                      const meta = [
                        item.roundLabel || item.roundName,
                        item.currentRoiDisplay,
                      ]
                        .filter(Boolean)
                        .join(" - ");

                      return (
                        <SearchOption
                          key={item.roundId || item.id || `${name}-${index}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectSearchItem(item)}
                        >
                          <span>
                            <span className="name">{name}</span>
                            {meta ? <span className="meta">{meta}</span> : null}
                          </span>
                        </SearchOption>
                      );
                    })
                  ) : (
                    <SearchOption type="button" disabled>
                      <span className="name">{emptySearchText}</span>
                    </SearchOption>
                  )}
                </SearchDropdown>
              ) : null}
            </SearchField>
          </SearchWrapper>
        </LeftHeader>

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
        </ButtonsWrapper>
      </Header>
      {isLoading ? (
        <ChartLoadingSkeleton height="380px" marginTop="12px" variant="compact" />
      ) : (
        <>
          <Tabs>
            {visibleLines.map((item) => {
              const canRemoveLine =
                !nonRemovableLineIndexSet.has(item.originalIndex) &&
                (Boolean(onRemoveLine) ||
                  (!disableLineHiding && item.originalIndex > 0));

              if (canRemoveLine) {
                return (
                  <button
                    key={item.originalIndex}
                    className="tab btn"
                    onClick={() =>
                      onRemoveLine
                        ? onRemoveLine(item.originalIndex)
                        : hideLine(item.originalIndex)
                    }
                    type="button"
                  >
                    <div style={{ background: item.color }} className="color" />
                    <span>{item.label}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="6"
                      height="5"
                      viewBox="0 0 6 5"
                      fill="none"
                    >
                      <path
                        d="M5 0.500001L1 4.5M5 4.5L1 0.5"
                        stroke="#738094"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                );
              }

              return (
                <div key={item.originalIndex} className="tab">
                  <div style={{ background: item.color }} className="color" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </Tabs>
          <Body>
            <Labels>
              {leftLabels.map((item: string | number, index: number) => {
                if (selectedMode === "ROI") {
                  return <GainChange key={index} label="x" value={Number(item)} />;
                }

                return (
                  <div className="date" key={index}>
                    {item}
                  </div>
                );
              })}
            </Labels>
            <div style={{ width: "calc(100% - 50px)" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <CartesianGrid strokeDasharray="1 1" />
                  {getTooltip()}
                  {visibleLines.map((line) => (
                    <Line
                      key={line.originalIndex}
                      type="linear"
                      dataKey={`investments${line.originalIndex}`}
                      stroke={line.color}
                      strokeWidth={2}
                      connectNulls
                      activeDot={{
                        r: 6,
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <Bottom>
                {bottomLabels.map((item: string, index: number) => {
                  return <div key={index}>{item}</div>;
                })}
              </Bottom>
            </div>
          </Body>
        </>
      )}
    </Wrapper>
  );
};

export default FundsCompareChart;

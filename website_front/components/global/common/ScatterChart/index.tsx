import React, { useMemo, useState } from "react";
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import CustomSelect from "../CustomSelect";
import GainChange from "../GainChange";
import PlaceholderTable from "../PlaceholderTable";
import EmptySection from "../../EmptySection";
import UserAvatar from "../UserAvatar";
import { SearchWrapper } from "../../../layouts/projects/Funds/FundsBio/styles";
import { SearchInput } from "../../../layouts/projects/P2PExchange/styles";
import { SearchIconStyle } from "../../Navigation/styles";
import {
  BottomLabels,
  BottomRoiInfo,
  Chart,
  ChartLeftLabels,
  ChartWrapper,
  EmptyStateWrapper,
  Header,
  InfoLabel,
  Items,
  RiskInfo,
  SearchDropdown,
  SearchField,
  SearchOption,
  SelectedItemButton,
  SelectedItems,
  Wrapper,
} from "./styles";
import imageLoader from "../../../../helpers/imageLoader";
import {
  FundComparisonScatterItem,
  FundComparisonSearchItem,
} from "../../../../http/funds/fetchFundComparison";

interface IProps {
  items?: FundComparisonScatterItem[];
  categories?: string[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onSearchFocusChange?: (value: boolean) => void;
  searchPlaceholder?: string;
  searchItems?: FundComparisonSearchItem[];
  isSearchLoading?: boolean;
  isSearchDisabled?: boolean;
  isSearchDropdownOpen?: boolean;
  loadingSearchText?: string;
  emptySearchText?: string;
  onSearchItemSelect?: (item: FundComparisonSearchItem) => void;
  selectedItems?: FundComparisonSearchItem[];
  onRemoveItem?: (id: string) => void;
}

const riskColor = (riskLevel?: string): string => {
  if (riskLevel === "Low") return "#04A584";
  if (riskLevel === "Medium") return "#FFC702";
  return "#FF5858";
};

const buildLabels = (maxValue: number): number[] => {
  const normalizedMax = Math.max(1, Math.ceil(maxValue));

  return Array.from({ length: 7 }, (_, index) => {
    return Number((normalizedMax - (normalizedMax / 6) * index).toFixed(1));
  });
};

const buildBottomLabels = (maxValue: number): number[] => {
  const normalizedMax = Math.max(1, Math.ceil(maxValue));

  return Array.from({ length: 7 }, (_, index) => {
    return Number(((normalizedMax / 6) * index).toFixed(1));
  });
};

const ScatterPlot: React.FC<IProps> = ({
  items = [],
  categories = [],
  isLoading = false,
  searchValue,
  onSearchValueChange,
  onSearchFocusChange,
  searchPlaceholder = "Search",
  searchItems = [],
  isSearchLoading = false,
  isSearchDisabled = false,
  isSearchDropdownOpen = false,
  loadingSearchText = "Loading",
  emptySearchText = "No funds found",
  onSearchItemSelect,
  selectedItems = [],
  onRemoveItem,
}) => {
  const [internalSearchValue, setInternalSearchValue] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const currentSearchValue =
    typeof searchValue === "string" ? searchValue : internalSearchValue;
  const hasExternalSearch = Boolean(onSearchValueChange || onSearchItemSelect);
  const categoryOptions = useMemo(() => {
    const allCategories = Array.from(
      new Set(
        [
          ...categories,
          ...items.flatMap((item) => item.categories || []),
          ...items.map((item) => item.niche),
        ].filter(Boolean) as string[],
      ),
    ).sort((left, right) => left.localeCompare(right));

    return [
      { label: "All Categories", value: "All Categories" },
      ...allCategories.map((category) => ({ label: category, value: category })),
    ];
  }, [categories, items]);
  const chartItems = useMemo(() => {
    const normalizedSearch = currentSearchValue.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        hasExternalSearch ||
        !normalizedSearch ||
        [item.name, item.niche, ...(item.categories || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesCategory =
        selectedCategory === "All Categories" ||
        item.niche === selectedCategory ||
        (item.categories || []).includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [currentSearchValue, hasExternalSearch, items, selectedCategory]);
  const maxX = Math.max(...chartItems.map((item) => Number(item.x || 0)), 1);
  const maxY = Math.max(...chartItems.map((item) => Number(item.y || 0)), 1);
  const maxXDomain = Math.max(1, maxX * 1.12);
  const maxYDomain = Math.max(1, maxY * 1.12);
  const leftLabels = buildLabels(maxYDomain);
  const bottomLabels = buildBottomLabels(maxXDomain);

  const CustomScatterPoint = (props: any) => {
    const { cx, cy, fill } = props;
    const radius = 10;

    return <circle cx={cx} cy={cy} r={radius} fill={fill} />;
  };

  const changeSearchValue = (value: string): void => {
    if (onSearchValueChange) {
      onSearchValueChange(value);
      return;
    }

    setInternalSearchValue(value);
  };

  return (
    <Wrapper variant="main">
      <Header>
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
                    const name = item.name || item.label || "Fund";
                    const meta = item.metricLabel || item.currentRoiDisplay;

                    return (
                      <SearchOption
                        key={item.id || item.backerId || `${name}-${index}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onSearchItemSelect(item)}
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
        <CustomSelect
          className="categories"
          onChange={(value: string) => setSelectedCategory(value)}
          placeholder="All Categories"
          options={categoryOptions}
        />
        <RiskInfo>
          <InfoLabel>Risk Level:</InfoLabel>
          <Items>
            <div className="item">
              <div className="label green" />
              <span>Low</span>
            </div>
            <div className="item">
              <div className="label yellow" />
              <span>Medium</span>
            </div>
            <div className="item">
              <div className="label red" />
              <span>High</span>
            </div>
          </Items>
        </RiskInfo>
      </Header>
      {selectedItems.length && onRemoveItem ? (
        <SelectedItems>
          {selectedItems.map((item) => {
            const id = item.id || item.backerId || item.slug || item.routeId || "";
            if (!id) return null;

            return (
              <SelectedItemButton
                key={id}
                type="button"
                onClick={() => onRemoveItem(id)}
              >
                <div className="color" />
                <span>{item.name || item.label}</span>
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
              </SelectedItemButton>
            );
          })}
        </SelectedItems>
      ) : null}
      {isLoading ? (
        <PlaceholderTable height="58px" />
      ) : !chartItems.length ? (
        <EmptyStateWrapper>
          <EmptySection />
        </EmptyStateWrapper>
      ) : (
        <>
          <ChartWrapper>
            <ChartLeftLabels>
              {leftLabels.map((item: number) => {
                return <GainChange key={item} label="x" value={item} />;
              })}
            </ChartLeftLabels>
            <Chart>
              <ResponsiveContainer>
                <RechartsScatterChart
                  margin={{
                    top: 20,
                    right: 16,
                    bottom: 10,
                    left: 8,
                  }}
                >
                  <CartesianGrid stroke="#F0F2F5" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, maxXDomain]}
                    height={0}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[0, maxYDomain]}
                    width={0}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      const item = payload?.[0]?.payload as
                        | FundComparisonScatterItem
                        | undefined;

                      if (!active || !item) return null;

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
                          <div className="tooltip-fund">
                            <UserAvatar
                              avatar={imageLoader(item.logo)}
                              name={item.name}
                              variant="default"
                              size="xSmall"
                              fallbackType="project"
                            />
                            <span>{item.name}</span>
                          </div>
                          <div className="tooltip-info">
                            <p style={{ margin: "0", fontWeight: "var(--font-weight-semibold)" }}>
                              Average ROI:{" "}
                              <span className="green" style={{ fontWeight: "var(--font-weight-regular)" }}>
                                {Number(item.averageProjectRoi || item.y || 0).toFixed(2)}x
                              </span>
                            </p>
                            <p style={{ margin: "0", fontWeight: "var(--font-weight-semibold)" }}>
                              Portfolio Volatility:{" "}
                              <span style={{ fontWeight: "var(--font-weight-regular)" }}>
                                {Number(item.volatility || item.x || 0).toFixed(1)}%
                              </span>
                            </p>
                            <p style={{ margin: "0", fontWeight: "var(--font-weight-semibold)" }}>
                              Risk Level:{" "}
                              <span style={{ fontWeight: "var(--font-weight-regular)" }}>
                                {item.riskLevel || "-"}
                              </span>
                            </p>
                            {item.dataQuality?.volatilityAssets !== undefined ? (
                              <p style={{ margin: "0", fontWeight: "var(--font-weight-semibold)" }}>
                                Risk Data:{" "}
                                <span style={{ fontWeight: "var(--font-weight-regular)" }}>
                                  {item.dataQuality.volatilityAssets}
                                  {item.dataQuality.volatilityAssetsTotal
                                    ? `/${item.dataQuality.volatilityAssetsTotal}`
                                    : ""}{" "}
                                  assets
                                </span>
                              </p>
                            ) : null}
                            <p style={{ margin: "0", fontWeight: "var(--font-weight-semibold)" }}>
                              Category:{" "}
                              <span style={{ fontWeight: "var(--font-weight-regular)" }}>
                                {(item.categories || [item.niche]).filter(Boolean).join(", ") || "-"}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    name="Average ROI"
                    data={chartItems}
                    fill="#8884d8"
                    shape={<CustomScatterPoint />}
                  >
                    {chartItems.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.id || entry.name || index}`}
                        fill={entry.color || riskColor(entry.riskLevel)}
                      />
                    ))}
                  </Scatter>
                </RechartsScatterChart>
              </ResponsiveContainer>
              <BottomLabels>
                {bottomLabels.map((item: number) => (
                  <div key={item}>{item}%</div>
                ))}
              </BottomLabels>
            </Chart>
          </ChartWrapper>

          <BottomRoiInfo>
            Portfolio Volatility (%) (Low{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
            >
              <path
                d="M4.58333 1L7.5 4M7.5 4L4.58333 7M7.5 4L0.5 4"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>{" "}
            High)
          </BottomRoiInfo>
        </>
      )}
    </Wrapper>
  );
};

export default ScatterPlot;

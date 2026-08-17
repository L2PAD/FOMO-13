import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Body, Bottom, Header, Tabs, Wrapper, Labels } from "./styles";
import { ButtonsWrapper } from "../BarDoubleChart/styles";
import { TimeButton } from "../PriceChart/styles";
import { useQuery } from "react-query";
import fetchChartData from "../../../../http/analytics/fetchChartData";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import Placeholder from "../Placeholder";

export type ChartTypes =
  | "chart24h"
  | "chart7d"
  | "chart30d"
  | "chart90d"
  | "chart1y"
  | "chartAll";

const mapTabToChartType = (tab: string): ChartTypes => {
  switch (tab.toUpperCase()) {
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
      return "chart30d";
  }
};

interface IProps {
  title: string;
  dataByTab?: Partial<Record<"90D" | "1Y" | "ALL", LineDoubleChartPoint[]>>;
  isLoading?: boolean;
}

export interface LineDoubleChartProject {
  name: string;
  amount: number;
  category?: string;
}

export interface LineDoubleChartPoint {
  name: string;
  date: string | Date;
  periodEnd?: string | Date;
  totalInvestment: number;
  categories: string[];
  keyProjects: LineDoubleChartProject[];
  investments0?: number;
  investments1?: number;
  investments2?: number;
  investments3?: number;
  investments4?: number;
  investments5?: number;
}

export const LINE_CHART_COLORS = [
  "#4F85BD",
  "#eb6207",
  "#EB609C",
  "#f19fba",
  "#E19E4B",
  "#132491",
  "#8A0F78",
];

const MAX_DATES = 7;
const MAX_POINTS = 12;
const DEFAULT_VISIBLE_SERIES_COUNT = 3;

const toFiniteNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getInvestmentKeys = (items: LineDoubleChartPoint[]) => {
  const keys = new Set<string>();

  items.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (/^investments\d+$/.test(key) && toFiniteNumber((item as any)[key]) > 0) {
        keys.add(key);
      }
    });
  });

  return Array.from(keys).sort(
    (a, b) => Number(a.replace("investments", "")) - Number(b.replace("investments", ""))
  );
};

const getDefaultHiddenInvestmentKeys = (keys: string[]) =>
  new Set(keys.slice(DEFAULT_VISIBLE_SERIES_COUNT));

const getSeriesIndex = (key: string) => Number(key.replace("investments", ""));

const getSeriesLabel = (items: LineDoubleChartPoint[], key: string) => {
  const index = getSeriesIndex(key);
  return items.find((item) => item.categories?.[index])?.categories[index] || `Series ${index + 1}`;
};

const getPointSeriesValue = (item: LineDoubleChartPoint, key: string) =>
  toFiniteNumber((item as any)[key]);

const getVisibleInvestmentTotal = (
  item: LineDoubleChartPoint,
  keys: string[]
) => keys.reduce((sum, key) => sum + getPointSeriesValue(item, key), 0);

const buildValueLabels = (maxValue: number) => {
  if (!maxValue) return ["$0"];

  return Array.from({ length: 7 }, (_, index) => {
    const value = maxValue - (maxValue / 6) * index;
    return `$${clarifyAmount(Math.max(value, 0))}`;
  });
};

const normalizeCategory = (value: unknown) =>
  String(value || "").trim().toLowerCase();

const LineDoubleChart: React.FC<IProps> = ({
  title,
  dataByTab,
  isLoading: externalLoading,
}) => {
  const [selectedTab, setSelectedTab] = useState<any>("90D");
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [hiddenInvestmentKeys, setHiddenInvestmentKeys] = useState<Set<string> | null>(
    null
  );
  const hasExternalData = dataByTab !== undefined;
  const { data, isLoading } = useQuery(
    ["funding-chart", selectedTab],
    () =>
      fetchChartData({
        ids: "",
        entityType: "funding-dynamics",
        chartType: mapTabToChartType(selectedTab),
      }),
    { enabled: !hasExternalData, refetchOnWindowFocus: false }
  );

  const chartLoading = hasExternalData ? Boolean(externalLoading) : isLoading;
  const rawData = hasExternalData
    ? dataByTab?.[selectedTab as "90D" | "1Y" | "ALL"] || []
    : data?.data || [];


  const sortedData: LineDoubleChartPoint[] = [...rawData]
    .map((item: any) => ({
      ...item,
      totalInvestment: toFiniteNumber(item?.totalInvestment),
      categories: Array.isArray(item?.categories) ? item.categories : [],
      keyProjects: Array.isArray(item?.keyProjects) ? item.keyProjects : [],
    }))
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let displayData: LineDoubleChartPoint[] = [];

  if (sortedData.length <= MAX_POINTS) {
    displayData = sortedData;
  } else {
    const step = Math.ceil(sortedData.length / MAX_POINTS);
    for (let i = 0; i < sortedData.length; i += step) {
      const chunk: any = sortedData.slice(i, i + step);

      const aggregated = {
        name: chunk[0].name + (chunk.length > 1 ? ` - ${chunk[chunk.length - 1].name.split(' - ').pop()}` : ''),
        date: chunk[0].date,
        periodEnd: chunk[chunk.length - 1].periodEnd || chunk[chunk.length - 1].date,
        totalInvestment: chunk.reduce((sum: any, d: any) => sum + d.totalInvestment, 0),
        categories: Array.from(new Set(chunk.flatMap((d: any) => d.categories))) as string[],
        keyProjects: chunk.flatMap((d: any) => d.keyProjects),
        investments0: chunk.reduce((sum: any, d: any) => sum + (d.investments0 || 0), 0),
        investments1: chunk.reduce((sum: any, d: any) => sum + (d.investments1 || 0), 0),
        investments2: chunk.reduce((sum: any, d: any) => sum + (d.investments2 || 0), 0),
        investments3: chunk.reduce((sum: any, d: any) => sum + (d.investments3 || 0), 0),
        investments4: chunk.reduce((sum: any, d: any) => sum + (d.investments4 || 0), 0),
        investments5: chunk.reduce((sum: any, d: any) => sum + (d.investments5 || 0), 0),
      };

      displayData.push(aggregated);
    }
  }

  const chartData = displayData;
  const investmentKeys = getInvestmentKeys(chartData);
  const effectiveHiddenInvestmentKeys =
    hiddenInvestmentKeys || getDefaultHiddenInvestmentKeys(investmentKeys);
  const series = investmentKeys.map((key, index) => ({
    key,
    label: getSeriesLabel(chartData, key),
    color: LINE_CHART_COLORS[index % LINE_CHART_COLORS.length],
  }));
  const visibleSeries = series.filter((item) => !effectiveHiddenInvestmentKeys.has(item.key));
  const visibleInvestmentKeys = visibleSeries.map((item) => item.key);
  const visibleMaxValue = Math.max(
    ...chartData.flatMap((item) =>
      visibleInvestmentKeys.map((key) => getPointSeriesValue(item, key))
    ),
    0
  );
  const xLabels: string[] = [];

  if (chartData.length <= MAX_DATES) {
    xLabels.push(...chartData.map((item: any) =>
      new Date(item.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })
    ));
  } else {
    const step = (chartData.length - 1) / (MAX_DATES - 1);

    for (let i = 0; i < MAX_DATES; i += 1) {
      const index = Math.round(i * step);
      const item = chartData[index];
      xLabels.push(new Date(item.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" }));
    }
  }

  const yLabels = buildValueLabels(visibleMaxValue);

  const resetHiddenSeries = () => {
    setHiddenInvestmentKeys(new Set());
    setHoveredLine(null);
  };

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
    setHiddenInvestmentKeys(null);
    setHoveredLine(null);
  };

  const toggleSeries = (key: string) => {
    setHiddenInvestmentKeys((current) => {
      const next = new Set(current || effectiveHiddenInvestmentKeys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setHoveredLine(null);
  };

  return (
    <Wrapper variant="main">
      <Header>
        <h3>{title}</h3>
        <ButtonsWrapper>
          {["90D", "1Y", "ALL"].map((tab) => (
            <TimeButton
              key={tab}
              active={selectedTab === tab}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </TimeButton>
          ))}
        </ButtonsWrapper>
      </Header>
      {
        chartLoading
          ?
          <div className="chart-body">
            <br />
            <Placeholder width="100%" />
          </div>
          :
          <>
            <Tabs>
              <button
                type="button"
                className="tab"
                onClick={resetHiddenSeries}
                aria-pressed={effectiveHiddenInvestmentKeys.size === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 11" fill="none" > <circle cx="5" cy="5.5" r="4.5" fill="white" stroke="#070B35" /> </svg>
                ALL
              </button>
              {series.map((item) => {
                const isHidden = effectiveHiddenInvestmentKeys.has(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    className="tab"
                    onClick={() => toggleSeries(item.key)}
                    aria-pressed={!isHidden}
                    style={{ opacity: isHidden ? 0.45 : 1 }}
                  >
                    <div style={{ background: item.color }} className="color" />
                    <span>{item.label || '-'}</span>
                  </button>
                );
              })}
            </Tabs>
            <Body>
              <Labels>
                {(yLabels.length ? yLabels : ["$0"]).map((label: string, index: number) => (
                  <div key={index}>{label}</div>
                ))}
              </Labels>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData || []}>
                  {chartData?.length ? <CartesianGrid strokeDasharray="1 1" /> : null}
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, "dataMax"]} />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const visiblePayload = payload.filter((item: any) =>
                        visibleInvestmentKeys.includes(String(item?.dataKey || ""))
                      );
                      const selectedPayload =
                        (hoveredLine
                          ? visiblePayload.find((item: any) => item?.dataKey === hoveredLine)
                          : undefined) ||
                        [...visiblePayload]
                          .reverse()
                          .find((item: any) => toFiniteNumber(item?.value) > 0) ||
                        visiblePayload[0];

                      if (!selectedPayload) return null;

                      const point = selectedPayload.payload as LineDoubleChartPoint;
                      const dataKey = String(selectedPayload.dataKey || "");
                      const activeSeries = series.find((item) => item.key === dataKey);
                      const categoryIndex = getSeriesIndex(dataKey);
                      const category =
                        point.categories?.[categoryIndex] ||
                        activeSeries?.label ||
                        `Series ${categoryIndex + 1}`;
                      const amount = toFiniteNumber(selectedPayload.value);
                      const visibleTotal = getVisibleInvestmentTotal(point, visibleInvestmentKeys);
                      const keyProjects = Array.isArray(point.keyProjects)
                        ? point.keyProjects
                        : [];
                      const categoryProjects = keyProjects.filter(
                        (project) =>
                          normalizeCategory(project?.category) === normalizeCategory(category)
                      );
                      const projectsToShow = (categoryProjects.length
                        ? categoryProjects
                        : keyProjects
                      ).slice(0, 3);
                      const totalLabel =
                        visibleInvestmentKeys.length === investmentKeys.length
                          ? "Total Investment"
                          : "Visible Total";

                      return (
                        <div
                          style={{
                            background: "rgba(255, 255, 255, 0.034)",
                            backdropFilter: "blur(35px)",
                            borderRadius: 12,
                            padding: 10,
                            color: "#070B35",
                            boxShadow: '0px 1px 4px 0px #0c0c0d0d',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: 13, fontWeight: "var(--font-weight-semibold)" }}>{`Details for ${point.name} - ${category}`}</p>
                          <p style={{ margin: "5px 0", fontSize: 13, fontWeight: "var(--font-weight-semibold)" }}>{`${category}: $${clarifyAmount(amount)}`}</p>
                          <p style={{ margin: "5px 0", fontSize: 13, fontWeight: "var(--font-weight-semibold)" }}>{`${totalLabel}: $${clarifyAmount(visibleTotal)}`}</p>
                          <p style={{ margin: "5px 0", fontSize: 13, fontWeight: "var(--font-weight-semibold)" }}>Key Projects:</p>
                          <ol style={{ margin: 0, paddingLeft: 20 }}>
                            {projectsToShow.map((p: any, i: number) => (
                              <li key={i} style={{ fontSize: 13 }}>{`${p.name} - $${clarifyAmount(p.amount)}`}</li>
                            ))}
                            {!projectsToShow.length && (
                              <li style={{ fontSize: 13 }}>No projects</li>
                            )}
                          </ol>
                        </div>
                      );
                    }}
                  />

                  {visibleSeries.map((item) => (
                    <Line
                      key={item.key}
                      type="linear"
                      dataKey={item.key}
                      stroke={item.color}
                      strokeWidth={2}
                      onMouseEnter={() => setHoveredLine(item.key)}
                      onMouseLeave={() => setHoveredLine(null)}
                      activeDot={{
                        r: 6,
                        onMouseEnter: () => setHoveredLine(item.key),
                        onMouseLeave: () => setHoveredLine(null),
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Body>
            <Bottom>
              {xLabels.map((label, index) => (
                <div key={index}>{label}</div>
              ))}
            </Bottom>
          </>
      }
    </Wrapper >
  )
};


export default LineDoubleChart;

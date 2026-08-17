import React, { FC, useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  ButtonsWrapper,
  Chart,
  Header,
  Labels,
  Wrapper,
} from "./styles";
import { TimeButton } from "../PriceChart/styles";
import CustomTooltip from "../CustomTooltip";
import { useContext } from "react";
import { LayoutContext } from "../../Layout";
import { useQuery } from "react-query";
import fetchItems from "../../../../http/fetchItems";
import Placeholder from "../Placeholder";

interface Category {
  id: number;
  slug: string;
  displayName: string;
  dominance: number;
  historicalData: { priceChange: Record<string, number>, losers: number, gainers: number, marketCap: number };
  topImagesLinks: Array<string>
}

export interface BarDoubleChartDataItem {
  name: string;
  name2?: string;
  grow: number;
  drop: number;
  marketCapShare1?: string | number;
  marketCapShare2?: string | number;
  gainers1?: number;
  gainers2?: number;
  losers1?: number;
  losers2?: number;
  topProjects1?: Array<string | { name?: string; image?: string; logo?: string }>;
  topProjects2?: Array<string | { name?: string; image?: string; logo?: string }>;
  tooltipValue1?: number;
  tooltipValue2?: number;
  countLabel?: string;
  shareLabel?: string;
  relatedSectors?: string;
}

interface ChartTab {
  label: string;
  key: string;
}

interface IProps {
  title: string;
  data?: BarDoubleChartDataItem[];
  dataByTab?: Record<string, BarDoubleChartDataItem[]>;
  tabsOverride?: ChartTab[];
  isLoading?: boolean;
}

const tabs: ChartTab[] = [
  { label: "24H", key: "1D" },
  { label: "7D", key: "1W" },
  { label: "30D", key: "1M" },
  { label: "1H", key: "1H" },
  { label: "1Y", key: "1Y" },
];

const toFiniteNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const BarDoubleChart: FC<IProps> = ({
  title,
  data,
  dataByTab,
  tabsOverride,
  isLoading: externalLoading,
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const activeTabs = tabsOverride?.length ? tabsOverride : tabs;
  const hasExternalData = data !== undefined || dataByTab !== undefined;
  const { isLoading } = useQuery(
    ["allocation-chart"],
    () => {
      return fetchItems('analytics/charts?entityType=category&chartType=chartAll');
    },
    {
      enabled: !hasExternalData,
      onSuccess: ({ data }) => setCategories(data?.chartAll || []),
      refetchOnWindowFocus: false,
    }
  );
  const [selectedTab, setSelectedTab] = useState(activeTabs[0]?.key || "1D");
  const { layout } = useContext(LayoutContext)

  useEffect(() => {
    if (!activeTabs.some((tab) => tab.key === selectedTab)) {
      setSelectedTab(activeTabs[0]?.key || "1D");
    }
  }, [activeTabs, selectedTab]);

  const chartData = useMemo(() => {
    if (hasExternalData) {
      return (dataByTab?.[selectedTab] || data || [])
        .map((item) => ({
          ...item,
          grow: toFiniteNumber(item.grow),
          drop: toFiniteNumber(item.drop),
          gainers1: toFiniteNumber(item.gainers1),
          gainers2: toFiniteNumber(item.gainers2),
          losers1: toFiniteNumber(item.losers1),
          losers2: toFiniteNumber(item.losers2),
          marketCapShare1: toFiniteNumber(item.marketCapShare1).toFixed(2),
          marketCapShare2: toFiniteNumber(item.marketCapShare2).toFixed(2),
          topProjects1: Array.isArray(item.topProjects1) ? item.topProjects1 : [],
          topProjects2: Array.isArray(item.topProjects2) ? item.topProjects2 : [],
        }))
        .filter((item) => item.name || item.name2);
    }

    if (!categories.length) return [];

    const mid = Math.ceil(categories.length / 2);
    const topCats = categories.slice(0, mid);
    const bottomCats = categories.slice(mid);
    const marketCap = layout?.header?.data?.quote?.USD?.total_market_cap || 0

    while (bottomCats.length < topCats.length) {
      bottomCats.push(bottomCats[bottomCats.length - 1]);
    }

    return topCats.map((cat, i) => {
      const cat2 = bottomCats[i];

      return {
        name: cat.displayName,
        name2: cat2.displayName,
        grow: Math.abs(cat.historicalData.priceChange[selectedTab] || 0),
        drop: -Math.abs(cat2.historicalData.priceChange[selectedTab] || 0),
        marketCapShare1: (((cat.historicalData.marketCap || 0)) / marketCap * 100).toFixed(2),
        marketCapShare2: (((cat2.historicalData.marketCap || 0)) / marketCap * 100).toFixed(2),
        gainers1: cat.historicalData.gainers || 0,
        gainers2: cat2.historicalData.gainers || 0,
        losers1: cat.historicalData.losers || 0,
        losers2: cat2.historicalData.losers || 0,
        topProjects1: cat.topImagesLinks || [],
        topProjects2: cat2.topImagesLinks || [],
      };
    });
  }, [categories, selectedTab, layout, data, dataByTab, hasExternalData]);



  const labels = useMemo(() => {
    if (!chartData.length) return ["0%"];

    const values = chartData.flatMap((d) => [d.grow, d.drop]);
    let min = Math.min(...values);
    let max = Math.max(...values);

    const roundTo5 = (n: number) => Math.ceil(n / 5) * 5;
    const roundDownTo5 = (n: number) => Math.floor(n / 5) * 5;

    min = roundDownTo5(min);
    max = roundTo5(max);

    const step = Math.max(5, Math.round((max - min) / 6));
    const ticks: number[] = [];
    for (let i = max; i >= min; i -= step) {
      ticks.push(i);
    }

    return ticks.map((val) => `${val}%`);
  }, [chartData]);

  const chartLoading = hasExternalData ? Boolean(externalLoading) : isLoading;

  return (
    <Wrapper variant="main">
      <Header>
        <h3>{title}</h3>
        <ButtonsWrapper>
          {activeTabs.map((tab) => (
            <TimeButton
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              active={selectedTab === tab.key}
            >
              {tab.label}
            </TimeButton>
          ))}
        </ButtonsWrapper>
      </Header>
      {
        chartLoading
          ?
          <>
            <br />
            <Placeholder width="100%" height="88%" />
          </>
          :
          <Chart>
            <Labels>
              {labels.map((item: string, index: number) => (
                <div key={index}>{item}</div>
              ))}
            </Labels>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} stackOffset="sign">
                <defs>
                  <linearGradient id="gradientBorder" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#04A58499" /> <stop offset="100%" stopColor="#04A58400" />
                  </linearGradient>
                </defs>
                <defs> <linearGradient id="gradientBorder2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255, 88, 88, 0)" /> <stop offset="100%" stopColor="rgba(255, 88, 88, 0.6)" /> </linearGradient>
                </defs>
                <defs> <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1"> <stop offset="0%" stopColor="rgba(4, 165, 132, 0.6)" /> <stop offset="100%" stopColor="rgba(4, 165, 132, 0)" /> </linearGradient>
                </defs>
                <defs> <linearGradient id="gradientFill2" x1="0" y1="0" x2="0" y2="1"> <stop offset="0%" stopColor="rgba(255, 88, 88, 0)" /> <stop offset="100%" stopColor="rgba(255, 88, 88, 0.6)" /> </linearGradient> </defs> <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F0F2F5" /> <Tooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} /> <ReferenceLine y={0} stroke="#F0F2F5" /> <Bar dataKey="grow" fill="url(#gradientFill)" barSize={20} radius={25} stroke="url(#gradientBorder)" strokeWidth={2} stackId="stack" /> <Bar dataKey="drop" fill="url(#gradientFill2)" barSize={20} radius={25} stroke="url(#gradientBorder2)" strokeWidth={2} stackId="stack" />
              </BarChart>

            </ResponsiveContainer>
          </Chart>
      }

    </Wrapper>
  );
};

export default BarDoubleChart;

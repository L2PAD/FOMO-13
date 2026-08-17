import React, { FC } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Placeholder from "../Placeholder";
import { ChartWrapper, Labels, LabelWrapper, Title, Wrapper } from "./styles";

const defaultData: UniversalBarChartDataItem[] = [
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: "NFT",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: "Blockchain",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 2600,
    pv: 9800,
    amt: 2290,
  },
  {
    name: "Gaming",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 2200,
    pv: 3908,
    amt: 2000,
  },
  {
    name: "P2E",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 2000,
    pv: 4800,
    amt: 2181,
  },
  {
    name: "Metaverse",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 1800,
    pv: 3800,
    amt: 2500,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 1500,
    pv: 4300,
    amt: 2100,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 1200,
    pv: 3800,
    amt: 2181,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 1000,
    pv: 3908,
    amt: 2000,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 600,
    pv: 1398,
    amt: 2100,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 500,
    pv: 9800,
    amt: 2100,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 450,
    pv: 2400,
    amt: 2100,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 400,
    pv: 3800,
    amt: 2100,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 300,
    pv: 1398,
    amt: 2100,
  },
  {
    name: "DeFi (Decentralized Finance)",
    perPersons: 35,
    numPersons: 35,
    topRoles: "Investors (45%), Project Managers (30%), Developers (25%)",
    keyRegions: "USA (45%), Europe (35%), Asia (20%)",
    sectors: "Stablecoins, Oracles, Yield Farming",
    topProjects: "Uniswap, Aave, Curve",
    growth: "+15% compared to last year",
    uv: 250,
    pv: 3908,
    amt: 2100,
  },
];

interface IProps {
  title: string;
  labels: Array<string>;
  data?: UniversalBarChartDataItem[];
  isLoading?: boolean;
}

export interface UniversalBarChartDataItem {
  name: string;
  value?: number;
  uv?: number;
  pv?: number;
  amt?: number;
  perPersons?: string | number;
  numPersons?: number;
  topRoles?: string;
  keyRegions?: string;
  sectors?: string;
  topProjects?: string;
  growth?: string;
}

const toFiniteNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const UniversalBarChart: FC<IProps> = ({
  title,
  labels,
  data,
  isLoading,
}) => {
  const chartData = (data === undefined ? defaultData : data).map((item) => ({
    ...item,
    uv: toFiniteNumber(item.uv ?? item.value),
    perPersons: item.perPersons ?? item.value ?? 0,
    numPersons: item.numPersons ?? toFiniteNumber(item.value ?? item.uv),
    topRoles: item.topRoles || "-",
    keyRegions: item.keyRegions || "-",
    sectors: item.sectors || "-",
    topProjects: item.topProjects || "-",
    growth: item.growth || "-",
  }));

  return (
    <Wrapper variant="main">
      <Title>{title}</Title>
      <ChartWrapper>
        <Labels>
          {labels.map((item: string, index: number) => {
            return (
              <LabelWrapper key={index}>
                <div>{item}</div>
                <div className="border" />
              </LabelWrapper>
            );
          })}
        </Labels>
        {isLoading ? (
          <Placeholder width="100%" height="100%" />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart width={150} height={40} data={chartData}>
            <CartesianGrid vertical={false} stroke="#f0f2f5" />

            <defs>
              <linearGradient id="gradientBorder" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#04A58499" />
                <stop offset="100%" stopColor="#04A58400" />
              </linearGradient>
            </defs>
            <defs>
              <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(4, 165, 132, 0.6)" />
                <stop offset="100%" stopColor="rgba(4, 165, 132, 0)" />
              </linearGradient>
            </defs>
            <Bar
              dataKey="uv"
              barSize={20}
              radius={25}
              stroke="url(#gradientBorder)"
              fill="url(#gradientFill)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const {
                    name,
                    perPersons,
                    numPersons,
                    topRoles,
                    keyRegions,
                    sectors,
                    topProjects,
                    growth,
                  } = payload[0].payload;
                  return (
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.3)",
                        backdropFilter: "blur(25px)",
                        WebkitBackdropFilter: "blur(25px)",
                        borderRadius: "8px",
                        padding: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        fontFamily: "Arial",
                        fontSize: "12px",
                        color: "#070B35",
                      }}
                    >
                      <p
                        style={{ margin: "0 0 10px 0", fontWeight: "var(--font-weight-semibold)" }}
                      >{`${name}`}</p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Persons:</strong> {perPersons} (Total:{" "}
                        {numPersons})
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Top Roles:</strong> {topRoles}
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Key Regions:</strong> {keyRegions}
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Sectors:</strong> {sectors}
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Top Projects:</strong> {topProjects}
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Growth:</strong> {growth}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: "transparent" }}
            />
          </BarChart>
        </ResponsiveContainer>
        )}
      </ChartWrapper>
    </Wrapper>
  );
};

export default UniversalBarChart;

import React, { FC, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BarChart, Bar, ResponsiveContainer, Tooltip } from "recharts";
import {
  Chart,
  ChartDescription,
  ChartWrapper,
  Container,
  Events,
  HeaderWrapper,
  Labels,
  LabelWrapper,
  Title,
  Wrapper,
} from "./styles";
import PhotoIcon from "../../Icons/PhotoIcon";
import UserAvatar from "../UserAvatar";
import imageLoader from "../../../../helpers/imageLoader";
import { Overflow } from "../BarDoubleChart/styles";
import moment from "moment";
import SaveShareModal from "../../modals/SaveShareModal";

const data = [
  {
    name: "Token A (TKNA)",
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
    name: "Token A (TKNA)",
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
    name: "Token A (TKNA)",
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
    name: "Token A (TKNA)",
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
    name: "Token A (TKNA)",
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
];

const events = [
  {
    logo: "/52926e113479b4931cf5fd30166b6849.png",
    name: "TKNA",
    rating: 94,
  },
  {
    logo: "/52926e113479b4931cf5fd30166b6849.png",
    name: "TKNA",
    rating: 94,
  },
  {
    logo: "/52926e113479b4931cf5fd30166b6849.png",
    name: "TKNA",
    rating: 94,
  },
  {
    logo: "/52926e113479b4931cf5fd30166b6849.png",
    name: "TKNA",
    rating: 94,
  },
  {
    logo: "/52926e113479b4931cf5fd30166b6849.png",
    name: "TKNA",
    rating: 94,
  },
];

interface IProps {
  title: string;
  labels: Array<string>;
  items?: Array<{
    name: string;
    logo?: string;
    rating?: number;
    uv: number;
    unlockVolume?: number;
    unlockDate?: string;
    category?: string;
  }>;
}

const TopEventsChart: FC<IProps> = ({ title, labels, items = [] }) => {
  const [isScreenModal, setIsScreenModal] = useState<boolean>(false);
  const [htmlData, setHtmlData] = useState<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartData = items.length ? items : data;
  const chartEvents = items.length
    ? items.map((item) => ({
      logo: item.logo,
      name: item.name,
      rating: item.rating || 0,
    }))
    : events;
  const shareLink =
    typeof window !== "undefined" ? window.location.href : "";
  const eventsGridStyle = {
    "--events-count": chartEvents.length || 5,
  } as CSSProperties;

  return (
    <>
      <div ref={chartRef}>
        <Wrapper variant="main">
          <HeaderWrapper>
            <Title>{title}</Title>
            <button
              type="button"
              onClick={() => {
                setHtmlData(chartRef.current);
                setIsScreenModal(true);
              }}
            >
              <PhotoIcon />
            </button>
          </HeaderWrapper>
          <ChartDescription>Unlock Volume (in Millions) by Tokens</ChartDescription>
          <ChartWrapper>
            <Labels>
              {labels.map((item: string, index: number) => {
                return (
                  <LabelWrapper key={index}>
                    <div>{item}</div>
                  </LabelWrapper>
                );
              })}
            </Labels>
            <Container>
              <Chart>
                <ResponsiveContainer width="100%" minHeight={280} height="100%">
                  <BarChart width={150} height={40} data={chartData}>
                    <defs>
                      <linearGradient
                        id="gradientBorder"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
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
                      barSize={38}
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
                            unlockVolume,
                            unlockDate,
                            category,
                          } = payload[0].payload;
                          return (
                            <div
                              style={{
                                width: "150px",
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
                                style={{
                                  margin: "0 0 10px 0",
                                  fontWeight: "var(--font-weight-semibold)",
                                }}
                              >{`${name}`}</p>
                              <p style={{ margin: "5px 0" }}>
                                <strong>Unlock Volume:</strong>{" "}
                                {unlockVolume
                                  ? `$${(unlockVolume / 1_000_000).toFixed(2)}M`
                                  : `${Number(payload[0].value || 0).toFixed(2)}M`}{" "}
                              </p>
                              <p style={{ margin: "5px 0" }}>
                                <strong>Date:</strong>{" "}
                                {unlockDate ? moment(unlockDate).format("ll") : "-"}{" "}
                              </p>
                              <p style={{ margin: "5px 0" }}>
                                <strong>Category:</strong> {category || "-"}
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
                <Events style={eventsGridStyle}>
                  {chartEvents.map((item: any, i: number) => {
                    return (
                      <div className="event-item" key={i}>
                        <UserAvatar
                          size="otc"
                          variant="success"
                          rating={item.rating}
                          avatar={imageLoader(item.logo)}
                          name={item.name}
                          fallbackType="project"
                        />
                        <span className="event-name">{item.name}</span>
                      </div>
                    );
                  })}
                </Events>
              </Chart>
            </Container>
          </ChartWrapper>
        </Wrapper>
      </div>
      <SaveShareModal
        name={title}
        link={shareLink}
        html={htmlData || chartRef.current}
        isVisible={isScreenModal}
        onClose={() => setIsScreenModal(false)}
      />
    </>
  );
};

export default TopEventsChart;

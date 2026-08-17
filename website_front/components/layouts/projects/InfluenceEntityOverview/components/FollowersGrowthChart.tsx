import React, { useState } from "react";
import styled from "styled-components";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

const CardWrapper = styled.div`
  width: 100%;
  background: #f5fbfd;
  border-radius: 16px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LegendDot = styled.div<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

const LegendLabel = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: #070b35;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PeriodToggle = styled.div`
  display: flex;
  gap: 8px;
`;

const PeriodButton = styled.button<{ active?: boolean }>`
  padding: 6px 10px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ active }) => (active ? "#E9F7F7" : "transparent")};
  color: ${({ active }) => (active ? "#05A584" : "#728094")};

  &:hover {
    opacity: 0.8;
  }
`;

const CameraButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const ChartContainer = styled.div`
  height: 320px;
  width: 100%;
`;

const TooltipWrapper = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const TooltipDate = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin-bottom: 8px;
`;

const TooltipRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 13px;
  margin-top: 4px;
`;

const TooltipLabel = styled.span`
  color: #738094;
`;

const TooltipValue = styled.span<{ color?: string }>`
  font-weight: var(--font-weight-semibold);
  color: ${({ color }) => color || "#070b35"};
`;

interface FollowersGrowthChartProps {}

const FollowersGrowthChart: React.FC<FollowersGrowthChartProps> = () => {
  const [activePeriod, setActivePeriod] = useState("7D");

  // Mock data for followers growth
  const chartData = [
    { date: "23 Dec", followers: 144000 },
    { date: "24 Dec", followers: 154050 },
    { date: "25 Dec", followers: 154120 },
    { date: "26 Dec", followers: 174250 },
    { date: "27 Dec", followers: 174400 },
    { date: "28 Dec", followers: 184580 },
    { date: "29 Dec", followers: 184700 },
  ];

  const CustomTooltipComponent = ({
    active,
    payload,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const currentFollowers = data.followers;
      const previousFollowers = 184212; // Mock previous value
      const change = currentFollowers - previousFollowers;

      return (
        <TooltipWrapper>
          <TooltipDate>December 24, 2025</TooltipDate>
          <TooltipRow>
            <TooltipLabel>New Followers</TooltipLabel>
            <TooltipValue color={change >= 0 ? "#05A584" : "#FF5858"}>
              {change >= 0 ? "+" : ""}
              {change}
            </TooltipValue>
          </TooltipRow>
          <TooltipRow>
            <TooltipLabel>Total Followers</TooltipLabel>
            <TooltipValue>{currentFollowers.toLocaleString()}</TooltipValue>
          </TooltipRow>
        </TooltipWrapper>
      );
    }
    return null;
  };

  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <CardWrapper>
      <CardHeader>
        <Legend>
          <LegendItem>
            <LegendDot color="#05A584" />
            <LegendLabel>Followers</LegendLabel>
          </LegendItem>
        </Legend>
        <RightSection>
          <PeriodToggle>
            <PeriodButton
              active={activePeriod === "24H"}
              onClick={() => setActivePeriod("24H")}
            >
              24H
            </PeriodButton>
            <PeriodButton
              active={activePeriod === "7D"}
              onClick={() => setActivePeriod("7D")}
            >
              7D
            </PeriodButton>
            <PeriodButton
              active={activePeriod === "30D"}
              onClick={() => setActivePeriod("30D")}
            >
              30D
            </PeriodButton>
            <PeriodButton
              active={activePeriod === "90D"}
              onClick={() => setActivePeriod("90D")}
            >
              90D
            </PeriodButton>
          </PeriodToggle>
          <CameraButton>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 6.66667C2.5 5.74619 3.24619 5 4.16667 5H5.41667L6.66667 2.5H13.3333L14.5833 5H15.8333C16.7538 5 17.5 5.74619 17.5 6.66667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V6.66667Z"
                stroke="#738094"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 14.1667C11.8409 14.1667 13.3333 12.6743 13.3333 10.8333C13.3333 8.99238 11.8409 7.5 10 7.5C8.15905 7.5 6.66667 8.99238 6.66667 10.8333C6.66667 12.6743 8.15905 14.1667 10 14.1667Z"
                stroke="#738094"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </CameraButton>
        </RightSection>
      </CardHeader>

      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="0" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#738094", fontSize: 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#738094", fontSize: 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip
              content={<CustomTooltipComponent />}
              cursor={{
                stroke: "#05A584",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />
            <Line
              type="linear"
              dataKey="followers"
              stroke="#05A584"
              strokeWidth={2}
              dot={{ fill: "#E9F8F8", stroke: "#05A584", strokeWidth: 2, r: 4 }}
              activeDot={{
                fill: "#05A584",
                stroke: "#fff",
                strokeWidth: 2,
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </CardWrapper>
  );
};

export default FollowersGrowthChart;

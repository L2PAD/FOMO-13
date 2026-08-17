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

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 8px 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
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
  max-width: 100%;
  overflow-x: auto;
`;

const TooltipWrapper = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e9f2;
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TooltipDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

const TooltipLabel = styled.span`
  font-size: 13px;
  color: #728094;
  min-width: 70px;
`;

const TooltipValue = styled.span`
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const CardBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #728094;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const CameraIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.25 14.25C17.25 14.6478 17.092 15.0294 16.8107 15.3107C16.5294 15.592 16.1478 15.75 15.75 15.75H2.25C1.85218 15.75 1.47064 15.592 1.18934 15.3107C0.908035 15.0294 0.75 14.6478 0.75 14.25V5.25C0.75 4.85218 0.908035 4.47064 1.18934 4.18934C1.47064 3.90804 1.85218 3.75 2.25 3.75H5.25L6.75 1.5H11.25L12.75 3.75H15.75C16.1478 3.75 16.5294 3.90804 16.8107 4.18934C17.092 4.47064 17.25 4.85218 17.25 5.25V14.25Z"
      stroke="#728094"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12.75C10.6569 12.75 12 11.4069 12 9.75C12 8.09315 10.6569 6.75 9 6.75C7.34315 6.75 6 8.09315 6 9.75C6 11.4069 7.34315 12.75 9 12.75Z"
      stroke="#728094"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Period = "24H" | "7D" | "30D" | "90D";

interface DataPoint {
  time: string;
  views: number;
  reactions: number;
  joins: number;
}

interface EngagementTimelineProps {
  data?: {
    [key in Period]?: DataPoint[];
  };
  title?: string;
}

const defaultData: { [key in Period]: DataPoint[] } = {
  "24H": [
    { time: "00:00", views: 1500, reactions: 30, joins: 0 },
    { time: "04:00", views: 1890, reactions: 43, joins: 0 },
    { time: "08:00", views: 850, reactions: 21, joins: 0 },
    { time: "12:00", views: 1200, reactions: 5, joins: 0 },
    { time: "16:00", views: 980, reactions: 23, joins: 2 },
    { time: "20:00", views: 1000, reactions: 10, joins: 0 },
    { time: "24:00", views: 750, reactions: 15, joins: 2 },
  ],
  "7D": [
    { time: "Mon", views: 1500, reactions: 30, joins: 0 },
    { time: "Tue", views: 1890, reactions: 43, joins: 0 },
    { time: "Wed", views: 850, reactions: 21, joins: 0 },
    { time: "Thu", views: 1200, reactions: 5, joins: 0 },
    { time: "Fri", views: 980, reactions: 23, joins: 2 },
    { time: "Sat", views: 1000, reactions: 10, joins: 0 },
    { time: "Sun", views: 750, reactions: 15, joins: 2 },
  ],
  "30D": [
    { time: "Week 1", views: 32000, reactions: 850, joins: 45 },
    { time: "Week 2", views: 38000, reactions: 920, joins: 52 },
    { time: "Week 3", views: 28000, reactions: 680, joins: 35 },
    { time: "Week 4", views: 42000, reactions: 1050, joins: 68 },
  ],
  "90D": [
    { time: "Month 1", views: 125000, reactions: 3200, joins: 180 },
    { time: "Month 2", views: 145000, reactions: 3800, joins: 220 },
    { time: "Month 3", views: 132000, reactions: 3400, joins: 195 },
  ],
};

const CustomTooltipComponent = ({
  active,
  payload,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length && payload[0]?.payload) {
    const data = payload[0].payload;
    return (
      <TooltipWrapper>
        <TooltipRow>
          <TooltipDot color="#05A584" />
          <TooltipLabel>Views</TooltipLabel>
          <TooltipValue>{data.views?.toLocaleString()}</TooltipValue>
        </TooltipRow>
        <TooltipRow>
          <TooltipDot color="#3B82F6" />
          <TooltipLabel>Reactions</TooltipLabel>
          <TooltipValue>{data.reactions?.toLocaleString()}</TooltipValue>
        </TooltipRow>
        <TooltipRow>
          <TooltipDot color="#F5A623" />
          <TooltipLabel>Joins</TooltipLabel>
          <TooltipValue>{data.joins?.toLocaleString()}</TooltipValue>
        </TooltipRow>
      </TooltipWrapper>
    );
  }
  return null;
};

const EngagementTimeline: React.FC<EngagementTimelineProps> = ({
  data = defaultData,
  title,
}) => {
  const [activePeriod, setActivePeriod] = useState<Period>("24H");

  const periods: Period[] = ["24H", "7D", "30D", "90D"];
  const chartData = data[activePeriod] || defaultData[activePeriod];

  // Y-axis ticks with equal spacing
  const yAxisTicks = [0, 5, 20, 100, 500, 1000, 2000];

  // Transform value to position (0-6 for equal spacing)
  const valueToPosition = (value: number): number => {
    for (let i = yAxisTicks.length - 1; i >= 0; i--) {
      if (value >= yAxisTicks[i]) {
        if (i === yAxisTicks.length - 1) return i;
        const lower = yAxisTicks[i];
        const upper = yAxisTicks[i + 1];
        const ratio = (value - lower) / (upper - lower);
        return i + ratio;
      }
    }
    return 0;
  };

  // Transform data for equal spacing
  const transformedData = chartData.map((item) => ({
    ...item,
    viewsPos: valueToPosition(item.views),
    reactionsPos: valueToPosition(item.reactions),
    joinsPos: valueToPosition(item.joins),
  }));

  // Custom tick formatter
  const formatYAxisTick = (value: number): string => {
    const index = Math.round(value);
    if (index >= 0 && index < yAxisTicks.length) {
      return yAxisTicks[index].toString();
    }
    return "";
  };

  return (
    <CardWrapper>
      {title ? (
        <>
          <CardHeader style={{ marginBottom: "8px" }}>
            <CardTitle>{title}</CardTitle>
            <CardBadge>Last 24 hours</CardBadge>
          </CardHeader>
          <CardHeader>
            <Legend>
              <LegendItem>
                <LegendDot color="#05A584" />
                <LegendLabel>Messages</LegendLabel>
              </LegendItem>
              <LegendItem>
                <LegendDot color="#3B82F6" />
                <LegendLabel>Reactions</LegendLabel>
              </LegendItem>
              <LegendItem>
                <LegendDot color="#F5A623" />
                <LegendLabel>Joins</LegendLabel>
              </LegendItem>
            </Legend>
          </CardHeader>
        </>
      ) : (
        <CardHeader>
          <Legend>
            <LegendItem>
              <LegendDot color="#05A584" />
              <LegendLabel>Views</LegendLabel>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#3B82F6" />
              <LegendLabel>Reactions</LegendLabel>
            </LegendItem>
            <LegendItem>
              <LegendDot color="#F5A623" />
              <LegendLabel>Joins</LegendLabel>
            </LegendItem>
          </Legend>

          <RightSection>
            <PeriodToggle>
              {periods.map((period) => (
                <PeriodButton
                  key={period}
                  active={activePeriod === period}
                  onClick={() => setActivePeriod(period)}
                >
                  {period}
                </PeriodButton>
              ))}
            </PeriodToggle>
            <CameraButton>
              <CameraIcon />
            </CameraButton>
          </RightSection>
        </CardHeader>
      )}

      <ChartContainer>
        <ResponsiveContainer width="100%" height={"100%"}>
          <LineChart
            data={transformedData}
            margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="0" stroke="#E5E9F2" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#000", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#000", fontSize: 12 }}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              domain={[0, 6]}
              tickFormatter={formatYAxisTick}
              dx={-10}
            />
            <Tooltip content={<CustomTooltipComponent />} />
            <Line
              type="linear"
              dataKey="viewsPos"
              stroke="#05A584"
              strokeWidth={2}
              dot={{ fill: "#05A584", strokeWidth: 2, r: 4, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#05A584" }}
              name="views"
            />
            <Line
              type="linear"
              dataKey="reactionsPos"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#3B82F6" }}
              name="reactions"
            />
            <Line
              type="linear"
              dataKey="joinsPos"
              stroke="#F5A623"
              strokeWidth={2}
              dot={{ fill: "#F5A623", strokeWidth: 2, r: 4, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#F5A623" }}
              name="joins"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </CardWrapper>
  );
};

export default EngagementTimeline;

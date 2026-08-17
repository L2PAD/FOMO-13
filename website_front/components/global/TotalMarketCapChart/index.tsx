import moment from "moment";
import React from "react";
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import styled from "styled-components";
import { clarifyAmount } from "../../../helpers/clarifyAmount";

export const Wrapper = styled.div`
  margin-top: 25px;
  width: 100%;

    @media (max-width: 768px) {
    margin-top: 0;

  }
`;

type LineChartProps = {
  data: any[];
  dataKey: string;
  stroke?: string;
  isGrowing: boolean;
};

const TotalMarketCapChart: React.FC<LineChartProps> = ({
  isGrowing,
  data,
  dataKey,
}) => {
  const strokeColor = isGrowing ? "#04A584" : "red";

  const values = data.map((item) => item[dataKey]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const buffer = (maxValue - minValue) * 0.1 || maxValue * 0.001;

  const gradientId = isGrowing ? "gradient-up" : "gradient-down";

  return (
    <Wrapper>
      <ResponsiveContainer width="100%" height={100}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="gradient-up" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#04A584" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#04A584" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradient-down" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="red" stopOpacity={0.4} />
              <stop offset="100%" stopColor="red" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis dataKey="name" hide />
          <YAxis domain={[minValue - buffer, maxValue + buffer]} hide />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const { date } = payload[0].payload;
                const value: number = payload[0].payload[dataKey] || 0;
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "start",
                        gap: "4px",
                      }}
                    >
                      <p style={{ margin: "0 0 5px 0", fontWeight: "var(--font-weight-semibold)" }}>
                        Date:{" "}
                      </p>
                      <span>{`${moment(date).format("ll hh:mm a")}`}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "start",
                        gap: "4px",
                      }}
                    >
                      <p style={{ margin: "0 0 5px 0", fontWeight: "var(--font-weight-semibold)" }}>
                        Value:{" "}
                      </p>
                      <span>${clarifyAmount(value)}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ fill: "transparent" }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="none"
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Wrapper>
  );
};

export default TotalMarketCapChart;

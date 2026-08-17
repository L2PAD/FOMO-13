import moment from "moment";
import React, { useMemo } from "react";
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
import { useInView } from "react-intersection-observer";
import { simplifyAmount } from "../../../helpers/simplifyAmount";

export const Wrapper = styled.div`
  width: 100%;
`;

type LineChartProps = {
  data: any[];
  dataKey: string;
  stroke?: string;
  isGrowing: boolean;
  variant?: "24h" | "7d" | "30d" | "1y";
};

const getCurrentData = (
  data: LineChartProps["data"],
  variant: "24h" | "7d" | "30d" | "1y"
): Array<any> => {
  const now = moment();

  switch (variant) {
    case "24h":
      return data.filter((item) =>
        moment(item.timestamp).isAfter(now.clone().subtract(1, "days"))
      );
    case "7d":
      return data;
    case "30d":
      return data.filter((item) =>
        moment(item.timestamp).isAfter(now.clone().subtract(30, "days"))
      );
    case "1y":
      return data.filter((item) =>
        moment(item.timestamp).isAfter(now.clone().subtract(1, "year"))
      );
    default:
      return data;
  }
};

const TablePriceChart: React.FC<LineChartProps> = React.memo(
  ({ isGrowing, data, dataKey, variant = "7d" }) => {
    const { ref, inView } = useInView({
      triggerOnce: true,
      threshold: 0.1,
    });

    const chartData = useMemo(() => {
      const currentData = getCurrentData(data, variant);

      return currentData.map((item) => {
        const value = dataKey
          .split(".")
          .reduce((acc: any, key) => (acc ? acc[key] : undefined), item);
        return {
          price: item.price.USD,
          value,
          color: isGrowing ? "green" : "red",
          date: moment(item.timestamp).format("MMM Do, hh:mm a"),
        };
      });
    }, [data, isGrowing, variant]);

    const values = useMemo(
      () => data.map((item: any) => item.price.USD),
      [data]
    );
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const buffer = (maxValue - minValue) * 0.1 || maxValue * 0.001;

    const areaFill = isGrowing ? "url(#gradient-up)" : "url(#gradient-down)";

    return (
      <Wrapper ref={ref}>
        <ResponsiveContainer width="100%" height={50}>
          <ComposedChart data={chartData}>
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
                  const { date, price } = payload[0].payload;
                  return (
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.3)",
                        backdropFilter: "blur(25px)",
                        WebkitBackdropFilter: "blur(25px)",
                        borderRadius: "8px",
                        padding: "6px",
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
                        <span>{`${date}`}</span>
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
                        <span>${simplifyAmount(price, 2)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: "transparent" }}
            />
            <Area
              type="linear"
              dataKey={dataKey}
              stroke="none"
              fill={areaFill}
              fillOpacity={1}
              dot={false}
              isAnimationActive={false}
            />
            {chartData.map((entry: any, index: any) => (
              <Line
                key={index}
                type="linear"
                dataKey={dataKey}
                stroke={entry.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </Wrapper>
    );
  }
);

export default TablePriceChart;

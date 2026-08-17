import React, { useMemo } from "react";
import moment from "moment";
import {
    ResponsiveContainer,
    Tooltip,
    YAxis,
    Area,
    Line,
    ComposedChart,
    CartesianGrid,
    Customized,
} from "recharts";
import styled from "styled-components";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { IPortfolioPriceData } from "../../../../../types/global_types";
import RangeSelector from "../RangeSelector";

const CustomGrid = (props: any) => {
    const { yAxisMap, width } = props;
    const yTicks = yAxisMap?.[0]?.ticks || [];
    return (
        <g>
            {yTicks.map((tick: number, i: number) => (
                <line
                    key={i}
                    x1={0}
                    x2={width}
                    y1={tick}
                    y2={tick}
                    stroke="#ccc"
                    strokeDasharray="3 3"
                />
            ))}
        </g>
    );
};

const Wrapper = styled.div`
  margin-top: 25px;
  width: 100%;
  position: relative;
`;

const ChartContainer = styled.div`
  width: 100%;
  position: relative;
`;

const PriceRange = styled.div`
  position: absolute;
  right: -1px;
  top: 20px;
  height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 12px;
  color: #666;
  padding-right: 8px;
  pointer-events: none;
  background: #ffffff;
`;

type Props = {
    isGrowing: boolean
    history: IPortfolioPriceData[];
    isArea?: boolean;
    name?: string;
    customRange: [Date, Date] | null;
    setCustomRange: (r: [Date, Date]) => void;
};

const PERCENT_LABEL_STEPS = 4;

const toFinitePercent = (value: unknown): number | null => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
    }

    return value;
};

const formatPercentLabel = (value: number): string => {
    const absoluteValue = Math.abs(value);
    const maximumFractionDigits = absoluteValue >= 100 ? 0 : absoluteValue >= 10 ? 1 : 2;
    const roundedValue = Number(value.toFixed(maximumFractionDigits));
    const normalizedValue = Object.is(roundedValue, -0) ? 0 : roundedValue;

    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits,
    }).format(normalizedValue);
};

const UniversalPortfolioChartBody: React.FC<Props> = ({
    history,
    isGrowing,
    name,
    isArea = true,
    customRange,
    setCustomRange,
}) => {
    const availableRange: [Date, Date] = useMemo(() => {
        const timestamps = history.map((h) => new Date(h.date).getTime());

        if (timestamps.length === 0) return [new Date(), new Date()];

        return [new Date(Math.min(...timestamps)), new Date(Math.max(...timestamps))];
    }, [history]);

    const { data, allTimeHistory } = useMemo(() => {
        const filtered = history.filter(
            (i) =>
                !customRange ||
                (new Date(i.date).getTime() >= customRange[0].getTime() &&
                    new Date(i.date).getTime() <= customRange[1].getTime())
        );

        return {
            data: filtered.map((i) => ({
                ...i,
                dateMs: new Date(i.date).getTime(),
                name: moment(i.date).format("MM/DD"),
                value: i.totalBalance,
            })),
            allTimeHistory: filtered.map((i) => ({
                name: moment(i.date).format("MM/DD HH:mm"),
                date: new Date(i.date).getTime(),
                [name || "Portfolio"]: i.totalBalance,
            })),
        };
    }, [history, customRange]);

    const values = data.map((d) => d.value);
    const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 0;
    const maxChange = Math.max(
        0,
        ...values.map((v, i) =>
            i === 0 || values[i - 1] === 0 ? 0 : Math.abs((v - values[i - 1]) / values[i - 1])
        )
    );
    const buffer = Math.max(1, (maxValue - minValue) * 0.005);
    const strokeColor = isGrowing ? "#04A584" : "red";
    const gradientId = isGrowing ? "gradient-up" : "gradient-down";

    const rangeLabels = useMemo(() => {
        const percents = data.reduce<number[]>((result, item) => {
            const percent = toFinitePercent(item.totalProfitPercent);

            if (percent !== null) {
                result.push(percent);
            }

            return result;
        }, []);

        if (!percents.length) return [];

        const minPercent = Math.min(...percents);
        const maxPercent = Math.max(...percents);
        const interval = (maxPercent - minPercent) / PERCENT_LABEL_STEPS;

        return Array.from({ length: PERCENT_LABEL_STEPS + 1 }, (_, index) => {
            const value = maxPercent - index * interval;

            return {
                value,
                label: formatPercentLabel(value),
            };
        });
    }, [data]);

    if (!data.length) {
        return (
            <Wrapper>
                <ChartContainer style={{ minHeight: 400 }} />
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <ChartContainer>
                <ResponsiveContainer width="100%" height={400}>
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

                        <CartesianGrid stroke="#c7c7c74b" vertical={false} />
                        <YAxis
                            domain={[minValue - buffer, maxValue + buffer]}
                            orientation="right"
                            width={60}
                            axisLine={false}
                            tickLine={false}
                        />

                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload?.length) {
                                    const p: any = payload[0].payload;
                                    return (
                                        <div
                                            style={{
                                                background: "rgba(255, 255, 255, 0.3)",
                                                backdropFilter: "blur(25px)",
                                                borderRadius: "8px",
                                                padding: "10px",
                                                fontSize: "12px",
                                                color: "#070B35",
                                            }}
                                        >
                                            <div>
                                                <b>Date:</b> {moment(p.date).format("ll HH:mm")}
                                            </div>
                                            <div>
                                                <b>Total:</b> ${clarifyAmount(p.value)}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ fill: "transparent" }}
                        />

                        <Customized component={CustomGrid} />

                        <Area
                            dataKey="value"
                            stroke="none"
                            fill={isArea ? `url(#${gradientId})` : "transparent"}
                            dot={false}
                        />
                        <Line
                            dataKey="value"
                            stroke={strokeColor}
                            strokeWidth={2}
                            dot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>

                <PriceRange>
                    {rangeLabels.map(({ value, label }, idx) => (
                        <div
                            style={value < 0 ? { color: 'var(--main-red)' } : {color: 'var(--main-green)'}}
                            key={`${label}-${idx}`}>{label}%</div>
                    ))}
                </PriceRange>
            </ChartContainer>

            <RangeSelector
                initialRange={availableRange}
                availableRange={availableRange}
                onChange={setCustomRange}
                data={allTimeHistory}
                name={name || ""}
                metric="totalBalance"
            />
        </Wrapper>
    );
};

export default UniversalPortfolioChartBody;

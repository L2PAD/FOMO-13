import React, { useMemo } from "react";
import moment from "moment";
import {
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Line,
    ComposedChart,
    CartesianGrid,
    Legend,
    Area,
} from "recharts";
import { NNHistoryItem } from "../../../../../types/global_types";

type Props = {
    data: NNHistoryItem[];
};

const NnHistoryChart: React.FC<Props> = ({ data }) => {
    const chartData = useMemo(
        () =>
            data
                .slice(-18)
                .map((d) => ({
                    date: moment(d.date).format("HH:mm"),
                    actual: d.actualPrice,
                    predicted: d.predictedPrice,
                    changePct: d.realChangePct,
                    predictedVsActualPct: d.predictedVsActualPct || 0
                })),
        [data]
    );

    const [minY, maxY] = useMemo(() => {
        if (!chartData.length) return [0, 0];
        const values = chartData.flatMap((d) => [d.actual, d.predicted]);
        const min = Math.min(...values);
        const max = Math.max(...values);

        const padding = (max - min) * 0.1 || min * 0.05 || 0.001;
        return [min - padding, max + padding];
    }, [chartData]);


    return (
        <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
                <ComposedChart data={chartData}>
                    <CartesianGrid stroke="#c7c7c74b" strokeDasharray="0 0" vertical={false} />

                    <XAxis color="gray" dataKey="date" />
                    <YAxis
                        yAxisId="left"
                        domain={[minY, maxY]}
                        tick={{ fill: "gray", fontSize: 12 }}
                        width={0}
                    />

                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const p = payload[0].payload;
                                return (
                                    <div
                                        style={{
                                            background: "rgba(255,255,255,0.3)",
                                            backdropFilter: "blur(15px)",
                                            borderRadius: 8,
                                            padding: 12,
                                            fontSize: 16,
                                            color: "#070B35",
                                            boxShadow: "2px 2px 4px #0000001f",
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: "center",
                                            gap: '4px',
                                            marginBottom: 8
                                        }}>
                                            <div
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    background: `#04A584`,
                                                    borderRadius: "50%",
                                                    marginRight: "5px",
                                                }}
                                            ></div>
                                            Price Actual: <b>{p.actual?.toFixed(4)}$</b>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: "center",
                                            gap: '4px',
                                            marginBottom: 8
                                        }}>
                                            <div
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    background: `#860D73`,
                                                    borderRadius: "50%",
                                                    marginRight: "5px",
                                                }}
                                            ></div>
                                            Predicted: <b>{p.predicted?.toFixed(4)}$</b>
                                        </div>
                                        <div style={{ marginBottom: 8 }}>
                                            Change: <b style={{ color: p.changePct > 0 ? '#04A584' : 'red' }}>{p.changePct?.toFixed(2)}%</b>
                                        </div>
                                        {/* <div>
                                            Pred VS Act:{"  "}
                                            <b style={{ color: p.predictedVsActualPct > 0 ? '#04A584' : 'red' }}>
                                                {p.predictedVsActualPct?.toFixed(2)}%
                                            </b>
                                        </div> */}
                                    </div>
                                );
                            }
                            return null;
                        }}
                        cursor={{ fill: "transparent" }}
                    />


                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="actual"
                        stroke="#04A584"
                        strokeWidth={4}
                        dot={false}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="predicted"
                        stroke="#860D73"
                        strokeWidth={4}
                        dot={false}
                    />
                    {/* <Line
                        yAxisId="right"
                        type="linear"
                        dataKey="changePct"
                        stroke="#007BFF"
                        strokeWidth={1.5}
                        dot={false}
                    /> */}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default NnHistoryChart;

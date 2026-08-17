import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Chart, Wrapper } from "./styles";

interface DataItem {
  name: string;
  uv: number;
  pv: number;
  amt: number;
}

const data: DataItem[] = [
  { name: "Page A", uv: 4000, pv: 2400, amt: 2400 },
  { name: "Page B", uv: 3000, pv: 1398, amt: 2210 },
  { name: "Page C", uv: 2000, pv: 18, amt: 2290 },
  { name: "Page D", uv: 2780, pv: 3908, amt: 2000 },
  { name: "Page E", uv: 28, pv: 4800, amt: 2181 },
];

const BarMinHeightChart: React.FC = () => {
  return (
    <Wrapper>
      <Chart>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" width={500} height={300} data={data}>
            <CartesianGrid strokeDasharray="1 1" vertical={false} />
            <XAxis type="number" stroke="white" />
            <YAxis
              tick={{ fill: "#F5FBFD", fontSize: 14 }}
              orientation="left"
              dataKey="name"
              type="category"
              stroke="#F5FBFD"
            />
            <Bar
              barSize={20}
              radius={20}
              stroke="#FF5858"
              strokeWidth={2}
              dataKey="pv"
              fill="#FB9A9B"
              minPointSize={10}
            />
            <Bar
              barSize={20}
              radius={20}
              stroke="#04A584"
              strokeWidth={2}
              dataKey="uv"
              fill="#65C8B5"
              minPointSize={10}
            />
          </BarChart>
        </ResponsiveContainer>
      </Chart>
    </Wrapper>
  );
};

export default BarMinHeightChart;

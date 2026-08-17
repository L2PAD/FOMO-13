import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Container } from "./styles";

const data = [
  { name: "18.04" },
  { name: "19.04", line1: 15, line2: 35 },
  { name: "20.04", line1: 12, line2: 35 },
  { name: "21.04", line1: 10, line2: 22 },
  { name: "22.04", line1: 25, line2: 30 },
  { name: "23.04", line1: 38, line2: 22 },
  { name: "24.04", line1: 20, line2: 38 },
  { name: "25.04", line1: 35, line2: 20 },
  { name: "26.04", line1: 28, line2: 32 },
  { name: "27.04", line1: 12, line2: 35 },
  { name: "28.04", line1: 18, line2: 28 },
  { name: "29.04", line1: 22, line2: 38 },
  { name: "30.04" },
];

const Chart = () => {
  return (
    <Container>
      <div className="chart">
        <div className="y-labels labels">
          <p>40</p>
          <p>35</p>
          <p>30</p>
          <p>25</p>
          <p>20</p>
          <p>15</p>
          <p>10</p>
          <p>5</p>
          <p>0</p>
        </div>
        <LineChart width={585} height={300} data={data}>
          <XAxis dataKey="name" tickLine={false} />
          <YAxis tickLine={false} />
          <Tooltip />
          <Line
            dataKey="line1"
            stroke="#04A584"
            strokeWidth={2}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
          />
          <Line
            dataKey="line2"
            stroke="#738094"
            dot={{ r: 5, stroke: "#738094", strokeWidth: 2 }}
            strokeWidth={0}
          />
        </LineChart>
      </div>
      <div className="x-labels labels">
        {data.map((datum) => (
          <p>{datum.name}</p>
        ))}
      </div>
    </Container>
  );
};

export default Chart;

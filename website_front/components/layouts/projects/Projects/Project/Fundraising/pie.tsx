import { PieChart, Pie, Cell } from "recharts";
import React from "react";

const data = [
  { name: "Group A", value: 8 },
  { name: "Group B", value: 15 },
  { name: "Group C", value: 32 },
  { name: "Group D", value: 45 },
];

const COLORS = ["#58FFAF", "#58D7FF", "#FF5858", "#FFDA58"];

const PieGraphic = () => {
  return (
    <PieChart width={184} height={184}>
      <Pie
        data={data}
        innerRadius={35}
        outerRadius={92}
        paddingAngle={0}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
};

export default PieGraphic;

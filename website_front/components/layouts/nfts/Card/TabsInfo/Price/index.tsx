import React from "react";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { PriceGraphic } from "../../../../../../staticContent/global";
import { TooltipWrapper, Wrapper } from "./styles";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <TooltipWrapper>
        Apr {label.split(".")[0]}, 2022, 10:29:32 a.m.
        <br />
        {payload[0].value} ETH
      </TooltipWrapper>
    );
  }

  return null;
};

const Price = () => {
  return (
    <Wrapper variant="default">
      <LineChart width={590} height={297} data={PriceGraphic}>
        <XAxis dataKey="date" />
        <YAxis dataKey="pr" />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="pr" stroke="#00C099" strokeWidth={2} />
      </LineChart>
    </Wrapper>
  );
};

export default Price;

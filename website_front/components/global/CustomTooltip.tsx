import React from "react";
import { TooltipWrapper } from "../layouts/nfts/Card/TabsInfo/Price/styles";

export const CustomTooltip = ({ active, payload, label }: any) => {
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

import React from "react";
import dynamic from "next/dynamic";
import {
  PieTitleWrapper,
  PieValuesPercentage,
  PieValuesPercentageWrapper,
  PieValuesWrapper,
  PieWrapper,
} from "../../../Projects/Project/Fundraising/styles";
import Typography from "../../../../../global/common/Typography";
import { PieContentWrapper } from "../styles";

const PieGraphic = dynamic(
  //@ts-ignore
  () => import("../../../Projects/Project/Fundraising/pie.tsx"),
  { ssr: false }
);

const EchangeTab = () => {
  return (
    <div style={{ padding: "0px 16px 16px 16px" }}>
      <PieTitleWrapper>
        <Typography variant="p">Exchange usage</Typography>
      </PieTitleWrapper>
      <PieContentWrapper>
        <PieWrapper>
          <PieGraphic />
        </PieWrapper>
        <PieValuesWrapper>
          <PieValuesPercentageWrapper>
            <PieValuesPercentage color="#58FFAF" variant="p">
              <i />
              <span>8%</span> - Marketing & Partner support
            </PieValuesPercentage>
            <PieValuesPercentage color="#FFDA58" variant="p">
              <i />
              <span>15% </span> - Team
            </PieValuesPercentage>
            <PieValuesPercentage color="#58D7FF" variant="p">
              <i />
              <span>32%</span> - Community rewards
            </PieValuesPercentage>
            <PieValuesPercentage color="#FF5858" variant="p">
              <i />
              <span>45%</span> - Token Sale
            </PieValuesPercentage>
          </PieValuesPercentageWrapper>
        </PieValuesWrapper>
      </PieContentWrapper>
    </div>
  );
};

export default EchangeTab;

import React from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { AssetTableData } from "../../../../../../staticContent/global";
import Typography from "../../../../../global/common/Typography";
import { EditIcon } from "../../../../../global/Icons";
import ViewTable from "../../../../../global/Tables/ViewTable";
import { authState } from "../../../../../../store/slices/authSlice";
import {
  Content,
  ContentWrapper,
  MetricsCol,
  MetricsContentWrapper,
  MetricsRow,
  MetricsWrapper,
  PieContentWrapper,
  PieTitleWrapper,
  PieValuesPercentage,
  PieValuesPercentageWrapper,
  PieValuesTitle,
  PieValuesWrapper,
  PieWrapper,
  RoundTitle,
  RoundValue,
  RoundValueWrapper,
  RoundWrapper,
  ScrollWrapper,
  TableWrapper,
} from "./styles";

// @ts-ignore
const PieGraphic = dynamic(() => import("./pie.tsx"), { ssr: false });

const Fundraising = () => {
  const { isLogin } = useSelector(authState);

  return (
    <div>
      <ScrollWrapper>
        {Array(5)
          .fill("")
          .map((item, i) => {
            return (
              <RoundWrapper variant="default" key={i}>
                <RoundTitle variant="p">Funding Round</RoundTitle>
                <RoundValueWrapper>
                  <RoundValue variant="p">February 2022</RoundValue>
                  <RoundValue variant="p">
                    Price: <span>--</span>
                  </RoundValue>
                </RoundValueWrapper>
                <RoundValueWrapper>
                  <RoundValue variant="p">
                    Raised: <span>$205.00 M</span>
                  </RoundValue>
                  <RoundValue variant="p">
                    Pre-Valuation: <span>$205.00 M</span>
                  </RoundValue>
                </RoundValueWrapper>
              </RoundWrapper>
            );
          })}
      </ScrollWrapper>
      <ContentWrapper>
        <Content>
          <div>
            <PieTitleWrapper>
              <Typography variant="p">Token Allocation</Typography>
              {isLogin && (
                <button>
                  <EditIcon fill="#00C099" />
                </button>
              )}
            </PieTitleWrapper>
            <PieContentWrapper>
              <PieWrapper>
                <PieGraphic />
              </PieWrapper>
              <PieValuesWrapper>
                <PieValuesTitle variant="p">
                  Total Tokens Supply: <span>186,000,000</span>
                </PieValuesTitle>
                <PieValuesTitle variant="p">
                  Tokens For Sale: <span>83,700,000 (45%)</span>
                </PieValuesTitle>
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
          <MetricsWrapper>
            <PieTitleWrapper>
              <Typography variant="p">Token Metrics</Typography>
            </PieTitleWrapper>
            <MetricsContentWrapper>
              <MetricsCol>
                <MetricsRow>
                  <span>Ticket:</span> <span>ABT</span>
                </MetricsRow>
                <MetricsRow>
                  <span>Token Type:</span> <span>ERC20</span>
                </MetricsRow>
                <MetricsRow>
                  <span>ICO Token Price:</span>{" "}
                  <span>0.5USD / 0.000084 ETH</span>
                </MetricsRow>
                <MetricsRow>
                  <span>Pre-sale price:</span>{" "}
                  <span>0.5USD / 0.000084 ETH</span>
                </MetricsRow>
              </MetricsCol>
              <MetricsCol>
                <MetricsRow>
                  <span>KYC:</span> <span>YES</span>
                </MetricsRow>
                <MetricsRow>
                  <span>Whitelist:</span> <span>YES (ended)</span>
                </MetricsRow>
                <MetricsRow>
                  <span>Min/Max Personal Cap:</span> <span>0.1/3</span>
                </MetricsRow>
                <MetricsRow>
                  <span>Accepts:</span> <span>ETH</span>
                </MetricsRow>
              </MetricsCol>
            </MetricsContentWrapper>
          </MetricsWrapper>
        </Content>
        <TableWrapper>
          <ViewTable
            type="asset"
            //@ts-ignore
            cardsData={{ cards: AssetTableData, show: 0 }}
          />
        </TableWrapper>
      </ContentWrapper>
    </div>
  );
};

export default Fundraising;

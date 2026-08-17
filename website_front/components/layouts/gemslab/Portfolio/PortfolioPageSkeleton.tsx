import React, { useRef } from "react";
import styled from "styled-components";
import Placeholder from "../../../global/common/Placeholder";
import { PageWrapper } from "../../projects/CryptoMarket/styles";
import {
  LeftColumn,
  PortfolioBody,
  RightColumn,
  TopMovers,
} from "./styles";
import {
  Body as BreakdownBody,
  Header as BreakdownHeader,
  TableHeader as BreakdownTableHeader,
  TableList as BreakdownTableList,
  TableRow as BreakdownTableRow,
  Wrapper as BreakdownWrapper,
} from "./Breakdown/styles";
import {
  Body as TransactionsBody,
  Header as TransactionsHeader,
  TableHeader as TransactionsTableHeader,
  TableList as TransactionsTableList,
  TableRow as TransactionsTableRow,
  Wrapper as TransactionsWrapper,
} from "./Transactions/styles";
import {
  Body as PortfolioChartBody,
  ChartWrapperBody,
  Header as PortfolioChartHeader,
  Wrapper as PortfolioChartWrapper,
} from "./PortfolioChart/styles";
import {
  DashboardWrapper,
  Wrapper as DashboardCard,
} from "./Dashboard/styles";
import { Overflow } from "../../../global/common/BarDoubleChart/styles";
import BaseCard from "../../../global/common/BaseCard";
import PortfolioPageIntro from "./components/PortfolioPageIntro";
import PortfolioSelectedHeader from "./components/PortfolioSelectedHeader";
import { PortfolioSelection } from "./types";

const OverviewGrid = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 40px;

  @media (max-width: 1100px) {
    flex-direction: column;
  }
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const SkeletonColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PieSkeletonCard = styled(BaseCard)`
  width: 100%;
  margin-top: 40px;
  display: flex;
  gap: 40px;

  @media (max-width: 1100px) {
    flex-direction: column;
  }
`;

const PieCirclePlaceholder = styled.div`
  width: 280px;
  flex: 0 0 280px;
  display: grid;
  place-items: center;

  @media (max-width: 1100px) {
    width: 100%;
    flex-basis: auto;
  }
`;

const MoversGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TABLE_ROWS = [0, 1, 2, 3, 4];

const SKELETON_PORTFOLIO: PortfolioSelection = {
  _id: "skeleton-portfolio",
  name: "--",
  description: "--",
  code: "0000",
  totalBalance: 0,
  profit: 0,
  profitPercent: 0,
  totalInvested: 0,
  performance1h: { usd: 0 },
  isAssets: true,
};

const PortfolioPageSkeleton: React.FC = () => {
  const portfolioDropdownRef = useRef<HTMLDivElement>(null);

  return (
    <PageWrapper aria-hidden="true">
      <PortfolioPageIntro
        searchValue=""
        onSearchChange={() => { }}
        portfolioDropdownRef={portfolioDropdownRef}
        isPortfolioDropdownOpen={false}
        portfolioItems={[]}
        activePortfolioId=""
        onTogglePortfolioDropdown={() => { }}
        onSelectPortfolio={() => { }}
        onOpenCreatePortfolio={() => { }}
      />

      <PortfolioSelectedHeader
        portfolio={SKELETON_PORTFOLIO}
        canShare
        isActionsModal={false}
        onToggleActionsModal={() => { }}
        onCloseActionsModal={() => { }}
        onOpenBattle={() => { }}
        onOpenShare={() => { }}
        onOpenEdit={() => { }}
        onDuplicate={() => { }}
        onOpenDelete={() => { }}
      />

      <PortfolioBody>
        <PortfolioChartWrapper>
          <PortfolioChartHeader>
            <Placeholder
              width="180px"
              height="28px"
              borderRadius="8px"
              marginBottom="0"
            />
            <SkeletonRow>
              {["48px", "44px", "48px", "48px", "44px", "44px", "36px"].map(
                (width) => (
                  <Placeholder
                    key={width}
                    width={width}
                    height="32px"
                    borderRadius="8px"
                    marginBottom="0"
                  />
                )
              )}
            </SkeletonRow>
          </PortfolioChartHeader>

          <PortfolioChartBody>
            <ChartWrapperBody variant="main">
              <SkeletonColumn>
                <SkeletonRow>
                  <Placeholder
                    width="132px"
                    height="16px"
                    borderRadius="8px"
                    marginBottom="0"
                  />
                  <Placeholder
                    width="96px"
                    height="16px"
                    borderRadius="8px"
                    marginBottom="0"
                  />
                </SkeletonRow>
                <Placeholder
                  width="100%"
                  height="320px"
                  borderRadius="16px"
                  marginBottom="0"
                />
              </SkeletonColumn>
            </ChartWrapperBody>

            <DashboardWrapper>
              {[0, 1, 2].map((item) => (
                <DashboardCard key={item} variant="main">
                  <SkeletonColumn>
                    <SkeletonRow
                      style={{ justifyContent: "space-between", gap: 16 }}
                    >
                      <SkeletonColumn>
                        <Placeholder
                          width="110px"
                          height="14px"
                          borderRadius="8px"
                          marginBottom="0"
                        />
                        <Placeholder
                          width="88px"
                          height="12px"
                          borderRadius="999px"
                          marginBottom="0"
                        />
                      </SkeletonColumn>
                      <SkeletonColumn>
                        <Placeholder
                          width="92px"
                          height="16px"
                          borderRadius="8px"
                          marginBottom="0"
                        />
                        <Placeholder
                          width="74px"
                          height="12px"
                          borderRadius="999px"
                          marginBottom="0"
                        />
                      </SkeletonColumn>
                    </SkeletonRow>
                    <Placeholder
                      width="72%"
                      height="18px"
                      borderRadius="8px"
                      marginBottom="0"
                    />
                  </SkeletonColumn>
                </DashboardCard>
              ))}
            </DashboardWrapper>
          </PortfolioChartBody>
        </PortfolioChartWrapper>
      </PortfolioBody>

      <OverviewGrid>
        <LeftColumn>
          <BreakdownWrapper>
            <BreakdownHeader>
              <Placeholder
                width="190px"
                height="28px"
                borderRadius="8px"
                marginBottom="0"
              />
              <SkeletonRow>
                <Placeholder
                  width="102px"
                  height="34px"
                  borderRadius="8px"
                  marginBottom="0"
                />
                <Placeholder
                  width="102px"
                  height="34px"
                  borderRadius="8px"
                  marginBottom="0"
                />
              </SkeletonRow>
            </BreakdownHeader>

            <BreakdownBody variant="main">
              <Overflow>
                <BreakdownTableHeader>
                  {["52%", "58%", "50%", "62%", "60%"].map((width, index) => (
                    <div key={`breakdown-header-${index}`}>
                      <Placeholder
                        width={width}
                        height="12px"
                        borderRadius="8px"
                        marginBottom="0"
                      />
                    </div>
                  ))}
                </BreakdownTableHeader>

                <BreakdownTableList>
                  {TABLE_ROWS.map((rowIndex) => (
                    <BreakdownTableRow key={`breakdown-row-${rowIndex}`}>
                      {[0, 1, 2, 3, 4].map((cellIndex) => (
                        <div className="item" key={cellIndex}>
                          <SkeletonColumn>
                            <Placeholder
                              width={cellIndex === 0 ? "72%" : "62%"}
                              height="16px"
                              borderRadius="8px"
                              marginBottom="0"
                            />
                            <Placeholder
                              width="42%"
                              height="10px"
                              borderRadius="999px"
                              marginBottom="0"
                            />
                          </SkeletonColumn>
                        </div>
                      ))}
                    </BreakdownTableRow>
                  ))}
                </BreakdownTableList>
              </Overflow>
            </BreakdownBody>
          </BreakdownWrapper>
        </LeftColumn>

        <RightColumn>
          <TransactionsWrapper style={{ marginTop: 0 }}>
            <TransactionsHeader>
              <Placeholder
                width="170px"
                height="28px"
                borderRadius="8px"
                marginBottom="0"
              />
            </TransactionsHeader>
            <PieSkeletonCard variant="main">
              <PieCirclePlaceholder>
                <Placeholder
                  width="220px"
                  height="220px"
                  borderRadius="999px"
                  marginBottom="0"
                />
              </PieCirclePlaceholder>
              <SkeletonColumn style={{ flex: 1 }}>
                {TABLE_ROWS.map((row) => (
                  <SkeletonRow
                    key={`pie-row-${row}`}
                    style={{ justifyContent: "space-between", gap: 16 }}
                  >
                    <Placeholder
                      width="42%"
                      height="16px"
                      borderRadius="8px"
                      marginBottom="0"
                    />
                    <Placeholder
                      width="30%"
                      height="16px"
                      borderRadius="8px"
                      marginBottom="0"
                    />
                  </SkeletonRow>
                ))}
              </SkeletonColumn>
            </PieSkeletonCard>

            <TransactionsHeader style={{ marginTop: 40 }}>
              <Placeholder
                width="160px"
                height="28px"
                borderRadius="8px"
                marginBottom="0"
              />
            </TransactionsHeader>
            <TransactionsBody variant="main">
              <TransactionsTableHeader>
                {["58%", "48%", "46%", "46%", "54%"].map((width, index) => (
                  <div key={`transactions-header-${index}`}>
                    <Placeholder
                      width={width}
                      height="12px"
                      borderRadius="8px"
                      marginBottom="0"
                    />
                  </div>
                ))}
              </TransactionsTableHeader>
              <TransactionsTableList>
                {TABLE_ROWS.map((rowIndex) => (
                  <TransactionsTableRow key={`transactions-row-${rowIndex}`}>
                    {[0, 1, 2, 3, 4].map((cellIndex) => (
                      <div className="item" key={cellIndex}>
                        <SkeletonColumn>
                          <Placeholder
                            width={cellIndex === 0 ? "72%" : "60%"}
                            height="16px"
                            borderRadius="8px"
                            marginBottom="0"
                          />
                          <Placeholder
                            width="40%"
                            height="10px"
                            borderRadius="999px"
                            marginBottom="0"
                          />
                        </SkeletonColumn>
                      </div>
                    ))}
                  </TransactionsTableRow>
                ))}
              </TransactionsTableList>
            </TransactionsBody>
          </TransactionsWrapper>
        </RightColumn>
      </OverviewGrid>

      <TopMovers>
        <Placeholder
          width="220px"
          height="28px"
          borderRadius="8px"
          marginBottom="20px"
        />
        <MoversGrid>
          {[0, 1].map((item) => (
            <DashboardCard key={`mover-${item}`} variant="main">
              <SkeletonColumn>
                <Placeholder
                  width="132px"
                  height="18px"
                  borderRadius="8px"
                  marginBottom="0"
                />
                {TABLE_ROWS.slice(0, 3).map((row) => (
                  <SkeletonRow
                    key={`mover-row-${item}-${row}`}
                    style={{ justifyContent: "space-between", gap: 16 }}
                  >
                    <Placeholder
                      width="46%"
                      height="16px"
                      borderRadius="8px"
                      marginBottom="0"
                    />
                    <Placeholder
                      width="24%"
                      height="16px"
                      borderRadius="8px"
                      marginBottom="0"
                    />
                  </SkeletonRow>
                ))}
              </SkeletonColumn>
            </DashboardCard>
          ))}
        </MoversGrid>
      </TopMovers>
    </PageWrapper>
  );
};

export default PortfolioPageSkeleton;

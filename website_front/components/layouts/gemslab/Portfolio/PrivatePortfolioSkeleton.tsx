import React from "react";
import styled from "styled-components";
import Placeholder from "../../../global/common/Placeholder";
import { PageWrapper } from "../../projects/CryptoMarket/styles";
import {
  PortfolioBody,
  PortfolioHeaderBlock,
  PrivatePortfolioHeaderLayout,
  PrivatePortfolioHero,
  PrivatePortfolioIdentity,
  PrivatePortfolioLeadStat,
  PrivatePortfolioLogo,
  PrivatePortfolioMetaGrid,
  PrivatePortfolioMetaItem,
  PrivatePortfolioMetricCard,
  PrivatePortfolioMetricsGrid,
  PrivatePortfolioOwnerCard,
  PrivatePortfolioPerformanceRow,
  PrivatePortfolioStatsPanel,
} from "./styles";
import {
  Body as AssetsBody,
  Header as AssetsHeader,
  TableHeader as AssetsTableHeader,
  TableList as AssetsTableList,
  TableRow as AssetsTableRow,
  Wrapper as AssetsWrapper,
} from "./Breakdown/styles";
import { Overflow } from "../../../global/common/BarDoubleChart/styles";
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

const SkeletonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const SkeletonColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SkeletonOwnerCopy = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SkeletonChartSurface = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 340px;
`;

const SkeletonDashboardRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SkeletonDashboardRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const SkeletonTableValue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PERFORMANCE_ITEMS = [0, 1, 2];
const METRIC_CARDS = [0, 1, 2, 3, 4, 5];
const TABLE_ROWS = [0, 1, 2, 3, 4];

const PrivatePortfolioSkeleton: React.FC = () => {
  return (
    <PageWrapper aria-hidden="true">
      <PortfolioHeaderBlock>
        <PrivatePortfolioHeaderLayout>
          <PrivatePortfolioHero>
            <PrivatePortfolioIdentity>
              <PrivatePortfolioLogo>
                <Placeholder width="100%" height="100%" borderRadius="24px" marginBottom="0" />
              </PrivatePortfolioLogo>

              <div className="content">
                <SkeletonRow>
                  <Placeholder width="92px" height="28px" borderRadius="999px" marginBottom="0" />
                  <Placeholder width="84px" height="28px" borderRadius="999px" marginBottom="0" />
                  <Placeholder width="138px" height="28px" borderRadius="999px" marginBottom="0" />
                  <Placeholder width="152px" height="28px" borderRadius="999px" marginBottom="0" />
                </SkeletonRow>

                <div className="title-group">
                  <Placeholder width="52%" height="38px" borderRadius="10px" marginBottom="0" />
                  <SkeletonColumn>
                    <Placeholder width="100%" height="16px" borderRadius="8px" marginBottom="0" />
                    <Placeholder width="82%" height="16px" borderRadius="8px" marginBottom="0" />
                  </SkeletonColumn>
                </div>
              </div>
            </PrivatePortfolioIdentity>

            <PrivatePortfolioOwnerCard>
              <div className="owner-top">
                <Placeholder width="60px" height="60px" borderRadius="999px" marginBottom="0" />

                <SkeletonOwnerCopy>
                  <Placeholder width="110px" height="12px" borderRadius="999px" marginBottom="0" />
                  <Placeholder width="38%" height="24px" borderRadius="8px" marginBottom="0" />

                  <div className="owner-row">
                    <Placeholder width="94px" height="18px" borderRadius="999px" marginBottom="0" />
                    <Placeholder width="116px" height="18px" borderRadius="999px" marginBottom="0" />
                    <Placeholder width="90px" height="18px" borderRadius="999px" marginBottom="0" />
                  </div>
                </SkeletonOwnerCopy>
              </div>

              <PrivatePortfolioMetaGrid>
                {[0, 1, 2, 3].map((item) => (
                  <PrivatePortfolioMetaItem key={item}>
                    <Placeholder width="46%" height="11px" borderRadius="999px" marginBottom="8px" />
                    <Placeholder width="78%" height="18px" borderRadius="8px" marginBottom="0" />
                  </PrivatePortfolioMetaItem>
                ))}
              </PrivatePortfolioMetaGrid>

              <SkeletonRow>
                <Placeholder width="98px" height="30px" borderRadius="12px" marginBottom="0" />
                <Placeholder width="132px" height="30px" borderRadius="12px" marginBottom="0" />
                <Placeholder width="118px" height="30px" borderRadius="12px" marginBottom="0" />
              </SkeletonRow>
            </PrivatePortfolioOwnerCard>
          </PrivatePortfolioHero>

          <PrivatePortfolioStatsPanel>
            <PrivatePortfolioLeadStat>
              <Placeholder width="112px" height="12px" borderRadius="999px" marginBottom="0" />
              <div style={{ marginTop: 10 }}>
                <Placeholder width="54%" height="42px" borderRadius="10px" marginBottom="0" />
              </div>
              <div style={{ marginTop: 10 }}>
                <Placeholder width="38%" height="18px" borderRadius="999px" marginBottom="0" />
              </div>

              <PrivatePortfolioPerformanceRow>
                {PERFORMANCE_ITEMS.map((item) => (
                  <div className="performance-item" key={item}>
                    <Placeholder width="36px" height="10px" borderRadius="999px" marginBottom="8px" />
                    <Placeholder width="62%" height="18px" borderRadius="8px" marginBottom="0" />
                  </div>
                ))}
              </PrivatePortfolioPerformanceRow>
            </PrivatePortfolioLeadStat>

            <PrivatePortfolioMetricsGrid>
              {METRIC_CARDS.map((item) => (
                <PrivatePortfolioMetricCard key={item}>
                  <Placeholder width="48%" height="11px" borderRadius="999px" marginBottom="8px" />
                  <Placeholder width="72%" height="24px" borderRadius="8px" marginBottom="8px" />
                  <Placeholder width="88%" height="14px" borderRadius="8px" marginBottom="0" />
                </PrivatePortfolioMetricCard>
              ))}
            </PrivatePortfolioMetricsGrid>
          </PrivatePortfolioStatsPanel>
        </PrivatePortfolioHeaderLayout>
      </PortfolioHeaderBlock>

      <PortfolioBody>
        <PortfolioChartWrapper>
          <PortfolioChartHeader>
            <Placeholder width="180px" height="28px" borderRadius="8px" marginBottom="0" />

            <SkeletonRow>
              <Placeholder width="48px" height="32px" borderRadius="8px" marginBottom="0" />
              <Placeholder width="44px" height="32px" borderRadius="8px" marginBottom="0" />
              <Placeholder width="48px" height="32px" borderRadius="8px" marginBottom="0" />
              <Placeholder width="48px" height="32px" borderRadius="8px" marginBottom="0" />
              <Placeholder width="44px" height="32px" borderRadius="8px" marginBottom="0" />
              <Placeholder width="44px" height="32px" borderRadius="8px" marginBottom="0" />
              <Placeholder width="36px" height="32px" borderRadius="8px" marginBottom="0" />
            </SkeletonRow>
          </PortfolioChartHeader>

          <PortfolioChartBody>
            <ChartWrapperBody variant="main">
              <SkeletonChartSurface>
                <SkeletonRow>
                  <Placeholder width="132px" height="16px" borderRadius="8px" marginBottom="0" />
                  <Placeholder width="96px" height="16px" borderRadius="8px" marginBottom="0" />
                </SkeletonRow>
                <Placeholder width="100%" height="320px" borderRadius="16px" marginBottom="0" />
              </SkeletonChartSurface>
            </ChartWrapperBody>

            <DashboardWrapper>
              <DashboardCard variant="main">
                <SkeletonDashboardRows>
                  {[0, 1, 2, 3, 4].map((item) => (
                    <SkeletonDashboardRow key={item}>
                      <SkeletonColumn>
                        <Placeholder width="108px" height="14px" borderRadius="8px" marginBottom="0" />
                        <Placeholder width="84px" height="12px" borderRadius="999px" marginBottom="0" />
                      </SkeletonColumn>
                      <SkeletonColumn>
                        <Placeholder width="92px" height="16px" borderRadius="8px" marginBottom="0" />
                        <Placeholder width="74px" height="14px" borderRadius="8px" marginBottom="0" />
                      </SkeletonColumn>
                    </SkeletonDashboardRow>
                  ))}
                </SkeletonDashboardRows>
              </DashboardCard>

              <DashboardCard variant="main">
                <SkeletonColumn>
                  <Placeholder width="52%" height="14px" borderRadius="8px" marginBottom="0" />
                  <Placeholder width="72%" height="22px" borderRadius="8px" marginBottom="0" />
                  <Placeholder width="48%" height="14px" borderRadius="8px" marginBottom="0" />
                  <Placeholder width="68%" height="22px" borderRadius="8px" marginBottom="0" />
                </SkeletonColumn>
              </DashboardCard>

              <DashboardCard variant="main">
                <SkeletonDashboardRow>
                  <Placeholder width="96px" height="14px" borderRadius="8px" marginBottom="0" />
                  <Placeholder width="78px" height="32px" borderRadius="8px" marginBottom="0" />
                </SkeletonDashboardRow>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <div key={item} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Placeholder width="70%" height="18px" borderRadius="8px" marginBottom="0" />
                      <Placeholder width="44px" height="12px" borderRadius="999px" marginBottom="0" />
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </DashboardWrapper>
          </PortfolioChartBody>
        </PortfolioChartWrapper>
      </PortfolioBody>

      <AssetsWrapper>
        <AssetsHeader>
          <Placeholder width="190px" height="28px" borderRadius="8px" marginBottom="0" />
        </AssetsHeader>

        <AssetsBody variant="main">
          <Overflow>
            <AssetsTableHeader>
              {["52%", "58%", "50%", "62%", "60%"].map((width, index) => (
                <div key={`header-${index}`}>
                  <Placeholder width={width} height="12px" borderRadius="8px" marginBottom="0" />
                </div>
              ))}
            </AssetsTableHeader>

            <AssetsTableList>
              {TABLE_ROWS.map((rowIndex) => (
                <AssetsTableRow key={`row-${rowIndex}`}>
                  <div className="item">
                    <SkeletonTableValue>
                      <Placeholder width="72%" height="18px" borderRadius="8px" marginBottom="0" />
                      <Placeholder width="44%" height="10px" borderRadius="999px" marginBottom="0" />
                    </SkeletonTableValue>
                  </div>

                  <div className="table-column item">
                    <SkeletonTableValue>
                      <Placeholder width="58%" height="16px" borderRadius="8px" marginBottom="0" />
                      <Placeholder width="42%" height="10px" borderRadius="999px" marginBottom="0" />
                    </SkeletonTableValue>
                  </div>

                  <div className="item">
                    <Placeholder width="62%" height="16px" borderRadius="8px" marginBottom="0" />
                  </div>

                  <div className="item">
                    <Placeholder width="60%" height="16px" borderRadius="8px" marginBottom="0" />
                  </div>

                  <div className="table-column item">
                    <SkeletonTableValue>
                      <Placeholder width="66%" height="16px" borderRadius="8px" marginBottom="0" />
                      <Placeholder width="36%" height="10px" borderRadius="999px" marginBottom="0" />
                    </SkeletonTableValue>
                  </div>
                </AssetsTableRow>
              ))}
            </AssetsTableList>
          </Overflow>
        </AssetsBody>
      </AssetsWrapper>
    </PageWrapper>
  );
};

export default PrivatePortfolioSkeleton;
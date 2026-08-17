import React from "react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import PercentValue from "../../../../../global/common/PercentValue";
import imageLoader from "../../../../../../helpers/imageLoader";
import PlaceholderTable from "../../../../../global/common/PlaceholderTable";
import EmptySection from "../../../../../global/EmptySection";
import type { PersonComparisonTableRow } from "../../../../../../http/persons/fetchPersonComparison";
import { Body, Header, Row, Wrapper } from "./styles";

interface IProps {
  rows?: PersonComparisonTableRow[];
  isLoading?: boolean;
}

const formatRiskLevel = (value?: string): string => {
  return value && value !== "Insufficient" ? value : "Insufficient";
};

const ComparisonTable: React.FC<IProps> = ({ rows = [], isLoading = false }) => {
  return (
    <Wrapper variant="main">
      <Header>
        <div className="sticky">Person Name</div>
        <div>Known Portfolio Projects</div>
        <div>Average Project ROI</div>
        <div>Best Performing Asset</div>
        <div>Volatility</div>
        <div>Risk Level</div>
      </Header>
      <Body>
        {isLoading ? (
          <PlaceholderTable height="58px" />
        ) : !rows.length ? (
          <EmptySection />
        ) : (
          rows.map((item, i: number) => {
            const bestInvestment = item.bestInvestmentRoi;
            const portfolioProjects =
              item.holdingsCount || item.supportedProjectsCount || item.projectsCount || 0;

            return (
              <Row key={item.id || item.backerId || i}>
                <div className="project sticky">
                  <UserAvatar
                    avatar={imageLoader(item.logo || item.avatar)}
                    name={item.name}
                    variant="default"
                    size="small"
                    fallbackType="project"
                  />
                  <div className="project-info">
                    <div>{item.name}</div>
                    <span>{item.niche}</span>
                  </div>
                </div>
                <div className="bold">{portfolioProjects}</div>
                <div className="roi">
                  <PercentValue
                    value={item.averageProjectRoi || item.avgRoi || 0}
                    isLabel={false}
                    isIcon={false}
                    rightLabel="x"
                  />
                </div>
                <div className="best-fund">
                  {bestInvestment ? (
                    <>
                      <UserAvatar
                        avatar={imageLoader(bestInvestment.logo || bestInvestment.image)}
                        name={bestInvestment.name}
                        variant="default"
                        size="xSmall"
                        fallbackType="project"
                      />
                      <div className="name">{bestInvestment.name}</div>
                      <PercentValue
                        value={bestInvestment.value || bestInvestment.roi || 0}
                        size="small"
                        isLabel={false}
                        isIcon={false}
                        rightLabel="x"
                      />
                    </>
                  ) : (
                    <span className="empty-value">Insufficient data</span>
                  )}
                </div>
                <div className="bold">
                  {item.volatilityPct || item.volatility
                    ? `${clarifyAmount(item.volatilityPct || item.volatility || 0)}%`
                    : "-"}
                </div>
                <div className={`status ${formatRiskLevel(item.riskLevel)}`}>
                  {formatRiskLevel(item.riskLevel)}
                </div>
              </Row>
            );
          })
        )}
      </Body>
    </Wrapper>
  );
};

export default ComparisonTable;

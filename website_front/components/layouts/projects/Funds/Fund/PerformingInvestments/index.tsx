import React from "react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import PercentValue from "../../../../../global/common/PercentValue";
import imageLoader from "../../../../../../helpers/imageLoader";
import PlaceholderTable from "../../../../../global/common/PlaceholderTable";
import EmptySection from "../../../../../global/EmptySection";
import { FundComparisonBestWorstRow } from "../../../../../../http/funds/fetchFundComparison";
import { Body, Header, Row, Wrapper } from "./styles";

interface IProps {
  rows?: FundComparisonBestWorstRow[];
  isLoading?: boolean;
}

const getRoiValue = (value?: number, fallback?: number): number => {
  return Number(value ?? fallback ?? 0);
};

const getWorstRoiPrecision = (value: number): number => {
  const absoluteValue = Math.abs(value);

  if (absoluteValue > 0 && absoluteValue < 0.01) return 4;
  if (absoluteValue > 0 && absoluteValue < 0.1) return 3;
  return 2;
};

const PerformingInvestments: React.FC<IProps> = ({
  rows = [],
  isLoading = false,
}) => {
  return (
    <Wrapper variant="main">
      <Header>
        <div className="sticky">Fund Name</div>
        <div>Best Asset</div>
        <div>ROI (Best)</div>
        <div>Worst Asset</div>
        <div>ROI (Worst)</div>
      </Header>
      <Body>
        {isLoading ? (
          <PlaceholderTable height="58px" />
        ) : !rows.length ? (
          <EmptySection />
        ) : rows.map((item, i: number) => {
          const { bestInvestment, worstInvestment } = item;
          const bestRoi = getRoiValue(bestInvestment?.value, bestInvestment?.roi);
          const worstRoi = getRoiValue(worstInvestment?.value, worstInvestment?.roi);

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
                  </>
                ) : (
                  <span className="empty-value">Insufficient data</span>
                )}
              </div>
              <PercentValue
                fixedValue={1}
                value={bestRoi}
                size="small"
                isLabel={false}
                isIcon={false}
                rightLabel="x"
              />
              <div className="best-fund">
                {worstInvestment ? (
                  <>
                    <UserAvatar
                      avatar={imageLoader(worstInvestment.logo || worstInvestment.image)}
                      name={worstInvestment.name}
                      variant="default"
                      size="xSmall"
                      fallbackType="project"
                    />
                    <div className="name">{worstInvestment.name}</div>
                  </>
                ) : (
                  <span className="empty-value">Insufficient data</span>
                )}
              </div>
              <PercentValue
                fixedValue={getWorstRoiPrecision(worstRoi)}
                lowValue={1}
                value={worstRoi}
                size="small"
                isLabel={false}
                isIcon={false}
                rightLabel="x"
              />
            </Row>
          );
        })}
      </Body>
    </Wrapper>
  );
};

export default PerformingInvestments;

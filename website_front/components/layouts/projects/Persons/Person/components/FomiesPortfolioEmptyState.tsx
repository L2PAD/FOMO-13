import React, { FC } from "react";
import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import EmptySection from "../../../../../global/EmptySection";

const PlaceholderCard = styled(BaseCard)`
  width: 100%;
  min-height: 320px;
  display: grid;
  place-items: center;
  margin-top: 0;

  @media (max-width: 768px) {
    min-height: 260px;
  }
`;

interface Props {
  isLoading?: boolean;
}

const FomiesPortfolioEmptyState: FC<Props> = ({ isLoading = false }) => {
  return (
    <PlaceholderCard variant="main">
      <EmptySection
        className="small-empty-section"
        title={
          isLoading
            ? "Loading portfolio"
            : "This Fomie has no Public Portfolio"
        }
        description={
          isLoading
            ? "Portfolio data is being prepared."
            : "Portfolio chart, breakdown, wallet balance, and transactions will appear here once a public portfolio is available."
        }
      />
    </PlaceholderCard>
  );
};

export default FomiesPortfolioEmptyState;

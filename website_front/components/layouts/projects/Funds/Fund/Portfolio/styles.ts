import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div``;

export const PortfolioDistributionSkeletonWrapper = styled(BaseCard)`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 28px;
  align-items: center;
  min-height: 300px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const PortfolioPieSkeleton = styled.div`
  display: flex;
  justify-content: center;
`;

export const PortfolioListSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const PortfolioLockedSkeletonWrapper = styled(BaseCard)`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

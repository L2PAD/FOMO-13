import styled from "styled-components";
import BaseCard from "../../../common/BaseCard";
import Typography from "../../../common/Typography";

export const gridColumns = "0.2fr 0.7fr 0.5fr 1.2fr 0.5fr 0.4fr";

export const Wrapper = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
`;

export const ExchangesHeader = styled.div`
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    font-weight: var(--font-weight-semibold);
  }
`;

export const TableWrapper = styled.div`
  min-width: 800px;
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;
`;
export const CardsWrapper = styled.div`
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
export const CardWrapper = styled.div`
  display: grid;
  grid-template-columns: ${() => gridColumns};
  padding: 0 10px;
  align-items: center;
  border-top: 1px solid #f0f2f5;

  .sticky {
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
    background: #f5fbfd;
    padding: 15px 0 15px 10px !important;
  }

  & .bold {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
  }
`;
export const ProjectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;
export const ProjectTitleWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;

  span {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }
`;
export const ProjectTitle = styled(Typography)`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const InvestorsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;

  span {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
  }
`;
export const TotalRaisedWrapper = styled.div`
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;
`;
export const LastFundingWrapper = styled.div`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const TypeWrapper = styled.div`
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;
`;
export const RedFlagsWrapper = styled.div``;
export const RatingWrapper = styled.div`
  display: flex;
  gap: 6px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const ResultItem = styled(Typography)<{ amount?: number }>`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;

  span {
    color: ${({ amount }) =>
      amount || 0 < 1
        ? "var(--color-danger)"
        : amount || (0 > 1 && amount) || 0 < 2
          ? "var(--color-text-primary)"
          : "var(--color-primary)"};
    font-weight: var(--font-weight-semibold);
  }
`;

export const CardNumber = styled.div`
  color: var(--color-text-primary);
  font-size: 12px;
`;

export const ExchangeBody = styled.div`
  overflow-x: auto;
`;

export const StatisticsCardsWrapper = styled.div`
  h2 {
    margin-top: 30px;
    margin-bottom: 20px;
    font-weight: var(--font-weight-semibold);

    &:first-child{
      margin-top: 0px;
    }
  }

  @media (max-width: 768px) {
    h2 {
      margin-top: 20px;
    }
  }
`;

export const StatisticsCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

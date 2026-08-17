import styled from "styled-components";
import BaseCard from "../../../common/BaseCard";
import Typography from "../../../common/Typography";

export const TableWrapper = styled.div`
  width: 1200px;
  overflow-x: auto;
`;
export const CardsWrapper = styled.div`
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
export const CardWrapper = styled(BaseCard)`
  width: 1190px;
  align-items: center;
  display: flex;
  padding: 16px;
  cursor: pointer;
`;
export const ProjectWrapper = styled.div`
  width: 202px;
  display: flex;
  align-items: center;
  gap: 10px;
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
  max-width: 112px;
`;
export const ProjectDescription = styled(Typography)`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  width: 143px;
`;
export const StatusWrapper = styled.div`
  width: 74px;
`;
export const InvestorsWrapper = styled.div`
  width: 185px;
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
  width: 122px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const LastFundingWrapper = styled.div`
  width: 121px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const TypeWrapper = styled.div`
  width: 290px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const RedFlagsWrapper = styled.div`
  width: 70px;
`;
export const RatingWrapper = styled.div`
  display: flex;
  align-items: center;
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

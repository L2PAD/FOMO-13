import styled from "styled-components";
import BaseCard from "../../../common/BaseCard";
import Typography from "../../../common/Typography";

export const TableWrapper = styled.div`
  overflow-x: auto;
  margin-right: 10px;
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
  width: 70px;
`;
export const InvestorsWrapper = styled.div`
  width: 254px;
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
  width: 92px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const LastFundingWrapper = styled.div`
  width: 109px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const TypeWrapper = styled.div`
  width: 70px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const ResultsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  width: 179px;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);
`;
export const TagWrapper = styled.div`
  display: flex;
  width: 217px;
  gap: 4px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
`;
export const TagCircle = styled.div`
  width: 16px;
  height: 16px;
  background: rgba(115, 128, 148, 0.5);
  border-radius: 8px;
`;
export const RedFlagsWrapper = styled.div`
  width: 52px;
`;
export const RatingWrapper = styled.div`
  width: 80px;
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

import styled from "styled-components";
import Link from "next/link";
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
  width: 1190px !important;
  padding: 16px;
`;

export const CardContentWrapper = styled.div`
  width: 100%;
  align-items: center;
  display: flex;
`;

export const ProjectWrapper = styled(Link)`
  width: 200px;
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
  width: 92px;
`;
export const InvestorsWrapper = styled.div`
  width: 247px;
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
  width: 238px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const TypeWrapper = styled.div`
  width: 100px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
export const RedFlagsWrapper = styled.div`
  width: 68px;
`;
export const RatingWrapper = styled.div`
  width: 125px;
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

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
`;

export const ArrowButton = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  margin-top: -5px;
  margin-left: 10px;
  width: 24px;
  height: 24px;

  svg {
    font-size: 0 !important;
    width: 24px;
    height: 24px;
  }
`;

export const RendererContentWrapper = styled.div`
  border-top: 2px solid #f8f8f9;
  margin-top: 16px;
  padding-top: 16px;
`;

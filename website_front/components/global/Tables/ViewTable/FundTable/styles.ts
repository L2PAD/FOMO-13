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
  width: 317px;
  display: flex;
  align-items: center;
  gap: 10px;

  span {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
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
  max-width: 143px;
`;
export const ProjectDescription = styled(Typography)`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  width: 143px;
`;
export const FundsWrapper = styled.div`
  width: 267px;
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
export const RedFlagsWrapper = styled.div`
  width: 110px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: #40a584;
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
export const ATHRoiWrapper = styled(Typography)<{ more: boolean }>`
  width: 150px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: ${({ more }) => (more ? "#40A584" : "#E42736")};
`;
export const CurrentRoiWrapper = styled(Typography)<{ more: boolean }>`
  width: 243px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: ${({ more }) => (more ? "#40A584" : "#E42736")};
`;

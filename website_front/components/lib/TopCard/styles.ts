import styled from "styled-components";
import BaseCard from "../../global/common/BaseCard";
import Typography from "../../global/common/Typography";

export const CardsWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: scroll;
  padding-bottom: 5px;
`;

export const CardWrapper = styled(BaseCard)`
  width: 289px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 4px 4px 0px #eeeeee;
  height: 260px;
`;

export const ItemsWrapper = styled.div`
  overflow-y: auto;
  height: 212px;
`;

export const DataTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  overflow: visible !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

export const ProjectWrapper = styled.div`
  width: 200px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  margin-bottom: 4px;
`;

export const CardIem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  cursor: pointer;
`;

export const ProjectTitleWrapper = styled.div`
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

export const ProjectInfo = styled(Typography)`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  max-width: 143px;
  color: var(--color-text-muted);
`;

export const Value = styled.div<{ variant: "default" | "green" | "red" }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  text-align: right;
  white-space: nowrap;
  color: ${({ variant }) =>
    variant === "default"
      ? "var(--color-text-primary)"
      : variant === "green"
        ? "var(--color-primary)"
        : "var(--color-danger)"};

  @media (max-width: 768px) {
    font-size: 15px;
    line-height: 18px;
    gap: 3px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 17px;
    gap: 2px;
    text-align: left;
  }
`;

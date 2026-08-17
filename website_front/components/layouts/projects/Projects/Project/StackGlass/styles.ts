import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import Typography from "../../../../../global/common/Typography";

export const CardsWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 40px;
  padding-bottom: 5px;
`;

export const CardWrapper = styled(BaseCard)`
  min-width: 289px;
  padding: 20px 16px;
  display: flex;
  gap: 0px;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 4px 4px 0px #eeeeee;
  height: 375px;
`;

export const Separator = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  gap: 5px;
  display: flex;

  span {
    gap: 5px;
    display: flex;
    color: var(--color-text-muted);
    font-size: 12px;
  }
`;

export const DataTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  justify-content: space-between;
  gap: 10px;
  display: flex;

  span {
    gap: 10px;
    display: flex;
    color: var(--color-text-muted);
    font-size: 14px;
  }
`;

export const Header = styled.div`
  background: #f8f8f9;
  margin-left: -16px;
  margin-right: -16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 10px;
  text-align: center;
`;

export const ProjectWrapper = styled.div`
  width: 200px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const CardIem = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  font-size: 12px;
`;

export const ItemsWrapper = styled.div`
  height: 135px;
  overflow-y: auto;
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
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 19px;
  white-space: nowrap;
  color: ${({ variant }) =>
    variant === "default"
      ? "var(--color-text-primary)"
      : variant === "green"
        ? "var(--color-primary)"
        : "var(--color-danger)"};
`;

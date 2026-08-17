import styled from "styled-components";
import Typography from "../../../../../global/common/Typography";

export const CardsWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 40px;
  overflow-x: scroll;
  padding-bottom: 5px;
`;

export const CardWrapper = styled.div`
  width: 289px;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 10px;
`;

export const DataTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
`;

export const ProjectWrapper = styled.div`
  width: 200px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const CardIem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
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
`;

export const Button = styled.div<{ variant: "default" | "green" | "red" }>`
  width: 100%;
  height: 48px;
  border-radius: 8px;
  background: ${({ variant }) =>
    variant === "default"
      ? "var(--color-text-primary)"
      : variant === "green"
        ? "var(--color-primary)"
        : "var(--color-danger)"};
  color: var(--color-white);
  font-family: "Gilroy";
  font-style: normal;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

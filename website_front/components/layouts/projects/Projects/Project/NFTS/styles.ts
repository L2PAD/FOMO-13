import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const CardWrapper = styled(BaseCard)`
  width: calc(100% - 4px);
  padding-bottom: 0;
  margin-bottom: 4px;
`;

export const TableHeader = styled.div`
  margin-top: -20px;
  margin-left: -16px;
  margin-right: -16px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 10px;
  background: #f8f8f9;
  border-bottom: 2px solid #f8f8f9;
  min-width: 990px;

  p {
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    font-weight: var(--font-weight-medium);
    gap: 5px;
    width: 150px;
  }

  div {
    display: flex;
    gap: 10px;
    align-items: center;
    cursor: pointer;
  }

  small {
    display: block;
    transform: rotate(90deg);
    width: 8px;
    height: 8px;
    font-size: 8px;
  }
`;

export const GraphicItemData = styled.div<{
  variant: "default" | "green" | "red" | "bold";
}>`
  color: ${({ variant }) =>
    variant === "red"
      ? "var(--color-danger)"
      : variant === "green"
        ? "var(--color-primary)"
        : "var(--color-text-primary)"};
  font-weight: ${({ variant }) => (variant === "default" ? "normal" : "bold")};
  display: flex;
  gap: 5px;
  width: 150px;

  button svg {
    width: 20px;
    height: 20px;
  }
`;

export const ProjectWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-right: 27px;
  width: 150px;
`;

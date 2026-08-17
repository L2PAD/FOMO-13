import styled from "styled-components";
import BaseCard from "../../../../../../global/common/BaseCard";
import Link from "next/link";

export const BidsItem = styled.div`
  p {
    display: flex;
    gap: 5px;
  }
`;

export const CardWrapper = styled(BaseCard)`
  width: calc(100% - 4px);
  padding-bottom: 0;
  margin-bottom: 4px;
`;

export const Colored = styled.div<{
  variant: "default" | "green" | "red" | "gray";
}>`
  color: ${({ variant }) =>
    variant === "red"
      ? "var(--color-danger)"
      : variant === "green"
        ? "var(--color-primary)"
        : variant === "gray"
          ? "var(--color-text-muted)"
          : "var(--color-text-primary)"};
`;

export const GraphicItemsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
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

  p {
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    font-weight: var(--font-weight-medium);
    gap: 5px;
    width: 200px;
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

export const TableItem = styled.div<{ count?: number }>`
  display: grid;
  grid-auto-flow: column;
  padding: 10px;
  margin-left: -16px;
  margin-right: -16px;
  grid-template-columns: repeat(${({ count }) => count || 6}, 1fr);

  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
  }
`;
export const ConfirmOrder = styled.div`
  margin-left: auto;
  margin-right: 20px;
`;

import styled from "styled-components";

export const ButtonWrapper = styled.button<{
  variant: "primary" | "secondary" | "outlined" | "bordered";
  big: boolean;
  disabled?: boolean;
}>`
  border: ${({ variant }) =>
    variant === "secondary"
      ? "none"
      : variant === "bordered"
        ? "1px solid rgba(83, 98, 124, 0.07)"
        : "1px solid var(--color-primary)"};
  display: flex;
  justify-content: ${({ big }) => (big ? "space-between" : "center")};
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: ${({ big }) => (big ? "20px 16px" : "8px")};
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  transition: 0.5s;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
  &:disabled {
    cursor: not-allowed;
    background: ${({ variant }) =>
      variant === "primary"
        ? "var(--color-primary)"
        : variant === "outlined"
          ? "white"
          : "none"};
  }
  &.red-btn {
    border-color: var(--color-danger);
    background: var(--color-danger);
    color: white;
    &:hover {
      border-color: var(--color-danger);
      background: var(--color-danger);
      color: white;
    }
  }
`;

export const LabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

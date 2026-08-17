import styled from "styled-components";

export const ButtonWrapper = styled.button<{
  variant: "confirm" | "reject";
  big: boolean;
  disabled?: boolean;
}>`
  padding: 6.5px 8px;
  color: ${({ variant }) => (variant === "confirm" ? "var(--color-primary)" : "var(--color-danger)")};
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  box-shadow: 2px 2px 0px 0px #eeeeee;

  transition: all 0.3s ease;
  &:hover {
    color: ${({ variant }) => (variant === "confirm" ? "#00A07F" : "#E42736")};
    border: 1px solid #e4e4e4;
  }
  &:active {
    box-shadow: 1px 1px 0px 0px #c6c6c6;
    border: 1px solid #f3f4f6;
  }
  &:disabled {
    color: ${({ variant }) => (variant === "confirm" ? "var(--color-primary)" : "var(--color-danger)")};
    border: 1px solid #f3f4f6;
    box-shadow: 2px 2px 0px 0px #eeeeee;
    color: #a0a0a0;
    cursor: not-allowed;
  }
`;

export const LabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
/* background: ${({variant}) => }; */

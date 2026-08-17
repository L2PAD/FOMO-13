import styled from "styled-components";
import { ButtonVariants } from ".";

export const ButtonWrapper = styled.button<{
  variant: ButtonVariants;
  big: boolean;
  disabled?: boolean;
}>`
  border: ${({ variant }) =>
    variant === "secondary" || variant === "main"
      ? "none"
      : variant === "bordered"
        ? "1px solid rgba(83, 98, 124, 0.07)"
        : "1px solid var(--color-primary)"};
  display: flex;
  justify-content: ${({ big }) => (big ? "space-between" : "center")};
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  padding: ${({ big, variant }) =>
    big ? "20px 16px" : variant === "main" ? "8px 13px" : "8px"};
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ variant }) =>
    variant === "primary" || variant === "main"
      ? "white"
      : variant === "outlined"
        ? "var(--color-primary)"
        : variant === "bordered"
          ? "var(--color-text-primary)"
          : "var(--color-primary)"};
  background: ${({ variant }) =>
    variant === "primary" || variant === "main"
      ? "var(--color-primary)"
      : variant === "outlined"
        ? "white"
        : "none"};
  transition: 0.5s;
  box-shadow: ${({ variant }) =>
    variant === "main" ? "1px 1px 4px 0px #00504040" : "none"};
  cursor: pointer;

  &:hover {
    color: ${({ variant }) =>
    variant === "primary" || variant === "main"
      ? "white"
      : variant === "outlined"
        ? "white"
        : variant === "bordered"
          ? "var(--color-text-primary)"
          : "var(--color-primary)"};
    background: ${({ variant }) =>
    variant === "primary" || variant === "main"
      ? "rgb(3, 131, 105)"
      : variant === "outlined"
        ? "var(--color-primary)"
        : "none"};
  }

  &:active {
    color: ${({ variant }) =>
    variant === "primary" || variant === "main"
      ? "white"
      : variant === "outlined"
        ? "white"
        : variant === "bordered"
          ? "var(--color-text-primary)"
          : "var(--color-primary)"};
    background: ${({ variant }) =>
    variant === "primary" || variant === "main"
      ? "rgb(3, 108, 87)"
      : variant === "outlined"
        ? "var(--color-primary)"
        : "none"};
  }

  &.contact-btn {
    height: 35px;
    border-radius: 4px;
  }

  &.contact-btn path {
    transition: stroke 0.3s ease;
  }

  &.contact-btn:hover {
    & path {
      stroke: white;
    }
  }

  &.red-btn {
    border-color: var(--color-danger);
    background: var(--color-danger);
    color: white;
    &:hover {
      opacity: 0.7;
    }
  }

  &.outlined-default {
    & {
      height: 35px;
      border-radius: 4px;
    }

    &.path {
      transition: stroke 0.3s ease;
    }

    &:hover {
      border: 1px solid #39816a !important;
      color: #39816a !important;
      background: white;
      path {
        stroke: #39816a !important;
      }
    }

    &:active {
      border: 1px solid #2e6a58 !important;
      color: #2e6a58 !important;
      background: white;

      path {
        stroke: #2e6a58 !important;
      }
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    color: ${({ variant }) =>
    variant === "primary"
      ? "white"
      : variant === "outlined"
        ? "var(--color-primary)"
        : variant === "bordered"
          ? "var(--color-text-primary)"
          : "var(--color-primary)"};
    background: ${({ variant }) =>
    variant === "primary"
      ? "var(--color-primary)"
      : variant === "outlined"
        ? "white"
        : "none"};
  }
`;

export const LabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

import styled from "styled-components";
import { BaseCardVariant } from ".";

interface Props {
  variant: BaseCardVariant;
}

const getColor = (variant: BaseCardVariant) => {
  switch (variant) {
    case "default":
      return "#EEEEEE";
    case "warn":
      return "#FFC3C3";
    case "success":
      return "var(--color-primary)80";
    default:
      return "#EEEEEE";
  }
};

export const BaseCardWrapper = styled.div<Props>`
  padding: ${({ variant }) => (variant === "main" ? "20px" : "20px 16px")};
  border-radius: ${({ variant }) => (variant === "main" ? "16px" : "8px")};
  border: ${({ variant }) =>
    variant !== "main"
      ? "1px solid rgba(83, 98, 124, 0.07)"
      : "1px solid var(--Stroke, #F0F2F5)"};
  box-shadow: ${({ variant }) =>
    variant !== "main"
      ? `4px 4px 0px ${getColor(variant)}`
      : "rgba(0, 5, 48, 0.08) 2px 2px 8px 0px"};
  transition: all 0.3s ease;
  background: ${({ variant }) => (variant === "main" ? "var(--color-white)" : "transparent")};

  &.shadow-card {
    background: var(--color-white);
    border: 1px solid var(--Stroke, #F0F2F5);
    box-shadow: 2px 2px 8px 0px #00053014;
  }

  @media (max-width: 900px) {
    padding: ${({ variant }) => (variant === "main" ? "16px" : "16px 14px")};
    border-radius: ${({ variant }) => (variant === "main" ? "14px" : "8px")};
    box-shadow: ${({ variant }) =>
      variant !== "main" ? `3px 3px 0px ${getColor(variant)}` : ""};
    height: fit-content;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: ${({ variant }) => (variant === "main" ? "12px" : "6px")};
    box-shadow: ${({ variant }) =>
      variant !== "main" ? `2px 2px 0px ${getColor(variant)}` : ""};
  }
`;

export const BaseCardCryptoWrapper = styled.div<Props>`
  padding: ${({ variant }) => (variant === "main" ? "20px" : "20px 16px")};
  border-radius: 8px;
  border-top: 1px solid #e5e5e5;
  transition: all 0.3s ease;

  &.shadow-card {
    background: var(--color-white);
    border: 1px solid var(--Stroke, #F0F2F5);
    box-shadow: 2px 2px 8px 0px #00053014;
  }

  &:hover {
    background-color: var(--input-hover);

  }

  &:active {
    background: var(--input-active);
  }

  /* Tablet */
  @media (max-width: 900px) {
    padding: ${({ variant }) => (variant === "main" ? "16px" : "16px 14px")};
    border-radius: 8px;
  }

  /* Mobile */
  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 6px;
  }
`;

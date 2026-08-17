import styled, { keyframes } from "styled-components";
import { AvatartSize, AvatarVariants } from ".";

const getSize = (size: AvatartSize) => {
  switch (size) {
    case "project":
      return "84px";
    case "xSmall":
      return "22px";
    case "xxSmall":
      return "18px";
    case "small":
      return "32px";
    case "otc":
      return "40px";
    case "medium":
      return "60px";
    case "project-page":
      return "72px";
    case "big":
      return "80px";
    case "giant":
      return "120px";
    default:
      return "20px";
  }
};

const getColor = (variant: AvatarVariants) => {
  switch (variant) {
    case "default":
      return "white";
    case "warn":
      return "var(--color-warning)";
    case "success":
      return "var(--color-primary)";
    case "error":
      return "var(--color-danger)";
    case "spotlight":
      return "var(--color-info)";
    case "none":
      return "transparent";
    default:
      return "transparent";
  }
};

const getBorder = (
  size:
    | "xSmall"
    | "small"
    | "medium"
    | "big"
    | "giant"
    | "project"
    | "otc"
    | "project-page"
    | "xxSmall"
) => {
  switch (size) {
    case "project":
      return 0;
    case "xSmall":
      return 2;
    case "small":
      return 1;
    case "medium":
      return 2;
    case "big":
      return 3;
    case "project-page":
      return 4;
    case "giant":
      return 3;
    case "otc":
      return 2;
    default:
      return 1;
  }
};

export const AvatarWrapper = styled.div<{
  size:
    | "xSmall"
    | "small"
    | "medium"
    | "big"
    | "giant"
    | "project"
    | "otc"
    | "project-page"
    | "xxSmall";
}>`
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;

  img {
    object-fit: cover;
    width: ${({ size }) => getSize(size)};
    height: ${({ size }) => getSize(size)};
  }

  @media (max-width: 768px) {
    &.project-page {
      width: 40px;
      height: 40px;

      & > img {
        width: 40px;
        height: 40px;
      }
    }
  }
`;

export const Avatar = styled.img<{
  size:
    | "xSmall"
    | "small"
    | "medium"
    | "big"
    | "giant"
    | "project"
    | "otc"
    | "project-page"
    | "xxSmall";
  variant: AvatarVariants;
}>`
  width: 100%;
  border: ${({ size, variant }) =>
    ` ${getBorder(size)}px solid ${getColor(variant)} `};
  border-radius: ${({ size, variant }) =>
    size === "project" ? "16px" : "100px"};
`;

export const RatingWrapper = styled.span<{
  size:
    | "xSmall"
    | "small"
    | "medium"
    | "big"
    | "giant"
    | "project"
    | "otc"
    | "spotlight"
    | "project-page"
    | "xxSmall";
  variant: AvatarVariants;
}>`
  position: absolute;
  font-size: ${({ size }) => (size === "giant" ? "19px" : "10px")};
  font-weight: var(--font-weight-semibold);
  line-height: 17px;
  color: white !important;
  background: ${({ variant }) => getColor(variant)};
  border-radius: 99px;
  width: ${({ size }) => (size === "giant" ? 32 : 20)}px;
  height: ${({ size }) => (size === "giant" ? 32 : 20)}px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  top: -3px;
  right: ${({ size }) => (size === "giant" ? -4 : -4)}px;
`;

export const RightIconWrapper = styled.div`
  position: absolute;
  top: -1px;
  right: -1px;
`;

export const AnimatedWrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  right: 0;

  & .rating-wrapper {
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
    transform: ${({ isVisible }) =>
      isVisible ? "translateX(0px)" : "translateX(-20px)"};
    transition: all 0.3s ease;
  }

  & .sponsored-icon-wrapper {
    opacity: ${({ isVisible }) => (isVisible ? 0 : 1)};
    transform: ${({ isVisible }) =>
      isVisible ? "translateX(20px)" : "translateX(0px)"};
    transition: all 0.3s ease;

    &.project-page svg {
      width: 20px;
      height: 20px;
    }
  }
`;

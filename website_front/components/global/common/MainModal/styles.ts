import styled from "styled-components";

export type ModalVariant =
  | "small"
  | "medium"
  | "big"
  | "small-medium"
  | "cart"
  | "deal"
  | "filter"
  | "820"
  | "650";

interface Props {
  variant: ModalVariant;
}

const getSize = ({ variant }: Props) => {
  switch (variant) {
    case "small":
      return 362;
    case "cart":
      return 400;
    case "deal":
      return 480;
    case "filter":
      return 1400;
    case "medium":
      return 580;
    case "big":
      return 800;
    case "820":
      return 800;
    case "small-medium":
      return 440;
    case "650":
      return 650;
    default:
      return 360;
  }
};

export const ModalWrapper = styled.div<{
  isVisible: boolean;
  $isFirstRender?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10000;

  opacity: ${({ isVisible, $isFirstRender }) => {
    if ($isFirstRender) return 0;
    return isVisible ? 1 : 0;
  }};

  visibility: ${({ isVisible, $isFirstRender }) => {
    if ($isFirstRender) return "hidden";
    return isVisible ? "visible" : "hidden";
  }};

  pointer-events: ${({ isVisible, $isFirstRender }) => {
    if ($isFirstRender) return "none";
    return isVisible ? "auto" : "none";
  }};

  transition: ${({ $isFirstRender }) =>
    $isFirstRender ? "none" : "opacity 0.3s ease, visibility 0.3s ease"};

  &.share-modal .internal-wrapper {
    padding: 40px;
  }

  &.chat .header-wrapper {
    position: absolute;
  }

  &.fullscreen-modal {
    .modal-style {
      width: 100vw !important;
      height: 100vh !important;
      max-height: 100%;
      margin: 0 !important;
      padding: 0 !important;
      border-radius: 0 !important;
      overflow: hidden;
    }
    .content{
      overflow: hidden;
    }
    .header-wrapper {
      display: none;
    }
  }

  @media (max-width: 768px) {
    &.share-modal .internal-wrapper {
      padding: 16px;
    }
    & .internal-wrapper {
      padding: 16px;
    }

    &.universal-filter-modal {
      align-items: flex-end;
      height: 100dvh;

      .modal-style {
        width: 100% !important;
        height: calc(100vh - 8px);
        height: calc(100dvh - 8px);
        max-height: calc(100vh - 8px);
        max-height: calc(100dvh - 8px);
        margin: 0 !important;
        border-radius: 16px 16px 0 0;
        overflow: hidden;
      }

      .internal-wrapper {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .header-wrapper {
        flex: 0 0 auto;
      }

      .content {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-bottom: max(12px, env(safe-area-inset-bottom));
      }
    }
  }

  &.compare-modal {
    .modal-style {
      max-width: 821px !important;
      width: 100% !important;
    }
  }

  &.share-modal .main-modal-description {
    max-width: 260px;
    padding: 10px;
    div {
      font-size: 14px;
      line-height: 17px;
      color: var(--main-gray);
    }

    @media (max-width: 768px) {
      max-width: 100%;
      padding: 8px 0;
      div {
        font-size: 13px;
        line-height: 16px;
      }
    }
  }

  &.tabhub-modal {
    @media (max-width: 768px) {
      .main-modal-description {
        max-width: 100%;
      }
    }
  }

  & .custom-title {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
    color: var(--main-black);

    &.portfolio-title {
      @media (max-width: 768px) {
        font-size: 20px;
        line-height: 24px;
      }
    }
  }

  & .custom-project {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 5px;

    img {
      width: 30px;
      height: 30px;
      object-fit: cover;
      border-radius: 50%;
    }
  }

  & .custom-subtitle {
    font-weight: var(--font-weight-regular);
    font-size: 24px;
    line-height: 100%;
    color: var(--main-gray);
  }

  & .steps-title {
    width: 100%;
  }

  &.chat .internal-wrapper {
    padding: 0px;
  }
  &.p2p-buy-modal {
    &.chat-expanded {
      .modal-style {
        width: 1060px !important;

        .header-wrapper {
          justify-content: flex-start;
          gap: 140px;
        }
      }
    }

    .modal-style {
      width: 400px;
      position: relative;
      border: none;

      .internal-wrapper {
        padding: 40px;
      }

      @media (max-width: 768px) {
        .internal-wrapper {
          padding: 20px;
        }
      }
    }
  }

  &.payment-method-modal {
    .internal-wrapper {
      padding: 24px;
    }
  }
`;

export const Overlay = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.5);
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const ModalStyle = styled.div<{
  variant: ModalVariant;
  isVisible: boolean;
  $isFirstRender?: boolean;
}>`
  width: ${({ variant }) => getSize({ variant })}px !important;
  box-sizing: border-box;
  background: white;
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 2px 2px 8px 0px #00053014;
  border-radius: 12px;
  height: max-content;
  max-height: calc(100vh - 32px);
  z-index: 999999;
  margin: 15px !important;
  overflow: auto;

  opacity: ${({ $isFirstRender }) => ($isFirstRender ? 0 : 1)};
  transform: ${({ $isFirstRender, isVisible }) => {
    if ($isFirstRender) return "translateY(20px)";
    return isVisible ? "translateY(0px)" : "translateY(20px)";
  }};

  transition: ${({ $isFirstRender }) =>
    $isFirstRender ? "none" : "transform 0.3s ease, opacity 0.3s ease"};

  @media (max-width: 900px) {
    width: ${({ variant }) =>
      variant === "big" ? "100%" : getSize({ variant })}px !important;
  }

  @media (max-width: 600px) {
    width: ${({ variant }) =>
      variant !== "small" || "small-medium"
        ? "100%"
        : getSize({ variant })}px !important;
  }

  @media (max-width: 460px) {
    width: 100% !important;
  }
`;

export const InternalWrapper = styled.div`
  padding: 40px;
`;

export const HeaderWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;

  button {
    background: transparent !important;
  }

  & .arrow-back {
    margin-right: 20px;

    &:hover {
      opacity: 0.8;
    }

    &:active {
      opacity: 0.6;
    }
  }
`;

export const Title = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  margin: 0;
  padding: 0;

  display: flex;
  align-items: center;
  gap: 6px;

  button {
    margin-top: 5px;
  }
`;

export const DescriptionWrapper = styled.div``;

export const CustomTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

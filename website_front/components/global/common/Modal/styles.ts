import styled from "styled-components";

export type ModalVariant =
  | "small"
  | "medium"
  | "big"
  | "small-medium"
  | "cart"
  | "deal"
  | "filter"
  | "610";

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
      return 1120;
    case "medium":
      return 580;
    case "610":
      return 610;
    case "big":
      return 800;
    case "small-medium":
      return 440;
    default:
      return 360;
  }
};

export const ModalWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10000;

  input::placeholder {
    color: var(--color-text-soft);
    font-weight: var(--font-weight-regular);
  }

  &.p2p-buy-modal {
    &.chat-expanded {
      .modal-style {
        max-width: 1060px;
        width: 100%;

        .header-wrapper {
          justify-content: flex-start;
          gap: 140px;
        }
      }
    }

    .modal-style {
      max-width: 400px;
      position: relative;
      border: none;

      .internal-wrapper {
        padding: 40px;
      }
    }
  }
  &.deposit-modal {
    & .internal-wrapper {
      padding: 24px;
      position: relative;
    }
    & .header-wrapper {
      padding-bottom: 20px;
    }
    & .modal-style {
      box-shadow: 2px 2px 8px 2px #00053014;
      max-width: 400px;
    }
  }

  &.cart-modal {
    & .modal-title {
      font-weight: var(--font-weight-medium);
    }

    & .internal-wrapper {
      padding: 0px;
      padding-top: 24px;
    }
    & .header-wrapper {
      margin-left: 24px;
      margin-right: 20px;
    }
    & .modal-style {
      box-shadow: 2px 2px 8px 2px #00053014;
    }
    &.cart-modal {
      .header-wrapper {
        margin: 0;
      }
      .modal-title {
        font-weight: var(--font-weight-semibold);
        font-size: 24px;
      }
      .modal-style {
        max-width: 800px;
        width: 100%;
      }
      .internal-wrapper {
        padding: 24px 24px 40px 24px;
      }
    }
    @media (max-width: 768px) {
      .internal-wrapper {
        padding: 16px;
      }
    }
  }

  &.deal-modal {
    & .internal-wrapper {
      padding: 22px;
    }
    & .header-wrapper {
    }
    & .modal-style {
      box-shadow: 2px 2px 8px 2px #00053014;
    }
  }

  &.filter-modal {
    &.collection {
      .modal-style {
        max-width: 500px;

        .checkboxes {
          gap: 12px;
        }
      }
    }

    & .internal-wrapper {
      padding: 22px;
    }
    & .header-wrapper {
      padding-bottom: 32px;

      button {
        transform: translateY(8px);
      }
    }
    & .modal-style {
      box-shadow: 2px 2px 8px 2px #00053014;
    }

    &.small .header-wrapper {
      button {
        transform: translate(15px, 2px);
      }
    }
  }

  &.creating_project_modal {
    & .internal-wrapper {
      padding: 40px;
    }
  }
`;

export const Overlay = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.5);
  width: 100vw;
  height: 100vh;
  z-index: 9999;
`;

export const ModalStyle = styled.div<{ variant: ModalVariant }>`
  width: ${({ variant }) => getSize({ variant })}px;
  box-sizing: border-box;
  background: white;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  height: max-content;
  max-height: calc(100vh - 32px);
  z-index: 999999;
  margin: 15px;
  overflow: auto;

  @media (max-width: 900px) {
    width: ${({ variant }) =>
      variant === "big" ? "100%" : getSize({ variant })}px;
  }

  @media (max-width: 600px) {
    width: ${({ variant }) =>
      variant !== "small" || "small-medium" ? "100%" : getSize({ variant })}px;
  }

  @media (max-width: 460px) {
    width: 100% !important;
  }
`;

export const InternalWrapper = styled.div`
  padding: 16px;

  &.internal-wrapper {
    padding: 40px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    & .back-btn {
      transform: rotate(180deg);
    }
  }
`;

export const Title = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  margin: 0;
  padding: 0;
`;

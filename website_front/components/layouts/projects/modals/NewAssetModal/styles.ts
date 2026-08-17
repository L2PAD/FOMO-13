import styled from "styled-components";
import Modal from "../../../../global/common/Modal";

export const ModalWrapper = styled(Modal)`
  & > div:last-child {
    width: 360px !important;
    position: relative;
  }

  @media (max-width: 360px) {
    & > div:last-child {
      width: 100% !important;
    }
  }
`;

export const HeaderWrapper = styled.div`
  position: absolute;
  top: 26px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 4px;

  button {
    padding: 0;
    border: none;
    background: none;
  }

  svg {
    transform: rotate(180deg);
    width: 24px;
    height: 24px;
  }
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
    color: var(--color-text-primary);
  }
`;

import styled from "styled-components";
import Modal from "../../../../global/common/Modal";
import { Wrapper } from "../../../../global/RewardCard/styles";

export const ModalWrapper = styled(Modal)`
  & > div:last-child {
    width: 526px !important;
  }

  @media (max-width: 530px) {
    & > div:last-child {
      width: 100% !important;
    }
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  gap: 37px;
  justify-content: space-between;
  position: relative;
  margin-bottom: 24px;
  margin-top: 17px;

  @media (max-width: 530px) {
    flex-direction: column;
  }
`;

export const CardWrapper = styled(Wrapper)`
  width: 228px !important;

  @media (max-width: 530px) {
    width: 100% !important;
  }
`;

export const MiddleIcon = styled.div`
  width: 80px;
  height: 80px;
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0 #eeeeee;
  border-radius: 99px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 42%;
  top: 32%;

  svg {
    width: 24px;
    height: 24px;
  }

  @media (max-width: 530px) {
    top: 44%;
  }
`;

export const SubmitButton = styled.button`
  background: var(--color-primary-soft);
  border-radius: 8px;
  width: 100%;
  border: none;
  padding: 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  text-align: center;
  color: var(--color-primary);
  transition: 0.3s;

  &:hover {
    background: rgba(4, 165, 132, 0.15);
  }
`;

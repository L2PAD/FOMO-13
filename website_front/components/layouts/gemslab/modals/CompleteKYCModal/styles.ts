import styled from "styled-components";
import { CheckIcon } from "../../../../global/Icons";
import Modal from "../../../../global/common/Modal";

export const ActionName = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
`;

export const ActionTimer = styled.div`
  margin-top: 5px;
  margin-bottom: 20px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
`;

export const ActionsListWrapper = styled.div`
  background: #f8f8f9;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 8px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 18px;
    color: var(--color-text-muted);
  }
`;

export const ActionsListItem = styled.div`
  display: flex;
  padding-left: 24px;
  position: relative;

  div {
    width: 4px;
    height: 4px;
    background: var(--color-text-muted);
    border-radius: 100%;
    margin-top: 7px;
    position: absolute;
    left: 8px;
    top: 0;
  }
`;

export const ModalWrapper = styled(Modal)`
  & > div > div > div:first-child {
    display: none;
  }
`;

export const VerifyImage = styled(CheckIcon)`
  width: 80px;
  height: 80px;
  margin-bottom: 13px;
  margin-top: 28px;
`;

export const ActionButton = styled.button`
  margin-top: 24px;
  background: var(--color-primary);
  border-radius: 8px;
  padding: 13px;
  width: 100%;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  border: none;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

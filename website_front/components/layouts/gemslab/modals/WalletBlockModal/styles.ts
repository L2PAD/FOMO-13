import styled from "styled-components";
import { LockIcon } from "../../../../global/Icons";
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

export const LockImage = styled(LockIcon)`
  width: 80px;
  height: 80px;
  margin-bottom: 13px;
`;

export const ModalWrapper = styled(Modal)`
  & > div > div > div:first-child {
    display: none;
  }
`;

export const ActionTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
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

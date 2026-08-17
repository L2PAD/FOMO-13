import styled from "styled-components";
import Modal from "../../../../global/common/Modal";

export const ActionName = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  text-align: center;
`;

export const ModalWrapper = styled(Modal)`
  & > div > div > div:first-child {
    display: none;
  }
`;

export const ActionButton = styled.button`
  border-radius: 8px;
  padding: 13px;
  width: 50%;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  border: none;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  transition: all 0.3s ease;

  &:hover{
    background: rgba(4, 165, 133, 0.18);
  }

`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ActionsWrapper = styled.div`
  display: flex;
  gap: 13px;
  width: 100%;
  margin-top: 24px;

  button{
    width: 50%;
  }
`;

export const ContactButton = styled.button`
  border: none;
  background: none;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
  width: 100%;
`;

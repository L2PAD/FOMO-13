import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background: var(--color-white);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
`;

export const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin: 0;
  text-align: center;
`;

export const ModalDescription = styled.p`
  font-size: 16px;
  color: #728094;
  text-align: center;
  margin: 16px 0 24px;
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DeleteButton = styled.button`
  width: 100%;
  padding: 14px;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e14f4f;
  }
`;

export const CancelButton = styled.button`
  width: 100%;
  padding: 14px;
  background: transparent;
  color: #1a1d26;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5fbfd;
  }
`;

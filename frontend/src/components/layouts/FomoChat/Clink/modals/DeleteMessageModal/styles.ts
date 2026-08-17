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

export const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f2f5;

  &:hover {
    background: #f5fbfd;
  }
`;

export const OptionRadio = styled.div<{ isSelected: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.isSelected ? "var(--color-primary)" : "#e0e0e0")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;

  .inner-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-primary);
    pointer-events: none;
  }
`;

export const OptionText = styled.span`
  font-size: 16px;
  color: #1a1d26;
  font-weight: var(--font-weight-regular);
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 4px;
`;

export const DeleteButton = styled.button`
  width: 100%;
  padding: 6px;
  background: transparent;
  color: var(--color-danger);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #fff5f5;
  }
`;

export const CancelButton = styled.button`
  width: 100%;
  padding: 6px;
  background: transparent;
  color: #1a1d26;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5fbfd;
  }
`;

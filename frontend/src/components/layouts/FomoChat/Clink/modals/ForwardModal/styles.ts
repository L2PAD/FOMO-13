import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  max-height: 90%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
`;

export const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin: 0;
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #728094;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: #1a1d26;
  }
`;

export const SearchInput = styled.div`
  padding: 0px 40px;
  width: 100%;
  position: relative;

  label {
    width: 100%;
  }

  span {
    position: absolute;
    left: 52px;
    top: 50%;
    z-index: 1;
    transform: translateY(-50%);
    font-size: 14px;
  }

  input {
    width: 100%;
    padding: 12px;
    padding-left: 40px;
    border: none;
    background: #f5f5f5;
    border-radius: 8px;
    font-size: 14px;

    &::placeholder {
      color: var(--color-text-soft);
    }
  }
`;

export const SelectedUsers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 40px;
`;

export const SelectedUserChip = styled.div`
  background: #f5fbfd;
  border-radius: 20px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1a1d26;

  button {
    background: transparent;
    border: none;
    color: #728094;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    margin: 0;

    &:hover {
      color: #1a1d26;
    }
  }
`;

export const SuggestedSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 40px;
`;

export const SuggestedTitle = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin: 0 0 16px 0;
`;

export const UsersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const UserRow = styled.div<{ isSelected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5fbfd;
  }

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: #1a1d26;
    margin: 0 0 4px 0;
  }

  span {
    font-weight: var(--font-weight-regular);
    font-size: 13px;
    color: #728094;
  }
`;

export const UserDataWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const UserCheckbox = styled.div<{ isChecked: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.isChecked ? "var(--color-primary)" : "#e0e0e0")};
  background: ${(props) => (props.isChecked ? "var(--color-primary)" : "transparent")};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
`;

export const SendButton = styled.button`
  width: calc(100% - 48px);
  margin: 16px 24px;
  padding: 14px;
  background: #28b2a1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1b9889;
  }

  &:disabled {
    background: #e0e0e0;
    cursor: not-allowed;
  }
`;

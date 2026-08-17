import styled from "styled-components";

export const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const DropdownButton = styled.button<{ isOpen?: boolean }>`
  width: 100%;
  padding: 6px 8px;
  background: var(--color-white);
  border: 1px solid
    ${(props) => (props.isOpen ? "var(--main-green)" : "#e0e0e0")};
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  max-height: 38px;
  min-height: 38px;
  gap: 8px;
  font-weight: var(--font-weight-medium);

  & .chevron {
    display: flex;
    margin-left: auto;
  }

  & .button-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-white);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  & .success-icon {
    display: flex;
    max-width: fit-content;
    margin-left: auto;
    svg {
      width: 24px;
      height: 24px;
    }
  }

  &:hover {
    border: 1px solid #adababff;
  }

  &.selected {
    border-color: var(--main-green);

    svg {
      color: var(--main-green);
    }
  }

  svg {
    flex-shrink: 0;
    color: var(--color-text-muted);
    margin-left: auto;
  }

  .tooltip-button {
    margin-top: 0;
    padding: 6px !important;
  }
`;

export const DropdownMenu = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-white);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 320px;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
  transform: translateY(${({ isVisible }) => (isVisible ? "0" : "-10px")});
  transition:
    opacity 0.2s ease-in-out,
    visibility 0.2s ease-in-out,
    transform 0.2s ease-in-out;
`;

export const SearchWrapper = styled.div`
  padding: 12px;
  border: 1px solid var(--color-surface-muted);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--color-text-primary);
  background: transparent;

  &::placeholder {
    color: #b0b0b0;
  }
`;

export const OptionsList = styled.div`
  overflow-y: auto;
  max-height: 256px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 3px;

    &:hover {
      background: #b0b0b0;
    }
  }
`;

export const OptionItem = styled.div<{ isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s;
  background: ${(props) => (props.isSelected ? "#f5fbfd" : "transparent")};

  &:hover {
    background: #f5f5f5;
  }
`;

export const Checkbox = styled.div<{ isChecked?: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${(props) => (props.isChecked ? "var(--color-primary)" : "#e0e0e0")};
  border-radius: 4px;
  background: ${(props) => (props.isChecked ? "var(--color-primary)" : "transparent")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
`;

export const OptionIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export const OptionText = styled.span`
  font-size: 14px;
  color: var(--color-text-primary);
  flex: 1;
`;

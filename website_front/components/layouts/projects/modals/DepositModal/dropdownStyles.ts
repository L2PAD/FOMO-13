import styled from "styled-components";

export const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const DropdownButton = styled.button<{ isOpen: boolean }>`
  width: 100%;
  padding: 6px 8px;
  background: var(--color-white);
  border: 1px solid ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "#E8E8E8")};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  font-family: inherit;
  min-height: 38px;
  transition: all 0.2s ease;

  & .success-icon {
    display: flex;
    svg{
      width: 24px;
      height: 24px;
  }
  }

  &:hover {
    border-color: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "#C4C4C4")};
  }

  &.selected{
    border-color:var(--main-green);
  }

  svg {
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
`;

export const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;


  &.empty{
    color: var(--main-gray);
  }
`;

export const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transform: ${({ isOpen }) =>
    isOpen ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(1)'};
  transition: 
    opacity 0.3s ease,
    transform 0.3s ease,
    max-height 0.3s ease;
  
  pointer-events: ${({ isOpen }) => (isOpen ? 'auto' : 'none')};
  max-height: ${({ isOpen }) => (isOpen ? '300px' : '0')};
`;

export const OptionsList = styled.div`
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-surface-muted);
  }

  &::-webkit-scrollbar-thumb {
    background: #e8e8e8;
    border-radius: 3px;

    &:hover {
      background: #d1d5db;
    }
  }
`;

export const OptionItem = styled.div<{ isSelected: boolean }>`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${({ isSelected }) =>
    isSelected ? "rgba(4, 165, 132, 0.05)" : "transparent"};

  &:hover {
    background: ${({ isSelected }) =>
    isSelected ? "var(--color-primary-soft)" : "var(--color-surface-muted)"};
  }
`;

export const OptionIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  background: transparent;

  img,
  svg {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
`;

export const OptionText = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  text-align: left;
  flex: 1;
`;

export const FeeText = styled.span`
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
`;

export const CheckMark = styled.div`
  color: var(--color-primary);
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  margin-left: auto;
`;

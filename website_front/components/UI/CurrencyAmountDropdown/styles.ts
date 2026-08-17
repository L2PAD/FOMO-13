import styled from "styled-components";

export const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  min-width: 295px;
`;

export const DropdownButton = styled.button<{ isOpen: boolean }>`
  width: 100%;
  padding: 12px;
  background: var(--color-white);
  border: 1px solid ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "#e8e8e8")};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  min-height: 38px;
  max-height: 38px;
    &:hover {
    border-color: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "#e8e8e8")};
  }
  
  &.success{
    border-color:var(--main-green);

    svg{
      color: var(--main-green);
    }
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
`;

export const AmountInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text-primary);
  min-width: 0;

  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
  }
`;

export const SelectedCurrency = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: var(--color-text-primary);
  }
`;

export const DropdownMenu = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  max-height: 400px;
  display: flex;
  flex-direction: column;
    
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  visibility: ${({ isVisible }) => (isVisible ? 'visible' : 'hidden')};
  transform: translateY(${({ isVisible }) => (isVisible ? '0' : '-10px')});
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
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text-primary);
  background: transparent;

  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
  }
`;

export const OptionsList = styled.div`
  overflow-y: auto;
  max-height: 320px;

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
  padding: 12px;
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

export const CurrencyIcon = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #ffbc00;
  flex-shrink: 0;
`;

export const CurrencyCode = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  flex: 1;
`;

export const CheckMark = styled.div`
  color: var(--color-primary);
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  margin-left: auto;
`;

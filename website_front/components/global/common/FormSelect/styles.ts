import styled from "styled-components";

export const SelectRoot = styled.label`
  display: block;
  position: relative;
  width: 100%;
`;

export const SelectLabel = styled.p`
  margin: 0 0 10px;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
`;

export const SelectButton = styled.button<{ isOpen: boolean }>`
  width: 100%;
  min-height: 36px;
  padding: 7px 12px;
  border: 1px solid ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "#e5e8ef")};
  border-radius: 8px;
  background: var(--color-white);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover,
  &:focus {
    border-color: var(--color-primary);
    outline: none;
  }

  svg {
    flex-shrink: 0;
  }
`;

export const DropdownList = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 14px);
  left: 0;
  right: 0;
  z-index: 20;
  display: ${({ isOpen }) => (isOpen ? "block" : "none")};
  max-height: 342px;
  overflow-y: auto;
  padding: 0;
  border-radius: 8px;
  background: var(--color-white);
  box-shadow: 2px 2px 8px 0 #00053014;

  &::-webkit-scrollbar {
    width: 0;
  }
`;

export const OptionButton = styled.button<{ isSelected: boolean }>`
  width: 100%;
  min-height: 34px;
  padding: 8px 12px;
  border: none;
  background: ${({ isSelected }) => (isSelected ? "#f5fbfd" : "var(--color-white)")};
  color: ${({ isSelected }) => (isSelected ? "var(--color-primary)" : "var(--color-text-primary)")};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f5fbfd;
    color: var(--color-primary);
  }
`;

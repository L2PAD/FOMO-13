import styled from "styled-components";

export const Container = styled.div`
  position: relative;
  width: fit-content;
  min-width: 70px;
`;

export const SelectButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 122px;
  gap: 8px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
  }

  ${({ isOpen }) =>
    isOpen &&
    `
    border-radius: 8px 8px 0 0;
    border-bottom: transparent;
  `}
`;

export const SelectedValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

export const Arrow = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;

  ${({ isOpen }) =>
    isOpen &&
    `
    transform: rotate(180deg);
  `}
`;

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% - 6px);
  left: 0;
  background: white;
  border: 1px solid #e8e8e8;
  border-top: transparent;
  border-radius: 0 0 8px 8px;
  padding: 4px;
  min-width: 100%;
  z-index: 1000;
  animation: slideDown 0.2s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const Option = styled.div<{ isSelected: boolean }>`
  padding: 8px 12px;
  font-size: 14px;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #f5fbfd;
    color: var(--color-primary);
  }

  ${({ isSelected }) =>
    isSelected &&
    `
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
  `}
`;

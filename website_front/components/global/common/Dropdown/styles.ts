import styled from "styled-components";
import { ArrowDownIcon } from "../../Icons";

export const DropdownWrapper = styled.div`
  border: 1px solid rgba(83, 98, 124, 0.07);
  background: white;
  border-radius: 8px;
  padding: 12px;
  position: relative;
  width: max-content;
`;

export const DropdownBlock = styled.div`
  background: white;
  position: absolute;
  top: 34px;
  left: 0;
  z-index: 1;
  width: 100%;
  padding: 0 12px 10px;
`;

export const LabelWrapper = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  cursor: pointer;

  span {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
`;

export const Arrow = styled(ArrowDownIcon)<{ active: boolean }>`
  transition: 0.3s;
  transform: ${({ active }) => `rotate(${active ? "180" : 0}deg)`};
`;

export const OptionItem = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  cursor: pointer;
  padding: 5px 0 !important;
  &:last-child {
    padding-bottom: 0 !important;
  }
`;

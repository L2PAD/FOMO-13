import styled from "styled-components";
import { ArrowDownIcon } from "../../Icons";

export const LabelWrapper = styled.div`
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

export const DropdownWrapper = styled.div`
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
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  gap: 10px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  width: min-content;
  white-space: nowrap;

  label p {
    font-size: 12px;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    width: 220px;
  }
`;

export const Arrow = styled(ArrowDownIcon)<{ active: boolean }>`
  transition: 0.3s;
  transform: ${({ active }) => `rotate(${active ? "180" : 0}deg)`};
`;

import styled, { keyframes } from "styled-components";
import { mobileActionControlStyles } from "../MobileActionsRow/styles";

const dropdownReveal = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-6px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
`;

export const SortDropdownWrapper = styled.div`
  position: relative;
  display: flex;

  & > button {
    background: none;
    border: none;
    display: flex;
    gap: 6px;
    align-items: center;
    font-weight: var(--font-weight-medium);
    font-size: 16px;
    line-height: 17px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #f9f9f9;
    transition: all 0.3s ease;
    white-space: nowrap;

    @media (max-width: 768px) {
      ${mobileActionControlStyles}
    }

    &:hover {
      background: var(--input-hover);
    }

    &:active {
      background: var(--input-active);
    }
  }
`;

export const SortDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  min-width: 220px;
  max-height: min(320px, calc(100vh - 16px));
  overflow-y: auto;
  padding: 8px;
  border: 1px solid rgba(115, 128, 148, 0.16);
  border-radius: 8px;
  background: var(--color-white);
  box-shadow: var(--main-section-shadow);
  transform-origin: top center;
  animation: ${dropdownReveal} 0.18s ease-out;
  will-change: transform, opacity;
`;

export const SortDropdownMenuItem = styled.button<{ active?: boolean }>`
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;
  font-weight: var(--font-weight-regular);
  text-align: left;
  border-radius: 6px;

  &:hover {
    background: rgba(115, 128, 148, 0.08);
  }

  svg {
    flex: 0 0 auto;
    color: var(--color-primary);
  }
`;

import { css } from "styled-components";

export const mobileActionsRowStyles = css`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  & > * {
    flex: 0 0 auto;
  }
`;

export const mobileActionControlStyles = css`
  flex: 0 0 auto;
  min-height: 36px;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f9f9f9;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  line-height: 16px;
  white-space: nowrap;
`;

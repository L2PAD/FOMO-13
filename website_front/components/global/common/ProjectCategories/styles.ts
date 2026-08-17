import styled from "styled-components";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

export const Title = styled.div`
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;

  ${Wrapper}.market-project-dark & {
    color: ${mainGlobalDark.textMuted};
  }
`;

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
`;

export const Chip = styled.span`
  max-width: 100%;
  padding: 7px 10px;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  background: var(--color-surface-subtle);
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${Wrapper}.market-project-dark & {
    border-color: rgba(255, 255, 255, 0.08);
    background: ${mainGlobalDark.backgroundHover};
    color: ${mainGlobalDark.text};
  }
`;

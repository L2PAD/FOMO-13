import styled, { keyframes } from "styled-components";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";

const compareDropdownOpen = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

export const SearchWrapper = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  width: min(420px, calc(100vw - 32px));
  padding: 14px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 14px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.26);
  transform-origin: top left;
  animation: ${compareDropdownOpen} 180ms ease-out;
  max-height: min(520px, calc(100vh - 24px));
  overflow: hidden;

  @media (max-width: 768px) {
    right: 0;
    left: auto;
    width: min(420px, calc(100vw - 40px));
    max-height: min(480px, calc(100vh - 24px));
    transform-origin: top right;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const SearchField = styled.div`
  position: relative;

  svg {
    position: absolute;
    top: 50%;
    left: 11px;
    width: 16px;
    height: 16px;
    transform: translateY(-50%);
    color: ${mainGlobalDark.textMuted};
  }

  input {
    width: 100%;
    height: 38px;
    padding: 0 36px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    background: ${mainGlobalDark.backgroundHover};
    color: ${mainGlobalDark.white};
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    outline: none;
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &::placeholder {
      color: ${mainGlobalDark.textMuted};
      font-weight: var(--font-weight-medium);
    }

    &:focus {
      background: ${mainGlobalDark.background};
      border-color: rgba(0, 221, 115, 0.36);
      box-shadow: 0 0 0 3px rgba(0, 221, 115, 0.16);
    }
  }
`;

export const ClearButton = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: ${mainGlobalDark.textMuted};
  transform: translateY(-50%);

  &:hover {
    background: ${mainGlobalDark.backgroundHover};
    color: ${mainGlobalDark.white};
  }
`;

export const SelectedSummary = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  margin-top: 10px;

  @media (max-width: 420px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const SelectedChips = styled.div`
  min-width: 0;
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px;
`;

export const SelectedChip = styled.button`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  gap: 6px;
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: ${mainGlobalDark.backgroundHover};
  color: ${mainGlobalDark.text};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);

  img {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const Section = styled.div`
  margin-top: 14px;
`;

export const ResultsScrollArea = styled.div`
  max-height: 292px;
  margin-top: 14px;
  padding-right: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(115, 128, 148, 0.52) rgba(255, 255, 255, 0.04);

  & > ${Section}:first-child {
    margin-top: 0;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
  }

  &::-webkit-scrollbar-thumb {
    border: 2px solid ${mainGlobalDark.background};
    border-radius: 999px;
    background: rgba(115, 128, 148, 0.52);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(115, 128, 148, 0.72);
  }
`;

export const SectionTitle = styled.div`
  margin-bottom: 8px;
  color: ${mainGlobalDark.textMuted};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 14px;
  text-transform: uppercase;
`;

export const AssetsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const AssetButton = styled.button<{
  $selected: boolean;
  $disabled: boolean;
}>`
  width: 100%;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  padding: 8px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? "rgba(0, 221, 115, 0.32)" : "transparent"};
  border-radius: 10px;
  background: ${({ $selected }) =>
    $selected ? "rgba(0, 221, 115, 0.12)" : "rgba(255, 255, 255, 0.04)"};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.48 : 1)};
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    background: ${({ $disabled, $selected }) =>
      $disabled
        ? "rgba(255, 255, 255, 0.04)"
        : $selected
          ? "rgba(0, 221, 115, 0.14)"
          : mainGlobalDark.backgroundHover};
    border-color: ${({ $disabled }) =>
      $disabled ? "transparent" : "rgba(255, 255, 255, 0.08)"};
  }

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

export const AssetInfo = styled.div`
  min-width: 0;
  text-align: left;

  strong,
  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: ${mainGlobalDark.white};
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
  }

  span {
    margin-top: 2px;
    color: ${mainGlobalDark.textMuted};
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 14px;
  }

  mark {
    padding: 0;
    background: rgba(0, 221, 115, 0.18);
    color: inherit;
    border-radius: 3px;
  }
`;

export const AssetMeta = styled.div<{
  $variant: "positive" | "negative" | "neutral";
  $selected?: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  min-width: 72px;
  min-height: 34px;
  color: ${mainGlobalDark.text};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 14px;
  white-space: nowrap;

  span {
    color: ${({ $variant }) =>
      $variant === "positive"
        ? "var(--color-primary)"
        : $variant === "negative"
          ? "var(--color-danger)"
          : mainGlobalDark.textMuted};
  }

  .selected-check {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 221, 115, 0.32);
    border-radius: 50%;
    background: rgba(0, 221, 115, 0.14);
    color: ${mainGlobalDark.positive};
  }

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.4;
  }
`;

export const StateText = styled.div`
  padding: 22px 8px;
  color: ${mainGlobalDark.textMuted};
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 17px;
  text-align: center;
`;

export const LimitText = styled.div`
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;

  span {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 6px 10px;
    border: 1px solid rgba(0, 221, 115, 0.26);
    border-radius: 999px;
    background: linear-gradient(
      180deg,
      rgba(0, 221, 115, 0.15) 0%,
      rgba(0, 221, 115, 0.08) 100%
    );
    color: ${mainGlobalDark.white};
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 15px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid ${mainGlobalDark.border};
`;

export const ActionButton = styled.button<{ $primary?: boolean }>`
  min-width: 84px;
  min-height: 34px;
  padding: 8px 12px;
  border: 1px solid
    ${({ $primary }) =>
      $primary ? "rgba(0, 221, 115, 0.32)" : "rgba(255, 255, 255, 0.08)"};
  border-radius: 9px;
  background: ${({ $primary }) =>
    $primary ? "var(--color-primary)" : mainGlobalDark.backgroundHover};
  color: ${({ $primary }) =>
    $primary ? "var(--color-white)" : mainGlobalDark.text};
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;

  &:hover {
    background: ${({ $primary }) =>
      $primary ? "#048c72" : "rgba(255, 255, 255, 0.08)"};
  }
`;

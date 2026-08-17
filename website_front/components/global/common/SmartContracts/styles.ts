import styled from "styled-components";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";

export const Wrapper = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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

export const Status = styled.span<{ $active?: boolean }>`
  flex: 0 0 auto;
  padding: 4px 7px;
  border: 1px solid
    ${({ $active }) => ($active ? "rgba(4, 165, 132, 0.16)" : "#eef2f6")};
  border-radius: 999px;
  background: ${({ $active }) =>
    $active ? "rgba(4, 165, 132, 0.08)" : "var(--color-surface-subtle)"};
  color: ${({ $active }) =>
    $active ? "var(--color-primary)" : "var(--color-text-muted)"};
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 13px;

  ${Wrapper}.market-project-dark & {
    border-color: ${({ $active }) =>
      $active ? "rgba(0, 221, 115, 0.28)" : "rgba(255, 255, 255, 0.08)"};
    background: ${({ $active }) =>
      $active ? "rgba(0, 221, 115, 0.12)" : mainGlobalDark.backgroundHover};
    color: ${({ $active }) =>
      $active ? mainGlobalDark.positive : mainGlobalDark.textMuted};
  }
`;

export const ContractsList = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
`;

export const ContractButton = styled.button`
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  background: var(--color-surface-subtle);
  color: var(--color-text-primary);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: rgba(4, 165, 132, 0.18);
    background: var(--color-white);
    box-shadow: rgba(0, 5, 48, 0.06) 1px 2px 6px 0;
  }

  svg {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
    color: var(--color-text-muted);
  }

  ${Wrapper}.market-project-dark & {
    border-color: rgba(255, 255, 255, 0.08);
    background: ${mainGlobalDark.backgroundHover};
    color: ${mainGlobalDark.text};
  }

  ${Wrapper}.market-project-dark &:hover,
  ${Wrapper}.market-project-dark &:focus-visible {
    border-color: rgba(0, 221, 115, 0.26);
    background: ${mainGlobalDark.background};
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
    outline: none;
  }

  ${Wrapper}.market-project-dark &[data-address]::after {
    content: attr(data-address);
    position: absolute;
    right: 8px;
    bottom: calc(100% + 8px);
    z-index: 20;
    max-width: min(360px, calc(100vw - 32px));
    padding: 8px 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: ${mainGlobalDark.background};
    color: ${mainGlobalDark.text};
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 15px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(4px);
    transition:
      opacity 0.16s ease,
      transform 0.16s ease;
    overflow-wrap: anywhere;
  }

  ${Wrapper}.market-project-dark &[data-address]:hover::after,
  ${Wrapper}.market-project-dark &[data-address]:focus-visible::after {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const ContractMeta = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;

  img {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    border-radius: 50%;
    object-fit: cover;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${Wrapper}.market-project-dark & {
    color: ${mainGlobalDark.textMuted};
  }

  ${Wrapper}.market-project-dark strong {
    color: ${mainGlobalDark.text};
  }
`;

export const Address = styled.span`
  flex: 0 0 auto;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;

  ${Wrapper}.market-project-dark & {
    color: ${mainGlobalDark.white};
  }
`;

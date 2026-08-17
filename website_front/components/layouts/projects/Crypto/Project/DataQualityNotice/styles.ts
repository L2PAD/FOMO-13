import styled from "styled-components";
import { mainGlobalDark } from "../../../../../../styles/mainGlobalDark";

export type DataQualityNoticeStatus = "warning" | "verified";

export const Notice = styled.aside<{ $status: DataQualityNoticeStatus }>`
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0;
  padding: 12px 14px;
  border: 1px solid
    ${({ $status }) =>
      $status === "verified"
        ? "rgba(4, 165, 132, 0.24)"
        : "rgba(115, 128, 148, 0.22)"};
  border-radius: 12px;
  background: ${({ $status }) =>
    $status === "verified"
      ? "var(--color-primary-soft)"
      : "var(--color-surface-subtle)"};

  &.unlocks-data-review-banner {
    margin-top: 0;
  }

  @media (max-width: 768px) {
    gap: 9px;
    margin: 14px 0;
    padding: 11px 12px;
    border-radius: 10px;
  }
`;

export const IconWrapper = styled.span<{ $status: DataQualityNoticeStatus }>`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${({ $status }) =>
    $status === "verified"
      ? "var(--color-primary-soft-strong)"
      : "rgba(115, 128, 148, 0.12)"};
  color: ${({ $status }) =>
    $status === "verified"
      ? "var(--color-primary-dark)"
      : "var(--main-gray)"};

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const Content = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const Title = styled.strong<{ $status: DataQualityNoticeStatus }>`
  color: ${({ $status }) =>
    $status === "verified"
      ? "var(--color-primary-dark)"
      : "var(--main-gray)"};
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
`;

export const Description = styled.span`
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  overflow-wrap: anywhere;
`;

export const SourceControl = styled.span`
  position: relative;
  z-index: 5;
  flex: 0 0 auto;
  align-self: center;
  margin-left: auto;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    right: 0;
    width: 100%;
    height: 10px;
  }

  @media (max-width: 520px) {
    align-self: flex-start;
  }
`;

export const SourceTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  cursor: pointer;
  transition:
    opacity 140ms ease,
    background-color 140ms ease;

  svg {
    width: 15px;
    height: 15px;
    flex: 0 0 15px;
  }

  &:hover {
    background: var(--color-surface-muted);
    opacity: 0.8;
  }

  &:active {
    background: var(--color-primary-soft);
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 2px solid var(--color-text-primary);
    outline-offset: 2px;
  }

  @media (max-width: 520px) {
    font-size: 12px;
  }
`;

export const SourcesTooltip = styled.span`
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  z-index: 20;
  width: min(340px, calc(100vw - 32px));
  max-height: min(360px, calc(100vh - 48px));
  padding: 13px 14px;
  overflow-y: auto;
  border: 1px solid var(--color-text-secondary);
  border-radius: 10px;
  background: var(--main-black);
  box-shadow: var(--shadow-soft);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 140ms ease,
    visibility 140ms ease;

  ${SourceControl}:hover &,
  ${SourceControl}:focus-within & {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
`;

export const SourceItem = styled.span`
  display: block;
  min-width: 0;

  & + & {
    margin-top: 11px;
    padding-top: 11px;
    border-top: 1px solid var(--color-text-secondary);
  }
`;

export const SourceTitle = styled.strong`
  display: block;
  margin-bottom: 6px;
  color: var(--color-text-inverse);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
`;

export const SourceLink = styled.a`
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  color: ${mainGlobalDark.positive};
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 17px;
  text-decoration: none;
  transition: opacity 140ms ease;

  > svg {
    width: 13px;
    height: 13px;
    flex: 0 0 13px;
  }

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.65;
  }
`;

export const SourceLinkIcon = styled.span`
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--color-primary-soft-strong);

  svg {
    width: 13px;
    height: 13px;
  }
`;

export const SourceLinkText = styled.span`
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

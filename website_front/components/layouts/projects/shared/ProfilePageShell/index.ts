import styled, { css } from "styled-components";
import {
  BaseCardCryptoWrapper,
  BaseCardWrapper,
} from "../../../../global/common/BaseCard/styles";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";

const marketCardShadow = "rgba(0, 5, 48, 0.08) 2px 2px 8px 0px";

export const profileSurfaceStyles = css`
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--Stroke, #f0f2f5);
  border-radius: 16px;
  background: var(--color-white);
  box-shadow: ${marketCardShadow};

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }
`;

export const profileHeaderGridStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1.85fr) minmax(300px, 1fr);
  align-items: start;
  gap: 24px;
  min-width: 0;

  @media (max-width: 1024px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  @media (max-width: 768px) {
    gap: 14px;
  }
`;

export const profileMetricsGridStyles = css`
  min-width: 0;
  padding: 6px;
  border: 1px solid #edf0f4;
  border-radius: 12px;
  background: #f7f9fb;
`;

export const profileMetricItemStyles = css`
  min-width: 0;
  padding: 10px 12px;
  border-radius: 9px;

  .key,
  .value {
    min-width: 0;
  }

  .value,
  .value > span,
  .region-value {
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    border-radius: 0;

    &:not(:first-child) {
      border-top: 1px solid #e6eaf0;
    }
  }
`;

export const profileDarkPanelStyles = css`
  padding: 18px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 14px;
  background:
    radial-gradient(
      circle at 100% 0,
      rgba(0, 221, 115, 0.12),
      transparent 38%
    ),
    ${mainGlobalDark.background};
  color: ${mainGlobalDark.text};

  @media (max-width: 768px) {
    padding: 14px;
    border-radius: 12px;
  }
`;

export const profileDarkMetricsGridStyles = css`
  border-color: ${mainGlobalDark.border};
  background: ${mainGlobalDark.backgroundHover};
`;

export const profileDarkMetricItemStyles = css`
  color: ${mainGlobalDark.text};

  && .value,
  && .value > span,
  && .region-value {
    color: ${mainGlobalDark.white};
  }

  && .key {
    color: ${mainGlobalDark.textMuted};
  }

  @media (max-width: 768px) {
    &:not(:first-child) {
      border-top-color: ${mainGlobalDark.border};
    }
  }
`;

export const ProfilePageShell = styled.div`
  min-width: 0;
  padding: 20px 36px;

  ${BaseCardWrapper}[data-card-variant="main"],
  ${BaseCardCryptoWrapper}[data-card-variant="main"] {
    min-width: 0;
    border: 1px solid var(--Stroke, #f0f2f5);
    border-radius: 12px;
    background: var(--color-white);
    box-shadow: ${marketCardShadow};
  }

  ${BaseCardWrapper}[data-card-variant="main"]:hover,
  ${BaseCardCryptoWrapper}[data-card-variant="main"]:hover {
    border-color: var(--Stroke, #f0f2f5);
    background: var(--color-white);
    box-shadow: ${marketCardShadow};
    transform: none;
  }

  @media (max-width: 1204px) {
    width: 100%;
    margin-top: 14px;
    padding: 0 16px;
  }

  @media (max-width: 768px) {
    margin-top: 8px;
    padding: 16px 12px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

export const ProfileHeaderSurface = styled.section`
  ${profileSurfaceStyles}
`;

export const ProfileHeaderGrid = styled.div`
  ${profileHeaderGridStyles}
`;

export const ProfileContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.85fr) minmax(300px, 1fr);
  align-items: start;
  gap: 24px;
  min-width: 0;
  margin-top: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }

  @media (max-width: 768px) {
    gap: 20px;
    margin-top: 18px;
  }
`;

export const ProfilePrimaryColumn = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 24px;

  > * {
    min-width: 0;
  }

  @media (max-width: 768px) {
    gap: 20px;
  }
`;

export const ProfileSidebarColumn = styled.aside`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 18px;

  > * {
    min-width: 0;
  }

  > h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    line-height: 22px;
  }

  @media (max-width: 768px) {
    gap: 14px;

    > h2 {
      font-size: 16px;
      line-height: 20px;
    }
  }
`;

export const ProfileSidebarTitle = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  && > h2 {
    min-width: 0;
    margin: 0;
    color: var(--color-text-primary);
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    line-height: 22px;
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    && > h2 {
      font-size: 16px;
      line-height: 20px;
    }
  }

  button {
    display: inline-flex;
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    align-items: center;
    justify-content: center;
    border: 1px solid #edf0f4;
    border-radius: 9px;
    background: var(--color-white);
    transition:
      background 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      border-color: rgba(4, 165, 132, 0.24);
      background: var(--color-surface-subtle);
    }
  }
`;

export const ProfileTabsSection = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`;

export const ProfileSectionStack = styled.div`
  width: 100%;
  min-width: 0;
`;

export const ProfileSectionTitle = styled.h2`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;

  > span,
  > div {
    min-width: 0;
  }

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 18px;
    line-height: 23px;
  }
`;

export const ProfileTableScroll = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(115, 128, 148, 0.35) transparent;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 7px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(115, 128, 148, 0.28);
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

export const ProfileHorizontalList = styled.div`
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  gap: 16px;
  padding: 2px 2px 10px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: rgba(115, 128, 148, 0.3) transparent;
  -webkit-overflow-scrolling: touch;

  > * {
    scroll-snap-align: start;
  }

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

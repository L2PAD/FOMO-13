import styled, { css, keyframes } from "styled-components";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";

const coreFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const CorePortfolioHero = styled.section`
  position: relative;
  z-index: 2;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(420px, 2fr);
  min-height: 0;
  margin-bottom: 16px;
  overflow: visible;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 14px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 32px rgba(12, 26, 43, 0.14);
  color: ${mainGlobalDark.text};
  animation: ${coreFadeIn} 0.34s cubic-bezier(0.22, 1, 0.36, 1) both;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    pointer-events: none;
    background:
      radial-gradient(
        circle at 12% 0%,
        rgba(0, 221, 115, 0.095),
        transparent 34%
      ),
      linear-gradient(125deg, transparent 52%, rgba(255, 255, 255, 0.025));
  }

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 575px) {
    margin-bottom: 12px;
    border-radius: 14px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const CorePortfolioHeroMain = styled.div`
  min-width: 0;
  padding: 16px 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  @media (max-width: 575px) {
    padding: 15px;
    gap: 13px;
  }
`;

export const CorePortfolioIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;

  @media (max-width: 575px) {
    gap: 14px;
  }
`;

export const CorePortfolioLogo = styled.div`
  position: relative;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  background: ${mainGlobalDark.backgroundHover};
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
  color: ${mainGlobalDark.white};
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.03em;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .logo-initials {
    position: relative;
    z-index: 0;
  }

  @media (max-width: 575px) {
    width: 54px;
    height: 54px;
    flex-basis: 54px;
    border-radius: 16px;
    font-size: 18px;
  }
`;

export const CorePortfolioIdentityCopy = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;

  .portfolio-kicker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }

  h2 {
    margin: 0;
    overflow-wrap: anywhere;
    color: ${mainGlobalDark.white};
    font-size: clamp(21px, 2.2vw, 27px);
    font-weight: var(--font-weight-semibold);
    line-height: 1.08;
    letter-spacing: -0.035em;
  }

  p {
    max-width: 64ch;
    margin: 0;
    color: ${mainGlobalDark.text};
    overflow: hidden;
    font-size: 12px;
    line-height: 17px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const CorePortfolioBadge = styled.span<{ $tone?: "positive" | "muted" }>`
  display: inline-flex;
  min-height: 21px;
  align-items: center;
  gap: 6px;
  padding: 4px 7px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "positive"
        ? "rgba(0, 221, 115, 0.22)"
        : "rgba(255, 255, 255, 0.08)"};
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === "positive"
      ? "rgba(0, 221, 115, 0.1)"
      : "rgba(255, 255, 255, 0.045)"};
  color: ${({ $tone }) =>
    $tone === "positive" ? mainGlobalDark.positive : mainGlobalDark.textMuted};
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  letter-spacing: 0.045em;
  text-transform: uppercase;
`;

export const CorePortfolioHeroActions = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;

  @media (max-width: 720px) {
    justify-content: flex-start;
  }

  @media (max-width: 575px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const CoreHeroButton = styled.button<{
  $primary?: boolean;
  $iconOnly?: boolean;
}>`
  min-width: ${({ $iconOnly }) => ($iconOnly ? "34px" : "98px")};
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: ${({ $iconOnly }) => ($iconOnly ? "7px" : "7px 11px")};
  border: 1px solid
    ${({ $primary }) =>
      $primary ? "rgba(0, 221, 115, 0.3)" : mainGlobalDark.border};
  border-radius: 9px;
  background: ${({ $primary }) =>
    $primary ? "rgba(0, 221, 115, 0.12)" : mainGlobalDark.backgroundHover};
  color: ${({ $primary }) =>
    $primary ? mainGlobalDark.positive : mainGlobalDark.text};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: ${({ $primary }) =>
      $primary ? "rgba(0, 221, 115, 0.42)" : "rgba(255, 255, 255, 0.16)"};
    background: ${({ $primary }) =>
      $primary ? "rgba(0, 221, 115, 0.17)" : "#182d47"};
    color: ${({ $primary }) =>
      $primary ? mainGlobalDark.positive : mainGlobalDark.white};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 221, 115, 0.18);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 15px;
    height: 15px;
  }

  @media (max-width: 575px) {
    width: 100%;

    ${({ $iconOnly }) =>
      $iconOnly &&
      css`
        grid-column: span 2;
      `}
  }
`;

export const CoreHeroActionsMenu = styled.div`
  position: relative;

  .actions-modal {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 45;
    width: 210px;
    color: var(--color-text-primary);
  }

  @media (max-width: 575px) {
    grid-column: span 2;

    .actions-modal {
      right: 0;
      width: min(230px, calc(100vw - 52px));
    }
  }
`;

export const CorePortfolioHeroStats = styled.aside`
  min-width: 0;
  padding: 14px 16px;
  border-left: 1px solid ${mainGlobalDark.border};
  background: rgba(19, 36, 57, 0.62);
  border-radius: 0 13px 13px 0;
  display: grid;
  grid-template-columns: minmax(145px, 0.75fr) minmax(220px, 1.25fr);
  align-items: center;
  gap: 14px;

  @media (max-width: 960px) {
    border-top: 1px solid ${mainGlobalDark.border};
    border-left: 0;
    border-radius: 0 0 13px 13px;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (max-width: 575px) {
    padding: 15px;
    border-radius: 0 0 13px 13px;
  }
`;

export const CorePortfolioLeadMetric = styled.div`
  .metric-label {
    color: ${mainGlobalDark.textMuted};
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    line-height: 14px;
    letter-spacing: 0.075em;
    text-transform: uppercase;
  }

  .metric-value {
    display: block;
    margin-top: 4px;
    color: ${mainGlobalDark.white};
    font-size: clamp(24px, 2.5vw, 30px);
    font-weight: var(--font-weight-semibold);
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  .metric-change {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 5px;
    color: ${mainGlobalDark.textMuted};
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
  }

  .metric-change.positive {
    color: ${mainGlobalDark.positive};
  }

  .metric-change.negative {
    color: #ff7070;
  }
`;

export const CorePortfolioHeroMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;

  .hero-metric {
    min-width: 0;
    padding: 7px 8px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.035);
  }

  .hero-metric span {
    display: block;
    overflow: hidden;
    color: ${mainGlobalDark.textMuted};
    font-size: 10px;
    font-weight: var(--font-weight-semibold);
    line-height: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hero-metric strong {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: ${mainGlobalDark.white};
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 960px) and (min-width: 621px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const CoreAnalyticsLayout = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
  align-items: stretch;
  gap: 18px;

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 575px) {
    gap: 12px;
  }
`;

export const CoreMetricsRail = styled.aside`
  display: grid;
  grid-template-columns: 1fr;
  align-content: stretch;
  gap: 12px;

  @media (max-width: 1040px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 660px) {
    grid-template-columns: 1fr;
  }
`;

export const CoreMetricCard = styled.article`
  min-width: 0;
  padding: 16px;
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  background: var(--color-white);
  box-shadow: rgba(0, 5, 48, 0.06) 2px 2px 8px;
  display: flex;
  flex-direction: column;
  gap: 13px;

  .metric-card-title {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
  }

  .metric-card-icon {
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #eef2f6;
    border-radius: 9px;
    background: var(--color-surface-subtle);
    color: var(--color-text-secondary);
  }

  .metric-card-icon svg {
    width: 16px;
    height: 16px;
  }

  .metric-row {
    min-height: 25px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
  }

  .metric-row + .metric-row {
    padding-top: 11px;
    border-top: 1px solid #f0f2f5;
  }

  .metric-row span {
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
  }

  .metric-label-with-info {
    position: relative;
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .metric-info-button {
    position: static;
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text-muted);
    line-height: 0;
    cursor: help;
  }

  .metric-info-button:focus-visible {
    outline: none;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(0, 221, 115, 0.16);
  }

  .metric-tooltip {
    position: absolute;
    right: -8px;
    bottom: calc(100% + 8px);
    z-index: 60;
    width: 260px;
    max-width: calc(100vw - 48px);
    padding: 10px;
    border: 1px solid #eef2f6;
    border-radius: 8px;
    background: var(--color-white);
    box-shadow: 2px 2px 8px 0 #00053014;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    line-height: 17px;
    text-align: left;
    white-space: normal;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(4px);
    transition:
      opacity 0.16s ease,
      transform 0.16s ease,
      visibility 0.16s ease;
  }

  .metric-info-button:hover .metric-tooltip,
  .metric-info-button:focus-visible .metric-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  @media (max-width: 660px) {
    .metric-tooltip {
      right: auto;
      left: 0;
      max-width: calc(100vw - 64px);
    }
  }

  .metric-row strong {
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
    line-height: 17px;
    text-align: right;
  }

  .metric-row strong.positive {
    color: var(--main-green);
  }

  .metric-row strong.negative {
    color: var(--color-danger);
  }
`;

export const CorePerformanceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;

  .performance-cell {
    min-width: 0;
    padding: 8px 5px;
    border: 1px solid #f0f2f5;
    border-radius: 8px;
    background: var(--color-surface-subtle);
    text-align: center;
  }

  .performance-cell strong,
  .performance-cell span {
    display: block;
  }

  .performance-cell strong {
    overflow: hidden;
    color: var(--color-text-primary);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .performance-cell strong.positive {
    color: var(--main-green);
  }

  .performance-cell strong.negative {
    color: var(--color-danger);
  }

  .performance-cell span {
    margin-top: 3px;
    color: var(--color-text-muted);
    font-size: 10px;
    font-weight: var(--font-weight-semibold);
    line-height: 13px;
    text-transform: uppercase;
  }
`;

export const CoreSection = styled.section`
  margin-top: 32px;

  @media (max-width: 575px) {
    margin-top: 24px;
  }
`;

export const CoreSectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 22px;
    font-weight: var(--font-weight-semibold);
    line-height: 27px;
    letter-spacing: -0.02em;
  }

  p {
    margin: 4px 0 0;
    color: var(--color-text-muted);
    font-size: 13px;
    line-height: 18px;
  }
`;

export const CoreSecondaryGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: start;
  gap: 18px;

  & > * {
    min-width: 0;
  }

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }
`;

export const CoreMoversGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

export const CoreStateCard = styled.div<{ $error?: boolean }>`
  min-height: 260px;
  margin-top: 18px;
  padding: 36px 20px;
  border: 1px solid
    ${({ $error }) => ($error ? "rgba(255, 88, 88, 0.2)" : "#f0f2f5")};
  border-radius: 16px;
  background: ${({ $error }) => ($error ? "#fff9f9" : "var(--color-white)")};
  box-shadow: rgba(0, 5, 48, 0.05) 2px 2px 8px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 14px;
  text-align: center;
`;

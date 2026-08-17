import styled, { keyframes } from "styled-components";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";

const skeletonSweep = keyframes`
  0% { transform: translateX(-110%); }
  100% { transform: translateX(110%); }
`;

const traceLine = keyframes`
  from { stroke-dashoffset: 620; opacity: 0.45; }
  to { stroke-dashoffset: 0; opacity: 1; }
`;

const updatePulse = keyframes`
  0%, 100% { opacity: 0.74; }
  50% { opacity: 1; }
`;

export const ChartCard = styled.section`
  position: relative;
  isolation: isolate;
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #f0f2f5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0;

  &:fullscreen,
  &:-webkit-full-screen {
    display: flex;
    width: 100vw;
    height: 100vh;
    flex-direction: column;
    padding: 20px;
    overflow: auto;
    border: 0;
    border-radius: 0;
    background: #ffffff;
    box-shadow: none;
  }

  @media (max-width: 640px) {
    border-radius: 14px;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f2f5;

  @media (max-width: 640px) {
    padding: 12px 14px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: clamp(20px, 5vw, 64px);
  flex-wrap: wrap;

  @media (max-width: 760px) {
    gap: 10px 18px;
  }
`;

export const ControlGroup = styled.div`
  display: flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  gap: 3px;
  padding: 3px;
  overflow-x: auto;
  border: 1px solid rgba(12, 26, 43, 0.1);
  border-radius: 10px;
  background: rgba(12, 26, 43, 0.035);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const ControlSection = styled.div<{ $align?: "start" | "end" }>`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: ${({ $align }) =>
    $align === "end" ? "flex-end" : "flex-start"};
  gap: 8px;

  ${({ $align }) =>
    $align === "end" &&
    `
      flex: 1 1 420px;
    `}

  @media (max-width: 640px) {
    width: 100%;

    ${({ $align }) =>
      $align === "end" &&
      `
        flex-basis: 100%;

        & > ${ControlGroup} {
          flex: 1 1 auto;
        }
      `}
  }
`;

export const ControlButton = styled.button<{ $active?: boolean }>`
  min-width: 0;
  min-height: 32px;
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid
    ${({ $active }) => ($active ? "rgba(255, 255, 255, 0.08)" : "transparent")};
  border-radius: 7px;
  background: ${({ $active }) =>
    $active ? mainGlobalDark.background : "transparent"};
  color: ${({ $active }) =>
    $active ? mainGlobalDark.white : mainGlobalDark.background};
  box-shadow: ${({ $active }) =>
    $active ? "0 5px 12px rgba(12, 26, 43, 0.14)" : "none"};
  cursor: pointer;
  font-size: 12px;
  font-weight: var(--font-weight-semibold, 600);
  line-height: 14px;
  white-space: nowrap;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? mainGlobalDark.backgroundHover : "rgba(12, 26, 43, 0.07)"};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--main-green) 17%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const IconButton = styled.button<{ $emphasis?: boolean }>`
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid
    ${({ $emphasis }) => ($emphasis ? "rgba(255, 255, 255, 0.08)" : "#e8edf3")};
  border-radius: 9px;
  background: ${({ $emphasis }) =>
    $emphasis ? mainGlobalDark.background : "#ffffff"};
  color: ${({ $emphasis }) => ($emphasis ? mainGlobalDark.white : "#526176")};
  cursor: pointer;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;

  svg {
    width: 17px;
    height: 17px;
    stroke-width: 1.8;
  }

  &:hover {
    border-color: ${({ $emphasis }) =>
      $emphasis ? mainGlobalDark.border : "#dce3eb"};
    background: ${({ $emphasis }) =>
      $emphasis ? mainGlobalDark.backgroundHover : "#f8fafc"};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--main-green) 17%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const Content = styled.div`
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  padding: 16px 18px 18px;

  @media (max-width: 640px) {
    padding: 14px;
  }
`;

export const MetricSummary = styled.div`
  display: flex;
  min-height: 52px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;

  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
`;

export const MetricValueBlock = styled.div`
  min-width: 0;
`;

export const MetricLabel = styled.div`
  margin-bottom: 3px;
  color: #738094;
  font-size: 12px;
  font-weight: var(--font-weight-semibold, 600);
  line-height: 15px;
`;

export const MetricValueRow = styled.div`
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 9px;
  flex-wrap: wrap;
`;

export const MetricValue = styled.div`
  color: ${mainGlobalDark.background};
  font-size: clamp(24px, 3vw, 30px);
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
  line-height: 1.08;
  letter-spacing: -0.025em;
`;

export const MetricChange = styled.span<{
  $variant: "positive" | "negative" | "neutral";
}>`
  display: inline-flex;
  align-items: center;
  padding: 4px 7px;
  border-radius: 7px;
  background: ${({ $variant }) =>
    $variant === "positive"
      ? "color-mix(in srgb, var(--main-green) 10%, transparent)"
      : $variant === "negative"
        ? "rgba(255, 88, 88, 0.1)"
        : "rgba(115, 128, 148, 0.1)"};
  color: ${({ $variant }) =>
    $variant === "positive"
      ? "var(--main-green)"
      : $variant === "negative"
        ? "#d64242"
        : "#738094"};
  font-size: 12px;
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
  line-height: 15px;
`;

export const RangeDot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 0 3px ${({ $color }) => `${$color}19`};
`;

export const Plot = styled.div<{ $updating?: boolean }>`
  position: relative;
  min-height: 348px;
  flex: 1 1 auto;
  opacity: ${({ $updating }) => ($updating ? 0.72 : 1)};
  filter: ${({ $updating }) => ($updating ? "saturate(0.78)" : "none")};
  transition:
    opacity 0.24s ease,
    filter 0.24s ease;

  ${ChartCard}:fullscreen &,
  ${ChartCard}:-webkit-full-screen & {
    min-height: 420px;
  }

  .recharts-wrapper,
  .recharts-surface {
    cursor: crosshair;
    outline: none;
  }

  .recharts-tooltip-wrapper {
    max-width: calc(100% - 8px);
  }

  .recharts-cartesian-axis-tick-value {
    font-family: inherit;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 640px) {
    min-height: 310px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const UpdatingBadge = styled.div`
  position: absolute;
  top: 76px;
  right: 22px;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 9px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 10px 24px rgba(12, 26, 43, 0.18);
  color: ${mainGlobalDark.text};
  font-size: 11px;
  font-weight: var(--font-weight-semibold, 600);
  line-height: 14px;
  pointer-events: none;
  animation: ${updatePulse} 1.35s ease-in-out infinite;

  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--main-green);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Legend = styled.div`
  display: flex;
  min-height: 25px;
  align-items: center;
  gap: 12px;
  margin-top: 3px;
  color: #738094;
  font-size: 11px;
  font-weight: var(--font-weight-semibold, 600);
  line-height: 14px;
  flex-wrap: wrap;
`;

export const LegendItem = styled.span<{ $color: string; $dashed?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: "";
    width: 15px;
    height: 2px;
    border-radius: 2px;
    background: ${({ $color, $dashed }) =>
      $dashed
        ? `repeating-linear-gradient(90deg, ${$color} 0 4px, transparent 4px 7px)`
        : $color};
  }
`;

export const TooltipCard = styled.div`
  box-sizing: border-box;
  width: min(220px, calc(100vw - 64px));
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
  color: ${mainGlobalDark.text};
`;

export const TooltipHeader = styled.div`
  padding: 9px 10px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

export const TooltipTitle = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: ${mainGlobalDark.white};
  font-size: 12px;
  font-weight: var(--font-weight-semibold, 600);
  line-height: 15px;

  span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const TooltipDate = styled.div`
  margin-top: 3px;
  color: ${mainGlobalDark.textMuted};
  font-size: 10px;
  font-weight: var(--font-weight-medium, 500);
  line-height: 13px;
`;

export const TooltipRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 9px;
`;

export const TooltipRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

export const TooltipLabel = styled.span`
  color: ${mainGlobalDark.textMuted};
  font-size: 10px;
  font-weight: var(--font-weight-semibold, 600);
  line-height: 13px;
`;

export const TooltipValue = styled.span<{
  $variant?: "positive" | "negative" | "neutral";
}>`
  min-width: 0;
  color: ${({ $variant }) =>
    $variant === "positive"
      ? "var(--main-green)"
      : $variant === "negative"
        ? "#ff7373"
        : mainGlobalDark.white};
  font-size: 11px;
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
  line-height: 14px;
  text-align: right;
  overflow-wrap: anywhere;
`;

export const EmptyState = styled.div`
  display: flex;
  min-height: 350px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 36px 20px;
  border: 1px dashed #dce3eb;
  border-radius: 12px;
  background: #fafbfd;
  text-align: center;

  strong {
    color: ${mainGlobalDark.background};
    font-size: 14px;
    font-weight: var(--font-weight-semibold, 600);
    line-height: 18px;
  }

  span {
    max-width: 360px;
    margin-top: 6px;
    color: #738094;
    font-size: 12px;
    line-height: 17px;
  }
`;

export const ErrorNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 9px 11px;
  border: 1px solid rgba(255, 88, 88, 0.18);
  border-radius: 9px;
  background: rgba(255, 88, 88, 0.06);
  color: #a33636;
  font-size: 11px;
  font-weight: var(--font-weight-semibold, 600);
  line-height: 15px;

  button {
    padding: 4px 7px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #a33636;
    cursor: pointer;
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:focus-visible {
      outline: 2px solid rgba(163, 54, 54, 0.24);
      outline-offset: 2px;
    }
  }
`;

export const Skeleton = styled.div`
  position: relative;
  min-height: 455px;
  overflow: hidden;
  border-radius: 12px;
  background:
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 69px,
      rgba(115, 128, 148, 0.08) 69px,
      rgba(115, 128, 148, 0.08) 70px
    ),
    linear-gradient(180deg, #fbfcfd 0%, #f7f9fb 100%);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.74) 48%,
      transparent 100%
    );
    animation: ${skeletonSweep} 1.65s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
`;

export const SkeletonHeader = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1;
  width: 150px;
  height: 33px;
  border-radius: 8px;
  background: #e9eef3;
`;

export const SkeletonTrace = styled.svg`
  position: absolute;
  inset: 82px 18px 18px;
  z-index: 2;
  width: calc(100% - 36px);
  height: calc(100% - 100px);
  overflow: visible;

  path {
    fill: none;
    stroke: rgba(12, 26, 43, 0.28);
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 620;
    animation: ${traceLine} 1.25s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @media (prefers-reduced-motion: reduce) {
    path {
      animation: none;
      stroke-dashoffset: 0;
    }
  }
`;

export const ScreenReaderStatus = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

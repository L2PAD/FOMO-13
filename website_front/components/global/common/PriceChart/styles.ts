import styled, { css, keyframes } from "styled-components";
import {
  mainGlobalDark,
  mainGlobalDarkBorder,
} from "../../../../styles/mainGlobalDark";

export interface TimeRangeButtonProps {
  active: boolean;
}

export interface TimelineBarProps {
  $height: number;
  $variant: "positive" | "negative" | "neutral";
}

export interface TimelineBarsProps {
  $sectionCount: number;
}

export interface TimelineSectionProps {
  $active: boolean;
}

export type TimelineTooltipPlacement = "start" | "center" | "end";

const chartSkeletonDraw = keyframes`
  0% {
    opacity: 0.88;
    transform: scaleX(0);
  }
  64%,
  100% {
    opacity: 1;
    transform: scaleX(1);
  }
`;

const chartBodyLoadingPulse = keyframes`
  0%,
  100% {
    opacity: 0.86;
  }
  50% {
    opacity: 0.5;
  }
`;

const chartBodyContentPulse = keyframes`
  0%,
  100% {
    filter: brightness(0.42);
  }
  50% {
    filter: brightness(0.66);
  }
`;

export const ChartContainer = styled.div<{ $compactFill?: boolean }>`
  position: relative;
  width: 100%;
  margin: auto;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  padding: 20px;
  border-radius: 16px;

  &.market-project-price-chart {
    padding: 16px 18px 18px;
  }

  ${({ $compactFill }) =>
    $compactFill &&
    css`
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    `}

  @media (max-width: 768px) {
    padding: 14px;

    &.market-project-price-chart {
      padding: 12px;
    }
  }

  &:fullscreen,
  &:-webkit-full-screen,
  &.chart-screenshot-capture {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    padding: 24px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: var(--color-white);
  }
`;

export const TimeRangeButtons = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 4px;
  flex-wrap: nowrap;
  justify-content: flex-end;
  padding: 4px;
  border: 1px solid rgba(12, 26, 43, 0.12);
  border-radius: 12px;
  background: rgba(12, 26, 43, 0.04);
  overflow-x: auto;
  scrollbar-width: none;

  .time-range-presets,
  .chart-utility-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &::-webkit-scrollbar {
    display: none;
  }

  & .photo-btn,
  & .fullscreen-btn,
  & .compact-btn {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    margin-left: 4px;
    border: 1px solid #f0f2f5;
    border-radius: 8px;
    background: var(--color-white);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease,
      box-shadow 0.2s ease;

    svg {
      width: 17px;
      height: 17px;
    }

    &:hover {
      background: var(--color-white);
      border-color: rgba(115, 128, 148, 0.18);
      box-shadow: rgba(0, 5, 48, 0.06) 1px 2px 6px 0px;
      color: var(--color-text-secondary);
    }
    &:active {
      opacity: 0.6;
    }
  }

  & .fullscreen-btn {
    border-color: rgba(12, 26, 43, 0.18);
    background: ${mainGlobalDark.background};
    color: ${mainGlobalDark.text};

    &:hover {
      border-color: ${mainGlobalDark.border};
      background: ${mainGlobalDark.backgroundHover};
      color: ${mainGlobalDark.white};
    }
  }

  & .compact-btn {
    border-color: ${mainGlobalDark.border};
    background: ${mainGlobalDark.background};
    color: ${mainGlobalDark.white};
    box-shadow: rgba(12, 26, 43, 0.18) 0 6px 14px;

    &:hover {
      background: ${mainGlobalDark.backgroundHover};
      border-color: ${mainGlobalDark.border};
      color: ${mainGlobalDark.white};
      box-shadow: rgba(12, 26, 43, 0.24) 0 7px 16px;
    }
  }

  & .sort-btn {
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 30px;
    border-radius: 4px;

    &.active {
      background: var(--color-surface-subtle);
    }
  }

  @media (max-width: 1180px) {
    & .compact-btn {
      display: none;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
    align-items: stretch;
    flex-direction: column;
    justify-content: flex-start;
    gap: 6px;
    padding: 4px;
    overflow: visible;

    .time-range-presets {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      width: 100%;
    }

    .chart-utility-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;
    }

    .time-range-presets button,
    .chart-utility-actions .photo-btn,
    .chart-utility-actions .fullscreen-btn {
      width: 100%;
      min-width: 0;
      margin-left: 0;
    }

    button {
      flex: 1 1 auto;
      min-height: 34px;
      padding-right: 5px;
      padding-left: 5px;
      white-space: nowrap;
    }
  }
`;

export const ChangeValues = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  & > div {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }

  .price,
  .compare {
    padding: 4px;
    border: 1px solid rgba(12, 26, 43, 0.12);
    border-radius: 12px;
    background: rgba(12, 26, 43, 0.04);
  }

  @media (max-width: 768px) {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    overflow: visible;

    button {
      padding: 8px 9px;
      font-size: 12px;
      font-weight: var(--font-weight-regular);
      height: 30px;
    }

    .price {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;

      button {
        width: 100%;
        padding: 8px 10px;
        font-size: 12px;
        font-weight: var(--font-weight-regular);
        min-width: 85px;

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }

    .compare {
      position: relative;
      display: grid;
      grid-template-columns: 34px 34px minmax(96px, 1fr) auto;
      align-items: center;
      width: 100%;
      overflow: visible;

      button {
        width: auto;
      }

      & > .img-btn {
        width: 34px !important;
        min-width: 34px;
        padding: 6px;
      }

      & > .compare-btn {
        min-width: max-content;
      }

      & > div > .compare-btn {
        width: 100%;
        min-width: 0;
      }
    }
  }

  @media (max-width: 520px) {
    align-items: stretch;

    .price {
      width: 100%;
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .compare {
      width: 100%;
      overflow: visible;
    }
  }
`;

export const ChartTokens = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  flex-wrap: wrap;

  @media (max-width: 575px) {
    gap: 6px;
    margin-bottom: 8px;

    button {
      padding: 5px 8px;
    }
  }

  .market-project-price-chart & {
    margin-bottom: 0;
  }

  button {
    background: var(--color-surface-subtle);
    border: 1px solid #f0f2f5;
    border-radius: 8px;
    padding: 6px 9px;
    display: flex;
    align-items: center;
    gap: 6px;

    span {
      font-size: 12px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
    }

    div,
    img {
      min-width: 8px;
      min-height: 8px;
      max-width: 8px;
      max-height: 8px;
      border-radius: 50%;
      &.green {
        background: var(--color-primary);
      }
      &.purple {
        background: #860d73;
      }
    }

    svg {
      width: 12px;
      height: 12px;
    }
  }
`;

export const ChartBody = styled.div<{
  $isUpdating?: boolean;
  $compactFill?: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  position: relative;

  ${({ $compactFill }) =>
    $compactFill &&
    css`
      flex: 1 1 0;
      min-height: 408px;
    `}

  & > * {
    transition:
      opacity 0.72s ease,
      filter 0.72s ease;
    opacity: ${({ $isUpdating }) => ($isUpdating ? 0.64 : 1)};
    filter: ${({ $isUpdating }) => ($isUpdating ? "brightness(0.42)" : "none")};
    animation: ${({ $isUpdating }) =>
      $isUpdating
        ? css`${chartBodyContentPulse} 1.75s ease-in-out infinite`
        : "none"};
    pointer-events: ${({ $isUpdating }) => ($isUpdating ? "none" : "auto")};
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 10;
    border-radius: inherit;
    background: rgba(12, 26, 43, 0.36);
    opacity: ${({ $isUpdating }) => ($isUpdating ? 0.86 : 0)};
    pointer-events: ${({ $isUpdating }) => ($isUpdating ? "auto" : "none")};
    animation: ${({ $isUpdating }) =>
      $isUpdating
        ? css`${chartBodyLoadingPulse} 1.75s ease-in-out infinite`
        : "none"};
    transition: opacity 0.72s ease;
  }

  .market-project-price-chart:fullscreen &,
  .market-project-price-chart:-webkit-full-screen &,
  .market-project-price-chart.chart-screenshot-capture & {
    flex: 1 1 auto;
    min-height: 0;
  }
`;

export const ChartRow = styled.div`
  display: flex;
  align-items: center;
  gap: 30px;
  span {
    color: var(--color-text-primary);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const ChartViews = styled.div``;

export const TimeButton = styled.button<TimeRangeButtonProps>`
  min-height: 34px;
  padding: 7px 12px;
  background: ${({ active }) =>
    active ? mainGlobalDark.background : "rgba(12, 26, 43, 0.04)"};
  color: ${({ active }) =>
    active ? mainGlobalDark.white : mainGlobalDark.background};
  cursor: pointer;
  border: 1px solid
    ${({ active }) =>
      active ? mainGlobalDark.border : "rgba(12, 26, 43, 0.12)"};
  border-radius: 8px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 8px 11px;
    font-size: 12px;
    font-weight: var(--font-weight-regular);

    &.img-btn {
      padding: 7px;

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }

  path {
    stroke: currentColor;
  }

  svg {
    width: 18px;
    height: 18px;
  }

  &.compare-btn {
    display: flex;
    align-items: center;
    gap: 5px;

    @media (max-width: 480px) {
      gap: 3px;
    }

    path {
      stroke: currentColor;
      fill: none;
    }
  }

  &:hover {
    background: ${({ active }) =>
      active ? mainGlobalDark.backgroundHover : "rgba(12, 26, 43, 0.08)"};
    border-color: ${({ active }) =>
      active ? mainGlobalDark.border : "rgba(12, 26, 43, 0.2)"};
    color: ${({ active }) =>
      active ? mainGlobalDark.white : mainGlobalDark.background};
    box-shadow: rgba(12, 26, 43, 0.08) 1px 2px 6px 0px;
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      rgba(12, 26, 43, 0.08) 1px 2px 6px 0px,
      0 0 0 3px rgba(0, 221, 115, 0.16);
  }
`;

export const PriceDetails = styled.div`
  width: 100%;
`;

export const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;

  .market-project-price-chart & {
    margin-bottom: 10px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;

    .market-project-price-chart & {
      margin-bottom: 8px;
    }
  }
`;

export const ChartsWrapper = styled.div`
  svg {
    width: 90%;
    height: auto;
    max-height: 480px;
  }

  & .green-chart {
    position: absolute;
    top: 170px;
  }

  & .purple-chart {
    position: absolute;
    top: 170px;
  }
`;

export const MonthWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
  gap: 8px;
  width: 100%;
  margin: 10px 0 0;
  padding-right: 58px;

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);
    text-align: center;
    white-space: nowrap;
    cursor: default;
  }

  div:first-child {
    text-align: left;
  }

  div:last-child {
    text-align: right;
  }

  & .high-item {
    margin-top: 24px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(52px, 1fr));
    padding-right: 48px;

    div:nth-child(even) {
      display: none;
    }
  }

  @media (max-width: 480px) {
    padding-right: 42px;

    div {
      font-size: 11px;
      line-height: 13px;
    }
  }
`;

export const TimelineWrapper = styled.div`
  width: 100%;
  height: 98px;
  box-sizing: border-box;
  margin-top: 12px;
  padding: 10px 12px;
  border: ${mainGlobalDarkBorder()};
  border-radius: 12px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2);

  @media (max-width: 520px) {
    height: auto;
    min-height: 112px;
    padding: 8px 7px 9px;
  }
`;

export const TimelineBars = styled.div<TimelineBarsProps>`
  display: grid;
  grid-template-columns: repeat(${({ $sectionCount }) => $sectionCount}, minmax(0, 1fr));
  align-items: end;
  gap: 0;
  min-height: 48px;
  border-top: ${mainGlobalDarkBorder()};
  border-bottom: ${mainGlobalDarkBorder()};
  background: ${mainGlobalDark.backgroundHover};
  overflow: visible;

  @media (max-width: 520px) {
    min-height: 54px;
  }
`;

export const TimelineSection = styled.div<TimelineSectionProps>`
  position: relative;
  display: flex;
  min-width: 0;
  height: 62px;
  align-items: flex-end;
  padding: 8px 6px 6px;
  border: 0;
  border-left: ${mainGlobalDarkBorder()};
  background: ${({ $active }) =>
    $active ? "rgba(0, 221, 115, 0.16)" : "transparent"};
  cursor: pointer;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;

  &:first-child {
    border-left: 0;
  }

  &:nth-child(even) {
    background: ${({ $active }) =>
      $active ? "rgba(0, 221, 115, 0.16)" : "rgba(255, 255, 255, 0.025)"};
  }

  &:hover,
  &:focus-visible {
    outline: none;
    background: ${({ $active }) =>
      $active ? "rgba(0, 221, 115, 0.2)" : "rgba(0, 221, 115, 0.08)"};
    box-shadow: inset 0 0 0 1px rgba(0, 221, 115, 0.12);
  }

  @media (max-width: 520px) {
    height: 54px;
    padding: 7px 4px 5px;
  }
`;

export const TimelineSectionBars = styled.span`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(2px, 1fr));
  align-items: end;
  gap: 2px;
  width: 100%;
  height: 100%;
  min-width: 0;

  @media (max-width: 520px) {
    gap: 1px;
  }
`;

export const TimelineBarSlot = styled.span`
  position: relative;
  display: flex;
  align-items: flex-end;
  align-self: stretch;
  min-width: 0;
  height: 100%;
`;

export const TimelineBar = styled.span<TimelineBarProps>`
  display: block;
  width: 100%;
  height: ${({ $height }) => `${$height}px`};
  min-height: 4px;
  border-radius: 3px 3px 0 0;
  pointer-events: auto;
  transform-origin: bottom;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    filter 0.2s ease;
  background: ${({ $variant }) => {
    if ($variant === "positive") return `${mainGlobalDark.positive}bd`;
    if ($variant === "negative") return "rgba(255, 88, 88, 0.72)";
    return "rgba(151, 151, 160, 0.56)";
  }};

  &:hover,
  &:focus-visible {
    opacity: 0.9;
    filter: saturate(1.18);
    transform: scaleY(1.12);
    outline: none;
  }
`;

export const TimelineTooltip = styled.div<{
  $placement: TimelineTooltipPlacement;
}>`
  position: absolute;
  bottom: calc(100% + 10px);
  z-index: 12;
  width: max-content;
  min-width: 178px;
  max-width: 228px;
  padding: 10px 11px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);
  color: ${mainGlobalDark.text};
  pointer-events: none;

  ${({ $placement }) => {
    if ($placement === "start") {
      return `
        left: 0;
        transform: translateX(0);
      `;
    }

    if ($placement === "end") {
      return `
        right: 0;
        transform: translateX(0);
      `;
    }

    return `
      left: 50%;
      transform: translateX(-50%);
    `;
  }}

  &::after {
    content: "";
    position: absolute;
    bottom: -5px;
    width: 9px;
    height: 9px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: ${mainGlobalDark.background};
    transform: rotate(45deg);

    ${({ $placement }) => {
      if ($placement === "start") return "left: 12px;";
      if ($placement === "end") return "right: 12px;";
      return "left: calc(50% - 5px);";
    }}
  }
`;

export const TimelineTooltipDate = styled.div`
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: ${mainGlobalDark.white};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 15px;
`;

export const TimelineTooltipRow = styled.div<{
  $variant?: "positive" | "negative" | "neutral";
}>`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 15px;

  span:first-child {
    color: ${mainGlobalDark.textMuted};
  }

  span:last-child {
    color: ${({ $variant }) => {
      if ($variant === "positive") return mainGlobalDark.positive;
      if ($variant === "negative") return "#ff7070";
      return mainGlobalDark.text;
    }};
    text-align: right;
  }
`;

export const TimelineLabels = styled.div<TimelineBarsProps>`
  display: grid;
  grid-template-columns: repeat(${({ $sectionCount }) => $sectionCount}, minmax(0, 1fr));
  gap: 0;
  margin-top: 7px;

  > span {
    min-width: 0;
    color: ${mainGlobalDark.textMuted};
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 14px;
    white-space: nowrap;
    cursor: default;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    padding: 0 6px;
  }

  > span:first-child {
    text-align: left;
  }

  > span:last-child {
    text-align: right;
  }

  .timeline-label-part,
  .timeline-label-separator {
    display: inline;
  }

  @media (max-width: 520px) {
    min-height: 29px;
    margin-top: 8px;

    > span {
      padding: 0 3px;
      font-size: 10px;
      line-height: 12px;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }

    .timeline-label-part {
      display: block;
      white-space: nowrap;
    }

    .timeline-label-separator + .timeline-label-part {
      margin-top: 2px;
      color: ${mainGlobalDark.text};
    }

    .timeline-label-separator {
      display: none;
    }
  }
`;

export const YearsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0px 20px;
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    color: var(--color-text-primary);
  }
`;

export const CompareWrapper = styled.div`
  position: relative;
  z-index: 30;

  @media (max-width: 768px) {
    position: static;
    width: auto;
    min-width: 0;

    & > button {
      width: 100%;
    }
  }
`;

export const ChartLoadingWrapper = styled.div<{
  $height?: string;
  $marginTop?: string;
  $compact?: boolean;
}>`
  position: relative;
  isolation: isolate;
  width: 100%;
  height: ${({ $height }) => $height || "430px"};
  min-height: ${({ $height }) => $height || "430px"};
  margin-top: ${({ $marginTop }) => $marginTop || "25px"};
  overflow: hidden;
  border: 1px solid rgba(12, 26, 43, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);

  @media (max-width: 768px) {
    height: ${({ $height }) => $height || "380px"};
    min-height: ${({ $height }) => $height || "380px"};
    margin-top: ${({ $marginTop }) => $marginTop || "18px"};
  }
`;

export const ChartLoadingLineLayer = styled.div<{ $compact?: boolean }>`
  position: absolute;
  inset: ${({ $compact }) => ($compact ? "28px 18px" : "34px 22px")};
  z-index: 1;

  @media (max-width: 768px) {
    inset: ${({ $compact }) => ($compact ? "22px 14px" : "28px 16px")};
  }
`;

export const ChartLoadingLineSvg = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;

  .chart-loader-mask {
    transform-box: fill-box;
    transform-origin: left center;
    animation: ${chartSkeletonDraw} 1.85s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  }

  .chart-loader-line {
    fill: none;
    stroke: #0c1a2b;
    stroke-linecap: round;
    stroke-width: 3.5;
  }
`;

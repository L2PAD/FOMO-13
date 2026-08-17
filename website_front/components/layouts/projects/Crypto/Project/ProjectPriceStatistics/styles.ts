import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard/index";
import { mainGlobalDark } from "../../../../../../styles/mainGlobalDark";

export const Wrapper = styled.div<{ $compact?: boolean }>`
  width: 100%;
  display: ${({ $compact }) => ($compact ? "grid" : "flex")};
  grid-template-columns: ${({ $compact }) =>
    $compact ? "minmax(0, 7fr) minmax(0, 3fr)" : "none"};
  grid-template-areas: ${({ $compact }) =>
    $compact
      ? `"chart stats"
         "secondary secondary"`
      : "none"};
  align-items: stretch;
  flex-direction: column;
  gap: ${({ $compact }) => ($compact ? "24px" : "18px")};
  margin-top: 0;

  @media (max-width: 1024px) {
    display: flex;
    grid-template-columns: none;
  }

  @media (max-width: 1024px) {
    gap: 16px;
  }
  @media (max-width: 575px) {
    gap: 12px;
  }
`;

export const ChartWrapper = styled.div<{ $compact?: boolean }>`
  position: relative;
  isolation: isolate;
  grid-area: chart;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;

  & > * {
    height: 100%;
  }

  .market-project-price-chart {
    border-top-left-radius: ${({ $compact }) => ($compact ? "0" : "16px")};
    border-top-right-radius: ${({ $compact }) => ($compact ? "0" : "16px")};
  }
`;

export const StatisticsWrapper = styled.div<{ $compact?: boolean }>`
  grid-area: stats;
  width: 100%;
  height: ${({ $compact }) => ($compact ? "100%" : "auto")};
  display: grid;
  grid-template-columns: ${({ $compact }) =>
    $compact ? "1fr" : "repeat(4, minmax(0, 1fr))"};
  grid-template-rows: ${({ $compact }) =>
    $compact ? "repeat(3, minmax(0, 1fr))" : "none"};
  align-items: stretch;
  gap: 16px;

  .market-stats-card {
    border-top-left-radius: ${({ $compact }) => ($compact ? "0" : "16px")};
    border-top-right-radius: ${({ $compact }) => ($compact ? "0" : "16px")};
  }

  @media (max-width: 1024px) {
    position: static;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: none;
    height: auto;
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  @media (max-width: 575px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

export const SecondaryStatisticsWrapper = styled.div`
  grid-area: secondary;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);

  .performance-card {
    gap: 12px;
  }

  .performance-values {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .performance-item {
    max-width: none;
    min-height: 56px;
    padding: 8px 6px;
  }

  @media (max-width: 900px) {
    .performance-values {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 575px) {
    .performance-values {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 380px) {
    .performance-values {
      grid-template-columns: 1fr;
    }
  }
`;

export const StatisticsCard = styled(BaseCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
  height: 100%;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 16px;

  @media (max-width: 575px) {
    gap: 14px;
  }
`;

export const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;

  span:not(.card-info-icon) {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

export const CardInfoTooltipWrapper = styled.span`
  position: relative;
  display: inline-flex;
  margin-left: auto;
`;

export const CardInfoIcon = styled.button.attrs({
  className: "card-info-icon",
  type: "button",
})`
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  cursor: help;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: rgba(12, 26, 43, 0.08);
    color: ${mainGlobalDark.background};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(0, 221, 115, 0.16);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const CardInfoTooltip = styled.span`
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  z-index: 20;
  width: min(236px, calc(100vw - 32px));
  padding: 10px 11px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
  color: ${mainGlobalDark.text};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  text-align: left;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;

  &::before {
    content: "";
    position: absolute;
    top: -5px;
    right: 8px;
    width: 9px;
    height: 9px;
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: ${mainGlobalDark.background};
    transform: rotate(45deg);
  }

  ${CardInfoTooltipWrapper}:hover &,
  ${CardInfoTooltipWrapper}:focus-within & {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 575px) {
    right: auto;
    left: 50%;
    transform: translate(-50%, -4px);

    &::before {
      right: auto;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
    }

    ${CardInfoTooltipWrapper}:hover &,
    ${CardInfoTooltipWrapper}:focus-within & {
      transform: translate(-50%, 0);
    }
  }
`;

export const CardIcon = styled.div`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 10px;
  border: 1px solid #eef2f6;
  background: var(--color-surface-subtle);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 17px;
    height: 17px;
  }
`;

export const CardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  min-height: 28px;

  & + & {
    padding-top: 14px;
    border-top: 1px solid #f0f2f5;
  }
`;

export const CardKey = styled.div`
  min-width: 0;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;

  @media (max-width: 575px) {
    font-size: 13px;
    line-height: 16px;
  }
`;

export const CardValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  min-width: 0;
  max-width: 52%;

  & > div {
    font-size: 15px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    color: var(--color-text-primary);
    text-align: right;
    overflow-wrap: anywhere;

    @media (max-width: 575px) {
      font-size: 13px;
      line-height: 16px;
    }
  }
`;

export const PerformanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .market-project-select {
    width: 96px;
    min-width: 96px;
  }
`;

export const PercentUpdates = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  row-gap: 12px;
  column-gap: 12px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

export const PercentUpdateItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  max-width: calc((100% - 24px) / 3);
  width: 100%;
  min-height: 62px;
  padding: 8px 10px;
  font-size: 14px;
  background: var(--color-surface-subtle);
  border: 1px solid #f0f2f5;
  border-radius: 8px;

  @media (max-width: 1024px) {
    max-width: calc((100% - 24px) / 3);
  }
  @media (max-width: 767px) {
    max-width: calc((100% - 10px) / 2);
    font-size: 13px;
  }
  @media (max-width: 480px) {
    max-width: calc((100% - 10px) / 2);
  }

  span {
    margin-left: 0px;
  }
`;

export const PercentKey = styled.div`
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);

  @media (max-width: 575px) {
    font-size: 12px;
  }
`;

import styled from "styled-components";
import { TableHeaderLeftWrapper } from "../CryptoMarket/styles";
import { mobileActionsRowStyles } from "../../../global/common/MobileActionsRow/styles";

export const BackersTabSwitcher = styled.div`
  display: flex;
  gap: 4px;
  max-width: fit-content;
  padding: 4px;
  border-radius: 8px;
  background: #f9f9f9;

  @media (max-width: 767px) {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
  }
`;

export const BackersTabButton = styled.button<{ isActive: boolean }>`
  border: none;
  border-radius: 8px;
  padding: 6px 20px;
  background: ${({ isActive }) =>
    isActive ? "var(--color-white)" : "transparent"};
  box-shadow: ${({ isActive }) =>
    isActive ? "2px 2px 8px 0px #00053014" : "none"};
  color: ${({ isActive }) =>
    isActive ? "var(--color-primary)" : "var(--color-text-muted)"};
  cursor: pointer;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17px;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }

  &:active {
    opacity: 0.5;
  }

  @media (max-width: 767px) {
    flex: 1 0 auto;
    padding: 6px 14px;
  }
`;

export const BackersMobileContent = styled.div`
  @media (min-width: 768px) {
    display: none;
  }
`;

export const BackersDesktopAnalyticsOnly = styled.div`
  display: contents;

  @media (max-width: 767px) {
    display: none;
  }
`;

export const BackersDesktopSpotlight = styled.div`
  margin-bottom: 20px;

  @media (max-width: 767px) {
    display: none;
  }
`;

export const BackersHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;

  h1 {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    font-size: 32px;
    line-height: 1;
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  .tooltip-button {
    margin-top: 4px;
    display: flex;
  }
`;

export const BackersHeaderRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 1;
  min-width: 0;

  .search-section {
    position: relative;
    flex: 0 1 240px;
    min-width: 220px;
  }

  .search-section .crypto-market-search {
    width: 100%;
  }

  .search-section input {
    width: 100%;
    height: 40px;
  }

  &.ecosystem-header-right {
    gap: 24px;
  }

  &.ecosystem-header-right .search-section {
    flex: 0 1 494px;
    min-width: 320px;
  }

  @media (max-width: 1120px) {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
`;

export const BackersIntelBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8a53ff;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  line-height: 17px;
  white-space: nowrap;

  svg {
    flex: 0 0 auto;
  }

  .pro-badge {
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(138, 83, 255, 0.12);
    color: #8a53ff;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 15px;
  }
`;

export const BackersGraphSearchAnchor = styled.div`
  position: relative;
  width: 100%;
`;

export const BackersHeaderActions = styled(TableHeaderLeftWrapper)`
  flex-wrap: wrap;
  justify-content: flex-end;

  .header-filter {
    display: flex;
    min-width: 0;
  }

  @media (max-width: 768px) {
    ${mobileActionsRowStyles}

    .backers-action-group {
      margin-left: 0;
    }
  }
`;

export const BackersHeaderIconActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
`;

export const BackersContentModeActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
`;

export const BackersContentModeButton = styled.button<{ isActive: boolean }>`
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${({ isActive }) =>
    isActive ? "rgba(4, 165, 132, 0.12)" : "#f9f9f9"};
  color: ${({ isActive }) =>
    isActive ? "var(--color-primary)" : "var(--color-text-muted)"};
  transition: all 0.3s ease;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
  }

  span {
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    line-height: 16px;
  }

  &:hover {
    background: ${({ isActive }) =>
      isActive ? "rgba(4, 165, 132, 0.18)" : "var(--input-hover)"};
  }

  &:active {
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    min-height: 36px;
    padding: 6px 10px;
    gap: 6px;

    span {
      font-size: 13px;
      line-height: 15px;
    }
  }
`;

export const BackersAdBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4aa2ff 0%, #6775ff 100%);
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 1;
  box-shadow: 0px 8px 20px rgba(74, 162, 255, 0.24);
`;

export const BackersMobileTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const BackersMobileGraphTools = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

export const BackersEcosystemGraphShell = styled.div`
  position: relative;
  width: 100%;
  min-height: 520px;
  overflow: hidden;
  border-radius: 8px;
  background: #0a0e1a;

  canvas {
    display: block;
  }

  @media (max-width: 767px) {
    min-height: 460px;
  }
`;

export const BackersGraphIntelligenceSection = styled.section`
  width: 100%;
  margin-top: 18px;
  padding: 0 0 24px;
  background: transparent;
  color: var(--color-text-primary);
`;

export const BackersGraphHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  &.snapshot {
    margin-top: 18px;
    margin-bottom: 12px;
  }

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 24px;
    line-height: 29px;
    font-weight: var(--font-weight-semibold);
  }

  div {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 17px;
    font-weight: var(--font-weight-semibold);
  }

  div strong {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 767px) {
    align-items: flex-start;
    flex-direction: column;

    h2 {
      font-size: 20px;
      line-height: 24px;
    }
  }
`;

export const BackersGraphIntelligenceGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(
      0,
      2fr
    );
  gap: 18px;

  &.lower {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2.06fr);
    margin-top: 18px;
  }

  @media (max-width: 1180px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    &.lower {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;

    &.lower {
      grid-template-columns: 1fr;
    }
  }
`;

export const BackersGraphCard = styled.div`
  min-height: 206px;
  min-width: 0;
  padding: 22px 24px;
  border-radius: 8px;
  background: #f7fbfd;
  border: 1px solid #e8f0f6;

  &.highlights {
    min-height: 206px;
  }

  h3 {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    margin: 0 0 22px;
    color: var(--color-text-primary);
    font-size: 16px;
    line-height: 20px;
    font-weight: var(--font-weight-semibold);
  }

  &.highlights h3 {
    justify-content: space-between;
  }

  h3 > svg {
    color: var(--color-primary);
    flex: 0 0 auto;
  }

  h3 > span {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  p {
    margin: 0 0 16px;
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 18px;
    text-align: justify;
  }

  p:last-child {
    margin-bottom: 0;
  }
`;

export const BackersGraphBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0171d9;
  font-size: 14px;
  line-height: 17px;
  font-weight: var(--font-weight-medium);
  white-space: nowrap;

  svg {
    flex: 0 0 auto;
  }
`;

export const BackersGraphList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const BackersGraphListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;

  span {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  span i {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 50%;
  }

  strong {
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 17px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const BackersGraphMetricGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px 20px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;

  strong {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    text-align: right;
  }

  strong.high {
    color: var(--color-primary);
  }

  strong.medium {
    color: #f59e0b;
  }

  strong.low {
    color: var(--color-text-primary);
  }
`;

export const BackersGraphSnapshot = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const BackersGraphSnapshotCard = styled.div`
  min-height: 80px;
  padding: 14px 18px;
  border-radius: 8px;
  background: #f7fbfd;
  border: 1px solid #e8f0f6;
  text-align: center;

  strong {
    display: block;
    margin-bottom: 14px;
    color: var(--color-text-primary);
    font-size: 20px;
    line-height: 24px;
    font-weight: var(--font-weight-semibold);
  }

  span {
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 17px;
  }
`;

export const BackersGraphContextBadge = styled.span<{ $color: string }>`
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 4px;
  background: ${({ $color }) => $color};
  color: var(--color-white);
  font-size: 10px;
  line-height: 1;
  font-weight: var(--font-weight-semibold);
`;

export const BackersGraphTrendCard = styled(BackersGraphCard)`
  min-height: 266px;

  h3 {
    justify-content: space-between;
  }

  h3 strong {
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 17px;
  }

  .trend-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 190px;
    gap: 24px;
    align-items: center;
  }

  .trend-metrics {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 16px;
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 17px;
  }

  .trend-metrics strong {
    color: var(--color-text-primary);
    font-size: 16px;
    line-height: 20px;
    text-align: right;
  }

  .trend-metrics small {
    grid-column: 1 / -1;
    margin: -4px 0 8px;
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 15px;
    text-align: right;
  }

  @media (max-width: 680px) {
    .trend-body {
      grid-template-columns: 1fr;
    }

    .trend-metrics small {
      text-align: left;
    }
  }
`;

export const BackersGraphChart = styled.div`
  min-width: 0;
  overflow: hidden;

  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  line {
    stroke: rgba(115, 128, 148, 0.18);
    stroke-width: 1;
  }

  text {
    fill: var(--color-text-primary);
    font-size: 12px;
  }

  path {
    fill: none;
    stroke-width: 2;
  }

  .relations {
    stroke: #0171d9;
  }

  .entities {
    stroke: var(--color-primary);
  }

  .relations-dot {
    fill: #0171d9;
  }

  .entities-dot {
    fill: var(--color-primary);
  }
`;

export const BackersGraphTableHeader = styled.div`
  margin-top: 36px;
  margin-bottom: 18px;

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 24px;
    line-height: 29px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const BackersGraphRelationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;

  th {
    padding: 12px 10px;
    background: #f7fbfd;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
    text-align: left;
  }

  td {
    padding: 10px;
    border-bottom: 1px solid #e8f0f6;
    color: var(--color-text-primary);
  }

  .type-cell,
  .entity-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .type-cell i {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 50%;
  }

  .active {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
  }

  .empty {
    padding: 28px 10px;
    color: var(--color-text-muted);
    text-align: center;
  }

  @media (max-width: 740px) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

export const BackersGraphRelationAvatar = styled.span<{ $color: string }>`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: var(--color-white);
  font-size: 12px;
  line-height: 1;
  font-weight: var(--font-weight-semibold);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const BackersGraphTableFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 18px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 17px;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const BackersGraphPagination = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  button {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--color-primary);
    cursor: pointer;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    transition:
      opacity 0.2s ease,
      background 0.2s ease;
  }

  button.active {
    background: var(--color-primary);
    color: var(--color-white);
  }

  button:disabled {
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  button:not(:disabled):hover {
    background: rgba(4, 165, 132, 0.12);
  }
`;

export const BackersGraphIntelCtaBanner = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--Stroke, #f0f2f5);
  border-top: 1px solid #8161ff;
  background: var(--color-white);
  box-shadow: 2px 2px 8px 0px #00053014;
  color: var(--color-text-primary);

  .banner-icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #ece7ff;
    color: #8a53ff;
  }

  .banner-copy {
    min-width: 0;
  }

  .banner-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-family: Gilroy, sans-serif;
    font-size: 20px;
    line-height: 26px;
    font-weight: var(--font-weight-semibold);
    font-style: normal;
    letter-spacing: 0;
  }

  .banner-title-row span {
    padding: 2px 9px;
    border: 1px solid #dfcdf8;
    border-radius: 999px;
    background: #ebe7fb;
    color: #8161ff;
    font-size: 12px;
    line-height: 15px;
    font-weight: var(--font-weight-semibold);
  }

  p {
    margin: 0;
    color: var(--main-gray);
    font-family: Gilroy, sans-serif;
    font-size: 14px;
    line-height: 18px;
    font-weight: var(--font-weight-regular);
    font-style: normal;
    letter-spacing: 0;
  }

  .banner-features {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 20px;
  }

  .banner-features span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--main-gray);
    font-size: 14px;
    line-height: 17px;
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
  }

  .banner-features svg {
    flex: 0 0 auto;
    color: var(--main-gray);
  }

  button {
    height: 40px;
    min-width: 172px;
    border: none;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 18px;
    background: #8a53ff;
    color: var(--color-white);
    cursor: pointer;
    font-size: 14px;
    line-height: 17px;
    font-weight: var(--font-weight-medium);
    transition:
      background 0.2s ease,
      opacity 0.2s ease;
    white-space: nowrap;
  }

  button:hover {
    background: #7844e8;
  }

  button:active {
    opacity: 0.8;
  }

  @media (max-width: 720px) {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: flex-start;

    button {
      grid-column: 1 / -1;
      width: 100%;
    }
  }

  @media (max-width: 420px) {
    .banner-title-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }
  }
`;

export const BackersPersonsAnalytics = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 0;

  & > div {
    flex: 1 1 calc(50% - 8px);
    max-width: calc(50% - 8px);
    min-width: 0;
  }

  @media (max-width: 768px) {
    flex-direction: column;

    & > div {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }
`;

export const BackersAnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 12px 0 16px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const BackersAnalyticsSummaryCard = styled.div`
  padding: 14px;
  border-radius: 8px;
  background: #f5fbfd;
  min-width: 0;

  span {
    display: block;
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 15px;
    margin-bottom: 6px;
  }

  strong {
    color: var(--color-text-primary);
    font-size: 20px;
    line-height: 24px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const BackersAnalyticsChartCard = styled.div`
  min-height: 320px;
  padding: 20px;
  border-radius: 8px;
  background: #f5fbfd;
  min-width: 0;

  h3 {
    margin: 0 0 12px;
    color: var(--color-text-primary);
    font-size: 16px;
    line-height: 20px;
    font-weight: var(--font-weight-semibold);
  }

  .empty-state {
    height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-size: 14px;
  }
`;

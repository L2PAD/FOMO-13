import styled from "styled-components";
import { TableHeaderLeftWrapper } from "../CryptoMarket/styles";
import { mobileActionsRowStyles } from "../../../global/common/MobileActionsRow/styles";

export const FomiesMobileContent = styled.div`
  @media (min-width: 768px) {
    display: none;
  }
`;

export const FomiesHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

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

export const FomiesHeaderRight = styled.div`
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

  @media (max-width: 1320px) {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
  }
`;

export const FomiesHeaderStats = styled.div`
  display: flex;
  align-items: stretch;
  min-width: 0;

  @media (max-width: 1320px) {
    order: 3;
    width: 100%;
    overflow-x: auto;
    padding-top: 4px;
  }
`;

export const FomiesHeaderStat = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  min-height: 48px;
  white-space: nowrap;

  & + & {
    border-left: 1px solid #eef0f4;
  }

  svg {
    flex: 0 0 auto;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label {
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 15px;
  }

  .stat-value {
    color: var(--color-text-primary);
    font-size: 16px;
    line-height: 19px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const FomiesHeaderActions = styled(TableHeaderLeftWrapper)`
  max-width: none;
  overflow-x: visible;
  justify-content: flex-end;

  .header-filter {
    display: flex;
    min-width: 0;
  }

  @media (max-width: 1320px) {
    order: 2;
  }

  @media (max-width: 768px) {
    ${mobileActionsRowStyles}
  }
`;

export const FomiesMobileActions = styled(TableHeaderLeftWrapper)`
  @media (max-width: 768px) {
    &.fomies-left .close-modal-icon {
      width: 32px;
      min-width: 32px;
      height: 32px;
      flex: 0 0 32px;
      margin-left: auto;
      padding: 4px;
      justify-content: center;
    }
  }
`;

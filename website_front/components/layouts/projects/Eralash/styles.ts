import styled from "styled-components";
import { TableHeaderLeftWrapper } from "../CryptoMarket/styles";
import { mobileActionsRowStyles } from "../../../global/common/MobileActionsRow/styles";

export const EralashMobileContent = styled.div`
  @media (min-width: 768px) {
    display: none;
  }
`;

export const EralashHeaderLeft = styled.div`
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

export const EralashHeaderRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 1;
  min-width: 0;

  .search-section {
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

  @media (max-width: 1120px) {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
`;

export const EralashHeaderActions = styled(TableHeaderLeftWrapper)`
  flex-wrap: wrap;
  justify-content: flex-end;

  .header-filter {
    display: flex;
    min-width: 0;
  }

  @media (max-width: 768px) {
    ${mobileActionsRowStyles}
  }
`;

export const EralashHeaderIconActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
`;

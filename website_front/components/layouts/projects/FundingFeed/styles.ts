import styled from "styled-components";
import { TableHeaderLeftWrapper } from "../CryptoMarket/styles";
import { mobileActionsRowStyles } from "../../../global/common/MobileActionsRow/styles";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 27px auto;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const HeaderSwitchWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
    margin-top: 10px;
  }

  @media (max-width: 480px) {
    gap: 6px;
    margin-top: 8px;
  }
`;

export const SwitchButton = styled.button<{ active?: boolean }>`
  border: none;
  padding: 8px 10px;
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) =>
    active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)"};
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"};
  white-space: nowrap;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 15px;
    line-height: 18px;
  }

  @media (max-width: 480px) {
    padding: 5px 7px;
    font-size: 14px;
    line-height: 17px;
  }

  &:hover {
    opacity: 0.8;
  }
`;
export const ButtonsWrapper = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) {
    margin-top: 20px;
    gap: 12px;
  }

  @media (max-width: 480px) {
    margin-top: 16px;
    gap: 8px;
    flex-direction: column;
    align-items: stretch;
  }
`;

export const FundingFeedDesktopSpotlight = styled.div`
  margin-bottom: 20px;

  @media (max-width: 767px) {
    display: none;
  }
`;

export const FundingFeedMobileContent = styled.div`
  @media (min-width: 768px) {
    display: none;
  }
`;

export const FundingFeedMobileActions = styled(TableHeaderLeftWrapper)`
  margin-bottom: 1px;
`;

export const FundingFeedHeaderLeft = styled.div`
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

export const FundingFeedHeaderRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 1;
  min-width: 0;

  .search-section {
    flex: 0 1 260px;
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

    & > :last-child {
      width: 100%;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
  }
`;

export const FundingFeedHeaderActions = styled(TableHeaderLeftWrapper)`
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

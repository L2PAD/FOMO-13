import styled from "styled-components";
import Link from "next/link";
import ViewCard from "../../../global/ViewCard";
import { TableHeaderLeftWrapper } from "../CryptoMarket/styles";
import { mobileActionsRowStyles } from "../../../global/common/MobileActionsRow/styles";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 32px auto 0;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }

  & > p {
    font-size: 18px;
  }
`;

export const MainInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 24px;
  }

  @media (max-width: 768px) {
    gap: 20px;
  }
`;

export const MainInfoDescription = styled.div`
  flex: 1;
  max-width: 50%;

  @media (max-width: 1024px) {
    max-width: 100%;
  }

  .main-title {
    font-size: 32px;
    font-weight: var(--font-weight-semibold);
    line-height: 38px;
    color: var(--color-text-primary);
    margin-bottom: 16px;

    @media (max-width: 768px) {
      font-size: 28px;
      line-height: 32px;
      margin-bottom: 12px;
    }

    @media (max-width: 480px) {
      font-size: 24px;
      line-height: 28px;
      margin-bottom: 10px;
    }
  }

  p {
    font-size: 16px;
    line-height: 24px;
    color: var(--color-text-muted);

    @media (max-width: 768px) {
      font-size: 15px;
      line-height: 22px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
      line-height: 20px;
    }
  }
`;

export const ProjectsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 16px auto 0;
  gap: 2px;

  @media (max-width: 1204px) {
    gap: 12px;
  }

  @media (max-width: 1024px) {
    gap: 16px;
  }

  @media (max-width: 768px) {
    gap: 14px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

export const ProjectCardItem = styled(ViewCard)`
  height: 100% !important;
  padding: 16px;
`;

export const MainTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const CryptoMobileContent = styled.div`
  .bg-switch {
    display: none;
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

export const CryptoDesktopTabsWrapper = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

export const CryptoHeaderTitleGroup = styled.div`
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

export const CryptoHeaderRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 1;
  min-width: 0;

  .search-section {
    flex: 0 1 200px;
    min-width: 120px;
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

export const CryptoHeaderActions = styled(TableHeaderLeftWrapper)`
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

export const CryptoHeaderIconActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
`;

export const ProjectCardLink = styled(Link)`
  margin: 5px;
  width: 32.4%;

  & > div {
    width: 100% !important;
  }

  @media (max-width: 1204px) {
    width: 32% !important;
    margin: 4px;
  }

  @media (max-width: 932px) {
    width: 48% !important;
    margin: 4px;
  }

  @media (max-width: 631px) {
    width: 100% !important;
    margin: 3px 0;
  }
`;

export const HeaderWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
    gap: 16px;
  }

  @media (max-width: 768px) {
    gap: 12px;
    margin-top: 12px;
  }
`;

export const LeftHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  overflow: auto;

  & > div {
    width: fit-content;
  }

  @media (max-width: 768px) {
    gap: 12px;
  }

  & .fomonauts {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    background: #f9f9f9;
    border-radius: 4px;

    @media (max-width: 480px) {
      padding: 6px 8px;
      gap: 8px;
    }
  }

  & .fomonauts-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: max-content;
  }

  & .fomonauts-key {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    letter-spacing: 0%;
    color: var(--main-gray);
    @media (max-width: 480px) {
      font-size: 13px;
    }
  }

  & .fomonauts-value {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    letter-spacing: 0%;
    color: var(--main-black);

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }
`;

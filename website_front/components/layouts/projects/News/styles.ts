import styled from "styled-components";
import Typography from "../../../global/common/Typography";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 32px auto;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const PageDescriptionWrapper = styled.div`
  @media (max-width: 768px) {
    h1 {
      font-size: 28px;
      line-height: 34px;
    }

    p {
      font-size: 14px;
      line-height: 18px;
    }
  }
`;

export const PageDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const ContentWrapper = styled.div`
  margin-top: 16px;

  .sort {
    display: flex;
    justify-content: flex-end;
  }
`;

export const HeaderTags = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const TabsWrapper = styled.div`
  margin: 40px 0;

  @media (max-width: 768px) {
    margin: 30px 0;
  }
`;

export const BuzzHeaderTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .tooltip-button {
    display: flex;
    margin-top: 3px;
  }

  h1 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 32px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    white-space: nowrap;
  }

  @media (max-width: 767px) {
    h1 {
      font-size: 28px;
    }
  }
`;

export const BuzzHeaderTabs = styled.div`
  flex: 0 0 auto;
  min-width: 0;
  max-width: 100%;

  .buzz-header-tabs {
    width: auto;
    padding: 4px;
    border: 0;
    border-radius: 8px;
    background: #f9f9f9;
    gap: 4px;
    overflow-x: auto;
  }

  .buzz-header-tabs .tab-wrapper {
    flex: 0 0 auto;
    width: auto;
    min-width: 0;
  }

  .buzz-header-tabs .tab {
    width: auto;
    min-width: 0;
    padding: 7px 16px;
    border: 0;
    border-radius: 6px;
    color: var(--color-text-muted);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    white-space: nowrap;
  }

  .buzz-header-tabs .tab:hover {
    border: 0;
    color: #545e6c;
  }

  .buzz-header-tabs .tab.active {
    background: var(--color-white);
    color: var(--color-primary);
    box-shadow: 2px 2px 8px 0 #0005300d;
  }

  @media (max-width: 1120px) {
    order: 3;
    flex: 1 1 100%;
    min-width: 0;

    .buzz-header-tabs {
      width: 100%;
    }
  }
`;

export const BuzzHeaderRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;

  @media (max-width: 1120px) {
    flex: 1 1 420px;
  }

  @media (max-width: 767px) {
    width: 100%;
    flex: 1 1 100%;
    align-items: stretch;
  }
`;

export const BuzzSearchWrapper = styled.div`
  position: relative;
  flex: 0 1 280px;
  min-width: 220px;

  .inputRootWrapper,
  .inputRootWrapper > div {
    width: 100%;
  }

  .buzz-news-search input {
    width: 100%;
    height: 40px;
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: var(--font-weight-medium);
  }

  .buzz-news-search input::placeholder {
    color: var(--color-text-soft);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
  }

  @media (max-width: 767px) {
    flex: 1 1 auto;
    min-width: 0;
  }
`;

export const BuzzFilterWrapper = styled.div`
 
`;

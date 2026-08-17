import styled from "styled-components";

export const Wrapper = styled.div`
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;

  &.mobile-header-actions {
    display: none;
  }

  .create-deal {
    height: 35px;
    font-size: 12px;
  }

  .contact-btn {
    height: 35px;
    font-size: 12px;

    span {
      font-size: 12px;
      line-height: 16px;
    }
  }

  @media (max-width: 1120px) {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    width: 100%;
  }

  @media (max-width: 767px) {
    &.mobile-header-actions {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      width: 100%;
    }

    &.mobile-header-actions .mobile-promoted {
      width: 100%;
      display: flex;
      justify-content: flex-start;
    }

    &.mobile-header-actions .mobile-promoted > div {
      width: 100%;
      max-width: 100%;
    }

    &.mobile-header-actions .my-deals-mobile-balance {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    &.mobile-header-actions .my-deals-mobile-balance .contact-btn {
      width: 100% !important;
      max-width: none;
      height: 39px;
    }

    &.mobile-header-actions .my-deals-mobile-balance .contact-btn span {
      display: inline !important;
    }

    &.mobile-header-actions .create-deal {
      width: 100%;
      height: 39px;
      font-size: 12px;
    }
  }
`;

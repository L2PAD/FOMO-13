import styled from "styled-components";
import {
  CardWrapper,
  ExchangeBody,
  ExchangesHeader,
  TableWrapper,
} from "../../../../../global/Tables/ViewTable/ExchangesTable/styles";
import { HeaderWrapper } from "../../../../../global/Tables/ViewTable/ExchangesTable/Header/styles";
import { TableHeaderRightWrapper } from "../../../CryptoMarket/styles";
import { mainGlobalDark } from "../../../../../../styles/mainGlobalDark";

export const Wrapper = styled.div`
  ${TableWrapper} {
    background: rgb(255, 255, 255);
    border: 1px solid var(--Stroke, #f0f2f5);
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
    border-radius: 12px;

    .sticky {
      background: var(--color-white) !important;
    }
  }

  ${CardWrapper} {
    .sticky {
      background: var(--color-white);
    }
  }

  ${ExchangeBody} {
    width: 100%;
  }

  ${ExchangesHeader} {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h2 {
      color: var(--color-text-primary);
      font-size: 20px;
      line-height: 24px;
    }
  }

  ${TableHeaderRightWrapper} {
    button {
      background: ${mainGlobalDark.background};
      border: 1px solid ${mainGlobalDark.border};
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
      color: ${mainGlobalDark.text};

      svg {
        color: currentColor;
      }

      &.selectedSort {
        background: ${mainGlobalDark.backgroundHover} !important;
        border-color: rgba(0, 221, 115, 0.34);
        color: ${mainGlobalDark.positive};
      }

      &:hover {
        background: ${mainGlobalDark.backgroundHover};
        border-color: rgba(0, 221, 115, 0.24);
        color: ${mainGlobalDark.white};
      }
    }
  }

  @media (max-width: 1024px) {
    ${ExchangesHeader} {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    ${TableHeaderRightWrapper} {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      /* allow horizontal scroll if needed */
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;

      button {
        padding: 6px 10px;
      }
    }
  }

  @media (max-width: 768px) {
    ${ExchangeBody} {
      margin: 0 -12px;
      padding: 0 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    ${TableWrapper} {
      min-width: 660px;
      padding: 14px;
      border-radius: 10px;
    }

    ${HeaderWrapper},
    ${CardWrapper} {
      grid-template-columns: 44px 130px 90px 140px 92px 92px;
      padding: 0 8px;
    }

    ${CardWrapper} {
      min-height: 56px;

      .sticky {
        padding: 12px 0 12px 8px !important;
      }
    }

    ${ExchangesHeader} {
      margin-bottom: 14px;

      h2 {
        font-size: 18px;
        line-height: 22px;
      }
    }

    ${TableHeaderRightWrapper} {
      flex-wrap: nowrap;
      padding-bottom: 2px;

      button {
        min-height: 36px;
        flex: 0 0 auto;
        white-space: nowrap;
      }
    }
  }

  @media (max-width: 575px) {
    ${TableHeaderRightWrapper} {
      gap: 6px;

      button {
        font-size: 13px;
        padding: 6px 8px;
      }
    }
  }
`;

export const SkeletonCell = styled.div<{ width?: string; round?: boolean }>`
  width: ${({ width }) => width || "100%"};
  height: ${({ round }) => (round ? "28px" : "14px")};
  border-radius: ${({ round }) => (round ? "50%" : "7px")};
  background: linear-gradient(90deg, #eaf3f6 0%, #f7fbfc 45%, #eaf3f6 100%);
  background-size: 220% 100%;
  animation: exchangeSkeletonShimmer 1.35s ease-in-out infinite;

  @keyframes exchangeSkeletonShimmer {
    0% {
      background-position: 120% 0;
    }

    100% {
      background-position: -120% 0;
    }
  }
`;

export const SkeletonExchangeCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

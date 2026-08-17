import styled from "styled-components";
import BaseCard from "../../../global/common/BaseCard";
import {
  mobileActionControlStyles,
  mobileActionsRowStyles,
} from "../../../global/common/MobileActionsRow/styles";

export const PageWrapper = styled.div`
  padding: 20px 36px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }

  @media (max-width: 768px) {
    padding: 16px 12px;
    margin-top: 8px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }

  &.news-page-wrapper {
    display: flex;
    gap: 20px;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
    }
  }
`;

export const DesktopTabs = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const MobileHighlightsTabsWrapper = styled.div`
  display: none;

  @media (max-width: 768px) {
    --mobile-highlights-slide-height: 365px;
    display: block;
    width: 100%;
    margin-top: 20px;
    margin-bottom: 16px;

    .mobile-highlights-swiper {
      width: 100%;
      overflow: visible;
      padding-bottom: 28px;
    }

    .mobile-highlights-swiper .swiper-wrapper {
      align-items: stretch;
    }

    .mobile-highlights-swiper .swiper-slide {
      height: var(--mobile-highlights-slide-height);
      display: flex;
    }

    .mobile-highlights-swiper .swiper-slide > * {
      width: 100%;
      height: 100%;
      min-height: 0;
    }

    .swiper-pagination {
      bottom: 0 !important;
    }

    .swiper-pagination-bullet {
      background: var(--color-primary);
      opacity: 0.35;
    }

    .swiper-pagination-bullet-active {
      opacity: 1;
    }
  }
`;

export const MobileStatsSlideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 12px;
  height: 100%;
  align-items: stretch;

  .statistics-card {
    min-width: 0;
    width: 100%;
    height: 100%;
  }

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

export const MobileHighlightPanel = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  overflow: hidden;

  & > * {
    flex: 1;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
`;

export const MainInfo = styled.div`
  display: flex;
  max-height: 100%;
  height: 100%;
  gap: 20px;
  position: relative;

  &.crypto-market {
    display: none;

    @media (max-width: 768px) {
      display: flex;
      z-index: 100;
    }
  }

  @media (max-width: 767px) {
    gap: 20px;
    display: flex;
    flex-direction: column;
  }

  & .contact-btn {
    margin-top: 25px;
    max-width: 200px;
    font-size: 14px;
    width: 100%;

    @media (max-width: 768px) {
      margin-top: 20px;
      max-width: 100%;
    }
  }
`;

export const MainInfoDescription = styled.div`
  display: flex;
  max-width: 50%;
  flex-direction: column;
  width: 100%;

  @media (max-width: 1024px) {
    max-width: 100%;
  }

  & .main-title {
    font-weight: var(--font-weight-semibold);

    @media (max-width: 768px) {
      font-size: 24px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
    }
  }

  & .main-subtitle {
    line-height: 26px;
    font-size: 16px;
    color: var(--main-black);
  }

  p {
    margin-bottom: 0px;
    display: inline;
    line-height: 26px;
    font-size: 16px;
    color: var(--main-black);

    @media (max-width: 768px) {
      font-size: 14px;
      line-height: 22px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
      line-height: 20px;
    }
  }

  .description-container {
    margin-top: 12px;
    display: inline;
    margin-bottom: auto;

    button {
      display: inline;
      font-size: 14px;
      line-height: 22px;
      color: var(--color-info);
      padding-left: 4px;
    }

    .collapsed {
      line-clamp: 2;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
    }
  }
`;

export const MainInfoStatistics = styled.div`
  width: 100%;

  .statistics-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 20px;
    width: 100%;
  }

  .statistics-slider {
    display: none;
  }

  && .statistics-card {
    min-width: 0;
    width: auto;
  }

  @media (max-width: 1360px) {
    .statistics-grid {
      gap: 12px;
    }
  }

  @media (max-width: 1224px) {
    .statistics-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }
  }

  @media (max-width: 500px) {
    .statistics-grid {
      display: none;
    }

    && .statistics-slider .statistics-card {
      width: 100%;
      min-width: 0;
    }

    .statistics-slider {
      display: block;
      width: 100%;

      .swiper {
        width: 100%;
        overflow: visible;
      }

      .swiper-slide {
        height: auto;
      }

      .swiper-pagination {
        position: static;
        margin-top: 12px;
      }
    }
  }

  & .index-label {
    text-align: center;
    font-weight: var(--font-weight-semibold);
    margin-top: 10px;

    @media (max-width: 768px) {
      margin-top: 8px;
      font-size: 14px;
    }

    @media (max-width: 480px) {
      margin-top: 0;
      font-size: 12px;
    }
  }
`;

export const CardsWrapper = styled(BaseCard)`
  position: relative;
  display: flex;
  overflow-x: auto;
  padding-bottom: 5px;
  height: 100%;
  width: 100%;

  &.column {
    flex-direction: column;
    overflow: hidden;
    min-height: 0;

    > .body {
      margin-top: 20px;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      @media (max-width: 768px) {
        margin-top: 0px;
      }
    }

    > .body > * {
      flex: 1;
      min-height: 0;
    }
  }

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }

  & .left-btn {
    position: absolute;
    z-index: 1;
    padding: 6px;
    left: 0px;
    top: 15%;
    height: 85%;
    width: 40px;
    background: linear-gradient(
      to right,
      white 0%,
      white 80%,
      transparent 100%
    );
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    @media (max-width: 768px) {
      width: 32px;
      padding: 4px;
      top: 20%;
      height: 60%;
    }

    @media (max-width: 480px) {
      width: 28px;
      padding: 3px;
      top: 25%;
      height: 50%;
    }

    &:hover {
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(255, 255, 255, 0.8) 80%,
        transparent 100%
      );

      svg path {
        stroke: var(--color-primary);
      }
    }

    svg {
      @media (max-width: 768px) {
        width: 20px;
        height: 20px;
      }

      @media (max-width: 480px) {
        width: 18px;
        height: 18px;
      }
    }
  }

  & .right-btn {
    position: absolute;
    height: 85%;
    top: 15%;
    right: 0px;
    z-index: 1;
    padding: 6px;
    background: linear-gradient(to left, white 0%, white 80%, transparent 100%);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    @media (max-width: 768px) {
      width: 32px;
      padding: 4px;
      top: 20%;
      height: 60%;
    }

    @media (max-width: 480px) {
      width: 28px;
      padding: 3px;
      top: 25%;
      height: 50%;
    }

    &:hover {
      background: linear-gradient(
        to left,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(255, 255, 255, 0.8) 80%,
        transparent 100%
      );

      svg path {
        stroke: var(--color-primary);
      }
    }

    svg {
      @media (max-width: 768px) {
        width: 20px;
        height: 20px;
      }

      @media (max-width: 480px) {
        width: 18px;
        height: 18px;
      }
    }
  }
`;

export const StatisticsCardLine = styled.hr`
  margin: 14px 0 26px;
  border: none;
  border-bottom: 1px solid #e9ecf1;

  @media (max-width: 768px) {
    margin: 10px 0;
  }
`;

export const MarketCapTitle = styled.h3`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  margin-bottom: 12px;
  text-align: start;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 10px;
    line-height: 1;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 8px;
  }
`;

export const CardWrapper = styled.div`
  min-width: 275px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  margin-top: 0px;
  padding: 0px;
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    min-width: 250px;
  }

  @media (max-width: 768px) {
    min-width: 220px;
  }

  @media (max-width: 480px) {
    min-width: 200px;
  }
`;

export const CardTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (max-width: 480px) {
    margin-bottom: 12px;
    gap: 6px;
  }

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;

    @media (max-width: 768px) {
      font-size: 15px;
      line-height: 18px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
      line-height: 17px;
    }
  }

  button {
    border: none;
    background: none;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);

    @media (max-width: 768px) {
      font-size: 14px;
      line-height: 16px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 15px;
    }
  }
`;

export const CardContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  margin-bottom: 0px;
  scrollbar-width: none;

  @media (max-width: 768px) {
    gap: 14px;
    margin-bottom: 0px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-bottom: 0px;
  }
`;

export const CardContentItem = styled.div<{ $clickable?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  min-width: 0;
  border-radius: 8px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ $clickable }) =>
      $clickable ? "rgba(255, 255, 255, 0.04)" : "transparent"};
  }

  & > :last-child {
    flex: 0 0 auto;
  }

  & > div > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;

    @media (max-width: 768px) {
      font-size: 14px;
      line-height: 16px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 15px;
    }
  }

  & > div > span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
    display: flex;
    align-items: center;
    gap: 4px;

    @media (max-width: 768px) {
      font-size: 14px;
      line-height: 16px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
      line-height: 16px;
    }
  }
`;

export const CardContentItemUserWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 12px;
  }

  @media (max-width: 480px) {
    gap: 10px;
    flex-direction: column;
    align-items: flex-start;
  }

  & > h6 {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    width: 8px;

    @media (max-width: 768px) {
      font-size: 14px;
      line-height: 16px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 15px;
      width: auto;
    }
  }

  & > div {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    width: 100%;

    @media (max-width: 768px) {
      gap: 8px;
    }

    @media (max-width: 480px) {
      gap: 6px;
      flex-wrap: wrap;
    }

    & > div {
      min-width: 0;

      p {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (max-width: 768px) {
          font-size: 14px;
          line-height: 16px;
        }

        @media (max-width: 480px) {
          font-size: 12px;
          line-height: 15px;
        }
      }

      span {
        font-weight: var(--font-weight-regular);
        font-size: 14px;
        line-height: 16px;
        color: var(--color-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (max-width: 768px) {
          font-size: 14px;
          line-height: 15px;
        }

        @media (max-width: 480px) {
          font-size: 12px;
          line-height: 14px;
        }
      }
    }
  }
`;
export const TableHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1px;
  overflow: auto;
  white-space: nowrap;
  min-width: 100%;
  gap: 20px;

  @media (max-width: 768px) {
    ${mobileActionsRowStyles}

    & > div {
      flex: 0 0 auto;
      flex-wrap: nowrap;
      width: auto;
      max-width: none;
      overflow: visible;
    }
  }
`;

export const TableHeaderWrapperCrypto = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1px;

  gap: 20px;

  @media (max-width: 768px) {
    ${mobileActionsRowStyles}

    & > div {
      flex: 0 0 auto;
      flex-wrap: nowrap;
      width: auto;
      max-width: none;
      overflow: visible;
    }
  }
`;

export const TableHeaderRightWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  & .custom-dropdown-menu {
  }

  &.sort-options {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }

  & > button {
    background: none;
    border: none;
    display: flex;
    gap: 6px;
    align-items: center;
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    line-height: 17px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #f9f9f9;
    transition: all 0.3s ease;
    color: var(--main-black);
    white-space: nowrap;

    @media (max-width: 768px) {
      ${mobileActionControlStyles}

      gap: 8px;

      img.sort-icon {
        width: 14px;
        height: 14px;
      }

      .user-tab-logo {
        width: 18px;
        height: 18px;
      }
    }

    &.selectedSort {
      color: #29a87c;
      background: #f5fbfd !important;

      img.sort-icon {
        filter: invert(39%) sepia(72%) saturate(447%) hue-rotate(134deg)
          brightness(90%) contrast(85%);
      }

      svg path {
        stroke: #29a87c;
      }
    }

    .user-tab-logo {
      width: 18px;
      height: 18px;
      min-width: 18px;
      min-height: 18px;
      flex-shrink: 0;
    }

    &:hover {
      background: var(--input-hover);
    }
    &:active {
      background: var(--input-active);
    }
  }

  @media (max-width: 1120px) {
    flex-wrap: wrap;

    &.sort-options {
      display: flex;
    }
  }

  @media (max-width: 768px) {
    flex: 0 0 auto;
    flex-wrap: nowrap;
    gap: 8px;

    &.crypto {
      width: auto;
      max-width: none;
    }
  }
`;

export const TableHeaderLeftWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    ${mobileActionsRowStyles}

    & > div {
      flex-shrink: 0;
    }
  }

  & > button {
    background: none;
    border: none;
    display: flex;
    gap: 6px;
    align-items: center;
    font-weight: var(--font-weight-medium);
    font-size: 16px;
    line-height: 17px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #f9f9f9;
    transition: all 0.3s ease;
    white-space: nowrap;

    @media (max-width: 768px) {
      ${mobileActionControlStyles}
    }

    &:hover {
      background: var(--input-hover);
    }

    &:active {
      background: var(--input-active);
    }
  }
`;

export const PeriodButtonsWrapper = styled.div`
  @media (max-width: 768px) {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  @media (max-width: 480px) {
    gap: 6px;
  }

  button {
    transition: opacity 0.3s ease;
    &:hover {
      opacity: 0.7;
    }
    &:active {
      opacity: 0.5;
    }
  }
`;

export const PeriodButton = styled.button<{ active: boolean }>`
  padding: 8px 10px;
  border-radius: 8px;
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"} !important;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) =>
    active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)"} !important;
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 14px;
    line-height: 17px;
  }

  @media (max-width: 480px) {
    padding: 5px 7px;
    font-size: 14px;
    line-height: 16px;
  }
`;

export const MarketCapCard = styled.div`
  height: 100%;

  &.price-card {
    display: flex;
    flex-direction: column;
    height: 100%;

    .sp {
      margin-bottom: auto;
    }

    hr {
      margin: 0px;
    }
  }

  @media (max-width: 768px) {
    padding: 0;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
`;

export const ChartWrapper = styled.div`
  max-width: fit-content;
  width: 100%;
  margin: 10px auto 0;
  flex-shrink: 1;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 768px) {
    margin: 8px auto 0;
  }

  @media (max-width: 480px) {
    margin: 6px auto 0;
  }
`;

export const MarketCapValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;

  @media (max-width: 768px) {
    font-size: 15px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }

  &.margin-top-12 {
    margin-top: 12px;

    @media (max-width: 768px) {
      margin-top: 10px;
    }

    @media (max-width: 480px) {
      margin-top: 8px;
    }
  }
`;

export const MarketCapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 0px;
  }

  &.margin-top-12 {
    margin-top: 12px;

    @media (max-width: 768px) {
      margin-top: 10px;
    }

    @media (max-width: 480px) {
      margin-top: 8px;
    }
  }

  &.align-flex-end {
    align-items: flex-end;

    @media (max-width: 480px) {
      align-items: flex-start;
      gap: 4px;
    }
  }
`;

export const MarketCapSymbol = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 15px;
    margin-right: 0;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

export const MarketCapChartWrapper = styled.div`
  margin-top: 26px;

  @media (max-width: 768px) {
    margin-top: 20px;
  }

  @media (max-width: 480px) {
    margin-top: 16px;
  }

  img {
    object-fit: contain;
    width: 100%;
  }
`;

export const SearchContainer = styled.div`
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    z-index: 100;
  }

  & .search-wrapper {
    max-width: 100%;
    top: 64px;

    @media (max-width: 768px) {
      top: 56px;
    }

    @media (max-width: 480px) {
      top: 48px;
    }
  }
`;

export const HeaderPaginationWrapper = styled.div`
  margin: 15px 0px 10px;

  @media (max-width: 768px) {
    margin: 12px 0px 8px;
  }

  @media (max-width: 480px) {
    margin: 10px 0px 6px;
  }
`;

export const ProjectsSettingsTabs = styled.div`
  margin-top: 20px;

  @media (max-width: 768px) {
    margin-top: 16px;
  }

  @media (max-width: 480px) {
    margin-top: 12px;
  }

  & .main {
    width: 100%;
    & > div {
      width: 100%;
    }
    .tab {
      width: 100%;
    }
  }
`;

export const HeaderTitleWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  height: 40px;

  @media (max-width: 768px) {
    align-items: flex-start;
    gap: 12px;
    height: auto;
  }

  @media (max-width: 480px) {
    gap: 10px;
    flex-direction: row;
  }

  & .switch-right-label {
    color: var(--main-gray);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);

    @media (max-width: 768px) {
      font-size: 14px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
`;

export const TabsBody = styled.div`
  width: 100%;
  margin-top: 20px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    margin-top: 16px;
    margin-bottom: 16px;
  }
`;

export const TabsInfoRow = styled.div<{ grid: string }>`
  width: 100%;
  display: grid;
  gap: 20px;
  margin-bottom: 20px;
  grid-template-columns: ${({ grid }) => `${grid}`};
  align-items: stretch;
  height: 365px;

  & > * {
    height: 100%;
    min-height: 0;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    gap: 14px;
    margin-bottom: 14px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin-bottom: 12px;
  }
`;

export const TabsSwiperContainer = styled.div`
  width: 100%;
  margin-bottom: 20px;

  .tabs-swiper {
    width: 100%;
    padding-bottom: 20px;
  }

  .swiper-pagination {
    bottom: 0 !important;
  }

  .swiper-pagination-bullet {
    background: var(--color-primary);
    opacity: 0.5;
  }

  .swiper-pagination-bullet-active {
    opacity: 1;
  }

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

export const MainSections = styled.div`
  width: 100%;
  max-width: 100%;
  flex: 1 1 100%;
  display: flex;
  flex-direction: column;

  @media (max-width: 767px) {
    margin-top: 20px;
  }
`;

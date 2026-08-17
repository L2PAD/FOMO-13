import styled from "styled-components";
import ViewCard from "../../../global/ViewCard";

export const PageWrapper = styled.div`
  padding: 20px 36px;
  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;


export const MarketHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1 1 auto;

  @media (max-width: 1204px) {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
`;

export const MarketHeaderTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: 0;

  @media (max-width: 767px) {
    width: 100%;
    align-items: flex-start;
  }
`;

export const MarketHeaderInfo = styled.div`
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const InfoDescriptionWrapper = styled.div`
  position: relative;

  .gray-description {
    position: absolute;
    top: 28px;
    left: -8px;
    z-index: 5;
    min-width: 360px;

    h2 {
      margin-bottom: 4px;
      font-size: 16px;
      font-weight: var(--font-weight-semibold);
      color: var(--main-black);
    }

    .description-modal-text {
      font-size: 12px;
      line-height: 1.5;
    }
  }

  @media (max-width: 1204px) {
    .gray-description {
      min-width: 320px;
    }
  }

  @media (max-width: 767px) {
    .gray-description {
      top: calc(100% + 8px);
      left: 0;
      min-width: min(320px, calc(100vw - 48px));
      max-width: calc(100vw - 32px);
    }
  }
`;

export const MarketHeaderTitle = styled.h1`
  margin: 0;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 1.1;
  color: var(--color-text-primary);

  @media (max-width: 767px) {
    font-size: 22px;
  }
`;

export const MarketHeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;

  @media (max-width: 1204px) {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  @media (max-width: 767px) {
    gap: 10px;
    align-items: stretch;
  }

  .market-list-button {
    height: 38px;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    white-space: nowrap;

    svg{
      width: 15px;
      height: 15px;
    }
  }
`;

export const MarketHeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;

  > * {
    flex-shrink: 0;
  }

  .market-filter-button > svg {
    width: 12px;
    height: 12px;
  }

  @media (max-width: 1204px) {
    width: 100%;

    .market-filter-button {
      width: 100%;
      flex: 1 1 100%;
    }

    .market-filter-button .collection-filter-trigger {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 767px) {
    gap: 6px;
    width: 100%;

    > :first-child {
      flex: 1 1 100%;
      min-width: 0;
    }

    > :first-child > div {
      width: 100%;
      max-width: 100%;
    }

    .market-filter-button {
      flex-basis: 100%;
    }

    .market-sort-button {
      flex: 1 1 calc(50% - 3px);
      justify-content: center;
    }

    .market-sort-button .market-sort-dropdown {
      right: 0;
      left: auto;
    }
  }

  @media (max-width: 480px) {
    .market-filter-button,
    .market-sort-button {
      flex-basis: 100%;
      width: 100%;
    }

    .market-sort-button .market-sort-dropdown {
      left: 0;
      right: auto;
      min-width: 100%;
    }
  }
`;

export const MarketCurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  width: auto;
  min-height: 38px;
  border-radius: 8px;

  .bg-switch {
    margin-left: 0;
    max-width: fit-content !important;
    flex: 0 0 auto;
    width: auto;
    min-height: 38px;
    align-items: stretch;
    justify-content: space-between;
    box-sizing: border-box;
  }

  .bg-switch > div {
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  @media (max-width: 767px) {
    flex: 1 1 100%;
    width: 100%;
    margin-top: 10px;

    .bg-switch {
      max-width: none !important;
      flex: 1 1 auto;
      width: 100%;
    }

    .bg-switch > div {
      flex: 1 1 50%;
    }
  }
`;

export const EmptyMarket = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  margin-top: 30px;
`;

export const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(295px, 1fr));
  gap: 20px;
  margin-top: 24px;
  margin-bottom: 100px;
  position: relative;
`;

export const ShowAll = styled.div`
  position: absolute;
  bottom: 20px;
  right: 0px;
  cursor: pointer;
  margin: 22px;
  padding-right: 78px;
  text-align: right;
  width: 100%;
  font-weight: var(--font-weight-semibold);

  a {
    line-height: 30px;
  }
`;

export const FlexWrapper = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;

  .make {
    font-size: 12px;
    width: 115px;
  }
  @media (max-width: 767px) {
    flex-wrap: wrap;
  }
`;

export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
`;

export const SocialButton = styled.button<{ active?: boolean }>`
  padding: 8px 10px;
  border: none;
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"};
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};

  svg {
    path {
      fill: ${({ active }) =>
    active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)"};
    }
  }
`;

export const MarketCardsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
  a {
    width: 100%;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  }
`;

export const MarketCardItem = styled(ViewCard)`
  height: 100% !important;
`;

export const OrderWrapper = styled.div`
  padding: 20px 16px;
  border-radius: 8px;
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0px #eeeeee;
  transition: all 0.3s ease;

  display: flex;
`;

export const OrderAction = styled.div`
  display: flex;
  gap: 12px;
  grid-auto-columns: max-content;
  margin-right: 10px;
`;

export const OrderActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  margin-right: 30px;
`;

export const OrderStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
`;

export const SwitchWrapper = styled.div`
  max-width: fit-content;
  margin-left: 12px;

  div {
    font-size: 14px;
  }
`;

export const MobileMarketCardsSlider = styled.div`
  width: 100%;

  .market-cards-swiper {
    padding: 5px 0;
    margin: 0 -10px;
    padding: 0 10px;
  }

  .swiper-slide {
    width: 280px;
    height: auto;
  }
`;
export const FilterWrapper = styled.div`
  margin-top: 30px;
  margin-bottom: 20px;
  display: flex;
  gap: 20px;

  @media (max-width: 500px) {
    justify-content: space-between;
  }
`;

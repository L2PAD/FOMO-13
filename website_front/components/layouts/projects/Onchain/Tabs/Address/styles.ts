import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const SearchWrapper = styled.div`
  position: relative;
  margin-top: 16px;
  margin-bottom: 16px;
`;

export const DropdownWrapper = styled.div<{ active: boolean }>`
  position: absolute;
  width: 169px;
  top: 8px;
  right: ${({ active }) => (active ? 0 : -60)}px;
  transition: .3s;
  ${({ active }) =>
    active
      ? `
    padding: 8px 10px 10px;
    border: 1px solid rgba(83, 98, 124, 0.07);
    border-radius: 8px;
    top: 0;
    background: white;
    & > div > button {
    display: flex;
    width: 100%;
      justify-content: space-between !important;
      
      svg {
        transform: rotate(180deg);
      }
    }
  `
      : ""}}

  & > div {
    position: relative;
    & > button {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      background: none;
      border: none;
      background: #F8F8F9 !important;
      padding: 0 7px;
    }
  }
  
  ul li {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    cursor: pointer;
    margin-bottom: -10px;

    button {
      border: none;
      padding: 0;
      background: none;
      display: flex;
      align-items: center;
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      margin-left: -10px;

      svg {
        margin-right: -5px;
      }
    }
  }
`;

export const FilterWrapper = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CardsWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 64px;

  @media (max-width: 1200px) {
    justify-content: center;
  }
`;

export const CardWrapper = styled(BaseCard)`
  padding: 0 !important;
  max-width: calc(100vw - 35px);
  width: 100%;
`;

export const CardsTableContent = styled.div`
  max-width: 592px;
  overflow-x: auto;
  background: white;
  border-radius: 8px;
`;

export const CardTitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 16px 16px 0;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 21px;
  }

  a {
    background: none;
    padding: 0;
    border: none;
    font-weight: var(--font-weight-medium);
    font-size: 18px;
    line-height: 21px;
    color: var(--color-primary);
  }
`;

export const UserWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 16px;
`;

export const UserTitleWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
  }
`;

export const UserDescriptionWrapper = styled.div<{ value: number }>`
  display: flex;
  gap: 10px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    text-align: center;
    color: ${({ value }) => (value > 0 ? "var(--color-primary)" : "var(--color-danger)")};
  }
`;

export const TableHeaderWrapper = styled.div`
  display: flex;
  padding: 8px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 592px;

  div {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);

    &:first-child {
      width: 183px;
    }
    &:nth-child(2) {
      width: 112px;
    }
    &:nth-child(3) {
      width: 150px;
    }
  }
`;

export const UserRowWrapper = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;

  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
  }

  & > div,
  & > a {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;

    &:first-child {
      width: 168px;
      display: flex;
      gap: 4px;
      align-items: center;

      p {
        font-weight: var(--font-weight-semibold);
        font-size: 12px;
        line-height: 15px;
      }
    }
    &:nth-child(2) {
      width: 127px;
      display: flex;
      gap: 10px;
    }
    &:nth-child(3) {
      width: 137px;
      display: flex;
      gap: 10px;
    }
    &:nth-child(4) {
      width: 120px;
      display: flex;
      gap: 10px;
    }
  }
`;

export const UserRowsWrapper = styled.div`
  max-height: 200px;
  overflow-y: auto;
  width: 592px;
`;

export const UpDownPrice = styled.span<{ value: number }>`
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 14px;
  color: ${({ value }) => (value > 0 ? "var(--color-primary)" : "var(--color-danger)")};
`;

export const TransactionsTableHeader = styled.div`
  display: flex;
  padding: 8px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 592px;

  div {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);

    &:first-child {
      width: 74px;
    }
    &:nth-child(2) {
      width: 129px;
    }
    &:nth-child(3) {
      width: 150px;
    }
    &:nth-child(4) {
      width: 130px;
    }
  }
`;

export const TransactionsTableRow = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;

  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
  }

  div {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);

    &:first-child {
      width: 74px;
      font-weight: var(--font-weight-semibold);
      font-size: 12px;
      line-height: 15px;
      color: var(--color-text-primary);
    }
    &:nth-child(2) {
      width: 129px;
    }
    &:nth-child(3) {
      width: 150px;
    }
    &:nth-child(4) {
      width: 130px;

      span {
        color: var(--color-text-muted);
      }
    }
  }
`;

export const TransactionsCardsWrapper = styled.div`
  height: 280px;
  overflow-y: auto;
  width: 592px;
`;

export const AlertTitleWrapper = styled.div`
  text-align: center;
  margin-bottom: 24px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
    margin-bottom: 6px;
  }

  span {
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 21px;
  }
`;

export const GraphicWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-gap: 10px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }

  & > div {
    width: 100%;

    & > div {
      width: 100%;
    }
  }
`;

export const AlertsWrapper = styled(BaseCard)`
  margin-bottom: 16px;
`;

export const AlertsTitle = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  margin-bottom: 12px;
`;

export const AddAlerts = styled.button`
  background: none;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-primary);
  text-align: center;
  width: 100%;
  padding: 13px 0 21px;
`;

export const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  max-width: 1200px;
  overflow-x: auto;
`;

export const TabButton = styled.button<{ active: boolean }>`
  background: ${({ active }) =>
    !active ? "rgba(115, 128, 148, 0.05)" : "rgba(0, 192, 153, 0.1)"};
  border-radius: 8px;
  padding: 8px 10px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};
  border: none;
`;

export const TableWrapper = styled(BaseCard)`
  padding: 0 !important;
  width: 100% !important;
  overflow-x: auto;
`;

export const TableHeader = styled.div`
  display: flex;
  padding: 12px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 1200px;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 206px;
    }
  }
`;

export const TabsTableRowsWrapper = styled.div`
  max-height: 260px;
  overflow-y: auto;
  width: 1200px;
`;

export const TabTableRowWrapper = styled.div`
  display: flex;
  padding: 16px;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;

    &:first-child {
      width: 206px;
    }
    &:last-child {
      display: flex;
      gap: 14px;
      align-items: center;
    }
  }
`;

export const TabsTableProgress = styled.div<{
  progress: number;
  right: boolean;
}>`
  background: rgba(39, 122, 210, 0.1);
  border-radius: 8px;
  width: 266px;
  height: 8px;
  display: flex;
  justify-content: ${({ right }) => (right ? "flex-end" : "flex-start")};

  div {
    background: ${({ right }) => (right ? "var(--color-danger)" : "#277AD2")};
    border-radius: 8px;
    width: ${({ progress, right }) => (right ? -progress : progress)}%;
    height: 8px;
  }
`;

export const TableContent = styled.div`
  max-width: 1200px;
  overflow-x: auto;
`;

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
    }
  }
  
  ul li {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    
    &:first-child {
      margin-top: 10px;
    }
    
    &:not(:last-child) {
      margin-bottom: 10px;
    }
    
    button {
      border: none;
      padding: 0;
      background: none;
    }
  }
`;

export const FilterWrapper = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const HotNFTsWrapper = styled.div`
  margin-bottom: 48px;

  div {
    p {
      font-weight: var(--font-weight-semibold);
      font-size: 18px;
      line-height: 21px;
      color: var(--color-text-primary);
      padding: 16px;
    }
  }
`;

export const CardsWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 64px;

  @media (max-width: 1200px) {
    justify-content: center;
  }
`;

export const CardWrapper = styled(BaseCard)`
  width: 592px !important;
  padding: 0 !important;
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
  border-bottom: 1px solid #f8f8f9;

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

export const CurrentTableRowsWrapper = styled.div`
  max-height: 260px;
  overflow-y: auto;
  width: 1200px;
`;

export const CurrentTableHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 1200px;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 120px;
    }
    &:nth-child(2) {
      width: 120px;
    }
    &:nth-child(3) {
      width: 230px;
    }
    &:nth-child(4) {
      width: 240px;
    }
    &:nth-child(5) {
      width: 140px;
    }
    &:nth-child(6) {
      width: 120px;
    }
  }
`;

export const CurrentTableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f8f8f9;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;

    &:first-child {
      width: 120px;
    }
    &:nth-child(2) {
      width: 120px;
    }
    &:nth-child(3) {
      width: 230px;
    }
    &:nth-child(4) {
      width: 240px;
    }
    &:nth-child(5) {
      width: 140px;
    }
    &:nth-child(6) {
      width: 120px;
    }
  }
`;

export const LatestTableHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 1200px;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 226px;
    }
    &:nth-child(2) {
      width: 200px;
    }
    &:nth-child(3) {
      width: 200px;
    }
    &:nth-child(4) {
      width: 200px;
    }
    &:nth-child(5) {
      width: 198px;
    }
  }
`;
export const LatestTableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f8f8f9;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: space-between;

    &:first-child {
      width: 226px;
    }
    &:nth-child(2) {
      width: 200px;
    }
    &:nth-child(3) {
      width: 200px;
    }
    &:nth-child(4) {
      width: 200px;
    }
    &:nth-child(5) {
      width: 198px;
    }
  }
`;

export const LatestProgress = styled.div<{ progress: number }>`
  background: rgba(39, 122, 210, 0.1);
  border-radius: 8px;
  width: 130px;
  height: 8px;
  display: flex;
  margin-right: 40px;

  div {
    background: #277ad2;
    border-radius: 8px;
    width: ${({ progress }) => progress}%;
    height: 8px;
  }
`;

export const TrackerTableHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 1200px;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 170px;
    }
    &:nth-child(2) {
      width: 90px;
    }
    &:nth-child(3) {
      width: 110px;
    }
    &:nth-child(4) {
      width: 240px;
    }
    &:nth-child(5) {
      width: 86px;
    }
    &:nth-child(6) {
      width: 244px;
    }
    &:nth-child(7) {
      width: 140px;
    }
    &:nth-child(8) {
      width: 86px;
    }
  }
`;

export const TrackerTableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f8f8f9;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 170px;
    }
    &:nth-child(2) {
      width: 90px;
    }
    &:nth-child(3) {
      width: 110px;
    }
    &:nth-child(4) {
      width: 240px;
    }
    &:nth-child(5) {
      width: 86px;
    }
    &:nth-child(6) {
      width: 244px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      & > div {
        margin-right: 70px;
      }
    }
    &:nth-child(7) {
      width: 140px;
    }
    &:nth-child(8) {
      width: 86px;
    }
  }
`;

import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  height: auto;
  min-height: 500px;

  @media (max-width: 768px) {
    height: fit-content;
  }
`;

export const Header = styled.div`
  display: flex;
  gap: 30px;

  & .categories {
    width: 200px;

    button {
      height: 36px;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;

    & .categories {
      width: 100%;

      button {
        width: 100%;
      }
    }
  }
`;

export const SearchField = styled.div`
  position: relative;
  width: 300px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const SearchDropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 5;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: var(--color-white);
  box-shadow: 0 12px 28px rgba(7, 11, 53, 0.12);
`;

export const SearchOption = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f5fbfd;
  }

  &:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .name {
    display: block;
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    display: block;
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const SelectedItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 10px;
`;

export const SelectedItemButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 220px;
  padding: 4px 8px;
  border-radius: 10px;
  background: var(--color-white);
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;

  .color {
    width: 10px;
    height: 10px;
    flex: 0 0 10px;
    border-radius: 50%;
    background: #4f85bd;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const RiskInfo = styled.div`
  display: flex;
  margin-left: auto;
`;

export const InfoLabel = styled.div`
  padding: 7.5px 8px;

  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16.8px;
  letter-spacing: 0%;
`;

export const ChartWrapper = styled.div`
  display: flex;
  height: 400px;
`;

export const EmptyStateWrapper = styled.div`
  min-height: 400px;
  height: calc(100% - 56px);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    min-height: 280px;
  }
`;

export const ChartLeftLabels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 95%;
  width: 7%;
  margin-top: 14px;
  margin-bottom: 30px;
`;

export const Chart = styled.div`
  width: 100%;
  height: calc(100% - 14px);

  & .recharts-layer.recharts-cartesian-axis.recharts-xAxis.xAxis {
    display: none;
  }

  & .recharts-layer.recharts-cartesian-axis.recharts-yAxis.yAxis {
    display: none;
  }

  & .recharts-scatter-symbol path {
  }

  & .tooltip-fund {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    margin-bottom: 4.5px;
  }

  & .tooltip-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    p {
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }

    & .insight {
      justify-content: center;
    }
  }
`;

export const Items = styled.div`
  display: flex;

  & .item {
    display: flex;
    align-items: center;
    gap: 4px;

    padding: 7.5px 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
    letter-spacing: 0%;
  }

  & .label {
    opacity: 1;
    display: block;
    min-width: 10px;
    min-height: 10px;
    border-radius: 50%;
  }

  & .green {
    background: var(--color-primary);
  }

  & .yellow {
    background: var(--color-warning);
  }

  & .red {
    background: var(--color-danger);
  }
`;

export const BottomLabels = styled.div`
  display: flex;
  justify-content: space-between;

  div {
    font-weight: var(--font-weight-regular);
    font-size: 11px;
    line-height: 13.2px;
    text-align: center;
  }
`;

export const BottomRoiInfo = styled.div`
  margin-top: 0;
  font-weight: var(--font-weight-regular);
  font-size: 11px;
  line-height: 13.2px;
  letter-spacing: 0%;
  text-align: center;
  color: var(--main-gray);
`;

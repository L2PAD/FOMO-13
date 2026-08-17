import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const MetricsCard = styled(BaseCard)`
  width: 100%;
  overflow-x: auto;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  border-radius: 12px;
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  padding: 16px 20px 18px;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #e8eef3;
  }

  &::-webkit-scrollbar-thumb {
    background: #c9d3df;
    border-radius: 6px;
  }
`;

export const MetricsTable = styled.div`
  min-width: 680px;
`;

export const MetricsHeader = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr 1.15fr;
  min-height: 34px;
  align-items: center;
  border-bottom: 1px solid #e5edf2;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 17px;
  font-weight: var(--font-weight-semibold);
`;

export const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr 1.15fr;
  min-height: 50px;
  align-items: center;
  border-bottom: 1px solid #e5edf2;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;

  &:last-child {
    border-bottom: 0;
  }
`;

export const MetricsCell = styled.div<{ $isRound?: boolean }>`
  padding: 0 10px;
  font-weight: ${({ $isRound }) => ($isRound ? 400 : 600)};
  white-space: nowrap;
`;

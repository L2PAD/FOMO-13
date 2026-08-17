import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const TimelineCard = styled(BaseCard)`
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  border-radius: 12px;
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  padding: 0 18px 14px;

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

  @media (max-width: 575px) {
    padding: 0 0 10px;
    border-radius: 12px;
    overscroll-behavior-x: contain;
  }
`;

export const TimelineContent = styled.div`
  width: 100%;
  min-width: max-content;
`;

export const TimelineViewport = styled.div`
  width: 100%;
`;

export const TimelineHeader = styled.div<{ $gridWidth: number }>`
  display: grid;
  grid-template-columns: 180px 110px minmax(
      ${({ $gridWidth }) => `${$gridWidth}px`},
      1fr
    );
  width: 100%;
  min-width: ${({ $gridWidth }) => `${290 + $gridWidth}px`};
  height: 64px;
  border-bottom: 1px solid #e5edf2;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);

  @media (max-width: 575px) {
    grid-template-columns: 118px 76px minmax(
        ${({ $gridWidth }) => `${$gridWidth}px`},
        1fr
      );
    min-width: ${({ $gridWidth }) => `${194 + $gridWidth}px`};
    height: 56px;
    font-size: 12px;
  }
`;

export const HeaderCell = styled.div`
  display: flex;
  align-items: center;
  padding: 0 10px;

  @media (max-width: 575px) {
    position: sticky;
    left: 0;
    z-index: 8;
    padding: 0 8px;
    background: #fff;
  }
`;

export const TgeHeaderCell = styled(HeaderCell)`
  position: relative;
  gap: 6px;
  white-space: nowrap;

  button {
    width: 14px;
    height: 14px;
    border: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  img {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 575px) {
    position: sticky;
    left: 118px;
    z-index: 9;
    gap: 4px;
    border-right: 1px solid #e5edf2;
    box-shadow: 8px 0 12px -12px rgba(12, 26, 43, 0.5);
    white-space: normal;

    > span {
      max-width: 42px;
      line-height: 14px;
    }

    button,
    img {
      width: 12px;
      height: 12px;
      flex: 0 0 12px;
    }
  }
`;

export const TgeTooltip = styled.div`
  position: absolute;
  top: 44px;
  left: 0;
  z-index: 10;
  min-width: 132px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: #0c1a2b;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
  color: #d3d3d7;
  font-size: 10px;
  line-height: 13px;
  font-weight: var(--font-weight-regular);
  pointer-events: none;
`;

export const Axis = styled.div`
  position: relative;
`;

export const AxisLabel = styled.div<{ $lane?: number }>`
  position: absolute;
  top: ${({ $lane = 0 }) => ($lane ? "34px" : "10px")};
  height: 22px;
  display: flex;
  align-items: center;
  min-width: 118px;
  padding-right: 14px;
  transform: translateX(18px);
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 16px;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;

  @media (max-width: 575px) {
    min-width: 96px;
    padding-right: 8px;
    transform: translateX(10px);
    font-size: 11px;
    line-height: 14px;
  }
`;

export const TimelineRow = styled.div<{ $gridWidth: number }>`
  display: grid;
  grid-template-columns: 180px 110px minmax(
      ${({ $gridWidth }) => `${$gridWidth}px`},
      1fr
    );
  width: 100%;
  min-width: ${({ $gridWidth }) => `${290 + $gridWidth}px`};
  min-height: 58px;
  border-bottom: 1px solid #e5edf2;

  @media (max-width: 575px) {
    grid-template-columns: 118px 76px minmax(
        ${({ $gridWidth }) => `${$gridWidth}px`},
        1fr
      );
    min-width: ${({ $gridWidth }) => `${194 + $gridWidth}px`};
    min-height: 60px;
  }
`;

export const RoundCell = styled.div`
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;
  font-weight: var(--font-weight-semibold);

  @media (max-width: 575px) {
    position: sticky;
    left: 0;
    z-index: 10;
    min-width: 0;
    padding: 8px;
    background: #fff;
    font-size: 12px;
    line-height: 15px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;

export const TgeCell = styled.div`
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 17px;

  @media (max-width: 575px) {
    position: sticky;
    left: 118px;
    z-index: 11;
    justify-content: center;
    padding: 0 6px;
    border-right: 1px solid #e5edf2;
    background: #fff;
    box-shadow: 8px 0 12px -12px rgba(12, 26, 43, 0.5);
    font-size: 12px;
    line-height: 15px;
  }
`;

export const Track = styled.div`
  position: relative;
  min-height: 58px;
  overflow: visible;

  @media (max-width: 575px) {
    min-height: 60px;
  }
`;

export const CurrentLine = styled.div<{ $showDot?: boolean }>`
  position: absolute;
  top: -1px;
  bottom: -1px;
  width: 2px;
  background: var(--color-primary);
  z-index: 6;

  &::before {
    content: "";
    position: absolute;
    top: -4px;
    left: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary);
    display: ${({ $showDot }) => ($showDot ? "block" : "none")};
  }
`;

export const BandProgressFill = styled.div<{ color: string }>`
  position: absolute;
  inset: 0 auto 0 0;
  background: ${({ color }) => color};
  z-index: 1;
  pointer-events: none;
`;

export const CliffMarker = styled.div<{ color: string }>`
  position: absolute;
  top: 21px;
  z-index: 3;
  transform: translateX(-50%);
  color: ${({ color }) => color};
  font-size: 14px;
  line-height: 17px;
  font-weight: var(--font-weight-regular);
  white-space: nowrap;
  pointer-events: none;
`;

export const VestingBand = styled.div<{ bg: string; border: string; $isComplete?: boolean }>`
  position: absolute;
  top: 10px;
  height: 38px;
  min-width: 112px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  border-left: 3px solid ${({ border }) => border};
  background: ${({ bg }) => bg};
  padding: 5px 10px;
  color: ${({ $isComplete }) => ($isComplete ? "var(--color-white)" : "var(--color-text-primary)")};
  overflow: hidden;

  strong {
    position: relative;
    z-index: 2;
    font-size: 11px;
    line-height: 13px;
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    position: relative;
    z-index: 2;
    font-size: 10px;
    line-height: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 575px) {
    top: 9px;
    height: 42px;
    padding: 6px 8px;

    strong {
      font-size: 10px;
      line-height: 12px;
    }

    span {
      font-size: 9px;
      line-height: 11px;
    }
  }
`;

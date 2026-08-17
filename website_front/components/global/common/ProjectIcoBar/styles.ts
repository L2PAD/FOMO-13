import styled, { keyframes } from "styled-components";
import BaseCard from "../BaseCard";

const barSkeletonShimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

const barSkeletonSweep = keyframes`
  0% {
    transform: translateX(-110%);
  }
  45%,
  100% {
    transform: translateX(110%);
  }
`;

const barSkeletonPulse = keyframes`
  0%,
  100% {
    opacity: 0.56;
    transform: scaleX(0.94);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
`;

export const Wrapper = styled(BaseCard)`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.6px;
    color: var(--main-gray);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

export const LeftHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ProjectSearchWrapper = styled.div`
  position: relative;
  min-width: 220px;
`;

export const SearchResults = styled(BaseCard)`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  padding: 6px;

  & .empty-result {
    padding: 8px;
    color: var(--color-text-muted);
    font-size: 13px;
  }
`;

export const SearchResultItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 13px;
  text-align: left;

  &:hover {
    background: #f5fbfd;
  }

  img {
    width: 18px;
    height: 18px;
    object-fit: cover;
    border-radius: 50%;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
  margin-bottom: 20px;
  overflow-x: auto;

  & .tab {
    display: flex;
    align-items: center;
    gap: 4px;
    width: max-content;

    span {
      white-space: nowrap;
    }

    & .color {
      max-width: 10px;
      min-width: 10px;
      min-height: 10px;
      max-height: 10px;
      border-radius: 50%;
    }

    img {
      max-width: 16px;
      min-width: 16px;
      min-height: 16px;
      max-height: 16px;
      border-radius: 50%;
    }

    span {
      color: var(--color-text-primary);
      font-size: 14px;
    }
  }

  & .btn {
    padding: 4px 8px;
  }
`;

export const Body = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  height: 380px;
`;

export const Bottom = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  margin-left: 50px;

  div {
    color: var(--color-text-primary);
    font-size: 14px;
  }
`;

export const MiddleButtons = styled.div`
  display: flex;
  gap: 4px;
`;

export const Chart = styled.div<{ $height?: number }>`
  max-width: 100%;
  height: ${({ $height }) => ($height ? `${$height}px` : "400px")};
  width: calc(100% - 80px);
  margin-left: auto;

  & .recharts-cartesian-axis-ticks {
    display: none;
  }

  & .recharts-responsive-container {
  }
`;

export const ChartWrapper = styled.div`
  position: relative;
`;

export const Projects = styled.div<{ $rowHeight?: number }>`
  position: absolute;
  top: 5px;
  bottom: 35px;
  left: 0px;
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  align-items: center;

  & .project {
    display: flex;
    align-items: center;
    gap: 4px;
    img {
      width: 16px;
      height: 16px;
      object-fit: cover;
      border-radius: 50%;
    }
  }
`;

export const EmptyChartState = styled.div`
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 14px;
`;

export const BarChartLoadingWrapper = styled.div<{ $height?: number }>`
  position: relative;
  isolation: isolate;
  width: 100%;
  height: ${({ $height }) => ($height ? `${$height}px` : "400px")};
  margin-top: 12px;
  overflow: hidden;
  box-sizing: border-box;
  padding: 30px 44px 30px 0;
  border: 1px solid rgba(7, 11, 53, 0.06);
  border-radius: 10px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.62) 0%,
      rgba(233, 247, 247, 0.36) 100%
    ),
    #f5fbfd;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
    background: linear-gradient(
      108deg,
      transparent 0%,
      transparent 34%,
      rgba(255, 255, 255, 0.56) 44%,
      transparent 56%,
      transparent 100%
    );
    animation: ${barSkeletonSweep} 2.2s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    padding-right: 28px;
  }
`;

export const BarChartLoadingGrid = styled.div`
  position: absolute;
  top: 30px;
  right: 44px;
  bottom: 30px;
  left: 96px;
  z-index: 1;
  border-radius: 8px;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(7, 11, 53, 0.065) 0,
      rgba(7, 11, 53, 0.065) 1px,
      transparent 1px,
      transparent 72px
    ),
    repeating-linear-gradient(
      to right,
      rgba(7, 11, 53, 0.04) 0,
      rgba(7, 11, 53, 0.04) 1px,
      transparent 1px,
      transparent 96px
    );

  @media (max-width: 768px) {
    right: 28px;
    left: 84px;
  }
`;

export const BarChartLoadingRows = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
`;

export const BarChartLoadingRow = styled.div`
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 68px minmax(0, 1fr);
    gap: 12px;
  }
`;

export const BarChartLoadingLabel = styled.span`
  display: block;
  width: 70%;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(224, 224, 224, 0.5) 30%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(224, 224, 224, 0.5) 70%
  );
  background-size: 200% 100%;
  animation: ${barSkeletonShimmer} 2s infinite;
`;

export const BarChartLoadingTrack = styled.div`
  height: 20px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(7, 11, 53, 0.035);
`;

export const BarChartLoadingBar = styled.span`
  display: block;
  height: 100%;
  min-width: 14%;
  transform-origin: left center;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(4, 165, 132, 0.05) 0%,
    rgba(4, 165, 132, 0.5) 100%
  );
  animation: ${barSkeletonPulse} 1.45s ease-in-out infinite;
`;

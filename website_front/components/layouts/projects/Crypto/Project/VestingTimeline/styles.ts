import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  overflow: auto;
  min-width: 90vw;
`;

export const Header = styled.div`
  display: flex;
  width: fit-content;
  min-width: 100%;

  & .left {
    padding: 6.5px 10px;
    min-width: 200px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    color: var(--main-gray);
    position: sticky;
    left: 0;
    background: var(--color-white);
    z-index: 1;
  }

  & .dates {
    display: flex;
    align-items: center;

    & .date {
      width: 200px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17.15px;
      color: var(--main-gray);
    }
  }

  & .right {
    padding: 6.5px 10px;
    display: flex;
    align-items: center;
    position: relative;

    & .unlock {
      width: 200px;
    }
    button {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17.15px;
      color: var(--main-gray);
    }
  }

  @media (max-width: 767px) {
    .left,
    .dates .date,
    .right button {
      font-size: 13px;
      line-height: 16px;
    }

    .left {
      padding: 6px 8px;
      min-width: 140px;
    }
  }
`;

export const DescriptionWrapper = styled.div`
  position: absolute;
  top: 25px;
  left: -60px;
  & .metrics {
    width: 150px;

    div {
      color: var(--main-gray) !important;
    }
  }

  @media (max-width: 767px) {
    left: -40px;

    .metrics {
      width: 140px;
    }
  }
`;

export const Body = styled.div`
  height: 100%;
  min-width: fit-content;
  overflow-x: auto;

  /* Improve touch scrolling on mobile */
  -webkit-overflow-scrolling: touch;

  /* Customize scrollbar */
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f2f5;
  }

  &::-webkit-scrollbar-thumb {
    background: #c0c0c0;
    border-radius: 3px;
  }
`;

export const LeftColumn = styled.div`
  width: 160px;

  @media (max-width: 767px) {
    width: 140px;
  }
`;

export const Schedule = styled.div`
  position: relative;
  width: 230%;
  display: flex;
  flex-direction: column;

  @media (max-width: 1200px) {
    width: 280%;
  }

  @media (max-width: 767px) {
    width: 350%;
  }
`;

export const Round = styled.div`
  display: flex;
  align-items: center;
  border-top: 1px solid #f0f2f5;
  padding: 0 10px;

  & > div {
    padding: 16.5px 0;
  }

  & .items {
    position: relative;
    width: 100%;
  }
  & .name {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    color: var(--main-black);
    min-width: 160px;
    position: sticky;
    left: 0;
    background: var(--color-white);
    z-index: 10;
    height: 100%;
  }

  & .tge {
    min-width: 200px;
    color: var(--main-black);
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
  }

  & .cliff {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
  }



  & .timeline-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 6px 4px 4px;
    height: 100%;
    width: 100%;
    div {
      position: relative;
      z-index: 2;
      font-weight: var(--font-weight-semibold);
      font-size: 12px;
    }

    span {
      position: relative;
      z-index: 2;
      font-size: 10px;
    }
  }
  & .timeline-wrapper {
    position: absolute;
    top: -12px;
    display: flex;
    height: 42px;

    & .timeline-border {
      width: 2px;
      height: 100%;
      border-top-left-radius: 2px;
      border-bottom-left-radius: 2px;
    }

    & .fake-width {
      position: absolute;
      top: 0;
      left: 0;
      height: 34px;
      z-index: 1;
    }
  }
  &:first-child{
      & .timeline-wrapper {
    position: absolute;
    top: -8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 6px 4px 4px;
    height: 100%;
    width: 100%;
    div {
      position: relative;
      z-index: 2;
      font-weight: var(--font-weight-semibold);
      font-size: 10px;
    }

    span {
      position: relative;
      z-index: 2;
      font-size: 8px;
    }
  }

  @media (max-width: 767px) {
    padding: 0 8px;
    height: 48px;
    border-top: none;

    .tge,
    .cliff {
      font-size: 13px;
      line-height: 15px;
    }
  }
`;

export const DynamicLine = styled.button<{ position: number }>`
  position: absolute;
  z-index: 1;
  top: 0px;
  left: ${({ position }) => `${position}px`};
`;

export const IcoTimelineWrapper = styled(BaseCard)`
  width: 100%;
  overflow-x: auto;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 12px;
  padding: 0;

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

export const IcoTimelineHeader = styled.div`
  min-width: 820px;
  display: grid;
  grid-template-columns: 180px 145px minmax(485px, 1fr);
  align-items: stretch;
  border-bottom: 1px solid #e8eef3;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 17px;
  font-weight: var(--font-weight-semibold);

  .round-cell,
  .tge-cell {
    padding: 16px 20px;
  }

  .tge-cell {
    display: flex;
    gap: 6px;
    align-items: center;
    position: relative;
    white-space: nowrap;

    button {
      border: none;
      background: transparent;
      padding: 0;
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    img {
      width: 14px;
      height: 14px;
    }

    ${DescriptionWrapper} {
      top: 38px;
      left: 8px;
      z-index: 20;
    }
  }

  .axis {
    position: relative;
    min-height: 66px;
    padding: 14px 20px;
    box-sizing: border-box;
  }

  .axis-item {
    position: absolute;
    top: 14px;
    min-width: 94px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 4px;
    white-space: nowrap;

    &:first-child {
      transform: translateX(0);
    }

    &:last-child {
      transform: translateX(-100%);
      align-items: flex-end;
    }

    small {
      font-size: 11px;
      font-weight: var(--font-weight-regular);
      color: #97a4b5;
    }
  }
`;

export const IcoTimelineRow = styled.div`
  min-width: 820px;
  min-height: 72px;
  display: grid;
  grid-template-columns: 180px 145px minmax(485px, 1fr);
  align-items: center;
  border-bottom: 1px solid #e8eef3;

  .round-name {
    padding: 14px 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    strong {
      color: var(--color-text-primary);
      font-size: 14px;
      line-height: 17px;
      font-weight: var(--font-weight-semibold);
    }

    span {
      color: var(--color-text-muted);
      font-size: 12px;
      line-height: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .tge-value {
    padding: 14px 20px;
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 17px;
  }
`;

export const IcoTimelineTrack = styled.div`
  position: relative;
  height: 44px;
  margin: 0 20px;
  border-radius: 0;
  background: linear-gradient(90deg, rgba(115, 128, 148, 0.08), rgba(115, 128, 148, 0.03));
  overflow: visible;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: linear-gradient(90deg, rgba(115, 128, 148, 0.14) 1px, transparent 1px);
    background-size: 64px 100%;
    pointer-events: none;
  }

  .current-line {
    position: absolute;
    top: -52px;
    bottom: -14px;
    width: 2px;
    background: var(--color-primary);
    z-index: 4;

    &::before {
      content: "";
      position: absolute;
      top: -4px;
      left: -3px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-primary);
    }
  }
`;

export const IcoTimelineBar = styled.div`
  position: absolute;
  top: 5px;
  left: 0;
  min-width: 3px;
  height: 34px;
  border-left: 3px solid;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 3px 8px;
  overflow: hidden;
  color: var(--color-text-primary);

  strong {
    font-size: 11px;
    line-height: 13px;
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
  }

  span {
    font-size: 10px;
    line-height: 12px;
    white-space: nowrap;
  }

  &.next {
    background: rgba(255, 88, 88, 0.12);
    border-left-width: 2px;
    padding: 0;
  }
`;

export const IcoTimelineMarker = styled.div`
  position: absolute;
  top: -8px;
  max-width: 170px;
  transform: translateX(-2px);
  font-size: 12px;
  line-height: 15px;
  font-weight: var(--font-weight-medium);
  white-space: nowrap;

  span {
    display: block;
    max-width: 170px;
    margin-top: 1px;
    color: var(--color-text-muted);
    font-size: 10px;
    line-height: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.cliff-marker {
    top: 13px;
    z-index: 5;
    font-size: 14px;
    line-height: 17px;
  }
`;

export const IcoLegend = styled.div`
  min-width: 820px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 20px 16px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 15px;

  div {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  i {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    display: block;

    &.unlocked {
      background: #ebf3ff;
      border-left: 3px solid #193081;
    }

    &.next {
      background: rgba(255, 88, 88, 0.18);
      border-left: 3px solid #bc322e;
    }

    &.locked {
      background: rgba(115, 128, 148, 0.1);
    }
  }

  strong {
    margin-left: auto;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
`;

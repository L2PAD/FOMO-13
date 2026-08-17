import styled from "styled-components";
import BaseCard from "../../../global/common/BaseCard";
import UserAvatar from "../../../global/common/UserAvatar";
import Typography from "../../../global/common/Typography";

export const PageWrapper = styled.div`
  margin: 19px auto;

  .table-wrapper {
    width: 100% !important;
  }
`;

export const HeaderWrapper = styled.div`
  margin-top: 40px;
  margin-bottom: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
`;

export const LeftHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

export const GridButton = styled.button`
  border: none;
  background: none;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
`;

export const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

export const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  align-items: center;
  justify-content: center;

  & .week-header-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 60px;
  }

  div {
    text-align: center;
    font-family: Inter;
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 18px;
    padding: 16px 4px;
    border-top: 1px solid var(--color-border-subtle);
    border-right: 1px solid var(--color-border-subtle);

    &:first-child {
      border-left: 1px solid var(--color-border-subtle);
      border-top-left-radius: 12px;
      background: var(--color-surface-subtle);
    }

    &:last-child {
      background: var(--color-surface-subtle);
      border-top-right-radius: 12px;
      border-right: 1px solid var(--color-border-subtle);
    }
  }
`;

export const CurrentDayLabel = styled.div<{ isCurrentDay: boolean }>`
  font-weight: var(--font-weight-medium);
  border-radius: 50%;
  background: ${({ isCurrentDay }) => (isCurrentDay ? "black" : "transparent")};
  font-size: 12px;

  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ isCurrentDay }) => (isCurrentDay ? "var(--color-white)" : "black")};
`;

export const CalendarDay = styled.div`
  width: 100%;
  height: 120px !important;
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
  border-right: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
  border-top: 1px solid var(--color-border-subtle);
  transition: all 0.3s ease;
`;

export const DayHeader = styled.div<{
  isCurrentMonth: boolean;
  isCurrentDay: boolean;
}>`
  font-weight: ${({ isCurrentDay }) => (isCurrentDay ? 500 : 400)} !important;
  border-radius: 50%;
  background: ${({ isCurrentDay }) =>
    isCurrentDay ? "black" : "transparent"} !important;
  font-size: 12px !important;
  line-height: 14px !important;
  width: ${({ isCurrentDay }) => (isCurrentDay ? "16px" : "none")} !important;
  height: ${({ isCurrentDay }) => (isCurrentDay ? "16px" : "none")} !important;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ isCurrentMonth, isCurrentDay }) =>
    isCurrentDay ? "var(--color-white)" : isCurrentMonth ? "var(--color-text-muted)" : "#c0ccd0"};
  padding: 12px !important;
  align-self: flex-end;
`;

export const AddEventButton = styled.button`
  border: none;
  background: none;
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 5px;

  svg {
    transform: rotate(45deg);
  }
`;

export const ShowAllButton = styled.button`
  position: absolute;
  bottom: 12px;
  border: none;
  background: none;
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  color: var(--color-primary);
`;

export const EventWrapper = styled.div<{
  background: string;
  isStart?: boolean;
  isEnd?: boolean;
}>`
  position: relative;
  max-width: 90%;
  margin-top: 1px;
  height: 100%;
  background: ${({ background }) => background};
  border-radius: 4px;
`;

export const EventBorder = styled.div<{
  background: string;
  isStart?: boolean;
  isEnd?: boolean;
}>`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 3px;
  height: 100%;
  background: ${({ background }) => background};
  border-bottom-left-radius: ${({ isEnd }) =>
    isEnd ? "6px" : "0px"} !important;
  border-top-left-radius: ${({ isStart }) =>
    isStart ? "6px" : "0px"} !important;
`;

export const EventUser = styled(UserAvatar)`
  img {
    width: 18px;
    height: 18px;
  }
`;

export const EventTitle = styled.div<{ color: string }>`
  font-family: Inter;
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  color: ${({ color }) => color};
  width: 104px;
  padding: 6px !important;
  margin-left: 2px;
`;

export const EventDescription = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 10px;
  line-height: 12px;
  color: rgba(69, 64, 99, 0.5);
  width: 104px;
`;

export const EventTimeWrapper = styled.div`
  display: flex;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);
  flex-direction: column;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 8px;
    line-height: 10px;
    color: rgba(69, 64, 99, 0.5);
  }
`;

export const MobileWeekDayName = styled.i`
  display: none;

  @media (max-width: 1024px) {
    display: block;
    color: rgba(69, 64, 99, 0.5);
  }
`;

export const RightHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

export const MonthValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29.4px;
`;

export const ModeButtons = styled.div`
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f9f9f9;
  border-radius: 4px;
`;

export const ModeButton = styled.button<{ isActive: boolean }>`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: ${({ isActive }) => (isActive ? "var(--color-primary)" : "var(--color-text-muted)")};
  background: ${({ isActive }) => (isActive ? "var(--color-white)" : "transparent")};
  border-radius: 4px;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.7;
  }

  &:active {
    opacity: 0.5;
  }
`;

export const CalendarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  button {
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.7;
    }

    &:active {
      opacity: 0.5;
    }

    &:disabled {
      opacity: 0.5 !important;
    }
  }
`;

export const CalendarDayWrapper = styled.div`
  position: relative;

  &:nth-child(7n + 1) {
    background: var(--color-surface-subtle);
    border-left: 1px solid var(--color-border-subtle);
  }
  &:nth-child(7n) {
    background: var(--color-surface-subtle);
    border-left: 1px solid var(--color-border-subtle);
  }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0px;
  z-index: 1;
`;

export const EventInfo = styled.div``;

export const EventTime = styled.div<{ color: string }>`
  font-size: 10px;
  font-family: Inter;
  color: ${({ color }) => color};
  padding-left: 6px;
`;

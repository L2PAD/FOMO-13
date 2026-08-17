import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import { TaskStatus } from "./item";

export const PageWrapper = styled.div`
  width: 1302px;
  margin: 19px auto;

  .table-wrapper {
    width: 100% !important;
  }
  @media (max-width: 1302px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
  gap: 50px;
  display: grid;
  grid-template-columns: 1fr 200px;
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 1024px) {
    justify-content: center;
  }
`;
export const CalendarDay = styled(BaseCard)`
  max-width: 179px !important;
  height: 179px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  padding: 9px !important;

  span {
    color: rgba(69, 64, 99, 0.5);
  }
`;
export const DayHeader = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  display: flex;
  gap: 4px;
  height: 20px;

  @media (max-width: 1024px) {
    span {
      display: none;
    }
  }
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

export const EventWrapper = styled.button<{
  status?: "finished" | "pending" | "";
}>`
  display: flex;
  align-items: center;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  width: 155px;
  height: 100%;
  flex-grow: 1;
  /* transition: all 0.3s ease;

  &:hover{
    opacity: 0.9;
    background: #8080802f;
  }
  &:active{
    opacity: 0.7;
    background: #8080802f;
  } */
`;
export const EventUser = styled(UserAvatar)`
  img {
    width: 18px;
    height: 18px;
  }
`;
export const EventTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
  text-align: left;
`;
export const EventDescription = styled(Typography)`
  width: 100%;
  font-weight: var(--font-weight-semibold);
  font-size: 10px;
  line-height: 12px;
  color: rgba(69, 64, 99, 0.5);
  text-align: left;
  margin-top: auto !important;
  & div {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  & span {
    font-size: 16px;
    font-weight: var(--font-weight-medium);
    line-height: 19.41px;
    text-align: left;
  }

  & hr {
    background: #f3f4f6;
    min-height: 1px;
    border: none;
  }
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
export const SpecialTask = styled.div`
  border: 1px solid var(--color-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-left: 10px;
  padding-right: 10px;
  div {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
  }
  .left p {
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
  }
  .right p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    background-color: #05c9a11a;
    border-radius: 8px;
    padding: 4px 8px;
  }
`;
export const ProgressWrapper = styled.div`
  display: flex;
  gap: 25px;
  h3 {
    color: var(--color-text-muted);
    margin-top: 10px;
    margin-bottom: 10px;
  }
  .progress-container {
    display: flex;
    gap: 12px;
    border: 1px solid #b9bfc9;
    border-radius: 16px;
    padding: 12px;
    div {
      border: 3px solid #b9bfc9;
      border-radius: 100%;
      padding: 3px;
      p {
        background: #b9bfc9;
        color: white;
        border-radius: 100%;
        font-size: 12px;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
`;

export const ProgressFinished = styled.div`
  border-color: #49a186 !important;
  & p {
    background: #49a186 !important;
  }
`;

export const ProgressPending = styled.div`
  border-color: #d13c3e !important;
  & p {
    background: #d13c3e !important;
  }
`;
export const TasksList = styled.div`
  height: 100%;
`;
export const TodayItem = styled.div`
  background: #49a186;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const getColorByVariant = (variant: TaskStatus): string => {
  switch (variant) {
    case TaskStatus.missed:
      return "#D13C3E";
    case TaskStatus.done:
      return "#49A186";
    case TaskStatus.today:
      return "#F19A37";
    default:
      return "#49A186";
  }
};
const getBgByVariant = (variant: TaskStatus): string => {
  switch (variant) {
    case TaskStatus.missed:
      return "#FFE1E1";
    case TaskStatus.done:
      return "#E6FAF6";
    case TaskStatus.today:
      return "#FDF5E8";
    default:
      return "transparent";
  }
};

export const TaskLabel = styled.div<{ variant: TaskStatus }>`
  color: ${(props: any) => getColorByVariant(props.variant)};
  background: ${(props: any) => getBgByVariant(props.variant)};
  padding: 7.5px 8px;
  border-radius: 4px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 2px;
  svg {
    width: 13px;
    height: auto;
    padding: 1px;
  }
  margin-bottom: 8px;
`;

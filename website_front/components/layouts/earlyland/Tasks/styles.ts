import styled from "styled-components";
import BaseCard from "../../../global/common/BaseCard";
import UserAvatar from "../../../global/common/UserAvatar";
import Typography from "../../../global/common/Typography";

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
  grid-gap: 8px;
  grid-template-columns: repeat(7, 1fr);

  @media (max-width: 1550px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 1350px) {
    grid-template-columns: repeat(5, 1fr);
  }

  @media (max-width: 1100px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 830px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 630px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 420px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

export const CalendarDay = styled(BaseCard)`
  width: 100%;
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

export const getColorByStatus = (status: "finished" | "pending"): string => {
  const colors = {
    finished: "var(--color-primary-soft)",
    pending: "#c4c4002c",
  };

  return colors[status];
};

export const EventWrapper = styled.button<{
  status?: "finished" | "pending" | "";
}>`
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  border-radius: 4px;
  transition: all 0.3s ease;
  background: ${(props) =>
    props.status ? getColorByStatus(props.status) : "transparent"};

  &:hover {
    opacity: 0.9;
    background: #8080802f;
  }
  &:active {
    opacity: 0.7;
    background: #8080802f;
  }
`;

export const EventUser = styled(UserAvatar)`
  img {
    width: 18px;
    height: 18px;
  }
`;

export const EventTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-primary);
  width: 104px;

  @media (max-width: 420px) {
    width: 100%;
    margin-right: 100px !important;
  }
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

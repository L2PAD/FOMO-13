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

export const EventWrapper = styled.div`
  display: flex;
  align-items: center;
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

export const HeaderTitleWrapper = styled.div`
  margin-bottom: 16px;

  h1 {
    margin-bottom: 12px;
    font-weight: var(--font-weight-semibold);
    font-size: 32px;
    line-height: 39px;
  }
`;

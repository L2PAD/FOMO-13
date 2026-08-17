import React, { FC } from "react";
import useDates from "../../../../../hooks/useDates";
import { IEvent } from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";
import {
  EventWrapper,
  EventUser,
  EventTitle,
  EventDescription,
  EventTimeWrapper,
  EventBorder,
  EventInfo,
  EventTime,
} from "../styles";
import { cardVariants } from "../calendarItem/CalendarItem";

interface IProps {
  event: IEvent;
  index?: number;
}

const WeekCalendarItem: FC<IProps> = ({ event, index }) => {
  const { days, hours, minutes } = useDates(String(event.date), event.time);

  return (
    <EventWrapper
      isStart={!!event.isStart}
      isEnd={!!event.isEnd}
      // @ts-ignore
      background={cardVariants[index]?.bgColor || ""}
    >
      <EventBorder
        isStart={!!event.isStart}
        isEnd={!!event.isEnd}
        // @ts-ignore
        background={cardVariants[index]?.borderColor || ""}
      />
      {event.isStart ? (
        <EventInfo>
          <EventTitle
            // @ts-ignore
            color={cardVariants[index]?.textColor || ""}
          >
            {event?.name}
          </EventTitle>
          <EventTime
            // @ts-ignore
            color={cardVariants[index]?.textColor || ""}
          >
            {event.time} AM - {event.endTime} PM
          </EventTime>
        </EventInfo>
      ) : (
        <></>
      )}
      {/* <EventTimeWrapper>
      <i>{days}:{hours > 9 ? hours : `0${hours}`}:{minutes > 9 ? minutes : `0${minutes}`}</i>
      <span>dd hh mm</span>
    </EventTimeWrapper> */}
    </EventWrapper>
  );
};

export default WeekCalendarItem;

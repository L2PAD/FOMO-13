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
} from "../styles";

interface IProps {
  event: IEvent;
  index?: number;
}

export const cardVariants = {
  0: {
    borderColor: "#F79009",
    bgColor: "#FEF0C733",
    textColor: "#B54708",
  },
  1: {
    borderColor: "#2970FF",
    bgColor: "#D1E0FF33",
    textColor: "#004EEB",
  },
  2: {
    borderColor: "#6C737F",
    bgColor: "#EBEBEB",
    textColor: "#384250",
  },
  3: {
    borderColor: "#9E77ED",
    bgColor: "#EBE9ED",
    textColor: "#6941C6",
  },
  4: {
    borderColor: "#17B26A",
    bgColor: "#DCFAE633",
    textColor: "#067647",
  },
  5: {
    borderColor: "#F79009",
    bgColor: "#FEF0C733",
    textColor: "#B54708",
  },
  6: {
    borderColor: "#2970FF",
    bgColor: "#D1E0FF33",
    textColor: "#004EEB",
  },
  7: {
    borderColor: "#6C737F",
    bgColor: "#F3F4F633",
    textColor: "#384250",
  },
  8: {
    borderColor: "#17B26A",
    bgColor: "#DCFAE633",
    textColor: "#067647",
  },
};

const CalendarItem: FC<IProps> = ({ event, index }) => {
  const { days, hours, minutes } = useDates(String(event.date), event.time);

  return (
    <EventWrapper
      // @ts-ignore
      background={cardVariants[index]?.bgColor || ""}
    >
      <EventBorder
        // @ts-ignore
        background={cardVariants[index]?.borderColor || ""}
      />
      <EventTitle
        // @ts-ignore
        color={cardVariants[index]?.textColor || ""}
      >
        {event?.name}
      </EventTitle>
      {/* <EventTimeWrapper>
      <i>{days}:{hours > 9 ? hours : `0${hours}`}:{minutes > 9 ? minutes : `0${minutes}`}</i>
      <span>dd hh mm</span>
    </EventTimeWrapper> */}
    </EventWrapper>
  );
};

export default CalendarItem;

import React, { FC } from "react";
import useDates from "../../../../../hooks/useDates";
import { ITask } from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";
import {
  EventWrapper,
  EventUser,
  EventTitle,
  EventDescription,
  EventTimeWrapper,
} from "../styles";

interface IProps {
  event: ITask;
  openTaskDetails: (item: ITask) => void;
}

const TaskItem: FC<IProps> = ({ event, openTaskDetails }) => {
  const { days, hours, minutes } = useDates(String(event.date), event.time);

  return (
    <EventWrapper
      status={event.isFinished ? "finished" : event.isPending ? "pending" : ""}
      onClick={() => openTaskDetails(event)}
    >
      <EventUser
        avatar={
          typeof event?.project?.logo === "string"
            ? imageLoader(String(event.project.logo))
            : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
        }
        name="name"
        variant="default"
        size="xSmall"
      />
      <div>
        <EventTitle variant="p">{event?.project?.name}</EventTitle>
        <EventDescription variant="p">{event?.name}</EventDescription>
      </div>
      <EventTimeWrapper>
        <i>
          {days}:{hours > 9 ? hours : `0${hours}`}:
          {minutes > 9 ? minutes : `0${minutes}`}
        </i>
        <span>dd hh mm</span>
      </EventTimeWrapper>
    </EventWrapper>
  );
};

export default TaskItem;

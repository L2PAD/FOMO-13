/* eslint-disable */
import React, { FC } from "react";
import moment from "moment";
import useDates from "../../../../../../hooks/useDates";
import { ITask } from "../../../../../../types/global_types";
import UserAvatar from "../../../../../global/common/UserAvatar";
import StatusTag from "../../../../../global/TaskStatusTag";
import imageLoader from "../../../../../../helpers/imageLoader";
import Typography from "../../../../../global/common/Typography";
import {
  ContentWrapper,
  DateWrapper,
  EventNameWrapper,
  EventWrapper,
  ProjectDescription,
  ProjectTitle,
  ProjectWrapper,
  RatingWrapper,
  StatusWrapper,
  TimerItem,
  TimerWrapper,
} from "../styles";

interface IProps {
  item: ITask;
}

const EventItem: FC<IProps> = ({ item }) => {
  const { days, hours, minutes } = useDates(String(item.date), item.time);

  return (
    <EventWrapper>
      <ProjectWrapper>
        <UserAvatar
          name={item.name}
          avatar={imageLoader(String(item?.project?.logo))}
          size="small"
          variant="default"
        />
        <div>
          <ProjectTitle variant="p">{item?.project?.name}</ProjectTitle>
          <ProjectDescription variant="p">
            {item?.project?.banner}
          </ProjectDescription>
        </div>
      </ProjectWrapper>
      <StatusWrapper>
        {/*// @ts-ignore*/}
        <StatusTag
          variant={
            item.isFinished ? "finished" : item.isPending ? "pending" : "None"
          }
        />
      </StatusWrapper>
      <EventNameWrapper>
        <Typography variant="p">{item.name}</Typography>
      </EventNameWrapper>
      <DateWrapper>
        {moment(item.date).format("DD MMMM, YYYY HH:mm")}
      </DateWrapper>
      <TimerWrapper>
        <TimerItem variant="p">
          {days > 9 ? days : `0${days}`}
          <span>dd</span>
        </TimerItem>
        <TimerItem variant="p">
          {hours > 9 ? hours : `0${hours}`}
          <span>hh</span>
        </TimerItem>
        <TimerItem variant="p">
          {minutes > 9 ? minutes : `0${minutes}`}
          <span>m</span>
        </TimerItem>
      </TimerWrapper>
      <RatingWrapper>
        <span>Points:</span>
        <span>
          <b>{item.points}</b>
        </span>
      </RatingWrapper>
    </EventWrapper>
  );
};

export default EventItem;

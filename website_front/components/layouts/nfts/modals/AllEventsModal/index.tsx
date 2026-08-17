import React, { FC } from "react";
import moment from "moment";
import Modal from "../../../../global/common/Modal";
import { CalendarEvents } from "../../../../../staticContent/global";
import UserAvatar from "../../../../global/common/UserAvatar";
import StatusTag from "../../../../global/StatusTag";
import Typography from "../../../../global/common/Typography";
import { StarIcon } from "../../../../global/Icons";
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
} from "./styles";

interface Props {
  onClose: () => void;
  date: string;
}

const AllEventsModal: FC<Props> = ({ onClose, date }) => {
  return (
    <Modal
      onClose={onClose}
      title={`All events on ${moment(date).format("DD MMM")}`}
      variant="big"
    >
      <ContentWrapper>
        {CalendarEvents.map((item, i) => {
          return (
            <EventWrapper key={i}>
              <ProjectWrapper>
                <UserAvatar
                  name={item.name}
                  avatar={item.avatar}
                  size="small"
                  variant="default"
                />
                <div>
                  <ProjectTitle variant="p">{item.title}</ProjectTitle>
                  <ProjectDescription variant="p">
                    {item.description}
                  </ProjectDescription>
                </div>
              </ProjectWrapper>
              <StatusWrapper>
                {/*// @ts-ignore*/}
                <StatusTag variant={item.status} />
              </StatusWrapper>
              <EventNameWrapper>
                <Typography variant="p">{item.name}</Typography>
              </EventNameWrapper>
              <DateWrapper>
                {moment(item.date).format("DD MMMM, YYYY HH:mm")}
              </DateWrapper>
              <TimerWrapper>
                <TimerItem variant="p">
                  {moment(item.date).format("DD")}
                  <span>dd</span>
                </TimerItem>
                <TimerItem variant="p">
                  {moment(item.date).format("HH")}
                  <span>hh</span>
                </TimerItem>
                <TimerItem variant="p">
                  {moment(item.date).format("mm")}
                  <span>m</span>
                </TimerItem>
              </TimerWrapper>
              <RatingWrapper>
                <StarIcon fill="#FFC702" />
                <span>{item.rating}/100</span>
              </RatingWrapper>
            </EventWrapper>
          );
        })}
      </ContentWrapper>
    </Modal>
  );
};

export default AllEventsModal;

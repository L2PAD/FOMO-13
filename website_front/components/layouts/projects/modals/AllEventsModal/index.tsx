/* eslint-disable */
import React, { FC } from "react";
import moment from "moment";
import { IEvent } from "../../../../../types/global_types";
import { CalendarEvents } from "../../../../../staticContent/global";
import Modal from "../../../../global/common/Modal";
import UserAvatar from "../../../../global/common/UserAvatar";
import StatusTag from "../../../../global/StatusTag";
import Typography from "../../../../global/common/Typography";
import { StarIcon } from "../../../../global/Icons";
import imageLoader from "../../../../../helpers/imageLoader";
import EventItem from "./eventItem/EventItem";
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
  events?: Array<IEvent>;
}

const AllEventsModal: FC<Props> = ({ onClose, date, events }) => {
  return (
    <Modal
      onClose={onClose}
      title={`All events on ${moment(date).format("DD MMM")}`}
      variant="big"
    >
      <ContentWrapper>
        {events?.length ? (
          events.map((item: IEvent, i) => {
            return <EventItem item={item} key={item._id} />;
          })
        ) : (
          <></>
        )}
      </ContentWrapper>
    </Modal>
  );
};

export default AllEventsModal;

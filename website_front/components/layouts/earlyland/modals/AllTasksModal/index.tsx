import React, { FC } from "react";
import moment from "moment";
import { CalendarEvents } from "../../../../../staticContent/global";
import Modal from "../../../../global/common/Modal";
import UserAvatar from "../../../../global/common/UserAvatar";
import StatusTag from "../../../../global/StatusTag";
import Typography from "../../../../global/common/Typography";
import { StarIcon } from "../../../../global/Icons";
import { ITask } from "../../../../../types/global_types";
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
import EventItem from "./eventItem/EventItem";

interface Props {
  tasks: Array<ITask>;
  onClose: () => void;
  date: string;
}

const AllTasksModal: FC<Props> = ({ onClose, date, tasks }) => {
  return (
    <Modal
      onClose={onClose}
      title={`All tasks on ${moment(date).format("DD MMM")}`}
      variant="big"
    >
      <ContentWrapper>
        {tasks?.length ? (
          tasks.map((item: ITask) => {
            return <EventItem item={item} key={item._id} />;
          })
        ) : (
          <></>
        )}
      </ContentWrapper>
    </Modal>
  );
};

export default AllTasksModal;

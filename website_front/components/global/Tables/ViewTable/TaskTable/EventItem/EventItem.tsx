/* eslint-disable */
import React, { FC } from "react";
import moment from "moment";
import { StarIcon } from "../../../../Icons";
import useDates from "../../../../../../hooks/useDates";
import imageLoader from "../../../../../../helpers/imageLoader";
import { ITask } from "../../../../../../types/global_types";
import StatusTag from "../../../../TaskStatusTag";
import {
  AssetWrapper,
  BigAvatar,
  CardWrapper,
  PrivateWrapper,
  ProjectDescription,
  ProjectPercentage,
  ProjectTitle,
  ProjectTitleWrapper,
  PublicWrapper,
  SeedWrapper,
  StrategicWrapper,
  SupplyWrapper,
  TimerItem,
} from "../styles";

interface IProps {
  item: ITask;
  openTaskDetails?: (item: ITask) => void;
}

const EventItem: FC<IProps> = ({ item, openTaskDetails }) => {
  const { days, hours, minutes } = useDates(String(item.date), item.time);

  return (
    <CardWrapper
      onClick={() => openTaskDetails && openTaskDetails(item)}
      variant="default"
    >
      <AssetWrapper>
        <BigAvatar
          size="small"
          variant="default"
          avatar={imageLoader(String(item?.project?.logo))}
          name={String(item?.project?.name)}
          fallbackType="project"
        />
        <div>
          <ProjectTitleWrapper>
            <ProjectTitle variant="p">{item?.project?.name}</ProjectTitle>
            <ProjectPercentage>{item?.project?.fullness}</ProjectPercentage>
          </ProjectTitleWrapper>
          <ProjectDescription variant="p">
            {item?.project?.banner}
          </ProjectDescription>
        </div>
      </AssetWrapper>
      <SupplyWrapper>
        <StatusTag
          variant={
            item.isFinished ? "finished" : item.isPending ? "pending" : "None"
          }
        />
      </SupplyWrapper>
      <PublicWrapper>{item?.name}</PublicWrapper>
      <SeedWrapper>
        {moment(item.date).format("DD MMMM, YYYY HH:mm")}
      </SeedWrapper>
      <PrivateWrapper>
        <TimerItem>
          {days > 9 ? days : `0${days}`}
          <span>dd</span>
        </TimerItem>
        <TimerItem>
          {hours > 9 ? hours : `0${hours}`}
          <span>hh</span>
        </TimerItem>
        <TimerItem>
          {minutes > 9 ? minutes : `0${minutes}`}
          <span>m</span>
        </TimerItem>
      </PrivateWrapper>
      <StrategicWrapper>
        <StarIcon fill="#FFC702" />
        {item?.project?.rating}/100
      </StrategicWrapper>
    </CardWrapper>
  );
};

export default EventItem;

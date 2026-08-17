import React, { FC } from "react";
import Image from "next/image";
import useTimer from "../../../../hooks/useTimerWithTime";
import { IBannerItem } from "../../../../types/global_types";
import {
  TimerBlockWrapper,
  TimerButton,
  TimerSecondTitle,
  TimerTitle,
  TimerValue,
  TimerWrapper,
} from "./styles";
import imageLoader from "../../../../helpers/imageLoader";
import Button from "../../common/Button";

interface IProps {
  item: IBannerItem;
}

const BannerItem: FC<IProps> = ({ item }) => {
  const { days, hours, minutes, seconds } = useTimer(item.date, item.timeStart);

  return item.isTimerVisible ? (
    <TimerBlockWrapper>
      <img src={imageLoader(String(item.img))} alt={item.title} />
      <TimerWrapper>
        <TimerTitle variant="p">{item.title}</TimerTitle>
        <TimerSecondTitle variant="p">{item.description}</TimerSecondTitle>
        <p />
        <TimerSecondTitle variant="p">Contribution Closes:</TimerSecondTitle>
        <TimerValue>
          {days}d {hours}h {minutes}m {seconds}s
        </TimerValue>
        <Button variant="primary">See details</Button>
      </TimerWrapper>
    </TimerBlockWrapper>
  ) : (
    <img src={imageLoader(String(item.img))} alt={item.title} />
  );
};

export default BannerItem;

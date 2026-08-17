import React, { FC, useMemo } from "react";
import useDates from "../../../../../hooks/useDates";
import imageLoader from "../../../../../helpers/imageLoader";
import {
  EventWrapper,
  EventUser,
  EventTitle,
  EventDescription,
  EventTimeWrapper,
  EventBorder,
  EventInfo,
  EventXP,
  TaskWrapper,
} from "../styles";
import { ITask, TaskStatus } from "../../../../../types/global_types";

interface IProps {
  task: ITask;
  isPending?: boolean;
  isCompleted?: boolean;
  openTaskDetails: () => void;
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
  9: {
    borderColor: "#F04438",
    bgColor: "#FEE4E233",
    textColor: "#B42318",
  },
};

const TaskItem: FC<IProps> = ({
  task,
  isPending,
  isCompleted,
  openTaskDetails,
}) => {
  const taskDate = new Date(task.date);
  const isBeforeToday =
    taskDate.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

  const getTaskStatus = (task: ITask): TaskStatus => {
    const now = new Date();
    const taskDate = new Date(task.date);

    if (isPending) {
      return "pending";
    }

    if (task.isFinished || isCompleted) {
      return "completed";
    }

    if (isBeforeToday && !task.isFinished) {
      return "missed";
    }

    if (taskDate <= now && !task.isFinished) {
      return "in progress";
    }

    return "not started";
  };

  const currentVariant = useMemo(() => {
    if (!task) return {};

    const status = getTaskStatus(task);

    switch (status) {
      case "completed":
        return cardVariants[4];
      case "in progress":
        return cardVariants[0];
      case "not started":
        return cardVariants[7];
      case "missed":
        return cardVariants[9];
      case "pending":
        return cardVariants[6];
      default:
        return cardVariants[7];
    }
  }, [task, isPending, isCompleted]);

  return (
    <TaskWrapper
      tabIndex={0}
      // @ts-ignore
      background={currentVariant?.bgColor || ""}
      onClick={openTaskDetails}
    >
      <EventBorder
        // @ts-ignore
        background={currentVariant?.borderColor || ""}
      />
      <EventInfo>
        <EventXP
          // @ts-ignore
          color={currentVariant?.textColor || ""}
        >
          +{task.points} XP
        </EventXP>
        <EventTitle
          // @ts-ignore
          color={currentVariant?.textColor || ""}
        >
          {task?.name}
        </EventTitle>
        <EventXP
          // @ts-ignore
          color={currentVariant?.textColor || ""}
        >
          {isCompleted
            ? "Completed"
            : isBeforeToday
              ? "Missed"
              : isPending
                ? "Pending"
                : task?.smallDescription || ""}
        </EventXP>
      </EventInfo>
      {/* <EventTimeWrapper>
      <i>{days}:{hours > 9 ? hours : `0${hours}`}:{minutes > 9 ? minutes : `0${minutes}`}</i>
      <span>dd hh mm</span>
    </EventTimeWrapper> */}
    </TaskWrapper>
  );
};

export default TaskItem;

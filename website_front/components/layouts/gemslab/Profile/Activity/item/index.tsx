import React, { FC } from "react";
import useDates from "../../../../../../hooks/useDates";
import { ITask } from "../../../../../../types/global_types";
import imageLoader from "../../../../../../helpers/imageLoader";
import {
  EventWrapper,
  EventUser,
  EventTitle,
  EventDescription,
  EventTimeWrapper,
  TaskLabel,
  getColorByVariant,
} from "../styles";

interface IProps {
  task: ITask;
  openTaskDetails: (item: ITask) => void;
}

export enum TaskStatus {
  "missed",
  "done",
  "today",
  "active",
}

const TaskText = {
  missed: "Missed",
  done: "Done",
  today: "Task for Today",
  active: "Active",
};

const getTaskStatus = (task: ITask): TaskStatus => {
  if (task.isFinished) return TaskStatus.done;

  if (task.isTodayTask) return TaskStatus.today;

  if (task.isMissed) return TaskStatus.missed;

  return TaskStatus.active;
};

const ActivityTaskItem: FC<IProps> = ({ task, openTaskDetails }) => {
  console.log(task);
  return (
    <EventWrapper
      status={task.isFinished ? "finished" : task.isPending ? "pending" : ""}
      onClick={() => openTaskDetails(task)}
    >
      <TaskLabel variant={getTaskStatus(task)}>
        <svg
          width="8"
          height="9"
          viewBox="0 0 8 9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="4"
            cy="4.5"
            r="2"
            fill={getColorByVariant(getTaskStatus(task))}
          />
          <circle
            cx="4"
            cy="4.5"
            r="3.5"
            stroke={getColorByVariant(getTaskStatus(task))}
          />
        </svg>
        {
          //@ts-ignore
          TaskText[TaskStatus[getTaskStatus(task)]]
        }
      </TaskLabel>
      <EventTitle>{task?.name}</EventTitle>
      <EventDescription variant="div">
        <hr />
        <div>
          <span>{task?.points}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="13"
            viewBox="0 0 12 13"
            fill="none"
          >
            <path
              d="M1.2418 4.79642C1.15665 4.40832 1.16973 4.00476 1.2798 3.62314C1.38988 3.24153 1.5934 2.89421 1.87149 2.6134C2.14957 2.3326 2.49323 2.12738 2.87058 2.01679C3.24794 1.90621 3.64678 1.89382 4.03013 1.98079C4.24113 1.64687 4.5318 1.37207 4.87535 1.18172C5.2189 0.991375 5.60428 0.891602 5.99596 0.891602C6.38764 0.891602 6.77302 0.991375 7.11657 1.18172C7.46013 1.37207 7.7508 1.64687 7.96179 1.98079C8.34573 1.89344 8.74525 1.90577 9.12321 2.01663C9.50117 2.12749 9.84528 2.33327 10.1235 2.61484C10.4018 2.89641 10.6052 3.24462 10.7147 3.62708C10.8243 4.00953 10.8364 4.41382 10.7501 4.80232C11.0801 5.01583 11.3517 5.30996 11.5398 5.6576C11.7279 6.00525 11.8265 6.39521 11.8265 6.79155C11.8265 7.1879 11.7279 7.57786 11.5398 7.92551C11.3517 8.27315 11.0801 8.56728 10.7501 8.78079C10.8361 9.1687 10.8238 9.57229 10.7145 9.95414C10.6053 10.336 10.4025 10.6837 10.125 10.9651C9.84745 11.2465 9.50422 11.4525 9.1271 11.5639C8.74997 11.6752 8.35115 11.6885 7.96763 11.6023C7.75691 11.9375 7.46601 12.2135 7.12187 12.4047C6.77773 12.5959 6.39148 12.6961 5.99888 12.6961C5.60628 12.6961 5.22003 12.5959 4.87589 12.4047C4.53175 12.2135 4.24085 11.9375 4.03013 11.6023C3.64678 11.6893 3.24794 11.6769 2.87058 11.5663C2.49323 11.4557 2.14957 11.2505 1.87149 10.9697C1.5934 10.6889 1.38988 10.3416 1.2798 9.95997C1.16973 9.57835 1.15665 9.17479 1.2418 8.78669C0.90927 8.57375 0.63537 8.27916 0.445574 7.93033C0.255777 7.5815 0.15625 7.18976 0.15625 6.79155C0.15625 6.39335 0.255777 6.00161 0.445574 5.65278C0.63537 5.30395 0.90927 5.00936 1.2418 4.79642Z"
              fill="url(#paint0_linear_1929_920)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_1929_920"
                x1="5.99138"
                y1="0.891602"
                x2="5.99138"
                y2="12.6961"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FCD68D" />
                <stop offset="1" stopColor="#E59030" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </EventDescription>
    </EventWrapper>
  );
};

export default ActivityTaskItem;

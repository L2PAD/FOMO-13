import React, { useContext, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import moment from "moment";
import { WeekDaysShort } from "../../../../../staticContent/global";
import CustomDatePicker from "../../../../global/CustomDatePicker";
import CommentBlock from "../../../../global/CommentBlock";
import TriangleIcon from "../../../../global/Icons/TriangleIcon";
import ActivitiStarIcon from "../../../../global/Icons/ActivityStarIcon";
import fetchTasks from "../../../../../http/tasks/fetchTasks";
import { AuthContext } from "../../../../global/Layout";
import { useQuery } from "react-query";
import { ITask } from "../../../../../types/global_types";
import compareDates from "../../../../../helpers/compareDates";
import ActivityTaskItem from "./item";
import { splitArray } from "../../../../../helpers/splitArray";
import { getDateWithTime } from "../../../../../helpers/getTime";
import checkSvg from "../../../../../assets/icons/check.svg";
import {
  CalendarDay,
  ContentWrapper,
  DayHeader,
  HeaderWrapper,
  LeftHeaderWrapper,
  MobileWeekDayName,
  SpecialTask,
  ProgressWrapper,
  TasksList,
  ProgressFinished,
  ProgressPending,
  TodayItem,
} from "./styles";
import useComments from "../../../../../hooks/useComments";
import TaskDetailsModal from "../../../../global/modals/TaskDetailsModal";

export const Activity = () => {
  const { comments, confirmAddComment } = useComments(
    "comments/gemslab",
    "comments/gemslab"
  );
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const { userData } = useContext(AuthContext);
  const [tasks, setTasks] = useState<Array<ITask>>([]);
  const { data } = useQuery(["events"], () => fetchTasks("special"));
  const [taskDetails, setTaskDetails] = useState<ITask | null>(null);
  const [isTaskDetails, setIsTaskDetails] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<null | Date>(new Date());
  const [endDate, setEndDate] = useState<null | Date>(
    new Date(moment().add(20, "days").toString())
  );

  const confirmTaskByUser = (taskId: string): void => {
    setTasks((prev: Array<ITask>) => {
      return prev.map((task: ITask) => {
        if (task._id === taskId) {
          return { ...task, usersRequests: [userData._id] };
        }
        return task;
      });
    });
  };

  const updateDate = (dates: Date[]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const {
    daysArray,
    weeks,
  }: {
    daysArray: Array<{
      date: Date;
      tasks: Array<ITask>;
      status: "pending" | "finished" | "active";
    }>;
    weeks: Array<any>;
  } = useMemo((): any => {
    const datesArray = [];
    const currDate = moment(startDate).add(-1, "days").startOf("day");
    const lastDate = moment(endDate).add(1, "days").startOf("day");
    let totalPointsValue: number = 0;

    while (currDate.add(1, "days").diff(lastDate) < 0) {
      const currentDateEvents: Array<ITask> = [];

      for (let i = 0; i < tasks.length; i++) {
        const event = tasks[i];

        const currentDateEvent: boolean = compareDates(
          new Date(event.date),
          currDate.clone().toDate()
        );

        const isTodayTask: boolean =
          new Date(event.date).getDate() === new Date().getDate() &&
          new Date(event.date).getMonth() === new Date().getMonth();

        const isPending: boolean = !!event?.usersRequests?.includes(
          userData?._id
        );
        const isMissed: boolean =
          !event?.awardedUsers?.includes(userData?._id) &&
          getDateWithTime(event).getTime() < new Date().getTime();
        const isFinished: boolean = !!event?.awardedUsers?.includes(
          userData?._id
        );

        if (currentDateEvent) {
          currentDateEvents.push({
            ...event,
            isPending,
            isFinished,
            isMissed,
            isTodayTask,
          });
          totalPointsValue += event.points;
        }
      }

      let status: "pending" | "finished" | "missed" | "active" = "active";

      for (let index = 0; index < currentDateEvents.length; index++) {
        const event: any = currentDateEvents[index];

        if (event.isFinished) {
          status = "finished";
          break;
        }
        if (event.isPending) {
          status = "pending";
        }
        if (event.isMissed) {
          status = "missed";
        }
      }

      datesArray.push({
        date: currDate.clone().toDate(),
        tasks: currentDateEvents,
        status,
      });
    }

    setTotalPoints(totalPointsValue);

    const weeks: Array<any> = splitArray(datesArray, 7);

    return { daysArray: datesArray, weeks };
  }, [tasks, startDate, endDate]);

  useEffect(() => {
    if (data?.tasks) {
      setTasks(data.tasks);
    }
  }, [data]);

  return (
    <>
      <>
        <br />
        <HeaderWrapper>
          <LeftHeaderWrapper>
            <SpecialTask>
              <div className="left">
                <TriangleIcon />
                <p>Special task</p>
              </div>
              <div className="right">
                <p>Quest points: {totalPoints}</p>
                <ActivitiStarIcon />
              </div>
            </SpecialTask>
          </LeftHeaderWrapper>
          <CustomDatePicker
            onChange={updateDate}
            startDate={startDate}
            endDate={endDate}
          />
        </HeaderWrapper>
        <br />
        <ContentWrapper>
          {daysArray.map((item: { date: Date; tasks: Array<ITask> }, i) => {
            return (
              <CalendarDay variant="default" key={i}>
                <DayHeader>
                  <span>
                    {i < 7 &&
                      `${
                        WeekDaysShort[
                          moment(item.date).day() === 0
                            ? 6
                            : moment(item.date).day() - 1
                        ]
                      },`}
                  </span>{" "}
                  <MobileWeekDayName>{`${
                    WeekDaysShort[
                      moment(item.date).day() === 0
                        ? 6
                        : moment(item.date).day() - 1
                    ]
                  },`}</MobileWeekDayName>
                  {new Date(item.date).getDate() === new Date().getDate() &&
                  new Date(item.date).getMonth() === new Date().getMonth() ? (
                    <TodayItem>{moment(item.date).format("D")}</TodayItem>
                  ) : (
                    moment(item.date).format("D")
                  )}
                </DayHeader>
                <TasksList>
                  {item.tasks.map((item: ITask) => {
                    return (
                      <ActivityTaskItem
                        key={item._id}
                        task={item}
                        openTaskDetails={(item: ITask) => {
                          setIsTaskDetails(true);
                          setTaskDetails(item);
                        }}
                      />
                    );
                  })}
                </TasksList>
              </CalendarDay>
            );
          })}
        </ContentWrapper>
        <br />
        <br />
        <h3>Progress</h3>
        <ProgressWrapper>
          {weeks.map((week: Array<any>, index: number) => {
            return (
              <div>
                <h3>Week {index + 1}</h3>
                <div className="progress-container">
                  {week.map(
                    (day: { date: Date; status: any }, index: number) => {
                      if (day.status === "finished") {
                        return (
                          <ProgressFinished key={index}>
                            <p>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                              >
                                <path
                                  d="M9 2.5L3.5 8L1 5.5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </p>
                          </ProgressFinished>
                        );
                      }
                      if (day.status === "missed") {
                        return (
                          <ProgressPending key={index}>
                            <p>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="8"
                                height="8"
                                viewBox="0 0 8 8"
                                fill="none"
                              >
                                <path
                                  d="M6.5 1.5L1.5 6.5M1.5 1.5L6.5 6.5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </p>
                          </ProgressPending>
                        );
                      }
                      return (
                        <div key={index}>
                          <p>{index + 1}</p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </ProgressWrapper>
      </>
      {isTaskDetails ? (
        <TaskDetailsModal
          isSpecial
          confirmTaskByUser={confirmTaskByUser}
          isVisible={isTaskDetails}
          onClose={() => {
            setIsTaskDetails(false);
            setTaskDetails(null);
          }}
          task={taskDetails}
        />
      ) : (
        <></>
      )}
    </>
  );
};

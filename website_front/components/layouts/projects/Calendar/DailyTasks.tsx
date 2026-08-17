/* eslint-disable */
import React, { useEffect, useState, useContext, useMemo, FC } from "react";
import { useSelector } from "react-redux";
import Image from "next/image";
import moment from "moment";
import useFetch from "../../../../hooks/useFetch";
import useComments from "../../../../hooks/useComments";
import { LocationContext } from "../../../global/Layout";
import { AuthContext } from "../../../global/Layout";
import Filter from "../../../global/Filter";
import CustomDatePicker from "../../../global/CustomDatePicker";
import {
  CalendarEvents,
  WeekDaysShort,
} from "../../../../staticContent/global";
import AllEventsModal from "../modals/AllEventsModal";
import { CloseIcon, GridIcon } from "../../../global/Icons";
import ViewTable from "../../../global/Tables/ViewTable";
import { authState } from "../../../../store/slices/authSlice";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../FomoChat/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { SearchInput, SearchWrapper } from "../P2PExchange/styles";
import CommentBlock from "../../../global/CommentBlock";
import { Sort } from "../../../global/common/Sort";
import { ITask } from "../../../../types/global_types";
import compareDates from "../../../../helpers/compareDates";
import CalendarItem from "./calendarItem/CalendarItem";
import Switch from "../../../UI/inputs/switch";
import CreateEventModal from "../../../global/modals/create_event_modal";
import CalendarAddIcon from "../../../../assets/icons/calendar-plus.svg";
import CalendarLeftIcon from "../../../../assets/icons/calendar-left-arrow.svg";
import CalendarTodayIcon from "../../../../assets/icons/calendar-today.svg";
import CalendarRightIcon from "../../../../assets/icons/calendar-right-arrow.svg";
import { useQuery } from "react-query";
import fetchEvents from "../../../../http/events/fetchEvents";
import {
  MainInfo,
  MainInfoDescription,
  PageWrapper,
} from "../CryptoMarket/styles";
import {
  AddEventButton,
  CalendarDay,
  ContentWrapper,
  DayHeader,
  GridButton,
  HeaderWrapper,
  LeftHeaderWrapper,
  ShowAllButton,
  MobileWeekDayName,
  RightHeaderWrapper,
  MonthValue,
  ModeButtons,
  ModeButton,
  CalendarActions,
  WeekHeader,
  CalendarDayWrapper,
  Overlay,
  CurrentDayLabel,
} from "./daily-styles";
import WeekGrid from "./WeekGrid";
import DayGrid from "./DayGrid";
import TaskItem from "./TaskItem/TaskItem";
import fetchTasks from "../../../../http/tasks/fetchTasks";
import TaskDetailsModal from "../../../global/modals/TaskDetailsModal";
import { CalendarContainer, CalendarWrapper } from "./styles";
import { useTranslation } from "i18n";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type CalendarModes = "Days" | "Week" | "Month";

interface IProps {
  isProfile?: boolean;
}

const DailyTasks: FC<IProps> = ({ isProfile = false }) => {
  const { translateText } = useTranslation();
  const { path } = useContext(LocationContext);
  const { userData } = useContext(AuthContext);
  const [searchValue, setSearchValue] = useState<string>("");
  const [isTaskDetails, setIsTaskDetails] = useState<boolean>(false);
  const [taskDetails, setTaskDetails] = useState<ITask | null>(null);

  const [isCreateEventModal, setIsCreateEventModal] = useState<boolean>(false);
  const [createEventDate, setCreateEventDate] = useState<Date>(new Date());

  const [isPrivateEvents, setIsPrivateEvents] = useState<boolean>(
    !!userData.isFullAuth
  );
  const [isGrid, setIsGrid] = useState(true);
  const [startDate, setStartDate] = useState<null | Date>(new Date());
  const [endDate, setEndDate] = useState<null | Date>(
    new Date(moment().add(34, "days").toString())
  );
  const [calendarMode, setCalendarMode] = useState<CalendarModes>("Month");
  const [events, setEvents] = useState<Array<ITask>>([]);
  const [currentDayEvents, setCurrentDayEvents] = useState<Array<ITask>>([]);
  const [currentDate, setCurrentDate] = useState<Date | string>(new Date());
  const [eventsModal, setEventsModal] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const { refetch } = useQuery(
    ["daily-tasks", isPrivateEvents],
    () => fetchTasks(`default?userId=${userData?._id}`),
    {
      onSuccess: ({ tasks }) => {
        setEvents(tasks);
      },
    }
  );

  const confirmTask = async () => {
    await refetch();
  };

  const daysArray: Array<{
    date: Date;
    events: Array<ITask>;
    isCurrentMonth: boolean;
    isTodayMonth: boolean;
  }> = useMemo(() => {
    const datesArray = [];
    const startDay = moment(startDate).startOf("day");

    const nearestSunday = startDay.clone().startOf("week");
    const totalDays = 7;

    for (let i = 0; i < totalDays; i++) {
      const currentDay = nearestSunday.clone().add(i, "days");

      const eventOfTheDay = events.find((event) => {
        const isSearchValid = searchValue
          ? event?.project?.name
              ?.toLowerCase()
              .includes(searchValue.toLowerCase())
          : true;

        const isSameDate = compareDates(
          new Date(event.date || new Date()),
          currentDay.toDate()
        );

        return isSearchValid && isSameDate;
      });

      const isCurrentMonth =
        currentDay.month() === moment().month() &&
        currentDay.year() === moment().year();

      const isTodayMonth =
        currentDay.date() === moment().date() &&
        currentDay.month() === moment().month() &&
        currentDay.year() === moment().year();

      datesArray.push({
        date: currentDay.toDate(),
        events: eventOfTheDay ? [eventOfTheDay] : [],
        isCurrentMonth,
        isTodayMonth,
      });
    }

    return datesArray;
  }, [events, startDate, searchValue]);

  const isCurrentWeek = moment(startDate).isSame(moment(), "week");

  return (
    <>
      <HeaderWrapper>
        <MonthValue>{translateText("Daily Tasks")}</MonthValue>
        <CalendarActions>
          <button
            // @ts-ignore
            onClick={() =>
              setStartDate(moment(startDate).subtract(1, "week").toDate())
            }
          >
            <Image src={CalendarLeftIcon} alt="prev month" />
          </button>
          <button onClick={() => setStartDate(new Date())}>
            <Image src={CalendarTodayIcon} alt="today events" />
          </button>
          <button
            disabled={isCurrentWeek}
            // @ts-ignore
            onClick={() =>
              setStartDate(moment(startDate).add(1, "week").toDate())
            }
          >
            <Image src={CalendarRightIcon} alt="next month" />
          </button>
        </CalendarActions>
      </HeaderWrapper>
      <CalendarContainer>
        <CalendarWrapper>
          {calendarMode === "Month" ? (
            <WeekHeader>
              {weekDays.map((item: string, index: number) => {
                const day = daysArray.slice(0, 7)[index];
                const isToday = day?.isTodayMonth;

                return (
                  <div className="week-header-item" key={item}>
                    <span>{translateText(item)}</span>
                    {isToday ? (
                      <DayHeader isCurrentDay={true} isCurrentMonth={true}>
                        <span>{moment(new Date()).date()}</span>
                      </DayHeader>
                    ) : (
                      <span>{new Date(day.date).getDate()}</span>
                    )}
                  </div>
                );
              })}
            </WeekHeader>
          ) : (
            <></>
          )}
          {calendarMode === "Month" ? (
            <ContentWrapper>
              {daysArray.map((item: any, i) => {
                const isCurrentModalDay: boolean =
                  moment(createEventDate).date() === moment(item.date).date() &&
                  moment(createEventDate).month() ===
                    moment(item.date).month() &&
                  moment(createEventDate).year() === moment(item.date).year();

                return (
                  <CalendarDayWrapper key={i}>
                    <CalendarDay tabIndex={0}>
                      <div>
                        {item?.events?.map((taskItem: ITask, index: number) => {
                          return (
                            <TaskItem
                              key={taskItem._id}
                              task={taskItem}
                              isPending={taskItem.usersRequests?.includes(
                                userData?._id
                              )}
                              isCompleted={taskItem.awardedUsers?.includes(
                                userData?._id
                              )}
                              openTaskDetails={() => {
                                setIsTaskDetails(true);
                                setTaskDetails(taskItem);
                              }}
                            />
                          );
                        })}
                      </div>
                    </CalendarDay>
                  </CalendarDayWrapper>
                );
              })}
            </ContentWrapper>
          ) : (
            <></>
          )}
        </CalendarWrapper>
      </CalendarContainer>
      {isTaskDetails ? (
        <TaskDetailsModal
          confirmTaskByUser={confirmTask}
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

export default DailyTasks;

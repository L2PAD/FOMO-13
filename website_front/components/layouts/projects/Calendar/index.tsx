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
import { IEvent } from "../../../../types/global_types";
import compareDates from "../../../../helpers/compareDates";
import { sanitizedHtml } from "../../../../helpers/sanitizeHtml";
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
  CalendarWrapper,
  CalendarContainer,
} from "./styles";
import WeekGrid from "./WeekGrid";
import DayGrid from "./DayGrid";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type CalendarModes = "Days" | "Week" | "Month";

interface IProps {
  isProfile?: boolean;
}

const Calendar: FC<IProps> = ({ isProfile = false }) => {
  const { path } = useContext(LocationContext);
  const { userData } = useContext(AuthContext);
  const [searchValue, setSearchValue] = useState<string>("");

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
  const [events, setEvents] = useState<Array<IEvent>>([]);
  const [currentDayEvents, setCurrentDayEvents] = useState<Array<IEvent>>([]);
  const [currentDate, setCurrentDate] = useState<Date | string>(new Date());
  const [eventsModal, setEventsModal] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  useQuery(
    ["events", isPrivateEvents],
    () => fetchEvents(isPrivateEvents, path),
    {
      onSuccess: ({ events }) => {
        setEvents(events);
      },
    }
  );
  const { comments, confirmAddComment, refetch } = useComments(
    `comments/${path}`,
    `comments/${path}`
  );

  const openEventsModal = (events: Array<IEvent>, date: Date) => {
    setCurrentDayEvents(events);
    setEventsModal(true);
    setCurrentDate(date);
  };

  const closeEventsModal = () => {
    setEventsModal(false);
  };

  const updateDate = (dates: Date[]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const daysArray: Array<{
    date: Date;
    events: Array<IEvent>;
    isCurrentMonth: boolean;
    isTodayMonth: boolean;
  }> = useMemo(() => {
    const datesArray = [];
    const startDay = moment(startDate).startOf("day");

    const nearestSunday = startDay.clone().startOf("week");
    const totalDays = 35;

    for (let i = 0; i < totalDays; i++) {
      const currentDay = nearestSunday.clone().add(i, "days");
      const currentDateEvents: Array<IEvent> = [];

      for (let j = 0; j < events.length; j++) {
        const event = events[j];
        let isSearchValid: boolean = true;

        if (searchValue) {
          isSearchValid = !!event?.project?.name
            .toLowerCase()
            .includes(searchValue.toLowerCase());
        }

        const currentDateEvent: boolean = compareDates(
          new Date(event.date || new Date()),
          currentDay.clone().toDate()
        );

        if (isSearchValid && currentDateEvent) {
          currentDateEvents.push(event);
        }
      }

      const isCurrentMonth: boolean =
        currentDay.month() === moment().month() &&
        currentDay.year() === moment().year();

      const isTodayMonth: boolean =
        currentDay.date() === moment().date() &&
        currentDay.month() === moment().month() &&
        currentDay.year() === moment().year();

      datesArray.push({
        date: currentDay.toDate(),
        events: currentDateEvents,
        isCurrentMonth,
        isTodayMonth,
        currentDay,
      });
    }

    return datesArray;
  }, [events, startDate, searchValue]);

  const getMonthsRange = (events: { date: Date; events: any[] }[]): string => {
    const uniqueMonthsYears = Array.from(
      new Set(
        events.map(({ date }) => {
          const month = date.toLocaleString("en-US", { month: "long" });
          const year = date.getFullYear();
          return `<div>${month}</div> <span>${year}</span>`;
        })
      )
    );

    if (uniqueMonthsYears.length === 1) {
      return uniqueMonthsYears[0];
    }

    return `${uniqueMonthsYears[0]}`;
  };

  return (
    <PageWrapper>
      {!isProfile ? (
        <>
          <MainInfo>
            <MainInfoDescription>
              <Typography className="main-title" variant="h1">
                Calendar
              </Typography>
              <br />
              Stay organized with key dates and events tailored for both
              beginners and experts. Customize your calendar to track important
              milestones in the crypto world.
              <SearchWrapper>
                <SearchInput
                  type="text"
                  placeholder="Search on page"
                  onChange={(value: string) => setSearchValue(value)}
                  leftIcon={<SearchIconStyle />}
                  value={searchValue}
                />
              </SearchWrapper>
            </MainInfoDescription>
          </MainInfo>
          <br />
        </>
      ) : (
        <></>
      )}
      <HeaderWrapper>
        <MonthValue
          dangerouslySetInnerHTML={sanitizedHtml(getMonthsRange(daysArray || []))}
        ></MonthValue>
        <ModeButtons>
          <ModeButton
            onClick={() => setCalendarMode("Days")}
            isActive={calendarMode === "Days"}
          >
            Day
          </ModeButton>
          <ModeButton
            onClick={() => setCalendarMode("Week")}
            isActive={calendarMode === "Week"}
          >
            Week
          </ModeButton>
          <ModeButton
            onClick={() => setCalendarMode("Month")}
            isActive={calendarMode === "Month"}
          >
            Month
          </ModeButton>
        </ModeButtons>
        <CalendarActions>
          {userData?.isFullAuth ? (
            <Switch
              leftLabel={"All"}
              rightLabel={"Private"}
              checked={isPrivateEvents}
              onChange={() => setIsPrivateEvents((prev) => !prev)}
            />
          ) : (
            <></>
          )}
          {userData?.isFullAuth && isPrivateEvents ? (
            <button
              onClick={() => {
                setCreateEventDate(new Date());
                setIsCreateEventModal(true);
              }}
            >
              <Image src={CalendarAddIcon} alt="add events" />
            </button>
          ) : (
            <></>
          )}
          <button
            // @ts-ignore
            onClick={() =>
              setStartDate(
                moment(startDate)
                  .subtract({ [calendarMode.toLowerCase()]: 1 } as any)
                  .toDate()
              )
            }
          >
            <Image src={CalendarLeftIcon} alt="prev month" />
          </button>
          <button onClick={() => setStartDate(new Date())}>
            <Image src={CalendarTodayIcon} alt="today events" />
          </button>
          <button
            // @ts-ignore
            onClick={() =>
              setStartDate(
                moment(startDate)
                  .add({ [calendarMode.toLowerCase()]: 1 } as any)
                  .toDate()
              )
            }
          >
            <Image src={CalendarRightIcon} alt="next month" />
          </button>
        </CalendarActions>
      </HeaderWrapper>
      <CalendarContainer>
        {calendarMode === "Month" ? (
          <WeekHeader>
            {weekDays.map((item: string) => {
              return <div key={item}>{item}</div>;
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
                moment(createEventDate).month() === moment(item.date).month() &&
                moment(createEventDate).year() === moment(item.date).year();

              return (
                <CalendarDayWrapper key={i}>
                  <CalendarDay
                    tabIndex={0}
                    onClick={() => {
                      if (userData.isFullAuth && isPrivateEvents) {
                        setCreateEventDate(new Date(item.date));
                        setIsCreateEventModal(true);
                      }
                    }}
                  >
                    <DayHeader
                      isCurrentDay={item.isTodayMonth}
                      isCurrentMonth={item.isCurrentMonth}
                    >
                      <span>{moment(item.date).date()}</span>
                    </DayHeader>
                    <div>
                      {item?.events?.map((eventItem: IEvent, index: number) => {
                        return (
                          <CalendarItem
                            key={eventItem._id}
                            index={index}
                            event={eventItem}
                          />
                        );
                      })}
                    </div>
                  </CalendarDay>
                  <CreateEventModal
                    isOpen={isCreateEventModal && isCurrentModalDay}
                    onSuccessCreate={(event: IEvent) => {
                      setEvents((prev: Array<IEvent>) => {
                        return [event, ...prev];
                      });
                    }}
                    onClose={() => setIsCreateEventModal(false)}
                    date={createEventDate}
                  />
                </CalendarDayWrapper>
              );
            })}
          </ContentWrapper>
        ) : (
          <></>
        )}

        {calendarMode === "Week" ? (
          <WeekGrid weekDays={daysArray.slice(0, 7)} />
        ) : (
          <></>
        )}

        {calendarMode === "Days" ? (
          <DayGrid
            day={
              daysArray.find((day) =>
                moment(day.date).isSame(moment(startDate), "day")
              ) || daysArray[0]
            }
          />
        ) : (
          <></>
        )}
      </CalendarContainer>

      {!isProfile ? (
        <CommentBlock
          items={comments}
          addComment={confirmAddComment}
          refetch={refetch}
        />
      ) : (
        <></>
      )}
      {eventsModal ? (
        <AllEventsModal
          events={currentDayEvents}
          date={moment(currentDate).toString()}
          onClose={closeEventsModal}
        />
      ) : (
        <></>
      )}
      {isCreateEventModal ? (
        <Overlay onClick={() => setIsCreateEventModal(false)}></Overlay>
      ) : (
        <></>
      )}
    </PageWrapper>
  );
};

export default Calendar;

import React, { useContext, useEffect, useMemo, useState } from "react";
import moment from "moment";
import Filter from "../../../global/Filter";
import CustomDatePicker from "../../../global/CustomDatePicker";
import { WeekDaysShort } from "../../../../staticContent/global";
import AllEventsModal from "../../projects/modals/AllEventsModal";
import { CloseIcon, GridIcon } from "../../../global/Icons";
import ViewTable from "../../../global/Tables/ViewTable";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { SearchInput, SearchWrapper } from "../../projects/P2PExchange/styles";
import CommentBlock from "../../../global/CommentBlock";
import { Sort } from "../../../global/common/Sort";
import { AuthContext, LocationContext } from "../../../global/Layout";
import { IEvent } from "../../../../types/global_types";
import fetchEvents from "../../../../http/events/fetchEvents";
import { useQuery } from "react-query";
import useComments from "../../../../hooks/useComments";
import compareDates from "../../../../helpers/compareDates";
import Switch from "../../../UI/inputs/switch";
import CalendarItem from "../../projects/Calendar/calendarItem/CalendarItem";
import CreateEventModal from "../../../global/modals/create_event_modal";
import {
  AddEventButton,
  CalendarDay,
  ContentWrapper,
  DayHeader,
  GridButton,
  HeaderWrapper,
  LeftHeaderWrapper,
  PageWrapper,
  ShowAllButton,
  MobileWeekDayName,
  RightHeaderWrapper,
} from "./styles";

interface IProps {}

const Calendar = () => {
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
    new Date(moment().add(30, "days").toString())
  );
  const [events, setEvents] = useState<Array<IEvent>>([]);
  const [currentDayEvents, setCurrentDayEvents] = useState<Array<IEvent>>([]);
  const [currentDate, setCurrentDate] = useState<Date | string>(new Date());
  const [eventsModal, setEventsModal] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const { data } = useQuery(["events", isPrivateEvents], () =>
    fetchEvents(isPrivateEvents, path)
  );
  const { comments, confirmAddComment } = useComments(
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

  const daysArray: Array<{ date: Date; events: Array<IEvent> }> =
    useMemo(() => {
      const isEvents = !!events.length;

      const datesArray = [];
      const currDate = moment(startDate).add(-1, "days").startOf("day");
      const lastDate = moment(endDate).add(1, "days").startOf("day");

      while (currDate.add(1, "days").diff(lastDate) < 0) {
        const currentDateEvents: Array<IEvent> = [];

        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          let isSearchValid: boolean = true;

          if (searchValue) {
            isSearchValid = !!event?.project?.name
              .toLowerCase()
              .includes(searchValue.toLowerCase());
          }

          const currentDateEvent: boolean = compareDates(
            new Date(event?.date || ""),
            currDate.clone().toDate()
          );

          isSearchValid && currentDateEvent && currentDateEvents.push(event);
        }

        datesArray.push({
          date: currDate.clone().toDate(),
          events: currentDateEvents,
        });
      }

      return datesArray;
    }, [events, startDate, endDate, searchValue]);

  useEffect(() => {
    if (data?.events) {
      setEvents(data.events);
    }
  }, [data]);

  return (
    <PageWrapper>
      <Typography variant="h1">Calendar</Typography>
      <br />
      <Subtitle>
        A useful tool for beginners and pros. All important dates and events are
        here for you. You may adjust your calendar, put there things you need.
        With our notification you will not miss anything.
      </Subtitle>
      <SearchWrapper>
        <SearchInput
          type="text"
          placeholder="Search the project/fund/person"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
          value={searchValue}
        />

        <Sort
          label="Sort by"
          type="name / date"
          options={[
            {
              label: "Name",
              items: ["A-Z", "Z-A"],
              value: name,
              setValue: setName,
            },
            {
              label: "Date",
              items: ["New", "Old"],
              value: date,
              setValue: setDate,
            },
          ]}
        />
      </SearchWrapper>
      <br />
      <HeaderWrapper>
        <LeftHeaderWrapper>
          <Filter />
          <GridButton onClick={() => setIsGrid((state) => !state)}>
            <GridIcon fill="#070B35" />
            Show in {isGrid ? "row" : "grid"}
          </GridButton>
        </LeftHeaderWrapper>
        <RightHeaderWrapper>
          {userData?.isFullAuth ? (
            <Switch
              leftLabel="All"
              rightLabel="Private"
              checked={isPrivateEvents}
              onChange={() => setIsPrivateEvents((prev) => !prev)}
            />
          ) : (
            <></>
          )}
          <CustomDatePicker
            onChange={updateDate}
            startDate={startDate}
            endDate={endDate}
          />
        </RightHeaderWrapper>
      </HeaderWrapper>
      {isGrid ? (
        <ContentWrapper>
          {daysArray.map((item: any, i) => {
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
                  {`${moment(item.date).format("MMM")} ${moment(item.date).format("D")}`}
                </DayHeader>
                <div>
                  {item?.events?.map((eventItem: IEvent) => {
                    return (
                      <CalendarItem key={eventItem._id} event={eventItem} />
                    );
                  })}
                </div>
                <ShowAllButton
                  onClick={() => openEventsModal(item?.events, item.date)}
                >
                  Show all ({item?.events?.length})
                </ShowAllButton>
                {userData?.isFullAuth && isPrivateEvents ? (
                  <AddEventButton
                    onClick={() => {
                      setCreateEventDate(new Date(item.date));
                      setIsCreateEventModal(true);
                    }}
                  >
                    <CloseIcon fill="#00C099" />
                  </AddEventButton>
                ) : (
                  <></>
                )}
              </CalendarDay>
            );
          })}
        </ContentWrapper>
      ) : (
        <ViewTable type="event" cardsData={daysArray} />
      )}
      <CommentBlock items={comments} addComment={confirmAddComment} />
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
        <CreateEventModal
          onSuccessCreate={(event: IEvent) => {
            setEvents((prev: Array<IEvent>) => {
              return [event, ...prev];
            });
          }}
          onClose={() => setIsCreateEventModal(false)}
          date={createEventDate}
        />
      ) : (
        <></>
      )}
    </PageWrapper>
  );
};

export default Calendar;

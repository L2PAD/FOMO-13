import React, { useEffect, useState } from "react";
import moment from "moment";
import { useSelector } from "react-redux";
import Filter from "../../../global/Filter";
import CustomDatePicker from "../../../global/CustomDatePicker";
import {
  CalendarEvents,
  WeekDaysShort,
} from "../../../../staticContent/global";
import AllEventsModal from "../modals/AllEventsModal";
import { CloseIcon, GridIcon } from "../../../global/Icons";
import ViewTable from "../../../global/Tables/ViewTable";
import { HeaderDescription } from "../Funds/Fund/styles";
import { authState } from "../../../../store/slices/authSlice";
import {
  AddEventButton,
  CalendarDay,
  ContentWrapper,
  DayHeader,
  EventDescription,
  EventTimeWrapper,
  EventTitle,
  EventUser,
  EventWrapper,
  GridButton,
  HeaderWrapper,
  LeftHeaderWrapper,
  PageWrapper,
  ShowAllButton,
  MobileWeekDayName,
  HeaderTitleWrapper,
} from "./styles";

const Tasks = () => {
  const [isGrid, setIsGrid] = useState(true);
  const [startDate, setStartDate] = useState<null | Date>(new Date());
  const [endDate, setEndDate] = useState<null | Date>(
    new Date(moment().add(30, "days").toString())
  );
  const [daysArray, setDaysArray] = useState<Date[]>([]);
  const [eventsModal, setEventsModal] = useState(false);

  const { isLogin } = useSelector(authState);
  const openEventsModal = () => {
    setEventsModal(true);
  };

  const closeEventsModal = () => {
    setEventsModal(false);
  };

  const updateDaysArray = (start: Date, end: Date) => {
    const datesArray = [];

    const currDate = moment(start).add("days", 0).startOf("day");
    const lastDate = moment(end).add("days", 1).startOf("day");

    while (currDate.add(1, "days").diff(lastDate) < 0) {
      datesArray.push(currDate.clone().toDate());
    }

    WeekDaysShort.forEach((item, i) => {
      if (i < moment(startDate).day()) {
        datesArray.unshift(moment(start).add("days", -i));
      }
    });

    if (lastDate.diff(currDate, "days") < 7) {
      WeekDaysShort.forEach((item, i) => {
        if (lastDate.diff(currDate, "days") + i < 7) {
          datesArray.push(moment(end).add("days", i + 1));
        }
      });
    }

    setDaysArray(datesArray);
  };

  const updateDate = (dates: Date[]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    updateDaysArray(start, end);
  };

  useEffect(() => {
    //@ts-ignore
    updateDaysArray(startDate, endDate);
    //eslint-disable-next-line
  }, []);

  return (
    <PageWrapper>
      <HeaderTitleWrapper>
        <h1>Tasks</h1>
        <HeaderDescription variant="p">
          Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
          sint. Velit officia consequat duis enim velit mollit. Exercitation
          veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
          ullamco est sit aliqua dolor do amet sint. Velit officia consequat
          duis enim velit mollit.
        </HeaderDescription>
      </HeaderTitleWrapper>
      <HeaderWrapper>
        <LeftHeaderWrapper>
          <Filter />
          <GridButton onClick={() => setIsGrid((state) => !state)}>
            <GridIcon fill="#070B35" />
            Show in {isGrid ? "row" : "grid"}
          </GridButton>
        </LeftHeaderWrapper>
        <CustomDatePicker
          onChange={updateDate}
          startDate={startDate}
          endDate={endDate}
        />
      </HeaderWrapper>
      {isGrid ? (
        <ContentWrapper>
          {daysArray.map((item, i) => {
            return (
              <CalendarDay variant="default" key={i}>
                <DayHeader>
                  <span>
                    {i < 7 &&
                      `${
                        WeekDaysShort[
                          moment(item).day() === 0 ? 6 : moment(item).day() - 1
                        ]
                      },`}
                  </span>{" "}
                  <MobileWeekDayName>{`${
                    WeekDaysShort[
                      moment(item).day() === 0 ? 6 : moment(item).day() - 1
                    ]
                  },`}</MobileWeekDayName>
                  {`${moment(item).format("MMM")} ${moment(item).format("D")}`}
                </DayHeader>
                <div>
                  <EventWrapper>
                    <EventUser
                      avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                      name="name"
                      variant="default"
                      size="xSmall"
                    />
                    <div>
                      <EventTitle variant="p">SharkRace Clubs event</EventTitle>
                      <EventDescription variant="p">
                        Event name
                      </EventDescription>
                    </div>
                    <EventTimeWrapper>
                      <i>18:21:41</i>
                      <span>dd hh mm</span>
                    </EventTimeWrapper>
                  </EventWrapper>
                </div>
                <ShowAllButton onClick={openEventsModal}>
                  Show all (5)
                </ShowAllButton>
                {isLogin && (
                  <AddEventButton>
                    <CloseIcon fill="#00C099" />
                  </AddEventButton>
                )}
              </CalendarDay>
            );
          })}
        </ContentWrapper>
      ) : (
        <ViewTable
          type="event"
          cardsData={{
            show: 0,
            className: "table-wrapper",
            //@ts-ignore
            cards: CalendarEvents,
          }}
        />
      )}
      {eventsModal && (
        <AllEventsModal
          date={moment().add(22, "days").toString()}
          onClose={closeEventsModal}
        />
      )}
    </PageWrapper>
  );
};

export default Tasks;

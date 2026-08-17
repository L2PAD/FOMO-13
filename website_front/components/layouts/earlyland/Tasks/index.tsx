import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "react-query";
import moment from "moment";
import CustomDatePicker from "../../../global/CustomDatePicker";
import { WeekDaysShort } from "../../../../staticContent/global";
import { AuthContext } from "../../../global/Layout";
import { CloseIcon, GridIcon } from "../../../global/Icons";
import ViewTable from "../../../global/Tables/ViewTable";
import { authState } from "../../../../store/slices/authSlice";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { SearchInput, SearchWrapper } from "../../projects/P2PExchange/styles";
import CommentBlock from "../../../global/CommentBlock";
import { Sort } from "../../../global/common/Sort";
import { ITask } from "../../../../types/global_types";
import fetchTasks from "../../../../http/tasks/fetchTasks";
import compareDates from "../../../../helpers/compareDates";
import TaskItem from "./item";
import AllTasksModal from "../modals/AllTasksModal";
import TaskDetailsModal from "../../../global/modals/TaskDetailsModal";
import useComments from "../../../../hooks/useComments";
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
} from "./styles";

const Tasks = () => {
  const { comments, confirmAddComment } = useComments(
    "comments/earlyland",
    "comments/earlyland"
  );
  const { userData } = useContext(AuthContext);
  const [tasks, setTasks] = useState<Array<ITask>>([]);
  const { data } = useQuery(["events"], () => fetchTasks("default"));
  const [isGrid, setIsGrid] = useState(true);
  const [startDate, setStartDate] = useState<null | Date>(new Date());
  const [endDate, setEndDate] = useState<null | Date>(
    new Date(moment().add(30, "days").toString())
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTasks, setSelectedTasks] = useState<Array<ITask>>([]);
  const [eventsModal, setEventsModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [taskDetails, setTaskDetails] = useState<ITask | null>(null);
  const [isTaskDetails, setIsTaskDetails] = useState<boolean>(false);
  const { isLogin } = useSelector(authState);

  const openTaskDetails = (task: ITask): void => {
    setTaskDetails(task);
    setIsTaskDetails(true);
  };

  const openEventsModal = (item: { date: Date; tasks: Array<ITask> }) => {
    setEventsModal(true);
    setSelectedDate(item.date);
    setSelectedTasks(item.tasks);
  };

  const closeEventsModal = () => {
    setEventsModal(false);
  };

  const updateDate = (dates: Date[]): void => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

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

  const daysArray: Array<{ date: Date; tasks: Array<ITask> }> = useMemo(() => {
    const datesArray = [];
    const currDate = moment(startDate).add(-1, "days").startOf("day");
    const lastDate = moment(endDate).add(1, "days").startOf("day");

    while (currDate.add(1, "days").diff(lastDate) < 0) {
      const currentDateEvents: Array<ITask> = [];

      for (let i = 0; i < tasks.length; i++) {
        const event = tasks[i];
        let isSearchValid: boolean = true;

        if (searchValue) {
          isSearchValid = !!event?.name
            .toLowerCase()
            .includes(searchValue.toLowerCase());
        }

        const currentDateEvent: boolean = compareDates(
          new Date(event.date),
          currDate.clone().toDate()
        );

        const isPending: boolean = !!event?.usersRequests?.includes(
          userData?._id
        );
        const isFinished: boolean = !!event?.awardedUsers?.includes(
          userData?._id
        );

        isSearchValid &&
          currentDateEvent &&
          currentDateEvents.push({ ...event, isPending, isFinished });
      }

      datesArray.push({
        date: currDate.clone().toDate(),
        tasks: currentDateEvents,
      });
    }

    return datesArray;
  }, [tasks, startDate, endDate, searchValue]);

  useEffect(() => {
    if (data?.tasks) {
      setTasks(data.tasks);
    }
  }, [data]);

  return (
    <PageWrapper>
      <Typography variant="h1">Tasks</Typography>
      <br />
      <Subtitle>
        Manage and track your tasks related to projects with ease. This page
        allows you to view, plan, and complete tasks associated with buying,
        selling, or managing NFTs. Keep track of important dates and events to
        ensure you stay on top of your crypto activities. Organize your workflow
        efficiently and never miss a critical task in your crypto journey.{" "}
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
                  {`${moment(item.date).format("MMM")} ${moment(item.date).format("D")}`}
                </DayHeader>
                <div>
                  {item.tasks.map((item: ITask) => {
                    return (
                      <TaskItem
                        openTaskDetails={openTaskDetails}
                        key={item._id}
                        event={item}
                      />
                    );
                  })}
                </div>
                <ShowAllButton onClick={() => openEventsModal(item)}>
                  Show all ({item.tasks.length})
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
          type="tasks"
          cardsData={daysArray}
          openTaskDetails={openTaskDetails}
        />
      )}
      <CommentBlock items={comments} addComment={confirmAddComment} />
      {eventsModal && (
        <AllTasksModal
          tasks={selectedTasks}
          date={String(selectedDate) || moment().add(22, "days").toString()}
          onClose={closeEventsModal}
        />
      )}
      {isTaskDetails ? (
        <TaskDetailsModal
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
    </PageWrapper>
  );
};

export default Tasks;

import { useEffect, useState, useMemo } from 'react';
import { GridIcon, CloseIcon } from '../../../assets';
import moment from 'moment';
import CustomDatePicker from '../../common/custom_date_picker';
import { WeekDaysShort } from '../../../static_content/global';
import AllEventsModal from './modals/all_tasks_modal';
import Filter from '../../common/filter';
import CalendarTableLayout from './tasks_table_layout';
import CreateEventModal from './modals/create_task_modal';
import loader from '../../services/loader';
import useFetch, { fetchData } from '../../hooks/useFetch';
import Loader from '../../common/loader';
import { ITask } from '../../types/global_types';
import compareDates from '../../utils/compareDates';
import TaskItem from './task_event_item';
import getAccessToken from '../../utils/getAccessToken';
import Switch from '../../common/switch/index'
import {
    AddEventButton,
    CalendarDay,
    ContentWrapper,
    DayHeader, EventDescription, EventTimeWrapper, EventTitle, EventUser, EventWrapper,
    GridButton,
    HeaderWrapper,
    LeftHeaderWrapper,
    PageWrapper, ShowAllButton,
    MobileWeekDayName, PageTitle,
} from './styles';
import { localApi } from '../../services/config';
import CreateButton from '../../common/button/create_button';

const TasksLayout = ({ page }: { page?: string }) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [isSpecialTasks, setIsSpecialTasks] = useState<boolean>(false)
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    const [isGrid, setIsGrid] = useState<boolean>(true)
    const [startDate, setStartDate] = useState<null | Date>(new Date());
    const [endDate, setEndDate] = useState<null | Date>(new Date(moment().add(30, 'days').toString()));
    const [eventsModal, setEventsModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [events, setEvents] = useState<Array<ITask>>([])
    const [currentDayEvents, setCurrentDayEvents] = useState<Array<ITask>>([])

    const addEventModalHandler = (date: Date): void => {
        setIsOpenModal(true)
        setSelectedDate(date)
    }

    const openEventsModal = (date: Date, events: Array<ITask>): void => {
        setEventsModal(true)
        setSelectedDate(date)
        setCurrentDayEvents(events)
    }

    const closeEventsModal = (): void => {
        setEventsModal(false)
    }

    const daysArray: Array<{ date: Date, events: Array<ITask> }> = useMemo(() => {
        const isEvents = !!events.length

        const datesArray = [];
        const currDate = moment(startDate).add(-1, 'days').startOf('day');
        const lastDate = moment(endDate).add(1, 'days').startOf('day');

        while (currDate.add(1, 'days').diff(lastDate) < 0) {
            const currentDateEvents: Array<ITask> = []

            for (let i = 0; i < events.length; i++) {
                const event = events[i]

                const currentDateEvent: boolean =
                    compareDates(new Date(event.date), currDate.clone().toDate())

                currentDateEvent && currentDateEvents.push(event)
            }

            datesArray.push({ date: currDate.clone().toDate(), events: currentDateEvents });
        }

        return datesArray
    }, [events, startDate, endDate])

    const updateDate = (dates: Date[]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
    };

    const getTasksData = async () => {
        const res = await fetch(`${localApi}/tasks/${isSpecialTasks ? 'special' : 'default'}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` },
            credentials: 'include',
        })

        const data = await res.json()

        setEvents(data)

        return data
    }

    useEffect(() => {
        setLoading(true)

        getTasksData().then(() => {
            setLoading(false)
        })
    }, [isSpecialTasks])

    if (loading) return <Loader />

    return (
        <>
            <HeaderWrapper>
                <LeftHeaderWrapper>
                    <PageTitle>
                        Tasks
                    </PageTitle>
                    {
                        !isSpecialTasks
                            ?
                            <GridButton onClick={() => setIsGrid(state => !state)}>
                                <GridIcon fill="#070B35" />
                                Show in {isGrid ? 'row' : 'grid'}
                            </GridButton>
                            :
                            <></>
                    }

                    <Switch
                        leftLabel='Default'
                        rightLabel='Core'
                        checked={isSpecialTasks}
                        onChange={() => setIsSpecialTasks((prev: boolean) => !prev)}
                    />
                    {
                        isSpecialTasks
                        ?
                        <CreateButton
                        width='12'
                        height='12'
                        onClick={() => setIsOpenModal(true)}
                        />
                        :
                        <></>
                    }
                </LeftHeaderWrapper>
                {
                    !isSpecialTasks
                        ?
                        <CustomDatePicker
                            onChange={updateDate}
                            startDate={startDate}
                            endDate={endDate}
                        />
                        :
                        <></>
                }
            </HeaderWrapper>
            <PageWrapper>
                {isGrid && !isSpecialTasks ? (
                    <ContentWrapper>
                        {daysArray.map((item, i) => {
                            return (
                                <CalendarDay key={i}>
                                    <DayHeader>
                                        <span>{i < 7 && `${WeekDaysShort[moment(item.date).day() === 0 ? 6 : moment(item.date).day() - 1]},`}</span> {' '}
                                        <MobileWeekDayName>{`${WeekDaysShort[moment(item.date).day() === 0 ? 6 : moment(item.date).day() - 1]},`}</MobileWeekDayName>
                                        {`${moment(item.date).format('MMM')} ${moment(item.date).format('D')}`}
                                    </DayHeader>
                                    <div>
                                        {
                                            item.events.map((eventItem: ITask) => {
                                                return (
                                                    <TaskItem
                                                        key={eventItem._id}
                                                        event={eventItem}
                                                    />
                                                )
                                            })
                                        }
                                    </div>
                                    <ShowAllButton onClick={() => openEventsModal(item.date, item.events)}>
                                        Show all ({item.events.length})
                                    </ShowAllButton>
                                    <AddEventButton
                                        onClick={() => addEventModalHandler(item.date)}
                                    >
                                        <CloseIcon fill="#00C099" />
                                    </AddEventButton>
                                </CalendarDay>
                            )
                        })}
                    </ContentWrapper>
                ) : (
                    <CalendarTableLayout
                        events={events}
                        isSpecialTasks={isSpecialTasks}
                    />
                )}
                {eventsModal
                    ?
                    <AllEventsModal
                        events={currentDayEvents}
                        date={selectedDate.toString()}
                        onClose={closeEventsModal}
                    />
                    :
                    <></>
                }
                {
                    isOpenModal
                        ?
                        <CreateEventModal
                            isSpecialTasks={isSpecialTasks}
                            page={page}
                            date={selectedDate}
                            onClose={() => setIsOpenModal(false)} />
                        :
                        <></>
                }
            </PageWrapper>
        </>
    );
};

export default TasksLayout;

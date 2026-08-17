import { useEffect, useState, useMemo } from 'react';
import {GridIcon, CloseIcon} from '../../../assets';
import moment from 'moment';
import CustomDatePicker from '../../common/custom_date_picker';
import {WeekDaysShort} from '../../../static_content/global';
import AllEventsModal from './modals/all_events_modal';
import Filter from '../../common/filter';
import CalendarTableLayout from './calendar_table_layout';
import CreateEventModal from './modals/create_event_modal';
import loader from '../../services/loader';
import useFetch from '../../hooks/useFetch';
import Loader from '../../common/loader';
import { IEvent } from '../../types/global_types';
import compareDates from '../../utils/compareDates';
import CalendarItem from './calendar_event_item';
import getAccessToken from '../../utils/getAccessToken';
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

const CalendarLayout = ({page}:{page?:string}) => {
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isGrid, setIsGrid] = useState(true)
    const [startDate, setStartDate] = useState<null | Date>(new Date());
    const [endDate, setEndDate] = useState<null | Date>(new Date(moment().add(30, 'days').toString()));
    const [eventsModal, setEventsModal] = useState(false)
    const [selectedDate,setSelectedDate] = useState<Date>(new Date())
    const [events,setEvents] = useState<Array<IEvent>>([])
    const [currentDayEvents,setCurrentDayEvents] = useState<Array<IEvent>>([])
    const {loading,data} = useFetch(`events/all/${page}`,{headers:{'Authorization': `Bearer ${getAccessToken()}`}})
    
    const addEventModalHandler = (date:Date) : void => {
        setIsOpenModal(true)
        setSelectedDate(date)
    }

    const openEventsModal = (date:Date,events:Array<IEvent>) : void => {
        setEventsModal(true)
        setSelectedDate(date)
        setCurrentDayEvents(events)
    }

    const closeEventsModal = () : void => {
        setEventsModal(false)
    }

    const daysArray : Array<{date:Date,events:Array<IEvent>}> = useMemo(() => {
        const isEvents = !!events.length
        
    
        const datesArray = [];  
        const currDate = moment(startDate).add(-1, 'days').startOf('day');
        const lastDate = moment(endDate).add(1, 'days').startOf('day');

        while (currDate.add(1, 'days').diff(lastDate) < 0) {
            const currentDateEvents : Array<IEvent> = []

            for (let i = 0; i < events.length; i++) {
                const event = events[i]

                const currentDateEvent : boolean = 
                compareDates(new Date(event.date),currDate.clone().toDate())

                currentDateEvent && currentDateEvents.push(event)   
            }

            datesArray.push({date:currDate.clone().toDate(),events:currentDateEvents});
        }

        return datesArray
    },[events,startDate,endDate])

    const updateDate = (dates: Date[]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
    };
    
    useEffect(() => {
        if(data?.data.length){
            setEvents(data.data)
        }
    }, [data])

    if(loading) return <Loader/>
    
    return (
        <>
            <HeaderWrapper>
                <LeftHeaderWrapper>
                    <PageTitle>
                        Calendar
                    </PageTitle>
                    <Filter/>
                    <GridButton onClick={() => setIsGrid(state => !state)}>
                        <GridIcon fill="#070B35"/>
                        Show in {isGrid ? 'row' : 'grid'}
                    </GridButton>
                </LeftHeaderWrapper>
                <CustomDatePicker
                    onChange={updateDate}
                    startDate={startDate}
                    endDate={endDate}
                />
            </HeaderWrapper>
            <PageWrapper>
                {isGrid ? (
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
                                            item.events.map((eventItem: IEvent) => {
                                                return (
                                                    <CalendarItem 
                                                    key={eventItem._id}
                                                    event={eventItem}
                                                    />
                                                )
                                            })
                                        }
                                    </div>
                                    <ShowAllButton onClick={() => openEventsModal(item.date,item.events)}>
                                        Show all ({item.events.length})
                                    </ShowAllButton>
                                    <AddEventButton 
                                    onClick={() => addEventModalHandler(item.date)}
                                    >
                                        <CloseIcon fill="#00C099"/>
                                    </AddEventButton>
                                </CalendarDay>
                            )
                        })}
                    </ContentWrapper>
                ) : (
                    <CalendarTableLayout 
                    events={events}
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

export default CalendarLayout;
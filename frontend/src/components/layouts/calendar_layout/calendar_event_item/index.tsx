import { FC } from "react"
import { IEvent } from "../../../types/global_types"
import { EventWrapper,EventUser,EventTitle,EventDescription,EventTimeWrapper } from "../styles"
import useDates from "../../../hooks/useDates"
import loader from "../../../services/loader"

interface IProps {
    event:IEvent
}

const CalendarItem : FC<IProps> = ({event}) => {
  const {days,hours,minutes} = useDates(String(event.date),event.time)

  return (
    <EventWrapper>
    <EventUser
        src={loader(
            typeof event.project?.logo === 'string' 
            ?
            event.project?.logo
            :
            ''
        )}
        alt="name"
    />
    <div>
        <EventTitle variant="p">
        {event.project?.name}
        </EventTitle>
        <EventDescription variant="p">
        {event.name}
        </EventDescription>
    </div>
    <EventTimeWrapper>
        <i>{days}:{hours > 9 ? hours : `0${hours}`}:{minutes > 9 ? minutes : `0${minutes}`}</i>
        <span>dd hh mm</span>
    </EventTimeWrapper>
</EventWrapper>
  )
}

export default CalendarItem

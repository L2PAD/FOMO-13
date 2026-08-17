import { FC } from "react"
import { useHistory } from "react-router-dom";
import { ITask } from "../../../types/global_types"
import { 
    EventWrapper,
    EventUser,
    EventTitle,
    EventDescription,
    EventTimeWrapper,
    ProjectWrapper,
    EventItem
 } from "../styles"
import useDates from "../../../hooks/useDates"
import loader from "../../../services/loader"

interface IProps {
    event:ITask
}

const TaskItem : FC<IProps> = ({event}) => {
  const {days,hours,minutes} = useDates(String(event.date),event.time)
  const navigate = useHistory()

  return (
    <EventWrapper
    onClick={() => navigate.push(`tasks/${event._id}`)}
    >
    <ProjectWrapper>
        <EventItem>
            <EventTitle variant="p">
            {event.name}
            </EventTitle>
        </EventItem>
    </ProjectWrapper>
    <EventTimeWrapper>
        <i>{days}:{hours > 9 ? hours : `0${hours}`}:{minutes > 9 ? minutes : `0${minutes}`}</i>
        <span>dd hh mm</span>
    </EventTimeWrapper>
    </EventWrapper>
  )
}

export default TaskItem

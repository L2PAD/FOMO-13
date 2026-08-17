import {useState,FC} from 'react';
import Status from '../../../../common/status';
import Rating from '../../../../common/rating';
import Button from '../../../../common/button';
import EditIcon from '../../../../common/Icons/edit_icon';
import avatarImage from '../../../../../assets/img/avatar.png'
import {
    ActionsWRapper,
    DateWrapper,
    EventWrapper, ProjectDescription, ProjectTitleWrapper,
    ProjectWrapper,
    RatingWrapper,
    StatusWrapper,
    TimeWrapper,
    Wrapper
} from './styles';
import DotsButtonWithDropdown from '../../../../common/dots_button_with_dropdown';
import UpdateEventModal from '../../modals/update_event_modal';
import { IEvent } from '../../../../types/global_types';
import loader from '../../../../services/loader';
import getProjectStatus from '../../../../utils/getProjectStatus';
import parseDate from '../../../../utils/parseDate';
import getTimeLeft from '../../../../utils/getTimeLeft';
import useDates from '../../../../hooks/useDates';
import useFetch from '../../../../hooks/useFetch';
import Loader from '../../../../common/loader';
import reloadWindow from '../../../../utils/reloadWindow';
import removeProject from '../../../../services/projects/removeProject';

interface IProps {
    event: IEvent
}

const TableRow : FC<IProps> = ({event}) => {
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [loading,setLoading] = useState<boolean>(false)
    const {days,hours,minutes} = useDates(String(event.date),event.time)

    const deleteEvent = async () : Promise<void> => {
        setLoading(true)
        await removeProject('events',event._id || '')
        reloadWindow()
        setLoading(false)
    }

    if(loading) return <Loader/>

    return (
        <Wrapper>
            <ProjectWrapper>
                {
                    typeof event?.project?.logo === 'string'
                    ?
                    <img src={loader(event.project.logo)} alt="logo"/>
                    :
                    <img src={avatarImage} alt="logo"/>
                }
                <div>
                    <ProjectTitleWrapper>
                        <p>{event?.project?.name || 'Project not found'}</p>
                        <span>{event?.project?.fullness}</span>
                    </ProjectTitleWrapper>
                    <ProjectDescription>
                        {event?.project?.banner}
                    </ProjectDescription>
                </div>
            </ProjectWrapper>
            <StatusWrapper>
                <Status 
                status={getProjectStatus(event?.project?.status || '-')} />
            </StatusWrapper>
            <EventWrapper>{event.name}</EventWrapper>
            <DateWrapper>{parseDate(event.date,3)} {event.time}</DateWrapper>
            <TimeWrapper>
                {getTimeLeft(new Date(event.date))}
                <div>{days}<span>dd</span></div>
                <div>{hours} <span>hh</span></div>
                <div>{minutes} <span>mm</span></div>
            </TimeWrapper>
            <RatingWrapper>
                <Rating rating={Number(event?.project?.rating)} />
            </RatingWrapper>
            <ActionsWRapper>
                <Button onClick={() => setIsOpenModal(true)} type='outlined'>
                    <EditIcon />
                </Button>
                <DotsButtonWithDropdown items={[
                    {title: 'Delete', onClick: deleteEvent}
                ]} />
            </ActionsWRapper>
            {
            isOpenModal 
            ? 
            <UpdateEventModal 
            event={event}
            onClose={() => setIsOpenModal(false)}/>
            :
            <></>
            }
        </Wrapper>
    );
};

export default TableRow;
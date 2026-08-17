import { useState, FC } from 'react';
import { useHistory } from 'react-router';
import Status from '../../../../common/status';
import Rating from '../../../../common/rating';
import Button from '../../../../common/button';
import EditIcon from '../../../../common/Icons/edit_icon';
import avatarImage from '../../../../../assets/img/avatar.png'
import {
    ActionsWRapper,
    DateWrapper,
    EventWrapper, PointsWrapper, ProjectDescription, ProjectTitleWrapper,
    ProjectWrapper,
    RatingWrapper,
    StatusWrapper,
    TimeWrapper,
    Wrapper,
    TableItemWrapper,
    TaskMetaBadge,
    TaskMetaRow,
    TaskTitleBlock
} from './styles';
import DotsButtonWithDropdown from '../../../../common/dots_button_with_dropdown';
import UpdateEventModal from '../../modals/update_task_modal';
import { ITask } from '../../../../types/global_types';
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
    event: ITask
}

const TableRow: FC<IProps> = ({ event }) => {
    const navigate = useHistory()
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [loading, setLoading] = useState<boolean>(false)
    const { days, hours, minutes } = useDates(String(event.date), event.time)

    const deleteEvent = async (): Promise<void> => {
        setLoading(true)
        await removeProject('tasks', event._id || '')
        reloadWindow()
        setLoading(false)
    }
    if (loading) return <Loader />

    return (
        <>
            <TableItemWrapper>
                <Wrapper
                    onClick={() => navigate.push(`tasks/${event._id}`)}
                >
                    <ProjectWrapper>
                        <TaskTitleBlock>
                            <span>{event.name}</span>
                            {event.type !== 'special' ? (
                                <TaskMetaRow>
                                    <TaskMetaBadge>Global</TaskMetaBadge>
                                    <TaskMetaBadge $prime={event.accessTier === 'prime'}>
                                        {event.accessTier === 'prime' ? 'Prime' : 'Public'}
                                    </TaskMetaBadge>
                                    {event.v2ActivityId ? <TaskMetaBadge>Activity linked</TaskMetaBadge> : null}
                                </TaskMetaRow>
                            ) : null}
                        </TaskTitleBlock>
                    </ProjectWrapper>
                    {
                        event.type !== 'special'
                            ?
                            <ProjectWrapper>{event.link}</ProjectWrapper>
                            :
                            <ProjectWrapper>{event.goal}</ProjectWrapper>
                    }
                    {
                        event.type !== 'special'
                            ?
                            <TimeWrapper>
                                {getTimeLeft(new Date(event.date))}
                                <div>{days}<span>dd</span></div>
                                <div>{hours} <span>hh</span></div>
                                <div>{minutes} <span>mm</span></div>
                            </TimeWrapper>
                            :
                            <></>
                    }
                    <PointsWrapper>
                        {event.points}
                    </PointsWrapper>
                </Wrapper>
                <ActionsWRapper>
                    <Button onClick={() => setIsOpenModal(true)} type='outlined'>
                        <EditIcon />
                    </Button>
                    <DotsButtonWithDropdown items={[
                        { title: 'Delete', onClick: deleteEvent }
                    ]} />
                </ActionsWRapper>
            </TableItemWrapper>
            {
                isOpenModal
                    ?
                    <UpdateEventModal
                        task={event}
                        onClose={() => setIsOpenModal(false)} />
                    :
                    <></>
            }
        </>
    );
};

export default TableRow;

import React, {FC, useState} from 'react';
import { useHistory } from 'react-router';
import {StarIcon} from '../../../../../assets'
import Typography from '../../../../common/typography';
import moment from 'moment';
import {CalendarEvents} from '../../../../../static_content/global';
import {
    ContentWrapper,
    DateWrapper,
    EventNameWrapper,
    EventWrapper,
    ProjectDescription,
    ProjectTitle,
    ProjectWrapper,
    RatingWrapper,
    StatusWrapper,
    TimerItem,
    TimerWrapper,
    AllTasksButtons,
    Event
} from './styles';
import Modal from '../../../../common/modal';
import Status from '../../../../common/status';
import {STATUS_LIST} from '../../../../../static_content/dropdowns_data';
import {UserAvatar} from '../../../../common/modal/styles';
import { ITask } from '../../../../types/global_types';
import loader from '../../../../services/loader';
import getProjectStatus from '../../../../utils/getProjectStatus';
import Button from '../../../../common/button';
import DeleteIcon from '../../../../common/Icons/delete_icon';
import deleteTask from '../../../../services/tasks/deleteTask';
import Loader from '../../../../common/loader';
import reloadWindow from '../../../../utils/reloadWindow';

interface Props {
    onClose: () => void;
    date: string;
    events: Array<ITask>
}

const AllEventsModal: FC<Props> = ({ onClose, date, events}) => {
    const navigate = useHistory()
    const [loading,setLoading] = useState(false)

    const confirmDeleteTask = async (id:string) : Promise<void> => {
        setLoading(true)

        const {success} = await deleteTask(id)

        if(success){
            reloadWindow()
        }

        setLoading(false)
    }

    if(loading) return <Loader/>
    
    return (
        <Modal
            onClose={onClose}
            title={`All tasks on ${moment(date).format('DD MMM')}`}
            variant="big"
        >
            <ContentWrapper>
                {events.map((item, i) => {
                    return (
                        <Event
                        key={i}
                        >
                        <EventWrapper
                        onClick={() => navigate.push(`tasks/${item._id}`)}
                        >
                            <ProjectWrapper>
                                <div>
                                    <ProjectTitle variant="p">
                                        {item.name}
                                    </ProjectTitle>
                                </div>
                            </ProjectWrapper>
                            <DateWrapper>
                                {moment(item.date).format('DD MMMM, YYYY HH:mm')}
                            </DateWrapper>
                            <RatingWrapper>
                                Points:
                                <span>{item.points}</span>
                            </RatingWrapper>
                        </EventWrapper>
                        <AllTasksButtons>
                            <Button
                            onClick={() => confirmDeleteTask(item._id || '')}
                            >
                                <DeleteIcon/>
                            </Button>
                        </AllTasksButtons>
                        </Event>
                    )
                })}
            </ContentWrapper>
        </Modal>
    );
};

export default AllEventsModal;
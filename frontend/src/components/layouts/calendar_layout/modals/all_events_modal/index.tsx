import React, {FC} from 'react';
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
} from './styles';
import Modal from '../../../../common/modal';
import Status from '../../../../common/status';
import {STATUS_LIST} from '../../../../../static_content/dropdowns_data';
import {UserAvatar} from '../../../../common/modal/styles';
import { IEvent } from '../../../../types/global_types';
import loader from '../../../../services/loader';
import getProjectStatus from '../../../../utils/getProjectStatus';

interface Props {
    onClose: () => void;
    date: string;
    events: Array<IEvent>
}

const AllEventsModal: FC<Props> = ({ onClose, date, events}) => {
    
    return (
        <Modal
            onClose={onClose}
            title={`All events on ${moment(date).format('DD MMM')}`}
            variant="big"
        >
            <ContentWrapper>
                {events.map((item, i) => {
                    return (
                        <EventWrapper key={i}>
                            <ProjectWrapper>
                                <UserAvatar src={loader(
                                    typeof item.project?.logo === 'string'
                                    ?
                                    item.project?.logo
                                    :
                                    ''
                                )} alt="logo"/>
                                <div>
                                    <ProjectTitle variant="p">
                                        {item.project?.name}
                                    </ProjectTitle>
                                    <ProjectDescription variant="p">
                                        {item.project?.banner}
                                    </ProjectDescription>
                                </div>
                            </ProjectWrapper>
                            <StatusWrapper>
                                {/*// @ts-ignore*/}
                                <Status status={getProjectStatus(item.project?.status)} />
                            </StatusWrapper>
                            <EventNameWrapper>
                                <Typography variant="p">
                                    {item.name}
                                </Typography>
                            </EventNameWrapper>
                            <DateWrapper>
                                {moment(item.date).format('DD MMMM, YYYY HH:mm')}
                            </DateWrapper>
                            <TimerWrapper>
                                <TimerItem variant="p">
                                    {moment(item.date).format('DD')}
                                    <span>dd</span>
                                </TimerItem>
                                <TimerItem variant="p">
                                    {moment(item.date).format('HH')}
                                    <span>hh</span>
                                </TimerItem>
                                <TimerItem variant="p">
                                    {moment(item.date).format('mm')}
                                    <span>m</span>
                                </TimerItem>
                            </TimerWrapper>
                            <RatingWrapper>
                                <StarIcon fill="#FFC702" />
                                <span>{item.project?.rating}/100</span>
                            </RatingWrapper>
                        </EventWrapper>
                    )
                })}
            </ContentWrapper>
        </Modal>
    );
};

export default AllEventsModal;
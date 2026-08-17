import { FC } from 'react';
import { IEvent } from '../../../types/global_types';
import {DateWrapper, EventWrapper, HeaderWrapper, ProjectWrapper, StatusWrapper, TimeWrapper} from './styles';
import TableRow from './table_row';

interface IProps {
    events: Array<IEvent>
}

const CalendarTableLayout : FC<IProps> = ({events}) => {
    return (
        <div>
            <HeaderWrapper>
                <ProjectWrapper>Project</ProjectWrapper>
                <StatusWrapper>Status</StatusWrapper>
                <EventWrapper>Event</EventWrapper>
                <DateWrapper>Date and time</DateWrapper>
                <TimeWrapper>Time left</TimeWrapper>
            </HeaderWrapper>
            <div>
                {
                    events.map((eventItem) => {
                        return <TableRow key={eventItem._id} event={eventItem}/>
                    })
                }
            </div>
        </div>
    );
};

export default CalendarTableLayout;
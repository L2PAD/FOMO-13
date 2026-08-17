import { FC } from 'react';
import { ITask } from '../../../types/global_types';
import { HeaderWrapper, ProjectWrapper, TimeWrapper } from './styles';
import TableRow from './table_row';

interface IProps {
    events: Array<ITask>
    isSpecialTasks?: boolean
}

const CalendarTableLayout: FC<IProps> = ({ events, isSpecialTasks }) => {

    const getHeaderContent = (): any => {
        if (isSpecialTasks) {
            return (
                <HeaderWrapper>
                    <ProjectWrapper>Task</ProjectWrapper>
                    <ProjectWrapper>XP</ProjectWrapper>
                    <ProjectWrapper>Goal</ProjectWrapper>
                </HeaderWrapper>
            )
        }

        return (
            <HeaderWrapper>
                <ProjectWrapper>Task</ProjectWrapper>
                <ProjectWrapper>Link</ProjectWrapper>
                <TimeWrapper>Time left</TimeWrapper>
                <TimeWrapper>XP</TimeWrapper>
            </HeaderWrapper>
        )
    }

    return (
        <div>
            {getHeaderContent()}
            <div>
                {
                    events.map((eventItem) => {
                        return <TableRow key={eventItem._id} event={eventItem} />
                    })
                }
            </div>
        </div>
    );
};

export default CalendarTableLayout;
import React, {FC} from 'react';
import {useStyles} from './styles';

interface Props {
    percentage: number;
}

const ProgressRow: FC<Props> = ({percentage}) => {
    const {progressRow} = useStyles(percentage)

    return (
        <div className={progressRow}>
            <div />
        </div>
    );
};

export default ProgressRow;
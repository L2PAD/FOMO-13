import React, {FC} from 'react';
import RedFlag from '../Icons/red_flag_icon';
import {useStyles} from './styles';

interface Props {
    count: number;
}

const RedFlags: FC<Props> = ({count}) => {
    const {wrapper} = useStyles()

    return (
        <div className={wrapper}>
            <RedFlag />
            {count}
        </div>
    );
};

export default RedFlags;
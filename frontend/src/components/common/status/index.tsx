import React, {FC} from 'react';
import {useStyles} from './styles';
import {STATUS_LIST} from '../../../static_content/dropdowns_data';

interface Props {
    status: STATUS_LIST;
}

const Status: FC<Props> = ({status}) => {
    const {wrapper} = useStyles({status})

    return (
        <div className={wrapper}>
            {status}
        </div>
    );
};

export default Status;
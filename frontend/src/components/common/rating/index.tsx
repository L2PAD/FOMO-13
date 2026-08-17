import React, {FC} from 'react';
import StarIcon from '../Icons/star_icon';
import {useStyles} from './styles';

interface Props {
    rating: number;
}

const Rating: FC<Props> = ({rating}) => {
    const {wrapper} = useStyles()

    return (
        <div className={wrapper}>
            <StarIcon />
            {rating} / 100
        </div>
    );
};

export default Rating;
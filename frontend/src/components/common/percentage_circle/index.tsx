import React, {FC} from 'react';
import {buildStyles, CircularProgressbar} from 'react-circular-progressbar';
import {useStyles} from './styles';

interface Props {
    rating: number;
    variant?: 'success' | 'warn';
}

const PercentageCircle: FC<Props> = ({rating, variant = 'success'}) => {
    const {wrapper} = useStyles()

    return (
        <div className={wrapper}>
            {/*//@ts-ignore*/}
            <CircularProgressbar
                value={rating}
                text={`${rating}%`}
                styles={buildStyles({
                    rotation: 0.25,
                    pathColor: variant ==='success' ? `rgba(4,165,132, ${rating / 100})` : `rgba(228,39,54, ${rating / 100})`,
                    textColor: variant ==='success' ? '#04A584' : '#E42736',
                    trailColor: '#EEEEEE',
                })}
            >
                {rating}
            </CircularProgressbar>
        </div>
    );
};

export default PercentageCircle;
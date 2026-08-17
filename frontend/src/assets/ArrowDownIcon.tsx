import React, {FC} from 'react';
import { IconInterface } from './IconInterface';

const ArrowDownIcon: FC<IconInterface> = ({className, fill = 'black'}) => {
    return (
        <svg width="6" height="3" viewBox="0 0 6 3" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M3 3L0.401923 0.75L5.59808 0.75L3 3Z" fill={fill}/>
        </svg>
    );
};

export default ArrowDownIcon;
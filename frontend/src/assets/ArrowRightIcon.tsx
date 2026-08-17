import React, {FC} from 'react';
import { IconInterface } from './IconInterface';


const ArrowRightIcon: FC<IconInterface> = ({className, fill = 'black'}) => {
    return (
        <svg className={className} width="8" height="13" viewBox="0 0 8 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L6.25 6.25L1 11.5" stroke={fill} strokeWidth="2"/>
        </svg>
    );
};

export default ArrowRightIcon;
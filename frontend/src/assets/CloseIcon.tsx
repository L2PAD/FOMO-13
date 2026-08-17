import React, {FC} from 'react';
import { IconInterface } from './IconInterface';

const CloseIcon: FC<IconInterface> = ({className, fill = 'black'}) => {
    return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M11.5 11.5L6.25 6.25M1 1L6.25 6.25M6.25 6.25L1 11.5M6.25 6.25L11.5 1" stroke={fill ? fill : '#E42736'} strokeWidth="2"/>
        </svg>
    );
};

export default CloseIcon;
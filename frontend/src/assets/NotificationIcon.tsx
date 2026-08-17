import React, {FC} from 'react';
import { IconInterface } from './IconInterface';

const NotificationIcon: FC<IconInterface> = ({className, fill = 'black'}) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" className={className}>
            <path d="M15 2.5C13.965 2.5 13.125 3.34 13.125 4.375V5.24414C9.89148 6.07762 7.5 9.006 7.5 12.5V20L5 22.5V23.75H12.8369C12.6168 24.1299 12.5006 24.561 12.5 25C12.5 25.663 12.7634 26.2989 13.2322 26.7678C13.7011 27.2366 14.337 27.5 15 27.5C15.663 27.5 16.2989 27.2366 16.7678 26.7678C17.2366 26.2989 17.5 25.663 17.5 25C17.4987 24.5608 17.3816 24.1296 17.1606 23.75H25V22.5L22.5 20V12.5C22.5 9.006 20.1085 6.07762 16.875 5.24414V4.375C16.875 3.34 16.035 2.5 15 2.5ZM15 7.5C17.7575 7.5 20 9.7425 20 12.5V20V21.0352L20.2148 21.25H9.78516L10 21.0352V20V12.5C10 9.7425 12.2425 7.5 15 7.5Z" fill={fill}/>
        </svg>
    );
};

export default NotificationIcon;
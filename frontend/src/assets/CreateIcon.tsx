import React, {FC} from 'react';
import { IconInterface } from './IconInterface';

const CreateIcon: FC<IconInterface> = ({className, fill}) => {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M10 2C5.582 2 2 5.582 2 10C2 14.418 5.582 18 10 18C14.418 18 18 14.418 18 10C18 5.582 14.418 2 10 2ZM13.3333 10.6667H10.6667V13.3333C10.6667 13.702 10.368 14 10 14C9.632 14 9.33333 13.702 9.33333 13.3333V10.6667H6.66667C6.29867 10.6667 6 10.3687 6 10C6 9.63133 6.29867 9.33333 6.66667 9.33333H9.33333V6.66667C9.33333 6.298 9.632 6 10 6C10.368 6 10.6667 6.298 10.6667 6.66667V9.33333H13.3333C13.7013 9.33333 14 9.63133 14 10C14 10.3687 13.7013 10.6667 13.3333 10.6667Z" fill={fill}/>
        </svg>
    );
};

export default CreateIcon;
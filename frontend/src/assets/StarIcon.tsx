import React, {FC} from 'react';
import { IconInterface } from './IconInterface';

const StarIcon: FC<IconInterface> = ({className, fill = 'black'}) => {
    return (
        <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M8 0L10.9154 3.98728L15.6085 5.52786L12.7172 9.53272L12.7023 14.4721L8 12.96L3.29772 14.4721L3.28276 9.53272L0.391548 5.52786L5.08459 3.98728L8 0Z" fill={fill}/>
        </svg>
    );
};

export default StarIcon;
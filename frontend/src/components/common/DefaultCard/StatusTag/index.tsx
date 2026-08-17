import React, {FC} from 'react';
import Tag from '../Tag';

export interface StatusTagInterface {
    type?: any | 'project'
    variant: 'upcoming' | 'ended' | 'active' | string;
    className?: string;
}

const StatusTag: FC<StatusTagInterface> = ({type,variant, className}) => {
    const getVariant = ({variant}: StatusTagInterface) => {
        switch(variant) {
        case 'upcoming':
            return 'warn'
        case 'ended':
            return 'alert'
        case 'active':
            return 'success'
        default:
            return 'success'
        }
    }

    return <Tag
        variant={getVariant({variant})}
        label={variant.charAt(0).toUpperCase() + variant.slice(1)}
        className={className}
    />
};

export default StatusTag;
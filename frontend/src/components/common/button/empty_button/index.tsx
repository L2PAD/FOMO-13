import React, {FC, ReactNode} from 'react';
import {useStyles} from './styles';

interface Props {
    children: ReactNode;
    onClick: () => void;
    className?: string;

}

const EmptyButton: FC<Props> = ({children, className, ... props}) => {
    const {wrapper} = useStyles()

    return (
        <button className={`${wrapper} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default EmptyButton;
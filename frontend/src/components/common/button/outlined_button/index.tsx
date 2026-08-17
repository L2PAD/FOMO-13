import React, {FC, ReactNode} from 'react';
import {useStyles} from './styles';

interface Props {
    children: ReactNode;
    onClick: () => void;
    className?: string;

}

const OutlinedButton: FC<Props> = ({children, className, ... props}) => {
    const {wrapper} = useStyles()

    return (
        <button className={`${wrapper} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default OutlinedButton;
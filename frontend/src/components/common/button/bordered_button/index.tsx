import React, {FC, ReactNode} from 'react';
import {useStyles} from './styles';

interface Props {
    children: ReactNode;
    onClick: () => void;
    className?: string;
}

const BorderedButton: FC<Props> = ({children, onClick, className}) => {
    const {wrapper} = useStyles()

    return (
        <button onClick={onClick} className={`${wrapper} ${className}`}>
            {children}
        </button>
    );
};

export default BorderedButton;
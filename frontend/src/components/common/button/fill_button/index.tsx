import React, {FC, ReactNode} from 'react';
import {useStyles} from './styles';

interface Props {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?:boolean
}

const FillButton: FC<Props> = ({children, className,disabled = false, ... props}) => {
    const {wrapper} = useStyles()

    return (
        <button 
        disabled={disabled}
        className={`${wrapper} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default FillButton;
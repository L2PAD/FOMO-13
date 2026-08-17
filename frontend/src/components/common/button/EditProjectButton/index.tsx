import React, {FC, ReactNode} from 'react';
import {ButtonWrapper, LabelWrapper} from "./styles";

export interface ButtonProps {
    disabled?:boolean;
    children: any;
    className?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    variant?: 'confirm' | 'reject';
    big?: boolean
    onClick?: () => void;
}

export const EditProjectButton: FC<ButtonProps> = (
    {
        children,
        className,
        leftIcon,
        rightIcon,
        variant = 'confirm',
        onClick,
        big = false,
        disabled
    },
) => {

    return (
        <ButtonWrapper
            disabled={disabled}
            className={className}
            onClick={onClick}
            variant={variant}
            big={big}
        >
            {big ? (
                <LabelWrapper>
                    {leftIcon}
                    {children}
                </LabelWrapper>
            ) : (
                <>
                    {leftIcon}
                    {children}
                </>
            )}
            {rightIcon}
        </ButtonWrapper>
    );
};

export default EditProjectButton;

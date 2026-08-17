import React, { FC, ReactNode } from "react";
import { ButtonWrapper, LabelWrapper } from "./styles";

export interface ButtonProps {
  disabled?: boolean;
  children: any;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: "secondary" | "primary" | "outlined" | "bordered";
  big?: boolean;
  onClick?: () => void;
}

export const SecondaryButton: FC<ButtonProps> = ({
  children,
  className,
  leftIcon,
  rightIcon,
  variant = "secondary",
  onClick,
  big = false,
  disabled,
}) => {
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

export default SecondaryButton;

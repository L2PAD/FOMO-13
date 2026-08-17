import React, { FC, ReactNode } from "react";
import { ButtonWrapper, LabelWrapper } from "./styles";

export type ButtonVariants =
  | "secondary"
  | "primary"
  | "outlined"
  | "bordered"
  | "main";

export interface ButtonProps {
  disabled?: boolean;
  children: any;
  className?: string | "outlined-default" | "contact-btn";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: ButtonVariants;
  big?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}

const ButtonDefault: FC<ButtonProps> = ({
  children,
  className,
  leftIcon,
  rightIcon,
  variant = "secondary",
  onClick,
  type = "button",
  big = false,
  disabled,
}) => {
  return (
    <ButtonWrapper
      type={type}
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

export default ButtonDefault;

export const Button: FC<ButtonProps> = ({
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

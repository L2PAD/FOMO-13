import React, { FC, ReactNode, useState } from "react";
import {
  ErrorStyle,
  InputHelpText,
  InputStyle,
  InputWrapper,
  LabelStyle,
  LabelWrapper,
  RightLabel,
  RootWrapper,
} from "./styles";

export interface InputInterface {
  helperText?: string;
  type?: string;
  placeholder: string;
  labelText?: React.ReactNode;
  onChange: (value: string) => void;
  className?: string | "width100";
  inputClassname?: string;
  labelOrientation?: "left" | "top";
  leftIcon?: ReactNode;
  rightLabel?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onFocus?: (value: boolean) => void;
  style?: React.CSSProperties;
}

const Input: FC<InputInterface> = ({
  onFocus,
  helperText,
  type,
  placeholder,
  labelText,
  onChange,
  className,
  inputClassname,
  labelOrientation = "top",
  leftIcon,
  rightLabel,
  value,
  error,
  disabled,
  style,
}) => {
  const [focus, setFocus] = useState(false);

  return (
    <RootWrapper
      labelOrientation={labelOrientation}
      className={`${className} ` + `inputRootWrapper`}
      onFocus={() => {
        setFocus(true);
        onFocus && onFocus(true);
      }}
      onBlur={() => {
        setTimeout(() => {
          setFocus(false);
          onFocus && onFocus(false);
        }, 500);
      }}
    >
      {labelText ? (
        <LabelWrapper>
          <LabelStyle labelOrientation={labelOrientation}>
            {labelText}
          </LabelStyle>
          <ErrorStyle>{error}</ErrorStyle>
        </LabelWrapper>
      ) : (
        <></>
      )}

      <InputWrapper labelText={labelText}>
        {leftIcon && <div>{leftIcon}</div>}
        <InputStyle
          withIcon={!!leftIcon}
          className={inputClassname}
          type={type || "string"}
          placeholder={placeholder}
          onChange={(e: any) => onChange(e.target.value)}
          value={value}
          disabled={disabled}
          style={style}
        />
        <InputHelpText focus={focus}>{helperText}</InputHelpText>
        {rightLabel ? <RightLabel>{rightLabel}</RightLabel> : <></>}
      </InputWrapper>
    </RootWrapper>
  );
};

export default Input;

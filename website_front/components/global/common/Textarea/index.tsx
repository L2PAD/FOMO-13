import React, { FC } from "react";
import {
  ErrorStyle,
  LabelStyle,
  LabelWrapper,
  TextareaRoot,
  TextareaStyle,
} from "./styles";

interface Props {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  labelText?: React.ReactNode;
  className?: string;
  textareaClassName?: string;
  error?: string;
  disabled?: boolean;
  rows?: number;
}

const Textarea: FC<Props> = ({
  placeholder,
  value,
  onChange,
  labelText,
  className,
  textareaClassName,
  error,
  disabled,
  rows,
}) => {
  return (
    <TextareaRoot className={className}>
      {labelText ? (
        <LabelWrapper>
          <LabelStyle>{labelText}</LabelStyle>
          <ErrorStyle>{error}</ErrorStyle>
        </LabelWrapper>
      ) : (
        <></>
      )}
      <TextareaStyle
        className={textareaClassName}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={rows}
      />
    </TextareaRoot>
  );
};

export default Textarea;

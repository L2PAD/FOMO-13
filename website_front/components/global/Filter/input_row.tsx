import React, { FC } from "react";
import { InputRowWrapper, RangeTitle } from "./styles";

interface Props {
  title: string;
  placeholder: string;
  onChange: (value: string) => void;
}

const InputRow: FC<Props> = ({ title, placeholder, onChange }) => {
  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <InputRowWrapper
        placeholder={placeholder}
        type="text"
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
};

export default InputRow;

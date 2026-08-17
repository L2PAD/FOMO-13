import React, { FC } from "react";
import RadioButton from "../common/RadioButton";
import { RangeTitle } from "./styles";

interface Props {
  title: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const RadioRow: FC<Props> = ({ title, items, value, onChange, className }) => {
  const handleRadioChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <div className={`${className} radio-buttons`}>
        {items.map((item, i) => {
          return (
            <RadioButton
              key={i}
              label={item}
              value={item}
              name={item}
              checked={value === item}
              onChange={() => handleRadioChange(item)}
            />
          );
        })}
      </div>
    </>
  );
};

export default RadioRow;

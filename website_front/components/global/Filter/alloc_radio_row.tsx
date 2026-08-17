import React, { FC } from "react";
import RadioButton from "../common/RadioButton";
import { RangeTitle } from "./styles";

interface Props {
  title: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  name: string;
  data?: any;
}

const AllocRadioRow: FC<Props> = ({
  title,
  items,
  value,
  onChange,
  className,
  name,
  data,
}) => {
  const handleRadioChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <div className={`${className} checkboxes`}>
        {items.map((item, i) => {
          return (
            <RadioButton
              key={i}
              label={item}
              value={item}
              name={name}
              checked={value === item}
              onChange={() => handleRadioChange(item)}
            />
          );
        })}
      </div>
    </>
  );
};

export default AllocRadioRow;

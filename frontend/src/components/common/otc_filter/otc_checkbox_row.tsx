import React, { FC, useEffect, useState } from "react";
import Checkbox from "../checkbox";
import { RangeTitle } from './styles';

interface Props {
  title: string;
  items: string[];
  onChange: (value: string[]) => void;
  className?: string;
  data: any
}

const OtcCheckboxRow: FC<Props> = ({ title, items, onChange, className, data }) => {

  const handleCheckbox = (value: string) => {
    const updatedItems: Array<string>
      =
      data.includes(value) ? data.filter((item: any) => item !== value) : [...data, value]

    onChange(updatedItems)
  };

  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <div className={`${className} checkboxes`}>
        {items.map((item, i) => {
          return (
            <Checkbox
              key={i}
              labelValue={item}
              active={data.includes(item)}
              onChange={() => handleCheckbox(item)}
            />
          );
        })}
      </div>
    </>
  );
};

export default OtcCheckboxRow;

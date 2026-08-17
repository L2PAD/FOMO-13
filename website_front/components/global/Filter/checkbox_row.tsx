import React, { FC, useEffect, useState } from "react";
import Checkbox from "../common/Checkbox";
import { RangeTitle } from "./styles";

interface Props {
  title: string;
  items: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

const CheckboxRow: FC<Props> = ({ title, items, onChange, className }) => {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const handleCheckbox = (value: string) => {
    setCheckedItems((state) => {
      if (state.includes(value)) {
        return state.filter((item) => item !== value);
      }
      return [...state, value];
    });
  };

  useEffect(() => {
    onChange(checkedItems);
  }, [checkedItems, onChange]);

  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <div className={`${className} checkboxes`}>
        {items.map((item, i) => {
          return (
            <Checkbox
              key={i}
              label={item}
              checked={checkedItems.includes(item)}
              onChange={() => handleCheckbox(item)}
            />
          );
        })}
      </div>
    </>
  );
};

export default CheckboxRow;

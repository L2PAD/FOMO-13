import React, { FC, useEffect, useState } from "react";
import Checkbox from "../common/Checkbox";
import { RangeTitle } from "./styles";

interface Props {
  title: string;
  items: string[];
  onChange: (value: string[]) => void;
  className?: string;
  data: any;
}

const OtcCheckboxRow: FC<Props> = ({
  title,
  items,
  onChange,
  className,
  data,
}) => {
  const handleCheckbox = (value: string) => {
    const updatedItems: Array<string> = data.includes(value)
      ? data.filter((item: any) => item !== value)
      : [...data, value];

    onChange(updatedItems);
  };

  const groupedByThree = [];
  for (let i = 0; i < items.length; i += 3) {
    groupedByThree.push(items.slice(i, i + 3));
  }

  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <div className={`${className} checkboxes`}>
        {groupedByThree.map((group, groupIndex) => (
          <div key={groupIndex} className="checkbox-group">
            {group.map((item, i) => {
              return (
                <Checkbox
                  key={i}
                  label={item}
                  checked={data.includes(item)}
                  onChange={() => handleCheckbox(item)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

export default OtcCheckboxRow;

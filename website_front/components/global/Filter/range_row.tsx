/* eslint-disable */
import React, { FC, useEffect, useState } from "react";
import Range from "../Range";
import { RangeTitle } from "./styles";

interface Props {
  title: string;
  range: number[];
  step: number;
  onChange: (value: number[]) => void;
}
const RangeRow: FC<Props> = ({ title, range, step, onChange }) => {
  const [values, setValues] = useState(range);

  const handleRange = (value: number[]) => {
    setValues(value);
    onChange(value);
  };

  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <Range
        min={range[0]}
        max={range[1]}
        values={values}
        step={step}
        onChange={handleRange}
      />
    </>
  );
};

export default RangeRow;

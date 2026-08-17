/* eslint-disable */
import React, { FC, useEffect, useState } from "react";
import Range from "../Range";
import { RangeTitle } from "./styles";

interface Props {
  title: string;
  range: number[];
  data: number[];
  step: number;
  onChange: (value: number[]) => void;
}
const OtcRangeRow: FC<Props> = ({ title, range, step, data, onChange }) => {
  const handleRange = (value: number[]) => {
    onChange(value);
  };

  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <Range
        isValueInput={true}
        min={range[0]}
        max={range[1]}
        values={data}
        step={step}
        onChange={handleRange}
      />
    </>
  );
};

export default OtcRangeRow;

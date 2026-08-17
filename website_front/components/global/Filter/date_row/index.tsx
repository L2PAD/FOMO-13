import React, { FC } from "react";
import CustomDatePicker from "../../CustomDatePicker";
import { RangeTitle } from "../styles";

interface Props {
  title: string;
  simple?: boolean;
}

const DateRow: FC<Props> = ({ title, simple }) => {
  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <CustomDatePicker
        onChange={(value) => console.log(value)}
        startDate={new Date()}
        endDate={new Date()}
        simple={simple}
        icon={false}
      />
    </>
  );
};

export default DateRow;

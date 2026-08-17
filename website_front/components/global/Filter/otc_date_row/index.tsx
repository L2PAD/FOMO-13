import React, { FC } from "react";
import ModalDatePicker from "../../common/components_for_modals/modal_date_picker";
import { DatePickerWrapper } from "../../common/components_for_modals/modal_date_picker/styles";
import { RangeTitle } from "../styles";
import { DatesLine, DatesWrapper } from "./styles";

interface Props {
  title: string;
  simple?: boolean;
  startDate: Date;
  endDate: Date;
  onChange: (value: any, key: string) => void;
}

const OtcDateRow: FC<Props> = ({
  title,
  simple,
  startDate,
  endDate,
  onChange,
}) => {
  return (
    <>
      {title && <RangeTitle variant="p">{title}</RangeTitle>}
      <DatesWrapper>
        <DatePickerWrapper>
          <ModalDatePicker
            type="small"
            date={startDate}
            onChange={(value: any) => onChange(value, "startDate")}
          />
        </DatePickerWrapper>
        <DatesLine>-</DatesLine>
        <DatePickerWrapper>
          <ModalDatePicker
            type="small"
            date={endDate}
            onChange={(value: any) => onChange(value, "endDate")}
          />
        </DatePickerWrapper>
      </DatesWrapper>
    </>
  );
};

export default OtcDateRow;

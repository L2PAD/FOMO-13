import React, { FC, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import DetailsCalendarIcon from "../Icons/DetailsCalendarIcon";
import { ArrowRightIcon } from "../Icons";
import {
  CustomDateButton,
  CustomDateHeaderWrapper,
  DatePickerWrapper,
  SimpleWrapper,
} from "./styles";

interface Props {
  startDate: null | Date;
  endDate: null | Date;
  onChange: (value: Date[]) => void;
  simple?: boolean;
  icon?: boolean;
}

const CustomDatePicker: FC<Props> = ({
  startDate,
  endDate,
  onChange,
  simple = false,
  icon = true,
}) => {
  const ExampleCustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
    <CustomDateButton className="custom-input" onClick={onClick} ref={ref}>
      {icon && <DetailsCalendarIcon />}
      <span>{value.split("/").join(".")}</span>
    </CustomDateButton>
  ));

  const SimpleCustomInput = forwardRef(({ value, onClick }: any, ref: any) => {
    return (
      <SimpleWrapper onClick={onClick} ref={ref}>
        <span>{value.split("-")[0]}</span>-<span>{value.split("-")[1]}</span>
      </SimpleWrapper>
    );
  });

  const CustomDaPickerHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => {
    return (
      <CustomDateHeaderWrapper>
        <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
          <ArrowRightIcon fill="#738094" />
        </button>
        <span>
          {moment(date).format("MMM")}, {moment(date).format("YYYY")}
        </span>
        <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
          <ArrowRightIcon fill="#738094" />
        </button>
      </CustomDateHeaderWrapper>
    );
  };

  const renderDayContents = (day: string, date: Date) => {
    const tooltipText = `Tooltip for date: ${date}`;
    return <span title={tooltipText}>{moment(date).format("D")}</span>;
  };

  return (
    <DatePickerWrapper oneDay={startDate?.toString() === endDate?.toString()}>
      {/*//@ts-ignore*/}
      <DatePicker
        selected={startDate}
        onChange={onChange}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        customInput={
          simple ? <SimpleCustomInput /> : <ExampleCustomInput icon={icon} />
        }
        renderCustomHeader={(props: any) => <CustomDaPickerHeader {...props} />}
        renderDayContents={renderDayContents}
        calendarStartDay={1}
      />
    </DatePickerWrapper>
  );
};

export default CustomDatePicker;

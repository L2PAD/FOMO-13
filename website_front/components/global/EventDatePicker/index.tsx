import React, { FC, forwardRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import DetailsCalendarIcon from "../Icons/DetailsCalendarIcon";
import CalendarLeft from "../../../assets/icons/calendar-left.svg";
import CalendarMiddle from "../../../assets/icons/calendar-middle.svg";
import CalendarRight from "../../../assets/icons/calendar-right.svg";
import { ArrowRightIcon } from "../Icons";
import {
  CustomDateHeaderWrapper,
  DatePickerWrapper,
  CustomDateInputWrapper,
  CustomInputField,
  CalendarHeaderActions,
} from "./styles";
import Image from "next/image";

interface Props {
  date: null | Date;
  onChange: (value: Date) => void;
  simple?: boolean;
  icon?: boolean;
}

const EventDatePicker: FC<Props> = ({
  date,
  onChange,
  simple = false,
  icon = true,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const ExampleCustomInput = forwardRef(({ value, onClick }: any, ref: any) => {
    const [day, setDay] = useState(moment(value).format("DD"));
    const [month, setMonth] = useState(moment(value).format("MM"));
    const [year, setYear] = useState(moment(value).format("YYYY"));

    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDay = e.target.value.replace(/\D/g, "").slice(0, 2);
      setDay(newDay);
      if (newDay.length === 2) {
        const updatedDate = moment(`${year}-${month}-${newDay}`, "YYYY-MM-DD");
        if (updatedDate.isValid()) {
          onChange(updatedDate.toDate());
        }
      }
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMonth = e.target.value.replace(/\D/g, "").slice(0, 2);
      setMonth(newMonth);
      if (newMonth.length === 2) {
        const updatedDate = moment(`${year}-${newMonth}-${day}`, "YYYY-MM-DD");
        if (updatedDate.isValid()) {
          onChange(updatedDate.toDate());
        }
      }
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newYear = e.target.value.replace(/\D/g, "").slice(0, 4);
      setYear(newYear);
      if (newYear.length === 4) {
        const updatedDate = moment(`${newYear}-${month}-${day}`, "YYYY-MM-DD");
        if (updatedDate.isValid()) {
          onChange(updatedDate.toDate());
        }
      }
    };

    return (
      <CustomDateInputWrapper onClick={onClick} ref={ref}>
        <CustomInputField
          type="text"
          value={day}
          onChange={handleDayChange}
          placeholder="DD"
        />
        /
        <CustomInputField
          type="text"
          value={month}
          onChange={handleMonthChange}
          placeholder="MM"
        />
        /
        <CustomInputField
          type="text"
          value={year}
          onChange={handleYearChange}
          placeholder="YYYY"
        />
      </CustomDateInputWrapper>
    );
  });

  const CustomDateHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => {
    return (
      <CustomDateHeaderWrapper>
        <span>
          {moment(date).format("MMM")} {moment(date).format("YYYY")}
        </span>
        <CalendarHeaderActions>
          <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
            <Image src={CalendarLeft} alt="calendar-left" />
          </button>
          <button>
            <Image src={CalendarMiddle} alt="calendar-middle" />
          </button>
          <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
            <Image src={CalendarRight} alt="calendar-right" />
          </button>
        </CalendarHeaderActions>
      </CustomDateHeaderWrapper>
    );
  };

  const renderDayContents = (day: number, date?: Date) => {
    const tooltipText = `Tooltip for date: ${date}`;
    return <span title={tooltipText}>{moment(date).format("D")}</span>;
  };

  return (
    <DatePickerWrapper isOpen={isOpen} oneDay>
      {/* @ts-ignore */}
      <DatePicker
        onCalendarOpen={() => setIsOpen(true)}
        onCalendarClose={() => setIsOpen(false)}
        selected={date}
        onChange={(newDate: Date) => onChange(newDate)}
        startDate={date}
        customInput={<ExampleCustomInput />}
        renderCustomHeader={(props: any) => <CustomDateHeader {...props} />}
        renderDayContents={renderDayContents}
        calendarStartDay={1}
      />
    </DatePickerWrapper>
  );
};

export default EventDatePicker;

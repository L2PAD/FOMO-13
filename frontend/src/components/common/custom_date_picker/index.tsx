import React, {FC, forwardRef} from 'react';
import ArrowRightIcon from '../../../assets/ArrowRightIcon'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment';
import {CustomDateButton, CustomDateHeaderWrapper, DatePickerWrapper} from './styles';
import DetailsCalendarIcon from '../Icons/details_calendar_icon';

interface Props {
    startDate: null | Date,
    endDate: null | Date,
    onChange: (value: Date[]) => void;
}

const CustomDatePicker: FC<Props> = ({startDate, endDate, onChange}) => {

    // eslint-disable-next-line react/display-name
    const ExampleCustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
        <CustomDateButton className="custom-input" onClick={onClick} ref={ref}>
            <DetailsCalendarIcon />
            <span>{value.split('/').join('.')}</span>
        </CustomDateButton>
    ));

    const CustomDaPickerHeader = (
        {
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
        }: any,
    ) => {
        return (
            <CustomDateHeaderWrapper>
                <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
                    <ArrowRightIcon fill="#738094" />
                </button>
                <span>
                    {moment(date).format('MMM')}, {moment(date).format('YYYY')}
                </span>
                <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
                    <ArrowRightIcon fill="#738094" />
                </button>
            </CustomDateHeaderWrapper>
        )
    }

    const renderDayContents = (day: string, date: Date) => {
        const tooltipText = `Tooltip for date: ${date}`;
        return <span title={tooltipText}>
            {moment(date).format('D')}
        </span>;
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
                customInput={<ExampleCustomInput />}
                renderCustomHeader={(props: any) => <CustomDaPickerHeader {...props} />}
                renderDayContents={renderDayContents}
                calendarStartDay={1}
            />
        </DatePickerWrapper>
    );
};

export default CustomDatePicker;
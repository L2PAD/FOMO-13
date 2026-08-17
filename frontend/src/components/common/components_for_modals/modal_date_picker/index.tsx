import React, {FC, forwardRef} from 'react';
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment';
import {CustomDateButton, CustomDateHeaderWrapper, DatePickerWrapper} from './styles';
import DetailsCalendarIcon from '../../Icons/details_calendar_icon';
import ArrowRightIcon from '../../../../assets/ArrowRightIcon'

interface Props {
    date: null | Date,
    onChange: (value: Date[],name:string) => void;
    name?:string | undefined
}

const ModalDatePicker: FC<Props> = ({name, date, onChange}) => {

    // eslint-disable-next-line react/display-name
    const ExampleCustomInput = forwardRef(({ value, onClick }: any, ref: any) => (
        <CustomDateButton className="custom-input" onClick={onClick} ref={ref}>
            <DetailsCalendarIcon />
            <span>{moment(value).format('DD.MM.YYYY')}</span>
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

    const inputHandler = (value:Date[]) => {
        if(name){
            onChange(value,name)
        }
    }

    return (
        <DatePickerWrapper>
            {/*//@ts-ignore*/}
            <DatePicker
                selected={date}
                onChange={inputHandler}
                customInput={<ExampleCustomInput />}
                renderCustomHeader={(props: any) => <CustomDaPickerHeader {...props} />}
                renderDayContents={renderDayContents}
                calendarStartDay={1}
            />
        </DatePickerWrapper>
    );
};

export default ModalDatePicker;
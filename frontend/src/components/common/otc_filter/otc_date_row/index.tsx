import React, {FC} from 'react';
import ModalDatePicker from '../../components_for_modals/modal_date_picker';
import { DatePickerWrapper } from '../../custom_date_picker/styles';
import {RangeTitle} from '../styles';
import { DatesLine, DatesWrapper } from './styles';

interface Props {
    title: string;
    simple?: boolean;
    startDate:Date 
    endDate:Date
    onChange:(value:any,key:string) => void
}

const OtcDateRow: FC<Props> = ({title, simple ,startDate,endDate,onChange}) => {
    return (
        <>
            {title && <RangeTitle variant="p">
                {title}
            </RangeTitle>}
            <DatesWrapper>
                <DatePickerWrapper
                oneDay={true}
                >
                    <ModalDatePicker
                    name='startDate'
                    date={startDate}
                    onChange={(value: any) => onChange(value, 'startDate')}
                    />
                </DatePickerWrapper>
                <DatesLine>
                    -
                </DatesLine>
                <DatePickerWrapper
                oneDay={true}
                >
                    <ModalDatePicker
                    name='endDate'
                    date={endDate}
                    onChange={(value: any) => onChange(value, 'endDate')}
                    />
                </DatePickerWrapper>
            </DatesWrapper>
        </>
    );
};

export default OtcDateRow;
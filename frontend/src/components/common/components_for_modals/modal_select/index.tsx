import React, {FC, useState} from 'react';
import {DropdownWrapper, InputValue, Label, Wrapper} from './styles';
import ArrowDownIcon from '../../Icons/arrow_down_icon';
import { IProject } from '../../../hooks/useCreateProject';

interface Props {
    name?:string;
    label: string;
    items: string[] ;
    onChange: (value: string,name:string) => void;
    value: string;
}

const ModalSelect: FC<Props> = ({label, items, onChange, value,name}) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Wrapper>
            <Label>
                {label}
            </Label>
            <InputValue active={isOpen} onClick={() => setIsOpen(state => !state)}>
                {value}
                <ArrowDownIcon />
            </InputValue>
            <DropdownWrapper active={isOpen}>
                {items.map((item, i) => (
                    <div key={i} onClick={() => {
                        onChange(item,name || 'type')
                        setIsOpen(false)
                    }}>{item}</div>
                ))}
            </DropdownWrapper>
        </Wrapper>
    );
};

export default ModalSelect;
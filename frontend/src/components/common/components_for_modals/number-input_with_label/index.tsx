import React, {FC} from 'react';
import {Input, Label} from './styles';

interface Props {
    onChange: (value: number,name:string) => void;
    value: number;
    label?: string;
    name:string;
    type?:string;
    placeholder?:string;
}

const InputWithLabel: FC<Props> = ({onChange, label, value, name,type,placeholder}) => {
    return (
        <div>
            {label && <Label>{label}</Label>}
            <Input
                placeholder={placeholder || ''}
                name={name}
                type={type ? type : 'text'}
                value={value}
                onChange={e => onChange(Number(e.target.value),name)}
            />
        </div>
    );
};

export default InputWithLabel;
import React, {FC} from 'react';
import {Wrapper} from './styles';

interface Props {
    onChange: (value: string) => void;
    value: string;
    label: string;
}

const RadioButton: FC<Props> = ({onChange, label, value}) => {
    return (
        <Wrapper checked={value === label} onClick={() => onChange(label)}>
            <div><span/></div>
            <input type="radio" checked={value === label} onChange={() => console.log('w')}/>
            {label}
        </Wrapper>
    );
};

export default RadioButton;
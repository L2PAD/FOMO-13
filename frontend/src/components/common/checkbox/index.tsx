import React, {FC} from 'react';
import {useStyles} from './styles';

interface Props {
    labelValue?: string;
    onChange: () => void;
    active: boolean;
}

const Checkbox: FC<Props> = ({labelValue = '', onChange, active}) => {

    const {
        wrapper,
        label,
        inputWrapper,
        input,
        checkmark,
    } = useStyles({active})

    return (
        <div className={wrapper}>
            <label onChange={onChange}>
                {labelValue && <p className={label}>{labelValue}</p>}
                <div className={inputWrapper}>
                    <input
                        onChange={() => console.log('')}
                        className={input}
                        type="checkbox"
                        checked={active}
                    />
                    <div className={checkmark} />
                </div>
            </label>
        </div>
    );
};

export default Checkbox;
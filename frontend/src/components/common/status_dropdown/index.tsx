import React, {FC, useState} from 'react';
import {STATUS_LIST} from '../../../static_content/dropdowns_data';
import {useStyles} from './styles';
import ArrowDownIcon from '../Icons/arrow_down_icon';

interface Props {
    onChange: (value: STATUS_LIST) => void;
    activeOption: STATUS_LIST;
}

const StatusDropdown: FC<Props> = ({onChange, activeOption}) => {
    const [isOpen, setIsOpen] = useState(false)

    const {
        wrapper,
        valueWrapper,
        dropdownWrapper,
        dropdown,
    } = useStyles({status: activeOption,isOpen})

    return (
        <div
            className={wrapper}
            onBlur={() => setIsOpen(false)}
        >
            <button
                className={valueWrapper}
                onClick={() => setIsOpen(!isOpen)}
            >
                {activeOption}
                <ArrowDownIcon />
            </button>
            <div 
            onBlur={() => setIsOpen(false)}
            className={dropdown}>
                <ul className={dropdownWrapper}>
                    <button
                        onClick={() => onChange(STATUS_LIST.ACTIVE)}
                        className={activeOption === STATUS_LIST.ACTIVE ? 'active' : ''}
                    >
                        {STATUS_LIST.ACTIVE}
                    </button>
                    <button
                        onClick={() => onChange(STATUS_LIST.UPCOMING)}
                        className={activeOption === STATUS_LIST.UPCOMING ? 'active' : ''}
                    >
                        {STATUS_LIST.UPCOMING}
                    </button>
                    <button
                        onClick={() => onChange(STATUS_LIST.ENDED)}
                        className={activeOption === STATUS_LIST.ENDED ? 'active' : ''}
                    >
                        {STATUS_LIST.ENDED}
                    </button>
                    <button
                        onClick={() => onChange(STATUS_LIST.NEW)}
                        className={activeOption === STATUS_LIST.NEW ? 'active' : ''}
                    >
                        {STATUS_LIST.NEW}
                    </button>
                </ul>
            </div>
        </div>
    );
};

export default StatusDropdown;
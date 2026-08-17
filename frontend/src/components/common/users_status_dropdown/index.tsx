import React, {FC, useState} from 'react';
import { USERS_STATUS_LIST} from '../../../static_content/dropdowns_data';
import {useStyles} from './styles';
import ArrowDownIcon from '../Icons/arrow_down_icon';

interface Props {
    onChange: (value: USERS_STATUS_LIST) => void;
    activeOption: USERS_STATUS_LIST;
}

const UserStatusDropdown: FC<Props> = ({onChange, activeOption}) => {
    const {
        wrapper,
        valueWrapper,
        dropdownWrapper,
        dropdown,
    } = useStyles({status: activeOption})

    const [isOpen, setIsOpen] = useState(false)

    return (
        <div
            className={wrapper}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div
                className={valueWrapper}
                onClick={() => setIsOpen(true)}
            >
                {activeOption}
                <ArrowDownIcon />
            </div>
            {isOpen && <div className={dropdown}>
                <ul className={dropdownWrapper}>
                    <li
                        onClick={() => onChange(USERS_STATUS_LIST.ACTIVE)}
                        className={activeOption === USERS_STATUS_LIST.ACTIVE ? 'active' : ''}
                    >
                        {USERS_STATUS_LIST.ACTIVE}
                    </li>
                    <li
                        onClick={() => onChange(USERS_STATUS_LIST.BLOCKED)}
                        className={activeOption === USERS_STATUS_LIST.BLOCKED ? 'active' : ''}
                    >
                        {USERS_STATUS_LIST.BLOCKED}
                    </li>
                </ul>
            </div>}
        </div>
    );
};

export default UserStatusDropdown;
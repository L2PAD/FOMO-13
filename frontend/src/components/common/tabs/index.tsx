import React, { FC } from 'react';
import { useStyles } from './styles';
import { DEALS_TABS } from '../../../pages/UsersList/UsersListOtc';

interface Props {
    tabs: string[];
    onChange: (value: any) => void;
    activeTab: string;
}

const Tabs: FC<Props> = ({ tabs, activeTab, onChange }) => {
    const {
        wrapper,
        valueWrapper,
        activeValue,
    } = useStyles()

    return (
        <div id='tabs-wrapper' className={wrapper}>
            {tabs.map((item, i) => (
                <div
                    className={`${valueWrapper} ${activeTab === item ? activeValue : ''} tab-item`}
                    onClick={() => onChange(item)}
                    key={i}
                >
                    {item}
                </div>
            ))}
        </div>
    );
};

export default Tabs;
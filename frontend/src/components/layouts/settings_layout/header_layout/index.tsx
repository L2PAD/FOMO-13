import React, {FC} from 'react';
import Tabs from '../../../common/tabs';
import {SETTINGS_TABS, settingsTabsArray} from '../../../../static_content/settings_data';
import {useStyles} from './styles';

interface Props {
    activeTab: string,
    onChange: (value: SETTINGS_TABS) => void;
}

const HeaderLayout: FC<Props> = ({activeTab, onChange}) => {

    const {title} = useStyles()

    return (
        <div>
            <div className={title}>
                Settings
            </div>
            <Tabs
                tabs={settingsTabsArray}
                activeTab={activeTab}
                onChange={onChange as (value: string) => void}
            />
        </div>
    );
};

export default HeaderLayout;
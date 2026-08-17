import React, {FC} from 'react';
import OverviewTab from './overview_tab';
import {PROJECT_TABS_DATA} from '../../../../../static_content/project_tabs_data';
import ExchangesTab from './exchanges_tab';
import NewsTab from './news_tab';
import FundraisingTab from './fundraising_tab';
import { IProject } from '../../../../hooks/useCreateProject';

interface Props {
    activeTab: PROJECT_TABS_DATA;
}

const ProjectTabs: FC<Props> = ({activeTab}) => {

    const handleActiveTab = () => {
        switch (activeTab) {
            case PROJECT_TABS_DATA.OVERVIEW:
                return <OverviewTab/>
            case PROJECT_TABS_DATA.EXCHANGE:
                return <ExchangesTab/>
            case PROJECT_TABS_DATA.NEWS:
                return <NewsTab/>
            case PROJECT_TABS_DATA.FUNDRAISING:
                return <FundraisingTab />
        }
    }

    return (
        <>
            {handleActiveTab()}
        </>
    )
};

export default ProjectTabs;
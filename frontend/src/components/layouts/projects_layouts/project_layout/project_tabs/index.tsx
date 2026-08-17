import React, {FC} from 'react';
import OverviewTab from './overview_tab';
import {ACTIVE_PROJECT_TABS_DATA, PROJECT_TABS_DATA} from '../../../../../static_content/project_tabs_data';
import ExchangesTab from './exchanges_tab';
import NewsTab from './news_tab';
import FundraisingTab from './fundraising_tab';
import { IProject } from '../../../../hooks/useCreateProject';
import TokenMetricsTab from './token_metrics_tab';
import ComparisonTab from './comprastion_tab';

interface Props {
    activeTab: PROJECT_TABS_DATA | ACTIVE_PROJECT_TABS_DATA;
    isEditState:boolean
}

const ProjectTabs: FC<Props> = ({activeTab,isEditState}) => {

    const handleActiveTab = () => {
        switch (activeTab) {
            case PROJECT_TABS_DATA.OVERVIEW:
                return <OverviewTab/>
            case PROJECT_TABS_DATA.EXCHANGE:
                return <ExchangesTab/>
            case ACTIVE_PROJECT_TABS_DATA.TOKEN_METRICS:
                return <TokenMetricsTab isEditState={isEditState}/>
            case ACTIVE_PROJECT_TABS_DATA.COMPARISON:
                return <ComparisonTab isEditState={isEditState}/>
            case PROJECT_TABS_DATA.NEWS:
                return <NewsTab/>
            case PROJECT_TABS_DATA.FUNDRAISING:
                return <FundraisingTab isEditState={isEditState}/>
        }
    }

    return (
        <>
            {handleActiveTab()}
        </>
    )
};

export default ProjectTabs;
import {useState,useContext} from 'react';
import {NEWS_TABS_LIST, newsTabsList} from '../../../static_content/news_data';
import SmartTab from './news_tabs/smart_tab';
import MarketTab from './news_tabs/market_tab';
import TopicsTab from './news_tabs/topics_tab';
import ModerationTab from './news_tabs/moderation_tab';
import AiDiscussionsTab from './news_tabs/ai_discussions_tab';
import { T } from '../../../pages/Statistics/ui';
import useFetch from '../../hooks/useFetch';
import getAccessToken from '../../utils/getAccessToken';
import { INews } from '../../types/global_types';

const NEWS_TAB_LABELS: Record<string, string> = {
    Smart: 'Смарт',
    Market: 'Новости',
    Topics: 'Темы',
    Moderation: 'Модерация',
    AiDiscussions: 'AI в обсуждениях',
};

const NewsLayout = ({type}:{type:string}) => {
    const visibleTabs = type === 'crypto'
        ? newsTabsList.filter((tab) => tab !== NEWS_TABS_LIST.SMART)
        : newsTabsList
    const [activeTab, setActiveTab] = useState(visibleTabs[0])
    const {data,loading} = useFetch(`news/all/${type}`,{headers:{'Authorization': `Bearer ${getAccessToken()}`}})

    const handleChosenLayout = () => {
        switch(activeTab) {
            case NEWS_TABS_LIST.SMART:
                return <SmartTab />
            case NEWS_TABS_LIST.MARKET:
                return <MarketTab news={data?.data}/>
            case NEWS_TABS_LIST.TOPICS:
                return <TopicsTab />
            case NEWS_TABS_LIST.MODERATION:
                return <ModerationTab />
            case NEWS_TABS_LIST.AI:
                return <AiDiscussionsTab />
        }
    }

    return (
        <div style={{ padding: '4px 24px 32px' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${T.border}` }}>
                {visibleTabs.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as NEWS_TABS_LIST)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '12px 16px',
                                fontSize: 14,
                                fontWeight: 700,
                                color: isActive ? T.accent : T.sub,
                                borderBottom: `2px solid ${isActive ? T.accent : 'transparent'}`,
                                marginBottom: -1,
                            }}
                            data-testid={`buzz-subtab-${String(tab).toLowerCase()}`}
                        >
                            {NEWS_TAB_LABELS[tab] || tab}
                        </button>
                    );
                })}
            </div>
            <div style={{ marginTop: 8 }}>
                {handleChosenLayout()}
            </div>
        </div>
    );
};

export default NewsLayout;

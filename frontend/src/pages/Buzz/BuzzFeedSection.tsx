import React, { useState } from 'react';
import { T } from '../Statistics/ui';
import TopicsTab from '../../components/layouts/news_layout/news_tabs/topics_tab';
import ModerationTab from '../../components/layouts/news_layout/news_tabs/moderation_tab';
import AiDiscussionsTab from '../../components/layouts/news_layout/news_tabs/ai_discussions_tab';

const SUB_TABS = [
    { key: 'topics', label: 'Темы' },
    { key: 'moderation', label: 'Модерация' },
    { key: 'ai', label: 'AI в обсуждениях' },
];

// Buzz → Feed: всё, что относится к комьюнити-фиду сайта.
// Темы (топики фида), модерация фида и участие FOMO AI в обсуждениях.
const BuzzFeedSection: React.FC = () => {
    const [tab, setTab] = useState('topics');

    return (
        <div data-testid="buzz-feed-section">
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 12 }}>
                Комьюнити-фид: темы обсуждений, модерация и AI-участник. Управляет тем, что видят участники во вкладке Feed на сайте.
            </div>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 12 }}>
                {SUB_TABS.map((s) => {
                    const active = tab === s.key;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setTab(s.key)}
                            data-testid={`buzz-feed-subtab-${s.key}`}
                            style={{
                                background: active ? `${T.accent}12` : 'transparent',
                                border: `1px solid ${active ? T.accent : T.border}`,
                                color: active ? T.accent : T.sub,
                                cursor: 'pointer',
                                padding: '7px 14px',
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                        >
                            {s.label}
                        </button>
                    );
                })}
            </div>
            {tab === 'topics' && <TopicsTab />}
            {tab === 'moderation' && <ModerationTab />}
            {tab === 'ai' && <AiDiscussionsTab />}
        </div>
    );
};

export default BuzzFeedSection;

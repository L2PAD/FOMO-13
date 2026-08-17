import React, { useEffect, useState } from 'react';
import { T } from '../Statistics/ui';
import ParcingTab from '../../components/layouts/news_layout/news_tabs/parcing_tab';
import MarketTab from '../../components/layouts/news_layout/news_tabs/market_tab';
import { fetchAllNews } from '../../components/services/buzz/buzzStats';
import { INews } from '../../components/types/global_types';

const SUB_TABS = [
    { key: 'articles', label: 'Новости' },
    { key: 'parsing', label: 'Парсинг' },
];

const normalize = (raw: any): INews[] => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.news)) return raw.news;
    return [];
};

// Buzz → Новости: только парсинг источников и опубликованные новостные материалы.
// Никаких топиков/фида/дайджестов здесь нет — чистое разделение логики.
const BuzzNewsSection: React.FC = () => {
    const [tab, setTab] = useState('articles');
    const [news, setNews] = useState<INews[]>([]);

    useEffect(() => {
        let alive = true;
        fetchAllNews('crypto').then((r) => {
            if (!alive || !r.success) return;
            // exclude FOMO Updates — they live in their own section
            setNews(normalize(r.data).filter((n: any) => (n.newsSection || '') !== 'fomo-update'));
        });
        return () => { alive = false; };
    }, []);

    return (
        <div data-testid="buzz-news-section">
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 12 }}>
                {SUB_TABS.map((s) => {
                    const active = tab === s.key;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setTab(s.key)}
                            data-testid={`buzz-news-subtab-${s.key}`}
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
            {tab === 'articles' ? <MarketTab news={news} /> : <ParcingTab />}
        </div>
    );
};

export default BuzzNewsSection;

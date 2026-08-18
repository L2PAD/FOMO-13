import React, { useEffect, useState } from 'react';
import MarketTab from '../../components/layouts/news_layout/news_tabs/market_tab';
import { fetchAllNews } from '../../components/services/buzz/buzzStats';
import { INews } from '../../components/types/global_types';

const normalize = (raw: any): INews[] => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.news)) return raw.news;
    return [];
};

// Buzz → Новости: только опубликованные новостные материалы.
// Парсинг Twitter/X вынесен в отдельный top-level раздел CRM (Phase 6A P0 separation).
const BuzzNewsSection: React.FC = () => {
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
            <MarketTab news={news} />
        </div>
    );
};

export default BuzzNewsSection;

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/layouts/main_layout/layout';
import { T } from '../Statistics/ui';
import FooterLayout from '../../components/layouts/settings_layout/footer_layout';
import CreateFAQLayout from '../../components/layouts/settings_layout/FAQ_layout';
import CalendarLayout from '../../components/layouts/calendar_layout/CalendarControlCenter';
import TabsLayout from '../../components/layouts/tabs_layout';
import InfoLayout from '../../components/layouts/info_layout/InfoLayout';
import NewsControlCenter from '../../components/layouts/news_layout/NewsControlCenter';

type TabKey = 'footer' | 'faq' | 'calendar' | 'tabs' | 'info' | 'news';

interface TabDef {
    key: TabKey;
    label: string;
    adminOnly?: boolean;
}

const TABS: TabDef[] = [
    { key: 'news', label: 'Новости' },
    { key: 'footer', label: 'Футер' },
    { key: 'faq', label: 'FAQ' },
    { key: 'calendar', label: 'Календарь' },
    { key: 'tabs', label: 'Вкладки' },
    { key: 'info', label: 'Инфо лендинг', adminOnly: true },
];

const ContentPage = () => {
    const { section } = useParams<{ section?: string }>();
    const isAdmin = String(localStorage.getItem('fomoRole') || '').trim().toLowerCase() === 'admin';

    const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);
    const initialTab: TabKey = visibleTabs.some((t) => t.key === section)
        ? (section as TabKey)
        : 'footer';
    const [tab, setTab] = useState<TabKey>(initialTab);

    const renderTab = () => {
        switch (tab) {
            case 'news':
                return <NewsControlCenter />;
            case 'footer':
                return <FooterLayout />;
            case 'faq':
                return <CreateFAQLayout />;
            case 'calendar':
                return <CalendarLayout page="crypto" />;
            case 'tabs':
                return <TabsLayout />;
            case 'info':
                return isAdmin ? <InfoLayout /> : <FooterLayout />;
            default:
                return <FooterLayout />;
        }
    };

    return (
        <Layout>
            <div style={{ background: T.pageBg, minHeight: '100%', padding: '20px 24px 40px' }} data-testid="content-page">
                <style>{`::selection{background:${T.accent};color:#fff}`}</style>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginBottom: 16 }}>Контент</div>
                <div
                    style={{ display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}
                    role="tablist"
                >
                    {visibleTabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            data-testid={`content-tab-${t.key}`}
                            role="tab"
                            aria-selected={tab === t.key}
                            style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontSize: 13.5,
                                fontWeight: 700,
                                border: 'none',
                                background: 'transparent',
                                color: tab === t.key ? T.accent : T.sub,
                                borderBottom: `2px solid ${tab === t.key ? T.accent : 'transparent'}`,
                                marginBottom: -1,
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div data-testid={`content-panel-${tab}`}>
                    {renderTab()}
                </div>
            </div>
        </Layout>
    );
};

export default ContentPage;

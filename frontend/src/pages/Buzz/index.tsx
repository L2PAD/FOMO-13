import React, { useState } from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import { T } from '../Statistics/ui';
import CalendarControlCenter from '../../components/layouts/calendar_layout/CalendarControlCenter';
import BuzzDashboard from './BuzzDashboard';
import BuzzUpdatesTab from './BuzzUpdatesTab';
import BuzzNewsSection from './BuzzNewsSection';
import BuzzFeedSection from './BuzzFeedSection';

// Buzz is a top-level CRM section (under Spaceport).
// Clean separation of concerns — every section owns exactly one domain:
//  • Дашборд      → метрики вовлечённости + AI/COGS
//  • Новости      → парсинг источников + новостные материалы
//  • Feed         → топики фида, модерация, AI в обсуждениях
//  • Календарь    → события календаря (без дайджестов)
//  • Дайджесты    → редакционные обзоры рынка (публикации/отчёты)
//  • FOMO Updates → анонсы платформы
const SECTIONS = [
    { key: 'dashboard', label: 'Дашборд' },
    { key: 'news', label: 'Новости' },
    { key: 'feed', label: 'Feed' },
    { key: 'calendar', label: 'Календарь' },
    { key: 'digests', label: 'Дайджесты' },
    { key: 'updates', label: 'FOMO Updates' },
];

const BuzzPage = () => {
    const [section, setSection] = useState('dashboard');

    const renderSection = () => {
        switch (section) {
            case 'dashboard':
                return <BuzzDashboard />;
            case 'news':
                return <BuzzNewsSection />;
            case 'feed':
                return <BuzzFeedSection />;
            case 'calendar':
                return <CalendarControlCenter mode="calendar" />;
            case 'digests':
                return <CalendarControlCenter mode="digests" />;
            case 'updates':
                return <BuzzUpdatesTab />;
            default:
                return <BuzzDashboard />;
        }
    };

    return (
        <Layout>
            <div style={{ background: T.pageBg, minHeight: '100%', padding: '20px 24px 40px' }} data-testid="buzz-page">
                <style>{`::selection{background:${T.accent};color:#fff}`}</style>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Buzz</div>
                    <div style={{ fontSize: 13, color: T.sub }}>Комьюнити, контент и AI — каждый раздел отвечает за свою логику</div>
                </div>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${T.border}`, marginBottom: 18 }} role="tablist">
                    {SECTIONS.map((s) => {
                        const isActive = section === s.key;
                        return (
                            <button
                                key={s.key}
                                onClick={() => setSection(s.key)}
                                data-testid={`buzz-nav-${s.key}`}
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
                            >
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                <div>{renderSection()}</div>
            </div>
        </Layout>
    );
};

export default BuzzPage;

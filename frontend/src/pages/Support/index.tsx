import React, { useState } from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import { T } from '../Statistics/ui';
import OverviewTab from './OverviewTab';
import TicketsTab from './TicketsTab';
import TrustReportsTab from './TrustReportsTab';
import AppealsTab from './AppealsTab';
import ModerationTab from './ModerationTab';
import CategoriesTab from './CategoriesTab';
import AnalyticsTab from './AnalyticsTab';
import FlagsTab from './FlagsTab';

type TabKey = 'overview' | 'tickets' | 'reports' | 'flags' | 'disputes' | 'moderation' | 'categories' | 'analytics';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'tickets', label: 'Обращения' },
  { key: 'reports', label: 'Жалобы' },
  { key: 'flags', label: 'Флаги' },
  { key: 'disputes', label: 'Торговые споры' },
  { key: 'moderation', label: 'Модерация' },
  { key: 'categories', label: 'Категории' },
  { key: 'analytics', label: 'Аналитика' },
];

const SupportPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('overview');
  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: '100%', padding: '28px 28px 48px' }} data-testid="support-page">
        <style>{`::selection{background:${T.accent};color:#fff}`}</style>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>Support &amp; Trust Center</div>
          <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6, maxWidth: 860 }}>
            Единый центр обращений и доверия: тикеты поддержки, жалобы на пользователей и контент,
            торговые споры OTC / P2P, модерация, управление категориями и аналитика.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${T.border}`, marginBottom: 24 }} role="tablist">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`support-tab-${t.key}`} role="tab" aria-selected={tab === t.key}
              style={{ position: 'relative', padding: '11px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 700, border: 'none', background: 'transparent', color: tab === t.key ? T.accent : T.sub, borderBottom: `2px solid ${tab === t.key ? T.accent : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div>
          {tab === 'overview' && <OverviewTab onNavigate={setTab as any} />}
          {tab === 'tickets' && <TicketsTab />}
          {tab === 'reports' && <TrustReportsTab />}
          {tab === 'flags' && <FlagsTab />}
          {tab === 'disputes' && <AppealsTab />}
          {tab === 'moderation' && <ModerationTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </Layout>
  );
};

export default SupportPage;

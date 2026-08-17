import React, { useState } from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import { T, PageHeader, HeaderTab } from '../Statistics/ui';
import { OverviewTab, PlansTab, CapabilitiesTab, SubscriptionsTab, GrantsTab, DiagnosticsTab } from './parts';
import { SellingPageTab } from './sellingPage';

type TabKey = 'overview' | 'plans' | 'sellingpage' | 'capabilities' | 'subscriptions' | 'grants' | 'diagnostics';

const TABS: HeaderTab[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'plans', label: 'Тарифы' },
  { key: 'sellingpage', label: 'Страница продаж' },
  { key: 'capabilities', label: 'Возможности' },
  { key: 'subscriptions', label: 'Подписки' },
  { key: 'grants', label: 'Доступы' },
  { key: 'diagnostics', label: 'Диагностика' },
];

const SUBTITLE =
  'Глобальный слой управления доступами и монетизацией над всей платформой: тарифы, возможности (capabilities), подписки, ручные доступы, NFT-benefit правила, AI-кредиты и диагностика. Бесплатный слой FOMO не затрагивается.';

const AccessMonetizationPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('overview');
  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: '100%', padding: '28px 28px 48px' }} data-testid="access-monetization-page">
        <style>{`::selection{background:${T.accent};color:#fff}`}</style>
        <PageHeader
          title="Доступ и монетизация"
          subtitle={SUBTITLE}
          tabs={TABS}
          active={tab}
          onTab={(k) => setTab(k as TabKey)}
          testIdPrefix="accmon"
        />
        <div>
          {tab === 'overview' && <OverviewTab />}
          {tab === 'plans' && <PlansTab />}
          {tab === 'sellingpage' && <SellingPageTab />}
          {tab === 'capabilities' && <CapabilitiesTab />}
          {tab === 'subscriptions' && <SubscriptionsTab />}
          {tab === 'grants' && <GrantsTab />}
          {tab === 'diagnostics' && <DiagnosticsTab />}
        </div>
      </div>
    </Layout>
  );
};

export default AccessMonetizationPage;

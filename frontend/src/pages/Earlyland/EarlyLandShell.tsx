import React from 'react';
import { useHistory } from 'react-router-dom';
import Layout from '../../components/layouts/main_layout/layout';
import { T, PageHeader, HeaderTab } from '../Statistics/ui';
import ActivitiesPage from './Activities';
import TaskCenterPage from './TaskCenter';
import EarlyLandStats from './EarlyLandStats';

export type EarlyLandTab = 'all' | 'prime' | 'tasks' | 'statistics';

const TABS: HeaderTab[] = [
  { key: 'all', label: 'Активности' },
  { key: 'prime', label: 'Prime' },
  { key: 'tasks', label: 'Задачи' },
  { key: 'statistics', label: 'Статистика' },
];

const ROUTE: Record<EarlyLandTab, string> = {
  all: '/early_land',
  prime: '/early_land/prime',
  tasks: '/early_land/tasks',
  statistics: '/early_land/statistics',
};

const SUBTITLE =
  'Единый раздел ранних активностей: обычные и Prime, задания и статистика. Всё связано с XP Ledger, рейтингом и глобальной статистикой. Политикой доступа к Prime теперь управляет раздел «Доступ и монетизация».';

const EarlyLandShell: React.FC<{ tab: EarlyLandTab }> = ({ tab }) => {
  const history = useHistory();

  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: '100%', padding: '28px 28px 48px' }} data-testid="earlyland-shell">
        <PageHeader
          title="EarlyLand"
          subtitle={SUBTITLE}
          tabs={TABS}
          active={tab}
          onTab={(k) => {
            const next = ROUTE[k as EarlyLandTab];
            if (next) history.push(next);
          }}
          testIdPrefix="earlyland"
        />

        <div>
          {tab === 'all' && <ActivitiesPage embedded />}
          {tab === 'prime' && <ActivitiesPage embedded forcedTier="prime" />}
          {tab === 'tasks' && <TaskCenterPage embedded />}
          {tab === 'statistics' && <EarlyLandStats />}
        </div>
      </div>
    </Layout>
  );
};

export default EarlyLandShell;

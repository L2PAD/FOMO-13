import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/layouts/main_layout/layout';
import { T } from '../Statistics/ui';
import OverviewTab from './OverviewTab';
import CampaignsTab from './CampaignsTab';
import PlacementsTab from './PlacementsTab';
import ForecastTab from './ForecastTab';
import RequestsTab from './RequestsTab';
import PromoBannerTab from './PromoBannerTab';
import { adRequestCounts } from '../../components/services/advertising';

type TabKey = 'overview' | 'campaigns' | 'placements' | 'forecast' | 'requests' | 'promo';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'campaigns', label: 'Кампании' },
  { key: 'placements', label: 'Плейсменты' },
  { key: 'forecast', label: 'Прогнозирование' },
  { key: 'requests', label: 'Заявки' },
  { key: 'promo', label: 'Баннер рекламы' },
];

const AdvertisingPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('overview');
  const [newRequests, setNewRequests] = useState(0);
  const prevNew = useRef<number | null>(null);

  // Poll new "Your ad here" requests for CRM notification (badge + toast).
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const r = await adRequestCounts();
      if (!alive || !r.success) return;
      const n = Number(r.data?.new || 0);
      setNewRequests(n);
      if (prevNew.current !== null && n > prevNew.current) {
        const diff = n - prevNew.current;
        toast.info(`Новая заявка на рекламу «Your ad here» (${diff})`, { autoClose: 6000 });
      }
      prevNew.current = n;
    };
    check();
    const id = setInterval(check, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Opening the Requests tab clears the unseen badge baseline.
  useEffect(() => { if (tab === 'requests') prevNew.current = newRequests; }, [tab, newRequests]);

  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: '100%', padding: '28px 28px 48px' }} data-testid="advertising-page">
        <style>{`::selection{background:${T.accent};color:#fff}`}</style>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>Реклама</div>
          <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6, maxWidth: 760 }}>
            Единый рекламный движок: кампании, плейсменты (глобальные и локальные), креативы, реальная
            аналитика показов/кликов и прогнозирование по бюджету. Один source of truth для всей рекламы платформы.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${T.border}`, marginBottom: 24 }} role="tablist">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`ads-tab-${t.key}`} role="tab" aria-selected={tab === t.key}
              style={{ position: 'relative', padding: '11px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 700, border: 'none', background: 'transparent', color: tab === t.key ? T.accent : T.sub, borderBottom: `2px solid ${tab === t.key ? T.accent : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {t.label}
              {t.key === 'requests' && newRequests > 0 ? (
                <span data-testid="requests-badge" style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: T.bad, color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{newRequests}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div>
          {tab === 'overview' && <OverviewTab />}
          {tab === 'campaigns' && <CampaignsTab />}
          {tab === 'placements' && <PlacementsTab />}
          {tab === 'forecast' && <ForecastTab />}
          {tab === 'requests' && <RequestsTab />}
          {tab === 'promo' && <PromoBannerTab />}
        </div>
      </div>
    </Layout>
  );
};

export default AdvertisingPage;

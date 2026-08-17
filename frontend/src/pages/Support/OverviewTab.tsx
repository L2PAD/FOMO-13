import React, { useEffect, useState } from 'react';
import { trust, listAppeals } from '../../components/services/support';
import { T, card } from './ui';

const KPI: React.FC<{ label: string; value: any; tone?: string; onClick?: () => void }> = ({ label, value, tone, onClick }) => (
  <div onClick={onClick} data-testid={`kpi-${label}`} style={{ ...card, padding: 18, cursor: onClick ? 'pointer' : 'default', flex: '1 1 160px', minWidth: 150 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 800, color: tone || T.ink, marginTop: 8 }}>{value}</div>
  </div>
);

const OverviewTab: React.FC<{ onNavigate: (t: string) => void }> = ({ onNavigate }) => {
  const [a, setA] = useState<any>(null);
  const [disputes, setDisputes] = useState(0);
  useEffect(() => {
    (async () => {
      const r = await trust.analytics(false);
      setA(r.data || null);
      const d = await listAppeals('all', 1, 0);
      if (d.success) setDisputes(Number(d.data?.total || 0));
    })();
  }, []);
  const tk = a?.tickets || {}; const rp = a?.reports || {}; const md = a?.moderation || {};
  return (
    <div>
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 14 }}>Ключевые показатели (демо-данные исключены)</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPI label="Открытые тикеты" value={tk.open ?? 0} tone={T.warn} onClick={() => onNavigate('tickets')} />
        <KPI label="Решённые тикеты" value={tk.resolved ?? 0} tone={T.good} onClick={() => onNavigate('tickets')} />
        <KPI label="Всего жалоб" value={rp.total ?? 0} tone={T.bad} onClick={() => onNavigate('reports')} />
        <KPI label="Торговые споры" value={disputes} tone={T.accent} onClick={() => onNavigate('disputes')} />
        <KPI label="Кейсы модерации" value={md.total ?? 0} onClick={() => onNavigate('moderation')} />
      </div>
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Жалобы по типу объекта</div>
        {(rp.byTargetType || []).length === 0 ? <div style={{ color: T.faint, fontSize: 13 }}>Нет данных.</div> : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(rp.byTargetType || []).map((x: any) => (
              <div key={x._id} style={{ padding: '8px 14px', borderRadius: 10, background: T.soft, border: `1px solid ${T.border}`, fontSize: 13 }}>
                <b style={{ color: T.ink }}>{x._id}</b>: {x.count}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;

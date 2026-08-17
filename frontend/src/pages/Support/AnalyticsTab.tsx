import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { trust, seedDemoDisputes } from '../../components/services/support';
import { primaryBtn } from '../Advertising/ui';
import { T, card, th, td, Loader } from './ui';

const AnalyticsTab: React.FC = () => {
  const [includeDemo, setIncludeDemo] = useState(false);
  const [a, setA] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => { setLoading(true); const r = await trust.analytics(includeDemo); setA(r.data || null); setLoading(false); };
  useEffect(() => { load(); }, [includeDemo]);

  const seed = async () => { setBusy(true); const r = await trust.seedDemo(); await seedDemoDisputes(); setBusy(false); if (r.success) { toast.success('Демо-данные засеяны (тикеты, жалобы, кейсы, торговые споры)'); setIncludeDemo(true); load(); } else toast.error('Ошибка сидирования'); };

  if (loading) return <Loader />;
  const tk = a?.tickets || {}; const rp = a?.reports || {}; const md = a?.moderation || {};

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, color: T.ink, cursor: 'pointer' }}>
          <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} data-testid="analytics-demo-toggle" /> Включить демо-данные
        </label>
        <button onClick={seed} disabled={busy} style={primaryBtn} data-testid="analytics-seed-demo">{busy ? 'Сидирование…' : 'Засеять демо-кейсы'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          ['Тикеты всего', tk.total ?? 0], ['Открытые', tk.open ?? 0], ['Решённые', tk.resolved ?? 0],
          ['Жалобы всего', rp.total ?? 0], ['Кейсы модерации', md.total ?? 0],
        ].map(([l, v]) => (
          <div key={l as string} style={{ ...card, padding: 18 }} data-testid={`an-${l}`}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, textTransform: 'uppercase' }}>{l}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 800, color: T.faint, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, background: T.soft }}>Жалобы по типу объекта</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Тип объекта</th><th style={th}>Количество</th></tr></thead>
          <tbody>
            {(rp.byTargetType || []).length === 0 ? <tr><td style={td} colSpan={2}>Нет данных.</td></tr> :
              (rp.byTargetType || []).map((x: any) => <tr key={x._id}><td style={td}><b>{x._id}</b></td><td style={td}>{x.count}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsTab;

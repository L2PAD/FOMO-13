import React, { useCallback, useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { T, KpiCard, KpiGrid, Card, SimpleTable, Badge, StateBlock, Column } from '../Statistics/ui';
import { analyticsOverview } from '../../components/services/advertising';
import { money, num } from './ui';

const axisStyle = { fontSize: 11, fill: T.faint } as const;
const PERIODS = [{ d: 7, label: '7 дней' }, { d: 30, label: '30 дней' }, { d: 90, label: '90 дней' }];

const OverviewTab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);
  const [includeDemo, setIncludeDemo] = useState(false);

  const load = useCallback(async (d: number, demo: boolean) => {
    setLoading(true); setError(false);
    const r = await analyticsOverview(d, demo);
    if (r.success) setData(r.data); else setError(true);
    setLoading(false);
  }, []);
  useEffect(() => { load(days, includeDemo); }, [days, includeDemo, load]);

  const placementCols: Column<any>[] = [
    { key: 'name', header: 'Плейсмент', render: (r) => <span style={{ fontWeight: 700, color: T.ink }}>{r.name}</span> },
    { key: 'viewable', header: 'Viewable', align: 'right', render: (r) => num(r.viewable) },
    { key: 'clicks', header: 'Клики', align: 'right', render: (r) => num(r.clicks) },
    { key: 'ctr', header: 'CTR', align: 'right', render: (r) => `${r.ctr}%` },
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }} data-testid="ads-overview">
      {/* Header with period filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>Дашборд рекламы</div>
          <div style={{ fontSize: 12.5, color: T.sub }}>{includeDemo ? 'Включены демо-баннеры разделов (для предпросмотра отчёта)' : 'Сводка по всем кампаниям за выбранный период (демо исключены)'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setIncludeDemo((v) => !v)} data-testid="overview-demo-toggle" aria-pressed={includeDemo}
            title="Показать данные по демо-баннерам разделов (по умолчанию исключены из продакшн-метрик)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, border: `1px solid ${includeDemo ? T.accent : T.border}`, background: includeDemo ? T.accent : '#fff', color: includeDemo ? '#fff' : T.sub, transition: 'background 150ms ease' }}>
            {includeDemo ? 'Демо: включено' : 'Демо: выключено'}
          </button>
          <div style={{ display: 'inline-flex', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: 3 }} data-testid="overview-period">
            {PERIODS.map((p) => (
              <button key={p.d} onClick={() => setDays(p.d)} data-testid={`period-${p.d}`}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: days === p.d ? T.accent : 'transparent', color: days === p.d ? '#fff' : T.sub, transition: 'background 150ms ease' }}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <Card><StateBlock kind="loading" /></Card> : error || !data ? <Card><StateBlock kind="error" message="Не удалось загрузить обзор" onRetry={() => load(days, includeDemo)} /></Card> : (
        <>
          <KpiGrid min={168}>
            <KpiCard label="Активные кампании" value={data.lifecycle.active} hint={`Всего: ${data.lifecycle.total}`} testId="kpi-active" />
            <KpiCard label="Показы (viewable)" value={num(data.totals.viewable)} hint={`Загружено: ${num(data.totals.impressions)}`} />
            <KpiCard label="Уник. охват" value={num(data.totals.uniqueSessions)} />
            <KpiCard label="Клики / переходы" value={num(data.totals.clicks)} tone="good" />
            <KpiCard label="CTR" value={`${data.totals.ctr}%`} />
            <KpiCard label="Расход" value={money(data.totals.spend)} hint={`Бюджет: ${money(data.totals.totalBudget)}`} />
            <KpiCard label="CPM" value={money(data.totals.cpm)} hint="за 1000 видимых" />
            <KpiCard label="CPC" value={money(data.totals.cpc)} hint="за клик" />
            <KpiCard label="Viewability" value={`${data.totals.viewability}%`} />
          </KpiGrid>

          <Card>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Динамика ({days} дней)</div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>Показы, видимые показы и клики по дням</div>
            {(!data.series || data.series.length === 0) ? (
              <StateBlock kind="empty" message="Пока нет событий показа. Данные появятся после первых показов на сайте." height={80} />
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ovImpr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity={0.35} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} /></linearGradient>
                      <linearGradient id="ovView" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0F9D8C" stopOpacity={0.3} /><stop offset="100%" stopColor="#0F9D8C" stopOpacity={0.02} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.soft} vertical={false} />
                    <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={{ stroke: T.border }} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
                    <RTooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="impressions" name="Показы" stroke="#4F46E5" fill="url(#ovImpr)" strokeWidth={2} dot={{ r: 3 }} />
                    <Area type="monotone" dataKey="viewable" name="Видимые" stroke="#0F9D8C" fill="url(#ovView)" strokeWidth={2} dot={{ r: 3 }} />
                    <Area type="monotone" dataKey="clicks" name="Клики" stroke="#B45309" fill="transparent" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18 }}>
            <Card style={{ padding: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, padding: '10px 12px 4px' }}>Лучшие плейсменты</div>
              <SimpleTable columns={placementCols} rows={data.placements} empty="Нет данных" />
            </Card>
            <Card>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 12 }}>Эффективность кампаний</div>
              <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 8, fontWeight: 700 }}>Лучшие по CTR</div>
              {data.best.length ? data.best.map((c: any) => (
                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.soft}` }}>
                  <span style={{ fontSize: 13, color: T.ink }}>{c.name}</span>
                  <Badge tone="good">{c.ctr}% CTR</Badge>
                </div>
              )) : <StateBlock kind="empty" message="Недостаточно данных" height={50} />}
              {data.worst.length ? (<>
                <div style={{ fontSize: 12.5, color: T.sub, margin: '14px 0 8px', fontWeight: 700 }}>Требуют внимания</div>
                {data.worst.map((c: any) => (
                  <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.soft}` }}>
                    <span style={{ fontSize: 13, color: T.ink }}>{c.name}</span>
                    <Badge tone="warn">{c.ctr}% CTR</Badge>
                  </div>
                ))}
              </>) : null}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewTab;

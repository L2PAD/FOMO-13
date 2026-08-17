import React, { useEffect, useState } from 'react';
import { T, Card, KpiCard, KpiGrid, StateBlock, Badge } from '../Statistics/ui';
import { listPlacements, forecast, AdPlacement } from '../../components/services/advertising';
import OptionSelect from './OptionSelect';
import { field, label, primaryBtn, num, money } from './ui';

const ForecastTab: React.FC = () => {
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [form, setForm] = useState({ placement: '', pricingModel: 'cpm', rate: 8, budget: 500, days: 14 });
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { (async () => { const r = await listPlacements(); if (r.success) { setPlacements(r.data); if (r.data[0]) setForm((f) => ({ ...f, placement: r.data[0].code })); } })(); }, []);

  const run = async () => {
    if (!form.placement) return;
    setBusy(true);
    const r = await forecast({ ...form, rate: Number(form.rate), budget: Number(form.budget), days: Number(form.days) });
    setResult(r.success ? r.data : { error: true });
    setBusy(false);
  };

  const Range: React.FC<{ title: string; r: any }> = ({ title, r }) => (
    <Card>
      <div style={{ fontSize: 12.5, color: T.sub, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: T.ink }}>{num(r.expected)}</div>
      <div style={{ fontSize: 12, color: T.faint, marginTop: 4 }}>диапазон {num(r.low)} – {num(r.high)}</div>
    </Card>
  );

  return (
    <div style={{ display: 'grid', gap: 18 }} data-testid="ads-forecast">
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Прогноз эффективности (Forecast)</div>
        <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 16 }}>Оценка по реальной истории плейсмента. Это Forecast / Expected performance, не гарантия. Настоящий ROI появится при подключённой атрибуции конверсий.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, alignItems: 'end' }}>
          <div data-testid="fc-placement"><OptionSelect label="Плейсмент" value={form.placement} onChange={(v) => setForm({ ...form, placement: v })} options={placements.map((p) => ({ value: p.code, label: p.adminName }))} /></div>
          <div><OptionSelect label="Модель" value={form.pricingModel} onChange={(v) => setForm({ ...form, pricingModel: v })} options={[{ value: 'cpm', label: 'CPM' }, { value: 'cpc', label: 'CPC' }, { value: 'fixed', label: 'Fixed' }]} /></div>
          <div><label style={label}>Ставка ($)</label><input type="number" style={field} value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} /></div>
          <div><label style={label}>Бюджет ($)</label><input type="number" style={field} value={form.budget} data-testid="fc-budget" onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></div>
          <div><label style={label}>Период (дней)</label><input type="number" style={field} value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} /></div>
          <button style={primaryBtn} onClick={run} disabled={busy} data-testid="fc-run">{busy ? 'Считаю…' : 'Рассчитать'}</button>
        </div>
      </Card>

      {result?.error ? <Card><StateBlock kind="error" message="Ошибка расчёта" /></Card> : null}
      {result && !result.error ? (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge tone={result.usingBaseline ? 'warn' : 'good'}>{result.usingBaseline ? 'Baseline-оценка' : 'Реальная история'}</Badge>
            <span style={{ fontSize: 13, color: T.sub }}>{result.note}</span>
          </div>
          <KpiGrid min={180}>
            <Range title="Ожидаемые показы" r={result.expectedImpressions} />
            <Range title="Уникальный охват" r={result.uniqueReach} />
            <Range title="Ожидаемые клики" r={result.expectedClicks} />
          </KpiGrid>
          <KpiGrid min={160}>
            <KpiCard label="Прогноз CTR" value={`${result.ctr}%`} />
            <KpiCard label="Оц. CPC" value={money(result.estCpc)} />
            <KpiCard label="Оц. CPM" value={money(result.estCpm)} />
            <KpiCard label="Инвентарь за период" value={num(result.inventoryOverPeriod)} />
          </KpiGrid>
        </>
      ) : null}
    </div>
  );
};

export default ForecastTab;

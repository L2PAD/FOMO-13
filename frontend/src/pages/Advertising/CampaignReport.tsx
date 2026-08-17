import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { toast } from 'react-toastify';
import { T, Card, KpiCard, KpiGrid, StateBlock, SectionTitle } from '../Statistics/ui';
import { analyticsCampaign } from '../../components/services/advertising';

const money = (n: number) => '$' + Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const num = (n: number) => Number(n || 0).toLocaleString('ru-RU');
const DEVICE_COLORS = ['#4F46E5', '#0F9D8C', '#B45309', '#94A3B8'];
const AB_COLORS = ['#4F46E5', '#0F9D8C', '#B45309', '#0EA5E9', '#9333EA', '#DB2777'];

const axisStyle = { fontSize: 11, fill: T.faint } as const;

const CampaignReport: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const r = await analyticsCampaign(campaignId);
    if (r.success) setData(r.data); else setError(true);
    setLoading(false);
  }, [campaignId]);
  useEffect(() => { load(); }, [load]);

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, jspdfMod] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const jsPDF = (jspdfMod as any).jsPDF || (jspdfMod as any).default;
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const img = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const imgW = pw;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= ph;
      while (heightLeft > 0) {
        position -= ph;
        pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
        heightLeft -= ph;
      }
      const name = (data?.campaign?.name || 'campaign').replace(/[^a-zA-Zа-яА-Я0-9_-]+/g, '_');
      pdf.save(`report_${name}.pdf`);
      toast.success('Отчёт сохранён в PDF');
    } catch (e) {
      toast.error('Не удалось сформировать PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error || !data) return <Card><StateBlock kind="error" message="Не удалось загрузить отчёт по кампании" onRetry={load} /></Card>;

  const t = data.totals || {};
  const series = data.series || [];
  const devices = data.devices || [];
  const funnel = data.funnel || [];
  const placements = data.placements || [];
  const creatives = data.creatives || [];
  const countries = data.countries || [];

  return (
    <div style={{ display: 'grid', gap: 16 }} data-testid="campaign-report">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Отчёт по кампании</div>
        <button onClick={exportPdf} disabled={exporting || !data.hasData} data-testid="report-export-pdf"
          style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: data.hasData ? T.accent : T.border, color: '#fff', fontWeight: 700, fontSize: 13, cursor: data.hasData ? 'pointer' : 'not-allowed' }}>
          {exporting ? 'Формирую PDF…' : 'Скачать PDF'}
        </button>
      </div>

      <div ref={reportRef} style={{ display: 'grid', gap: 16, background: T.pageBg, padding: 2 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{data.campaign?.name || 'Кампания'} <span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>· {data.campaign?.advertiserName || '—'}</span></div>

      {!data.hasData ? (
        <Card><StateBlock kind="empty" message="Пока нет собранных событий по этой кампании. Данные появятся после первых показов на сайте." height={80} /></Card>
      ) : (
        <></>
      )}
      {data.hasData ? (
        <>
          <KpiGrid min={150}>
            <KpiCard label="Показы" value={num(t.impressions)} testId="rep-impr" />
            <KpiCard label="Видимые показы" value={num(t.viewable)} hint={`Viewability ${t.viewability || 0}%`} />
            <KpiCard label="Клики / переходы" value={num(t.clicks)} tone="good" testId="rep-clicks" />
            <KpiCard label="CTR" value={`${t.ctr || 0}%`} />
            <KpiCard label="Конверсии" value={num(t.conversions)} tone="good" />
            <KpiCard label="Конверсия (CR)" value={`${t.conversionRate || 0}%`} hint={t.costPerConversion ? `${money(t.costPerConversion)} / конв.` : undefined} />
            <KpiCard label="Расход" value={money(t.spend)} hint={`Бюджет ${money(t.budget)}`} />
            <KpiCard label="CPC / CPM" value={`${money(t.cpc)} / ${money(t.cpm)}`} />
          </KpiGrid>

          {/* Impressions vs clicks over time */}
          <Card>
            <SectionTitle sub="Показы, видимые показы и клики по дням">Динамика показов и кликов</SectionTitle>
            <div style={{ height: 260, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gImpr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gView" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F9D8C" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0F9D8C" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.soft} vertical={false} />
                  <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={{ stroke: T.border }} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
                  <RTooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="impressions" name="Показы" stroke="#4F46E5" fill="url(#gImpr)" strokeWidth={2} />
                  <Area type="monotone" dataKey="viewable" name="Видимые" stroke="#0F9D8C" fill="url(#gView)" strokeWidth={2} />
                  <Area type="monotone" dataKey="clicks" name="Клики" stroke="#B45309" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {/* Spend per day */}
            <Card>
              <SectionTitle sub="Списание бюджета по дням">Расход бюджета</SectionTitle>
              <div style={{ height: 220, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.soft} vertical={false} />
                    <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={{ stroke: T.border }} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
                    <RTooltip formatter={(v: any) => money(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <Bar dataKey="spend" name="Расход" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Device split */}
            <Card>
              <SectionTitle sub="Видимые показы по устройствам">Устройства</SectionTitle>
              <div style={{ height: 220, marginTop: 8 }}>
                {devices.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={devices} dataKey="viewable" nameKey="device" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={2}>
                        {devices.map((_: any, i: number) => <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <StateBlock kind="empty" message="Нет данных по устройствам" height={60} />}
              </div>
            </Card>
          </div>

          {/* Funnel */}
          <Card>
            <SectionTitle sub="Путь от показа до конверсии">Воронка</SectionTitle>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {funnel.map((f: any, i: number) => {
                const max = funnel[0]?.value || 1;
                const pct = max > 0 ? Math.max(2, Math.round((f.value / max) * 100)) : 0;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 96, fontSize: 12.5, color: T.sub, fontWeight: 700, flexShrink: 0 }}>{f.step}</div>
                    <div style={{ flex: 1, background: T.soft, borderRadius: 8, overflow: 'hidden', height: 26 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${T.accent}, ${T.good})`, borderRadius: 8, transition: 'width 250ms ease' }} />
                    </div>
                    <div style={{ width: 72, textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.ink, flexShrink: 0 }}>{num(f.value)}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Geo breakdown */}
          <Card>
            <SectionTitle sub="Из каких стран приходят показы и клики (по данным ingress; неизвестные — отдельно)">География</SectionTitle>
            {countries.length ? (
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} data-testid="geo-report-table">
                  <thead>
                    <tr>
                      {['Страна', 'Видимые', 'Уник. охват', 'Клики', 'CTR', 'Расход'].map((h, i) => (
                        <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 12px', color: T.sub, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {countries.map((c: any) => (
                      <tr key={c.country}>
                        <td style={{ padding: '9px 12px', color: T.ink, borderBottom: `1px solid ${T.soft}`, fontWeight: 700 }}>{c.country === 'unknown' ? 'Неизвестно' : c.country}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(c.viewable)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(c.uniqueReach)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(c.clicks)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{c.ctr}%</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{money(c.spend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <StateBlock kind="empty" message="Пока нет геоданных по кликам/показам" height={50} />}
          </Card>

          {/* Per placement */}
          {placements.length > 1 ? (
            <Card>
              <SectionTitle sub="Где креатив заходит лучше — CTR по площадкам, чтобы перераспределять показы">A/B по площадкам</SectionTitle>
              <div style={{ height: 210, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={placements.map((p: any) => ({ name: (p.name || p.code || '').slice(0, 20), ctr: p.ctr }))} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.soft} vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: T.border }} interval={0} angle={-12} textAnchor="end" height={50} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} unit="%" />
                    <RTooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <Bar dataKey="ctr" name="CTR" radius={[6, 6, 0, 0]}>
                      {placements.map((_: any, i: number) => <Cell key={i} fill={AB_COLORS[i % AB_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} data-testid="placements-report-table">
                  <thead>
                    <tr>
                      {['Плейсмент', 'Видимые', 'Клики', 'CTR', 'Конверсии', 'Расход'].map((h, i) => (
                        <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 12px', color: T.sub, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {placements.map((p: any) => (
                      <tr key={p.code}>
                        <td style={{ padding: '9px 12px', color: T.ink, borderBottom: `1px solid ${T.soft}` }}>{p.name}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(p.viewable)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(p.clicks)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{p.ctr}%</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(p.conversions)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{money(p.spend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {creatives.length ? (
            <Card>
              <SectionTitle sub="Сравнение эффективности разных креативов кампании (A/B)">A/B креативов</SectionTitle>
              <div style={{ height: 240, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creatives.map((c: any, i: number) => ({ name: (c.label || '').slice(0, 22), ctr: c.ctr, _i: i }))} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.soft} vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: T.border }} interval={0} angle={-12} textAnchor="end" height={50} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} unit="%" />
                    <RTooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <Bar dataKey="ctr" name="CTR" radius={[6, 6, 0, 0]}>
                      {creatives.map((_: any, i: number) => <Cell key={i} fill={AB_COLORS[i % AB_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ overflowX: 'auto', marginTop: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} data-testid="ab-creatives-table">
                  <thead>
                    <tr>
                      {['Креатив', 'Вариант', 'Размер', 'Видимые', 'Клики', 'CTR', 'Конв.', 'CR', 'Расход'].map((h, i) => (
                        <th key={h} style={{ textAlign: i < 3 ? 'left' : 'right', padding: '8px 10px', color: T.sub, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {creatives.map((c: any, i: number) => {
                      const best = i === 0 && creatives.length > 1;
                      return (
                        <tr key={c.creativeId}>
                          <td style={{ padding: '9px 10px', color: T.ink, borderBottom: `1px solid ${T.soft}`, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: AB_COLORS[i % AB_COLORS.length], marginRight: 8 }} />
                            {c.label}{best ? <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 800, color: T.good, background: '#E7F6F3', padding: '2px 6px', borderRadius: 999 }}>Лидер</span> : null}
                          </td>
                          <td style={{ padding: '9px 10px', color: T.sub, borderBottom: `1px solid ${T.soft}` }}>{c.variant || '—'}</td>
                          <td style={{ padding: '9px 10px', color: T.sub, borderBottom: `1px solid ${T.soft}` }}>{c.displaySize === 'compact' ? 'Компакт' : 'Стандарт'}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(c.viewable)}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(c.clicks)}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: T.ink, borderBottom: `1px solid ${T.soft}` }}>{c.ctr}%</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{num(c.conversions)}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{c.cr}%</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: `1px solid ${T.soft}` }}>{money(c.spend)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
      </div>
    </div>
  );
};

export default CampaignReport;

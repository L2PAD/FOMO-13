import React from 'react';
import { T } from '../Statistics/ui';

const PALETTE = ['#2E7D5B', '#B0553E', '#7A2E86', '#3AA6A6', '#1E3A8A', '#8A8A2E', '#4F46E5'];
const money = (v: any, d = 2) => `$${(Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

/* Пончиковая диаграмма распределения средств (стиль как на сайте FOMO). */
export const Donut: React.FC<{ data: { label: string; value: number }[]; centerLabel?: string; centerValue?: string }> = ({ data, centerLabel, centerValue }) => {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
  const R = 90, r = 58, cx = 110, cy = 110; let acc = 0;
  const arc = (start: number, end: number) => {
    const a0 = (start / total) * 2 * Math.PI - Math.PI / 2, a1 = (end / total) * 2 * Math.PI - Math.PI / 2;
    const large = end - start > total / 2 ? 1 : 0;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1), xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
    return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi0} ${yi0} Z`;
  };
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={220} height={220} viewBox="0 0 220 220">
        {data.map((d, i) => { const s = acc; acc += Number(d.value) || 0; return <path key={i} d={arc(s, acc)} fill={PALETTE[i % PALETTE.length]} />; })}
        {centerValue ? <text x={cx} y={cy - 4} textAnchor="middle" fontSize="24" fontWeight="800" fill={T.ink}>{centerValue}</text> : null}
        {centerLabel ? <text x={cx} y={cy + 18} textAnchor="middle" fontSize="12" fill={T.sub}>{centerLabel}</text> : null}
      </svg>
      <div style={{ display: 'grid', gap: 8, minWidth: 200 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: PALETTE[i % PALETTE.length], flex: '0 0 auto' }} />
            <span style={{ fontSize: 13, color: T.ink, fontWeight: 600, flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: 13, color: T.sub }}>{money(d.value)} · {Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Линейно-областной график динамики (депозиты vs выводы), реальные точки. */
export const TrendChart: React.FC<{ series: any[]; keys: { key: string; label: string; color: string }[]; height?: number }> = ({ series, keys, height = 240 }) => {
  const W = 900, H = height, padL = 44, padB = 26, padT = 12, padR = 12;
  const n = series.length || 1;
  const maxV = Math.max(1, ...series.flatMap((s) => keys.map((k) => Number(s[k.key]) || 0)));
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, n - 1);
  const y = (v: number) => H - padB - ((Number(v) || 0) / maxV) * (H - padB - padT);
  const line = (k: string) => series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s[k])}`).join(' ');
  const area = (k: string) => `${line(k)} L ${x(n - 1)} ${H - padB} L ${x(0)} ${H - padB} Z`;
  const yticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxV);
  const fmt = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(v < 10 ? 1 : 0)}`);
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        {keys.map((k) => <span key={k.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: T.ink, fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: k.color }} />{k.label}</span>)}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 620 }} preserveAspectRatio="none">
          {yticks.map((t, i) => (
            <g key={i}><line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke={T.border} strokeDasharray="3 4" /><text x={padL - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill={T.sub}>{fmt(t)}</text></g>
          ))}
          {keys.map((k) => (
            <g key={k.key}>
              <defs><linearGradient id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={k.color} stopOpacity="0.22" /><stop offset="100%" stopColor={k.color} stopOpacity="0" /></linearGradient></defs>
              <path d={area(k.key)} fill={`url(#g-${k.key})`} />
              <path d={line(k.key)} fill="none" stroke={k.color} strokeWidth={2.4} strokeLinejoin="round" />
            </g>
          ))}
          {series.map((s, i) => (i % Math.ceil(n / 8) === 0 || i === n - 1) ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill={T.sub}>{String(s.date).slice(5)}</text> : null)}
        </svg>
      </div>
    </div>
  );
};

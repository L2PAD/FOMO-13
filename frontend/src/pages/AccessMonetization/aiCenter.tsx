import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { T, PageHeader } from '../Statistics/ui';
import * as api from './service';
import { card, label, input, btn, th, td } from './parts';
import { capName } from './labels';
import { AdminSelect } from '../AdminRating/AdminControls';

const badge = (bg: string, color: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: bg, color });
const keySmall: React.CSSProperties = { fontSize: 11, color: T.sub, fontFamily: 'monospace' };
const usd = (v: any, d = 4) => (v === null || v === undefined ? '—' : `$${Number(v).toFixed(d)}`);
const int = (v: any) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('ru-RU'));
const dt = (v?: string | null) => (v ? new Date(v).toLocaleString('ru-RU') : '—');

const modeBadge = (m: string) => {
  const c: any = { FIXED: ['#DBEAFE', '#1D4ED8'], COST_BASED: ['#DCFCE7', '#15803D'], HYBRID: ['#EDE9FE', '#6D28D9'] }[m] || ['#F1F5F9', '#64748B'];
  return <span style={badge(c[0], c[1])}>{m}</span>;
};
const ctxBadge = (c: string) => {
  const m: any = { USER: ['#DBEAFE', '#1D4ED8'], INTERNAL: ['#FEF3C7', '#B45309'], SYSTEM: ['#F1F5F9', '#64748B'] }[c] || ['#F1F5F9', '#64748B'];
  return <span style={badge(m[0], m[1])}>{c}</span>;
};
const modeLabel: Record<string, string> = { USER: 'Пользовательский (списывает кредиты)', INTERNAL: 'Внутренний (только COGS)', SYSTEM: 'Системный' };

const SUB_TABS = [
  { key: 'dashboard', label: 'Дашборд' },
  { key: 'rules', label: 'Правила' },
  { key: 'usage', label: 'Использование' },
  { key: 'economics', label: 'Экономика' },
  { key: 'credentials', label: 'Ключи' },
  { key: 'finance', label: 'Финансы' },
  { key: 'knowledge', label: 'Знания' },
  { key: 'users', label: 'Пользователи' },
  { key: 'models', label: 'Модели' },
];

const PRICING_HEALTH: Record<string, [string, string, string]> = {
  HEALTHY: ['#D1FAE5', '#059669', 'В норме'],
  BELOW_TARGET: ['#FEE2E2', '#DC2626', 'Ниже цели'],
  UNPRICED: ['#FEF3C7', '#B45309', 'Без цены'],
  INSUFFICIENT_SAMPLE: ['#F1F5F9', '#64748B', 'Мало данных'],
};
const healthBadge = (s: string) => { const c = PRICING_HEALTH[s] || ['#F1F5F9', '#64748B', s]; return <span style={badge(c[0], c[1])}>{c[2]}</span>; };

const PROVIDER_STATUS: Record<string, [string, string]> = {
  READY: ['#D1FAE5', '#059669'],
  CREDENTIALS_MISSING: ['#FEF3C7', '#B45309'],
  PROVIDER_BALANCE_EMPTY: ['#FEE2E2', '#DC2626'],
  UNREACHABLE: ['#FEE2E2', '#DC2626'],
  DISABLED: ['#F1F5F9', '#64748B'],
};
const provStatusBadge = (s: string) => { const c = PROVIDER_STATUS[s] || ['#F1F5F9', '#64748B']; return <span style={badge(c[0], c[1])}>{s}</span>; };
const pct = (v: any) => (v === null || v === undefined ? '—' : `${(Number(v) * 100).toFixed(1)}%`);
const miniBtn: React.CSSProperties = { border: `1px solid ${T.border}`, background: '#fff', color: T.ink, fontWeight: 600, fontSize: 11.5, padding: '4px 9px', borderRadius: 8, cursor: 'pointer' };

const KN_STATUS: Record<string, [string, string, string]> = {
  ok: ['#D1FAE5', '#059669', 'Подключено'],
  empty: ['#FEF3C7', '#B45309', 'Пусто'],
  not_connected: ['#FEE2E2', '#DC2626', 'Не подключено'],
  access_denied: ['#F1F5F9', '#64748B', 'Приватный'],
  error: ['#FEE2E2', '#DC2626', 'Ошибка'],
};
const knStatusBadge = (s: string) => { const c = KN_STATUS[s] || ['#F1F5F9', '#64748B', s]; return <span style={badge(c[0], c[1])}>{c[2]}</span>; };
const freshBadge = (f: any) => {
  const st = f?.status || 'unknown';
  const c: any = { fresh: ['#D1FAE5', '#059669'], stale: ['#FEF3C7', '#B45309'], empty: ['#F1F5F9', '#64748B'], unknown: ['#F1F5F9', '#64748B'] }[st] || ['#F1F5F9', '#64748B'];
  return <span style={badge(c[0], c[1])}>{st}</span>;
};

const OPERATIONS = [
  { key: 'ask_fomo', label: 'Ask FOMO' },
  { key: 'token_analysis', label: 'Analyze Project' },
  { key: 'compare_projects', label: 'Compare Projects' },
  { key: 'market_brief', label: 'Market Brief' },
  { key: 'portfolio_analysis', label: 'Portfolio Review' },
  { key: 'deep_research', label: 'Deep Research' },
];

/* ================= ПРАВИЛА ================= */
/* Table header with a Russian hover tooltip (info glyph + dotted underline). */
const ThTip: React.FC<{ label: string; tip: string }> = ({ label, tip }) => (
  <th style={th}>
    <span
      title={tip}
      data-testid={`th-tip-${label}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'help', borderBottom: '1px dotted #94A3B8', paddingBottom: 1 }}
    >
      {label}
      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid #94A3B8', color: '#64748B', fontSize: 9, fontWeight: 800, lineHeight: 1 }}>i</span>
    </span>
  </th>
);

const RulesSub: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  useEffect(() => { api.getCreditRules().then((r) => setRules(r.items || [])); }, []);
  return (
    <div>
      <div style={{ ...card, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
        <div style={{ fontSize: 13, color: '#3730A3', fontWeight: 600 }}>Кредиты и доступ — <b>две разные проверки</b>. Порядок каждого запроса: <b>доступ → estimate → reserve → провайдер → usage → cost → capture/release</b>. Кредиты (1/2/4/…) — это временный user-facing слой; реальная экономика считается из провайдерской себестоимости.</div>
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>AI-операции и правила ценообразования</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead><tr>
              <ThTip label="Операция" tip="Тип AI-запроса (operation code): напр. Ask FOMO, Deep Research, Analyze Project. У каждой операции своя политика цены, модель и лимиты кредитов." />
              <ThTip label="Контекст" tip="Кто платит. USER — публичный запрос, списывает кредиты пользователя. INTERNAL — админ-чат / внутренние задачи: кредиты пользователя не списываются, но провайдерская себестоимость (COGS) всё равно считается." />
              <ThTip label="Доступ" tip="Capability, которую проверяет AccessResolver ДО запроса. Нет доступа (например, нет активной FOMO AI подписки) — провайдер не вызывается и кредиты не резервируются." />
              <ThTip label="Режим" tip="Модель ценообразования. FIXED — фиксированное число кредитов. COST_BASED — кредиты только из реальной себестоимости. HYBRID — база + переменная часть от реальной стоимости." />
              <ThTip label="Base / Fixed" tip="Base — базовое число кредитов для HYBRID (стартовая часть). Fixed — фиксированное число кредитов для режима FIXED." />
              <ThTip label="Markup ×" tip="Legacy-множитель наценки (устаревший способ). Теперь основная маржа задаётся на уровне продукта: цена подписки → целевая маржа → допустимая себестоимость кредита (вкладка «Экономика»)." />
              <ThTip label="Safety" tip="Коэффициент запаса (1.05–1.20) на разброс токенов/стоимости. Это НЕ второй множитель прибыли — только буфер против вариативности. CreditsCharged = ceil(реальная стоимость × safety / MaxCostPerCredit)." />
              <ThTip label="Min / Max" tip="Границы списания за один запрос: не меньше Min и не больше Max кредитов, даже если формула даёт другое значение (clamp)." />
              <ThTip label="Модель-класс" tip="Класс модели/политика выбора LLM для операции (напр. лёгкая для Ask FOMO, мощная для Deep Research). Конкретная модель и её цены — во вкладке «Модели»." />
            </tr></thead>
            <tbody>{rules.map((r) => (
              <tr key={r.operationType}>
                <td style={td}><b>{r.name}</b><div style={keySmall}>{r.operationType}</div></td>
                <td style={td}>{ctxBadge(r.billingContext || 'USER')}</td>
                <td style={td}>{r.capabilityRequired ? capName(r.capabilityRequired) : '—'}</td>
                <td style={td}>{modeBadge(r.pricingMode || 'HYBRID')}</td>
                <td style={td}>{r.baseCredits} / {r.fixedCredits ?? r.baseCredits} cr</td>
                <td style={td}>{r.targetMarkup ?? 2}×</td>
                <td style={td}>{r.safetyFactor ?? 1.2}</td>
                <td style={td}>{r.minCredits ?? 1} / {r.maxCredits ?? 50}</td>
                <td style={td}>{r.modelClass}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ fontSize: 12.5, color: T.sub, marginTop: 10 }}>HYBRID = baseCredits + переменная часть (ceil(себестоимость×safety / maxCostPerCredit)), с ограничением [min, max]. Внутренние операции (INTERNAL) не списывают пользовательские кредиты, но их провайдерская себестоимость учитывается как COGS.</div>
      </div>
    </div>
  );
};

/* ================= ИСПОЛЬЗОВАНИЕ ================= */
const KpiCard: React.FC<{ title: string; value: string; sub?: string; testId?: string }> = ({ title, value, sub, testId }) => (
  <div style={{ ...card, marginBottom: 0, padding: 14 }} data-testid={testId}>
    <div style={{ fontSize: 12, color: T.sub, fontWeight: 700 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginTop: 4 }}>{value}</div>
    {sub ? <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>{sub}</div> : null}
  </div>
);

const UsageSub: React.FC = () => {
  const [sum, setSum] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api.getAiUsageSummary(30), api.getAiUsage(undefined, 50)])
      .then(([s, e]) => { setSum(s); setEvents(e.items || []); })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div style={card}><div style={{ color: T.sub }}>Загрузка…</div></div>;
  const buckets: any[] = sum?.buckets || [];
  const agg = buckets.reduce((a, b) => ({
    requests: a.requests + b.requests,
    user: a.user + (b.billingContext === 'USER' ? b.requests : 0),
    internal: a.internal + (b.billingContext === 'INTERNAL' ? b.requests : 0),
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    credits: a.credits + b.creditsCaptured,
    latency: Math.max(a.latency, b.avgLatencyMs || 0),
  }), { requests: 0, user: 0, internal: 0, inputTokens: 0, outputTokens: 0, credits: 0, latency: 0 });
  const avgCredits = agg.user ? (agg.credits / agg.user).toFixed(2) : '0';
  return (
    <div>
      {!sum?.hasRealData ? (
        <div style={{ ...card, background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <div style={{ fontSize: 13, color: '#9A3412', fontWeight: 600 }}>Реальный ключ провайдера не подключён — запросы выполняются в <b>mock-режиме</b> (dataMode = mock). Реальные метрики себестоимости пока отсутствуют; mock-данные никогда не смешиваются с реальной аналитикой.</div>
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        <KpiCard title="Запросов (30д)" value={int(agg.requests)} />
        <KpiCard title="Пользовательских" value={int(agg.user)} />
        <KpiCard title="Внутренних" value={int(agg.internal)} />
        <KpiCard title="Input токенов" value={int(agg.inputTokens)} />
        <KpiCard title="Output токенов" value={int(agg.outputTokens)} />
        <KpiCard title="Кредитов списано" value={int(agg.credits)} />
        <KpiCard title="Ср. кредитов/запрос" value={avgCredits} />
        <KpiCard title="Latency (max avg)" value={`${int(agg.latency)} ms`} />
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Разрез по режиму данных и контексту</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead><tr><th style={th}>Data mode</th><th style={th}>Контекст</th><th style={th}>Запросов</th><th style={th}>Польз.</th><th style={th}>Кредиты</th><th style={th}>Provider COGS</th></tr></thead>
          <tbody>{buckets.length ? buckets.map((b, i) => (
            <tr key={i}>
              <td style={td}>{b.dataMode === 'real' ? <span style={badge('#D1FAE5', '#059669')}>real</span> : <span style={badge('#FEF3C7', '#B45309')}>mock</span>}</td>
              <td style={td}>{ctxBadge(b.billingContext)}</td>
              <td style={td}>{int(b.requests)}</td>
              <td style={td}>{int(b.uniqueUsers)}</td>
              <td style={td}>{int(b.creditsCaptured)}</td>
              <td style={td}>{usd(b.providerCostUsd, 4)}</td>
            </tr>
          )) : <tr><td style={td} colSpan={6}>Нет завершённых событий за период.</td></tr>}</tbody>
        </table>
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Последние AI-события</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
            <thead><tr><th style={th}>Время</th><th style={th}>Операция</th><th style={th}>Контекст</th><th style={th}>Модель</th><th style={th}>Токены (in/out)</th><th style={th}>Cost</th><th style={th}>Credits</th><th style={th}>Статус</th></tr></thead>
            <tbody>{events.length ? events.map((e) => (
              <tr key={e._id}>
                <td style={td}>{dt(e.createdAt)}</td>
                <td style={td}>{e.operationType}</td>
                <td style={td}>{ctxBadge(e.billingContext)}</td>
                <td style={td}>{e.model}{e.dataMode === 'mock' ? <span style={{ ...badge('#FEF3C7', '#B45309'), marginLeft: 6 }}>mock</span> : null}</td>
                <td style={td}>{int(e.inputTokens)} / {int(e.outputTokens)}</td>
                <td style={td}>{usd(e.providerCostUsd, 5)}<div style={keySmall}>{e.costStatus}</div></td>
                <td style={td}>{int(e.creditsCaptured)}</td>
                <td style={td}>{e.status === 'COMPLETED' ? <span style={badge('#D1FAE5', '#059669')}>OK</span> : <span style={badge('#FEE2E2', '#DC2626')}>{e.status}</span>}</td>
              </tr>
            )) : <tr><td style={td} colSpan={8}>Событий пока нет.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ================= ЭКОНОМИКА ================= */
const EconomicsSub: React.FC = () => {
  const [sum, setSum] = useState<any>(null);
  const [econ, setEcon] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [util, setUtil] = useState(0.7);
  const [sim, setSim] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getAiUsageSummary(30).then(setSum).catch((e) => toast.error(e.message)); }, []);
  useEffect(() => {
    api.getAiEconomics().then((d) => { setEcon(d.economics); setBudget(d.budget); setForm(d.economics); }).catch((e) => toast.error(e.message));
  }, []);

  const runSim = async (f = form, u = util) => {
    if (!f) return;
    setBusy(true);
    try {
      const r = await api.simulateEconomics({ ...f, expectedUtilizationPct: u });
      setSim(r);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  useEffect(() => { if (form) runSim(form, util); /* eslint-disable-next-line */ }, [form, util]);

  const setF = (k: string, v: number) => setForm((p: any) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!form) return; setSaving(true);
    try {
      await api.updateAiSettings({
        aiProductPriceUsd: Number(form.priceUsd),
        aiProductPeriodDays: Number(form.periodDays),
        aiProductIncludedCredits: Number(form.includedCredits),
        targetGrossMarginPct: Number(form.targetGrossMarginPct),
        paymentFeeReservePct: Number(form.paymentFeeReservePct),
        infraReservePct: Number(form.infraReservePct),
        creditSafetyFactor: Number(form.creditSafetyFactor),
      });
      toast.success('Экономика сохранена');
      const d = await api.getAiEconomics(); setEcon(d.economics); setBudget(d.budget);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const real = sum?.real || {};
  const cogs = real.providerCogsUsd || 0;
  const userCredits = real.userCreditsCaptured || 0;
  const numField = (lbl: string, k: string, step = 1, suffix = '') => (
    <div>
      <label style={label}>{lbl}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="number" step={step} style={input} value={form?.[k] ?? ''} data-testid={`econ-${k}`}
          onChange={(e) => setF(k, Number(e.target.value))} />
        {suffix ? <span style={{ fontSize: 12, color: T.sub }}>{suffix}</span> : null}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ ...card, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Экономика считается от подписки: <b>цена → чистая выручка → допустимый AI-COGS → себестоимость одного кредита</b>. Реальная выручка (MRR) появится <b>только после реального checkout</b>; ниже теоретические значения помечены как <i>прогноз</i>.</div>
      </div>

      {/* Derived budget from saved economics */}
      <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, margin: '4px 0 8px' }}>Текущая сохранённая экономика</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 18 }}>
        <KpiCard title="Net revenue / период" value={usd(budget?.netRevenueUsd || 0, 2)} sub="цена × (1 − fee − infra)" />
        <KpiCard title="Allowed AI COGS" value={usd(budget?.allowedAiCostUsd || 0, 2)} sub="net × (1 − target margin)" />
        <KpiCard title="Max cost / credit" value={usd(budget?.maxCostPerCreditUsd || 0, 5)} sub="allowed COGS / кредиты" />
        <KpiCard title="Provider COGS (real, 30д)" value={usd(cogs, 4)} sub="реальная себестоимость" />
        <KpiCard title="Кредитов списано (real)" value={int(userCredits)} sub="только real-запросы" />
      </div>

      {/* Editable simulator */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Симулятор экономики <span style={{ fontSize: 12, color: '#B45309', fontWeight: 600 }}>· прогноз</span></div>
          <button style={btn('primary')} disabled={saving} onClick={save} data-testid="econ-save">{saving ? 'Сохранение…' : 'Сохранить экономику'}</button>
        </div>
        {form ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              {numField('Цена подписки, $', 'priceUsd', 1)}
              {numField('Период, дней', 'periodDays', 1)}
              {numField('Кредитов включено', 'includedCredits', 50)}
              {numField('Target gross margin', 'targetGrossMarginPct', 0.05, '(0–1)')}
              {numField('Payment fee reserve', 'paymentFeeReservePct', 0.01, '(0–1)')}
              {numField('Infra reserve', 'infraReservePct', 0.01, '(0–1)')}
              {numField('Credit safety factor', 'creditSafetyFactor', 0.05)}
              <div>
                <label style={label}>Ожидаемое использование</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" step={0.05} min={0} max={1} style={input} value={util} data-testid="econ-util"
                    onChange={(e) => setUtil(Math.min(1, Math.max(0, Number(e.target.value))))} />
                  <span style={{ fontSize: 12, color: T.sub }}>(0–1)</span>
                </div>
              </div>
            </div>

            {sim ? (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                <KpiCard title="Net plan value" value={usd(sim.budget.netRevenueUsd, 2)} sub="прогноз" />
                <KpiCard title="Allowed AI COGS" value={usd(sim.budget.allowedAiCostUsd, 2)} sub="при 100% использ." />
                <KpiCard title="Max cost / credit" value={usd(sim.budget.maxCostPerCreditUsd, 5)} sub="внутр. бюджет" />
                <KpiCard title={`COGS @ ${Math.round(sim.expectedUtilizationPct * 100)}%`} value={usd(sim.expectedAiCogsUsd, 2)} sub={`${int(sim.expectedConsumedCredits)} кредитов`} />
                <KpiCard title="Est. gross margin" value={`${(sim.estimatedGrossMarginPct * 100).toFixed(1)}%`} sub="прогноз" testId="econ-est-margin" />
                <KpiCard title="Worst-case margin" value={`${(sim.worstCaseGrossMarginPct * 100).toFixed(1)}%`} sub="100% использ." />
              </div>
            ) : null}

            {sim?.capacity?.length ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Ёмкость по реальной себестоимости операций</div>
                {sim.capacity.map((c: any) => (
                  <div key={c.operation} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
                    <span style={{ color: T.ink, fontWeight: 600 }}>{c.operation}</span>
                    <span style={{ color: T.sub }}>~{usd(c.avgCostUsd, 4)}/запрос · ≈ <b style={{ color: T.ink }}>{int(c.approxRequests)}</b> запросов</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 14, fontSize: 12.5, color: '#B45309' }}>Реальных usage-данных пока мало — ёмкость по операциям появится после накопления реальных AiUsageEvent (p50/p95 себестоимости).</div>
            )}

            <div style={{ marginTop: 14, fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
              <div><b>NetRevenue</b> = Price × (1 − PaymentFee − Infra). <b>AllowedAiCost</b> = NetRevenue × (1 − TargetMargin). <b>MaxCostPerCredit</b> = AllowedAiCost / IncludedCredits.</div>
              <div><b>CreditsCharged</b> = ceil(RealProviderCost × Safety / MaxCostPerCredit), с clamp по min/max операции. Цена уже проданного периода замораживается снапшотом.</div>
            </div>
          </>
        ) : <div style={{ color: T.sub }}>Загрузка…</div>}
      </div>
    </div>
  );
};

/* ================= ПОЛЬЗОВАТЕЛИ ================= */
const UsersSub: React.FC = () => {
  const [user, setUser] = useState(''); const [data, setData] = useState<any>(null);
  const [delta, setDelta] = useState(''); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const [list, setList] = useState<any[]>([]); const [listBusy, setListBusy] = useState(true);
  const [econ, setEcon] = useState<any>(null);
  useEffect(() => {
    api.getAiUsers(100).then((r) => setList(r.items || [])).catch(() => undefined).finally(() => setListBusy(false));
  }, []);
  const loadEcon = (id: string) => { setEcon(null); api.getUserEconomics(id).then(setEcon).catch(() => setEcon(null)); };
  const lookupId = async (id: string) => {
    try {
      const a = await api.getAiUserAnalytics(id);
      setData(a); loadEcon(id);
    } catch (e: any) { toast.error(e.message); }
  };
  const lookup = async () => {
    if (!user.trim()) return;
    try {
      const d = await api.getDiagnostics(user.trim());
      if (!d.found) return toast.error('Пользователь не найден');
      const a = await api.getAiUserAnalytics(d.user._id);
      setData({ ...a, email: d.user.email }); loadEcon(d.user._id);
    } catch (e: any) { toast.error(e.message); }
  };
  const adjust = async () => {
    if (!data) return; setBusy(true);
    try {
      await api.creditAdjust({ user: data.userId, delta: Number(delta), reason });
      toast.success('Скорректировано (ledger)'); setDelta(''); setReason('');
      const a = await api.getAiUserAnalytics(data.userId); setData({ ...data, ...a });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const b = data?.balances || {};
  const ai = data?.ai || {};
  const lc = data?.lifecycle || {};
  return (
    <div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>AI-аналитика пользователя</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
          <div style={{ flex: 1, maxWidth: 380 }}><label style={label}>Пользователь</label><input style={input} value={user} onChange={(e) => setUser(e.target.value)} placeholder="ID / 0x / email" /></div>
          <button style={btn('primary')} onClick={lookup}>Показать</button>
        </div>
      </div>

      {/* Users analytics table (Phase C / P15) */}
      <div style={card} data-testid="ai-users-table">
        <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Пользователи AI (30 дней)</div>
        {listBusy ? <div style={{ color: T.sub }}>Загрузка…</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead><tr>
                <th style={th}>Пользователь</th><th style={th}>Подписка</th><th style={th}>До</th><th style={th}>Выдано</th><th style={th}>Потрачено</th>
                <th style={th}>Осталось</th><th style={th}>Резерв</th><th style={th}>Util</th><th style={th}>Запросов 30д</th><th style={th}>COGS 30д</th><th style={th}>Plan value</th><th style={th}>Est. profit</th><th style={th}>Est. margin</th><th style={th}>Сгорит ≤7д</th>
              </tr></thead>
              <tbody>{list.length ? list.map((u) => (
                <tr key={u.userId} style={{ cursor: 'pointer' }} data-testid={`ai-user-row-${u.userId}`} onClick={() => lookupId(u.userId)}>
                  <td style={td}>{u.email || u.wallet || <span style={keySmall}>{u.userId}</span>}</td>
                  <td style={td}>{u.membership}</td>
                  <td style={td}>{u.periodEnd ? dt(u.periodEnd).split(',')[0] : '—'}</td>
                  <td style={td}>{int(u.granted)}</td>
                  <td style={td}>{int(u.spent)}</td>
                  <td style={td}>{int(u.remaining)}</td>
                  <td style={td}>{int(u.reserved)}</td>
                  <td style={td}>{pct(u.utilizationPct)}</td>
                  <td style={td}>{int(u.requests30d)}</td>
                  <td style={td}>{usd(u.cogs30dUsd, 4)}</td>
                  <td style={td}>{u.planValueUsd != null ? usd(u.planValueUsd, 2) : '—'}</td>
                  <td style={td}>{u.estProfitUsd != null ? usd(u.estProfitUsd, 2) : '—'}</td>
                  <td style={td}>{u.estMarginPct != null ? pct(u.estMarginPct) : '—'}</td>
                  <td style={{ ...td, color: u.expiring7dCredits ? '#B45309' : T.ink, fontWeight: u.expiring7dCredits ? 700 : 400 }}>{int(u.expiring7dCredits)}</td>
                </tr>
              )) : <tr><td style={td} colSpan={14}>Пока нет AI-пользователей.</td></tr>}</tbody>
            </table>
          </div>
        )}
      </div>

      {data ? (
        <>
          <div style={{ ...card }} data-testid="customer360-ai">
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 10 }}>{data.email} · <span style={keySmall}>{data.userId}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
              {[['Monthly', b.monthly], ['Top-up', b.topup], ['Reserved', b.reserved], ['Available', b.available], ['Total', b.total]].map((x) => (
                <div key={x[0] as string} style={{ ...card, marginBottom: 0, padding: 12 }}><div style={{ fontSize: 12, color: T.sub, fontWeight: 700 }}>{x[0]}</div><div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{int(x[1])}</div></div>
              ))}
            </div>
            {data.subscription ? (
              <div style={{ marginTop: 12, fontSize: 12.5, color: T.sub }}>
                Подписка: <b style={{ color: T.ink }}>{data.subscription.plan}</b> · статус {data.subscription.status} · до {dt(data.subscription.periodEnd)} · источник {data.subscription.source || '—'}
                {data.subscription.economicsSnapshot ? <span> · max cost/credit <b style={{ color: T.ink }}>{usd(data.subscription.economicsSnapshot.maxCostPerCreditUsd, 5)}</b></span> : null}
              </div>
            ) : <div style={{ marginTop: 12, fontSize: 12.5, color: T.sub }}>Нет активной подписки FOMO AI.</div>}
          </div>

          {/* Credit lifecycle (Phase C) */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Кредитный период</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
              <KpiCard title="Выдано (monthly)" value={int(lc.grantedMonthly)} />
              <KpiCard title="Использовано" value={int(lc.capturedMonthly)} />
              <KpiCard title="Utilization" value={pct(lc.utilizationPct)} />
              <KpiCard title="Сгорит ≤7д" value={int(lc.expiring7dCredits)} />
              <KpiCard title="Сгорит ≤30д" value={int(lc.expiring30dCredits)} />
              <KpiCard title="Истекает" value={lc.expiresAt ? dt(lc.expiresAt) : '—'} />
            </div>
          </div>

          <div style={{ ...card }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>AI за 30 дней</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
              <KpiCard title="Запросов" value={int(ai.requests30d)} />
              <KpiCard title="Кредитов потрачено" value={int(ai.creditsSpent30d)} />
              <KpiCard title="Real AI COGS" value={usd(ai.providerCostGeneratedUsd, 4)} />
              <KpiCard title="Ср. cost/запрос" value={usd(ai.avgCostPerRequestUsd, 5)} />
              <KpiCard title="Топ-операция" value={ai.topOperation || '—'} />
              <KpiCard title="Последний запрос" value={ai.lastRequestAt ? dt(ai.lastRequestAt) : '—'} />
            </div>
            {(ai.topOperations || []).length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Операции</div>
                {ai.topOperations.map((o: any) => (
                  <div key={o.operation} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12.5 }}>
                    <span style={{ color: T.ink, fontWeight: 600 }}>{o.operation}</span>
                    <span style={{ color: T.sub }}>{int(o.count)} запр. · {int(o.credits)} кред. · {usd(o.cogsUsd, 4)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Экономика клиента (contribution / margin / projection) — Phase F */}
          {econ && econ.economics ? (
            <div style={card} data-testid="customer360-economics">
              <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Экономика клиента <span style={keySmall}>оценка (нет checkout)</span></div>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>Contribution = Net plan value − реальный provider COGS. За период {econ.period?.start ? dt(econ.period.start).split(',')[0] : ''} — {econ.period?.end ? dt(econ.period.end).split(',')[0] : ''}.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
                <KpiCard title="Subscription value" value={econ.subscription?.planValueUsd != null ? usd(econ.subscription.planValueUsd, 2) : '—'} />
                <KpiCard title="Net plan value" value={econ.economics.netPlanValueUsd != null ? usd(econ.economics.netPlanValueUsd, 2) : '—'} />
                <KpiCard title="Provider tokens" value={int(econ.providerUsage?.totalTokens)} sub={`${int(econ.providerUsage?.requests)} запр.`} />
                <KpiCard title="Real provider COGS" value={usd(econ.economics.realProviderCogsUsd, 4)} testId="c360-cogs" />
                <KpiCard title="Est. contribution" value={econ.economics.estimatedContributionProfitUsd != null ? usd(econ.economics.estimatedContributionProfitUsd, 2) : '—'} testId="c360-profit" />
                <KpiCard title="Est. margin" value={econ.economics.estimatedContributionMarginPct != null ? pct(econ.economics.estimatedContributionMarginPct) : '—'} testId="c360-margin" />
                <KpiCard title="Projected COGS" value={usd(econ.economics.projectedCogsUsd, 2)} sub={`budget ${usd(econ.economics.allowedAiCogsUsd, 2)}`} />
                <KpiCard title="Projected margin" value={econ.economics.projectedMarginPct != null ? pct(econ.economics.projectedMarginPct) : '—'} />
              </div>
              {econ.economics.overBudget ? (
                <div style={{ ...card, marginTop: 12, marginBottom: 0, background: '#FEE2E2', border: '1px solid #FCA5A5' }} data-testid="c360-over-budget">
                  <div style={{ fontSize: 12.5, color: '#991B1B', fontWeight: 700 }}>AI usage превышает целевую экономику: COGS {usd(econ.economics.realProviderCogsUsd, 2)} &gt; бюджет {usd(econ.economics.allowedAiCogsUsd, 2)} (over {usd(econ.economics.overBudgetUsd, 2)})</div>
                </div>
              ) : econ.economics.projectedOverBudget ? (
                <div style={{ ...card, marginTop: 12, marginBottom: 0, background: '#FEF3C7', border: '1px solid #FCD34D' }}>
                  <div style={{ fontSize: 12.5, color: '#92400E', fontWeight: 700 }}>Прогноз COGS {usd(econ.economics.projectedCogsUsd, 2)} может превысить бюджет {usd(econ.economics.allowedAiCogsUsd, 2)} — at risk</div>
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, marginTop: 12 }}>
                {[['Провайдеры', econ.breakdown?.providers], ['Модели', econ.breakdown?.models], ['Операции', econ.breakdown?.operations]].map(([ttl, arr]: any) => (
                  <div key={ttl}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{ttl}</div>
                    {(arr || []).length ? arr.map((b: any) => (
                      <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12 }}>
                        <span style={{ color: T.ink }}>{b.key}</span>
                        <span style={{ color: T.sub }}>{int(b.requests)} · {usd(b.cogsUsd, 4)}{b.credits != null ? ` · ${int(b.credits)}кр` : ''}</span>
                      </div>
                    )) : <div style={keySmall}>нет данных</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Корректировка баланса (ledger)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr auto', gap: 10, alignItems: 'end' }}>
              <div><label style={label}>Δ credits (+/-)</label><input style={input} type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="100 / -50" /></div>
              <div><label style={label}>Причина *</label><input style={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="promo / коррекция / возврат" /></div>
              <button style={btn('primary')} disabled={busy || !delta || !reason} onClick={adjust}>Применить</button>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>История AI-кредитов</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                <thead><tr><th style={th}>Время</th><th style={th}>Тип</th><th style={th}>Bucket</th><th style={th}>Δ credits</th><th style={th}>Причина</th></tr></thead>
                <tbody>{(data.ledger || []).length ? data.ledger.map((t: any) => (
                  <tr key={t._id}><td style={td}>{dt(t.createdAt)}</td><td style={td}>{t.type}</td><td style={td}>{t.bucket}</td><td style={{ ...td, fontWeight: 700, color: t.credits >= 0 ? '#059669' : '#DC2626' }}>{t.credits >= 0 ? '+' : ''}{t.credits}</td><td style={td}>{t.reason || '—'}</td></tr>
                )) : <tr><td style={td} colSpan={5}>Транзакций нет.</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

/* ================= МОДЕЛИ (pricing registry) ================= */
const emptyPrice = { provider: 'openai', model: '', inputPer1M: 0, outputPer1M: 0, cachedInputPer1M: '', reasoningPer1M: '', sourceNote: '' };
const ModelsSub: React.FC = () => {
  const [prices, setPrices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...emptyPrice });
  const [busy, setBusy] = useState(false);
  const load = () => { api.getAiPricing().then((r) => setPrices(r.items || [])); api.getAiSettings().then(setSettings); };
  useEffect(load, []);
  const save = async () => {
    if (!form.model.trim()) return toast.error('Укажите модель');
    setBusy(true);
    try {
      await api.upsertAiPricing({
        _id: form._id,
        provider: form.provider, model: form.model.trim(),
        inputPer1M: Number(form.inputPer1M) || 0, outputPer1M: Number(form.outputPer1M) || 0,
        cachedInputPer1M: form.cachedInputPer1M === '' ? null : Number(form.cachedInputPer1M),
        reasoningPer1M: form.reasoningPer1M === '' ? null : Number(form.reasoningPer1M),
        sourceNote: form.sourceNote,
      });
      toast.success('Цена сохранена'); setForm({ ...emptyPrice }); load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const toggleActive = async (p: any) => { try { await api.setAiPriceActive(p._id, !p.active); load(); } catch (e: any) { toast.error(e.message); } };
  const saveSettings = async (patch: any) => { try { const s = await api.updateAiSettings(patch); setSettings(s); toast.success('Настройки обновлены'); } catch (e: any) { toast.error(e.message); } };
  return (
    <div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Реестр цен провайдеров</div>
        <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 12 }}>Цены в USD за 1M токенов. Меняются без деплоя; каждый AiUsageEvent сохраняет снапшот цены, поэтому историческая себестоимость не меняется задним числом.</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
            <thead><tr><th style={th}>Провайдер</th><th style={th}>Модель</th><th style={th}>Input /1M</th><th style={th}>Output /1M</th><th style={th}>Cached /1M</th><th style={th}>Reasoning /1M</th><th style={th}>С даты</th><th style={th}>Статус</th><th style={th} /></tr></thead>
            <tbody>{prices.map((p) => (
              <tr key={p._id}>
                <td style={td}>{p.provider}</td>
                <td style={td}><b>{p.model}</b>{p.sourceNote ? <div style={{ fontSize: 10.5, color: T.sub }}>{p.sourceNote}</div> : null}</td>
                <td style={td}>{usd(p.inputPer1M, 3)}</td>
                <td style={td}>{usd(p.outputPer1M, 3)}</td>
                <td style={td}>{p.cachedInputPer1M == null ? '—' : usd(p.cachedInputPer1M, 3)}</td>
                <td style={td}>{p.reasoningPer1M == null ? '—' : usd(p.reasoningPer1M, 3)}</td>
                <td style={td}>{dt(p.effectiveFrom).split(',')[0]}</td>
                <td style={td}>{p.active ? <span style={badge('#D1FAE5', '#059669')}>active</span> : <span style={badge('#F1F5F9', '#64748B')}>off</span>}</td>
                <td style={td}><div style={{ display: 'flex', gap: 6 }}><button style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }} onClick={() => setForm({ _id: p._id, provider: p.provider, model: p.model, inputPer1M: p.inputPer1M, outputPer1M: p.outputPer1M, cachedInputPer1M: p.cachedInputPer1M ?? '', reasoningPer1M: p.reasoningPer1M ?? '', sourceNote: p.sourceNote || '' })}>Ред.</button><button style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }} onClick={() => toggleActive(p)}>{p.active ? 'Off' : 'On'}</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>{form._id ? 'Редактировать цену' : 'Добавить / обновить цену'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
          <div><label style={label}>Провайдер</label><input style={input} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
          <div><label style={label}>Модель</label><input style={input} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="gpt-4.1" /></div>
          <div><label style={label}>Input /1M ($)</label><input style={input} type="number" value={form.inputPer1M} onChange={(e) => setForm({ ...form, inputPer1M: e.target.value })} /></div>
          <div><label style={label}>Output /1M ($)</label><input style={input} type="number" value={form.outputPer1M} onChange={(e) => setForm({ ...form, outputPer1M: e.target.value })} /></div>
          <div><label style={label}>Cached /1M ($)</label><input style={input} type="number" value={form.cachedInputPer1M} onChange={(e) => setForm({ ...form, cachedInputPer1M: e.target.value })} placeholder="опц." /></div>
          <div><label style={label}>Reasoning /1M ($)</label><input style={input} type="number" value={form.reasoningPer1M} onChange={(e) => setForm({ ...form, reasoningPer1M: e.target.value })} placeholder="опц." /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={label}>Заметка (источник)</label><input style={input} value={form.sourceNote} onChange={(e) => setForm({ ...form, sourceNote: e.target.value })} /></div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button style={btn('primary')} disabled={busy} onClick={save}>{form._id ? 'Сохранить' : 'Добавить'}</button>
          {form._id ? <button style={btn('ghost')} onClick={() => setForm({ ...emptyPrice })}>Отмена</button> : null}
        </div>
      </div>
      {settings ? (
        <div style={{ ...card, background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#9A3412', marginBottom: 8 }}>Глобальные настройки экономики</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#9A3412', fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!settings.allowUnpricedModels} onChange={(e) => saveSettings({ allowUnpricedModels: e.target.checked })} />
            Разрешать запросы к моделям без заданной цены (production: выключено — иначе продажа «вслепую»)
          </label>
          <div style={{ marginTop: 10, fontSize: 13, color: '#9A3412' }}>Revenue/credit по умолчанию (без подписки): <b>${settings.defaultRevenuePerCreditUsd}</b></div>
        </div>
      ) : null}
    </div>
  );
};

/* ================= ЗНАНИЯ (Knowledge Diagnostics) ================= */
const KnowledgeSub: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ connected: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  // Test source
  const [domain, setDomain] = useState('earlyland');
  const [q, setQ] = useState('Monad');
  const [testRes, setTestRes] = useState<any>(null);
  const [testBusy, setTestBusy] = useState(false);
  // Grounded ask
  const [op, setOp] = useState('ask_fomo');
  const [askQ, setAskQ] = useState('What early crypto opportunities does FOMO track?');
  const [askUser, setAskUser] = useState('');
  const [askCtx, setAskCtx] = useState('INTERNAL');
  const [askRes, setAskRes] = useState<any>(null);
  const [askBusy, setAskBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api.getKnowledgeHealth()
      .then((r) => { setItems(r.items || []); setSummary({ connected: r.connected, total: r.total }); })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const runTest = async () => {
    if (!domain) return;
    setTestBusy(true); setTestRes(null);
    try { setTestRes(await api.knowledgeTest(domain, q.trim())); load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setTestBusy(false); }
  };
  const runAsk = async () => {
    setAskBusy(true); setAskRes(null);
    try {
      const r = await api.aiAsk({ operation: op, query: askQ.trim(), billingContext: askCtx, userId: askUser.trim() || undefined });
      setAskRes(r); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setAskBusy(false); }
  };

  return (
    <div data-testid="ai-knowledge-tab">
      <div style={{ ...card, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
        <div style={{ fontSize: 13, color: '#3730A3', fontWeight: 600 }}>FOMO Knowledge Layer — единый <b>read-only</b> слой над реальными коллекциями FOMO. AI отвечает <b>только</b> из подключённых источников. Отсутствующий источник — <i>not_connected</i>, пустой — <i>empty</i>; данные никогда не выдумываются, приватные датасеты закрыты правами доступа.</div>
      </div>

      {/* Источники данных */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Источники данных {summary ? <span style={{ ...keySmall, marginLeft: 6 }}>{summary.connected}/{summary.total} подключено</span> : null}</div>
          <button style={{ ...btn('ghost'), padding: '6px 12px', fontSize: 12 }} data-testid="kn-refresh-btn" onClick={load}>Обновить</button>
        </div>
        {loading ? <div style={{ color: T.sub }}>Загрузка…</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead><tr>
                <th style={th}>Источник</th><th style={th}>Статус</th><th style={th}>Режим</th><th style={th}>Записей</th>
                <th style={th}>Обновление</th><th style={th}>Freshness</th><th style={th}>Запросов 24ч</th><th style={th}>Ошибок</th><th style={th}>Ср. latency</th><th style={th}>Доступ</th>
              </tr></thead>
              <tbody>{items.map((it) => (
                <tr key={it.domain} data-testid={`kn-src-${it.domain}`}>
                  <td style={td}>{capName(it.domain)}<div style={keySmall}>{it.source}</div></td>
                  <td style={td}>{knStatusBadge(it.status)}</td>
                  <td style={td}>{it.dataMode === 'real' ? <span style={badge('#D1FAE5', '#059669')}>real</span> : <span style={badge('#FEF3C7', '#B45309')}>mock</span>}</td>
                  <td style={td}>{int(it.count)}</td>
                  <td style={td}>{dt(it.freshness?.updatedAt)}</td>
                  <td style={td}>{freshBadge(it.freshness)}</td>
                  <td style={td}>{int(it.requests24h)}</td>
                  <td style={{ ...td, color: it.errors ? '#DC2626' : T.ink, fontWeight: it.errors ? 700 : 400 }}>{int(it.errors)}</td>
                  <td style={td}>{it.avgLatencyMs == null ? '—' : `${int(it.avgLatencyMs)} ms`}</td>
                  <td style={td}>{it.public ? <span style={badge('#E0F2FE', '#0369A1')}>public</span> : <span style={badge('#FEF3C7', '#B45309')}>private</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Проверить источник */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Проверить источник</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 180 }}>
            <label style={label}>Источник</label>
            <AdminSelect
              value={domain}
              options={(items.length ? items.map((i) => i.domain) : ['projects', 'earlyland', 'funds', 'persons', 'ratings', 'signals']).map((d) => ({ value: d, label: capName(d) }))}
              onChange={(v) => setDomain(v)}
              ariaLabel="Источник знаний"
              testid="kn-test-domain"
            />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}><label style={label}>Запрос</label><input style={input} data-testid="kn-test-query" value={q} onChange={(e) => setQ(e.target.value)} placeholder="напр. Monad" /></div>
          <button style={btn('primary')} data-testid="kn-test-btn" disabled={testBusy} onClick={runTest}>{testBusy ? '…' : 'Проверить'}</button>
        </div>
        {testRes ? (
          <div style={{ marginTop: 14 }} data-testid="kn-test-result">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              {knStatusBadge(testRes.status)}
              <span style={keySmall}>{testRes.source}</span>
              <span style={{ fontSize: 12, color: T.sub }}>найдено: <b>{int(testRes.count)}</b></span>
              {testRes.latencyMs != null ? <span style={{ fontSize: 12, color: T.sub }}>· {int(testRes.latencyMs)} ms</span> : null}
              {testRes.dataMode === 'mock' ? <span style={badge('#FEF3C7', '#B45309')}>mock</span> : null}
            </div>
            {testRes.note ? <div style={{ fontSize: 12.5, color: '#B45309', marginBottom: 8 }}>{testRes.note}</div> : null}
            {(testRes.data || []).map((d: any, i: number) => (
              <div key={i} style={{ ...card, marginBottom: 8, padding: 12, background: '#F8FAFC' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{d.title}</div>
                <div style={keySmall}>{d.entityId}{d.updatedAt ? ` · ${dt(d.updatedAt)}` : ''}</div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 6, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{JSON.stringify(d.fields, null, 0)}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Grounded-ответ (диагностика) */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Grounded-ответ (диагностика)</div>
        <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 12 }}>Прогон FOMO AI через Gateway + Tool Registry. INTERNAL — без списания кредитов (проверка грудинга); USER — реальный billing по кредитам конкретного пользователя.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, marginBottom: 10 }}>
          <div><label style={label}>Операция</label><AdminSelect value={op} options={OPERATIONS.map((o) => ({ value: o.key, label: o.label }))} onChange={(v) => setOp(v)} ariaLabel="Операция" testid="kn-ask-op" /></div>
          <div><label style={label}>Контекст</label><AdminSelect value={askCtx} options={[{ value: 'INTERNAL', label: 'INTERNAL' }, { value: 'USER', label: 'USER' }]} onChange={(v) => setAskCtx(v)} ariaLabel="Контекст" testid="kn-ask-ctx" /></div>
          <div style={{ gridColumn: askCtx === 'USER' ? 'auto' : undefined }}><label style={label}>User (для USER)</label><input style={input} data-testid="kn-ask-user" value={askUser} onChange={(e) => setAskUser(e.target.value)} placeholder="ID / 0x / email" /></div>
        </div>
        <div style={{ marginBottom: 10 }}><label style={label}>Вопрос</label><input style={input} data-testid="kn-ask-query" value={askQ} onChange={(e) => setAskQ(e.target.value)} /></div>
        <button style={btn('primary')} data-testid="kn-ask-btn" disabled={askBusy} onClick={runAsk}>{askBusy ? 'Выполняется…' : 'Спросить FOMO AI'}</button>

        {askRes ? (
          <div style={{ marginTop: 16 }} data-testid="kn-ask-result">
            {askRes.ok === false ? (
              <div style={{ ...card, marginBottom: 0, background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                <div style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700 }}>Статус: {askRes.status} · {askRes.errorCode}</div>
                <div style={{ fontSize: 12.5, color: '#B91C1C', marginTop: 4 }}>{askRes.reason || 'Запрос не выполнен'}</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={badge('#EDE9FE', '#6D28D9')}>coverage: {askRes.coverage}</span>
                  {askRes.dataMode === 'mock' ? <span style={badge('#FEF3C7', '#B45309')}>mock ответ</span> : <span style={badge('#D1FAE5', '#059669')}>real</span>}
                  <span style={{ fontSize: 12, color: T.sub }}>кредитов: <b>{int(askRes.usage?.creditsCharged)}</b> · cost: {usd(askRes.usage?.costBreakdown?.totalUsd, 6)}</span>
                </div>
                <div style={{ ...card, marginBottom: 10, padding: 14, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6, color: T.ink }}>{askRes.answer}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ ...card, marginBottom: 0, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Источники (FOMO facts)</div>
                    {(askRes.sources || []).length ? (askRes.sources).map((s: any, i: number) => (
                      <div key={i} style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>
                        <span style={badge(s.sourceType === 'FOMO' ? '#D1FAE5' : '#E0F2FE', s.sourceType === 'FOMO' ? '#059669' : '#0369A1')}>{s.sourceType}</span>
                        <b style={{ marginLeft: 6, color: T.ink }}>{s.title}</b> <span style={keySmall}>{s.entityType}</span>
                      </div>
                    )) : <div style={{ fontSize: 12, color: T.sub }}>Нет реальных источников (данные не подключены / пусты).</div>}
                  </div>
                  <div style={{ ...card, marginBottom: 0, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Retrieval</div>
                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.8 }}>
                      <div>Запросов знаний: <b>{int(askRes.retrieval?.knowledgeQueries)}</b></div>
                      <div>connected/empty/not_connected: <b>{int(askRes.retrieval?.sourcesConnected)}</b> / {int(askRes.retrieval?.sourcesEmpty)} / {int(askRes.retrieval?.sourcesNotConnected)}</div>
                      <div>latency: {int(askRes.retrieval?.totalLatencyMs)} ms · ошибок: {int(askRes.retrieval?.errors)}</div>
                    </div>
                    {(askRes.limitations || []).length ? <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 8 }}>Ограничения: {askRes.limitations.join(', ')}</div> : null}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* ================= ФИНАНСЫ (FOMO Money Control Center) ================= */
const FIN_TABS = [
  { key: 'overview', label: 'Обзор' },
  { key: 'balances', label: 'Балансы' },
  { key: 'purchases', label: 'Покупки' },
  { key: 'withdrawals', label: 'Выводы' },
  { key: 'reconciliation', label: 'Reconciliation' },
  { key: 'diagnostics', label: 'Диагностика' },
];

const WSTATUS_COLORS: Record<string, [string, string]> = {
  REQUESTED: ['#FEF3C7', '#B45309'], RESERVED: ['#FEF3C7', '#B45309'], PROCESSING: ['#DBEAFE', '#1D4ED8'],
  ONCHAIN_PENDING: ['#DBEAFE', '#1D4ED8'], CONFIRMED: ['#D1FAE5', '#059669'], FAILED: ['#FEE2E2', '#DC2626'], RELEASED: ['#E2E8F0', '#475569'],
};
const PSTATUS_COLORS: Record<string, [string, string]> = {
  CREATED: ['#F1F5F9', '#64748B'], RESERVED: ['#FEF3C7', '#B45309'], SETTLING: ['#DBEAFE', '#1D4ED8'],
  PAID: ['#DBEAFE', '#1D4ED8'], SETTLED: ['#D1FAE5', '#059669'], FAILED: ['#FEE2E2', '#DC2626'], REFUNDED: ['#E2E8F0', '#475569'],
};
const wBadge = (s: string) => { const c = WSTATUS_COLORS[s] || ['#F1F5F9', '#64748B']; return <span style={badge(c[0], c[1])}>{s}</span>; };
const pBadge = (s: string) => { const c = PSTATUS_COLORS[s] || ['#F1F5F9', '#64748B']; return <span style={badge(c[0], c[1])}>{s}</span>; };
const orDash = (v: any, fn: (x: any) => string) => (v === null || v === undefined ? '—' : fn(v));

const FinanceSub: React.FC = () => {
  const [ftab, setFtab] = useState('overview');
  const [ov, setOv] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [recon, setRecon] = useState<any>(null);
  const [diag, setDiag] = useState<any>(null);
  const [chain, setChain] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [adj, setAdj] = useState({ amount: '', reason: '', reference: '' });

  const loadOverview = () => Promise.all([api.getMoneyOverview(), api.getMoneyBalances(200)])
    .then(([o, b]) => { setOv(o); setRows(b.items || []); }).catch((e) => toast.error(e.message));
  const loadPurchases = () => api.getMoneyPurchases(200).then((r) => setPurchases(r.items || [])).catch((e) => toast.error(e.message));
  const loadWithdrawals = () => api.getMoneyWithdrawals(200).then((r) => setWithdrawals(r.items || [])).catch((e) => toast.error(e.message));
  const loadRecon = () => api.getMoneyReconciliation().then(setRecon).catch((e) => toast.error(e.message));
  const loadDiag = () => api.getMoneyDiagnostics().then(setDiag).catch((e) => toast.error(e.message));

  useEffect(() => {
    if (ftab === 'overview' || ftab === 'balances') loadOverview();
    if (ftab === 'purchases') loadPurchases();
    if (ftab === 'withdrawals') loadWithdrawals();
    if (ftab === 'reconciliation') loadRecon();
    if (ftab === 'diagnostics') loadDiag();
  }, [ftab]);

  const openUser = (id: string) => api.getUserFinance(id).then(setDetail).catch((e) => toast.error(e.message));
  const openChain = (id: string) => api.getPurchaseChain(id).then(setChain).catch((e) => toast.error(e.message));
  const doAdjust = async () => {
    if (!detail || !adj.amount || !adj.reason) return toast.error('Сумма и причина обязательны');
    try { await api.moneyAdjust(detail.userId, { amount: Number(adj.amount), reason: adj.reason, reference: adj.reference }); toast.success('Корректировка проведена (ledger)'); setAdj({ amount: '', reason: '', reference: '' }); openUser(detail.userId); }
    catch (e: any) { toast.error(e.message); }
  };
  const doExec = async (id: string) => { try { const r = await api.executeWithdrawal(id); if (r.ok) toast.success(`Вывод исполнен: ${r.code}`); else toast.info(`${r.code}${r.fallback ? ' — доступно ручное подтверждение' : ''}`); loadWithdrawals(); } catch (e: any) { toast.error(e.message); } };
  const doConfirm = async (id: string) => { const tx = window.prompt('txHash подтверждённой on-chain транзакции (можно пусто):') || ''; try { await api.confirmWithdrawal(id, tx); toast.success('Вывод подтверждён (ledger DEBIT)'); loadWithdrawals(); } catch (e: any) { toast.error(e.message); } };
  const doRelease = async (id: string) => { const reason = window.prompt('Причина отмены/возврата резерва:') || 'manual release'; try { await api.releaseWithdrawal(id, reason); toast.success('Резерв освобождён'); loadWithdrawals(); } catch (e: any) { toast.error(e.message); } };

  const f = ov || {};
  const short = (h: string) => (h && h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h || '—');

  return (
    <div data-testid="ai-finance-tab">
      <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 12 }}>FOMO Money (USDC/zkSync) — собственный платёжный контур. Отдельная экономика от AI-кредитов и XP. Балансы выводятся из ledger; изменения только через операции ledger (никаких прямых $set).</div>
      <a href="/admin/acquiring" style={{ display: 'inline-block', marginBottom: 14, fontSize: 13, fontWeight: 700, color: T.accent, textDecoration: 'none' }} data-testid="fin-open-acquiring">Открыть раздел «Эквайринг» →</a>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FIN_TABS.map((t) => (
          <button key={t.key} data-testid={`fin-subtab-${t.key}`} onClick={() => setFtab(t.key)}
            style={{ border: `1px solid ${ftab === t.key ? T.accent : T.border}`, background: ftab === t.key ? T.accent : '#fff', color: ftab === t.key ? '#fff' : T.ink, fontWeight: 700, fontSize: 12.5, padding: '7px 14px', borderRadius: 999, cursor: 'pointer', transition: 'background 180ms ease, color 180ms ease' }}>{t.label}</button>
        ))}
      </div>

      {ftab === 'overview' && (ov ? (
        <div data-testid="fin-overview">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12 }}>
            <KpiCard title="Обязательства перед польз." value={usd(f.liability?.total, 2)} sub={`available ${usd(f.liability?.available, 0)} · reserved ${usd(f.liability?.reserved, 0)}`} />
            <KpiCard title="Плательщики (balance>0)" value={int(f.liability?.payers)} sub="уник. польз." />
            <KpiCard title="Пополнения (lifetime)" value={usd(f.deposits?.lifetime, 2)} sub={`30д ${usd(f.deposits?.last30d, 0)} · 24ч ${usd(f.deposits?.last24h, 0)}`} />
            <KpiCard title="Покупки SETTLED (lifetime)" value={usd(f.purchases?.volumeLifetime, 2)} sub={`${int(f.purchases?.countLifetime)} шт · 30д ${usd(f.purchases?.volume30d, 0)}`} />
            <KpiCard title="Realized revenue" value={usd(f.realizedRevenue?.total, 2)} sub={`AI ${usd(f.realizedRevenue?.fomoAiUsd, 0)} · Intel ${usd(f.realizedRevenue?.fomoIntelUsd, 0)}`} testId="fin-revenue" />
            <KpiCard title="Выводы подтверждённые" value={usd(f.withdrawals?.confirmedLifetime, 2)} sub={`pending ${int(f.withdrawals?.pending)} · failed ${int(f.withdrawals?.failed)}`} />
            <KpiCard title="Refunds" value={usd(f.refunds?.lifetime, 2)} sub={`${int(f.refunds?.count)} шт`} />
            <KpiCard title="Settlements" value={`${int(f.settlements?.pending)} / ${int(f.settlements?.failed)}`} sub="pending / failed" />
          </div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 10 }}>Сеть: {f.network?.name} ({f.network?.networkId}) · {f.network?.tokenSymbol}. Значения «0» — реальные нули из ledger.</div>
        </div>
      ) : <div style={{ color: T.sub }}>Загрузка…</div>)}

      {ftab === 'balances' && (
        <div style={card} data-testid="fin-balances">
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Балансы пользователей</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead><tr><th style={th}>Пользователь</th><th style={th}>Доступно</th><th style={th}>Зарезервировано</th><th style={th}>Всего</th><th style={th}>Активность</th></tr></thead>
              <tbody>{rows.length ? rows.map((r) => (
                <tr key={r.userId} style={{ cursor: 'pointer' }} data-testid={`fin-row-${r.userId}`} onClick={() => openUser(r.userId)}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{r.userId}</td>
                  <td style={td}>{usd(r.available, 2)}</td><td style={td}>{usd(r.reserved, 2)}</td><td style={td}>{usd(r.total, 2)}</td>
                  <td style={td}>{r.lastActivity ? dt(r.lastActivity).split(',')[0] : '—'}</td>
                </tr>
              )) : <tr><td style={td} colSpan={5}>Нет балансов (никто ещё не пополнял).</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}

      {ftab === 'purchases' && (
        <div style={card} data-testid="fin-purchases">
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Покупки</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead><tr><th style={th}>Пользователь</th><th style={th}>Продукт</th><th style={th}>Сумма</th><th style={th}>Статус</th><th style={th}>Создано</th><th style={th}>Settlement</th><th style={th}></th></tr></thead>
              <tbody>{purchases.length ? purchases.map((p) => (
                <tr key={p.id} data-testid={`fin-purchase-${p.id}`}>
                  <td style={{ ...td, fontSize: 11.5 }}>{p.user?.email || p.userId}</td>
                  <td style={td}>{p.productCode}{p.isRenewal ? ' (renewal)' : ''}</td>
                  <td style={td}>{usd(p.amount, 2)} {p.asset}</td>
                  <td style={td}>{pBadge(p.status)}</td>
                  <td style={td}>{orDash(p.createdAt, (x) => dt(x).split(',')[0])}</td>
                  <td style={td}>{orDash(p.settledAt, (x) => dt(x).split(',')[0])}</td>
                  <td style={td}><button style={btn('ghost')} data-testid={`fin-chain-${p.id}`} onClick={() => openChain(p.id)}>Цепочка</button></td>
                </tr>
              )) : <tr><td style={td} colSpan={7}>Покупок ещё нет.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}

      {ftab === 'withdrawals' && (
        <div style={card} data-testid="fin-withdrawals">
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Очередь выводов</div>
          <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>Действия ограничены state machine: REQUESTED→RESERVED→PROCESSING→ONCHAIN_PENDING→CONFIRMED / FAILED→RELEASED. Executor идемпотентен.</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead><tr><th style={th}>Пользователь</th><th style={th}>Сумма</th><th style={th}>Назначение</th><th style={th}>Сеть</th><th style={th}>Статус</th><th style={th}>tx</th><th style={th}>Действия</th></tr></thead>
              <tbody>{withdrawals.length ? withdrawals.map((w) => {
                const canOp = ['REQUESTED', 'RESERVED', 'PROCESSING'].includes(w.moneyStatus);
                return (
                  <tr key={w.id} data-testid={`fin-withdraw-${w.id}`}>
                    <td style={{ ...td, fontSize: 11.5 }}>{w.user?.email || w.userId}</td>
                    <td style={td}>{usd(w.amount, 2)} {w.asset}</td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{short(w.destination)}</td>
                    <td style={td}>{w.network}</td>
                    <td style={td}>{wBadge(w.moneyStatus)}</td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{short(w.txHash)}</td>
                    <td style={td}>
                      {canOp ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button style={btn('ghost')} data-testid={`fin-wd-exec-${w.id}`} onClick={() => doExec(w.id)}>Исполнить</button>
                          <button style={btn('ghost')} data-testid={`fin-wd-confirm-${w.id}`} onClick={() => doConfirm(w.id)}>Подтвердить</button>
                          <button style={btn('ghost')} data-testid={`fin-wd-release-${w.id}`} onClick={() => doRelease(w.id)}>Освободить</button>
                        </div>
                      ) : <span style={{ color: T.sub, fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                );
              }) : <tr><td style={td} colSpan={7}>Активных выводов нет.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}

      {ftab === 'reconciliation' && (
        <div style={card} data-testid="fin-reconciliation">
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Reconciliation</div>
          {recon ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 12 }}>
                <KpiCard title="Ledger liabilities" value={usd(recon.ledgerLiability, 2)} />
                <KpiCard title="Calculated liabilities" value={usd(recon.calculatedLiability, 2)} />
                <KpiCard title="Difference" value={usd(recon.difference, 2)} testId="fin-recon-diff" />
              </div>
              <div style={{ ...badge(recon.status === 'HEALTHY' ? '#D1FAE5' : '#FEE2E2', recon.status === 'HEALTHY' ? '#059669' : '#DC2626'), fontSize: 13 }} data-testid="fin-recon-status">{recon.status}</div>
              <div style={{ ...card, background: '#F8FAFC', marginTop: 12, marginBottom: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Компоненты equation</div>
                {[['Confirmed deposits', recon.inputs?.confirmedDeposits], ['+ Admin credits', recon.inputs?.adminCredits], ['+ Refunds', recon.inputs?.refunds], ['− Settled purchases', recon.inputs?.settledPurchases], ['− Confirmed withdrawals', recon.inputs?.confirmedWithdrawals], ['− Admin debits', recon.inputs?.adminDebits]].map(([k, v]: any) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12.5 }}><span style={{ color: T.sub }}>{k}</span><span style={{ color: T.ink }}>{usd(v, 2)}</span></div>
                ))}
              </div>
              {(recon.sources || []).length ? <div style={{ marginTop: 10, color: '#DC2626', fontSize: 12 }}>{recon.sources.join(' ')}</div> : null}
            </div>
          ) : <div style={{ color: T.sub }}>Загрузка…</div>}
        </div>
      )}

      {ftab === 'diagnostics' && (
        <div style={card} data-testid="fin-diagnostics">
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Диагностика (treasury / сеть)</div>
          {diag ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
              {[
                ['Сеть', `${diag.network?.name} (${diag.network?.networkId})`],
                ['chainId', String(diag.network?.chainId)],
                ['Токен', `${diag.token?.symbol} · ${diag.token?.decimals} dec`],
                ['Token contract', diag.token?.address],
                ['Treasury / executor', diag.treasuryAddress],
                ['RPC', diag.rpcConfigured ? 'настроен' : 'не настроен'],
                ['Executor', `${diag.executorStatus} (fallback: ${diag.executorFallback})`],
                ['Deposit / Withdraw', `${diag.depositEnabled ? 'on' : 'off'} / ${diag.withdrawalEnabled ? 'on' : 'off'}`],
                ['Last deposit', diag.lastConfirmedDeposit ? `${dt(diag.lastConfirmedDeposit.at).split(',')[0]} · ${usd(diag.lastConfirmedDeposit.amount, 2)}` : '—'],
                ['Last withdrawal', diag.lastSuccessfulWithdrawal ? `${dt(diag.lastSuccessfulWithdrawal.at).split(',')[0]} · ${usd(diag.lastSuccessfulWithdrawal.amount, 2)}` : '—'],
                ['Last executor error', diag.lastExecutorError ? diag.lastExecutorError.error : '—'],
                ['Reconciliation', `${diag.reconciliation?.status} (Δ ${usd(diag.reconciliation?.difference, 2)})`],
              ].map(([k, v]: any) => (
                <div key={k} style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3, color: T.sub, fontWeight: 700 }}>{k}</div>
                  <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 600, marginTop: 3, wordBreak: 'break-all', fontFamily: /contract|treasury|chainId/i.test(k) ? 'monospace' : undefined }}>{v}</div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: T.sub }}>Загрузка…</div>}
          <div style={{ fontSize: 11, color: T.sub, marginTop: 10 }}>Приватный ключ/seed никогда не отображается и не логируется. Здесь только публичные адреса и статусы.</div>
        </div>
      )}

      {chain ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setChain(null)}>
          <div style={{ width: 460, maxWidth: '90vw', background: '#fff', height: '100%', overflowY: 'auto', padding: 22 }} onClick={(e) => e.stopPropagation()} data-testid="fin-chain-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>Цепочка покупки</div>
              <button style={btn('ghost')} onClick={() => setChain(null)}>Закрыть</button>
            </div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>{chain.purchase?.productCode} · {usd(chain.purchase?.amount, 2)} {chain.purchase?.asset} · {chain.purchase?.status}</div>
            <div style={{ position: 'relative', paddingLeft: 18 }}>
              {(chain.steps || []).map((s: any, i: number) => (
                <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
                  <div style={{ position: 'absolute', left: -18, top: 2, width: 12, height: 12, borderRadius: '50%', background: s.ok ? '#059669' : '#CBD5E1' }} />
                  {i < chain.steps.length - 1 ? <div style={{ position: 'absolute', left: -13, top: 14, width: 2, height: '100%', background: '#E2E8F0' }} /> : null}
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.ok ? T.ink : T.sub }}>{s.step}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{s.detail}</div>
                  {s.at ? <div style={{ fontSize: 11, color: T.sub }}>{dt(s.at)}</div> : null}
                  {s.idempotencyKey ? <div style={{ fontSize: 10.5, color: T.sub, fontFamily: 'monospace', wordBreak: 'break-all' }}>{s.idempotencyKey}</div> : null}
                  {s.error ? <div style={{ fontSize: 11, color: '#DC2626' }}>{s.error}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {detail ? (
        <div style={card} data-testid="fin-user-detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Финансы пользователя <span style={keySmall}>{detail.userId}</span></div>
            <button style={btn('ghost')} onClick={() => setDetail(null)}>Скрыть</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            <KpiCard title="Доступно" value={usd(detail.balance?.available, 2)} />
            <KpiCard title="Зарезервировано" value={usd(detail.balance?.reserved, 2)} />
            <KpiCard title="Пополнено (lifetime)" value={usd(detail.commerce?.depositedLifetime, 2)} />
            <KpiCard title="Выведено (lifetime)" value={usd(detail.commerce?.withdrawnLifetime, 2)} />
            <KpiCard title="Покупки (lifetime)" value={usd(detail.commerce?.purchasesLifetime, 2)} />
            <KpiCard title="Refunded" value={usd(detail.commerce?.refundedLifetime, 2)} />
            <KpiCard title="Realized revenue" value={usd(detail.commerce?.realizedRevenue, 2)} />
          </div>
          {detail.subscription ? (
            <div style={{ marginTop: 12, fontSize: 12.5, color: T.ink }}>
              Подписка: <b>{detail.subscription.productType}</b> · {detail.subscription.status} · источник <b>{detail.subscription.source}</b> · до {orDash(detail.subscription.currentPeriodEnd, (x) => dt(x).split(',')[0])} · оплачено {usd(detail.subscription.paidAmount, 2)} USDC
              {detail.aiCredits ? <span> · AI-кредиты {int(detail.aiCredits.available)} / {int(detail.aiCredits.total)} (отдельная экономика)</span> : null}
            </div>
          ) : <div style={{ marginTop: 12, fontSize: 12.5, color: T.sub }}>Активной подписки нет.</div>}

          <div style={{ ...card, marginTop: 12, marginBottom: 0, background: '#F8FAFC' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Корректировка (ADMIN_ADJUSTMENT — причина обязательна)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1.4fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div><label style={label}>Δ USDC (+/-)</label><input style={input} type="number" data-testid="fin-adj-amount" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} /></div>
              <div><label style={label}>Причина *</label><input style={input} data-testid="fin-adj-reason" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} placeholder="reconciliation / коррекция" /></div>
              <div><label style={label}>Reference</label><input style={input} value={adj.reference} onChange={(e) => setAdj({ ...adj, reference: e.target.value })} placeholder="SUPPORT-291" /></div>
              <button style={btn('primary')} data-testid="fin-adj-apply" onClick={doAdjust}>Применить</button>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Timeline операций</div>
            {(detail.timeline || []).slice(0, 25).map((t: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12 }}>
                <span style={{ color: T.ink }}>{dt(t.at).split(',')[0]} · {t.label}</span>
                <span style={{ color: t.direction === 'CREDIT' ? '#059669' : '#DC2626' }}>{t.direction === 'CREDIT' ? '+' : '−'}{usd(t.amount, 2)} {t.asset}</span>
              </div>
            ))}
            {!(detail.timeline || []).length ? <div style={{ color: T.sub, fontSize: 12 }}>Нет операций.</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ================= КЛЮЧИ (Provider Credentials Manager) ================= */
const CRED_STATUS: Record<string, [string, string]> = {
  ACTIVE: ['#D1FAE5', '#059669'],
  INACTIVE: ['#F1F5F9', '#64748B'],
  INVALID: ['#FEE2E2', '#DC2626'],
  PROVIDER_BALANCE_EMPTY: ['#FEE2E2', '#DC2626'],
  REVOKED: ['#E2E8F0', '#475569'],
};
const credStatusBadge = (s: string) => { const c = CRED_STATUS[s] || ['#F1F5F9', '#64748B']; return <span style={badge(c[0], c[1])}>{s}</span>; };

export const AiCredentialManager: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const [form, setForm] = useState({ provider: 'OPENAI', label: '', secret: '', baseUrl: '' });
  const [creating, setCreating] = useState(false);
  const [rotateId, setRotateId] = useState<string | null>(null);
  const [rotateVal, setRotateVal] = useState('');
  const load = () => { setBusy(true); api.listCredentials().then(setData).catch((e) => toast.error(e.message)).finally(() => setBusy(false)); };
  useEffect(() => { load(); }, []);
  const create = async () => {
    if (!form.secret.trim()) return toast.error('Укажите секретный ключ');
    setCreating(true);
    try { await api.createCredential(form); toast.success('Ключ добавлен (INACTIVE). Протестируйте и активируйте.'); setForm({ provider: 'OPENAI', label: '', secret: '', baseUrl: '' }); load(); }
    catch (e: any) { toast.error(e.message); } finally { setCreating(false); }
  };
  const act = async (fn: Promise<any>, ok: string) => { try { await fn; toast.success(ok); load(); } catch (e: any) { toast.error(e.message); } };
  const doTest = async (id: string) => { try { const r = await api.testCredential(id); (r.ok ? toast.success : toast.error)(`${r.status} · ${r.credentialStatus} · ${r.latencyMs}ms`); load(); } catch (e: any) { toast.error(e.message); } };
  const rotate = async (id: string) => {
    if (!rotateVal.trim()) return toast.error('Введите новый ключ');
    try { await api.patchCredential(id, { secret: rotateVal }); toast.success('Ключ заменён (INACTIVE). Протестируйте и активируйте.'); setRotateId(null); setRotateVal(''); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const [migrating, setMigrating] = useState(false);
  const migrate = async () => {
    setMigrating(true);
    try { const r = await api.migrateAiEnvCredentials(); const n = (r.created || []).filter((x: any) => x.imported).length; toast.success(n ? `Импортировано ключей: ${n}` : 'Новых ENV-ключей не найдено'); load(); }
    catch (e: any) { toast.error(e.message); } finally { setMigrating(false); }
  };
  const rt = data?.runtime;
  const rtBadge = (v: string) => {
    const map: any = { READY: ['#DCFCE7', '#15803D'], READY_FROM_ENV: ['#FEF3C7', '#B45309'], MANAGED: ['#DCFCE7', '#15803D'], NOT_MIGRATED: ['#FEF3C7', '#B45309'], NOT_CONFIGURED: ['#FEE2E2', '#B91C1C'], NONE: ['#FEE2E2', '#B91C1C'] };
    const c = map[v] || ['#F1F5F9', '#64748B'];
    return <span style={badge(c[0], c[1])}>{v}</span>;
  };
  return (
    <div data-testid="ai-credentials-tab">
      {rt ? (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }} data-testid="ai-runtime-source">
          <div><div style={label}>Провайдер (runtime)</div><div>{rtBadge(rt.providerRuntime)}</div></div>
          <div><div style={label}>Источник ключа</div><div>{rtBadge(rt.credentialSource)}</div></div>
          <div style={{ flex: 1, minWidth: 220, fontSize: 12.5, color: T.sub }}>
            {rt.credentialSource === 'MANAGED'
              ? 'Ключ управляется здесь (encrypted, с историей usage).'
              : rt.canMigrate
                ? 'Сейчас рантайм использует ключ из окружения (.env). Импортируйте его в управляемое хранилище, чтобы включить ротацию и привязку credentialId к usage.'
                : 'Ключ провайдера не настроен. Добавьте ключ ниже.'}
          </div>
          {rt.canMigrate ? (
            <button style={btn('primary')} data-testid="cred-migrate-env" disabled={migrating} onClick={migrate}>{migrating ? '…' : 'Импортировать ключ из ENV'}</button>
          ) : null}
        </div>
      ) : null}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Управление ключами провайдеров</div>
        <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 12 }}>Секрет хранится зашифрованным и никогда не возвращается — только ••••XXXX. Ротация без простоя: добавьте новый → тест → активируйте → старый деактивируется. История usage сохраняется.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10, alignItems: 'end' }}>
          <div><label style={label}>Провайдер</label><AdminSelect value={form.provider} options={[{ value: 'OPENAI', label: 'OpenAI' }, { value: 'EMERGENT', label: 'Emergent LLM' }]} onChange={(v) => setForm({ ...form, provider: v })} ariaLabel="Провайдер" testid="cred-provider" /></div>
          <div><label style={label}>Название</label><input style={input} data-testid="cred-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Production OpenAI" /></div>
          <div><label style={label}>Секретный ключ</label><input style={input} data-testid="cred-secret" type="password" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="sk-..." /></div>
          <div><label style={label}>Base URL (необяз.)</label><input style={input} data-testid="cred-baseurl" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" /></div>
          <button style={btn('primary')} data-testid="cred-create-btn" disabled={creating} onClick={create}>{creating ? '…' : 'Добавить ключ'}</button>
        </div>
      </div>

      <div style={card} data-testid="ai-credentials-table">
        {busy ? <div style={{ color: T.sub }}>Загрузка…</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead><tr>
                <th style={th}>Провайдер</th><th style={th}>Название</th><th style={th}>Ключ</th><th style={th}>Статус</th>
                <th style={th}>Запросов 30д</th><th style={th}>Токенов 30д</th><th style={th}>COGS 30д</th><th style={th}>Посл. тест</th><th style={th}>Действия</th>
              </tr></thead>
              <tbody>{(data?.items || []).length ? data.items.map((c: any) => (
                <React.Fragment key={c.id}>
                  <tr data-testid={`cred-row-${c.id}`} style={{ background: c.id === data.activeCredentialId ? '#F5F3FF' : undefined }}>
                    <td style={td}>{c.provider}{c.id === data.activeCredentialId ? <span style={{ ...badge('#E0E7FF', '#4338CA'), marginLeft: 6 }}>активен</span> : null}</td>
                    <td style={td}>{c.label}</td>
                    <td style={{ ...td, fontFamily: 'monospace' }}>{c.maskedSecret}</td>
                    <td style={td}>{credStatusBadge(c.status)}</td>
                    <td style={td}>{int(c.stats?.requests30d)}</td>
                    <td style={td}>{int(c.stats?.tokens30d)}</td>
                    <td style={td}>{usd(c.stats?.cogs30dUsd, 4)}</td>
                    <td style={td}>{c.lastTestedAt ? `${c.lastTestStatus} · ${c.lastTestLatencyMs}ms` : '—'}</td>
                    <td style={td}>
                      {c.status !== 'REVOKED' ? (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <button style={miniBtn} data-testid={`cred-test-${c.id}`} onClick={() => doTest(c.id)}>Тест</button>
                          {c.id === data.activeCredentialId
                            ? <button style={miniBtn} data-testid={`cred-deactivate-${c.id}`} onClick={() => act(api.deactivateCredential(c.id), 'Деактивирован')}>Деактивировать</button>
                            : <button style={{ ...miniBtn, borderColor: T.accent, color: T.accent }} data-testid={`cred-activate-${c.id}`} onClick={() => act(api.activateCredential(c.id), 'Активирован')}>Активировать</button>}
                          <button style={miniBtn} data-testid={`cred-rotate-${c.id}`} onClick={() => { setRotateId(rotateId === c.id ? null : c.id); setRotateVal(''); }}>Заменить</button>
                          <button style={{ ...miniBtn, borderColor: '#FCA5A5', color: '#DC2626' }} data-testid={`cred-delete-${c.id}`} onClick={() => { if (window.confirm('Удалить/отозвать ключ?')) act(api.deleteCredential(c.id), 'Удалён/отозван'); }}>Удалить</button>
                        </div>
                      ) : <span style={keySmall}>отозван {c.revokedAt ? dt(c.revokedAt).split(',')[0] : ''}</span>}
                    </td>
                  </tr>
                  {rotateId === c.id ? (
                    <tr><td style={td} colSpan={9}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input style={{ ...input, maxWidth: 420 }} type="password" data-testid={`cred-rotate-input-${c.id}`} value={rotateVal} onChange={(e) => setRotateVal(e.target.value)} placeholder="Новый секретный ключ" />
                        <button style={btn('primary')} data-testid={`cred-rotate-save-${c.id}`} onClick={() => rotate(c.id)}>Сохранить новый ключ</button>
                        <span style={keySmall}>Старый ключ заменится; потребуется тест и активация.</span>
                      </div>
                    </td></tr>
                  ) : null}
                </React.Fragment>
              )) : <tr><td style={td} colSpan={9}>Ключи не добавлены.</td></tr>}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= ДАШБОРД (Economics Dashboard) ================= */
const DashboardSub: React.FC = () => {
  const [d, setD] = useState<any>(null);
  const [prov, setProv] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [expiryBusy, setExpiryBusy] = useState(false);
  const load = (dd = days) => {
    setBusy(true);
    Promise.all([api.getEconomicsDashboard(dd), api.getProvidersStatus()])
      .then(([dash, ps]) => { setD(dash); setProv(ps); })
      .catch((e) => toast.error(e.message))
      .finally(() => setBusy(false));
  };
  useEffect(() => { load(days); /* eslint-disable-next-line */ }, [days]);
  const runExpiry = async () => {
    setExpiryBusy(true);
    try { const r = await api.runCreditExpiry(); toast.success(`Expiry: grace ${r.result?.toGrace || 0}, expired ${r.result?.expired || 0}`); load(); }
    catch (e: any) { toast.error(e.message); } finally { setExpiryBusy(false); }
  };
  const c = d?.credits || {}; const ec = d?.economics || {}; const cost = d?.costs || {}; const req = d?.requests || {}; const us = d?.users || {};
  return (
    <div data-testid="ai-dashboard-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Economics Dashboard <span style={{ ...keySmall, marginLeft: 6 }}>реальные данные (mock/demo исключены)</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <AdminSelect value={String(days)} options={[{ value: '7', label: '7 дней' }, { value: '30', label: '30 дней' }, { value: '90', label: '90 дней' }]} onChange={(v) => setDays(Number(v))} ariaLabel="Период" testid="dash-days" />
          <button style={{ ...btn('ghost'), padding: '6px 12px', fontSize: 12 }} data-testid="dash-refresh" onClick={() => load()}>Обновить</button>
          <button style={{ ...btn('primary'), padding: '6px 12px', fontSize: 12 }} data-testid="dash-run-expiry" disabled={expiryBusy} onClick={runExpiry}>{expiryBusy ? '…' : 'Запустить expiry'}</button>
        </div>
      </div>

      {/* Provider statuses */}
      {prov ? (
        <div style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }} data-testid="dash-providers">
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Провайдеры:</span>
          {(prov.providers || []).map((p: any) => (
            <span key={p.key} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 12.5, color: T.sub }}>
              <b style={{ color: T.ink }}>{p.name}</b>{p.active ? <span style={badge('#E0E7FF', '#4338CA')}>активен</span> : null}{provStatusBadge(p.status)}
            </span>
          ))}
        </div>
      ) : null}

      {busy && !d ? <div style={{ color: T.sub }}>Загрузка…</div> : d ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12 }}>
            <KpiCard title="AI-пользователей 30д" value={int(us.active30d)} sub={`подписок: ${int(us.membershipUsers)}`} />
            <KpiCard title="Запросов 30д" value={int(req.thirtyDays)} sub={`сегодня ${int(req.today)} · 7д ${int(req.sevenDays)}`} />
            <KpiCard title="Success rate" value={req.successRatePct == null ? '—' : pct(req.successRatePct)} sub={`ok ${int(req.successful)} · err ${int(req.failed)}`} />
            <KpiCard title="Кредитов выдано" value={int(c.granted)} sub={`monthly ${int(c.grantedMonthly)}`} />
            <KpiCard title="Потрачено / осталось" value={`${int(c.spent)} / ${int(c.remaining)}`} sub={`резерв ${int(c.reserved)}`} />
            <KpiCard title="Utilization" value={pct(c.utilizationPct)} sub={`breakage ${pct(c.breakagePct)}`} testId="dash-utilization" />
            <KpiCard title="Сгорит ≤7д" value={int(c.expiring7d?.credits)} sub={`юзеров ${int(c.expiring7d?.users)}`} testId="dash-expiring7" />
            <KpiCard title="Сгорит ≤30д" value={int(c.expiring30d?.credits)} sub={`юзеров ${int(c.expiring30d?.users)}`} />
            <KpiCard title="Сгорело (breakage)" value={int(c.expiredUnused)} sub="EXPIRY ledger" />
            <KpiCard title="Real provider COGS" value={usd(cost.realProviderCogsUsd, 4)} sub={`all-in ${usd(cost.allInCogsUsd, 4)}`} testId="dash-cogs" />
            <KpiCard title="Est. plan value" value={usd(ec.estimatedPlanValueUsd, 2)} sub="оценка (не выручка)" />
            <KpiCard title="Est. gross margin" value={ec.estimatedGrossMarginPct == null ? '—' : pct(ec.estimatedGrossMarginPct)} sub={ec.estimatedGrossProfitUsd == null ? 'нужен snapshot' : `profit ${usd(ec.estimatedGrossProfitUsd, 2)}`} />
          </div>

          <div style={{ ...card, background: '#EEF2FF', border: '1px solid #C7D2FE', marginTop: 14 }}>
            <div style={{ fontSize: 12.5, color: '#3730A3' }}><b>Realized revenue = —</b> (нет crypto-checkout). Показанная «Est. plan value» — оценка по снапшотам активных подписок, а не фактическая выручка. Margin считается как NetPlanValue − real all-in COGS.</div>
          </div>

          {/* Operation analytics */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Аналитика операций (real p50/p95 + pricing health)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                <thead><tr>
                  <th style={th}>Операция</th><th style={th}>Запросов</th><th style={th}>Юзеров</th><th style={th}>Success</th><th style={th}>Release%</th>
                  <th style={th}>Кредиты p50/p95</th><th style={th}>Cost avg</th><th style={th}>Cost p50/p95</th><th style={th}>Latency p50/p95</th><th style={th}>Pricing health</th>
                </tr></thead>
                <tbody>{(d.operations || []).length ? d.operations.map((o: any) => (
                  <tr key={o.operation} data-testid={`dash-op-${o.operation}`}>
                    <td style={td}><b>{o.operation}</b><div style={keySmall}>{o.estimateSource === 'historical_p95' ? 'estimate: p95' : 'estimate: baseline'}</div></td>
                    <td style={td}>{int(o.requests)}{o.failed ? <span style={{ color: '#DC2626' }}> / {int(o.failed)}✗</span> : null}</td>
                    <td style={td}>{int(o.uniqueUsers)}</td>
                    <td style={td}>{pct(o.successRatePct)}</td>
                    <td style={td}>{pct(o.releaseRatePct)}</td>
                    <td style={td}>{o.credits?.p50} / {o.credits?.p95}</td>
                    <td style={td}>{usd(o.costUsd?.avg, 5)}</td>
                    <td style={td}>{usd(o.costUsd?.p50, 5)} / {usd(o.costUsd?.p95, 5)}</td>
                    <td style={td}>{int(o.latencyMs?.p50)} / {int(o.latencyMs?.p95)} ms</td>
                    <td style={td}>{healthBadge(o.pricingHealth)}</td>
                  </tr>
                )) : <tr><td style={td} colSpan={10}>Реальных операций пока нет.</td></tr>}</tbody>
              </table>
            </div>
          </div>

          {/* Provider analytics */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Аналитика провайдеров / моделей</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                <thead><tr><th style={th}>Провайдер</th><th style={th}>Модель</th><th style={th}>Запросов</th><th style={th}>Error%</th><th style={th}>Input tok</th><th style={th}>Output tok</th><th style={th}>COGS</th><th style={th}>Cost p50/p95</th><th style={th}>Latency p50/p95</th></tr></thead>
                <tbody>{(d.providers || []).length ? d.providers.map((p: any, i: number) => (
                  <tr key={i}>
                    <td style={td}>{p.provider}</td><td style={td}><b>{p.model}</b></td><td style={td}>{int(p.requests)}</td><td style={td}>{pct(p.errorRatePct)}</td>
                    <td style={td}>{int(p.inputTokens)}</td><td style={td}>{int(p.outputTokens)}</td><td style={td}>{usd(p.costUsd?.total, 4)}</td>
                    <td style={td}>{usd(p.costUsd?.p50, 5)} / {usd(p.costUsd?.p95, 5)}</td><td style={td}>{int(p.latencyMs?.p50)} / {int(p.latencyMs?.p95)} ms</td>
                  </tr>
                )) : <tr><td style={td} colSpan={9}>Реальных данных провайдеров пока нет.</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

/* ================= AI CONTROL CENTER ================= */
/* ============ Ключи (status only — управление в Настройках) ============ */
const CredentialsStatus: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => { api.listCredentials().then(setData).catch((e) => toast.error(e.message)).finally(() => setBusy(false)); }, []);
  const active = (data?.items || []).find((c: any) => c.id === data?.activeCredentialId) || null;
  return (
    <div data-testid="ai-credentials-status">
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Ключи и провайдеры</div>
        <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 16 }}>
          Управление ключами вынесено в единый раздел <b>Настройки → Провайдер AI</b>. Здесь показан только текущий рабочий статус — секреты тут не редактируются.
        </div>
        {busy ? <div style={{ color: T.sub }}>Загрузка…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 18 }}>
            <div>
              <div style={label}>Активный провайдер</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{data?.activeProvider ? String(data.activeProvider).toUpperCase() : '—'}</div>
            </div>
            <div>
              <div style={label}>Источник (runtime)</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: data?.runtime?.credentialSource === 'MANAGED' ? '#15803D' : '#B45309' }}>
                {data?.runtime ? `${data.runtime.providerRuntime} · ${data.runtime.credentialSource}` : '—'}
              </div>
            </div>
            <div>
              <div style={label}>Учётная запись</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{active ? active.label : <span style={{ color: '#DC2626' }}>не активирована</span>}</div>
            </div>
            <div>
              <div style={label}>Ключ</div>
              <div style={{ fontSize: 14, fontFamily: 'monospace', color: T.ink }}>{active ? active.maskedSecret : '—'}</div>
            </div>
            <div>
              <div style={label}>Статус</div>
              <div>{credStatusBadge(active ? active.status : 'INACTIVE')}</div>
            </div>
            <div>
              <div style={label}>Посл. тест</div>
              <div style={{ fontSize: 13, color: T.ink }}>{active?.lastTestedAt ? `${active.lastTestStatus} · ${active.lastTestLatencyMs}ms` : '—'}</div>
            </div>
            <div>
              <div style={label}>Посл. использование</div>
              <div style={{ fontSize: 13, color: T.ink }}>{active?.stats?.lastUsedAt ? dt(active.stats.lastUsedAt) : '—'}</div>
            </div>
          </div>
        )}
        <a href="/admin/settings" data-testid="ai-open-provider-settings" style={{ ...btn('primary'), display: 'inline-block', textDecoration: 'none' }}>
          Открыть настройки провайдера →
        </a>
      </div>
    </div>
  );
};

export const AiControlCenter: React.FC = () => {
  const [sub, setSub] = useState('dashboard');
  return (
    <div data-testid="ai-control-center">
      <PageHeader
        title="FOMO AI"
        subtitle="Операционный центр FOMO AI: реальное использование, расход кредитов, экономика и себестоимость (COGS), маржа, знания, пользователи и модели. Ключи и провайдеры настраиваются в разделе «Настройки»."
        tabs={SUB_TABS}
        active={sub}
        onTab={(k) => setSub(k)}
        testIdPrefix="fomoai"
      />
      <div style={{ marginTop: 4 }} />
      {sub === 'dashboard' && <DashboardSub />}
      {sub === 'credentials' && <CredentialsStatus />}
      {sub === 'finance' && <FinanceSub />}
      {sub === 'rules' && <RulesSub />}
      {sub === 'usage' && <UsageSub />}
      {sub === 'economics' && <EconomicsSub />}
      {sub === 'knowledge' && <KnowledgeSub />}
      {sub === 'users' && <UsersSub />}
      {sub === 'models' && <ModelsSub />}
    </div>
  );
};

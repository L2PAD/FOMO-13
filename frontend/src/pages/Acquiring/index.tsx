import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/layouts/main_layout/layout';
import { T, PageHeader, HeaderTab } from '../Statistics/ui';
import { card, th, td, input, label, btn } from '../AccessMonetization/parts';
import * as api from '../AccessMonetization/service';
import { DataTable } from './DataTable';
import { Donut, TrendChart } from './Charts';
import { signCreateItem, signAdminResolve, signWithdrawUSD } from './ownerWallet';
import { useWallet } from '../../components/wallet/WalletProvider';

/* Phase H2 — FOMO Acquiring Control Center: single top-level CRM section for
   all real USDC money of the platform. Russian, existing design (white +
   underline tabs). Reuses the canonical money read-models + acquiring config. */

const usd = (n: any, d = 2) => `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const int = (n: any) => (Number(n) || 0).toLocaleString('en-US');
const dt = (d: any) => (d ? new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const short = (h: string) => (h && h.length > 16 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h || '—');
const badge = (bg: string, c: string): React.CSSProperties => ({ display: 'inline-block', background: bg, color: c, fontWeight: 700, fontSize: 11.5, padding: '3px 9px', borderRadius: 999 });
const WCOL: Record<string, [string, string]> = { REQUESTED: ['#FEF3C7', '#B45309'], RESERVED: ['#FEF3C7', '#B45309'], PROCESSING: ['#DBEAFE', '#1D4ED8'], ONCHAIN_PENDING: ['#DBEAFE', '#1D4ED8'], CONFIRMED: ['#D1FAE5', '#059669'], FAILED: ['#FEE2E2', '#DC2626'], RELEASED: ['#E2E8F0', '#475569'] };
const PCOL: Record<string, [string, string]> = { SETTLED: ['#D1FAE5', '#059669'], FAILED: ['#FEE2E2', '#DC2626'], REFUNDED: ['#E2E8F0', '#475569'], RESERVED: ['#FEF3C7', '#B45309'], CREATED: ['#F1F5F9', '#64748B'] };
const DCOL: Record<string, [string, string]> = { CONFIRMED: ['#D1FAE5', '#059669'], CREDITED: ['#D1FAE5', '#059669'], PENDING: ['#FEF3C7', '#B45309'], FAILED: ['#FEE2E2', '#DC2626'], REJECTED: ['#FEE2E2', '#DC2626'] };
const b = (map: Record<string, [string, string]>, s: string) => { const c = map[s] || ['#F1F5F9', '#64748B']; return <span style={badge(c[0], c[1])}>{s}</span>; };

/* ---- человекочитаемые лейблы (без UPPER_SNAKE, без vN, без слэшей) ---- */
const HUMAN: Record<string, string> = {
  WITHDRAWAL_SIGNER: 'Подписант выводов', CONTRACT_OWNER_SETTLEMENT: 'FOMO Custody Owner (сеттлмент покупок)',
  RPC_AUTH: 'RPC-доступ', INDEXER_API: 'Indexer API', WEBHOOK_SECRET: 'Webhook-секрет',
  CLIENT_TX_CONFIRM: 'Подтверждение транзакции клиентом', RPC_VERIFY: 'Проверка через RPC',
  MANUAL: 'Ручной режим', AUTO: 'Автоматический', EXECUTOR: 'Автоматический (executor)',
  NOT_CONFIGURED: 'Не настроен', CONFIGURED: 'Настроен', READY: 'Готов',
  ACTIVE: 'Активен', INACTIVE: 'Отключён', INVALID: 'Невалиден', REVOKED: 'Отозван',
  HEALTHY: 'В норме', OUT_OF_SYNC: 'Рассинхрон', IN_SYNC: 'Синхронизировано', PENDING: 'Ожидание',
  PER_PURCHASE_ITEM: 'Отдельный лот на каждую покупку', CONTRACT_OWNER: 'Владелец контракта (owner)',
  YES: 'Да', NO: 'Нет', TRUE: 'Да', FALSE: 'Нет',
  signer_configured: 'Подписант настроен', signer_valid: 'Подписант валиден',
  rpc_configured: 'RPC настроен', rpc_reachable: 'RPC доступен', chain_id: 'Chain ID',
  usdc_contract: 'Контракт USDC', gas_balance: 'Баланс на газ', treasury: 'Treasury',
  TREASURY_EOA: 'Кошелёк-treasury (EOA)', DIRECT_EOA_ERC20_TRANSFER: 'Прямой перевод ERC-20 с кошелька',
  NO_CREDIT_PENDING_MANUAL_REVIEW: 'Не зачислять — на ручную проверку', MAINNET: 'Основная сеть (mainnet)',
};
const human = (v: any): string => {
  if (v === null || v === undefined || v === '') return '—';
  const s = String(v);
  if (HUMAN[s]) return HUMAN[s];
  if (/^0x[0-9a-fA-F]{6,}$/.test(s)) return s; // адреса/хэши не трогаем
  if (/^[A-Z][A-Z0-9_]+$/.test(s)) return s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  return s;
};
// убрать хвост версии " vN" из названий сетей ("zkSync Era v1" → "zkSync Era")
const noVer = (s: any) => String(s || '').replace(/\s+v\d+$/i, '');


/* заголовок секции с фиолетовым подчёркиванием (как в блоке EarlyLand) */
const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${T.accent}` }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{children}</div>
    {right || null}
  </div>
);

const Kpi: React.FC<{ t: string; v: string; s?: string; tid?: string }> = ({ t, v, s, tid }) => (
  <div style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }} data-testid={tid}>
    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3, color: T.sub, fontWeight: 700 }}>{t}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginTop: 4 }}>{v}</div>
    {s ? <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>{s}</div> : null}
  </div>
);
const grid = (min = 190): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${min}px,1fr))`, gap: 12 });

/* Operator Control panel — consolidated global status + 4 blocks (P16). */
const cardBase: React.CSSProperties = { background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 };
const statusMeta: Record<string, { bg: string; fg: string; label: string; dot: string }> = {
  operational: { bg: '#DCFCE7', fg: '#15803D', label: 'Operational', dot: '#22C55E' },
  degraded: { bg: '#FEF3C7', fg: '#B45309', label: 'Degraded', dot: '#F59E0B' },
  action_required: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Action required', dot: '#EF4444' },
};
const HealthDot: React.FC<{ ok: boolean }> = ({ ok }) => (
  <span style={{ width: 9, height: 9, borderRadius: 999, background: ok ? '#22C55E' : '#EF4444', display: 'inline-block', flexShrink: 0 }} />
);
const sevColor = (s: string) => (s === 'critical' ? ['#FEE2E2', '#B91C1C'] : s === 'warning' ? ['#FEF3C7', '#B45309'] : ['#E0F2FE', '#0369A1']);
const AnalyticsBar: React.FC<{ data: { date: string; revenue: number }[] }> = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 72, marginTop: 6 }} data-testid="revenue-chart">
      {data.map((d, i) => (
        <div key={i} title={`${d.date}: ${d.revenue}`} style={{ flex: 1, minWidth: 2, height: `${Math.max(2, (d.revenue / max) * 100)}%`, background: d.revenue > 0 ? 'var(--color-accent, #04A584)' : '#E2E8F0', borderRadius: 3, transition: 'height 0.2s ease' }} />
      ))}
    </div>
  );
};

const RevenuePanel: React.FC<{ d: any; usd: (n: any, dd?: number) => string; int: (n: any) => string }> = ({ d, usd, int }) => {
  const p = d.purchases || {};
  const kpi = (label: string, value: string, testid?: string) => (
    <div style={cardBase} data-testid={testid}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{value}</div>
    </div>
  );
  const products = Object.entries(d.byProduct || {}) as [string, any][];
  return (
    <div style={{ marginBottom: 22 }} data-testid="revenue-analytics">
      <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 14 }}>Revenue Analytics</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 14 }}>
        {kpi('Revenue today', usd(d.revenue?.today), 'rev-today')}
        {kpi('Revenue 7d', usd(d.revenue?.d7), 'rev-7d')}
        {kpi('Revenue 30d', usd(d.revenue?.d30), 'rev-30d')}
        {kpi('Avg ticket', usd(d.avgTicket))}
        {kpi('Settlement success', `${d.settlementSuccess ?? 100}%`, 'rev-success')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <div style={cardBase}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Purchases</div>
          {[['Settled', p.settled, '#15803D'], ['Refunded', p.refunded, '#B45309'], ['Failed / review', p.failed, '#B91C1C']].map(([k, v, c]: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.sub }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{int(v || 0)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
            <span style={{ fontSize: 13, color: T.sub }}>Refunded amount</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{usd(d.refundedAmount)}</span>
          </div>
        </div>
        <div style={cardBase} data-testid="rev-by-product">
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Revenue by product</div>
          {products.length === 0 ? <div style={{ fontSize: 13, color: T.sub }}>Пока нет расчётанных покупок.</div> : products.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{k} <span style={{ color: T.sub, fontWeight: 400 }}>· {int(v.count)}</span></span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{usd(v.revenue)}</span>
            </div>
          ))}
        </div>
        <div style={cardBase}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Revenue · last 30 days</div>
          <AnalyticsBar data={d.chart || []} />
        </div>
      </div>
    </div>
  );
};

const OperatorControl: React.FC<{ d: any; usd: (n: any, dd?: number) => string; int: (n: any) => string }> = ({ d, usd, int }) => {
  const sm = statusMeta[d.globalStatus] || statusMeta.degraded;
  const r = d.reconciliation || {};
  return (
    <div style={{ marginBottom: 22 }} data-testid="operator-control">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>Operator Control</div>
        <span data-testid="operator-global-status" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: sm.bg, color: sm.fg, fontWeight: 800, fontSize: 13, padding: '7px 14px', borderRadius: 999 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: sm.dot, display: 'inline-block' }} /> {sm.label}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        {/* SYSTEM HEALTH */}
        <div style={cardBase} data-testid="op-system-health">
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>System health</div>
          {(d.systemHealth || []).map((h: any) => (
            <div key={h.key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <HealthDot ok={!!h.ok} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{h.label}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{h.detail}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: h.ok ? '#15803D' : '#B91C1C' }}>{h.ok ? 'OK' : 'CHECK'}</span>
            </div>
          ))}
        </div>
        {/* NEEDS ATTENTION */}
        <div style={cardBase} data-testid="op-needs-attention">
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Needs attention</div>
          {(d.needsAttention || []).length === 0 ? (
            <div style={{ fontSize: 13, color: '#15803D', fontWeight: 600, padding: '8px 0' }}>✓ Всё чисто — нет элементов, требующих внимания.</div>
          ) : (d.needsAttention || []).map((a: any) => {
            const c = sevColor(a.severity);
            return (
              <div key={a.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, color: T.ink }}>{a.label}</div>
                <span style={{ background: c[0], color: c[1], fontWeight: 800, fontSize: 12, padding: '2px 10px', borderRadius: 999, minWidth: 26, textAlign: 'center' }}>{int(a.count)}</span>
              </div>
            );
          })}
        </div>
        {/* RECONCILIATION */}
        <div style={cardBase} data-testid="op-reconciliation">
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Reconciliation</div>
          {[
            ['Активы контракта (on-chain)', r.totalAssets == null ? '—' : usd(r.totalAssets)],
            ['Обязательства (ledger)', r.liabilities == null ? '—' : usd(r.liabilities)],
            ['Платформенные средства', r.platformOwned == null ? '—' : usd(r.platformOwned)],
            ['Незавершённые сеттлменты', r.pendingFomoSettlement == null ? '—' : usd(r.pendingFomoSettlement)],
            ['Не классифицировано', r.unclassified == null ? '—' : usd(r.unclassified)],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12.5, color: T.sub }}>{k}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ ...badge(r.trueMismatch ? '#FEE2E2' : '#DCFCE7', r.trueMismatch ? '#B91C1C' : '#15803D') }} data-testid="op-true-mismatch">true mismatch: {String(!!r.trueMismatch)}</span>
            <span style={{ ...badge(r.doubleSpend?.anyRisk ? '#FEE2E2' : '#DCFCE7', r.doubleSpend?.anyRisk ? '#B91C1C' : '#15803D') }} data-testid="op-double-spend">double-spend: {r.doubleSpend?.anyRisk ? `${int(r.doubleSpend?.atRiskCount)} risk` : 'false'}</span>
          </div>
        </div>
        {/* TODAY */}
        <div style={cardBase} data-testid="op-today">
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Today &amp; live</div>
          {[
            ['Депозиты (24ч)', usd(d.today?.depositsSum)],
            ['Покупки (24ч)', usd(d.today?.purchasesSum)],
            ['Выводы в резерве', int(d.today?.withdrawalsPending)],
            ['Выводы подтверждены', int(d.today?.withdrawalsConfirmed)],
            ['Расчётные лоты (доступно)', int(d.today?.lotsAvailable)],
            ['Обязательства всего', d.today?.liability?.total == null ? '—' : usd(d.today.liability.total)],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12.5, color: T.sub }}>{k}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const TABS: HeaderTab[] = [
  { key: 'overview', label: 'Обзор' }, { key: 'balances', label: 'Балансы' }, { key: 'deposits', label: 'Депозиты' },
  { key: 'purchases', label: 'Покупки' }, { key: 'withdrawals', label: 'Выводы' }, { key: 'reconciliation', label: 'Reconciliation' },
  { key: 'networks', label: 'Сети и кошельки' }, { key: 'credentials', label: 'Ключи' }, { key: 'events', label: 'События' }, { key: 'diagnostics', label: 'Диагностика' },
];

const AcquiringPage: React.FC = () => {
  const [tab, setTab] = useState('overview');
  const [ov, setOv] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [recon, setRecon] = useState<any>(null);
  const [net, setNet] = useState<any>(null);
  const [creds, setCreds] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [diag, setDiag] = useState<any>(null);
  const [chain, setChain] = useState<any>(null);
  const [netForm, setNetForm] = useState<any>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [connectStatus, setConnectStatus] = useState<any>(null); // custody/connect-status
  const { address: ownerAddr, chainId: ownerChainId, connect: walletConnect } = useWallet(); // global CRM wallet
  const [ownerBusy, setOwnerBusy] = useState<string>(''); // purchaseId currently signing
  const [pwAmount, setPwAmount] = useState<string>(''); // platform withdraw amount
  const [pool, setPool] = useState<any>(null); // settlement lot pool summary
  const [lotPrice, setLotPrice] = useState<string>('49');
  const [lotQty, setLotQty] = useState<string>('10');
  const [lotMin, setLotMin] = useState<string>('10');
  const [lotBusy, setLotBusy] = useState<boolean>(false);
  const [lotProgress, setLotProgress] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [decomp, setDecomp] = useState<any>(null);
  const [opov, setOpov] = useState<any>(null); // operator control overview (global badge + 4 blocks)
  const [rev, setRev] = useState<any>(null); // revenue analytics (compact)
  const [depPolicy, setDepPolicy] = useState<any>(null);
  const [wdModel, setWdModel] = useState<any>(null);
  const [confirmDlg, setConfirmDlg] = useState<any>(null); // { title, lines[], warn, danger, onOk }
  const can = (p: string) => perms.includes(p);
  const askConfirm = (cfg: any) => setConfirmDlg(cfg);

  const err = (e: any) => toast.error(e?.message || 'Ошибка');
  useEffect(() => { api.getMyMoneyPermissions().then((r: any) => setPerms(r.permissions || [])).catch(() => setPerms([])); }, []);
  useEffect(() => {
    if (tab === 'overview') { api.getOperatorOverview().then(setOpov).catch(() => {}); api.getRevenueAnalytics().then(setRev).catch(() => {}); api.getMoneyOverview().then(setOv).catch(err); api.getMoneyStats(30).then(setStats).catch(() => {}); api.getCustodyDecomposition().then(setDecomp).catch(() => {}); }
    if (tab === 'balances') api.getMoneyBalances(200).then((r: any) => setBalances(r.items || [])).catch(err);
    if (tab === 'deposits') api.getAcqDeposits(200).then((r) => setDeposits(r.items || [])).catch(err);
    if (tab === 'purchases') { api.getMoneyPurchases(200).then((r: any) => setPurchases(r.items || [])).catch(err); api.getCustodyConnectStatus().then(setConnectStatus).catch(() => {}); }
    if (tab === 'withdrawals') api.getMoneyWithdrawals(200).then((r: any) => setWithdrawals(r.items || [])).catch(err);
    if (tab === 'reconciliation') api.getAcqReconciliation().then(setRecon).catch(err);
    if (tab === 'networks') api.getAcqNetwork('ZKSYNC_USDC').then((n) => { setNet(n); setNetForm(null); }).catch(err);
    if (tab === 'credentials') { api.getAcqCredentials().then((r) => setCreds(r.items || [])).catch(err); api.getExecutorReadiness('ZKSYNC_USDC').then(setReadiness).catch(() => {}); api.getDepositPolicy().then(setDepPolicy).catch(() => {}); api.getWithdrawalModel('ZKSYNC_USDC').then(setWdModel).catch(() => {}); api.getCustodyConnectStatus().then(setConnectStatus).catch(() => {}); api.getSettlementSummary().then(setPool).catch(() => {}); }
    if (tab === 'events') api.getAcqEvents(150).then((r) => setEvents(r.items || [])).catch(err);
    if (tab === 'diagnostics') { api.getAcqDiagnostics().then(setDiag).catch(err); api.getAcqAudit(100).then((r) => setAudit(r.items || [])).catch(err); api.getExecutorReadiness('ZKSYNC_USDC').then(setReadiness).catch(() => {}); }
  }, [tab]);

  const doExec = (w: any) => askConfirm({
    title: 'Подтвердите исполнение вывода', danger: true,
    lines: [['Пользователь', w.user?.email || w.userId], ['Сумма', usd(w.amount)], ['Сеть', w.network || 'ZKSYNC'], ['Назначение', w.destination]],
    warn: 'Операция будет выполнена в zkSync Era MAINNET и затронет реальные средства. После подтверждения перевод необратим.',
    onOk: () => api.executeWithdrawal(w.id).then((r: any) => { r.ok ? toast.success(`Исполнено: ${r.code}`) : toast.info(`${r.code}${r.fallback ? ' — доступно ручное подтверждение' : ''}`); api.getMoneyWithdrawals(200).then((x: any) => setWithdrawals(x.items || [])); }).catch(err),
  });
  const doConfirm = (id: string) => { const tx = window.prompt('txHash подтверждённой транзакции (можно пусто):') || ''; api.confirmWithdrawal(id, tx).then(() => { toast.success('Подтверждено'); api.getMoneyWithdrawals(200).then((x: any) => setWithdrawals(x.items || [])); }).catch(err); };
  const doRelease = (id: string) => { const reason = window.prompt('Причина освобождения резерва:') || 'manual release'; api.releaseWithdrawal(id, reason).then(() => { toast.success('Резерв освобождён'); api.getMoneyWithdrawals(200).then((x: any) => setWithdrawals(x.items || [])); }).catch(err); };
  const runConfirm = () => { const c = confirmDlg; if (!c) return; setConfirmDlg(null); c.onOk(); };
  const saveNet = () => {
    if (!netForm) return;
    const reason = window.prompt('Причина изменения (обязательна для аудита):');
    if (!reason) return toast.error('Причина обязательна');
    api.updateAcqNetwork('ZKSYNC_USDC', { ...netForm, reason }).then((n) => { setNet(n); setNetForm(null); toast.success(`Сохранено · версия ${n.version}`); }).catch(err);
  };
  const credAction = (id: string, action: 'activate' | 'deactivate' | 'revoke') => {
    const doIt = () => api.setAcqCredentialStatus(id, action).then(() => { toast.success('Готово'); api.getAcqCredentials().then((r) => setCreds(r.items || [])); api.getExecutorReadiness('ZKSYNC_USDC').then(setReadiness).catch(() => {}); }).catch(err);
    if (action === 'deactivate') return doIt();
    askConfirm({
      title: action === 'activate' ? 'Активировать executor-ключ' : 'Отозвать executor-ключ', danger: action === 'revoke',
      lines: [['Действие', action === 'activate' ? 'Активация подписанта выводов' : 'Отзыв ключа'], ['Сеть', 'zkSync Era MAINNET']],
      warn: action === 'activate' ? 'Этот ключ сможет подписывать реальные выводы USDC в zkSync Era Mainnet.' : 'Ключ будет отозван и больше не сможет подписывать выводы. Действие необратимо.',
      onOk: doIt,
    });
  };
  const testCred = (id: string) => api.testAcqCredential(id).then((r: any) => r.ok ? toast.success(r.detail) : toast.error(r.detail)).catch(err);

  /* ===== H5 — Owner settlement via Connect Wallet (no private keys) ===== */
  const ownerReady = (): boolean => {
    if (!connectStatus || !ownerAddr) return false;
    const match = String(ownerAddr).toLowerCase() === String(connectStatus.ownerOnChain || '').toLowerCase();
    const chainOk = !connectStatus.chainId || Number(ownerChainId) === Number(connectStatus.chainId);
    return match && chainOk;
  };
  const connectOwnerWallet = async () => {
    try {
      const cs = connectStatus || await api.getCustodyConnectStatus();
      if (!connectStatus) setConnectStatus(cs);
      const addParam = { chainId: cs.chainIdHex, chainName: cs.networkName || 'zkSync Era', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.era.zksync.io'], blockExplorerUrls: ['https://explorer.zksync.io/'] };
      const conn = await walletConnect({ chainIdHex: cs.chainIdHex, addParam });
      if (conn.address.toLowerCase() !== String(cs.ownerOnChain || '').toLowerCase()) {
        toast.error('Подключён не тот кошелёк. Нужен владелец контракта.');
      } else if (cs.chainId && Number(conn.chainId) !== Number(cs.chainId)) {
        toast.error(`Кошелёк в другой сети (chainId ${conn.chainId}). Переключитесь на ${cs.networkName}.`);
      } else {
        toast.success('Кошелёк-владелец подключён');
      }
    } catch (e: any) { err(e); }
  };
  /** Signs the next required owner step (createItem OR adminResolveUSD) or a refund. */
  const runOwnerAction = async (purchaseId: string, wantRefund = false) => {
    if (!ownerReady()) { toast.error('Сначала подключите кошелёк-владельца (вкладка «Ключи»).'); return connectOwnerWallet(); }
    const cs = connectStatus;
    setOwnerBusy(purchaseId);
    try {
      const prep = await api.prepareOwnerAction(purchaseId);
      if (wantRefund) {
        if (!prep.itemId) throw new Error('Нет расчётного лота для возврата');
        const tx = await signAdminResolve(cs.contract, cs.abi, String(prep.itemId), true);
        await api.submitOwnerAction(purchaseId, tx, 'refund');
        toast.success('Возврат подтверждён (on-chain)');
      } else if (prep.done) {
        toast.info(prep.message || 'Действие не требуется');
      } else if (prep.action === 'createItem') {
        const tx = await signCreateItem(cs.contract, cs.abi, prep.args);
        await api.submitOwnerAction(purchaseId, tx, 'createItem');
        toast.success('Расчётный лот создан. Теперь пользователь может оплатить.');
      } else if (prep.action === 'adminResolve') {
        const tx = await signAdminResolve(cs.contract, cs.abi, String(prep.itemId), false);
        await api.submitOwnerAction(purchaseId, tx, 'settle');
        toast.success('Сеттлмент подтверждён (on-chain)');
      } else {
        toast.info(prep.message || 'Нет доступного действия');
      }
      await api.getPurchaseChain(purchaseId).then(setChain).catch(() => {});
      api.getMoneyPurchases(200).then((x: any) => setPurchases(x.items || [])).catch(() => {});
    } catch (e: any) {
      err(e);
    } finally { setOwnerBusy(''); }
  };

  /** Owner batch-creates settlement lots at a price (one createItem per lot, signed in wallet). */
  const createLots = async () => {
    if (!ownerReady()) { toast.error('Подключите кошелёк-владельца.'); return connectOwnerWallet(); }
    const price = Number(lotPrice);
    const qty = Math.floor(Number(lotQty));
    if (!price || price <= 0) { toast.error('Укажите цену лота'); return; }
    if (!qty || qty <= 0 || qty > 50) { toast.error('Количество 1–50'); return; }
    const cs = connectStatus;
    setLotBusy(true);
    let ok = 0;
    try {
      for (let i = 0; i < qty; i++) {
        setLotProgress(`Лот ${i + 1} из ${qty}…`);
        const prep = await api.prepareSettlementItem(price);
        const tx = await signCreateItem(cs.contract, cs.abi, prep.args);
        await api.submitSettlementItem(price, tx);
        ok += 1;
        api.getSettlementSummary().then(setPool).catch(() => {});
      }
      toast.success(`Создано лотов: ${ok} по ${price} USDC`);
    } catch (e: any) {
      toast.error(`Создано ${ok}/${qty}. Прервано: ${e?.message || e}`);
    } finally {
      setLotBusy(false); setLotProgress('');
      api.getSettlementSummary().then(setPool).catch(() => {});
    }
  };

  /** Owner withdraws platform funds (owner's internal USD balance) via withdrawUSD. */
  const withdrawPlatformFunds = async () => {
    if (!ownerReady()) { toast.error('Подключите кошелёк-владельца.'); return connectOwnerWallet(); }
    const amt = Number(pwAmount);
    const maxBal = Number(connectStatus?.ownerUsdBalance || 0);
    if (!amt || amt <= 0) { toast.error('Введите сумму'); return; }
    if (amt > maxBal + 1e-9) { toast.error(`Недостаточно средств платформы (доступно ${maxBal} USDC)`); return; }
    setOwnerBusy('platform-withdraw');
    try {
      const cs = connectStatus;
      const tx = await signWithdrawUSD(cs.contract, cs.abi, amt, cs.token?.decimals || 6);
      toast.success(`Вывод отправлен: ${tx.slice(0, 10)}…`);
      setPwAmount('');
      setTimeout(() => api.getCustodyConnectStatus().then(setConnectStatus).catch(() => {}), 4000);
    } catch (e: any) { err(e); } finally { setOwnerBusy(''); }
  };

  const f = ov || {};
  const nf = netForm || net || {};

  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: '100%', padding: '28px 28px 48px' }} data-testid="acquiring-page">
        <style>{`::selection{background:${T.accent};color:#fff}`}</style>
        <PageHeader
          title="Эквайринг"
          subtitle="Управление собственным платёжным контуром FOMO: FOMO Balance, депозиты, покупки, выводы, сети и кошельки, ключи и расчёты платформы. Здесь находятся все реальные USDC-деньги. Отдельно от AI-кредитов и XP."
          tabs={TABS} active={tab} onTab={(k) => setTab(k)} testIdPrefix="acq"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '-6px 0 18px', flexWrap: 'wrap' }} data-testid="acq-mainnet-banner">
          <span style={{ ...badge('#EEF2FF', '#4F46E5'), fontSize: 12, letterSpacing: 0.2 }}>zkSync · основная сеть</span>
          <span style={{ fontSize: 12, color: T.sub, fontWeight: 500 }}>Здесь хранятся реальные средства пользователей (USDC).</span>
        </div>

        {tab === 'overview' && (ov ? (
          <div data-testid="acq-overview">
            {opov ? <OperatorControl d={opov} usd={usd} int={int} /> : null}
            {opov && (opov.systemHealth || []).some((h: any) => h.key === 'checkout' && !h.ok) ? (
              <div data-testid="lots-refill-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#92400E' }}>Расчётные лоты заканчиваются — checkout может быть недоступен для покупателей.</span>
                <button style={{ ...btn('primary'), padding: '8px 16px' }} onClick={() => setTab('credentials')} data-testid="lots-refill-cta">Пополнить лоты</button>
              </div>
            ) : null}
            {rev ? <RevenuePanel d={rev} usd={usd} int={int} /> : null}
            <div style={{ ...grid() }}>
              <Kpi t="Обязательства перед польз." v={usd(f.liability?.total)} s={`available ${usd(f.liability?.available, 0)} · reserved ${usd(f.liability?.reserved, 0)}`} tid="acq-liability" />
              <Kpi t="Плательщики" v={int(f.liability?.payers)} s="balance > 0" />
              <Kpi t="Пополнения (lifetime)" v={usd(f.deposits?.lifetime)} s={`30д ${usd(f.deposits?.last30d, 0)} · 24ч ${usd(f.deposits?.last24h, 0)}`} />
              <Kpi t="Покупки SETTLED" v={usd(f.purchases?.volumeLifetime)} s={`${int(f.purchases?.countLifetime)} шт`} />
              <Kpi t="Realized revenue" v={usd(f.realizedRevenue?.total)} s={`AI ${usd(f.realizedRevenue?.fomoAiUsd, 0)}`} tid="acq-revenue" />
              <Kpi t="Выводы подтв." v={usd(f.withdrawals?.confirmedLifetime)} s={`pending ${int(f.withdrawals?.pending)} · failed ${int(f.withdrawals?.failed)}`} />
              <Kpi t="Refunds" v={usd(f.refunds?.lifetime)} s={`${int(f.refunds?.count)} шт`} />
              <Kpi t="Сеттлменты" v={`${int(f.settlements?.pending)} / ${int(f.settlements?.failed)}`} s="в ожидании / с ошибкой" />
            </div>
            <div style={{ fontSize: 12, color: T.sub, margin: '12px 0 18px' }}>Сеть: {noVer(f.network?.name)} · {f.network?.tokenSymbol}. Деньги, AI-кредиты и XP — раздельные балансы.</div>
            {stats ? (
          <div data-testid="acq-stats">
            <div style={{ ...grid(210), marginBottom: 18 }}>
              <Kpi t="На смарт-контракте" v={stats.kpis?.onContract == null ? '—' : usd(stats.kpis.onContract)} s="реально держит контракт (on-chain)" tid="acq-stats-oncontract" />
              <Kpi t="В системе (баланс)" v={usd(stats.kpis?.inSystem)} s="сумма балансов пользователей" tid="acq-stats-insystem" />
              <Kpi t="Чистый приток" v={usd(stats.kpis?.netInflow)} s="депозиты − выводы" />
              <Kpi t="Запросы на вывод" v={int(stats.kpis?.withdrawalRequests)} s={`${int(stats.kpis?.withdrawalsConfirmed)} подтверждено`} />
              <Kpi t="Дельта с контрактом" v={stats.kpis?.reconDelta == null ? '—' : usd(stats.kpis.reconDelta)} s="on-chain − система" tid="acq-stats-delta" />
            </div>
            <div style={{ ...card }}>
              <SectionTitle>Динамика: депозиты и выводы (30 дней)</SectionTitle>
              <TrendChart series={stats.series || []} keys={[{ key: 'deposits', label: 'Депозиты', color: '#059669' }, { key: 'withdrawals', label: 'Выводы', color: '#DC2626' }, { key: 'purchases', label: 'Покупки', color: '#4F46E5' }]} />
            </div>
            <div style={{ ...grid(360) }}>
              <div style={{ ...card }}>
                <SectionTitle>Распределение средств</SectionTitle>
                {stats.distribution?.length ? <Donut data={stats.distribution.map((d: any) => ({ label: d.label, value: d.value }))} centerValue={usd(stats.kpis?.inSystem, 0)} centerLabel="в системе" /> : <div style={{ color: T.sub, fontSize: 13 }}>Пока нет данных для распределения.</div>}
              </div>
              <div style={{ ...card }}>
                <SectionTitle>Сверка с блокчейном</SectionTitle>
                <div style={{ fontSize: 13, color: T.ink, lineHeight: 2 }}>
                  На смарт-контракте (on-chain): <b>{stats.kpis?.onContract == null ? '—' : usd(stats.kpis.onContract)}</b><br />
                  В системе (сумма балансов): <b>{usd(stats.kpis?.inSystem)}</b><br />
                  Разница (контракт − система): <b style={{ color: (stats.kpis?.reconDelta || 0) >= 0 ? '#059669' : '#DC2626' }}>{stats.kpis?.reconDelta == null ? '—' : usd(stats.kpis.reconDelta)}</b>
                </div>
                <div style={{ fontSize: 11.5, color: T.sub, marginTop: 10 }}>Положительная разница — на контракте есть невзятые средства (например, ещё не зачисленные депозиты). Отрицательная требует проверки.</div>
                {decomp ? (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }} data-testid="acq-decomposition">
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, marginBottom: 8, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span>Разбор баланса контракта ({decomp.totalAssets == null ? '—' : usd(decomp.totalAssets)})</span>
                      {decomp.status === 'READS_UNAVAILABLE' ? (
                        <span style={{ ...badge('#FEF3C7', '#B45309'), fontSize: 11 }}>Данные с контракта недоступны</span>
                      ) : (
                        <span style={{ ...badge(decomp.trueMismatch ? '#FEE2E2' : '#D1FAE5', decomp.trueMismatch ? '#DC2626' : '#059669'), fontSize: 11 }}>{decomp.trueMismatch ? 'Критично: mismatch' : (decomp.status === 'HEALTHY_WITH_UNCLASSIFIED' ? 'В норме (есть legacy/OTC)' : 'В норме')}</span>
                      )}
                    </div>
                    {(decomp.components || []).map((c: any) => (
                      <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', color: c.key === 'unclassified' && decomp.trueMismatch ? '#DC2626' : T.ink }}>
                        <span style={{ color: T.sub }}>{c.label}</span>
                        <b>{c.value == null ? '—' : usd(c.value)}</b>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>{decomp.note}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
            ) : null}
          </div>
        ) : <div style={{ color: T.sub }}>Загрузка…</div>)}

        {tab === 'balances' && (
          <div style={card} data-testid="acq-balances">
            <DataTable
              testid="acq-balances-table" rows={balances}
              searchKeys={['email', 'wallet', 'userId', 'username']}
              searchPlaceholder="Поиск по кошельку, почте или ID…"
              initialSort={{ key: 'total', dir: 'desc' }}
              emptyText="Нет балансов."
              columns={[
                { key: 'user', label: 'Пользователь', sort: (r) => r.email || r.wallet || r.userId, render: (r) => (<div><div style={{ fontWeight: 600 }}>{r.email || '—'}</div><div style={{ fontSize: 11, fontFamily: 'monospace', color: T.sub }}>{r.wallet ? short(r.wallet) : r.userId}</div></div>) },
                { key: 'available', label: 'Доступно', sort: (r) => r.available, render: (r) => usd(r.available) },
                { key: 'reserved', label: 'В резерве', sort: (r) => r.reserved, render: (r) => usd(r.reserved) },
                { key: 'total', label: 'Всего', sort: (r) => r.total, render: (r) => <b>{usd(r.total)}</b> },
                { key: 'lastActivity', label: 'Активность', sort: (r) => r.lastActivity || '', render: (r) => (r.lastActivity ? dt(r.lastActivity) : '—') },
              ]}
            />
          </div>
        )}

        {tab === 'deposits' && (
          <div style={card} data-testid="acq-deposits">
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>Подтверждение транзакции в блокчейне и зачисление на баланс — разные события.</div>
            <DataTable
              testid="acq-deposits-table" rows={deposits}
              searchKeys={['user.email', 'user.wallet', 'walletAddress', 'txHash', 'userId']}
              searchPlaceholder="Поиск по кошельку, почте или txHash…"
              initialSort={{ key: 'createdAt', dir: 'desc' }}
              emptyText="Депозитов ещё нет."
              filters={[{ key: 'status', label: 'Все статусы', options: [{ value: 'CONFIRMED', label: 'Подтверждён' }, { value: 'PENDING', label: 'Ожидание' }, { value: 'FAILED', label: 'Ошибка' }] }]}
              columns={[
                { key: 'user', label: 'Пользователь', sort: (r) => r.user?.email || r.userId, render: (r) => r.user?.email || (r.user?.wallet ? short(r.user.wallet) : r.userId) },
                { key: 'network', label: 'Сеть', render: (r) => noVer(r.network) },
                { key: 'token', label: 'Токен' },
                { key: 'amount', label: 'Сумма', sort: (r) => r.amount, render: (r) => usd(r.amount) },
                { key: 'txHash', label: 'Транзакция', mono: true, render: (r) => short(r.txHash) },
                { key: 'status', label: 'Статус', render: (r) => b(DCOL, r.status) },
                { key: 'ledgerCredited', label: 'Зачислено', sort: (r) => (r.ledgerCredited ? 1 : 0), render: (r) => (r.ledgerCredited ? b(DCOL, 'CREDITED') : b(DCOL, 'PENDING')) },
                { key: 'createdAt', label: 'Создан', sort: (r) => r.createdAt || '', render: (r) => dt(r.createdAt) },
              ]}
            />
          </div>
        )}

        {tab === 'purchases' && (
          <div style={card} data-testid="acq-purchases">
            <DataTable
              testid="acq-purchases-table" rows={purchases}
              searchKeys={['user.email', 'user.wallet', 'userId', 'productCode', 'planCode', 'id']}
              searchPlaceholder="Поиск по кошельку, почте, продукту…"
              initialSort={{ key: 'createdAt', dir: 'desc' }}
              emptyText="Покупок ещё нет."
              filters={[{ key: 'status', label: 'Все статусы', options: [{ value: 'SETTLED', label: 'Завершена' }, { value: 'CUSTODY_LOCKED', label: 'Средства заблокированы' }, { value: 'OWNER_SETTLEMENT_PENDING', label: 'Ожидает сеттлмента' }, { value: 'REFUNDED', label: 'Возврат' }, { value: 'FAILED', label: 'Ошибка' }], match: (r, v) => String(r.status) === v }]}
              columns={[
                { key: 'user', label: 'Пользователь', sort: (r) => r.user?.email || r.userId, render: (r) => r.user?.email || (r.user?.wallet ? short(r.user.wallet) : r.userId) },
                { key: 'productCode', label: 'Продукт', render: (r) => `${r.productCode}${r.isRenewal ? ' (продление)' : ''}` },
                { key: 'amount', label: 'Сумма', sort: (r) => r.amount, render: (r) => usd(r.amount) },
                { key: 'status', label: 'Статус', render: (r) => b(PCOL, r.status) },
                { key: 'settledAt', label: 'Сеттлмент', sort: (r) => r.settledAt || '', render: (r) => (r.settledAt ? dt(r.settledAt) : '—') },
                { key: '_chain', label: '', sortable: false, render: (r) => <button style={btn('ghost')} data-testid={`acq-chain-${r.id}`} onClick={() => api.getPurchaseChain(r.id).then(setChain).catch(err)}>Цепочка</button> },
              ]}
            />
          </div>
        )}

        {tab === 'withdrawals' && (
          <div style={card} data-testid="acq-withdrawals">
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>Каждый вывод проходит защищённые этапы; повторные подтверждения безопасны.</div>
            <DataTable
              testid="acq-withdrawals-table" rows={withdrawals}
              searchKeys={['user.email', 'user.wallet', 'destination', 'txHash', 'userId']}
              searchPlaceholder="Поиск по кошельку, почте или адресу…"
              initialSort={{ key: 'requestedAt', dir: 'desc' }}
              emptyText="Активных выводов нет."
              filters={[{ key: 'moneyStatus', label: 'Все статусы', options: [{ value: 'REQUESTED', label: 'Запрошен' }, { value: 'RESERVED', label: 'Зарезервирован' }, { value: 'PROCESSING', label: 'В обработке' }, { value: 'CONFIRMED', label: 'Подтверждён' }, { value: 'FAILED', label: 'Ошибка' }, { value: 'RELEASED', label: 'Резерв снят' }] }]}
              columns={[
                { key: 'user', label: 'Пользователь', sort: (r) => r.user?.email || r.userId, render: (r) => r.user?.email || (r.user?.wallet ? short(r.user.wallet) : r.userId) },
                { key: 'amount', label: 'Сумма', sort: (r) => r.amount, render: (r) => usd(r.amount) },
                { key: 'destination', label: 'Назначение', mono: true, render: (r) => short(r.destination) },
                { key: 'moneyStatus', label: 'Статус', render: (r) => b(WCOL, r.moneyStatus) },
                { key: 'txHash', label: 'Транзакция', mono: true, render: (r) => short(r.txHash) },
                { key: '_act', label: 'Действия', sortable: false, render: (w) => { const canOp = ['REQUESTED', 'RESERVED', 'PROCESSING'].includes(w.moneyStatus); return canOp ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{can('MONEY_WITHDRAW_EXECUTE') ? <button style={btn('ghost')} data-testid={`acq-wd-exec-${w.id}`} onClick={() => doExec(w)}>Исполнить</button> : null}{can('MONEY_WITHDRAW_EXECUTE') ? <button style={btn('ghost')} onClick={() => doConfirm(w.id)}>Подтвердить</button> : null}{can('MONEY_WITHDRAW_REVIEW') ? <button style={btn('ghost')} onClick={() => doRelease(w.id)}>Освободить</button> : null}{!can('MONEY_WITHDRAW_EXECUTE') && !can('MONEY_WITHDRAW_REVIEW') ? <span style={{ color: T.sub, fontSize: 11.5 }}>нет прав</span> : null}</div> : <span style={{ color: T.sub }}>—</span>; } },
              ]}
            />
          </div>
        )}

        {tab === 'reconciliation' && (recon ? (
          <div style={card} data-testid="acq-reconciliation">
            <div style={{ ...grid(180), marginBottom: 12 }}>
              <Kpi t="Ledger liabilities" v={usd(recon.ledgerLiability)} />
              <Kpi t="Calculated" v={usd(recon.calculatedLiability)} />
              <Kpi t="Difference" v={usd(recon.difference)} tid="acq-recon-diff" />
            </div>
            <div style={{ ...badge(recon.status === 'HEALTHY' ? '#D1FAE5' : '#FEE2E2', recon.status === 'HEALTHY' ? '#059669' : '#DC2626'), fontSize: 13 }} data-testid="acq-recon-status">{recon.status}</div>
            {recon.decomposition ? (
              <div style={{ ...card, background: '#F8FAFC', marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: T.ink }}>Treasury decomposition</div>
                {[['Средства пользователей', recon.decomposition.userLiabilities], ['Средства платформы', recon.decomposition.realizedPlatformFunds], ['Ожидают вывода', recon.decomposition.pendingOutflow]].map(([k, v]: any) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12.5 }}><span style={{ color: T.sub }}>{k}</span><span style={{ color: T.ink }}>{usd(v)}</span></div>
                ))}
                <div style={{ fontSize: 11.5, color: T.sub, marginTop: 8 }}>{recon.decomposition.note}</div>
              </div>
            ) : null}
          </div>
        ) : <div style={{ color: T.sub }}>Загрузка…</div>)}

        {tab === 'networks' && (net ? (
          <div style={card} data-testid="acq-networks">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{net.displayName} · {net.token?.symbol} <span style={{ ...badge('#EDE9FE', '#6D28D9') }}>v{net.version}</span></div>
              <div style={{ ...badge(net.executor?.status === 'READY' ? '#D1FAE5' : '#FEF3C7', net.executor?.status === 'READY' ? '#059669' : '#B45309') }}>Executor: {net.executor?.status}</div>
            </div>
            <div style={{ ...grid(230) }}>
              <div><label style={label}>Chain ID</label><input style={input} value={nf.chainId ?? ''} onChange={(e) => setNetForm({ ...nf, chainId: Number(e.target.value) })} data-testid="acq-net-chainid" /></div>
              <div><label style={label}>RPC URL</label><input style={input} value={nf.rpcUrl ?? ''} onChange={(e) => setNetForm({ ...nf, rpcUrl: e.target.value })} placeholder="https://…" data-testid="acq-net-rpc" /></div>
              <div><label style={label}>Explorer URL</label><input style={input} value={nf.explorerUrl ?? ''} onChange={(e) => setNetForm({ ...nf, explorerUrl: e.target.value })} /></div>
              <div><label style={label}>Confirmations</label><input style={input} type="number" value={nf.confirmationsRequired ?? ''} onChange={(e) => setNetForm({ ...nf, confirmationsRequired: Number(e.target.value) })} /></div>
            </div>
            <div style={{ ...card, background: '#F8FAFC', marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Receiving / Treasury address (публичный)</div>
              <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 8 }}>Публичный адрес приёма USDC. Private key здесь НЕ хранится (см. вкладку «Ключи»).</div>
              <input style={{ ...input, fontFamily: 'monospace' }} value={nf.treasuryAddress ?? ''} onChange={(e) => setNetForm({ ...nf, treasuryAddress: e.target.value.trim() })} placeholder="0x…" data-testid="acq-net-treasury" />
            </div>
            <div style={{ ...grid(190), marginTop: 14 }}>
              <div><label style={label}>Мин. депозит</label><input style={input} type="number" value={nf.token?.minDeposit ?? ''} onChange={(e) => setNetForm({ ...nf, token: { ...nf.token, minDeposit: Number(e.target.value) } })} /></div>
              <div><label style={label}>Мин. вывод</label><input style={input} type="number" value={nf.token?.minWithdrawal ?? ''} onChange={(e) => setNetForm({ ...nf, token: { ...nf.token, minWithdrawal: Number(e.target.value) } })} /></div>
              <div><label style={label}>Комиссия вывода</label><input style={input} type="number" value={nf.token?.withdrawalFee ?? ''} onChange={(e) => setNetForm({ ...nf, token: { ...nf.token, withdrawalFee: Number(e.target.value) } })} /></div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button style={btn('primary')} onClick={saveNet} disabled={!netForm || !can('MONEY_SETTINGS_EDIT')} data-testid="acq-net-save">Сохранить изменения</button>
              {netForm ? <button style={btn('ghost')} onClick={() => setNetForm(null)}>Отмена</button> : null}
              {!can('MONEY_SETTINGS_EDIT') ? <span style={{ fontSize: 11.5, color: '#B45309', alignSelf: 'center' }}>Изменение сети/treasury доступно только Superadmin.</span> : null}
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginTop: 8 }}>Изменение увеличивает версию конфига; прошлые депозиты/покупки сохраняют свой снимок сети. Все изменения — в «Диагностика → Аудит».</div>
          </div>
        ) : <div style={{ color: T.sub }}>Загрузка…</div>)}

        {tab === 'credentials' && (
          <div data-testid="acq-credentials">
            {readiness ? (
              <div style={{ ...card }} data-testid="acq-readiness">
                <SectionTitle right={<div style={{ ...badge(readiness.status === 'READY' ? '#D1FAE5' : readiness.status === 'NOT_CONFIGURED' ? '#E2E8F0' : '#FEE2E2', readiness.status === 'READY' ? '#059669' : readiness.status === 'NOT_CONFIGURED' ? '#475569' : '#DC2626'), fontSize: 12.5 }} data-testid="acq-readiness-status">{human(readiness.status)}</div>}>Готовность подписанта выводов</SectionTitle>
                <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10, marginTop: -6 }}>
                  Подписант выводов {readiness.signer?.configured ? 'настроен' : 'ещё не настроен'} · RPC {readiness.network?.rpcReachable ? 'в норме' : 'не настроен'}. Приватный ключ никогда не отображается.
                </div>
                <div style={{ ...grid(220) }}>
                  {(readiness.checks || []).map((c: any) => (
                    <div key={c.key} style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 11px', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', flex: '0 0 auto', background: c.ok ? '#059669' : '#CBD5E1' }} />
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: c.ok ? T.ink : T.sub }}>{human(c.key)}<span style={{ fontSize: 11, fontWeight: 500, color: c.ok ? '#059669' : '#94A3B8', marginLeft: 6 }}>{c.ok ? 'готово' : 'нет'}</span></div>
                    </div>
                  ))}
                </div>
                {readiness.status === 'NOT_CONFIGURED' ? (
                  <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 10 }}>Автоматический вывод не настроен. В новой модели выводы <b>подписывают сами пользователи</b> своим кошельком (withdrawUSD), поэтому серверный подписант выводов не требуется. Ручное подтверждение выводов доступно как запасной вариант.</div>
                ) : null}
              </div>
            ) : null}
            {connectStatus ? (
              <div style={{ ...card }} data-testid="acq-owner-connect">
                <SectionTitle right={<div style={{ ...badge(ownerReady() ? '#D1FAE5' : '#E2E8F0', ownerReady() ? '#059669' : '#475569'), fontSize: 12.5 }} data-testid="acq-owner-connect-status">{ownerReady() ? 'Кошелёк подключён' : (ownerAddr ? 'Не тот кошелёк' : 'Не подключён')}</div>}>FOMO Custody Owner — подписант сеттлмента покупок</SectionTitle>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 12, marginTop: -6, lineHeight: 1.7 }}>
                  Сеттлмент покупок подписывается <b>кошельком-владельцем контракта прямо в браузере</b> (MetaMask). Приватный ключ никуда не передаётся и нигде не хранится. Подключите кошелёк <span style={{ fontFamily: 'monospace' }}>{connectStatus.ownerOnChain ? short(connectStatus.ownerOnChain) : '—'}</span>, после чего на вкладке «Покупки» станут доступны подпись сеттлмента и возврата.
                </div>
                <div style={{ ...grid(240) }}>
                  {[['Владелец контракта (on-chain)', connectStatus.ownerOnChain || '—'], ['Подключённый кошелёк', ownerAddr || '—'], ['Совпадение', ownerAddr ? (ownerReady() ? 'Да' : 'Нет') : '—'], ['Контракт custody', connectStatus.contract], ['Сеть', `${connectStatus.networkName} (chainId ${connectStatus.chainId})`]].map(([k, v]: any) => (
                    <div key={k} style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 11px' }}>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3, color: T.sub, fontWeight: 700 }}>{k}</div>
                      <div style={{ fontSize: 12, color: k === 'Совпадение' ? (ownerReady() ? '#059669' : (ownerAddr ? '#DC2626' : T.sub)) : T.ink, fontWeight: 600, marginTop: 3, wordBreak: 'break-all', fontFamily: /0x/.test(String(v)) ? 'monospace' : undefined }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                  <button style={btn('primary')} onClick={connectOwnerWallet} data-testid="acq-owner-connect-btn">{ownerAddr ? 'Переподключить кошелёк' : 'Подключить кошелёк'}</button>
                  {ownerAddr && !ownerReady() ? <span style={{ fontSize: 11.5, color: '#DC2626' }}>Подключён {short(ownerAddr)} — это не владелец контракта{connectStatus.chainId && Number(ownerChainId) !== Number(connectStatus.chainId) ? ` или не та сеть (chainId ${ownerChainId})` : ''}.</span> : null}
                  {ownerReady() ? <span style={{ fontSize: 11.5, color: '#059669' }}>Готово. Подпись сеттлмента/возврата доступна во вкладке «Покупки».</span> : null}
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 10 }}>Стратегия лота: отдельный лот на каждую покупку · без комиссии (takeFee=false) · продавец = владелец контракта. Комиссия маркетплейса 5% не применяется к подпискам.</div>
              </div>
            ) : null}

            {connectStatus && ownerReady() ? (
              <div style={{ ...card }} data-testid="acq-platform-withdraw">
                <SectionTitle right={<div style={{ ...badge('#EEF2FF', '#4338CA'), fontSize: 12.5 }}>{Number(connectStatus.ownerUsdBalance || 0).toFixed(2)} USDC на контракте</div>}>Вывод средств платформы</SectionTitle>
                <div style={{ fontSize: 12, color: T.sub, marginTop: -6, marginBottom: 12, lineHeight: 1.7 }}>
                  Доход платформы копится как внутренний баланс владельца на контракте (после сеттлмента покупок). Вывести можно подписью кошелька-владельца: <span style={{ fontFamily: 'monospace' }}>withdrawUSD(amount)</span> — средства уйдут на адрес владельца <span style={{ fontFamily: 'monospace' }}>{short(connectStatus.ownerOnChain)}</span>. Средства не пересылаются автоматически — лежат на контракте до вывода.
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={label}>Сумма (USDC)</label>
                    <input style={input} type="number" min={0} step="0.01" placeholder="0.00" value={pwAmount} onChange={(e) => setPwAmount(e.target.value)} data-testid="acq-pw-amount" />
                  </div>
                  <button style={btn('ghost')} onClick={() => setPwAmount(String(Number(connectStatus.ownerUsdBalance || 0)))} data-testid="acq-pw-max">Максимум</button>
                  <button style={btn('primary')} disabled={ownerBusy === 'platform-withdraw' || !Number(connectStatus.ownerUsdBalance)} onClick={withdrawPlatformFunds} data-testid="acq-pw-withdraw">{ownerBusy === 'platform-withdraw' ? 'Подпись…' : 'Вывести средства'}</button>
                </div>
                {!Number(connectStatus.ownerUsdBalance) ? <div style={{ fontSize: 11.5, color: T.sub, marginTop: 10 }}>Пока нет средств платформы на контракте (появятся после сеттлмента реальных покупок).</div> : null}
              </div>
            ) : null}

            {connectStatus && ownerReady() ? (
              (() => {
                const row = (pool?.prices || []).find((p: any) => Number(p.price) === Number(lotPrice));
                const avail = row?.available || 0;
                const low = avail < Number(lotMin || 0);
                return (
                  <div style={{ ...card }} data-testid="acq-lots">
                    <SectionTitle right={<div style={{ ...badge(low ? '#FEF3C7' : '#D1FAE5', low ? '#B45309' : '#059669'), fontSize: 12.5 }}>{avail} готово{low ? ' · низкий запас' : ''}</div>}>Расчёты через FOMO Balance — лоты</SectionTitle>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: -6, marginBottom: 12, lineHeight: 1.7 }}>
                      Публичная покупка потребляет по одному заранее подготовленному расчётному лоту (custody item) на нужную цену. Владелец создаёт запас лотов заранее подписью в кошельке (по одной транзакции на лот, без комиссии). Пользователь про «лоты» ничего не видит.
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
                      <div style={{ width: 130 }}><label style={label}>Цена лота (USDC)</label><input style={input} type="number" min={0} step="0.01" value={lotPrice} onChange={(e) => setLotPrice(e.target.value)} data-testid="acq-lot-price" /></div>
                      <div style={{ width: 120 }}><label style={label}>Создать шт.</label><input style={input} type="number" min={1} max={50} value={lotQty} onChange={(e) => setLotQty(e.target.value)} data-testid="acq-lot-qty" /></div>
                      <div style={{ width: 130 }}><label style={label}>Мин. запас</label><input style={input} type="number" min={0} value={lotMin} onChange={(e) => setLotMin(e.target.value)} data-testid="acq-lot-min" /></div>
                      <button style={btn('primary')} disabled={lotBusy} onClick={createLots} data-testid="acq-lot-create">{lotBusy ? (lotProgress || 'Подпись…') : 'Создать лоты'}</button>
                    </div>
                    {low ? <div style={{ fontSize: 11.5, color: '#B45309', marginBottom: 10 }}>Внимание: доступных лотов ({avail}) меньше минимального запаса ({lotMin}). Пополните пул, иначе покупки будут ждать провижининга.</div> : null}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead><tr style={{ textAlign: 'left', color: T.sub }}><th style={{ padding: '4px 0' }}>Цена</th><th>Доступно</th><th>Зарезервировано</th><th>Использовано</th></tr></thead>
                      <tbody>
                        {(pool?.prices || []).length ? (pool.prices).map((p: any) => (
                          <tr key={p.price} style={{ borderTop: `1px solid ${T.border}` }}>
                            <td style={{ padding: '6px 0', fontWeight: 700 }}>{Number(p.price).toFixed(2)} USDC</td>
                            <td style={{ color: p.available < 1 ? '#B45309' : '#059669', fontWeight: 700 }}>{p.available}</td>
                            <td>{p.reserved}</td>
                            <td style={{ color: T.sub }}>{p.consumed}</td>
                          </tr>
                        )) : <tr><td colSpan={4} style={{ padding: '8px 0', color: T.sub }}>Пул пуст — создайте лоты.</td></tr>}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>Сеть: zkSync Era · способ расчёта: FOMO Custody Contract · комиссия 0.</div>
                  </div>
                );
              })()
            ) : null}
            {(wdModel || depPolicy) ? (
              <div style={{ ...card }} data-testid="acq-forensic">
                <SectionTitle>Модель исполнения и политика депозитов</SectionTitle>
                <div style={{ ...grid(280) }}>
                  {wdModel ? (
                    <div style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }} data-testid="acq-wd-model">
                      <div style={{ fontSize: 12, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Исполнение вывода</div>
                      <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                        Источник средств: <b style={{ color: T.ink }}>{human(wdModel.fundsSource)}</b><br />
                        Модель: {human(wdModel.contractModel)}<br />
                        Подписант: <span style={{ fontFamily: 'monospace' }}>{wdModel.transactionSigner || '—'}</span><br />
                        Источник USDC: <span style={{ fontFamily: 'monospace' }}>{wdModel.usdcSource || '—'}</span><br />
                        Плательщик газа: <span style={{ fontFamily: 'monospace' }}>{wdModel.gasPayer || '—'}</span><br />
                        Treasury депозитов: <span style={{ fontFamily: 'monospace' }}>{wdModel.depositTreasury}</span><br />
                        Подписант = treasury: <b>{human(String(wdModel.signerEqualsTreasury).toUpperCase())}</b>
                      </div>
                      {(wdModel.requirements || []).map((r: string, i: number) => <div key={i} style={{ fontSize: 11, color: '#B45309', marginTop: 6 }}>• {r}</div>)}
                    </div>
                  ) : null}
                  {depPolicy ? (
                    <div style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }} data-testid="acq-dep-policy">
                      <div style={{ fontSize: 12, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Политика зачисления депозитов</div>
                      <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                        Сеть: <b style={{ color: T.ink }}>{depPolicy.isMainnet ? 'Основная сеть (mainnet)' : 'тестовая сеть'}</b><br />
                        Режим: <b>{human(depPolicy.mode)}</b><br />
                        Зачисление доступно сейчас: <b style={{ color: depPolicy.creditAllowed ? '#059669' : '#DC2626' }}>{depPolicy.creditAllowed ? 'Да' : 'Нет'}</b><br />
                        Если RPC недоступен: <b>{human(depPolicy.onRpcUnavailable)}</b>
                      </div>
                      <div style={{ fontSize: 11, color: '#B45309', marginTop: 6 }}>{depPolicy.note}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div style={{ ...card, background: '#F8FAFC' }}>
              <SectionTitle>Сервисные секреты (без приватных ключей)</SectionTitle>
              <div style={{ fontSize: 11.5, color: T.sub, marginTop: -6 }}>
                Приватные ключи для сеттлмента и выводов здесь <b>не хранятся</b>. Сеттлмент покупок подписывается кошельком-владельцем через «Подключить кошелёк» (панель выше), а выводы подписывают сами пользователи. Ниже — только несекретные сервисные доступы (RPC/Indexer/Webhook), если они заведены.
              </div>
            </div>
            <div style={card}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Название</th><th style={th}>Назначение</th><th style={th}>Секрет</th><th style={th}>Статус</th><th style={th}>Создан</th><th style={th}>Действия</th></tr></thead>
                <tbody>{creds.length ? creds.map((c) => (
                  <tr key={c.id} data-testid={`acq-cred-${c.id}`}>
                    <td style={td}>{c.label}</td><td style={td}>{human(c.purpose)}</td><td style={{ ...td, fontFamily: 'monospace' }}>{c.maskedSecret}</td>
                    <td style={td}>{(() => { const cc: any = { ACTIVE: ['#D1FAE5', '#059669'], INACTIVE: ['#E2E8F0', '#475569'], INVALID: ['#FEE2E2', '#DC2626'], REVOKED: ['#F1F5F9', '#94A3B8'] }[c.status] || ['#F1F5F9', '#64748B']; return <span style={badge(cc[0], cc[1])}>{human(c.status)}</span>; })()}</td>
                    <td style={td}>{dt(c.createdAt)}</td>
                    <td style={td}><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button style={btn('ghost')} onClick={() => testCred(c.id)}>Тест</button>
                      {c.status !== 'ACTIVE' && c.status !== 'REVOKED' ? <button style={btn('ghost')} data-testid={`acq-cred-activate-${c.id}`} onClick={() => credAction(c.id, 'activate')}>Активировать</button> : null}
                      {c.status === 'ACTIVE' ? <button style={btn('ghost')} onClick={() => credAction(c.id, 'deactivate')}>Деактивировать</button> : null}
                      {c.status !== 'REVOKED' ? <button style={btn('danger')} onClick={() => credAction(c.id, 'revoke')}>Отозвать</button> : null}
                    </div></td>
                  </tr>
                )) : <tr><td style={td} colSpan={6}>Ключей нет. Executor работает в ручном режиме.</td></tr>}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div style={card} data-testid="acq-events">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Время</th><th style={th}>Сеть</th><th style={th}>Тип</th><th style={th}>Кошелёк</th><th style={th}>Сумма</th><th style={th}>tx</th><th style={th}>Статус</th></tr></thead>
              <tbody>{events.length ? events.map((e, i) => (
                <tr key={i}><td style={td}>{dt(e.at)}</td><td style={td}>{e.network}</td><td style={td}>{e.type}</td><td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{short(e.wallet)}</td><td style={td}>{usd(e.amount)}</td><td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{short(e.txHash)}</td><td style={td}>{e.status}</td></tr>
              )) : <tr><td style={td} colSpan={7}>Событий пока нет.</td></tr>}</tbody>
            </table>
          </div>
        )}

        {tab === 'diagnostics' && (
          <div data-testid="acq-diagnostics">
            {diag ? (
              <div style={{ ...card }}>
                <SectionTitle>Режим эквайринга</SectionTitle>
                <div style={{ ...grid(240) }}>
                  {[['Сеть', noVer(diag.network?.name)], ['Режим депозитов', human(diag.depositConfirmationMode)], ['Режим выводов', human(diag.withdrawalMode)], ['Executor', human(diag.executorStatus)], ['RPC', human(diag.rpcStatus)], ['Treasury', diag.treasuryAddress], ['Реконсиляция', `${human(diag.reconciliation?.status)} (Δ ${usd(diag.reconciliation?.difference)})`]].map(([k, v]: any) => (
                    <div key={k} style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3, color: T.sub, fontWeight: 700 }}>{k}</div>
                      <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 600, marginTop: 3, wordBreak: 'break-all', fontFamily: /treasury/i.test(k) ? 'monospace' : undefined }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 10 }}>Приватные ключи/seed никогда не отображаются и не логируются.</div>
              </div>
            ) : null}
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Аудит административных действий</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Время</th><th style={th}>Кто</th><th style={th}>Действие</th><th style={th}>Детали</th></tr></thead>
                <tbody>{audit.length ? audit.map((a) => (
                  <tr key={a._id}><td style={td}>{dt(a.at)}</td><td style={td}>{a.adminId || '—'}</td><td style={td}>{a.action}</td><td style={{ ...td, fontSize: 11.5, color: T.sub }}>{a.reason || a.credentialId || a.withdrawalId || (a.after ? `treasury→${short(a.after.treasuryAddress)}` : '')}</td></tr>
                )) : <tr><td style={td} colSpan={4}>Записей аудита нет.</td></tr>}</tbody>
              </table>
            </div>
          </div>
        )}

        {chain ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setChain(null)}>
            <div style={{ width: 460, maxWidth: '92vw', background: '#fff', height: '100%', overflowY: 'auto', padding: 22 }} onClick={(e) => e.stopPropagation()} data-testid="acq-chain-drawer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>Цепочка покупки</div>
                <button style={btn('ghost')} onClick={() => setChain(null)}>Закрыть</button>
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>{chain.purchase?.productCode} · {usd(chain.purchase?.amount)} · {chain.purchase?.status}{chain.purchase?.flow ? ` · ${chain.purchase.flow}` : ''}</div>
              {chain.purchase?.flow === 'CUSTODY' ? (
                <div style={{ marginBottom: 14 }}>
                  {!ownerReady() ? (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#B45309', marginBottom: 8 }}>Для подписи сеттлмента/возврата подключите кошелёк-владельца контракта. Ключи не хранятся — подпись в вашем кошельке.</div>
                      <button style={btn('primary')} data-testid="acq-drawer-connect" onClick={connectOwnerWallet}>Подключить кошелёк</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: '#059669', marginBottom: 10 }}>Кошелёк-владелец подключён: {short(ownerAddr)}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button style={btn('primary')} data-testid="acq-owner-settle" disabled={!ownerReady() || ownerBusy === chain.purchase.id} onClick={() => runOwnerAction(chain.purchase.id, false)}>{ownerBusy === chain.purchase.id ? 'Подпись…' : 'Подтвердить сеттлмент'}</button>
                    <button style={btn('danger')} data-testid="acq-refund" disabled={!ownerReady() || ownerBusy === chain.purchase.id} onClick={() => runOwnerAction(chain.purchase.id, true)}>Возврат (до сеттлмента)</button>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>Подпись выполняется кошельком-владельцем (adminResolveUSD, без комиссии). Если лот ещё не создан, первая подпись создаст расчётный лот.</div>
                </div>
              ) : null}
              <div style={{ paddingLeft: 18 }}>
                {(chain.steps || []).map((s: any, i: number) => (
                  <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
                    <div style={{ position: 'absolute', left: -18, top: 3, width: 12, height: 12, borderRadius: '50%', background: s.ok ? '#059669' : '#CBD5E1' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.ok ? T.ink : T.sub }}>{s.step}{s.actor ? <span style={{ fontSize: 10.5, color: T.sub, fontWeight: 600 }}> · {s.actor}</span> : null}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{s.detail}</div>
                    {s.txHash ? <div style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{s.explorer ? <a href={s.explorer} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{s.txHash}</a> : s.txHash}</div> : null}
                    {s.at ? <div style={{ fontSize: 11, color: T.sub }}>{dt(s.at)}</div> : null}
                    {s.error ? <div style={{ fontSize: 11, color: '#DC2626' }}>{s.error}</div> : null}
                    {s.idempotencyKey ? <div style={{ fontSize: 10.5, color: T.sub, fontFamily: 'monospace', wordBreak: 'break-all' }}>{s.idempotencyKey}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {confirmDlg ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmDlg(null)} data-testid="acq-confirm-modal">
            <div style={{ width: 460, maxWidth: '92vw', background: '#fff', borderRadius: 16, padding: 24 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, marginBottom: 14 }}>{confirmDlg.title}</div>
              <div style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
                {(confirmDlg.lines || []).map(([k, v]: any) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '3px 0', fontSize: 12.5 }}>
                    <span style={{ color: T.sub }}>{k}</span>
                    <span style={{ color: T.ink, fontWeight: 600, wordBreak: 'break-all', textAlign: 'right', fontFamily: /0x/.test(String(v)) ? 'monospace' : undefined }}>{v}</span>
                  </div>
                ))}
              </div>
              {confirmDlg.warn ? <div style={{ fontSize: 12.5, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>{confirmDlg.warn}</div> : null}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={btn('ghost')} onClick={() => setConfirmDlg(null)} data-testid="acq-confirm-cancel">Отмена</button>
                <button style={btn(confirmDlg.danger ? 'danger' : 'primary')} onClick={runConfirm} data-testid="acq-confirm-ok">Подтвердить</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default AcquiringPage;

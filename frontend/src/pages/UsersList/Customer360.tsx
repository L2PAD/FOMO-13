import React, { useEffect, useState } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import Layout from "../../components/layouts/main_layout/layout";
import BadgeHex from "../AdminRating/BadgeHex";
import {
  T, Card, KpiCard, KpiGrid, SectionTitle, StateBlock, Badge, fmtNum, fmtDate, shortId,
} from "../Statistics/ui";
import {
  fetchDossierSummary, fetchUserById, fetchTimeline, fetchDossierSection, DossierSection,
  muteUser, unmuteUser, suspendUser, unsuspendUser, softDeleteUser, restoreUser, createUserInvite,
  fetchUserInfluence,
} from "../../components/services/customer360";
import { getAiUserAnalytics, getDiagnostics, accessExplain, getUserFinance, getUserEconomics, getUserCustodyReconcile } from "../AccessMonetization/service";
import sliceAddress from "../../components/utils/sliceAddress";
import ChatModal from "../../components/layouts/FomoChat/ChatModal";
import getAccessToken from "../../components/utils/getAccessToken";
import { configureUrl } from "../../components/services/config";
import { IUser } from "../../components/types/global_types";

// Live Spaceport NFT ownership for this user (current owner = chain state, not past purchases).
const SpaceportNftPanel: React.FC<{ userId: string }> = ({ userId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr("");
      try {
        const res = await fetch(configureUrl(`admin/spaceport-cc/customer/${userId}`), {
          headers: { Authorization: `Bearer ${getAccessToken()}` }, credentials: "include",
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.message || "Ошибка загрузки");
        if (alive) setData(j);
      } catch (e: any) { if (alive) setErr(e?.message || "Ошибка"); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [userId]);

  if (loading) return <StateBlock kind="loading" />;
  if (err) return <StateBlock kind="error" message={err} />;
  const ca = data?.currentAssets || {};
  const tokens = ca.tokens || [];
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
      <SectionTitle sub={data?.note || "Живое on-chain владение (BSC Testnet)"}>Spaceport NFT (live)</SectionTitle>
      <KpiGrid>
        <KpiCard label="NFT сейчас (on-chain)" value={fmtNum(ca.count)} />
        <KpiCard label="Кошельки" value={(data?.wallets || []).length} />
        <KpiCard label="Fusion eligible" value={data?.fusion?.eligible ? "да" : "нет"} hint={`Возможных: ${data?.fusion?.possibleFusions ?? 0}`} />
        <KpiCard label="Openings (reveal)" value={fmtNum((data?.openings || []).length)} />
      </KpiGrid>
      {(data?.wallets || []).length > 0 && (
        <div style={{ fontSize: 12.5, color: T.sub, marginTop: 10 }}>
          Кошельки: {(data.wallets).map((w: string) => shortId(w, 14)).join(", ")}
        </div>
      )}
      {tokens.length === 0 ? (
        <div style={{ marginTop: 12 }}><StateBlock kind="empty" message="Нет NFT в текущем владении (по состоянию блокчейна)" /></div>
      ) : (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {tokens.map((t: any) => (
            <div key={t.tokenId} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", minWidth: 150 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>#{t.tokenId}</div>
              <div style={{ marginTop: 6 }}><Badge tone={t.rarityId >= 4 ? "good" : t.rarityId >= 1 ? "warn" : "default"}>{t.rarityName || "—"}</Badge></div>
              {t.isStaked ? <div style={{ marginTop: 6 }}><Badge tone="info">staked</Badge></div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const TABS = [
  "Обзор", "Активность", "XP", "Рейтинг", "Торговля", "Launchpad", "NFT",
  "Бейджи", "Рефералы", "EarlyLand", "Монетизация и доступ", "Финансы", "Контент", "Support", "Модерация", "Безопасность", "Логи", "История",
] as const;
type Tab = typeof TABS[number];

// H37: profitability status labels (canonical status comes from backend userEconomics).
const PROFIT_STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "default" }> = {
  HEALTHY: { label: "Healthy", tone: "good" },
  AT_RISK: { label: "At risk", tone: "warn" },
  OVER_TARGET_COGS: { label: "Over target COGS", tone: "bad" },
  NO_PAID_REVENUE: { label: "No paid revenue", tone: "default" },
  INSUFFICIENT_SAMPLE: { label: "Insufficient sample", tone: "default" },
  NO_ACTIVITY: { label: "No activity", tone: "default" },
};
const fmtUsd = (n: any) => `$${(Number(n) || 0).toFixed(2)}`;
const fmtUsdc = (n: any) => `${(Number(n) || 0).toFixed(2)} USDC`;
const MONEY_OP_LABEL: Record<string, string> = {
  DEPOSIT: "Депозит", WITHDRAWAL: "Вывод", PURCHASE: "Покупка", REFUND: "Возврат", ADMIN_ADJUSTMENT: "Корректировка",
};

// Human-readable capability labels for the Монетизация и доступ tab (no raw enums in UX).
const CAP_LABELS: Record<string, string> = {
  "fomo_ai.membership": "FOMO AI Membership",
  "fomo_ai.access": "FOMO AI",
  "fomo_ai.deep_research": "FOMO AI · Deep Research",
  "fomo_ai.portfolio_analysis": "FOMO AI · Портфель",
  "earlyland.prime": "EarlyLand Prime",
  "parsing.access": "Parsing / XRank",
  "parsing.advanced": "Parsing Advanced",
  "xrank.access": "XRank",
  "fomies.private": "FOMIES Private",
  "blockcore.access": "BlockCore",
  "launchpad.invest": "Launchpad Invest",
  "spaceport.stake": "SpacePort Stake",
  "fomo_intel.access": "FOMO Intel",
};
const SRC_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Подписка", NFT_ACTIVATION: "NFT-активация", ADMIN_GRANT: "Admin-грант",
  NFT_EVENT: "NFT (on-chain)", LEGACY_BACKEND_GRANT: "Legacy-грант", PROMO: "Промо",
};
const EXPLAIN_CAPS = ["fomo_ai.access", "earlyland.prime", "parsing.access", "fomo_ai.deep_research", "launchpad.invest", "fomo_intel.access"];

const STATE_LABEL: Record<string, string> = { active: "Активен", muted: "Muted", suspended: "Заблокирован", deleted: "Удалён" };
const STATE_TONE: Record<string, "good" | "warn" | "bad" | "default"> = { active: "good", muted: "warn", suspended: "bad", deleted: "default" };

/* Reusable: "Не подключено" panel */
const NC: React.FC<{ note?: string }> = ({ note }) => <StateBlock kind="not-collected" message={note || "Источник данных не подключён к платформе"} />;

/* Key/value grid for breakdown objects */
const LBL: Record<string, string> = {
  points: "Points / XP", score: "Профиль-скор", balance: "Баланс", partners: "Партнёры", awards: "Награды",
  ratingPercent: "Рейтинг сделок %", sells: "Продажи", buys: "Покупки", revenueUsd: "Оборот, $",
  commentsTotal: "Комментарии", supportTotal: "Обращения", appealsTotal: "Апелляции", logsTotal: "Записей в логе",
  totalInvestedUsd: "Инвестировано, $", numberOfDeals: "Сделок", averageInvestmentUsd: "Ср. чек, $",
  projectsSupported: "Проектов поддержано", lastInvestmentAt: "Последняя инвестиция", averageRoiPercent: "Ср. ROI %",
  total: "Всего", otc: "OTC", p2p: "P2P", active: "Активные", ended: "Завершено", blocked: "Заблокировано",
  totalAmount: "Сумма", totalFee: "Комиссии",
};
const humanize = (k: string) => LBL[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).replace(/\b(Usd|Roi|Otc|P2p|Xp)\b/gi, (m) => m.toUpperCase());
const KVGrid: React.FC<{ obj: any; empty?: string }> = ({ obj, empty }) => {
  const entries = obj && typeof obj === "object" ? Object.entries(obj).filter(([, v]) => typeof v === "number" || typeof v === "string") : [];
  if (!entries.length) return <StateBlock kind="empty" message={empty} height={80} />;
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ background: T.soft, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{typeof v === "number" ? fmtNum(v) : String(v)}</div>
          <div style={{ fontSize: 11.5, color: T.sub, fontWeight: 600, marginTop: 2 }}>{humanize(k)}</div>
        </div>
      ))}
    </div>
  );
};

const btn = (bg: string, color = "#fff"): React.CSSProperties => ({ background: bg, color, border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" });
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: `1px solid ${T.border}`, borderRadius: 8, margin: "6px 0", fontSize: 13, outline: "none", boxSizing: "border-box" };

/* ── Reusable paged data table for dossier sections (real data + counters) ── */
type Col = { label: string; render: (row: any) => React.ReactNode; width?: number };
const th: React.CSSProperties = { textAlign: "left", fontSize: 12, color: T.sub, fontWeight: 700, padding: "9px 12px", borderBottom: `1px solid ${T.border}`, textTransform: "uppercase", whiteSpace: "nowrap" };
const td: React.CSSProperties = { fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.soft}`, verticalAlign: "top" };

const DEAL_STATUS_TONE: Record<string, "good" | "warn" | "bad" | "default" | "info"> = {
  ended: "good", started: "info", waiting: "warn", blocked: "bad", "forced-termination": "bad",
};
const APPEAL_STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "default" | "info" }> = {
  open: { label: "Открыта", tone: "warn" }, in_review: { label: "На рассмотрении", tone: "info" }, resolved: { label: "Решена", tone: "good" },
};
const DEP_STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "default" }> = {
  confirmed: { label: "Подтверждён", tone: "good" }, pending: { label: "В ожидании", tone: "warn" }, failed: { label: "Ошибка", tone: "bad" },
};
const roleLabel: Record<string, string> = { creator: "Создатель", seller: "Продавец", buyer: "Покупатель", participant: "Участник" };
const txCell = (hash?: string) => {
  if (!hash) return <span style={{ color: T.faint }}>—</span>;
  const isTx = /^0x[0-9a-fA-F]{20,}/.test(String(hash));
  return isTx
    ? <a href={`https://explorer.zksync.io/tx/${hash}`} target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: "none", fontFamily: "monospace" }}>{shortId(String(hash))} ↗</a>
    : <span style={{ color: T.faint, fontFamily: "monospace" }}>{shortId(String(hash))}</span>;
};

const SectionTable: React.FC<{ id: string; section: DossierSection; columns: Col[]; empty?: string; testId?: string; minWidth?: number }> = ({ id, section, columns, empty, testId, minWidth = 640 }) => {
  const [rows, setRows] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const LIMIT = 10;
  const load = React.useCallback(async (off: number) => {
    setLoading(true);
    const r = await fetchDossierSection(id, section, off, LIMIT);
    const d = r.success ? r.data : null;
    const items = Array.isArray(d?.items) ? d.items : [];
    setRows((prev) => (off === 0 ? items : [...prev, ...items]));
    setTotal(d?.total || 0);
    setHasMore(!!d?.hasMore);
    setLoading(false);
  }, [id, section]);
  React.useEffect(() => { setOffset(0); load(0); }, [load]);

  return (
    <div data-testid={testId}>
      {loading && rows.length === 0 ? <StateBlock kind="loading" /> : rows.length === 0 ? <StateBlock kind="empty" message={empty || "Записей нет"} /> : (
        <>
          <div style={{ fontSize: 12, color: T.sub, fontWeight: 700, marginBottom: 8 }}>Всего: {total}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth }}>
              <thead><tr>{columns.map((c, i) => <th key={i} style={{ ...th, width: c.width }}>{c.label}</th>)}</tr></thead>
              <tbody>{rows.map((row, ri) => (
                <tr key={row._id || ri} data-testid={`${testId}-row-${ri}`}>{columns.map((c, ci) => <td key={ci} style={td}>{c.render(row)}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
          {hasMore ? (
            <button onClick={() => { const off = offset + LIMIT; setOffset(off); load(off); }} disabled={loading}
              style={{ marginTop: 12, background: T.soft, color: T.ink, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }} data-testid={`${testId}-more`}>
              {loading ? "Загрузка…" : "Показать ещё"}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
};

const dealColumns: Col[] = [
  { label: "ID", render: (r) => <span style={{ fontFamily: "monospace" }}>#{r.dealId || shortId(String(r._id))}</span> },
  { label: "Название", render: (r) => r.name || "—" },
  { label: "Секция", render: (r) => <Badge tone="info">{String(r.section || "otc").toUpperCase()}</Badge> },
  { label: "Статус", render: (r) => <Badge tone={DEAL_STATUS_TONE[r.status] || "default"}>{r.status}</Badge> },
  { label: "Сумма", render: (r) => `${fmtNum(r.price ?? r.amount)} ${(r.currency || r.ticker || "").toUpperCase()}` },
  { label: "Роль", render: (r) => roleLabel[r.userRole] || r.userRole || "—" },
  { label: "Дата", render: (r) => fmtDate(r.createDate || r.date) },
  { label: "Апелляция", render: (r) => (r.isAppeal ? <Badge tone="warn">есть</Badge> : <span style={{ color: T.faint }}>—</span>) },
];
const depositColumns: Col[] = [
  { label: "Дата", render: (r) => fmtDate(r.createdAt) },
  { label: "Сумма", render: (r) => `${fmtNum(r.amount)} ${r.currency || "USDC"}` },
  { label: "Статус", render: (r) => { const s = DEP_STATUS[r.status]; return <Badge tone={s?.tone || "default"}>{s?.label || r.status}</Badge>; } },
  { label: "Сеть", render: (r) => r.network || "—" },
  { label: "Подтв.", render: (r) => fmtNum(r.confirmations) },
  { label: "txHash", render: (r) => txCell(r.transactionHash) },
];
const withdrawColumns: Col[] = [
  { label: "Дата", render: (r) => fmtDate(r.createdAt) },
  { label: "Сумма", render: (r) => `${fmtNum(r.amount)} ${r.currency || "USDC"}` },
  { label: "Комиссия", render: (r) => fmtNum(r.fee) },
  { label: "Статус", render: (r) => <Badge tone={r.moneyStatus === "CONFIRMED" ? "good" : r.moneyStatus === "FAILED" ? "bad" : "warn"}>{r.moneyStatus || `#${r.status}`}</Badge> },
  { label: "Сеть", render: (r) => r.network || "—" },
  { label: "txHash", render: (r) => txCell(r.transactionHash) },
];
const commentColumns: Col[] = [
  { label: "Дата", render: (r) => fmtDate(r.date) },
  { label: "Текст", width: 320, render: (r) => <span style={{ display: "block", maxWidth: 320, whiteSpace: "normal" }}>{r.text}</span> },
  { label: "Тема", render: (r) => r.topicName || r.path || r.page || "—" },
  { label: "👍 / 👎", render: (r) => `${fmtNum(r.likesCount)} / ${fmtNum(r.dislikesCount)}` },
  { label: "Жалобы", render: (r) => (r.reportsCount ? <Badge tone="bad">{r.reportsCount}</Badge> : <span style={{ color: T.faint }}>0</span>) },
  { label: "Просм.", render: (r) => fmtNum(r.viewsCount) },
];
const supportColumns: Col[] = [
  { label: "Дата", render: (r) => fmtDate(r.date) },
  { label: "Тема", render: (r) => r.theme || "—" },
  { label: "Категория", render: (r) => (r.category ? <Badge tone="info">{r.category}</Badge> : "—") },
  { label: "Сообщение", width: 360, render: (r) => <span style={{ display: "block", maxWidth: 360, whiteSpace: "normal" }}>{r.message}</span> },
  { label: "Проект", render: (r) => r.project?.name || "—" },
];
const appealColumns: Col[] = [
  { label: "Дата", render: (r) => fmtDate(r.createdAt) },
  { label: "Appeal ID", render: (r) => <span style={{ fontFamily: "monospace" }}>{r.appealId || shortId(String(r._id))}</span> },
  { label: "Сделка", render: (r) => (r.deal ? <span>#{r.deal._id ? shortId(String(r.deal._id)) : "—"} · {String(r.deal.section || "otc").toUpperCase()} · {r.deal.status}</span> : "—") },
  { label: "Роль", render: (r) => roleLabel[r.role] || r.role || "—" },
  { label: "Причина", width: 260, render: (r) => <span style={{ display: "block", maxWidth: 260, whiteSpace: "normal" }}>{r.reason || r.description || "—"}</span> },
  { label: "Статус", render: (r) => { const s = APPEAL_STATUS[r.status]; return <Badge tone={s?.tone || "default"}>{s?.label || r.status}</Badge>; } },
];
const portfolioColumns: Col[] = [
  { label: "Название", render: (r) => r.name || "Portfolio" },
  { label: "Баланс", render: (r) => `$${fmtNum(r.totalBalance)}` },
  { label: "Инвестировано", render: (r) => `$${fmtNum(r.totalInvested)}` },
  { label: "Профит", render: (r) => <span style={{ color: (r.profit || 0) >= 0 ? T.good : T.bad, fontWeight: 700 }}>${fmtNum(r.profit)}</span> },
  { label: "ROI %", render: (r) => <span style={{ color: (r.profitPercent || 0) >= 0 ? T.good : T.bad }}>{r.profitPercent != null ? `${Math.round((r.profitPercent) * 100) / 100}%` : "—"}</span> },
  { label: "Активов", render: (r) => fmtNum(Array.isArray(r.assets) ? r.assets.length : 0) },
  { label: "Обновлён", render: (r) => fmtDate(r.updatedAt) },
];


const Customer360: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const initialTab: Tab = (() => {
    const q = new URLSearchParams(location.search).get("tab");
    if (!q) return "Обзор";
    if (q === "finance") return "Финансы";
    if (q === "monetization") return "Монетизация и доступ";
    return (TABS as readonly string[]).includes(q) ? (q as Tab) : "Обзор";
  })();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [logLevel, setLogLevel] = useState<"all" | "info" | "warn" | "error">("all");
  const [dossier, setDossier] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [inviteEmail, setInviteEmail] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [tlLoading, setTlLoading] = useState(false);
  const [aiMon, setAiMon] = useState<any>(null);
  const [aiMonLoading, setAiMonLoading] = useState(false);
  const [diag, setDiag] = useState<any>(null);
  const [explainCap, setExplainCap] = useState<string>("fomo_ai.access");
  const [explain, setExplain] = useState<any>(null);
  const [explainBusy, setExplainBusy] = useState(false);
  // H37: Finance tab (real money + AI economics P&L).
  const [finance, setFinance] = useState<any>(null);
  const [economics, setEconomics] = useState<any>(null);
  const [custodyRecon, setCustodyRecon] = useState<any>(null);
  const [finLoading, setFinLoading] = useState(false);
  // Phase 2: Support chat (open a thread with this user in the existing FOMO Chat).
  const [isChatVisible, setIsChatVisible] = useState(false);
  // Content Influence explainability read-model (Контент tab).
  const [influence, setInfluence] = useState<any>(null);
  const [influLoading, setInfluLoading] = useState(false);
  const [influPeriod, setInfluPeriod] = useState<"7d" | "30d" | "all">("all");
  const token = getAccessToken();
  const adminUserData = React.useMemo<IUser | null>(() => {
    try { const raw = localStorage.getItem("fomoUser"); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, []);
  const openChat = () => setIsChatVisible(true);

  const load = async () => {
    setLoading(true);
    const [d, u] = await Promise.all([fetchDossierSummary(id), fetchUserById(id)]);
    setDossier(d.success ? d.data : null);
    setUser(u.success ? u.data : null);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const timelineType = tab === "XP" ? "xp" : tab === "Модерация" ? "moderation" : "all";
  useEffect(() => {
    if (!["История", "Активность", "XP", "Модерация", "Логи"].includes(tab)) return;
    setTlLoading(true);
    fetchTimeline(id, timelineType).then((r) => { setTimeline(r.success && r.data?.events ? r.data.events : []); setTlLoading(false); });
    // eslint-disable-next-line
  }, [tab, id]);

  useEffect(() => {
    if (tab !== "Контент") return;
    setInfluLoading(true);
    fetchUserInfluence(id)
      .then((r) => setInfluence(r.success ? r.data : null))
      .catch(() => setInfluence(null))
      .finally(() => setInfluLoading(false));
    // eslint-disable-next-line
  }, [tab, id]);

  useEffect(() => {
    if (tab !== "Монетизация и доступ") return;
    setAiMonLoading(true);
    Promise.all([
      getAiUserAnalytics(id).then((r) => setAiMon(r?.ok ? r : null)).catch(() => setAiMon(null)),
      getDiagnostics(id).then((r) => setDiag(r?.found ? r : null)).catch(() => setDiag(null)),
    ]).finally(() => setAiMonLoading(false));
    // eslint-disable-next-line
  }, [tab, id]);

  const runExplain = async (cap: string) => {
    setExplainBusy(true); setExplainCap(cap);
    try { const r = await accessExplain(id, cap); setExplain(r?.data || null); } catch { setExplain(null); }
    setExplainBusy(false);
  };

  useEffect(() => {
    if (tab !== "Финансы") return;
    setFinLoading(true);
    Promise.all([
      getUserFinance(id).then((r) => setFinance(r || null)).catch(() => setFinance(null)),
      getUserEconomics(id).then((r) => setEconomics(r || null)).catch(() => setEconomics(null)),
      getUserCustodyReconcile(id).then((r) => setCustodyRecon(r || null)).catch(() => setCustodyRecon(null)),
    ]).finally(() => setFinLoading(false));
    // eslint-disable-next-line
  }, [tab, id]);

  const axes = dossier?.axes || {};
  const S = dossier?.sections || {};
  const state = S?.moderation?.accountState || (user?.banned ? "suspended" : "active");
  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };
  const run = async (fn: () => Promise<any>, okText: string) => { setBusy(true); const r = await fn(); setBusy(false); flash(r?.success ? okText : "Ошибка операции", !!r?.success); await load(); };

  const doInvite = async () => { if (!inviteEmail) return; setBusy(true); const r = await createUserInvite(inviteEmail, id, reason); setBusy(false); flash(r.success ? `Приглашение создано (${r.data?.invite?.status || "pending"})` : "Ошибка", !!r.success); };
  const doDelete = async () => {
    if (!window.confirm("Мягкое удаление (soft-delete): пользователь помечается как удалён, но XP/сделки/бейджи/рефералы сохраняются. Продолжить?")) return;
    await run(() => softDeleteUser(id, reason), "Пользователь удалён (soft-delete)");
  };

  const Axis: React.FC<{ title: string; a: any; main: React.ReactNode; sub?: React.ReactNode }> = ({ title, a, main, sub }) => (
    <Card style={{ padding: 16 }} testId={`axis-${title}`}>
      <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{title}</div>
      {a && a.connected === false ? (
        <div style={{ fontSize: 14, fontWeight: 700, color: T.warn, marginTop: 8 }}>Не подключено</div>
      ) : (
        <>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginTop: 6, lineHeight: 1.1 }}>{main}</div>
          {sub ? <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{sub}</div> : null}
        </>
      )}
    </Card>
  );

  const Timeline: React.FC<{ title: string }> = ({ title }) => (
    <Card testId="c360-timeline">
      <SectionTitle>{title}</SectionTitle>
      {tlLoading ? <StateBlock kind="loading" /> : timeline.length === 0 ? <StateBlock kind="empty" message="Событий не найдено" /> : (
        <div>
          {timeline.map((e, i) => {
            const colors: Record<string, string> = { registration: "#0369A1", xp: T.accent, badge: "#7C3AED", moderation: T.warn };
            const c = colors[e.type] || T.sub;
            return (
              <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: `1px solid ${T.soft}` }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: c, marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{e.description}</div>
                  <div style={{ fontSize: 11.5, color: T.faint, marginTop: 3 }}>
                    <span style={{ color: c, fontWeight: 700, textTransform: "uppercase" }}>{e.type}</span> · {e.source} · {e.timestamp ? new Date(e.timestamp).toLocaleString("ru-RU") : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const ActionsPanel = () => (
    <Card testId="c360-actions" style={{ alignSelf: "start" }}>
      <SectionTitle sub="Жизненный цикл: active → muted → suspended → deleted">Действия администратора</SectionTitle>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Причина (для mute/suspend/delete)" style={inputStyle} data-testid="c360-reason" />
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0 12px" }}>
        <span style={{ fontSize: 12, color: T.sub }}>Срок (дней):</span>
        <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ ...inputStyle, width: 90, margin: 0 }} />
      </div>

      {state === "suspended"
        ? <button disabled={busy} onClick={() => run(() => unsuspendUser(id), "Блокировка снята")} style={{ ...btn(T.good), marginBottom: 8 }} data-testid="c360-unsuspend">Снять блокировку</button>
        : <button disabled={busy} onClick={() => run(() => suspendUser(id, reason, days), "Пользователь заблокирован")} style={{ ...btn(T.bad), marginBottom: 8 }} data-testid="c360-suspend">Заблокировать (suspend)</button>}

      {state === "muted"
        ? <button disabled={busy} onClick={() => run(() => unmuteUser(id), "Mute снят")} style={{ ...btn(T.soft, T.ink), marginBottom: 8 }} data-testid="c360-unmute">Снять mute</button>
        : <button disabled={busy} onClick={() => run(() => muteUser(id, reason, days), "Mute применён")} style={{ ...btn(T.warn), marginBottom: 8 }} data-testid="c360-mute">Mute на {days}д</button>}

      <div style={{ borderTop: `1px solid ${T.soft}`, paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 4 }}>Приглашение (Resend)</div>
        <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" style={inputStyle} data-testid="c360-invite-email" />
        <button disabled={busy} onClick={doInvite} style={{ ...btn(T.accent) }} data-testid="c360-invite">Отправить приглашение</button>
      </div>

      <div style={{ borderTop: `1px solid ${T.soft}`, paddingTop: 12, marginTop: 12 }}>
        {state === "deleted"
          ? <button disabled={busy} onClick={() => run(() => restoreUser(id), "Пользователь восстановлен")} style={btn(T.good)} data-testid="c360-restore">Восстановить</button>
          : <button disabled={busy} onClick={doDelete} style={btn("#7f1d1d")} data-testid="c360-delete">Удалить (soft-delete)</button>}
      </div>
    </Card>
  );

  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: "100%", padding: "20px 24px 60px" }} data-testid="customer360-page">
        <style>{`::selection{background:${T.accent};color:#fff}`}</style>
        <button onClick={() => history.push("/users_list")} style={{ background: T.cardBg, color: T.sub, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 16 }} data-testid="c360-back">← К списку пользователей</button>

        {loading ? <Card><StateBlock kind="loading" /></Card> : (
          <>
            {/* Header */}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                {user?.photo
                  ? <img src={user.photo} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                  : <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: T.faint }}>{(user?.name || user?.username || "?").slice(0, 1).toUpperCase()}</div>}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{user?.name || user?.username || "Без имени"}</div>
                  <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{user?.email || "—"} · {user?.wallet ? sliceAddress(user.wallet) : "—"} {user?.fomoId ? `· FOMO ID ${user.fomoId}` : ""}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone={STATE_TONE[state] || "default"}>{STATE_LABEL[state] || state}</Badge>
                    <Badge tone={user?.verificationStatus ? "good" : "default"}>{user?.verificationStatus ? "Верифицирован" : "Не верифиц."}</Badge>
                    {S?.moderation?.mutedUntil ? <Badge tone="warn">Mute до {fmtDate(S.moderation.mutedUntil)}</Badge> : null}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                  <button onClick={openChat} disabled={!adminUserData}
                    style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: adminUserData ? "pointer" : "not-allowed", opacity: adminUserData ? 1 : 0.5, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 8 }}
                    data-testid="c360-open-chat" title="Открыть чат с пользователем в FOMO Chat">
                    <span style={{ fontSize: 16 }}>💬</span> Open chat
                  </button>
                  <button onClick={() => { setTab("Support"); }}
                    style={{ background: "#fff", color: T.accent, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
                    data-testid="c360-open-support">Support-история</button>
                </div>
              </div>
              {/* 4 canonical axes */}
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 16 }}>
                <Axis title="FOMO Score" a={axes.fomoScore} main={fmtNum(axes.fomoScore?.value)} />
                <Axis title="XP Rank" a={axes.xp} main={fmtNum(axes.xp?.activityXP)} sub={axes.xp?.rank || null} />
                <Axis title="SpacePort Level" a={axes.spaceport} main={axes.spaceport?.level ?? "—"} sub={axes.spaceport ? `${axes.spaceport?.levelName || ""} · ${axes.spaceport?.stakingDays ?? 0} дн. стейка` : null} />
                <Axis title="Badges" a={axes.badges} main={fmtNum(axes.badges?.earned)} sub="заработано" />
              </div>
            </Card>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap", borderBottom: `1px solid ${T.border}`, marginBottom: 18 }} role="tablist">
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)} data-testid={`c360-tab-${t}`}
                  style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "none", background: "transparent", color: tab === t ? T.accent : T.sub, borderBottom: `2px solid ${tab === t ? T.accent : "transparent"}`, marginBottom: -1, whiteSpace: "nowrap", transition: "color 150ms ease" }}>
                  {t}
                </button>
              ))}
            </div>

            {msg ? <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13, background: msg.ok ? "#E7F6F3" : "#FDECEC", color: msg.ok ? T.good : T.bad }} data-testid="c360-msg">{msg.text}</div> : null}

            {/* ── ОБЗОР ── */}
            {tab === "Обзор" && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div style={{ display: "grid", gap: 16 }}>
                  <Card><SectionTitle>Активность и статистика</SectionTitle><KVGrid obj={dossier?.activityStats?.statistics} empty="Нет данных активности" /></Card>
                  <Card><SectionTitle>OTC / P2P</SectionTitle><KVGrid obj={dossier?.activityStats?.otcP2p} empty="Нет торговой активности" /></Card>
                  <Card><SectionTitle>Комьюнити</SectionTitle><KVGrid obj={dossier?.community} empty="Нет данных" /></Card>
                </div>
                <ActionsPanel />
              </div>
            )}

            {/* ── АКТИВНОСТЬ (+ лимиты, портфель, соцсети) ── */}
            {tab === "Активность" && (() => {
              const socialNetworks: any[] = Array.isArray(user?.socialNetworks) ? user.socialNetworks : [];
              const socialFromData = [
                user?.twitterData && (user.twitterData.username || user.twitterData.name) ? { type: "twitter", url: user.twitterData.username ? `https://twitter.com/${user.twitterData.username}` : "", label: user.twitterData.name || user.twitterData.username } : null,
                user?.telegramData && (user.telegramData.username || user.telegramData.telegramId) ? { type: "telegram", url: user.telegramData.username ? `https://t.me/${user.telegramData.username}` : "", label: user.telegramData.username || String(user.telegramData.telegramId) } : null,
                user?.discordData && (user.discordData.username || user.discordData.name) ? { type: "discord", url: "", label: user.discordData.username || user.discordData.name } : null,
              ].filter(Boolean) as any[];
              const socials = [...socialNetworks.map((s) => ({ type: s.type, url: s.url, label: s.url })), ...socialFromData];
              const st = dossier?.activityStats?.statistics || {};
              const online = user?.isOnline ?? user?.online;
              return (
              <div style={{ display: "grid", gap: 16 }}>
                {/* Activity & limits */}
                <Card testId="c360-activity-limits">
                  <SectionTitle sub="Вовлечённость, лимиты и последняя активность">Активность и лимиты</SectionTitle>
                  <KpiGrid>
                    <KpiCard label="Activity XP" value={fmtNum(user?.activityXP)} tone="good" />
                    <KpiCard label="Points / Score" value={fmtNum(st.points ?? st.score)} />
                    <KpiCard label="Онлайн" value={online === true ? "Онлайн" : online === false ? "Оффлайн" : "—"} tone={online === true ? "good" : "default"} />
                    <KpiCard label="Последняя активность" value={user?.lastActivity || user?.lastOnline || user?.updatedAt ? fmtDate(user.lastActivity || user.lastOnline || user.updatedAt) : "—"} />
                    <KpiCard label="Дневной лимит сделок" value={user?.dailyDealLimit != null ? fmtNum(user.dailyDealLimit) : "не задан"} />
                    <KpiCard label="Лимит вывода, $" value={user?.withdrawLimit != null ? fmtNum(user.withdrawLimit) : "не задан"} />
                    <KpiCard label="Регистрация" value={user?.createdAt ? fmtDate(user.createdAt) : "—"} />
                    <KpiCard label="Реф. код" value={user?.refCode || user?.referralCode || "—"} />
                  </KpiGrid>
                </Card>

                {/* Socials */}
                <Card testId="c360-socials">
                  <SectionTitle sub="Привязанные социальные аккаунты">Соцсети</SectionTitle>
                  {socials.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {socials.map((s, i) => (
                        <a key={i} href={s.url || undefined} target={s.url ? "_blank" : undefined} rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", textDecoration: "none", color: T.ink, background: T.soft, fontSize: 13, fontWeight: 600 }} data-testid={`c360-social-${i}`}>
                          <Badge tone="info">{String(s.type || "link").toUpperCase()}</Badge>
                          <span style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label || s.url || "—"}</span>
                        </a>
                      ))}
                    </div>
                  ) : <StateBlock kind="empty" message="Соцсети не привязаны" height={70} />}
                  {user?.twitterScore != null ? <div style={{ marginTop: 10, fontSize: 12, color: T.sub }}>Twitter Score: <b style={{ color: T.ink }}>{fmtNum(user.twitterScore)}</b></div> : null}
                </Card>

                {/* Portfolio */}
                <Card testId="c360-portfolio">
                  <SectionTitle sub="Инвестиционные портфели пользователя">Портфель</SectionTitle>
                  <KpiGrid>
                    <KpiCard label="Портфелей" value={fmtNum(dossier?.portfolios?.total)} />
                    <KpiCard label="Баланс, $" value={fmtNum(dossier?.portfolios?.totalBalance)} tone="good" />
                    <KpiCard label="Инвестировано, $" value={fmtNum(dossier?.portfolios?.totalInvested)} />
                    <KpiCard label="Профит, $" value={fmtNum(dossier?.portfolios?.totalProfit)} tone={(dossier?.portfolios?.totalProfit || 0) >= 0 ? "good" : "bad"} />
                    <KpiCard label="Ср. ROI %" value={dossier?.portfolios?.averageRoiPercent != null ? `${Math.round(dossier.portfolios.averageRoiPercent * 100) / 100}%` : "—"} />
                    <KpiCard label="Активов" value={fmtNum(dossier?.portfolios?.assetsTotal)} />
                  </KpiGrid>
                  <div style={{ marginTop: 14 }}>
                    <SectionTable id={id} section="portfolios" columns={portfolioColumns} empty="Портфелей нет" testId="c360-portfolio-table" minWidth={720} />
                  </div>
                </Card>

                <Card><SectionTitle sub="Сессии, портфель, вовлечённость">Сводка активности</SectionTitle><KVGrid obj={dossier?.activityStats?.portfolioSnapshot} empty="Нет данных" /></Card>
                <Timeline title="Лента активности" />
              </div>
              );
            })()}

            {/* ── ЛОГИ (реал-тайм code-level события пользователя) ── */}
            {tab === "Логи" && (() => {
              const levelOf = (e: any): "info" | "warn" | "error" => {
                const lv = String(e.level || e.severity || "").toLowerCase();
                if (lv.includes("err") || e.type === "moderation") return "error";
                if (lv.includes("warn")) return "warn";
                return "info";
              };
              const levelColor: Record<string, string> = { info: "#38BDF8", warn: "#F59E0B", error: "#F87171" };
              const items = (timeline || []).filter((e: any) => logLevel === "all" || levelOf(e) === logLevel);
              const payloadOf = (e: any) => e.metadata || e.payload || e.data || e.meta || null;
              const eventKey = (e: any) => e.event || e.code || `${e.source || "app"}.${e.type || "event"}`;
              return (
                <div style={{ display: "grid", gap: 14 }}>
                  <Card>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                      <SectionTitle sub="Технический поток событий пользователя по коду — с payload в JSON">Логи (реальное время)</SectionTitle>
                      <div style={{ display: "inline-flex", background: T.soft, borderRadius: 10, padding: 3, gap: 2 }} data-testid="logs-level-filter">
                        {([["all", "Все"], ["info", "INFO"], ["warn", "WARN"], ["error", "ERROR"]] as const).map(([k, lbl]) => (
                          <button key={k} onClick={() => setLogLevel(k)} data-testid={`logs-level-${k}`}
                            style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer",
                              background: logLevel === k ? "#fff" : "transparent", color: logLevel === k ? T.ink : T.sub, boxShadow: logLevel === k ? "0 1px 3px rgba(0,0,0,0.12)" : "none" }}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    {tlLoading ? <StateBlock kind="loading" /> : items.length === 0 ? <StateBlock kind="empty" message="Логи не найдены" /> : (
                      <div style={{ background: "#0B1220", borderRadius: 12, padding: 14, maxHeight: 560, overflowY: "auto", fontFamily: "'Source Code Pro', ui-monospace, monospace" }} data-testid="logs-terminal">
                        {items.map((e: any, i: number) => {
                          const lvl = levelOf(e);
                          const pl = payloadOf(e);
                          return (
                            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }} data-testid={`log-entry-${i}`}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{e.timestamp ? new Date(e.timestamp).toLocaleString("ru-RU") : ""}</span>
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: "#0B1220", background: levelColor[lvl], padding: "2px 7px", borderRadius: 5 }}>{lvl.toUpperCase()}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#7DD3FC" }}>{eventKey(e)}</span>
                              </div>
                              {e.description ? <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.82)", marginTop: 4 }}>{e.description}</div> : null}
                              {pl ? (
                                <pre style={{ margin: "6px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "rgba(255,255,255,0.04)", padding: "8px 10px", borderRadius: 8 }}>
{JSON.stringify(pl, null, 2)}
                                </pre>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11.5, color: T.faint }}>Показано {items.length} записей · обновляется при открытии вкладки</div>
                  </Card>
                </div>
              );
            })()}

            {/* ── XP ── */}
            {tab === "XP" && (
              axes.xp?.connected === false ? <Card><NC /></Card> : (
                <div style={{ display: "grid", gap: 16 }}>
                  <KpiGrid>
                    <KpiCard label="Activity XP" value={fmtNum(axes.xp?.activityXP)} tone="good" />
                    <KpiCard label="Ранг" value={axes.xp?.rank || "—"} />
                    <KpiCard label="Прогресс ранга" value={axes.xp?.progressPercent != null ? `${Math.round(axes.xp.progressPercent)}%` : "—"} />
                    <KpiCard label="XP транзакций" value={fmtNum(S?.xp?.transactionsTotal)} hint="через ledger" />
                  </KpiGrid>
                  <Timeline title="История начислений XP (ledger)" />
                </div>
              )
            )}

            {/* ── РЕЙТИНГ ── */}
            {tab === "Рейтинг" && (
              S?.rating?.connected === false ? <Card><NC note={S?.rating?.note} /></Card> : (
                <div style={{ display: "grid", gap: 16 }}>
                  <KpiGrid>
                    <KpiCard label="FOMO Score" value={fmtNum(S?.rating?.fomoScore)} tone="good" />
                    <KpiCard label="Ранг" value={S?.rating?.rank || "—"} />
                    <KpiCard label="Заполненность профиля" value={S?.rating?.fullness ?? "—"} />
                    <KpiCard label="Red flags" value={fmtNum(S?.rating?.redFlags)} tone={S?.rating?.redFlags ? "bad" : "default"} />
                    {S?.rating?.risk ? <KpiCard label="Риск" value={S.rating.risk} tone="warn" /> : null}
                    <KpiCard label="Последний расчёт" value={S?.rating?.lastCalculatedAt ? fmtDate(S.rating.lastCalculatedAt) : "—"} />
                  </KpiGrid>
                  <Card><SectionTitle>Разбор рейтинга (breakdown)</SectionTitle>
                    {S?.rating?.breakdown && Object.keys(S.rating.breakdown).length ? <KVGrid obj={S.rating.breakdown} /> : <StateBlock kind="empty" message="Детальный breakdown ещё не рассчитан" />}
                  </Card>
                </div>
              )
            )}

            {/* ── ТОРГОВЛЯ ── */}
            {tab === "Торговля" && (
              <div style={{ display: "grid", gap: 16 }}>
                <Card><SectionTitle sub="OTC / P2P сделки — сводные счётчики">Сводка сделок</SectionTitle>
                  <KpiGrid>
                    <KpiCard label="Всего сделок" value={fmtNum(dossier?.deals?.total)} />
                    <KpiCard label="OTC" value={fmtNum(dossier?.deals?.otc)} />
                    <KpiCard label="P2P" value={fmtNum(dossier?.deals?.p2p)} />
                    <KpiCard label="Активные" value={fmtNum(dossier?.deals?.active)} tone="good" />
                    <KpiCard label="Завершено" value={fmtNum(dossier?.deals?.ended)} tone="good" />
                    <KpiCard label="Заблокировано" value={fmtNum(dossier?.deals?.blocked)} tone={dossier?.deals?.blocked ? "bad" : "default"} />
                    <KpiCard label="Продажи" value={fmtNum(dossier?.deals?.sells)} />
                    <KpiCard label="Покупки" value={fmtNum(dossier?.deals?.buys)} />
                    <KpiCard label="Оборот, $" value={fmtNum(dossier?.deals?.revenueUsd)} tone="good" />
                  </KpiGrid>
                </Card>
                <Card><SectionTitle sub="Внебиржевые сделки пользователя">OTC-сделки</SectionTitle>
                  <SectionTable id={id} section="otc" columns={dealColumns} empty="OTC-сделок нет" testId="c360-otc-table" minWidth={820} />
                </Card>
                <Card><SectionTitle sub="P2P-сделки пользователя">P2P-сделки</SectionTitle>
                  <SectionTable id={id} section="p2p" columns={dealColumns} empty="P2P-сделок нет" testId="c360-p2p-table" minWidth={820} />
                </Card>
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                  <Card><SectionTitle sub={`Всего: ${fmtNum(dossier?.deposits?.total)} · ${fmtNum(dossier?.deposits?.totalAmount)} USDC`}>Депозиты</SectionTitle>
                    <SectionTable id={id} section="deposits" columns={depositColumns} empty="Депозитов нет" testId="c360-deposits-table" minWidth={560} />
                  </Card>
                  <Card><SectionTitle sub={`Всего: ${fmtNum(dossier?.withdraws?.total)} · ${fmtNum(dossier?.withdraws?.totalAmount)} USDC`}>Выводы</SectionTitle>
                    <SectionTable id={id} section="withdraws" columns={withdrawColumns} empty="Выводов нет" testId="c360-withdraws-table" minWidth={560} />
                  </Card>
                </div>
              </div>
            )}

            {/* ── LAUNCHPAD ── */}
            {tab === "Launchpad" && (
              <Card>
                <SectionTitle sub="Участие в Launchpad-проектах">Launchpad</SectionTitle>
                <KpiGrid>
                  <KpiCard label="Claimed проектов" value={fmtNum(S?.launchpad?.claimedProjects)} />
                  <KpiCard label="Invested проектов" value={fmtNum(S?.launchpad?.investedProjects)} />
                  <KpiCard label="Записей участника" value={fmtNum(S?.launchpad?.participantRecords)} />
                </KpiGrid>
              </Card>
            )}

            {/* ── NFT ── */}
            {tab === "NFT" && (
              <Card>
                <SectionTitle sub="NFT-владение и стейкинг">NFT</SectionTitle>
                <KpiGrid>
                  <KpiCard label="NFT в наличии" value={fmtNum(S?.nft?.count)} />
                  <KpiCard label="Стоимость (est.)" value={fmtNum(S?.nft?.value)} />
                  <KpiCard label="Стейк (дней)" value={fmtNum(S?.nft?.staking)} />
                  <KpiCard label="SpacePort openings" value={fmtNum(S?.nft?.openings)} />
                </KpiGrid>
                <div style={{ marginTop: 18 }}>
                  <SpaceportNftPanel userId={id} />
                </div>
              </Card>
            )}

            {/* ── БЕЙДЖИ ── */}
            {tab === "Бейджи" && (
              <Card>
                <SectionTitle>Заработанные бейджи ({axes.badges?.earned ?? 0})</SectionTitle>
                {(!axes.badges?.items || axes.badges.items.length === 0) ? <StateBlock kind="empty" message="Нет заработанных бейджей" /> : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {axes.badges.items.map((b: any) => (
                      <div key={b.code} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px" }}>
                        <BadgeHex icon={b.icon} earned size={40} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{b.name || b.code}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ── РЕФЕРАЛЫ ── */}
            {tab === "Рефералы" && (
              <Card>
                <SectionTitle sub="Реферальная программа L1 / L2">Рефералы</SectionTitle>
                <KpiGrid>
                  <KpiCard label="Рефералов L1" value={fmtNum(S?.referrals?.l1)} tone="good" />
                  <KpiCard label="Рефералов L2" value={fmtNum(S?.referrals?.l2)} />
                  <KpiCard label="Партнёров" value={fmtNum(S?.referrals?.partners)} />
                  <KpiCard label="Пригласил" value={S?.referrals?.inviter ? shortId(S.referrals.inviter) : "—"} />
                </KpiGrid>
              </Card>
            )}

            {/* ── EARLYLAND ── */}
            {tab === "EarlyLand" && (
              <Card>
                <SectionTitle>EarlyLand</SectionTitle>
                {S?.earlyland?.connected === false ? <NC note={S?.earlyland?.note} /> : (
                  <KpiGrid><KpiCard label="Состояний задач" value={fmtNum(S?.earlyland?.taskStates)} /></KpiGrid>
                )}
              </Card>
            )}

            {/* ── МОНЕТИЗАЦИЯ И ДОСТУП (G29) ── */}
            {tab === "Монетизация и доступ" && (
              aiMonLoading ? <Card><StateBlock kind="loading" message="Загрузка данных доступа…" /></Card> : (
                (() => {
                  const decisions: any[] = diag?.access || [];
                  const byCap = (k: string) => decisions.find((d) => d.capability === k);
                  const aiDec = byCap("fomo_ai.access");
                  const membershipDec = byCap("fomo_ai.membership");
                  const intelDec = byCap("fomo_intel.access");
                  const ents: any[] = diag?.entitlements || [];
                  const nftEnts = ents.filter((e) => e.sourceType === "NFT_ACTIVATION" || e.sourceType === "NFT_EVENT");
                  const membershipActive = !!(membershipDec?.membership?.active || membershipDec?.allowed || aiDec?.allowed);
                  const effUntil = membershipDec?.membership?.expiresAt || aiDec?.validUntil || null;
                  // Only access-layer capabilities (exclude external/boundary from the "included" matrix noise).
                  const accessCaps = decisions.filter((d) => d.accessType === "ACCESS_ONLY" && d.capability !== "fomo_ai.membership");
                  const hybridExternal = decisions.filter((d) => d.accessType === "HYBRID" || d.accessType === "EXTERNAL_ELIGIBILITY");
                  return (
                <div style={{ display: "grid", gap: 16 }}>
                  {/* Commercial status */}
                  <Card testId="c360-commercial-status">
                    <SectionTitle sub="Коммерческий слой (отдельно от XP)">Коммерческий статус</SectionTitle>
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                      <div style={{ background: T.soft, borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 6 }}>FOMO AI</div>
                        <Badge tone={membershipActive ? "good" : "default"}>{membershipActive ? "Активна" : "Не активна"}</Badge>
                        <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>{effUntil ? `Действует до ${fmtDate(effUntil)}` : "Нет активного доступа"}</div>
                      </div>
                      <div style={{ background: T.soft, borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 6 }}>FOMO Intel</div>
                        <Badge tone="default">{intelDec?.reason === "billing_boundary" ? "Внешний продукт" : (intelDec?.allowed ? "Активен" : "Не подключён")}</Badge>
                        <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>Отдельный биллинг (integration boundary)</div>
                      </div>
                    </div>
                  </Card>

                  {/* Subscription */}
                  <Card>
                    <SectionTitle sub="План, период, статус, источник">Подписка</SectionTitle>
                    {aiMon?.subscription ? (
                      <KpiGrid>
                        <KpiCard label="План" value={aiMon.subscription.plan} tone="good" />
                        <KpiCard label="Статус" value={aiMon.subscription.status} />
                        <KpiCard label="Период до" value={aiMon.subscription.periodEnd ? fmtDate(aiMon.subscription.periodEnd) : "—"} />
                        <KpiCard label="Источник" value={SRC_LABELS[aiMon.subscription.source] || aiMon.subscription.source || "—"} />
                      </KpiGrid>
                    ) : <StateBlock kind="empty" message="Активной подписки нет (доступ может быть по NFT или admin-гранту)" />}
                  </Card>

                  {/* AI Credits */}
                  <Card>
                    <SectionTitle sub="Кредиты ≠ деньги, ≠ доступ">AI-кредиты</SectionTitle>
                    <KpiGrid>
                      <KpiCard label="Monthly" value={fmtNum(aiMon?.balances?.monthly)} />
                      <KpiCard label="Top-up" value={fmtNum(aiMon?.balances?.topup)} />
                      <KpiCard label="Reserved" value={fmtNum(aiMon?.balances?.reserved)} />
                      <KpiCard label="Available" value={fmtNum(aiMon?.balances?.available)} tone="good" />
                      <KpiCard label="Потрачено 30д" value={fmtNum(aiMon?.ai?.creditsSpent30d)} />
                    </KpiGrid>
                  </Card>

                  {/* NFT Access */}
                  <Card testId="c360-nft-access">
                    <SectionTitle sub="Временный benefit по NFT — не perpetual">NFT Access</SectionTitle>
                    {nftEnts.length ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                          <thead><tr>{["NFT / Token", "Источник", "Активирован", "Истекает", "Осталось", "Статус"].map((h) => <th key={h} style={{ textAlign: "left", fontSize: 12, color: T.sub, fontWeight: 700, padding: "9px 12px", borderBottom: `1px solid ${T.border}`, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                          <tbody>{nftEnts.map((e: any) => {
                            const rem = e.validUntil ? Math.max(0, Math.ceil((+new Date(e.validUntil) - Date.now()) / 86400000)) : null;
                            return (
                            <tr key={e._id}>
                              <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>#{e.metadata?.tokenId || "—"}</td>
                              <td style={{ fontSize: 13, color: T.sub, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{SRC_LABELS[e.sourceType] || e.sourceType}</td>
                              <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{fmtDate(e.validFrom)}</td>
                              <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{e.validUntil ? fmtDate(e.validUntil) : "∞"}</td>
                              <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{e.status === "ACTIVE" && rem != null ? `${rem} дн.` : "—"}</td>
                              <td style={{ fontSize: 13, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}><Badge tone={e.status === "ACTIVE" ? "good" : e.status === "REVOKED" ? "bad" : "default"}>{e.status}</Badge></td>
                            </tr>
                          ); })}</tbody>
                        </table>
                      </div>
                    ) : <StateBlock kind="empty" message="Активаций NFT-доступа нет" />}
                    <div style={{ marginTop: 10, fontSize: 12, color: T.sub, background: "#FEF3C7", padding: "8px 12px", borderRadius: 8 }}>
                      При истечении доступ по NFT закрывается, но <b>NFT остаётся активом</b>.
                    </div>
                  </Card>

                  {/* NFT Utility (independent) */}
                  <Card testId="c360-nft-utility">
                    <SectionTitle sub="Web3-утилиты NFT НЕ зависят от FOMO AI Membership">NFT Utility</SectionTitle>
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                      {[["Launchpad", "invest eligibility"], ["SpacePort", "staking eligibility"], ["NFT Market", "sale / transfer"]].map(([n, d]) => (
                        <div key={n} style={{ background: T.soft, borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>{n}</div>
                          <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{d}</div>
                          <Badge tone="default">independent engine</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Capabilities ALLOW/DENY */}
                  <Card testId="c360-capabilities">
                    <SectionTitle sub="Что открыто пользователю прямо сейчас">Возможности</SectionTitle>
                    {accessCaps.length ? (
                      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                        {accessCaps.map((d: any) => (
                          <div key={d.capability} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.soft, borderRadius: 10, padding: "10px 12px" }}>
                            <span style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{CAP_LABELS[d.capability] || d.capability}</span>
                            <Badge tone={d.allowed ? "good" : "default"}>{d.allowed ? "ALLOW" : "DENY"}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : <StateBlock kind="not-collected" message="Данные доступа не загружены" />}
                    {hybridExternal.length ? (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, color: T.sub, fontWeight: 700, marginBottom: 6 }}>Внешние engine-права (NFT/staking — независимо)</div>
                        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                          {hybridExternal.map((d: any) => (
                            <div key={d.capability} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", border: `1px dashed ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
                              <span style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{CAP_LABELS[d.capability] || d.capability}</span>
                              <Badge tone="warn">{d.accessType === "HYBRID" ? "eligibility нужна" : "external engine"}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </Card>

                  {/* Explain Access */}
                  <Card testId="c360-explain">
                    <SectionTitle sub="Диагностика решения по конкретной возможности">Explain Access</SectionTitle>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      {EXPLAIN_CAPS.map((c) => (
                        <button key={c} onClick={() => runExplain(c)} data-testid={`c360-explain-${c}`}
                          style={{ padding: "7px 12px", borderRadius: 9, border: `1px solid ${explainCap === c ? T.ink : T.border}`, background: explainCap === c ? T.ink : "#fff", color: explainCap === c ? "#fff" : T.sub, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                          {CAP_LABELS[c] || c}
                        </button>
                      ))}
                    </div>
                    {explainBusy ? <StateBlock kind="loading" /> : explain ? (
                      <div style={{ background: "#0f1320", borderRadius: 12, padding: 16 }} data-testid="c360-explain-result">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: explain.allowed ? "#34d399" : "#f87171" }}>{explain.allowed ? "ALLOW" : "DENY"}</span>
                          <span style={{ fontSize: 12.5, color: "#8a93a6" }}>{CAP_LABELS[explain.capability] || explain.capability}</span>
                        </div>
                        {(explain.explanation || []).map((l: string, i: number) => (
                          <div key={i} style={{ fontSize: 13, color: "#cdd5e6", fontFamily: "monospace", padding: "2px 0" }}>{l}</div>
                        ))}
                      </div>
                    ) : <StateBlock kind="empty" message="Выберите возможность для объяснения" />}
                  </Card>

                  {/* Access history + AI ledger */}
                  <Card testId="c360-access-history">
                    <SectionTitle sub="Активации, гранты, передачи, истечения">История доступа (entitlements)</SectionTitle>
                    {ents.length ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                          <thead><tr>{["Право", "Источник", "С", "До", "Статус", "Причина"].map((h) => <th key={h} style={{ textAlign: "left", fontSize: 12, color: T.sub, fontWeight: 700, padding: "9px 12px", borderBottom: `1px solid ${T.border}`, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                          <tbody>{ents.map((e: any) => (
                            <tr key={e._id}>
                              <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{CAP_LABELS[e.capabilityKey] || e.capabilityKey}</td>
                              <td style={{ fontSize: 13, color: T.sub, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{SRC_LABELS[e.sourceType] || e.sourceType}</td>
                              <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{fmtDate(e.validFrom)}</td>
                              <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{e.validUntil ? fmtDate(e.validUntil) : "∞"}</td>
                              <td style={{ fontSize: 13, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}><Badge tone={e.status === "ACTIVE" ? "good" : e.status === "REVOKED" ? "bad" : "default"}>{e.status}</Badge></td>
                              <td style={{ fontSize: 12.5, color: T.sub, padding: "9px 12px", borderBottom: `1px solid ${T.border}` }}>{e.reason || "—"}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    ) : <StateBlock kind="empty" message="Записей о доступе нет" />}
                  </Card>
                </div>
                  ); })()
              )
            )}

            {/* ── ФИНАНСЫ (H37) ── */}
            {tab === "Финансы" && (
              finLoading ? <Card><StateBlock kind="loading" message="Загрузка финансовых данных…" /></Card> : (
                (() => {
                  const bal = finance?.balance || {};
                  const com = finance?.commerce || {};
                  const eco = economics?.economics || {};
                  const usage = economics?.providerUsage || {};
                  const fc = economics?.fomoCredits || {};
                  const brk = economics?.breakdown || {};
                  const purchases: any[] = finance?.purchases || [];
                  const timeline: any[] = finance?.timeline || [];
                  const realized = com.realizedRevenue != null ? com.realizedRevenue : (eco.realizedRevenueUsd || 0);
                  const cogs = eco.realProviderCogsUsd || 0;
                  const contribution = eco.realContributionProfitUsd != null ? eco.realContributionProfitUsd : eco.estimatedContributionProfitUsd;
                  const marginPct = eco.realContributionMarginPct != null ? eco.realContributionMarginPct : eco.estimatedContributionMarginPct;
                  const statusKey = eco.profitabilityStatus || (realized > 0 ? "HEALTHY" : (cogs > 0 ? "NO_PAID_REVENUE" : "NO_ACTIVITY"));
                  const st = PROFIT_STATUS[statusKey] || PROFIT_STATUS.NO_ACTIVITY;
                  const openAcquiring = () => history.push("/acquiring");
                  return (
                <div style={{ display: "grid", gap: 16 }} data-testid="c360-finance">
                  {/* Balance header */}
                  <Card testId="c360-finance-balance">
                    <SectionTitle sub="Реальные деньги пользователя в системе (zkSync / USDC)">FOMO Balance</SectionTitle>
                    <KpiGrid>
                      <KpiCard testId="fin-available" label="Available" value={fmtUsdc(bal.available)} tone="good" />
                      <KpiCard label="Reserved" value={fmtUsdc(bal.reserved)} tone={bal.reserved > 0 ? "warn" : "default"} />
                      <KpiCard label="Total" value={fmtUsdc(bal.total)} />
                      <KpiCard label="Депозиты (lifetime)" value={fmtUsdc(com.depositedLifetime)} />
                      <KpiCard label="Выводы (lifetime)" value={fmtUsdc(com.withdrawnLifetime)} />
                      <KpiCard label="Покупки (lifetime)" value={fmtUsdc(com.purchasesLifetime)} />
                      <KpiCard label="Возвраты (lifetime)" value={fmtUsdc(com.refundedLifetime)} />
                    </KpiGrid>
                  </Card>

                  {/* On-chain custody reconciliation — internal FOMO ledger vs on-chain usdBalance */}
                  {(() => {
                    const cr = custodyRecon || {};
                    const RS: Record<string, { tone: any; label: string }> = {
                      IN_SYNC: { tone: "good", label: "В синхроне" },
                      ONCHAIN_SURPLUS: { tone: "warn", label: "On-chain излишек (есть незачисл. депозит)" },
                      OUT_OF_SYNC: { tone: "bad", label: "Рассинхрон" },
                      ONCHAIN_UNAVAILABLE: { tone: "default", label: "On-chain недоступен (RPC)" },
                      UNKNOWN: { tone: "default", label: "Нет данных" },
                    };
                    const s = RS[cr.status] || RS.UNKNOWN;
                    return (
                      <Card testId="c360-finance-custody-recon">
                        <SectionTitle sub="Внутренний FOMO Balance (Money-ledger) против реального on-chain usdBalance в custody-контракте (zkSync)">Сверка custody (internal ↔ on-chain)</SectionTitle>
                        <KpiGrid>
                          <KpiCard testId="recon-internal-available" label="FOMO · Available" value={fmtUsdc(bal.available)} tone="good" />
                          <KpiCard label="FOMO · Reserved" value={fmtUsdc(bal.reserved)} tone={bal.reserved > 0 ? "warn" : "default"} />
                          <KpiCard label="FOMO · Total" value={fmtUsdc(bal.total)} />
                          <KpiCard label="Escrow-locked (custody)" value={fmtUsdc(cr.custodyLocked)} tone={cr.custodyLocked > 0 ? "warn" : "default"} />
                          <KpiCard testId="recon-onchain" label="On-chain usdBalance" value={cr.onchainUsdBalance == null ? "—" : fmtUsdc(cr.onchainUsdBalance)} />
                          <KpiCard label="Ожидается on-chain" value={cr.expectedOnchain == null ? "—" : fmtUsdc(cr.expectedOnchain)} />
                          <KpiCard testId="recon-diff" label="Разница" value={cr.difference == null ? "—" : fmtUsdc(cr.difference)} tone={cr.status === "IN_SYNC" ? "good" : cr.status === "OUT_OF_SYNC" ? "bad" : "default"} />
                        </KpiGrid>
                        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Статус сверки:</span>
                          <span data-testid="recon-status"><Badge tone={s.tone}>{s.label}</Badge></span>
                          {cr.wallet ? <span style={{ fontSize: 12, color: T.faint }}>{sliceAddress(cr.wallet)}</span> : <span style={{ fontSize: 12, color: T.faint }}>кошелёк не привязан</span>}
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: T.sub, background: "#F1F5F9", padding: "8px 12px", borderRadius: 8, lineHeight: "18px" }}>
                          Ожидается on-chain = FOMO Total − escrow-locked. «On-chain излишек» — это, как правило, незачисленный депозит (используйте Recover Deposit). Escrow-locked — суммы, залоченные незавершёнными покупками (safeMoneyUSD), это НЕ рассинхрон.
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Economics / P&L header */}
                  <Card testId="c360-finance-pnl">
                    <SectionTitle sub="Выручка учитывается ТОЛЬКО из реально оплаченных (SETTLED) покупок">Экономика клиента (P&L)</SectionTitle>
                    <KpiGrid>
                      <KpiCard testId="fin-realized" label="Realized revenue" value={fmtUsd(realized)} tone={realized > 0 ? "good" : "default"} />
                      <KpiCard testId="fin-cogs" label="Provider COGS (OpenAI)" value={fmtUsd(cogs)} tone={cogs > 0 ? "warn" : "default"} />
                      <KpiCard testId="fin-contribution" label="Contribution" value={contribution != null ? fmtUsd(contribution) : "—"} tone={contribution != null && contribution >= 0 ? "good" : contribution != null ? "bad" : "default"} />
                      <KpiCard testId="fin-margin" label="Contribution margin" value={marginPct != null ? `${Math.round(marginPct * 1000) / 10}%` : "—"} />
                    </KpiGrid>
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Статус прибыльности:</span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {eco.targetMarginPct != null ? <span style={{ fontSize: 12, color: T.faint }}>target ≥ {Math.round(eco.targetMarginPct * 100)}%</span> : null}
                      {eco.overBudget ? <Badge tone="bad">Over AI budget</Badge> : null}
                    </div>
                    {realized === 0 && (com.purchasesLifetime === 0) ? (
                      <div style={{ marginTop: 10, fontSize: 12, color: T.sub, background: "#FEF3C7", padding: "8px 12px", borderRadius: 8 }}>
                        Доступ выдан без реальной оплаты (NFT / admin-грант / legacy). Номинальная цена продукта не считается выручкой.
                      </div>
                    ) : null}
                  </Card>

                  {/* Money movement timeline */}
                  <Card testId="c360-finance-movements">
                    <SectionTitle sub="DEPOSIT · PURCHASE · WITHDRAWAL · REFUND · ADJUSTMENT — из MoneyLedger">Движение денег</SectionTitle>
                    {timeline.length ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                          <thead><tr>{["Дата", "Операция", "Сумма", "Актив", "Тип/Ref", "txHash / ID"].map((h) => <th key={h} style={{ textAlign: "left", fontSize: 12, color: T.sub, fontWeight: 700, padding: "9px 12px", borderBottom: `1px solid ${T.border}`, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                          <tbody>{timeline.map((t: any, i: number) => {
                            const isCredit = t.direction === "CREDIT";
                            const ref = t.txHash || t.referenceId || "";
                            const isTx = /^0x[0-9a-fA-F]{40,}/.test(String(t.txHash || ""));
                            return (
                              <tr key={i} style={{ cursor: ref ? "pointer" : "default" }} data-testid={`fin-move-${i}`}>
                                <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>{fmtDate(t.at)}</td>
                                <td style={{ fontSize: 13, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}><Badge tone={t.type === "PURCHASE" ? "info" : t.type === "WITHDRAWAL" ? "warn" : t.type === "REFUND" ? "default" : "good"}>{t.label || MONEY_OP_LABEL[t.type] || t.type}</Badge></td>
                                <td style={{ fontSize: 13, fontWeight: 700, color: isCredit ? T.good : T.bad, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>{isCredit ? "+" : "−"}{fmtUsdc(t.amount)}</td>
                                <td style={{ fontSize: 13, color: T.sub, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>{t.asset || "USDC"}</td>
                                <td style={{ fontSize: 12.5, color: T.sub, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>{t.referenceType || "—"}</td>
                                <td style={{ fontSize: 12.5, fontFamily: "monospace", padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>
                                  {isTx ? (
                                    <a href={`https://explorer.zksync.io/tx/${t.txHash}`} target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: "none" }} title="Открыть транзакцию в zkSync Explorer">{shortId(String(t.txHash))} ↗</a>
                                  ) : ref ? (
                                    <span onClick={openAcquiring} style={{ color: T.accent, cursor: "pointer" }} title="Открыть в Эквайринге">{shortId(String(ref))}</span>
                                  ) : "—"}
                                </td>
                              </tr>
                            );
                          })}</tbody>
                        </table>
                      </div>
                    ) : <StateBlock kind="empty" message="Движений по счёту нет" />}
                  </Card>

                  {/* Purchases */}
                  <Card testId="c360-finance-purchases">
                    <SectionTitle sub="Реальные покупки/оплаты (сущность Purchase)">Покупки и оплаты</SectionTitle>
                    {purchases.length ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                          <thead><tr>{["Продукт", "Сумма", "Статус", "Оплачено", "Renewal", ""].map((h, i) => <th key={i} style={{ textAlign: "left", fontSize: 12, color: T.sub, fontWeight: 700, padding: "9px 12px", borderBottom: `1px solid ${T.border}`, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                          <tbody>{purchases.map((p: any) => (
                            <tr key={p.id} data-testid={`fin-purchase-${p.id}`}>
                              <td style={{ fontSize: 13, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>{p.productCode === "FOMO_AI" ? "FOMO AI Membership" : p.productCode}</td>
                              <td style={{ fontSize: 13, fontWeight: 700, color: T.ink, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>{fmtUsdc(p.amount)}</td>
                              <td style={{ fontSize: 13, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}><Badge tone={p.status === "SETTLED" ? "good" : p.status === "FAILED" ? "bad" : p.status === "REFUNDED" ? "warn" : "default"}>{p.status}</Badge></td>
                              <td style={{ fontSize: 13, color: T.sub, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>{p.settledAt ? fmtDate(p.settledAt) : "—"}</td>
                              <td style={{ fontSize: 13, color: T.sub, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}>{p.isRenewal ? "Да" : "—"}</td>
                              <td style={{ fontSize: 12.5, padding: "9px 12px", borderBottom: `1px solid ${T.soft}` }}><button onClick={openAcquiring} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: T.accent, fontWeight: 700, cursor: "pointer" }} data-testid={`fin-purchase-open-${p.id}`}>Открыть в Эквайринге</button></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    ) : <StateBlock kind="empty" message="Покупок нет" />}
                  </Card>

                  {/* AI economics */}
                  <Card testId="c360-finance-ai">
                    <SectionTitle sub="AI-кредиты — отдельная экономика; здесь показана только финансовая сторона (COGS)">AI-экономика</SectionTitle>
                    {economics ? (
                      <>
                        <KpiGrid>
                          <KpiCard label="FOMO Credits granted" value={fmtNum(fc.granted)} />
                          <KpiCard label="FOMO Credits spent" value={fmtNum(fc.spent)} />
                          <KpiCard label="FOMO Credits remaining" value={fmtNum(fc.remaining)} tone="good" />
                          <KpiCard label="Utilization" value={fc.utilizationPct != null ? `${Math.round(fc.utilizationPct)}%` : "—"} />
                          <KpiCard label="AI requests" value={fmtNum(usage.requests)} />
                          <KpiCard label="Provider tokens" value={fmtNum(usage.totalTokens)} />
                          <KpiCard label="Actual provider COGS" value={fmtUsd(usage.providerCogsUsd)} tone="warn" />
                          <KpiCard label="Projected monthly COGS" value={fmtUsd(eco.projectedCogsUsd)} />
                          <KpiCard label="Projected margin" value={eco.projectedMarginPct != null ? `${Math.round(eco.projectedMarginPct * 1000) / 10}%` : "—"} />
                          <KpiCard label="Allowed AI COGS" value={fmtUsd(eco.allowedAiCogsUsd)} />
                        </KpiGrid>
                        {(brk.providers?.length || brk.operations?.length) ? (
                          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: 14 }}>
                            {[["Провайдеры", brk.providers], ["Операции", brk.operations]].map(([title, rows]: any) => (
                              <div key={title} style={{ background: T.soft, borderRadius: 12, padding: 14 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, marginBottom: 8, textTransform: "uppercase" }}>{title}</div>
                                {(rows || []).length ? (rows || []).map((r: any, i: number) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5, color: T.sub, borderBottom: `1px solid ${T.border}` }}>
                                    <span style={{ color: T.ink, fontWeight: 600 }}>{r.key}</span>
                                    <span>{r.requests} req · {fmtUsd(r.cogsUsd)}</span>
                                  </div>
                                )) : <div style={{ fontSize: 12.5, color: T.faint }}>Нет данных</div>}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : <StateBlock kind="empty" message="Данные AI-экономики недоступны" />}
                  </Card>

                  {/* Membership summary + link to access tab */}
                  <Card testId="c360-finance-membership">
                    <SectionTitle sub="Права доступа и подписка живут в отдельной вкладке">Подписка</SectionTitle>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {finance?.subscription ? (
                          <>
                            <Badge tone="info">{finance.subscription.productType === "FOMO_AI" ? "FOMO AI" : finance.subscription.productType}</Badge>
                            <Badge tone={finance.subscription.status === "ACTIVE" ? "good" : "default"}>{finance.subscription.status}</Badge>
                            <span style={{ fontSize: 12.5, color: T.sub }}>Источник: {finance.subscription.source || "—"}</span>
                            {finance.subscription.currentPeriodEnd ? <span style={{ fontSize: 12.5, color: T.sub }}>до {fmtDate(finance.subscription.currentPeriodEnd)}</span> : null}
                            <span style={{ fontSize: 12.5, color: T.sub }}>Оплачено: {fmtUsd(finance.subscription.paidAmount)}</span>
                          </>
                        ) : <span style={{ fontSize: 13, color: T.sub }}>Активной подписки нет</span>}
                      </div>
                      <button onClick={() => setTab("Монетизация и доступ")} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 13, color: T.accent, fontWeight: 700, cursor: "pointer" }} data-testid="fin-open-monetization">Открыть «Монетизация и доступ»</button>
                    </div>
                  </Card>
                </div>
                  ); })()
              )
            )}

            {/* ── КОНТЕНТ ── */}
            {tab === "Контент" && (
              <div style={{ display: "grid", gap: 16 }}>
                <Card>
                  <SectionTitle sub="Контент и вовлечённость">Контент</SectionTitle>
                  <KpiGrid>
                    <KpiCard label="Комментарии" value={fmtNum(S?.content?.comments)} />
                    <KpiCard label="Проекты" value={fmtNum(S?.content?.projects)} />
                    <KpiCard label="Новости" value={fmtNum(S?.content?.news)} />
                    <KpiCard label="Портфели" value={fmtNum(S?.content?.portfolios)} />
                    <KpiCard label="Лайки отзывов" value={fmtNum(S?.content?.reviewLikes)} />
                    <KpiCard label="Дизлайки отзывов" value={fmtNum(S?.content?.reviewDislikes)} />
                  </KpiGrid>
                  <div style={{ marginTop: 16 }}>
                    <SectionTitle sub="Комментарии пользователя с метриками вовлечённости">Комментарии</SectionTitle>
                    <SectionTable id={id} section="comments" columns={commentColumns} empty="Комментариев нет" testId="c360-comments-table" minWidth={760} />
                  </div>
                </Card>

                {/* ── Content & Influence (объяснимость Content Influence + XP) ── */}
                <Card testId="c360-influence">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <SectionTitle sub="Почему такой Content Influence и сколько XP реально начислено — из XP Ledger">Content &amp; Influence</SectionTitle>
                    <div style={{ display: "inline-flex", background: T.soft, borderRadius: 10, padding: 3, gap: 2 }}>
                      {([["7d", "7 дней"], ["30d", "30 дней"], ["all", "Всё время"]] as const).map(([k, lbl]) => (
                        <button key={k} onClick={() => setInfluPeriod(k)} data-testid={`c360-influence-period-${k}`}
                          style={{
                            border: "none", cursor: "pointer", borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 700,
                            background: influPeriod === k ? "#fff" : "transparent",
                            color: influPeriod === k ? T.ink : T.sub,
                            boxShadow: influPeriod === k ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                          }}>{lbl}</button>
                      ))}
                    </div>
                  </div>

                  {influLoading ? <StateBlock kind="loading" /> : !influence ? (
                    <StateBlock kind="empty" message="Данные по влиянию контента отсутствуют" />
                  ) : (() => {
                    const sum = influence?.periods?.[influPeriod] || influence?.summary || {};
                    const topTopics = influence?.topTopics || [];
                    const milestones = influence?.milestones || [];
                    const ex = influence?.exclusionStats || {};
                    return (
                      <>
                        <KpiGrid>
                          <KpiCard label="Content Influence" value={(Number(sum.contentInfluence ?? 0)).toFixed(1)} tone="good" hint="Взвешенно, с затуханием по времени" testId="c360-influence-score" />
                          <KpiCard label="Influence XP" value={`+${fmtNum(sum.influenceXpEarned)} XP`} tone="good" hint="Начислено из XP Ledger" />
                          <KpiCard label="Топики" value={fmtNum(sum.topicsPublished)} />
                          <KpiCard label="Уник. вовлечённые" value={fmtNum(sum.uniqueEngagers)} />
                          <KpiCard label="Комментарии" value={fmtNum(sum.commentsReceived)} />
                          <KpiCard label="Репосты" value={fmtNum(sum.repostsReceived)} />
                          <KpiCard label="Просмотры" value={fmtNum(sum.totalViews)} />
                          <KpiCard label="Лайки" value={fmtNum(sum.likesReceived)} />
                          <KpiCard label="Подписки с контента" value={sum.followersFromContent == null ? "не отслеживается" : fmtNum(sum.followersFromContent)} hint={sum.followersFromContent == null ? "Пока нет привязки follow → пост" : undefined} />
                        </KpiGrid>

                        {/* Top-performing content */}
                        <div style={{ marginTop: 18 }}>
                          <SectionTitle sub="Топ-контент по влиянию (за всё время)">Топ контент</SectionTitle>
                          {topTopics.length === 0 ? (
                            <StateBlock kind="empty" message="У пользователя пока нет топиков" height={80} />
                          ) : (
                            <div style={{ overflowX: "auto" }} data-testid="c360-influence-top">
                              <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                  <tr style={{ textAlign: "left", color: T.sub, borderBottom: `1px solid ${T.border}` }}>
                                    {["Топик", "Опубликован", "Просм.", "Вовлечённые", "Лайки", "Комм.", "Репосты", "ER", "Raw", "XP"].map((h) => (
                                      <th key={h} style={{ padding: "9px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {topTopics.map((t: any) => (
                                    <tr key={t.topicId} style={{ borderBottom: `1px solid ${T.border}` }}>
                                      <td style={{ padding: "9px 10px", maxWidth: 240, color: T.ink, fontWeight: 600 }}>
                                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 230 }} title={t.title}>{t.title}</div>
                                      </td>
                                      <td style={{ padding: "9px 10px", color: T.sub, whiteSpace: "nowrap" }}>{fmtDate(t.publishedAt)}</td>
                                      <td style={{ padding: "9px 10px" }}>{fmtNum(t.views)}</td>
                                      <td style={{ padding: "9px 10px" }}>{fmtNum(t.uniqueEngagers)}</td>
                                      <td style={{ padding: "9px 10px" }}>{fmtNum(t.likes)}</td>
                                      <td style={{ padding: "9px 10px" }}>{fmtNum(t.qualifiedComments)}</td>
                                      <td style={{ padding: "9px 10px" }}>{fmtNum(t.reposts)}</td>
                                      <td style={{ padding: "9px 10px", color: T.sub }}>{(Number(t.engagementRate) * 100).toFixed(1)}%</td>
                                      <td style={{ padding: "9px 10px", fontWeight: 700, color: T.ink }}>{fmtNum(t.rawInfluence)}</td>
                                      <td style={{ padding: "9px 10px" }}>{t.xpEarned ? <Badge tone="good">+{fmtNum(t.xpEarned)}</Badge> : <span style={{ color: T.sub }}>—</span>}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Why this score — XP milestone timeline (authoritative, from ledger) */}
                        <div style={{ marginTop: 18 }}>
                          <SectionTitle sub="Причины начисления XP — вехи влияния из XP Ledger">Почему такой скор</SectionTitle>
                          {milestones.length === 0 ? (
                            <StateBlock kind="empty" message="XP за влияние контента ещё не начислялся" height={80} />
                          ) : (
                            <div style={{ display: "grid", gap: 8 }} data-testid="c360-influence-milestones">
                              {milestones.map((m: any, i: number) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.soft, borderRadius: 10, flexWrap: "wrap" }}>
                                  <Badge tone="info">CONTENT_INFLUENCE_MILESTONE</Badge>
                                  <span style={{ fontSize: 13, color: T.ink, fontWeight: 600, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.title}>{m.title}</span>
                                  {m.milestone != null ? <span style={{ fontSize: 12.5, color: T.sub }}>Веха {fmtNum(m.milestone)} influence</span> : null}
                                  <Badge tone="good">+{fmtNum(m.xp)} XP</Badge>
                                  <span style={{ marginLeft: "auto", fontSize: 12, color: T.sub }}>{fmtDate(m.awardedAt)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Anti-farming / exclusion transparency */}
                        <div style={{ marginTop: 18, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                          <SectionTitle sub="Почему сырое вовлечение превращается в квалифицированное">Анти-фарминг / исключения</SectionTitle>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} data-testid="c360-influence-exclusions">
                            <Badge>Само-взаимодействия исключены: {fmtNum(ex.selfInteractionsExcluded)}</Badge>
                            <Badge>Дубли вовлечения исключены: {fmtNum(ex.duplicateEngagementsExcluded)}</Badge>
                            <Badge>Скрытые/удалённые исключены: {fmtNum(ex.hiddenDeletedExcluded)}</Badge>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </Card>
              </div>
            )}

            {/* ── МОДЕРАЦИЯ ── */}
            {tab === "Модерация" && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div style={{ display: "grid", gap: 16 }}>
                  <Card>
                    <SectionTitle>Статус и флаги</SectionTitle>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      <Badge tone={STATE_TONE[state] || "default"}>Статус: {STATE_LABEL[state] || state}</Badge>
                      <Badge tone={S?.moderation?.redFlags ? "bad" : "default"}>Red flags: {fmtNum(S?.moderation?.redFlags)}</Badge>
                      <Badge>Записей в логе: {fmtNum(S?.moderation?.actionLogsTotal)}</Badge>
                      {S?.moderation?.suspendedUntil ? <Badge tone="bad">Suspend до {fmtDate(S.moderation.suspendedUntil)}</Badge> : null}
                    </div>
                    {(S?.moderation?.redFlagsList?.length || S?.moderation?.greenFlagsList?.length) ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        {(S.moderation.redFlagsList || []).map((f: any, i: number) => <div key={`r${i}`} style={{ fontSize: 13, color: T.bad }}>⚑ {f.text}</div>)}
                        {(S.moderation.greenFlagsList || []).map((f: any, i: number) => <div key={`g${i}`} style={{ fontSize: 13, color: T.good }}>✓ {f.text}</div>)}
                      </div>
                    ) : <StateBlock kind="empty" message="Флагов нет" height={70} />}
                  </Card>
                  <Timeline title="Журнал модерации / действий" />
                </div>
                <ActionsPanel />
              </div>
            )}

            {/* ── БЕЗОПАСНОСТЬ ── */}
            {tab === "Безопасность" && (
              <div style={{ display: "grid", gap: 16 }}>
                <Card>
                  <SectionTitle sub="Только реально доступные данные">Безопасность и верификация</SectionTitle>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone={S?.security?.is2FAEnabled ? "good" : "warn"}>2FA: {S?.security?.is2FAEnabled ? "включена" : "выключена"}</Badge>
                    <Badge tone={S?.security?.verificationStatus ? "good" : "default"}>Верификация: {S?.security?.verificationStatus ? "да" : "нет"}</Badge>
                    <Badge tone={S?.security?.emailVerified ? "good" : "default"}>Email: {S?.security?.emailVerified ? "указан" : "нет"}</Badge>
                    <Badge>KYC: {S?.security?.kyc || "не подключено"}</Badge>
                    <Badge tone="info">Auth: {S?.security?.authProvider || "—"}</Badge>
                  </div>
                </Card>
                <Card>
                  <SectionTitle>Привязанные кошельки ({S?.security?.walletCount ?? 0})</SectionTitle>
                  {(S?.security?.wallets || []).length ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {S.security.wallets.map((w: any, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: T.soft, borderRadius: 10 }}>
                          <Badge tone="info">{w.chain}</Badge>
                          <span style={{ fontSize: 13, color: T.ink, fontFamily: "monospace" }}>{w.address}</span>
                        </div>
                      ))}
                    </div>
                  ) : <StateBlock kind="empty" message="Кошельки не привязаны" />}
                </Card>
              </div>
            )}

            {/* ── SUPPORT (Phase 2: обращения + апелляции + чат) ── */}
            {tab === "Support" && (
              <div style={{ display: "grid", gap: 16 }}>
                <Card testId="c360-support-header">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <SectionTitle sub="Прямой чат с пользователем в FOMO Chat + история обращений">Поддержка пользователя</SectionTitle>
                    <button onClick={openChat} disabled={!adminUserData}
                      style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: adminUserData ? "pointer" : "not-allowed", opacity: adminUserData ? 1 : 0.5, display: "inline-flex", alignItems: "center", gap: 8 }}
                      data-testid="c360-support-open-chat"><span style={{ fontSize: 16 }}>💬</span> Открыть чат</button>
                  </div>
                  <KpiGrid>
                    <KpiCard label="Обращений" value={fmtNum(dossier?.community?.supportTotal)} />
                    <KpiCard label="Апелляций" value={fmtNum(dossier?.community?.appealsTotal)} tone={dossier?.community?.appealsTotal ? "warn" : "default"} />
                    <KpiCard label="Комментариев" value={fmtNum(dossier?.community?.commentsTotal)} />
                    <KpiCard label="Записей в логе" value={fmtNum(dossier?.community?.logsTotal)} />
                  </KpiGrid>
                </Card>
                <Card><SectionTitle sub="Обращения в поддержку (форма Support Request)">История обращений</SectionTitle>
                  <SectionTable id={id} section="support" columns={supportColumns} empty="Обращений в поддержку нет" testId="c360-support-table" minWidth={760} />
                </Card>
                <Card><SectionTitle sub="Апелляции по OTC / P2P сделкам">Апелляции (диспуты)</SectionTitle>
                  <SectionTable id={id} section="appeals" columns={appealColumns} empty="Апелляций нет" testId="c360-appeals-table" minWidth={820} />
                </Card>
              </div>
            )}

            {/* ── ИСТОРИЯ ── */}
            {tab === "История" && <Timeline title="Единая хронология событий (Unified Timeline)" />}
          </>
        )}
      </div>
      {isChatVisible && adminUserData ? (
        <ChatModal
          isVisible={isChatVisible}
          setIsVisible={setIsChatVisible}
          userData={adminUserData}
          token={token}
          initialUserId={id}
        />
      ) : null}
    </Layout>
  );
};

export default Customer360;

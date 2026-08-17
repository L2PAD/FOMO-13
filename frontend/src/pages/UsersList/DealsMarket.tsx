import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import Layout from "../../components/layouts/main_layout/layout";
import {
  T, Card, KpiCard, KpiGrid, SectionTitle, StateBlock, Badge, fmtNum, fmtDate, shortId,
} from "../Statistics/ui";
import sliceAddress from "../../components/utils/sliceAddress";
import getAccessToken from "../../components/utils/getAccessToken";
import ChatModal from "../../components/layouts/FomoChat/ChatModal";
import { IUser } from "../../components/types/global_types";
import fetchDeals from "../../components/services/deals/fetchDeals";
import fetchDealsP2P from "../../components/services/deals/fetchDealsP2P";
import fetchWithdrawItems from "../../components/services/deals/fetchWithdrawItems";
import fetchDeposits from "../../components/services/deals/fetchDeposits";
import fetchAppeals from "../../components/services/deals/fetchAppeals";
import fetchMarketStats, { MarketStats, MarketTrader } from "../../components/services/deals/fetchMarketStats";
import fetchNftStats, { NftStats } from "../../components/services/deals/fetchNftStats";
import fetchP2PStats, { P2PStats, P2PAd } from "../../components/services/deals/fetchP2PStats";
import dealAction from "../../components/services/deals/dealAction";
import resolveAppeal from "../../components/services/deals/resolveAppeal";
import startAppealProcess from "../../components/services/deals/startAppealProcess";
import { approveWithdraw, rejectWithdraw } from "../../components/services/deals/updateWithdrawStatus";
import { ZK_CONTRACT, NFT_CONTRACT } from "./dealsContract";
import fetchContractsHealth from "../../components/services/deals/fetchContractsHealth";

/* Design-system primary (matches admin --color-primary) */
const GREEN = "#04A584";
const GREEN_SOFT = "#E6F6F2";

/* ─────────────────────────── helpers & dictionaries ─────────────────────────── */
type Tab = "Обзор" | "OTC" | "P2P" | "NFT" | "Выводы" | "Депозиты" | "Апелляции" | "Смарт-контракт";
const TABS: Tab[] = ["Обзор", "OTC", "P2P", "NFT", "Выводы", "Депозиты", "Апелляции", "Смарт-контракт"];

const DEAL_STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "info" | "default" }> = {
  waiting: { label: "Ожидает", tone: "warn" },
  started: { label: "В процессе (эскроу)", tone: "info" },
  ended: { label: "Завершена", tone: "good" },
  blocked: { label: "Заблокирована", tone: "bad" },
  "forced-termination": { label: "Принудительно закрыта", tone: "bad" },
};
const SERVICE_RU: Record<string, string> = {
  Services: "Услуги", NFT: "NFT", "Project account": "Аккаунт проекта",
  Projects: "Проекты", KYC: "KYC", "Social network": "Соцсеть",
};
const APPEAL_STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "info" | "default" }> = {
  open: { label: "Открыта", tone: "warn" },
  in_review: { label: "На рассмотрении", tone: "info" },
  resolved: { label: "Решена", tone: "good" },
};
const WSTATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "default" }> = {
  CONFIRMED: { label: "Подтверждён", tone: "good" }, COMPLETED: { label: "Исполнен", tone: "good" },
  PROCESSING: { label: "В обработке", tone: "warn" }, PENDING: { label: "В ожидании", tone: "warn" },
  FAILED: { label: "Ошибка", tone: "bad" }, REJECTED: { label: "Отклонён", tone: "bad" },
};
const DSTATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "default" }> = {
  confirmed: { label: "Подтверждён", tone: "good" }, pending: { label: "В ожидании", tone: "warn" }, failed: { label: "Ошибка", tone: "bad" },
};

const th: React.CSSProperties = { textAlign: "left", fontSize: 11, color: T.sub, fontWeight: 700, padding: "8px 10px", borderBottom: `1px solid ${T.border}`, textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: 0.2 };
const td: React.CSSProperties = { fontSize: 12.5, color: T.ink, padding: "7px 10px", borderBottom: `1px solid ${T.soft}`, verticalAlign: "middle" };
const money = (v: any, cur?: string) => `${fmtNum(v)} ${(cur || "USDC").toUpperCase()}`;
const explorerTx = (h?: string) => (h && /^0x[0-9a-fA-F]{20,}/.test(h)
  ? <a href={`${ZK_CONTRACT.explorer}/tx/${h}`} target="_blank" rel="noreferrer" style={{ color: GREEN, textDecoration: "none", fontFamily: "monospace" }}>{shortId(h)} ↗</a>
  : <span style={{ color: T.faint, fontFamily: "monospace" }}>{h ? shortId(h) : "—"}</span>);

const UserCell: React.FC<{ u?: IUser | null; role?: string; onOpen?: (id: string) => void }> = ({ u, role, onOpen }) => {
  if (!u) return <span style={{ color: T.faint }}>—</span>;
  const id = (u as any)?._id;
  return (
    <div style={{ lineHeight: 1.3, cursor: onOpen && id ? "pointer" : "default" }} onClick={(e) => { if (onOpen && id) { e.stopPropagation(); onOpen(id); } }}>
      <div style={{ fontWeight: 700, color: onOpen && id ? GREEN : T.ink }}>{u.username || (u.email || "").split("@")[0] || "—"}{role ? <span style={{ color: T.faint, fontWeight: 500 }}> · {role}</span> : null}</div>
      <div style={{ fontSize: 11, color: T.faint, fontFamily: "monospace" }}>{u.wallet ? sliceAddress(u.wallet) : "—"}{u.fomoId ? ` · #${u.fomoId}` : ""}</div>
    </div>
  );
};

/* Design-matched dropdown (replaces native <select>) */
const Dropdown: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; testId?: string; minWidth?: number }> = ({ value, onChange, options, testId, minWidth = 170 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = options.find((o) => o.value === value)?.label || options[0]?.label;
  return (
    <div ref={ref} style={{ position: "relative", minWidth }} data-testid={testId}>
      <button type="button" onClick={() => setOpen((s) => !s)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#fff", border: `1px solid ${open ? GREEN : T.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, color: T.ink, fontWeight: 600, cursor: "pointer", outline: "none", boxShadow: open ? `0 0 0 3px ${GREEN_SOFT}` : "none", transition: "border 120ms, box-shadow 120ms" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current}</span>
        <span style={{ color: T.faint, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms", fontSize: 11 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 12px 30px rgba(15,23,42,0.14)", padding: 6, zIndex: 50, maxHeight: 280, overflowY: "auto" }}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 8, background: active ? GREEN : "transparent", color: active ? "#fff" : T.ink, border: "none", borderRadius: 8, padding: "9px 11px", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer" }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget.style.background = GREEN_SOFT); }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget.style.background = "transparent"); }}>
                <span style={{ width: 14, display: "inline-block" }}>{active ? "✓" : ""}</span>{o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const primaryBtn = (bg = GREEN, color = "#fff"): React.CSSProperties => ({ background: bg, color, border: "none", borderRadius: 10, padding: "8px 15px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" });
const ghostBtn: React.CSSProperties = { background: "#fff", color: T.ink, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 15px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" };

/* ─────────────────────────── data hook ─────────────────────────── */
function useTabData(tab: Tab, filters: { status: string; search: string; sort: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    if (tab === "Смарт-контракт" || tab === "Обзор" || tab === "NFT") { setLoading(false); return; }
    setLoading(true); setError(null);
    (async () => {
      try {
        let items: any[] = []; let tot = 0;
        const statusQ = filters.status && filters.status !== "all" ? `&dealStatus=${filters.status}` : "";
        const searchQ = filters.search ? `&searchValue=${encodeURIComponent(filters.search)}` : "";
        const sortQ = filters.sort ? `&sortField=${filters.sort}` : "";
        if (tab === "OTC") {
          const r = await fetchDeals(`?limit=100&offset=0${statusQ}${searchQ}${sortQ}`);
          items = r.data?.deals || []; tot = r.data?.total || items.length;
        } else if (tab === "P2P") {
          const r = await fetchDealsP2P(`?limit=100&offset=0${statusQ}${searchQ}${sortQ}`);
          items = r.data?.deals || []; tot = r.data?.total || items.length;
        } else if (tab === "Выводы") {
          const r = await fetchWithdrawItems({ page: 1, limit: 100, search: filters.search, status: filters.status !== "all" ? filters.status : undefined });
          items = r.data?.data || r.data || []; tot = r.data?.total || items.length;
        } else if (tab === "Депозиты") {
          const r = await fetchDeposits({ page: 1, limit: 100 });
          items = r.data?.data || r.data || []; tot = r.data?.total || items.length;
        } else if (tab === "Апелляции") {
          const st = filters.status && filters.status !== "all" ? filters.status : "all";
          const r = await fetchAppeals(`?limit=100&offset=0&status=${st}`);
          items = r.data?.appeals || []; tot = r.data?.total || items.length;
        }
        if (!alive) return;
        setRows(items); setTotal(tot); setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Ошибка загрузки"); setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tab, filters.status, filters.search, filters.sort, tick]);

  return { rows, total, loading, error, refetch };
}

/* ─────────────────────────── main page ─────────────────────────── */
const DealsMarket: React.FC = () => {
  const history = useHistory();
  const [tab, setTab] = useState<Tab>("Обзор");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [resolveTarget, setResolveTarget] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [chatUserId, setChatUserId] = useState<string | null>(null);

  const token = getAccessToken();
  const adminUserData = useMemo<IUser | null>(() => { try { const r = localStorage.getItem("fomoUser"); return r ? JSON.parse(r) : null; } catch { return null; } }, []);
  const goToUser = useCallback((id: string) => { if (id) history.push(`/users_list/user/${id}`); }, [history]);

  useEffect(() => { const t = setTimeout(() => setSearch(searchInput.trim()), 400); return () => clearTimeout(t); }, [searchInput]);
  useEffect(() => { setStatus("all"); setSearch(""); setSearchInput(""); }, [tab]);

  const { rows, total, loading, error, refetch } = useTabData(tab, { status, search, sort });

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };

  const runAction = async (action: string, id: string, method: "PUT" | "POST", okMsg: string) => {
    setBusy(true);
    const res = await dealAction(action, id, method);
    setBusy(false);
    if (res.isSuccess) { notify(okMsg, true); setSelectedDeal(null); refetch(); }
    else notify("Не удалось выполнить действие", false);
  };

  const statusOptions = tab === "Апелляции"
    ? [{ value: "all", label: "Все статусы" }, { value: "open", label: "Открытые" }, { value: "in_review", label: "На рассмотрении" }, { value: "resolved", label: "Решённые" }]
    : (tab === "OTC" || tab === "P2P")
      ? [{ value: "all", label: "Все статусы" }, { value: "waiting", label: "Ожидает" }, { value: "started", label: "В процессе" }, { value: "ended", label: "Завершена" }, { value: "blocked", label: "Заблокирована" }]
      : [{ value: "all", label: "Все статусы" }, { value: "PENDING", label: "В ожидании" }, { value: "PROCESSING", label: "В обработке" }, { value: "CONFIRMED", label: "Подтверждён" }, { value: "FAILED", label: "Ошибка" }];

  return (
    <Layout>
      <div style={{ padding: "18px 22px", maxWidth: 1440, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.ink, margin: 0 }}>Bazaar</h1>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 3 }}>Единый маркет: OTC/P2P и NFT. Контроль торговли, эскроу-расчётов, выводов и апелляций. Логика построена на смарт-контрактах (zkSync Era).</div>
        </div>

        {/* Tab bar (underline, green) */}
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", borderBottom: `1px solid ${T.border}`, margin: "10px 0 16px" }} role="tablist">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} data-testid={`deals-tab-${t}`} role="tab"
              style={{ padding: "10px 15px", cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "none", background: "transparent", color: tab === t ? GREEN : T.sub, borderBottom: `2px solid ${tab === t ? GREEN : "transparent"}`, marginBottom: -1, whiteSpace: "nowrap" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        {tab !== "Смарт-контракт" && tab !== "Обзор" && tab !== "NFT" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Поиск по названию, кошельку, ID…" data-testid="deals-search"
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px 8px 32px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, outline: "none", color: T.ink }} />
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.faint, fontSize: 13 }}>🔍</span>
            </div>
            <Dropdown value={status} onChange={setStatus} options={statusOptions} testId="deals-status-filter" />
            {(tab === "OTC" || tab === "P2P") && (
              <Dropdown value={sort} onChange={setSort} testId="deals-sort" options={[{ value: "newest", label: "Сортировка: новые" }, { value: "oldest", label: "Сортировка: старые" }, { value: "price-desc", label: "Цена ↓" }, { value: "price-asc", label: "Цена ↑" }]} minWidth={190} />
            )}
            <button onClick={refetch} style={ghostBtn} data-testid="deals-refresh">↻ Обновить</button>
          </div>
        )}

        {/* Content */}
        {tab === "Обзор" ? <OverviewTab goToUser={goToUser} onOpenDeals={() => setTab("OTC")} />
          : tab === "NFT" ? <NftTab goToUser={goToUser} />
          : tab === "Смарт-контракт" ? <ContractPanel />
          : loading ? <StateBlock kind="loading" />
          : error ? <StateBlock kind="error" message={error} onRetry={refetch} />
          : rows.length === 0 ? <StateBlock kind="empty" message="Записей не найдено" />
          : (
            <>
              {tab === "P2P" && <P2PDashboard goToUser={goToUser} />}
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  {(tab === "OTC" || tab === "P2P") && <DealTable rows={rows} onOpen={setSelectedDeal} onUser={goToUser} />}
                  {tab === "Выводы" && <WithdrawTable rows={rows} onUser={goToUser} onApprove={async (id) => { setBusy(true); const r = await approveWithdraw(id); setBusy(false); r.isSuccess ? (notify("Вывод подтверждён"), refetch()) : notify(r.message || "Ошибка", false); }} onReject={async (id) => { setBusy(true); const r = await rejectWithdraw(id); setBusy(false); r.isSuccess ? (notify("Вывод отклонён"), refetch()) : notify(r.message || "Ошибка", false); }} busy={busy} />}
                  {tab === "Депозиты" && <DepositTable rows={rows} onUser={goToUser} />}
                  {tab === "Апелляции" && <AppealTable rows={rows} onUser={goToUser} onResolve={setResolveTarget} onChat={async (a) => { setBusy(true); const r = await startAppealProcess(a._id); setBusy(false); if (r.success) { notify("Чат поддержки открыт"); const uid = a?.creator?._id || a?.deal?.creator?._id; if (uid) setChatUserId(uid); } else notify("Не удалось открыть чат", false); }} />}
                </div>
              </Card>
            </>
          )}
      </div>

      {/* Deal detail modal */}
      {selectedDeal && (
        <DealModal deal={selectedDeal} busy={busy} onClose={() => setSelectedDeal(null)}
          onComplete={() => runAction("complete/forcedly", selectedDeal._id, "POST", "Сделка завершена в пользу продавца (adminResolveUSD)")}
          onBlock={() => runAction("block", selectedDeal._id, "PUT", "Сделка заблокирована")}
          onUnblock={() => runAction("block/confirm", selectedDeal._id, "PUT", "Блокировка подтверждена")}
          onClose2={() => runAction("close", selectedDeal._id, "PUT", "Сделка закрыта")}
          onReturn={() => runAction("return", selectedDeal._id, "PUT", "Средства возвращены покупателю")}
          onChat={(uid) => setChatUserId(uid)} />
      )}

      {/* Appeal resolve modal */}
      {resolveTarget && (
        <ResolveModal appeal={resolveTarget} onClose={() => setResolveTarget(null)}
          onSubmit={async (payload) => { setBusy(true); const r = await resolveAppeal(resolveTarget._id, payload); setBusy(false); if (r.success) { notify("Апелляция разрешена (adminResolveUSD)"); setResolveTarget(null); refetch(); } else notify("Не удалось разрешить апелляцию", false); }} busy={busy} />
      )}

      {/* Chat modal */}
      {chatUserId && adminUserData && (
        <ChatModal isVisible={!!chatUserId} setIsVisible={(v: boolean) => !v && setChatUserId(null)} userData={adminUserData} token={token} initialUserId={chatUserId} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.ok ? T.good : T.bad, color: "#fff", padding: "12px 18px", borderRadius: 12, fontWeight: 700, fontSize: 13, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 9999 }} data-testid="deals-toast">{toast.msg}</div>
      )}
    </Layout>
  );
};

/* ─────────────────────────── tables ─────────────────────────── */
const DealTable: React.FC<{ rows: any[]; onOpen: (d: any) => void; onUser: (id: string) => void }> = ({ rows, onOpen, onUser }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
    <thead><tr>{["ID", "Название", "Тип", "Статус", "Услуга", "Сумма / цена", "Создатель", "Контрагент", "Эскроу", "Дата", ""].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
    <tbody>
      {rows.map((d, i) => {
        const st = DEAL_STATUS[d.status] || { label: d.status, tone: "default" as const };
        return (
          <tr key={d._id || i} data-testid={`deal-row-${i}`} style={{ cursor: "pointer" }} onClick={() => onOpen(d)}>
            <td style={td}><span style={{ fontFamily: "monospace" }}>#{d.dealId || shortId(String(d._id))}</span></td>
            <td style={{ ...td, maxWidth: 180 }}>{d.name || "—"}</td>
            <td style={td}><Badge tone={d.type === "sell" ? "warn" : "info"}>{d.type === "sell" ? "Продажа" : "Покупка"}</Badge></td>
            <td style={td}><Badge tone={st.tone}>{st.label}</Badge></td>
            <td style={td}>{SERVICE_RU[d.serviceType] || d.serviceType || "—"}</td>
            <td style={td}>{money(d.price ?? d.amount, d.currency || d.ticker)}</td>
            <td style={td}><UserCell u={d.creator} onOpen={onUser} /></td>
            <td style={td}><UserCell u={d.buyer || d.seller} onOpen={onUser} /></td>
            <td style={td}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {d.isReservedFunds ? <Badge tone="info">эскроу</Badge> : null}
                {d.isMakePayment ? <Badge tone="warn">оплата</Badge> : null}
                {d.isRefund || d.isReturnFunds ? <Badge tone="bad">возврат</Badge> : null}
                {d.isAppeal ? <Badge tone="bad">апелляция</Badge> : null}
                {!d.isReservedFunds && !d.isMakePayment && !d.isRefund && !d.isAppeal ? <span style={{ color: T.faint }}>—</span> : null}
              </div>
            </td>
            <td style={td}>{fmtDate(d.createDate || d.date)}</td>
            <td style={td}><button style={{ ...ghostBtn, padding: "5px 11px" }} onClick={(e) => { e.stopPropagation(); onOpen(d); }}>Открыть</button></td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const WithdrawTable: React.FC<{ rows: any[]; onApprove: (id: string) => void; onReject: (id: string) => void; busy: boolean; onUser: (id: string) => void }> = ({ rows, onApprove, onReject, busy, onUser }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
    <thead><tr>{["Дата", "Пользователь", "Сумма", "Комиссия", "Статус", "Сеть", "On-chain", "Действия"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
    <tbody>
      {rows.map((w, i) => {
        const s = WSTATUS[w.moneyStatus || w.status] || { label: w.moneyStatus || w.status || "—", tone: "default" as const };
        const pending = ["PROCESSING", "PENDING", "0"].includes(String(w.moneyStatus || w.status));
        return (
          <tr key={w._id || i} data-testid={`withdraw-row-${i}`}>
            <td style={td}>{fmtDate(w.createdAt)}</td>
            <td style={td}><UserCell u={w.user || w.userData} onOpen={onUser} /></td>
            <td style={td}>{money(w.amount, w.currency || w.type)}</td>
            <td style={td}>{fmtNum(w.fee)}</td>
            <td style={td}><Badge tone={s.tone}>{s.label}</Badge></td>
            <td style={td}>{w.network || "—"}</td>
            <td style={td}>{explorerTx(w.transactionHash)}</td>
            <td style={td}>
              {pending ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button disabled={busy} style={{ ...primaryBtn(T.good), padding: "5px 11px" }} onClick={() => onApprove(w._id)}>Подтвердить</button>
                  <button disabled={busy} style={{ ...primaryBtn(T.bad), padding: "5px 11px" }} onClick={() => onReject(w._id)}>Отклонить</button>
                </div>
              ) : <span style={{ color: T.faint }}>—</span>}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const DepositTable: React.FC<{ rows: any[]; onUser: (id: string) => void }> = ({ rows, onUser }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
    <thead><tr>{["Дата", "Пользователь", "Сумма", "Статус", "Сеть", "Подтв.", "On-chain"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
    <tbody>
      {rows.map((d, i) => {
        const s = DSTATUS[d.status] || { label: d.status || "—", tone: "default" as const };
        return (
          <tr key={d._id || i} data-testid={`deposit-row-${i}`}>
            <td style={td}>{fmtDate(d.createdAt)}</td>
            <td style={td}><UserCell u={d.user || d.userData} onOpen={onUser} /></td>
            <td style={td}>{money(d.amount, d.currency)}</td>
            <td style={td}><Badge tone={s.tone}>{s.label}</Badge></td>
            <td style={td}>{d.network || "—"}</td>
            <td style={td}>{fmtNum(d.confirmations)}</td>
            <td style={td}>{explorerTx(d.transactionHash)}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const AppealTable: React.FC<{ rows: any[]; onResolve: (a: any) => void; onChat: (a: any) => void; onUser: (id: string) => void }> = ({ rows, onResolve, onChat, onUser }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
    <thead><tr>{["Дата", "Appeal ID", "Сделка", "Инициатор", "Роль", "Причина", "Статус", "Действия"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
    <tbody>
      {rows.map((a, i) => {
        const s = APPEAL_STATUS[a.status] || { label: a.status, tone: "default" as const };
        const role = a.role === "buyer" ? "Покупатель" : a.role === "seller" ? "Продавец" : "Создатель";
        return (
          <tr key={a._id || i} data-testid={`appeal-row-${i}`}>
            <td style={td}>{fmtDate(a.createdAt)}</td>
            <td style={td}><span style={{ fontFamily: "monospace" }}>{a.appealId || shortId(String(a._id))}</span></td>
            <td style={td}>{a.deal ? <span>#{a.deal.dealId || shortId(String(a.deal._id || a.dealId))} · {String(a.deal.section || "otc").toUpperCase()}</span> : <span style={{ fontFamily: "monospace" }}>{shortId(String(a.dealId))}</span>}</td>
            <td style={td}><UserCell u={a.creator} onOpen={onUser} /></td>
            <td style={td}>{role}</td>
            <td style={{ ...td, maxWidth: 220 }}>{a.reason || a.description || "—"}</td>
            <td style={td}><Badge tone={s.tone}>{s.label}</Badge></td>
            <td style={td}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {a.status !== "resolved" ? <button style={{ ...primaryBtn(), padding: "5px 11px" }} onClick={() => onResolve(a)} data-testid={`appeal-resolve-${i}`}>Разрешить</button> : <Badge tone="good">Решена</Badge>}
                <button style={{ ...ghostBtn, padding: "5px 11px" }} onClick={() => onChat(a)}>💬 Чат</button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

/* ─────────────────────────── deal detail modal ─────────────────────────── */
const Overlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 9998, display: "flex", justifyContent: "flex-end" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)", height: "100%", background: "#fff", overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,0.15)" }}>{children}</div>
  </div>
);
const KV: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${T.soft}` }}>
    <span style={{ fontSize: 13, color: T.sub, flexShrink: 0 }}>{k}</span>
    <span style={{ fontSize: 13, color: T.ink, fontWeight: 600, textAlign: "right", overflowWrap: "anywhere", wordBreak: "break-word", minWidth: 0 }}>{children}</span>
  </div>
);

const DealModal: React.FC<{ deal: any; busy: boolean; onClose: () => void; onComplete: () => void; onBlock: () => void; onUnblock: () => void; onClose2: () => void; onReturn: () => void; onChat: (uid: string) => void; }> = ({ deal, busy, onClose, onComplete, onBlock, onUnblock, onClose2, onReturn, onChat }) => {
  const st = DEAL_STATUS[deal.status] || { label: deal.status, tone: "default" as const };
  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.ink }}>Сделка #{deal.dealId || shortId(String(deal._id))}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 6 }}><Badge tone={st.tone}>{st.label}</Badge><Badge tone="info">{String(deal.section || "otc").toUpperCase()}</Badge><Badge tone={deal.type === "sell" ? "warn" : "info"}>{deal.type === "sell" ? "Продажа" : "Покупка"}</Badge></div>
          </div>
          <button style={{ ...ghostBtn, padding: "6px 12px" }} onClick={onClose}>✕</button>
        </div>

        <KV k="Название">{deal.name || "—"}</KV>
        <KV k="Услуга">{SERVICE_RU[deal.serviceType] || deal.serviceType || "—"}</KV>
        <KV k="Сумма / цена">{money(deal.price ?? deal.amount, deal.currency || deal.ticker)}</KV>
        <KV k="Создатель">{deal.creator?.username || "—"} {deal.creator?.wallet ? `(${sliceAddress(deal.creator.wallet)})` : ""}</KV>
        <KV k="Контрагент">{(deal.buyer || deal.seller)?.username || "—"}</KV>
        <KV k="On-chain lot">{deal.smartContract ? `#${deal.smartContract}` : "—"}</KV>
        <KV k="Транзакция">{explorerTx(deal.transaction)}</KV>
        <KV k="Эскроу (reserved)">{deal.isReservedFunds ? "Да" : "Нет"}</KV>
        <KV k="Оплата отмечена">{deal.isMakePayment ? "Да" : "Нет"}</KV>
        <KV k="Возврат средств">{deal.isRefund || deal.isReturnFunds ? "Да" : "Нет"}</KV>
        <KV k="Апелляция">{deal.isAppeal ? "Да" : "Нет"}</KV>
        <KV k="Создана">{fmtDate(deal.createDate || deal.date)}</KV>
        {deal.description ? <div style={{ marginTop: 10, fontSize: 13, color: T.sub }}>{deal.description}</div> : null}

        <div style={{ marginTop: 20, padding: 14, background: T.soft, borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 10 }}>Действия администратора (эскроу-контракт)</div>
          <div style={{ display: "grid", gap: 8 }}>
            <button disabled={busy} style={primaryBtn(T.good)} onClick={onComplete} data-testid="deal-action-complete">✔ Разрешить в пользу продавца · adminResolveUSD(refund=false)</button>
            <button disabled={busy} style={primaryBtn(T.warn)} onClick={onReturn} data-testid="deal-action-return">↩ Вернуть средства покупателю · adminResolveUSD(refund=true)</button>
            <div style={{ display: "flex", gap: 8 }}>
              {deal.status === "blocked"
                ? <button disabled={busy} style={{ ...primaryBtn(GREEN), flex: 1 }} onClick={onUnblock} data-testid="deal-action-unblock">Снять блокировку</button>
                : <button disabled={busy} style={{ ...primaryBtn(T.bad), flex: 1 }} onClick={onBlock} data-testid="deal-action-block">Заблокировать</button>}
              <button disabled={busy} style={{ ...ghostBtn, flex: 1 }} onClick={onClose2} data-testid="deal-action-close">Закрыть сделку</button>
            </div>
            {(deal.creator?._id || deal.buyer?._id) && (
              <button style={ghostBtn} onClick={() => onChat((deal.creator?._id) || (deal.buyer?._id))}>💬 Открыть чат с участником</button>
            )}
          </div>
        </div>
      </div>
    </Overlay>
  );
};

/* ─────────────────────────── appeal resolve modal ─────────────────────────── */
const ResolveModal: React.FC<{ appeal: any; busy: boolean; onClose: () => void; onSubmit: (p: any) => void }> = ({ appeal, busy, onClose, onSubmit }) => {
  const [recipient, setRecipient] = useState<"escrow_funder" | "buyer">("escrow_funder");
  const [feeMode, setFeeMode] = useState<"with_fee" | "without_fee">("without_fee");
  const [forceClose, setForceClose] = useState(true);
  const [txHash, setTxHash] = useState("");
  const [resolution, setResolution] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px,100%)", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Разрешение апелляции {appeal.appealId || ""}</div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>Итоговый расчёт эскроу выполняется вызовом <code>adminResolveUSD(id, refundToBuyer, takeFee)</code> у контракта-кастодиана.</div>

        <label style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Получатель средств</label>
        <div style={{ margin: "6px 0 14px" }}>
          <Dropdown value={recipient} onChange={(v) => setRecipient(v as any)} minWidth={260}
            options={[{ value: "escrow_funder", label: "Продавцу / инициатору эскроу (refund=false)" }, { value: "buyer", label: "Покупателю — возврат (refund=true)" }]} testId="resolve-recipient" />
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Комиссия рынка (5%)</label>
        <div style={{ margin: "6px 0 14px" }}>
          <Dropdown value={feeMode} onChange={(v) => setFeeMode(v as any)} minWidth={260}
            options={[{ value: "without_fee", label: "Без комиссии (takeFee=false)" }, { value: "with_fee", label: "С комиссией 5% (takeFee=true)" }]} testId="resolve-fee" />
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Хэш транзакции расчёта (необязательно)</label>
        <input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x…" data-testid="resolve-txhash"
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, margin: "6px 0 14px", outline: "none", fontFamily: "monospace" }} />

        <label style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Резолюция (комментарий)</label>
        <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} placeholder="Обоснование решения…" data-testid="resolve-note"
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, margin: "6px 0 12px", outline: "none", resize: "vertical" }} />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.ink, marginBottom: 18, cursor: "pointer" }}>
          <input type="checkbox" checked={forceClose} onChange={(e) => setForceClose(e.target.checked)} /> Принудительно закрыть сделку после расчёта
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={ghostBtn} onClick={onClose}>Отмена</button>
          <button disabled={busy} style={primaryBtn(T.good)} data-testid="resolve-submit"
            onClick={() => onSubmit({ resolution, recipient, feeMode, txHash: txHash.trim() || undefined, forceCloseDeal: forceClose })}>
            {busy ? "Выполняется…" : "Разрешить апелляцию"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── overview / statistics dashboard ─────────────────────────── */
const StatCard: React.FC<{ label: string; value: React.ReactNode; sub?: string; accent?: string }> = ({ label, value, sub, accent }) => (
  <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px" }}>
    <div style={{ fontSize: 11.5, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: accent || T.ink, marginTop: 6, lineHeight: 1.1 }}>{value}</div>
    {sub ? <div style={{ fontSize: 12, color: T.faint, marginTop: 4 }}>{sub}</div> : null}
  </div>
);
const RANK_TONE: Record<string, string> = {
  "Universal Enlightenment": "#7C3AED", "Galactic Navigator": "#2563EB", "Astral Sage": "#0EA5E9",
  "Cosmic Explorer": GREEN, "Celestial Master": "#F59E0B", "Stellar Awakening": "#94A3B8",
};

const OverviewTab: React.FC<{ goToUser: (id: string) => void; onOpenDeals: () => void }> = ({ goToUser, onOpenDeals }) => {
  const [s, setS] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const r = await fetchMarketStats();
      if (!alive) return;
      if (r.success) setS(r.data as MarketStats); else setError("Не удалось загрузить статистику");
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);
  if (loading) return <StateBlock kind="loading" />;
  if (error || !s) return <StateBlock kind="error" message={error || "Нет данных"} />;

  const maxPos = Math.max(1, ...s.popularPositions.map((p) => p.count));
  const totalDeals = s.deals.total || 1;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* KPI grid */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <StatCard label="Объём торгов" value={`$${fmtNum(s.volumeUsd)}`} sub="сумма завершённых сделок" accent={T.ink} />
        <StatCard label="Заработано на комиссии" value={`$${fmtNum(s.commissionEarnedUsd)}`} sub={`ставка ${s.feeRatePercent}% (on-chain fee)`} accent={GREEN} />
        <StatCard label="Зарезервировано в эскроу" value={`$${fmtNum(s.reservedOnContractUsd)}`} sub={`${fmtNum(s.reservedDeals)} сделок на контракте`} accent="#F59E0B" />
        <StatCard label="Трейдеров на OTC/P2P" value={fmtNum(s.traders)} sub={`активных: ${fmtNum(s.activeTraders)}`} />
        <StatCard label="Активные сделки" value={fmtNum(s.deals.active)} sub={`ожидают: ${fmtNum(s.deals.waiting)} · в процессе: ${fmtNum(s.deals.started)}`} accent="#0EA5E9" />
        <StatCard label="Завершённые сделки" value={fmtNum(s.deals.ended)} sub={`заблокировано: ${fmtNum(s.deals.blocked)}`} accent={T.good} />
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        {/* Top traders */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SectionTitle sub="Клик по трейдеру открывает его досье Customer 360">Топ-трейдеры</SectionTitle>
            <button style={{ ...ghostBtn, padding: "6px 12px" }} onClick={onOpenDeals}>Все сделки →</button>
          </div>
          {s.topTraders.length === 0 ? <StateBlock kind="empty" message="Нет данных о трейдерах" height={80} /> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
                <thead><tr>{["Трейдер", "Ранг / рейтинг", "Сделок", "Объём"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {s.topTraders.map((t: MarketTrader, i) => (
                    <tr key={t._id || i} data-testid={`top-trader-${i}`} style={{ cursor: "pointer" }} onClick={() => goToUser(t._id)}>
                      <td style={td}><UserCell u={t as any} onOpen={goToUser} /></td>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 8, background: RANK_TONE[t.rank || ""] || T.faint, display: "inline-block" }} />
                          <span style={{ fontSize: 12.5 }}>{t.rank || "—"}</span>
                          <Badge tone="info">{t.rating ?? "—"}</Badge>
                        </div>
                      </td>
                      <td style={td}>{fmtNum(t.dealsCount)} <span style={{ color: T.faint }}>({fmtNum(t.endedCount)}✓)</span></td>
                      <td style={td}>${fmtNum(t.volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Popular positions */}
        <Card>
          <SectionTitle sub="Наиболее востребованные типы позиций">Популярные позиции</SectionTitle>
          {s.popularPositions.length === 0 ? <StateBlock kind="empty" message="Нет данных" height={80} /> : (
            <div style={{ display: "grid", gap: 12, marginTop: 4 }}>
              {s.popularPositions.map((p, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: T.ink, fontWeight: 600 }}>{SERVICE_RU[p.serviceType] || p.serviceType}</span>
                    <span style={{ color: T.sub }}>{fmtNum(p.count)} · ${fmtNum(p.volume)}</span>
                  </div>
                  <div style={{ height: 8, background: T.soft, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(p.count / maxPos) * 100}%`, background: GREEN, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        {/* Rank distribution */}
        <Card>
          <SectionTitle sub="Прогрессия рейтинга трейдеров рынка — динамика развития">Распределение по рангам</SectionTitle>
          {s.rankDistribution.length === 0 ? <StateBlock kind="empty" message="Нет данных" height={80} /> : (
            <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
              {s.rankDistribution.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 10, background: RANK_TONE[r.rank] || T.faint }} />
                  <span style={{ flex: 1, fontSize: 13, color: T.ink, fontWeight: 600 }}>{r.rank}</span>
                  <span style={{ fontSize: 13, color: T.sub }}>{fmtNum(r.count)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Volume by section */}
        <Card>
          <SectionTitle sub="Разбивка завершённого объёма">Объём по секциям</SectionTitle>
          {s.volumeBySection.length === 0 ? <StateBlock kind="empty" message="Нет данных" height={80} /> : (
            <KpiGrid min={140}>
              {s.volumeBySection.map((v, i) => (
                <KpiCard key={i} label={v.section.toUpperCase()} value={`$${fmtNum(v.volume)}`} hint={`${fmtNum(v.count)} сделок`} tone={v.section === "otc" ? "good" : "default"} />
              ))}
              <KpiCard label="Доля завершённых" value={`${Math.round((s.deals.ended / totalDeals) * 100)}%`} />
            </KpiGrid>
          )}
        </Card>
      </div>
    </div>
  );
};

/* ─────────────────────────── P2P fiat market dashboard ─────────────────────────── */
const AdRow: React.FC<{ a: P2PAd; side: "sell" | "buy"; goToUser: (id: string) => void }> = ({ a, side, goToUser }) => (
  <tr data-testid={`p2p-${side}-ad`} style={{ cursor: a.creator ? "pointer" : "default" }} onClick={() => a.creator && goToUser(a.creator)}>
    <td style={{ ...td, fontWeight: 800, color: side === "sell" ? T.bad : T.good }}>{a.rate?.toFixed ? a.rate.toFixed(4) : a.rate}</td>
    <td style={td}>{fmtNum(a.amount)} {(a.currency || "USDC").toUpperCase()}</td>
    <td style={td}>${fmtNum(a.price)}</td>
    <td style={td}><UserCell u={a as any} onOpen={goToUser} /></td>
  </tr>
);

const P2PDashboard: React.FC<{ goToUser: (id: string) => void }> = ({ goToUser }) => {
  const [s, setS] = useState<P2PStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let alive = true; (async () => { setLoading(true); const r = await fetchP2PStats(); if (!alive) return; if (r.success) setS(r.data as P2PStats); setLoading(false); })(); return () => { alive = false; }; }, []);
  if (loading) return <Card style={{ marginBottom: 16 }}><StateBlock kind="loading" /></Card>;
  if (!s) return null;
  const spreadTone = s.spreadPercent >= 0 ? T.good : T.bad;

  return (
    <div style={{ display: "grid", gap: 16, marginBottom: 16 }} data-testid="p2p-dashboard">
      <div style={{ fontSize: 12.5, color: T.sub }}>Фиатный P2P-рынок (USDC ↔ фиат). Контроль объявлений, курсов, спреда и средств на смарт-контракте.</div>
      {/* KPI */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <StatCard label="Объявлений" value={fmtNum(s.ads.total)} sub={`продажа ${s.ads.sell} · покупка ${s.ads.buy}`} accent={T.ink} />
        <StatCard label="Ср. курс продажи" value={s.avgSellRate?.toFixed ? s.avgSellRate.toFixed(4) : s.avgSellRate} sub="ask" accent={T.bad} />
        <StatCard label="Ср. курс покупки" value={s.avgBuyRate?.toFixed ? s.avgBuyRate.toFixed(4) : s.avgBuyRate} sub="bid" accent={T.good} />
        <StatCard label="Спред" value={`${s.spreadPercent}%`} sub={`${s.spread} абс.`} accent={spreadTone} />
        <StatCard label="Активные обмены" value={fmtNum(s.exchanges.active)} sub={`в процессе ${s.exchanges.inProgress} · завершено ${s.exchanges.completed}`} accent="#0EA5E9" />
        <StatCard label="Заблокировано на контракте" value={`$${fmtNum(s.lockedOnContractUsd)}`} sub={`${fmtNum(s.lockedDeals)} сделок в эскроу`} accent="#F59E0B" />
        <StatCard label="Расчёт (разблокировано)" value={`$${fmtNum(s.releasedUsd)}`} sub="выплачено продавцам" accent={T.good} />
        <StatCard label="Трейдеров" value={fmtNum(s.traders)} sub={`оборот $${fmtNum(s.volumeUsd)}`} />
      </div>

      {/* Order book */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card>
          <SectionTitle sub="Лучшие цены продажи (ask) — клик открывает Customer 360">Объявления на продажу</SectionTitle>
          {s.topSellAds.length === 0 ? <StateBlock kind="empty" message="Нет объявлений на продажу" height={70} /> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
                <thead><tr>{["Курс", "Объём", "Сумма", "Продавец"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
                <tbody>{s.topSellAds.map((a, i) => <AdRow key={a._id || i} a={a} side="sell" goToUser={goToUser} />)}</tbody>
              </table>
            </div>
          )}
        </Card>
        <Card>
          <SectionTitle sub="Лучшие цены покупки (bid) — клик открывает Customer 360">Объявления на покупку</SectionTitle>
          {s.topBuyAds.length === 0 ? <StateBlock kind="empty" message="Нет объявлений на покупку" height={70} /> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
                <thead><tr>{["Курс", "Объём", "Сумма", "Покупатель"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
                <tbody>{s.topBuyAds.map((a, i) => <AdRow key={a._id || i} a={a} side="buy" goToUser={goToUser} />)}</tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <div style={{ fontSize: 12.5, color: T.sub, fontWeight: 700, marginTop: 4 }}>Все объявления и сделки P2P (управление):</div>
    </div>
  );
};

/* ─────────────────────────── NFT marketplace tab ─────────────────────────── */
const NftTab: React.FC<{ goToUser: (id: string) => void }> = ({ goToUser }) => {
  const [s, setS] = useState<NftStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const r = await fetchNftStats();
      if (!alive) return;
      if (r.success) setS(r.data as NftStats); else setError("Не удалось загрузить NFT-статистику");
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);
  if (loading) return <StateBlock kind="loading" />;
  if (error || !s) return <StateBlock kind="error" message={error || "Нет данных"} />;
  const maxListed = Math.max(1, ...s.topCollections.map((c) => c.listed));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ fontSize: 12.5, color: T.sub }}>NFT Marketplace работает на отдельном смарт-контракте коллекций (ордера продажи NFT). Ниже — контроль рынка NFT.</div>
      {/* KPI */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <StatCard label="Коллекций в продаже" value={fmtNum(s.collectionsOnSale)} accent={T.ink} />
        <StatCard label="NFT выставлено" value={fmtNum(s.listedNfts)} sub={`продавцов: ${fmtNum(s.sellers)}`} accent={GREEN} />
        <StatCard label="Объём листингов" value={`$${fmtNum(s.listedVolumeUsd)}`} sub={`floor: ${fmtNum(s.floorPrice)}`} accent="#0EA5E9" />
        <StatCard label="Продаж (закрыто)" value={fmtNum(s.salesCount)} sub={`объём: $${fmtNum(s.salesVolumeUsd)}`} accent={T.good} />
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        {/* Top collections */}
        <Card>
          <SectionTitle sub="Коллекции с наибольшим числом активных листингов">Топ-коллекции</SectionTitle>
          {s.topCollections.length === 0 ? <StateBlock kind="empty" message="Нет коллекций в продаже" height={80} /> : (
            <div style={{ display: "grid", gap: 12, marginTop: 4 }}>
              {s.topCollections.map((c, i) => (
                <div key={c._id || i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: T.ink, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ color: T.sub }}>{fmtNum(c.listed)} шт · ${fmtNum(c.volume)}</span>
                  </div>
                  <div style={{ height: 8, background: T.soft, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(c.listed / maxListed) * 100}%`, background: GREEN, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top sellers */}
        <Card>
          <SectionTitle sub="Пользователи с активными ордерами на продажу — клик открывает Customer 360">Топ-продавцы NFT</SectionTitle>
          {s.topSellers.length === 0 ? <StateBlock kind="empty" message="Нет продавцов" height={80} /> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                <thead><tr>{["Продавец", "Ранг", "Ордеров", "Объём"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {s.topSellers.map((t, i) => (
                    <tr key={t._id || i} data-testid={`nft-seller-${i}`} style={{ cursor: "pointer" }} onClick={() => goToUser(t._id)}>
                      <td style={td}><UserCell u={t as any} onOpen={goToUser} /></td>
                      <td style={td}>{t.rank || "—"}</td>
                      <td style={td}>{fmtNum(t.orders)}</td>
                      <td style={td}>${fmtNum(t.volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Recent listings */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px 0" }}><SectionTitle sub="Актуальные ордера на продажу NFT">Листинги на продажу</SectionTitle></div>
        {s.recentListings.length === 0 ? <div style={{ padding: 16 }}><StateBlock kind="empty" message="Нет активных листингов" height={80} /></div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 840 }}>
              <thead><tr>{["NFT", "Коллекция", "Цена", "Ордер", "Продавец", "До"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {s.recentListings.map((n, i) => (
                  <tr key={n._id || i} data-testid={`nft-listing-${i}`}>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {n.image ? <img src={n.image} alt="" style={{ width: 30, height: 30, borderRadius: 7, objectFit: "cover" }} /> : null}
                        <span style={{ fontWeight: 600 }}>{n.name || `#${n.nftId}`}</span>
                      </div>
                    </td>
                    <td style={td}>{n.collectionName}</td>
                    <td style={td}>{money(n.price, n.currency)}</td>
                    <td style={td}><span style={{ fontFamily: "monospace" }}>{n.orderId ? `#${n.orderId}` : "—"}</span></td>
                    <td style={td}><UserCell u={n.owner as any} onOpen={goToUser} /></td>
                    <td style={td}>{n.endDate ? fmtDate(n.endDate) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

/* ─────────────────────────── contract reference panel ─────────────────────────── */
const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "default"> = { CONNECTED: "good", DEGRADED: "warn", OFFLINE: "bad" };
const STATUS_RU: Record<string, string> = { CONNECTED: "Connected", DEGRADED: "Degraded", OFFLINE: "Offline" };
const RECON_TONE: Record<string, "good" | "warn" | "bad" | "default" | "info"> = { IN_SYNC: "good", CHAIN_AHEAD: "warn", BACKEND_AHEAD: "warn", MISMATCH: "bad", UNKNOWN: "default" };

const FnTable: React.FC<{ fns: readonly any[] }> = ({ fns }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
      <thead><tr>{["Функция", "Доступ", "Эффект", "Комиссия", "Использование"].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
      <tbody>
        {fns.map((f, i) => (
          <tr key={i}>
            <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{f.name}</td>
            <td style={td}><Badge tone={f.access === "onlyOwner" ? "bad" : f.access === "seller" ? "warn" : "info"}>{f.access}</Badge></td>
            <td style={{ ...td, fontSize: 12 }}>{f.effect}</td>
            <td style={td}>{f.fee === "NONE" || f.fee === "—" ? <span style={{ color: T.good }}>{f.fee === "—" ? "—" : "нет"}</span> : <span style={{ color: T.warn }}>{f.fee}</span>}</td>
            <td style={{ ...td, fontSize: 12, maxWidth: 240 }}>{f.use}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ContractBlock: React.FC<{ health: any; title: string; addr: string; extraAddr?: { label: string; value: string }; network: string; chainId: number; owner?: string | null; fee: string; explorer: string; fns: readonly any[] }> = ({ health, title, addr, extraAddr, network, chainId, owner, fee, explorer, fns }) => {
  const status = health?.status || "DEGRADED";
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <SectionTitle sub={health?.statusReason || "Контракт интеграции FOMO"}>{title}</SectionTitle>
        <Badge tone={STATUS_TONE[status] || "warn"}>{STATUS_RU[status] || status}{health?.liveReader === false ? " · no live reader" : ""}</Badge>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", marginTop: 12 }}>
        {[
          { l: "Сеть", v: network, tone: T.ink },
          { l: "Chain ID", v: String(chainId), tone: T.ink },
          { l: "Комиссия", v: fee, tone: T.warn },
          { l: "Readiness", v: health?.liveReader ? "Live" : "Derived", tone: health?.liveReader ? T.good : T.ink },
        ].map((m, i) => (
          <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 12px", minWidth: 0 }}>
            <div style={{ fontSize: 11, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{m.l}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.tone, marginTop: 6, lineHeight: 1.35, overflowWrap: "anywhere", wordBreak: "break-word" }}>{m.v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <KV k="Адрес"><a href={`${explorer}/address/${addr}`} target="_blank" rel="noreferrer" style={{ color: GREEN, fontFamily: "monospace", textDecoration: "none", overflowWrap: "anywhere", wordBreak: "break-all" }}>{sliceAddress(addr)} ↗</a></KV>
        {extraAddr ? <KV k={extraAddr.label}><span style={{ fontFamily: "monospace" }}>{sliceAddress(extraAddr.value)}</span></KV> : null}
        <KV k="Owner">{owner ? <span style={{ fontFamily: "monospace" }}>{sliceAddress(owner)}</span> : <span style={{ color: T.faint }}>не прочитан (нужен live reader)</span>}</KV>
      </div>
      {health?.reconciliation ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}>Reconciliation (backend ↔ chain, derived)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(health.reconciliation).map(([k, v]: any) => (
              <Badge key={k} tone={RECON_TONE[k] || "default"}>{k}: {fmtNum(v)}</Badge>
            ))}
          </div>
        </div>
      ) : null}
      {typeof health?.listings === "number" ? <div style={{ marginTop: 12, fontSize: 12.5, color: T.sub }}>Активных листингов: <b style={{ color: T.ink }}>{fmtNum(health.listings)}</b></div> : null}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}>Реальные методы контракта</div>
        <FnTable fns={fns} />
      </div>
    </Card>
  );
};

const ContractPanel: React.FC = () => {
  const [dataMode, setDataMode] = useState<"demo" | "production">("demo");
  const [h, setH] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let alive = true; (async () => { setLoading(true); const r = await fetchContractsHealth(dataMode); if (!alive) return; setH(r.success ? r.data : null); setLoading(false); })(); return () => { alive = false; }; }, [dataMode]);
  const custodyH = h?.contracts?.find((c: any) => c.key === "custody");
  const nftH = h?.contracts?.find((c: any) => c.key === "nft-marketplace");
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Data mode + demo separation banner */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <SectionTitle sub="Два независимых контракта FOMO. Production-метрики исключают demo-данные.">Contract Control</SectionTitle>
          </div>
          <Dropdown value={dataMode} onChange={(v) => setDataMode(v as any)} minWidth={220}
            options={[{ value: "demo", label: "Данные: demo (визуальная проверка)" }, { value: "production", label: "Данные: production (без demo)" }]} testId="contract-datamode" />
        </div>
        {h ? (
          <KpiGrid min={170}>
            <KpiCard label="Оборот (production)" value={`$${fmtNum(h.production?.endedVolumeUsd)}`} tone="good" />
            <KpiCard label="Комиссия (production)" value={`$${fmtNum(h.production?.feesUsd)}`} />
            <KpiCard label="Demo-записей (deals)" value={fmtNum(h.demo?.dealRecords)} tone="warn" />
            <KpiCard label="Режим" value={dataMode === "demo" ? "DEMO" : "PRODUCTION"} tone={dataMode === "demo" ? "warn" : "good"} />
          </KpiGrid>
        ) : null}
        {dataMode === "demo" ? <div style={{ marginTop: 10, fontSize: 12.5, color: T.warn, fontWeight: 600 }}>⚠ Показаны demo-данные (source: *-demo). В production-метриках (оборот/комиссии/эскроу/топы) они исключаются.</div> : null}
      </Card>

      {loading ? <StateBlock kind="loading" /> : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))" }}>
          <ContractBlock health={custodyH} title="FOMO Custody · OTC/P2P" addr={ZK_CONTRACT.address} network={ZK_CONTRACT.network} chainId={ZK_CONTRACT.chainId} owner={ZK_CONTRACT.owner} fee={`${ZK_CONTRACT.feePercent}%`} explorer={ZK_CONTRACT.explorer} fns={ZK_CONTRACT.functions} />
          <ContractBlock health={nftH} title="NFT Marketplace (Pool)" addr={NFT_CONTRACT.poolAddress} extraAddr={{ label: "NFT-контракт", value: NFT_CONTRACT.nftAddress }} network={NFT_CONTRACT.network} chainId={NFT_CONTRACT.chainId} owner={nftH?.owner} fee={NFT_CONTRACT.feeModel} explorer={NFT_CONTRACT.explorer} fns={NFT_CONTRACT.functions} />
        </div>
      )}
      <Card>
        <SectionTitle sub="Жизненный цикл в терминах контрактов">Как это работает</SectionTitle>
        <ol style={{ margin: 0, paddingLeft: 18, color: T.ink, fontSize: 13.5, lineHeight: 1.9 }}>
          <li><b>OTC/P2P:</b> <code>createItem</code> → <code>safeMoneyUSD</code> (эскроу) → <code>adminResolveUSD(refund,fee)</code> (расчёт/возврат); <code>deposit/withdrawUSD</code> — рельсы.</li>
          <li><b>NFT:</b> листинг в пуле → покупка (USDC/ETH); админ управляет коллекциями: <code>add_collection</code>, <code>change_fee</code>, <code>delete_collection</code>. Функций pause/blacklist/admin-cancel-order в контракте нет.</li>
          <li><b>Reconciliation</b> сейчас derived из сохранённых on-chain ссылок (txHash/lot/escrow-флаги). Следующий шаг — live RPC reader для точных статусов CHAIN_AHEAD/MISMATCH.</li>
        </ol>
      </Card>
    </div>
  );
};

export default DealsMarket;

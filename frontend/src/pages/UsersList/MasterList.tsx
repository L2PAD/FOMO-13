import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { T, Card, StateBlock, Badge, fmtNum, fmtDate, shortId } from "../Statistics/ui";
import { AdminSelect } from "../AdminRating/AdminControls";
import { fetchMasterList, suspendUser, unsuspendUser, muteUser, softDeleteUser, restoreUser } from "../../components/services/customer360";

const STATE_LABEL: Record<string, string> = { active: "Активен", muted: "Muted", suspended: "Заблокирован", deleted: "Удалён" };
const STATE_TONE: Record<string, "good" | "warn" | "bad" | "default"> = { active: "good", muted: "warn", suspended: "bad", deleted: "default" };

type ColKey = "user" | "status" | "fomo" | "xp" | "spaceport" | "badges" | "activity" | "trade" | "nft" | "referrals" | "created" | "lastLogin" | "actions";
interface ColDef { key: ColKey; label: string; width: number; always?: boolean; align?: "left" | "right" | "center"; sortable?: string; }

const COLUMNS: ColDef[] = [
  { key: "user", label: "Пользователь", width: 240, always: true, sortable: "name" },
  { key: "status", label: "Статус", width: 130 },
  { key: "fomo", label: "FOMO Score", width: 120, align: "right", sortable: "fomo" },
  { key: "xp", label: "XP / Ранг", width: 170, align: "left", sortable: "xp" },
  { key: "spaceport", label: "SpacePort", width: 130, align: "center" },
  { key: "badges", label: "Бейджи", width: 90, align: "right" },
  { key: "activity", label: "Активность", width: 120, align: "right" },
  { key: "trade", label: "OTC / P2P", width: 110, align: "right", sortable: "deals" },
  { key: "nft", label: "NFT", width: 110, align: "right" },
  { key: "referrals", label: "Рефералы", width: 100, align: "right" },
  { key: "created", label: "Регистрация", width: 130, align: "right", sortable: "createdAt" },
  { key: "lastLogin", label: "Последний вход", width: 140, align: "right", sortable: "lastLogin" },
  { key: "actions", label: "Действия", width: 150, always: true, align: "center" },
];

const selectStyle: React.CSSProperties = { padding: "8px 10px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, background: T.cardBg, color: T.ink, cursor: "pointer", outline: "none" };

const MasterList: React.FC = () => {
  const history = useHistory();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [verified, setVerified] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [colsOpen, setColsOpen] = useState(false);
  const [hidden, setHidden] = useState<Set<ColKey>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleCols = useMemo(() => COLUMNS.filter((c) => c.always || !hidden.has(c.key)), [hidden]);

  const load = async () => {
    setLoading(true); setError(null);
    const r = await fetchMasterList({ search: q, status, verified, sortBy, sortDir, page, limit });
    if (r.success && r.data?.rows) { setRows(r.data.rows); setTotal(r.data.total || 0); }
    else { setError("Не удалось загрузить пользователей"); setRows([]); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status, verified, sortBy, sortDir, page]);

  const toggleSort = (field?: string) => {
    if (!field) return;
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("desc"); }
    setPage(1);
  };
  const toggleCol = (k: ColKey) => setHidden((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const act = async (fn: () => Promise<any>) => { setMenuId(null); await fn(); await load(); };
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const stickyLeft: React.CSSProperties = { position: "sticky", left: 0, zIndex: 2, background: T.cardBg, boxShadow: "6px 0 8px -6px rgba(16,24,40,0.12)" };
  const stickyRight: React.CSSProperties = { position: "sticky", right: 0, zIndex: 2, background: T.cardBg, boxShadow: "-6px 0 8px -6px rgba(16,24,40,0.12)" };

  const cellFor = (c: ColDef, r: any): React.ReactNode => {
    switch (c.key) {
      case "user":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {r.photo ? <img src={r.photo} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.soft, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: T.faint, flexShrink: 0 }}>{(r.name || "?").slice(0, 1).toUpperCase()}</div>}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170 }}>{r.name || r.username || "—"}</div>
              <div style={{ fontSize: 11.5, color: T.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170 }}>{r.email || shortId(r.wallet)}</div>
            </div>
          </div>
        );
      case "status": return <Badge tone={STATE_TONE[r.status] || "default"}>{STATE_LABEL[r.status] || r.status}</Badge>;
      case "fomo": return <span style={{ fontWeight: 700 }}>{fmtNum(r.fomoScore)}</span>;
      case "xp": return <div><div style={{ fontWeight: 700 }}>{fmtNum(r.activityXP)}</div><div style={{ fontSize: 11.5, color: T.sub }}>{r.rank || "—"}</div></div>;
      case "spaceport": return <Badge tone="info">{r.spaceportRewards ? `${r.spaceportRewards} наград` : `${r.spaceportBadges} бейдж.`}</Badge>;
      case "badges": return fmtNum(r.badges);
      case "activity": return <span title="Сессий">{fmtNum(r.sessions)}</span>;
      case "trade": return fmtNum(r.deals);
      case "nft": return r.nftCount ? `${fmtNum(r.nftCount)} (${fmtNum(r.nftValue)}$)` : "0";
      case "referrals": return fmtNum(r.referrals);
      case "created": return fmtDate(r.createdAt);
      case "lastLogin": return fmtDate(r.lastLogin);
      case "actions":
        return (
          <div style={{ position: "relative", display: "flex", gap: 6, justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => history.push(`/users_list/user/${r.id}`)} data-testid={`ml-open-${r.id}`}
              style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Профиль</button>
            <button onClick={() => setMenuId(menuId === r.id ? null : r.id)} disabled={busyId === r.id}
              style={{ padding: "6px 9px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.cardBg, color: T.sub, fontWeight: 800, fontSize: 14, cursor: "pointer", lineHeight: 1 }}>⋯</button>
            {menuId === r.id ? (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(16,24,40,0.14)", zIndex: 20, minWidth: 170, overflow: "hidden" }}>
                {r.status === "suspended"
                  ? <MenuItem onClick={() => act(() => unsuspendUser(r.id))} color={T.good}>Снять блокировку</MenuItem>
                  : <MenuItem onClick={() => act(() => suspendUser(r.id, "", 0))} color={T.bad}>Заблокировать</MenuItem>}
                {r.status !== "muted"
                  ? <MenuItem onClick={() => act(() => muteUser(r.id, "", 7))} color={T.warn}>Mute 7д</MenuItem> : null}
                {r.status === "deleted"
                  ? <MenuItem onClick={() => act(() => restoreUser(r.id))} color={T.good}>Восстановить</MenuItem>
                  : <MenuItem onClick={() => { if (window.confirm("Soft-delete пользователя? Данные (XP/сделки/бейджи) сохранятся.")) act(() => softDeleteUser(r.id, "")); }} color="#7f1d1d">Удалить (soft)</MenuItem>}
              </div>
            ) : null}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ padding: "4px 20px 40px" }} data-testid="users-master-list">
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginRight: 6 }}>Пользователи</div>
        <input data-testid="ml-search" value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setQ(search.trim()); setPage(1); } }}
          placeholder="Поиск: имя, username, email, кошелёк…"
          style={{ flex: 1, minWidth: 240, maxWidth: 420, padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, outline: "none" }} />
        <button onClick={() => { setQ(search.trim()); setPage(1); }} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }} data-testid="ml-search-btn">Найти</button>
        <div style={{ width: 170 }}>
          <AdminSelect
            testid="ml-status"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { value: "all", label: "Все статусы" },
              { value: "active", label: "Активные" },
              { value: "muted", label: "Muted" },
              { value: "suspended", label: "Заблокированные" },
              { value: "deleted", label: "Удалённые" },
            ]}
          />
        </div>
        <div style={{ width: 190 }}>
          <AdminSelect
            testid="ml-verified"
            value={verified}
            onChange={(v) => { setVerified(v); setPage(1); }}
            placeholder="Верификация: все"
            options={[
              { value: "", label: "Верификация: все" },
              { value: "1", label: "Верифицированные" },
              { value: "0", label: "Не верифиц." },
            ]}
          />
        </div>
        <div style={{ position: "relative" }}>
          <button data-testid="ml-columns" onClick={() => setColsOpen((o) => !o)} style={selectStyle}>Колонки ▾</button>
          {colsOpen ? (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(16,24,40,0.14)", zIndex: 30, padding: 8, minWidth: 200 }}>
              {COLUMNS.filter((c) => !c.always).map((c) => (
                <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 13, color: T.ink, cursor: "pointer", borderRadius: 6 }}>
                  <input type="checkbox" checked={!hidden.has(c.key)} onChange={() => toggleCol(c.key)} /> {c.label}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div ref={scrollRef} style={{ overflowX: "auto" }} onScroll={() => setMenuId(null)}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: visibleCols.reduce((s, c) => s + c.width, 0), fontSize: 13 }}>
            <thead>
              <tr>
                {visibleCols.map((c) => (
                  <th key={c.key} onClick={() => toggleSort(c.sortable)}
                    style={{ textAlign: c.align || "left", padding: "12px 14px", color: T.sub, fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.3, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", width: c.width, minWidth: c.width, cursor: c.sortable ? "pointer" : "default", background: T.soft, ...(c.key === "user" ? { ...stickyLeft, background: T.soft } : c.key === "actions" ? { ...stickyRight, background: T.soft } : {}) }}>
                    {c.label}{c.sortable && sortBy === c.sortable ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleCols.length} style={{ padding: 24 }}><StateBlock kind="loading" /></td></tr>
              ) : error ? (
                <tr><td colSpan={visibleCols.length} style={{ padding: 24 }}><StateBlock kind="error" message={error} onRetry={load} /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={visibleCols.length} style={{ padding: 24 }}><StateBlock kind="empty" message="Пользователи не найдены" /></td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} data-testid={`ml-row-${r.id}`} onClick={() => history.push(`/users_list/user/${r.id}`)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).querySelectorAll("td").forEach((td) => ((td as HTMLElement).style.background = "#F8FAFC")); }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).querySelectorAll("td").forEach((td) => ((td as HTMLElement).style.background = (td as HTMLElement).dataset.sticky ? T.cardBg : "transparent")); }}>
                  {visibleCols.map((c) => (
                    <td key={c.key} data-sticky={c.key === "user" || c.key === "actions" ? "1" : undefined}
                      style={{ textAlign: c.align || "left", padding: "10px 14px", color: T.ink, borderBottom: `1px solid ${T.soft}`, whiteSpace: "nowrap", width: c.width, minWidth: c.width, ...(c.key === "user" ? stickyLeft : c.key === "actions" ? stickyRight : {}) }}>
                      {cellFor(c, r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 12.5, color: T.sub }}>Всего: {fmtNum(total)} · страница {page} из {totalPages}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} data-testid="ml-prev"
            style={{ ...selectStyle, opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}>← Назад</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} data-testid="ml-next"
            style={{ ...selectStyle, opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer" }}>Вперёд →</button>
        </div>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{ onClick: () => void; color: string; children: React.ReactNode }> = ({ onClick, color, children }) => (
  <button onClick={onClick} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "transparent", color, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = T.soft)}
    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>{children}</button>
);

export default MasterList;

import React, { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from "recharts";
import { T, Card, fmtNum, fmtDate } from "../../../pages/Statistics/ui";
import {
  npOverview, npParsing, npDiagnostics, npStats, npSources, npSourceHealth,
  npRunSource, npPauseSource, npResumeSource, npTestSource, npRunTier, npRunAll,
  npGlobalPause, npGlobalResume, npRuns,
} from "../../services/news_parser/newsParser";
import { fetchAllNews } from "../../services/buzz/buzzStats";
import { naOverview, naDrafts, naRuns, naGenerate } from "../../services/news_ai/newsAi";

const GREEN = "#04A584";
const isAdmin = () => String(localStorage.getItem("fomoRole") || "").trim().toLowerCase() === "admin";

const TABS = [
  { key: "overview", label: "Обзор" },
  { key: "news", label: "Новости" },
  { key: "sources", label: "Источники" },
  { key: "parsing", label: "Парсинг" },
  { key: "runs", label: "Запуски" },
  { key: "ai", label: "AI-генерация" },
  { key: "moderation", label: "Модерация" },
  { key: "stats", label: "Статистика" },
  { key: "diagnostics", label: "Диагностика" },
];

const stateColor = (s: string): string => {
  switch (s) {
    case "Работает": return GREEN;
    case "Есть проблемы":
    case "Устарели данные": return T.warn;
    case "Ошибка": return T.bad;
    case "На паузе": return T.sub;
    default: return T.faint;
  }
};

const Pill: React.FC<{ text: string; color?: string }> = ({ text, color }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
    color: color || T.sub, background: `${color || T.sub}14`, border: `1px solid ${color || T.border}55`,
  }}>{text}</span>
);

const Btn: React.FC<{ onClick?: () => void; children: React.ReactNode; kind?: "primary" | "ghost" | "danger"; disabled?: boolean; testId?: string }> =
  ({ onClick, children, kind = "ghost", disabled, testId }) => {
    const styles: any = {
      primary: { background: GREEN, color: "#fff", border: `1px solid ${GREEN}` },
      ghost: { background: "transparent", color: T.ink, border: `1px solid ${T.border}` },
      danger: { background: "transparent", color: T.bad, border: `1px solid ${T.bad}55` },
    };
    return (
      <button data-testid={testId} disabled={disabled} onClick={onClick}
        style={{ ...styles[kind], padding: "7px 13px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
        {children}
      </button>
    );
  };

const KPI: React.FC<{ label: string; value: React.ReactNode; sub?: string; color?: string }> = ({ label, value, sub, color }) => (
  <Card style={{ padding: 16 }}>
    <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.ink, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>{sub}</div>}
  </Card>
);

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 12, color: T.sub, fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.soft}`, whiteSpace: "nowrap" };

// ─────────────────────────── OVERVIEW ───────────────────────────
const OverviewTab: React.FC = () => {
  const [ov, setOv] = useState<any>(null);
  const [pc, setPc] = useState<any>(null);
  const [diag, setDiag] = useState<any>(null);
  const load = useCallback(async () => {
    const [o, p, d] = await Promise.all([npOverview(), npParsing(), npDiagnostics()]);
    if (o.success) setOv(o.data);
    if (p.success) setPc(p.data);
    if (d.success) setDiag(d.data);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
  if (!ov) return <div style={{ color: T.sub, padding: 20 }}>Загрузка…</div>;

  const healthLabel = ov.health === "HEALTHY" ? "Работает" : ov.health === "DEGRADED" ? "Есть проблемы" : "Ошибка";
  const sys = [
    { k: "Планировщик", ok: pc?.schedulerEnabled && !pc?.globalPaused },
    { k: "Redis / Очередь", ok: pc?.redisOk },
    { k: "Воркеры", ok: pc?.workerEnabled },
    { k: "Реестр источников", ok: (ov.sources?.total || 0) > 0 },
    { k: "БД fomo_market", ok: (diag?.checks || []).find((c: any) => c.key === "registry")?.ok ?? true },
    { k: "Импортёр → News", ok: (diag?.checks || []).find((c: any) => c.key === "importer")?.ok ?? true },
    { k: "AI-провайдер", ok: null },
    { k: "Доставка на сайт", ok: (ov.articlesTotal || 0) > 0 },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Состояние системы</div>
          <Pill text={healthLabel} color={stateColor(healthLabel)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
          {sys.map((s) => (
            <div key={s.k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: s.ok === null ? T.faint : s.ok ? GREEN : T.bad }} />
              <span style={{ fontSize: 13, color: T.ink }}>{s.k}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: T.sub }}>{s.ok === null ? "Не настроено" : s.ok ? "OK" : "Ошибка"}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Требует внимания</div>
        {(!ov.needsAttention || ov.needsAttention.length === 0) ? (
          <div style={{ color: GREEN, fontSize: 13 }}>Всё в порядке — критичных проблем нет.</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {ov.needsAttention.map((a: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: T.ink }}>
                <Pill text={a.type === "stale" ? "Устарели данные" : "Сбои"} color={a.type === "stale" ? T.warn : T.bad} />
                <span>{a.source}</span>
                <span style={{ color: T.faint }}>
                  {a.type === "stale" ? `${a.staleMinutes} мин без обновления` : `${a.failures} ошибок подряд`}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
        <KPI label="Источников активно" value={`${ov.sources?.active ?? 0}/${ov.sources?.total ?? 0}`} sub={`ошибок: ${ov.sources?.errored ?? 0}`} color={GREEN} />
        <KPI label="Получено (24ч)" value={fmtNum(ov.last24h?.fetched)} sub={`запусков: ${ov.last24h?.runs ?? 0}`} />
        <KPI label="Новых (24ч)" value={fmtNum(ov.last24h?.new)} sub={`дубли: ${ov.last24h?.duplicates ?? 0}`} />
        <KPI label="Success rate (24ч)" value={ov.last24h?.successRate == null ? "—" : `${ov.last24h.successRate}%`} color={GREEN} />
        <KPI label="Всего статей" value={fmtNum(ov.articlesTotal)} />
        <KPI label="Последний парсинг" value={ov.lastSuccessfulParseAt ? fmtDate(ov.lastSuccessfulParseAt) : "—"} sub={ov.lastSuccessfulParseAt ? new Date(ov.lastSuccessfulParseAt).toLocaleTimeString("ru-RU") : ""} />
      </div>
    </div>
  );
};

// ─────────────────────────── SOURCES ───────────────────────────
const SourcesTab: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [tier, setTier] = useState(""); const [status, setStatus] = useState(""); const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const [drawer, setDrawer] = useState<any>(null);
  const admin = isAdmin();
  const load = useCallback(async () => {
    const r = await npSources({ tier, status, q });
    if (r.success) setRows(Array.isArray(r.data) ? r.data : []);
  }, [tier, status, q]);
  useEffect(() => { load(); }, [load]);
  const act = async (fn: () => Promise<any>, id: string) => { setBusy(id); await fn(); setBusy(""); load(); };
  const openHealth = async (id: string) => { const r = await npSourceHealth(id); if (r.success) setDrawer(r.data); };

  const sel: React.CSSProperties = { padding: "7px 10px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.ink, background: "#fff" };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input placeholder="Поиск источника…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="np-source-search" style={{ ...sel, minWidth: 220 }} />
        <select value={tier} onChange={(e) => setTier(e.target.value)} style={sel} data-testid="np-tier-filter">
          <option value="">Все Tier</option><option value="A">Tier A</option><option value="B">Tier B</option><option value="C">Tier C</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={sel} data-testid="np-status-filter">
          <option value="">Все статусы</option><option value="ACTIVE">ACTIVE</option><option value="ERROR">ERROR</option><option value="PAUSED">PAUSED</option><option value="DISABLED">DISABLED</option>
        </select>
        <span style={{ marginLeft: "auto", alignSelf: "center", color: T.sub, fontSize: 13 }}>{rows.length} источников</span>
      </div>
      <Card style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }} data-testid="np-sources-table">
          <thead><tr>
            {["Источник", "Tier", "Язык", "Интервал", "Посл. запуск", "Посл. статья", "Новых 24ч", "Уник.", "Ошибок", "Состояние", "Действия"].map((h) => <th key={h} style={th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td style={{ ...td, cursor: "pointer", fontWeight: 700 }} onClick={() => openHealth(s.id)}>{s.name}</td>
                <td style={td}>{s.tier}</td>
                <td style={td}>{s.language}</td>
                <td style={td}>{s.pollingIntervalMinutes}м</td>
                <td style={td}>{s.lastRunAt ? new Date(s.lastRunAt).toLocaleTimeString("ru-RU") : "—"}</td>
                <td style={td}>{s.lastArticleAt ? fmtDate(s.lastArticleAt) : "—"}</td>
                <td style={td}>{s.lastNew ?? 0}</td>
                <td style={td}>{s.uniquenessPct == null ? "—" : `${s.uniquenessPct}%`}</td>
                <td style={{ ...td, color: (s.consecutiveFailures || 0) > 0 ? T.bad : T.sub }}>{s.consecutiveFailures || 0}</td>
                <td style={td}><Pill text={s.state} color={stateColor(s.state)} /></td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn testId={`np-run-${s.id}`} onClick={() => act(() => npRunSource(s.id), s.id)} disabled={busy === s.id}>Запустить</Btn>
                    <Btn onClick={() => openHealth(s.id)}>Проверить</Btn>
                    {s.status === "PAUSED"
                      ? <Btn onClick={() => act(() => npResumeSource(s.id), s.id)}>Возобновить</Btn>
                      : <Btn onClick={() => act(() => npPauseSource(s.id), s.id)}>Пауза</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {drawer && <SourceDrawer data={drawer} onClose={() => setDrawer(null)} onTest={async (id) => { const r = await npTestSource(id); alert(r.success ? `Тест OK: найдено ${r.data.itemsFound}, задержка ${r.data.latencyMs}мс` : `Ошибка теста: ${r.data?.error || ""}`); }} />}
    </div>
  );
};

const SourceDrawer: React.FC<{ data: any; onClose: () => void; onTest: (id: string) => void }> = ({ data, onClose, onTest }) => {
  const s = data.source;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 520, maxWidth: "100%", background: "#fff", height: "100%", overflow: "auto", padding: 22 }} data-testid="np-source-drawer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{s.name}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: T.sub }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 8, margin: "10px 0 16px" }}>
          <Pill text={s.state} color={stateColor(s.state)} />
          <Pill text={`Tier ${s.tier}`} />
          <Pill text={s.language} />
          <Btn kind="primary" onClick={() => onTest(s.id)}>Проверить источник</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <KPI label="Fetched (20)" value={data.last20?.fetched ?? 0} />
          <KPI label="Новых (20)" value={data.last20?.newItems ?? 0} color={GREEN} />
          <KPI label="Дубли (20)" value={data.last20?.duplicates ?? 0} />
          <KPI label="p50 задержка" value={`${Math.round((data.latency?.p50Ms || 0))}мс`} />
          <KPI label="p95 задержка" value={`${Math.round((data.latency?.p95Ms || 0))}мс`} />
          <KPI label="Circuit breaker" value={data.circuitBreaker?.tripped ? "TRIP" : "OK"} color={data.circuitBreaker?.tripped ? T.bad : GREEN} sub={`${data.circuitBreaker?.consecutiveFailures}/${data.circuitBreaker?.threshold}`} />
        </div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 4 }}>Feed URL</div>
        <div style={{ fontSize: 12, color: T.ink, wordBreak: "break-all", marginBottom: 12 }}>{s.feedUrl}</div>
        {data.lastError && <div style={{ background: `${T.bad}10`, border: `1px solid ${T.bad}44`, color: T.bad, padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>Последняя ошибка: {data.lastError}</div>}
        <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: "6px 0" }}>Последние запуски</div>
        <div style={{ display: "grid", gap: 6 }}>
          {(data.recentRuns || []).map((r: any) => (
            <div key={r._id} style={{ display: "flex", gap: 8, fontSize: 12, alignItems: "center", borderBottom: `1px solid ${T.soft}`, paddingBottom: 5 }}>
              <Pill text={r.status} color={r.status === "SUCCESS" ? GREEN : r.status === "FAILED" ? T.bad : T.warn} />
              <span style={{ color: T.sub }}>{new Date(r.startedAt).toLocaleString("ru-RU")}</span>
              <span style={{ marginLeft: "auto", color: T.faint }}>{r.newItems}нов / {r.duplicates}дуб / {r.durationMs}мс</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────── PARSING ───────────────────────────
const ParsingTab: React.FC = () => {
  const [pc, setPc] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const admin = isAdmin();
  const load = useCallback(async () => { const r = await npParsing(); if (r.success) setPc(r.data); }, []);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  const run = async (fn: () => Promise<any>, label: string) => { const r = await fn(); setMsg(r.success ? `${label}: ${r.data?.queued ?? "ok"} задач в очереди` : `Ошибка: ${r.data?.message || "нет прав"}`); load(); };
  if (!pc) return <div style={{ color: T.sub, padding: 20 }}>Загрузка…</div>;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
        <KPI label="Планировщик" value={pc.schedulerEnabled && !pc.globalPaused ? "Работает" : "Остановлен"} color={pc.schedulerEnabled && !pc.globalPaused ? GREEN : T.warn} />
        <KPI label="Глубина очереди" value={pc.queueDepth ?? 0} />
        <KPI label="Активных воркеров" value={pc.activeWorkers ?? 0} sub={`concurrency ${pc.concurrency}`} />
        <KPI label="В очереди / провалено" value={`${pc.queue?.waiting ?? 0} / ${pc.queue?.failed ?? 0}`} />
        <KPI label="Redis" value={pc.redisOk ? "OK" : "Ошибка"} color={pc.redisOk ? GREEN : T.bad} />
      </div>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 12 }}>Управление парсингом</div>
        {!admin && <div style={{ color: T.warn, fontSize: 12, marginBottom: 10 }}>Глобальные действия доступны только администратору.</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pc.globalPaused
            ? <Btn kind="primary" testId="np-global-resume" disabled={!admin} onClick={() => run(npGlobalResume, "Планировщик возобновлён")}>Возобновить планировщик</Btn>
            : <Btn kind="danger" testId="np-global-pause" disabled={!admin} onClick={() => run(npGlobalPause, "Планировщик на паузе")}>Пауза планировщика</Btn>}
          <Btn testId="np-run-tier-a" disabled={!admin} onClick={() => run(() => npRunTier("A"), "Tier A поставлен")}>Запустить Tier A</Btn>
          <Btn disabled={!admin} onClick={() => run(() => npRunTier("B"), "Tier B поставлен")}>Запустить Tier B</Btn>
          <Btn disabled={!admin} onClick={() => run(() => npRunTier("C"), "Tier C поставлен")}>Запустить Tier C</Btn>
          <Btn kind="primary" testId="np-run-all" disabled={!admin} onClick={() => run(npRunAll, "Все активные поставлены")}>Запустить все активные</Btn>
        </div>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: GREEN }}>{msg}</div>}
        <div style={{ marginTop: 12, fontSize: 12, color: T.faint }}>
          Интервалы по Tier: A≈{pc.tierIntervals?.A}м · B≈{pc.tierIntervals?.B}м · C≈{pc.tierIntervals?.C}м (настраивается по источнику). Все запуски идут через очередь.
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────── RUNS ───────────────────────────
const RunsTab: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [sel, setSel] = useState<any>(null);
  const load = useCallback(async () => { const r = await npRuns(80); if (r.success) setRows(Array.isArray(r.data) ? r.data : []); }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = status ? rows.filter((r) => r.status === status) : rows;
  const selStyle: React.CSSProperties = { padding: "7px 10px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, background: "#fff", marginBottom: 12 };
  return (
    <div>
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={selStyle} data-testid="np-runs-status">
        <option value="">Все статусы</option><option value="SUCCESS">SUCCESS</option><option value="FAILED">FAILED</option><option value="PARTIAL">PARTIAL</option><option value="RUNNING">RUNNING</option>
      </select>
      <Card style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }} data-testid="np-runs-table">
          <thead><tr>{["Источник", "Начало", "Длит.", "Fetched", "Новых", "Дубли", "Retry", "Статус", "Ошибка"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r._id} style={{ cursor: "pointer" }} onClick={() => setSel(r)}>
                <td style={{ ...td, fontWeight: 700 }}>{r.sourceName || r.sourceId}</td>
                <td style={td}>{new Date(r.startedAt).toLocaleString("ru-RU")}</td>
                <td style={td}>{r.durationMs ? `${r.durationMs}мс` : "—"}</td>
                <td style={td}>{r.fetchedItems ?? 0}</td>
                <td style={td}>{r.newItems ?? 0}</td>
                <td style={td}>{r.duplicates ?? 0}</td>
                <td style={td}>{r.retryCount ?? 0}</td>
                <td style={td}><Pill text={r.status} color={r.status === "SUCCESS" ? GREEN : r.status === "FAILED" ? T.bad : r.status === "RUNNING" ? T.accent : T.warn} /></td>
                <td style={{ ...td, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", color: T.bad }}>{r.errorMessage || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {sel && (
        <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 480, background: "#fff", height: "100%", overflow: "auto", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontSize: 16, fontWeight: 800 }}>{sel.sourceName}</div><button onClick={() => setSel(null)} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>×</button></div>
            <pre style={{ fontSize: 12, background: T.soft, padding: 12, borderRadius: 8, marginTop: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(sel, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────── STATS ───────────────────────────
const StatsTab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(7);
  useEffect(() => { npStats(days).then((r) => { if (r.success) setData(r.data); }); }, [days]);
  if (!data) return <div style={{ color: T.sub, padding: 20 }}>Загрузка…</div>;
  const series = (data.series || []).map((s: any) => ({ date: s._id?.slice(5), fetched: s.fetched, new: s.newItems, duplicates: s.duplicates, failed: s.failed }));
  const top = (data.perSource || []).slice(0, 12).map((s: any) => ({ name: s.name || s._id, new: s.newItems, dup: s.duplicates }));
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[7, 30].map((d) => <Btn key={d} kind={days === d ? "primary" : "ghost"} onClick={() => setDays(d)}>{d} дней</Btn>)}
      </div>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Получено vs Уникальные vs Дубли</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend />
            <Area type="monotone" dataKey="fetched" stroke={T.accent} fill={`${T.accent}22`} name="Получено" />
            <Area type="monotone" dataKey="new" stroke={GREEN} fill={`${GREEN}22`} name="Новые" />
            <Area type="monotone" dataKey="duplicates" stroke={T.warn} fill={`${T.warn}22`} name="Дубли" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Топ источников по новым статьям</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={top} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" width={110} fontSize={11} /><Tooltip /><Legend />
            <Bar dataKey="new" fill={GREEN} name="Новые" /><Bar dataKey="dup" fill={T.warn} name="Дубли" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// ─────────────────────────── DIAGNOSTICS ───────────────────────────
const DiagnosticsTab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => { setLoading(true); const r = await npDiagnostics(); if (r.success) setData(r.data); setLoading(false); };
  useEffect(() => { run(); }, []);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div><Btn kind="primary" testId="np-run-diagnostics" onClick={run} disabled={loading}>{loading ? "Проверка…" : "Запустить проверки"}</Btn></div>
      {data && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Диагностика подсистемы</div>
            <Pill text={data.ok ? "Всё работает" : "Есть проблемы"} color={data.ok ? GREEN : T.warn} />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {(data.checks || []).map((c: any) => (
              <div key={c.key} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: c.ok ? GREEN : T.bad }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{c.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: T.sub }}>{c.detail}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────── NEWS (existing canonical News) ───────────────────────────
const NewsTab: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetchAllNews("crypto").then((r) => { if (r.success) { const n = Array.isArray(r.data) ? r.data : r.data?.news || []; setRows(n.filter((x: any) => (x.newsSection || "") !== "fomo-update")); } }); }, []);
  return (
    <Card style={{ padding: 0, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
        <thead><tr>{["Заголовок", "Источник", "Категория", "Дата", "Статус"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.slice(0, 100).map((n) => (
            <tr key={n._id}>
              <td style={{ ...td, whiteSpace: "normal", maxWidth: 460, fontWeight: 600 }}>{n.title}</td>
              <td style={td}>{n.sourceName || "—"}</td>
              <td style={td}>{n.type || (n.tags || [])[0] || "—"}</td>
              <td style={td}>{fmtDate(n.date)}</td>
              <td style={td}><Pill text={n.status} color={n.status === "active" ? GREEN : T.warn} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

const Placeholder: React.FC<{ title: string; phase: string; children: React.ReactNode }> = ({ title, phase, children }) => (
  <Card>
    <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>{title}</div>
    <Pill text={phase} color={T.accent} />
    <div style={{ marginTop: 12, color: T.sub, fontSize: 13, lineHeight: 1.6 }}>{children}</div>
  </Card>
);

// ─────────────────────────── AI GENERATION (Phase 3) ───────────────────────────
const AiGenerationTab: React.FC = () => {
  const [ov, setOv] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [windowLimit, setWindowLimit] = useState(150);
  const [maxClusters, setMaxClusters] = useState(3);
  const admin = isAdmin();

  const load = useCallback(async () => {
    const [o, d, r] = await Promise.all([naOverview(), naDrafts(30), naRuns(20)]);
    if (o.success) setOv(o.data);
    if (d.success) setDrafts(Array.isArray(d.data) ? d.data : []);
    if (r.success) setRuns(Array.isArray(r.data) ? r.data : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const runGenerate = async () => {
    setBusy(true); setMsg("Генерация через FomoAiGateway…");
    const res = await naGenerate({ windowLimit, maxClusters });
    setBusy(false);
    if (res.success && res.data?.status === "SUCCESS") {
      setMsg(`Готово: создано ${res.data.generated}, стоимость $${(res.data.totalCostUsd || 0).toFixed(4)}, токенов ${res.data.totalTokens || 0}`);
    } else {
      setMsg(`Ошибка генерации: ${res.data?.error || res.data?.status || "не удалось"} (ingestion не затронут)`);
    }
    load();
  };

  const usd = (n: number) => `$${(Number(n) || 0).toFixed(4)}`;

  return (
    <div data-testid="ncc-ai-tab">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
        <KPI label="Черновиков" value={fmtNum(ov?.drafts ?? 0)} />
        <KPI label="Запусков генерации" value={fmtNum(ov?.runs ?? 0)} />
        <KPI label="COGS (всего)" value={usd(ov?.totalCostUsd)} sub="провайдерская стоимость" color={GREEN} />
        <KPI label="Токенов (всего)" value={fmtNum(ov?.totalTokens ?? 0)} />
      </div>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Синтез новостей (FomoAiGateway · managed credential)</div>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
          Кластеризация похожих статей → ранжирование → двуязычный синтез (EN/RU). Модель — policy правила <b>news_synthesize</b>. Парсинг и AI независимы: сбой AI не роняет ingestion.
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>Окно статей
            <input type="number" data-testid="ai-window" value={windowLimit} min={10} max={500}
              onChange={(e) => setWindowLimit(Number(e.target.value) || 150)}
              style={{ display: "block", marginTop: 4, width: 110, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.ink }} />
          </label>
          <label style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>Макс. кластеров
            <input type="number" data-testid="ai-maxclusters" value={maxClusters} min={1} max={10}
              onChange={(e) => setMaxClusters(Number(e.target.value) || 1)}
              style={{ display: "block", marginTop: 4, width: 110, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.ink }} />
          </label>
          <Btn kind="primary" testId="ai-generate-btn" disabled={!admin || busy} onClick={runGenerate}>
            {busy ? "Генерация…" : "Запустить генерацию"}
          </Btn>
          {!admin && <span style={{ fontSize: 12, color: T.faint }}>Только администратор</span>}
        </div>
        {msg && <div data-testid="ai-gen-msg" style={{ marginTop: 12, fontSize: 13, color: T.ink, background: T.soft, padding: "8px 12px", borderRadius: 8 }}>{msg}</div>}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: sel ? "1.4fr 1fr" : "1fr", gap: 16 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", fontSize: 15, fontWeight: 800 }}>Черновики ({drafts.length})</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>Заголовок (EN)</th><th style={th}>Тип</th><th style={th}>Источников</th>
                <th style={th}>Модель</th><th style={th}>Режим</th><th style={th}>COGS</th><th style={th}>Токены</th>
              </tr></thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d.unique_hash} data-testid={`ai-draft-row-${d.unique_hash}`} onClick={() => setSel(d)}
                    style={{ cursor: "pointer", background: sel?.unique_hash === d.unique_hash ? T.soft : "transparent" }}>
                    <td style={{ ...td, whiteSpace: "normal", maxWidth: 320 }}>{d.title_en}</td>
                    <td style={td}><Pill text={d.event_type || "news"} /></td>
                    <td style={td}>{(d.sourceArticleIds || []).length}</td>
                    <td style={td}>{d.model || "—"}</td>
                    <td style={td}><Pill text={d.dataMode || "—"} color={d.dataMode === "real" ? GREEN : T.warn} /></td>
                    <td style={td}>{usd(d.providerCostUsd)}</td>
                    <td style={td}>{fmtNum(d.totalTokens || 0)}</td>
                  </tr>
                ))}
                {drafts.length === 0 && <tr><td style={td} colSpan={7}>Черновиков пока нет. Запустите генерацию.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        {sel && (
          <Card style={{ padding: 16 }} >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Черновик</div>
              <Btn testId="ai-draft-close" onClick={() => setSel(null)}>Закрыть</Btn>
            </div>
            <div data-testid="ai-draft-detail" style={{ fontSize: 13, color: T.ink, display: "grid", gap: 10 }}>
              <div><b>EN:</b> {sel.title_en}</div>
              <div><b>RU:</b> {sel.title_ru}</div>
              <div style={{ color: T.sub }}>{sel.short_en}</div>
              <div style={{ whiteSpace: "pre-wrap", background: T.soft, padding: 10, borderRadius: 8, fontSize: 12 }}>{sel.extended_en}</div>
              <div style={{ fontStyle: "italic", color: GREEN }}>{sel.ai_view_en}</div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Trace / COGS</div>
                <div style={{ fontSize: 12, color: T.sub }}>provider: {sel.provider} · model: {sel.model} · mode: {sel.dataMode}</div>
                <div style={{ fontSize: 12, color: T.sub }}>tokens: {sel.totalTokens} · COGS: {usd(sel.providerCostUsd)} · credits: {sel.creditsCharged ?? 0}</div>
                <div style={{ fontSize: 12, color: T.sub }}>credentialId: {sel.credentialId || "—"} · policy: {sel.policyVersion}</div>
                <div style={{ fontSize: 12, color: T.sub }}>requestIds: {(sel.gatewayRequestIds || []).length}</div>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Provenance ({(sel.sourceUrls || []).length})</div>
                {(sel.sourceUrls || []).map((u: string, i: number) => (
                  <div key={i} style={{ fontSize: 12 }}><a href={u} target="_blank" rel="noreferrer" style={{ color: T.accent }}>{u}</a></div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card style={{ padding: 0, overflow: "hidden", marginTop: 16 }}>
        <div style={{ padding: "12px 16px", fontSize: 15, fontWeight: 800 }}>Запуски генерации</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={th}>Статус</th><th style={th}>Кластеров</th><th style={th}>Создано</th><th style={th}>Ошибок</th>
              <th style={th}>COGS</th><th style={th}>Токены</th><th style={th}>Начат</th>
            </tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r._id}>
                  <td style={td}><Pill text={r.status} color={r.status === "SUCCESS" ? GREEN : r.status === "FAILED" ? T.bad : T.warn} /></td>
                  <td style={td}>{r.clustersSelected ?? 0}</td>
                  <td style={td}>{r.generated ?? 0}</td>
                  <td style={td}>{r.failed ?? 0}</td>
                  <td style={td}>{usd(r.totalCostUsd)}</td>
                  <td style={td}>{fmtNum(r.totalTokens || 0)}</td>
                  <td style={td}>{fmtDate(r.startedAt)}</td>
                </tr>
              ))}
              {runs.length === 0 && <tr><td style={td} colSpan={7}>Запусков пока нет.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────── ROOT ───────────────────────────
const NewsControlCenter: React.FC = () => {
  const [tab, setTab] = useState("overview");
  return (
    <div data-testid="news-control-center">
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`ncc-tab-${t.key}`}
            style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700, border: "none", background: "transparent",
              color: tab === t.key ? GREEN : T.sub, borderBottom: `2px solid ${tab === t.key ? GREEN : "transparent"}`, marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>
      <div data-testid={`ncc-panel-${tab}`}>
        {tab === "overview" && <OverviewTab />}
        {tab === "news" && <NewsTab />}
        {tab === "sources" && <SourcesTab />}
        {tab === "parsing" && <ParsingTab />}
        {tab === "runs" && <RunsTab />}
        {tab === "stats" && <StatsTab />}
        {tab === "diagnostics" && <DiagnosticsTab />}
        {tab === "ai" && <AiGenerationTab />}
        {tab === "moderation" && (
          <Placeholder title="Модерация новостей" phase="Phase 4">
            Очередь публикации: На проверке · Опубликовано · Отклонено. Публикационный trust green / yellow / red (доверие/на проверку/отклонено),
            политики AUTO_PUBLISH / AI_REVIEW / MANUAL_REVIEW по источнику и категории.
          </Placeholder>
        )}
      </div>
    </div>
  );
};

export default NewsControlCenter;

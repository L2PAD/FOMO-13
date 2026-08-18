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
import { naOverview, naDrafts, naDraft, naRuns, naGenerate, naSettings, naUpdateSettings, naEditDraft, naApprove, naReject, naRegenerate, naPublish, naUnpublish } from "../../services/news_ai/newsAi";

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
  const [ai, setAi] = useState<any>(null);
  const load = useCallback(async () => {
    const [o, p, d, a] = await Promise.all([npOverview(), npParsing(), npDiagnostics(), naOverview()]);
    if (o.success) setOv(o.data);
    if (p.success) setPc(p.data);
    if (d.success) setDiag(d.data);
    if (a.success) setAi(a.data);
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
    { k: "AI-провайдер", ok: ai?.budget ? (ai.budget.status !== "LIMIT_REACHED") : null },
    { k: "Доставка на сайт", ok: (ov.articlesTotal || 0) > 0 },
  ];

  // unified operational alerts (news parser + AI pipeline) — real read-models only
  const aiAlerts: Array<{ label: string; detail: string; color: string }> = [];
  if (ai?.budget?.status === "LIMIT_REACHED") aiAlerts.push({ label: "AI бюджет исчерпан", detail: `COGS ${ai.budget.todayCogs}$/день`, color: T.bad });
  else if (ai?.budget?.status === "WARNING") aiAlerts.push({ label: "AI бюджет — предупреждение", detail: `использовано ${ai.budget.usagePct}%`, color: T.warn });
  if ((ai?.queue?.failed || 0) > 0) aiAlerts.push({ label: "Очередь AI: сбои", detail: `${ai.queue.failed} job(s) failed`, color: T.bad });
  if ((ai?.byGenStatus?.FAILED_RETRYABLE || 0) > 0) aiAlerts.push({ label: "Генерация: повтор", detail: `${ai.byGenStatus.FAILED_RETRYABLE} FAILED_RETRYABLE`, color: T.warn });
  if ((ai?.byGenStatus?.PENDING_BUDGET || 0) > 0) aiAlerts.push({ label: "Ожидают бюджета", detail: `${ai.byGenStatus.PENDING_BUDGET} PENDING_BUDGET`, color: T.warn });
  if ((ai?.byModeration?.NEEDS_REVIEW || 0) > 0) aiAlerts.push({ label: "Очередь модерации", detail: `${ai.byModeration.NEEDS_REVIEW} на проверке`, color: T.warn });

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
        {((ov.needsAttention?.length || 0) === 0 && aiAlerts.length === 0) ? (
          <div style={{ color: GREEN, fontSize: 13 }}>Всё в порядке — критичных проблем нет.</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {(ov.needsAttention || []).map((a: any, i: number) => (
              <div key={`s${i}`} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: T.ink }}>
                <Pill text={a.type === "stale" ? "Устарели данные" : "Сбои"} color={a.type === "stale" ? T.warn : T.bad} />
                <span>{a.source}</span>
                <span style={{ color: T.faint }}>
                  {a.type === "stale" ? `${a.staleMinutes} мин без обновления` : `${a.failures} ошибок подряд`}
                </span>
              </div>
            ))}
            {aiAlerts.map((a, i) => (
              <div key={`a${i}`} data-testid={`ncc-alert-ai-${i}`} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: T.ink }}>
                <Pill text="AI" color={a.color} />
                <span>{a.label}</span>
                <span style={{ color: T.faint }}>{a.detail}</span>
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

      <Card>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 12 }}>Редакционный конвейер</div>
        <div style={{ display: "flex", alignItems: "stretch", gap: 6, flexWrap: "wrap" }}>
          {[
            { k: "Источники", v: `${ov.sources?.active ?? 0}` },
            { k: "Raw (24ч)", v: fmtNum(ov.last24h?.fetched) },
            { k: "Уникальные", v: fmtNum(ov.last24h?.new) },
            { k: "AI черновики", v: fmtNum(ai?.drafts ?? 0), dim: !ai },
            { k: "На проверке", v: fmtNum(ai?.byModeration?.NEEDS_REVIEW ?? 0), dim: !ai },
            { k: "Approved", v: fmtNum(ai?.byModeration?.APPROVED ?? 0), dim: !ai },
            { k: "Published", v: fmtNum(ai?.byModeration?.PUBLISHED ?? 0), dim: !ai, accent: true },
          ].map((s, i, arr) => (
            <React.Fragment key={s.k}>
              <div style={{ flex: 1, minWidth: 96, textAlign: "center", padding: "10px 8px", border: `1px solid ${T.border}`, borderRadius: 10, background: s.accent ? T.soft : "transparent", opacity: s.dim ? 0.6 : 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.accent ? GREEN : T.ink }}>{s.v}</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.k}</div>
              </div>
              {i < arr.length - 1 && <div style={{ alignSelf: "center", color: T.faint, fontSize: 16 }}>→</div>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.faint, marginTop: 8 }}>Парсер и AI изолированы. Значения — реальные read-models (news-parser + news-ai).</div>
      </Card>
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
  const [settings, setSettings] = useState<any>(null);
  const [sel, setSel] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [windowLimit, setWindowLimit] = useState(150);
  const [maxClusters, setMaxClusters] = useState(3);
  const admin = isAdmin();

  const load = useCallback(async () => {
    const [o, d, r, s] = await Promise.all([naOverview(), naDrafts(30), naRuns(20), naSettings()]);
    if (o.success) setOv(o.data);
    if (d.success) setDrafts(Array.isArray(d.data) ? d.data : []);
    if (r.success) setRuns(Array.isArray(r.data) ? r.data : []);
    if (s.success) setSettings(s.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const runGenerate = async () => {
    setBusy(true); setMsg("Постановка в очередь генерации…");
    const res = await naGenerate({ windowLimit, maxClusters });
    setBusy(false);
    if (res.success && res.data?.ok) setMsg(`В очередь поставлено ${res.data.queued}/${res.data.selected} кластеров. Обработка идёт в фоне (Bull).`);
    else setMsg(`Ошибка постановки: ${res.data?.message || res.data?.error || "не удалось"} (ingestion не затронут)`);
    setTimeout(load, 3000);
  };

  const saveSettings = async (patch: any) => {
    if (!admin) return;
    setBusy(true);
    const res = await naUpdateSettings(patch);
    setBusy(false);
    if (res.success) { setSettings(res.data); setMsg("Настройки сохранены (реальные backend-policies)."); load(); }
    else setMsg("Не удалось сохранить настройки");
  };

  const usd = (n: number) => `$${(Number(n) || 0).toFixed(4)}`;
  const b = ov?.budget; const q = ov?.queue || {};
  const budgetColor = b?.status === "LIMIT_REACHED" ? T.bad : b?.status === "WARNING" ? T.warn : GREEN;
  const setField = (k: string, v: any) => setSettings((s: any) => ({ ...s, [k]: v }));
  const setBudgetField = (k: string, v: any) => setSettings((s: any) => ({ ...s, budget: { ...(s?.budget || {}), [k]: v } }));
  const numInput = (val: any, on: (n: number) => void, w = 110) => (
    <input type="number" value={val ?? 0} onChange={(e) => on(Number(e.target.value))}
      style={{ display: "block", marginTop: 4, width: w, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.ink }} />
  );
  const lbl = { fontSize: 12, color: T.sub, fontWeight: 600 } as const;

  return (
    <div data-testid="ncc-ai-tab">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 16 }}>
        <KPI label="Budget Health" value={b?.status || "—"} color={budgetColor} sub={`использовано ${b?.usagePct ?? 0}%`} />
        <KPI label="COGS сегодня / мес" value={`${usd(b?.todayCogs)} / ${usd(b?.monthCogs)}`} sub={`лимит $${b?.limits?.dailyCogsLimitUsd}/$${b?.limits?.monthlyCogsLimitUsd}`} />
        <KPI label="Генераций сегодня" value={fmtNum(b?.todayGenerations ?? 0)} sub={`лимит ${b?.limits?.maxGenerationsPerDay}`} />
        <KPI label="Очередь" value={`${q.waiting ?? 0} / ${q.active ?? 0}`} sub={`ожид/актив · fail ${q.failed ?? 0}`} />
        <KPI label="Планировщик" value={settings?.enabled ? "Включён" : "Выключен"} color={settings?.enabled ? GREEN : T.warn} sub={`интервал ${settings?.intervalMinutes ?? "—"}м`} />
        <KPI label="Черновиков / COGS" value={`${fmtNum(ov?.drafts ?? 0)}`} sub={`всего ${usd(ov?.totalCostUsd)} · ${fmtNum(ov?.totalTokens ?? 0)} tok`} color={GREEN} />
      </div>

      {settings && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Control Center · политики генерации (реальный backend)</div>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>Очередь Bull/Redis, бюджет проверяется <b>до</b> вызова LLM. Модель — policy правила <b>news_synthesize</b>. Парсер и AI изолированы.</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={lbl}>Scheduler
              <div style={{ marginTop: 6 }}><Btn testId="ai-toggle-sched" disabled={!admin || busy} onClick={() => saveSettings({ enabled: !settings.enabled })}>{settings.enabled ? "Выключить" : "Включить"}</Btn></div>
            </label>
            <label style={lbl}>Интервал (мин){numInput(settings.intervalMinutes, (v) => setField("intervalMinutes", v))}</label>
            <label style={lbl}>Max stories/run{numInput(settings.maxStoriesPerRun, (v) => setField("maxStoriesPerRun", v))}</label>
            <label style={lbl}>Min sources{numInput(settings.minSources, (v) => setField("minSources", v))}</label>
            <label style={lbl}>Окно статей{numInput(settings.windowLimit, (v) => setField("windowLimit", v))}</label>
            <label style={lbl}>Daily COGS $ {numInput(settings.budget?.dailyCogsLimitUsd, (v) => setBudgetField("dailyCogsLimitUsd", v))}</label>
            <label style={lbl}>Monthly COGS $ {numInput(settings.budget?.monthlyCogsLimitUsd, (v) => setBudgetField("monthlyCogsLimitUsd", v))}</label>
            <label style={lbl}>Max gen/day{numInput(settings.budget?.maxGenerationsPerDay, (v) => setBudgetField("maxGenerationsPerDay", v))}</label>
            <label style={lbl}>Warning %{numInput(settings.budget?.warningThresholdPct, (v) => setBudgetField("warningThresholdPct", v))}</label>
            <Btn kind="primary" testId="ai-save-settings" disabled={!admin || busy} onClick={() => saveSettings({ intervalMinutes: settings.intervalMinutes, maxStoriesPerRun: settings.maxStoriesPerRun, minSources: settings.minSources, windowLimit: settings.windowLimit, budget: settings.budget })}>Сохранить настройки</Btn>
          </div>
        </Card>
      )}

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Ручной запуск генерации (в очередь)</div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={lbl}>Окно статей{numInput(windowLimit, (v) => setWindowLimit(v || 150))}</label>
          <label style={lbl}>Макс. кластеров{numInput(maxClusters, (v) => setMaxClusters(v || 1))}</label>
          <Btn kind="primary" testId="ai-generate-btn" disabled={!admin || busy} onClick={runGenerate}>{busy ? "…" : "Поставить в очередь"}</Btn>
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

// ─────────────────────────── MODERATION (Phase 4/5) ───────────────────────────
const TRUST_COLORS: Record<string, string> = { GREEN: "#04A584", YELLOW: "#C98A00", RED: "#D14343" };
const MOD_FILTERS = ["ALL", "NEEDS_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"];

const ModerationTab: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [sel, setSel] = useState<any>(null);
  const [ed, setEd] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const admin = isAdmin();

  const load = useCallback(async () => {
    const r = await naDrafts(100, filter === "ALL" ? undefined : filter);
    if (r.success) setItems(Array.isArray(r.data) ? r.data : []);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const open = (g: any) => { setSel(g); setEd(g.editorial || {}); setMsg(""); };
  const refreshSel = async (hash: string) => { const r = await naDraft(hash); if (r.success) { setSel(r.data); setEd(r.data.editorial || {}); } load(); };

  const act = async (fn: () => Promise<any>, label: string) => {
    if (!admin) { setMsg("Только администратор"); return; }
    setBusy(true); setMsg(`${label}…`);
    const res = await fn();
    setBusy(false);
    setMsg(res.success ? `${label}: OK` : `${label}: ошибка — ${res.data?.message || "не удалось"}`);
    if (sel) await refreshSel(sel.unique_hash); // always re-read backend (no optimistic fake state)
  };

  const usd = (n: number) => `$${(Number(n) || 0).toFixed(4)}`;
  const edInput = (k: string, ph: string, area = false) => area
    ? <textarea value={ed[k] ?? ""} placeholder={ph} onChange={(e) => setEd({ ...ed, [k]: e.target.value })} style={{ width: "100%", minHeight: 90, marginTop: 4, padding: 8, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.ink, fontSize: 13 }} />
    : <input value={ed[k] ?? ""} placeholder={ph} onChange={(e) => setEd({ ...ed, [k]: e.target.value })} style={{ width: "100%", marginTop: 4, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.ink, fontSize: 13 }} />;

  return (
    <div data-testid="ncc-moderation-tab">
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {MOD_FILTERS.map((f) => (
          <button key={f} data-testid={`mod-filter-${f}`} onClick={() => setFilter(f)}
            style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 700, border: `1px solid ${filter === f ? GREEN : T.border}`, background: filter === f ? T.soft : "transparent", color: filter === f ? GREEN : T.sub }}>{f}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 1.3fr" : "1fr", gap: 16 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", fontSize: 15, fontWeight: 800 }}>Очередь модерации ({items.length})</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Trust</th><th style={th}>Заголовок</th><th style={th}>Статус</th><th style={th}>Источн.</th><th style={th}>COGS</th></tr></thead>
              <tbody>
                {items.map((g) => (
                  <tr key={g.unique_hash} data-testid={`mod-row-${g.unique_hash}`} onClick={() => open(g)} style={{ cursor: "pointer", background: sel?.unique_hash === g.unique_hash ? T.soft : "transparent" }}>
                    <td style={td}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: TRUST_COLORS[g.trustColor] || T.faint }} /> {g.trustColor || "—"}</td>
                    <td style={{ ...td, whiteSpace: "normal", maxWidth: 260 }}>{(g.editorial?.titleEn || g.title_en || "").slice(0, 70)}</td>
                    <td style={td}><Pill text={g.moderationStatus || "—"} /></td>
                    <td style={td}>{(g.sourceArticleIds || []).length}</td>
                    <td style={td}>{usd(g.providerCostUsd)}</td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td style={td} colSpan={5}>Пусто</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        {sel && (
          <Card style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Материал · <Pill text={sel.moderationStatus} /></div>
              <Btn testId="mod-close" onClick={() => setSel(null)}>Закрыть</Btn>
            </div>
            {/* trust explained for humans */}
            <div data-testid="mod-trust" style={{ fontSize: 13, marginBottom: 10, color: T.ink }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: TRUST_COLORS[sel.trustColor] || T.faint, marginRight: 6 }} />
              <b>{sel.trustColor}</b> · {sel.trustReason?.independentSources ?? "?"} независимых источников · confidence {sel.trustReason?.aiConfidence ?? "?"} · конфликтов {sel.trustReason?.conflicts ?? 0}
            </div>

            <div style={{ display: "grid", gap: 8, fontSize: 12, color: T.sub }}>
              <label>Заголовок (editorial){edInput("titleEn", sel.title_en)}</label>
              <label>Краткое (editorial){edInput("shortEn", sel.short_en, true)}</label>
              <label>Текст (editorial){edInput("extendedEn", sel.extended_en, true)}</label>
              <label>FOMO AI View{edInput("aiViewEn", sel.ai_view_en, true)}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn testId="mod-save" disabled={!admin || busy} onClick={() => act(() => naEditDraft(sel.unique_hash, ed), "Сохранить правки")}>Сохранить правки</Btn>
              </div>
            </div>

            {/* AI original (preserved) */}
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.sub }}>AI original (сохраняется)</summary>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}><b>{sel.title_en}</b><div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{sel.extended_en}</div></div>
            </details>

            <div style={{ marginTop: 10, fontSize: 12, color: T.sub }}>
              <div><b>Trace:</b> {sel.provider} · {sel.model} · {sel.dataMode} · tokens {sel.totalTokens} · {usd(sel.providerCostUsd)} · credits {sel.creditsCharged ?? 0}</div>
              <div><b>Components:</b> {(sel.componentTrace || []).map((c: any) => c.component).join(", ")}</div>
              <div><b>Provenance ({(sel.sourceUrls || []).length}):</b> {(sel.sourceUrls || []).slice(0, 6).map((u: string, i: number) => <a key={i} href={u} target="_blank" rel="noreferrer" style={{ color: T.accent, marginRight: 6 }}>[{i + 1}]</a>)}</div>
              <div><b>Revisions:</b> {(sel.revisions || []).length}</div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <Btn kind="primary" testId="mod-approve" disabled={!admin || busy} onClick={() => act(() => naApprove(sel.unique_hash), "Approve")}>Approve</Btn>
              <Btn kind="primary" testId="mod-publish" disabled={!admin || busy} onClick={() => act(() => naPublish(sel.unique_hash), "Publish")}>Publish</Btn>
              <Btn testId="mod-reject" disabled={!admin || busy} onClick={() => act(() => naReject(sel.unique_hash), "Reject")}>Reject</Btn>
              <Btn testId="mod-regen" disabled={!admin || busy} onClick={() => act(() => naRegenerate(sel.unique_hash), "Regenerate")}>Regenerate</Btn>
              <Btn testId="mod-unpublish" disabled={!admin || busy} onClick={() => act(() => naUnpublish(sel.unique_hash), "Unpublish")}>Unpublish</Btn>
            </div>
            {msg && <div data-testid="mod-msg" style={{ marginTop: 10, fontSize: 13, background: T.soft, padding: "8px 12px", borderRadius: 8 }}>{msg}</div>}
          </Card>
        )}
      </div>
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
        {tab === "moderation" && <ModerationTab />}
      </div>
    </div>
  );
};

export default NewsControlCenter;

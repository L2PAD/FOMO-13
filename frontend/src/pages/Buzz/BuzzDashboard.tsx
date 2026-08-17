import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { T, CHART_COLORS } from "../Statistics/ui";
import { fetchBuzzStats, IBuzzStats } from "../../components/services/buzz/buzzStats";

const card: React.CSSProperties = {
  background: T.cardBg,
  border: `1px solid ${T.border}`,
  borderRadius: T.radius,
  padding: 18,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

const KPI: React.FC<{ label: string; value: any; hint?: string; tone?: string }> = ({ label, value, hint, tone }) => (
  <div style={{ ...card, flex: "1 1 170px", minWidth: 160 }} data-testid={`buzz-kpi-${label}`}>
    <div style={{ fontSize: 11.5, fontWeight: 800, color: T.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: tone || T.ink, marginTop: 8 }}>{value}</div>
    {hint ? <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{hint}</div> : null}
  </div>
);

const usd = (n: any) => `$${Number(n || 0).toFixed(4)}`;
const shortDate = (s: string) => {
  const parts = (s || "").split("-");
  return parts.length === 3 ? `${parts[2]}.${parts[1]}` : s;
};

const BuzzDashboard: React.FC = () => {
  const [stats, setStats] = useState<IBuzzStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    const r = await fetchBuzzStats();
    setLoading(false);
    if (r.success && r.data && r.data.activity) setStats(r.data as IBuzzStats);
    else setError(true);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} data-testid="buzz-dashboard-loading">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ ...card, flex: "1 1 170px", minWidth: 160, height: 92, background: T.soft, border: `1px solid ${T.border}` }} />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ ...card, textAlign: "center", padding: 40 }} data-testid="buzz-dashboard-error">
        <div style={{ color: T.bad, fontWeight: 700, marginBottom: 8 }}>Не удалось загрузить статистику</div>
        <button
          onClick={load}
          style={{ border: "none", background: T.accent, color: "#fff", borderRadius: 8, padding: "9px 16px", fontWeight: 700, cursor: "pointer" }}
        >
          Повторить
        </button>
      </div>
    );
  }

  const a = stats.activity;
  const m = stats.moderation;
  const ai = stats.ai;
  const cogs = stats.cogs;
  const seriesData = (stats.series || []).map((s) => ({ ...s, d: shortDate(s.date) }));
  const dayPct = cogs.dailyLimitUsd > 0 ? Math.min(100, (cogs.dayUsd / cogs.dailyLimitUsd) * 100) : 0;
  const monthPct = cogs.monthlyLimitUsd > 0 ? Math.min(100, (cogs.monthUsd / cogs.monthlyLimitUsd) * 100) : 0;

  return (
    <div data-testid="buzz-dashboard">
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 14 }}>
        Вовлечённость сообщества, модерация и нагрузка AI (COGS). Данные в реальном времени.
      </div>

      {/* Activity KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Темы" value={a.topics} hint={`+${a.topicsToday} сегодня`} />
        <KPI label="Ответы" value={a.replies} hint={`+${a.repliesToday} сегодня`} />
        <KPI label="Реакции" value={a.reactions} tone={T.good} />
        <KPI label="Активные (всего)" value={a.activeUsersTotal} />
        <KPI label="Активные (месяц)" value={a.activeUsersMonth} tone={T.accent} />
      </div>

      {/* Moderation + AI KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <KPI label="Жалобы (открытые)" value={m.reportedOpen} tone={m.reportedOpen > 0 ? T.warn : T.ink} />
        <KPI label="Удалено" value={m.removed} tone={m.removed > 0 ? T.bad : T.ink} />
        <KPI label="Скрыто" value={m.hidden} />
        <KPI label="Ответы AI (всего)" value={ai.repliesTotal} hint={`+${ai.repliesToday} сегодня`} tone={T.accent} />
        <KPI label="COGS (всего)" value={usd(cogs.totalUsd)} hint={`${ai.operationsTotal} операций AI`} tone={T.good} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 12 }}>Активность за 14 дней</div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={seriesData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTopics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[2]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: T.faint }} tickLine={false} axisLine={{ stroke: T.border }} />
                <YAxis tick={{ fontSize: 11, fill: T.faint }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="topics" name="Темы" stroke={CHART_COLORS[0]} fill="url(#gTopics)" strokeWidth={2} />
                <Area type="monotone" dataKey="replies" name="Ответы" stroke={CHART_COLORS[2]} fill="url(#gReplies)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 12 }}>Ответы FOMO AI за 14 дней</div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={seriesData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: T.faint }} tickLine={false} axisLine={{ stroke: T.border }} />
                <YAxis tick={{ fontSize: 11, fill: T.faint }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Bar dataKey="ai" name="Ответы AI" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI budget bars */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 14 }}>Бюджет AI (COGS)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <BudgetBar label="Дневной" spent={cogs.dayUsd} limit={cogs.dailyLimitUsd} pct={dayPct} />
          <BudgetBar label="Месячный" spent={cogs.monthUsd} limit={cogs.monthlyLimitUsd} pct={monthPct} />
        </div>
      </div>
    </div>
  );
};

const BudgetBar: React.FC<{ label: string; spent: number; limit: number; pct: number }> = ({ label, spent, limit, pct }) => {
  const tone = pct >= 90 ? T.bad : pct >= 70 ? T.warn : T.good;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: T.sub }}>{label}</span>
        <span style={{ color: T.ink, fontWeight: 700 }}>{usd(spent)} / {usd(limit)}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: T.soft, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: tone, borderRadius: 999, transition: "width 250ms ease" }} />
      </div>
      <div style={{ fontSize: 11.5, color: T.faint, marginTop: 5 }}>{pct.toFixed(1)}% использовано</div>
    </div>
  );
};

export default BuzzDashboard;

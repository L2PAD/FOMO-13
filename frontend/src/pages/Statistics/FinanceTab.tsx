import React, { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  T, CHART_COLORS, Card, ChartCard, SectionTitle, KpiCard, KpiGrid, StateBlock,
  SimpleTable, Column, Badge, useAsync, fmtNum, fmtDate, shortId,
} from "./ui";
import { getMoneyStatistics, getMoneyStatisticsTimeseries, getMoneyFinanceUsers } from "../AccessMonetization/service";

const axis = { fontSize: 11, fill: T.sub };
const grid = { stroke: "#EEF2F7" };
const dayTick = (d: string) => (d ? d.slice(5) : d);

const fmtUsd = (n: any) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtUsdc = (n: any) => `${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
const fmtPctRatio = (n: any) => (n == null ? "—" : `${Math.round((Number(n) || 0) * 1000) / 10}%`);

// Canonical profitability status labels (status derived on backend).
const PROFIT_STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "default" | "info" }> = {
  HEALTHY: { label: "Healthy", tone: "good" },
  AT_RISK: { label: "At risk", tone: "warn" },
  OVER_TARGET_COGS: { label: "Over target COGS", tone: "bad" },
  NO_PAID_REVENUE: { label: "No paid revenue", tone: "default" },
  INSUFFICIENT_SAMPLE: { label: "Insufficient sample", tone: "default" },
  NO_ACTIVITY: { label: "No activity", tone: "default" },
};

export const FinanceTab: React.FC<{ onOpenUser: (id: string) => void }> = ({ onOpenUser }) => {
  const [days, setDays] = useState<number>(30);
  const stat = useAsync(() => getMoneyStatistics(), []);
  const series = useAsync(() => getMoneyStatisticsTimeseries(days), [days]);
  const users = useAsync(() => getMoneyFinanceUsers(200), []);

  if (stat.loading) return <Card><StateBlock kind="loading" /></Card>;
  if (stat.error) return <Card><StateBlock kind="error" message={stat.error} onRetry={stat.refetch} /></Card>;

  const s: any = stat.data || {};
  const dep = s.deposits || {}; const wd = s.withdrawals || {}; const pur = s.purchases || {};
  const rev = s.realizedRevenue || {}; const liab = s.liability || {}; const ref = s.refunds || {};
  const ts: any[] = series.data?.series || [];

  const userRows: any[] = users.data?.items || [];

  const userCols: Column<any>[] = [
    {
      key: "user", header: "Пользователь",
      render: (r) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: T.ink, fontWeight: 600 }}>{r.email || r.username || shortId(r.userId)}</span>
          {r.wallet ? <span style={{ fontSize: 11, color: T.faint, fontFamily: "monospace" }}>{shortId(r.wallet)}</span> : null}
        </div>
      ),
    },
    { key: "balance", header: "FOMO Balance", align: "right", render: (r) => <span style={{ fontWeight: 700 }}>{fmtUsdc(r.balance)}</span> },
    { key: "deposited", header: "Депозиты", align: "right", render: (r) => fmtUsdc(r.deposited) },
    { key: "purchased", header: "Покупки", align: "right", render: (r) => fmtUsdc(r.purchased) },
    { key: "membership", header: "Подписка", render: (r) => <Badge tone={r.membership && r.membership !== "—" ? "info" : "default"}>{r.membership}</Badge> },
    { key: "aiCreditsUsed", header: "AI credits used", align: "right", render: (r) => fmtNum(r.aiCreditsUsed) },
    { key: "providerCogsUsd", header: "Provider COGS", align: "right", render: (r) => fmtUsd(r.providerCogsUsd) },
    { key: "realizedRevenueUsd", header: "Realized revenue", align: "right", render: (r) => <span style={{ color: r.realizedRevenueUsd > 0 ? T.good : T.sub, fontWeight: 700 }}>{fmtUsd(r.realizedRevenueUsd)}</span> },
    { key: "contributionUsd", header: "Contribution", align: "right", render: (r) => <span style={{ color: r.contributionUsd >= 0 ? T.ink : T.bad }}>{fmtUsd(r.contributionUsd)}</span> },
    { key: "marginPct", header: "Margin", align: "right", render: (r) => fmtPctRatio(r.marginPct) },
    { key: "status", header: "Статус", render: (r) => { const st = PROFIT_STATUS[r.status] || PROFIT_STATUS.NO_ACTIVITY; return <Badge tone={st.tone}>{st.label}</Badge>; } },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }} data-testid="stat-finance">
      {/* KPI: users + revenue */}
      <KpiGrid>
        <KpiCard testId="fin-kpi-funded" label="Funded users" value={fmtNum(s.fundedUsers)} hint="хотя бы 1 депозит" />
        <KpiCard testId="fin-kpi-paying" label="Paying users" value={fmtNum(s.payingUsers)} tone="good" hint="есть SETTLED покупка" />
        <KpiCard label="Активные подписки" value={fmtNum(s.activeSubscriptions)} />
        <KpiCard label="Realized revenue" value={fmtUsd(rev.total)} tone="good" />
        <KpiCard label="FOMO AI revenue" value={fmtUsd(rev.fomoAiUsd)} />
        <KpiCard label="FOMO Intel revenue" value={fmtUsd(rev.fomoIntelUsd)} />
      </KpiGrid>

      {/* KPI: balances / flows */}
      <KpiGrid>
        <KpiCard label="Liability (total)" value={fmtUsdc(liab.total)} hint="обязательства перед юзерами" />
        <KpiCard label="Available" value={fmtUsdc(liab.available)} />
        <KpiCard label="Reserved" value={fmtUsdc(liab.reserved)} tone={liab.reserved > 0 ? "warn" : "default"} />
        <KpiCard label="Deposits 30d" value={fmtUsdc(dep.last30d)} hint={`${dep.count30d || 0} операций`} />
        <KpiCard label="Withdrawals 30d" value={fmtUsdc(wd.last30d)} hint={`${wd.count30d || 0} операций`} />
        <KpiCard label="Purchase volume 30d" value={fmtUsdc(pur.volume30d)} hint={`${pur.count30d || 0} покупок`} />
        <KpiCard label="Refund rate" value={fmtPctRatio(s.refundRatePct)} tone={s.refundRatePct ? "warn" : "default"} />
        <KpiCard label="Settlement success" value={fmtPctRatio(s.settlementSuccessPct)} tone="good" />
      </KpiGrid>

      {/* Range switch */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>Период графиков:</span>
        {[7, 30, 90].map((d) => (
          <button key={d} data-testid={`fin-range-${d}`} onClick={() => setDays(d)}
            style={{ padding: "6px 12px", borderRadius: 9, cursor: "pointer", fontSize: 12.5, fontWeight: 700, border: `1px solid ${days === d ? T.accent : T.border}`, background: days === d ? T.accent : T.cardBg, color: days === d ? "#fff" : T.ink }}>
            {d}д
          </button>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))" }}>
        <ChartCard title="Депозиты и выводы" sub="USDC по дням" testId="fin-chart-flows">
          {series.loading ? <StateBlock kind="loading" /> : ts.length ? (
            <ResponsiveContainer>
              <BarChart data={ts}>
                <CartesianGrid vertical={false} {...grid} />
                <XAxis dataKey="date" tickFormatter={dayTick} tick={axis} />
                <YAxis tick={axis} />
                <Tooltip />
                <Legend />
                <Bar dataKey="deposits" name="Депозиты" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="Выводы" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <StateBlock kind="empty" message="Нет операций за период" />}
        </ChartCard>

        <ChartCard title="Выручка (realized)" sub="Оплаченные покупки по дням" testId="fin-chart-revenue">
          {series.loading ? <StateBlock kind="loading" /> : ts.length ? (
            <ResponsiveContainer>
              <AreaChart data={ts}>
                <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} /><stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} {...grid} />
                <XAxis dataKey="date" tickFormatter={dayTick} tick={axis} />
                <YAxis tick={axis} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" name="Revenue, $" stroke={CHART_COLORS[0]} fill="url(#gRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <StateBlock kind="empty" message="Нет оплат за период" />}
        </ChartCard>
      </div>

      {/* Users table with drill-down */}
      <Card testId="fin-users-card">
        <SectionTitle sub="Клик по строке — Customer 360 → Финансы (один источник цифр)">Финансы по пользователям</SectionTitle>
        {users.loading ? <StateBlock kind="loading" /> : users.error ? (
          <StateBlock kind="error" message={users.error} onRetry={users.refetch} />
        ) : (
          <SimpleTable
            testId="fin-users-table"
            columns={userCols}
            rows={userRows}
            empty="Нет пользователей с финансовой активностью"
            onRowClick={(r) => onOpenUser(r.userId)}
          />
        )}
      </Card>
    </div>
  );
};

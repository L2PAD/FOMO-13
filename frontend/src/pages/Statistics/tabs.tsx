import React, { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { StatisticsApi, StatFilters } from "./api";
import {
  T, CHART_COLORS, Card, ChartCard, SectionTitle, KpiCard, KpiGrid, StateBlock,
  SimpleTable, Column, Badge, useAsync, fmtNum, fmtPct, fmtDur, fmtDate, shortId,
} from "./ui";

const axis = { fontSize: 11, fill: T.sub };
const grid = { stroke: "#EEF2F7" };

const NotCollected: React.FC<{ block: any; title: string; height?: number }> = ({ block, title, height }) => (
  <ChartCard title={title} height={height || 120}>
    <StateBlock kind="not-collected" message={block?.note} />
  </ChartCard>
);

const dayTick = (d: string) => (d ? d.slice(5) : d);

/* ============ 1. OVERVIEW ============ */
export const OverviewTab: React.FC<{ filters: StatFilters }> = ({ filters }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.overview(filters), [filters]);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const k = data?.kpis || {}; const xp = data?.xp || {};
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <KpiGrid>
        <KpiCard testId="kpi-total-users" label="Всего пользователей" value={fmtNum(k.totalUsers)} />
        <KpiCard label="Новые за период" value={fmtNum(k.newUsers)} />
        <KpiCard label="Активны сегодня" value={fmtNum(k.activeToday)} />
        <KpiCard label="Онлайн сейчас" value={fmtNum(k.onlineNow)} tone="good" hint="активность за 5 мин" />
        <KpiCard label="DAU" value={fmtNum(k.dau)} />
        <KpiCard label="WAU" value={fmtNum(k.wau)} />
        <KpiCard label="MAU" value={fmtNum(k.mau)} />
        <KpiCard label="Stickiness DAU/MAU" value={fmtPct(k.stickiness)} />
        <KpiCard label="Ср. длит. сессии" value={fmtDur(k.avgSessionSec)} />
        <KpiCard label="Сессий за период" value={fmtNum(k.sessions)} />
      </KpiGrid>

      <SectionTitle sub="XP начисляется только через леджер после квалификации — сырые события ≠ XP">Контроль XP</SectionTitle>
      <KpiGrid>
        <KpiCard label="XP начислено сегодня" value={fmtNum(xp.awardedToday)} tone="good" />
        <KpiCard label="XP за период" value={fmtNum(xp.awardedInRange)} />
        <KpiCard label="Получателей XP" value={fmtNum(xp.recipients)} />
        <KpiCard label="Средний XP/юзер" value={fmtNum(xp.avgXpPerUser)} />
        <KpiCard label="Pending XP" value={fmtNum(xp.pending)} tone="warn" />
        <KpiCard label="Reversed XP" value={fmtNum(xp.reversed)} tone="bad" />
        <KpiCard label="Rejected XP" value={fmtNum(xp.rejected)} tone="bad" />
      </KpiGrid>

      <ChartCard title="Активные пользователи по дням (DAU)" testId="chart-dau">
        {(data?.charts?.dau || []).length ? (
          <ResponsiveContainer>
            <AreaChart data={data.charts.dau}>
              <defs><linearGradient id="gDau" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} /><stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} {...grid} />
              <XAxis dataKey="day" tick={axis} tickFormatter={dayTick} minTickGap={24} />
              <YAxis tick={axis} allowDecimals={false} width={32} />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="DAU" stroke={CHART_COLORS[0]} fill="url(#gDau)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <StateBlock kind="empty" />}
      </ChartCard>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {data?.fomoScore?.available ? (
          <Card testId="overview-fomo">
            <SectionTitle sub="Подробный разбор — во вкладке «XP / Рейтинг»">FOMO Score (обзор)</SectionTitle>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>СРЕДНИЙ</div><div style={{ fontSize: 26, fontWeight: 800, color: T.good }}>{fmtNum(data.fomoScore.avg)}</div></div>
              <div><div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>ОЦЕНЕНО</div><div style={{ fontSize: 26, fontWeight: 800, color: T.ink }}>{fmtNum(data.fomoScore.scoredUsers)}</div></div>
              <div><div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>МАКСИМУМ</div><div style={{ fontSize: 26, fontWeight: 800, color: T.ink }}>{fmtNum(data.fomoScore.max)}</div></div>
            </div>
          </Card>
        ) : <NotCollected title="FOMO Score (обзор)" block={data?.fomoScore} />}
        <NotCollected title="Трейдинг (OTC/P2P)" block={data?.trading} />
        <NotCollected title="Launchpad" block={data?.launchpad} />
      </div>
    </div>
  );
};

/* ============ 2. AUDIENCE ============ */
export const AudienceTab: React.FC<{ filters: StatFilters }> = ({ filters }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.audience(filters), [filters]);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const t = data?.totals || {}; const r = data?.retention || {};
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <KpiGrid>
        <KpiCard label="Зарегистрировано" value={fmtNum(t.registered)} />
        <KpiCard label="Активны 7д" value={fmtNum(t.active7)} />
        <KpiCard label="Активны 30д" value={fmtNum(t.active30)} />
        <KpiCard label="Неактивные" value={fmtNum(t.inactive)} tone="warn" />
        <KpiCard label="Retention D1" value={fmtPct(r.D1)} tone="good" />
        <KpiCard label="Retention D7" value={fmtPct(r.D7)} />
        <KpiCard label="Retention D30" value={fmtPct(r.D30)} />
        <KpiCard label="Размер когорты" value={fmtNum(r.cohortSize)} hint="регистрации за период" />
      </KpiGrid>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <ChartCard title="Регистрации по дням">
          {(data?.charts?.registrations || []).some((x: any) => x.count) ? (
            <ResponsiveContainer>
              <BarChart data={data.charts.registrations}>
                <CartesianGrid vertical={false} {...grid} />
                <XAxis dataKey="day" tick={axis} tickFormatter={dayTick} minTickGap={24} />
                <YAxis tick={axis} allowDecimals={false} width={32} />
                <Tooltip />
                <Bar dataKey="count" name="Регистрации" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <StateBlock kind="empty" />}
        </ChartCard>
        <ChartCard title="Активные пользователи по дням">
          {(data?.charts?.activeUsers || []).some((x: any) => x.count) ? (
            <ResponsiveContainer>
              <LineChart data={data.charts.activeUsers}>
                <CartesianGrid vertical={false} {...grid} />
                <XAxis dataKey="day" tick={axis} tickFormatter={dayTick} minTickGap={24} />
                <YAxis tick={axis} allowDecimals={false} width={32} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Активные" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <StateBlock kind="empty" />}
        </ChartCard>
      </div>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <NotCollected title="География / устройства" block={data?.geo} />
        <NotCollected title="Источник регистрации" block={data?.registrationSource} />
      </div>
    </div>
  );
};

/* ============ 3. FUNNEL ============ */
export const FunnelTab: React.FC<{ filters: StatFilters }> = ({ filters }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.funnel(filters), [filters]);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const steps = data?.steps || []; const v = data?.verification || {};
  const maxU = Math.max(1, ...steps.map((s: any) => s.users));
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card testId="funnel-steps">
        <SectionTitle sub="Где пользователи обрываются на онбординге">Воронка онбординга</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {steps.map((s: any, i: number) => (
            <div key={s.key} style={{ display: "grid", gridTemplateColumns: "220px 1fr 150px", gap: 12, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{i + 1}. {s.label}</div>
              <div style={{ background: T.soft, borderRadius: 8, overflow: "hidden", height: 26 }}>
                <div style={{ width: `${(s.users / maxU) * 100}%`, minWidth: 2, height: "100%", background: CHART_COLORS[0], display: "flex", alignItems: "center", paddingLeft: 8, color: "#fff", fontSize: 12, fontWeight: 700 }}>{fmtNum(s.users)}</div>
              </div>
              <div style={{ fontSize: 12, color: T.sub, textAlign: "right" }}>
                <Badge tone="info">{fmtPct(s.conversion)}</Badge>{" "}
                {i > 0 && s.dropOff > 0 ? <Badge tone="bad">-{fmtNum(s.dropOff)}</Badge> : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <KpiGrid>
        <KpiCard label="Twitter верифицирован" value={fmtNum(v.twitterVerified)} tone="good" />
        <KpiCard label="Twitter пропущен (skip)" value={fmtNum(v.twitterSkipped)} tone="warn" />
        <KpiCard label="Email указан" value={fmtNum(v.emailVerified)} tone="good" />
        <KpiCard label="Email пропущен (skip)" value={fmtNum(v.emailSkipped)} tone="warn" />
        <KpiCard label="Анонимных сессий" value={fmtNum(data?.anonymousSessions)} hint="до регистрации" />
      </KpiGrid>
    </div>
  );
};

/* ============ 3b. TASKS (canonical XP task funnel + drill-down) ============ */
export const TasksTab: React.FC<{ filters: StatFilters; onOpenUser: (id: string) => void }> = ({ filters, onOpenUser }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.tasks(filters), [filters]);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;

  const k = data?.kpis || {};
  const funnel = data?.funnel || [];
  const domain = data?.domain || [];
  const completions = data?.charts?.completions || [];
  const maxU = Math.max(1, ...funnel.map((s: any) => s.users));

  const taskCols: Column<any>[] = [
    { key: "name", header: "Задача", render: (r) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 600, color: T.ink }}>{r.name}</span>
        <span style={{ fontSize: 11, color: T.faint }}>{r.completionMode || "—"} · {r.points} XP · {r.accessTier}</span>
      </div>
    ) },
    { key: "started", header: "Начали", align: "right", render: (r) => fmtNum(r.started) },
    { key: "completed", header: "Завершили", align: "right", render: (r) => fmtNum(r.completed) },
    { key: "rejected", header: "Отклонено", align: "right", render: (r) => <span style={{ color: r.rejected ? T.bad : T.sub }}>{fmtNum(r.rejected)}</span> },
    { key: "conversion", header: "Конверсия", align: "right", render: (r) => <Badge tone="info">{fmtPct(r.conversion)}</Badge> },
    { key: "xp", header: "XP выдано", align: "right", render: (r) => fmtNum(r.xp) },
    { key: "users", header: "Юзеров", align: "right", render: (r) => fmtNum(r.users) },
  ];
  const userCols: Column<any>[] = [
    { key: "name", header: "Пользователь", render: (r) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 600, color: T.accent }}>{r.name || r.email || shortId(r.wallet)}</span>
        {r.email ? <span style={{ fontSize: 11, color: T.faint }}>{r.email}</span> : null}
      </div>
    ) },
    { key: "started", header: "Начал", align: "right", render: (r) => fmtNum(r.started) },
    { key: "completed", header: "Завершил", align: "right", render: (r) => fmtNum(r.completed) },
    { key: "rejected", header: "Отклонено", align: "right", render: (r) => <span style={{ color: r.rejected ? T.bad : T.sub }}>{fmtNum(r.rejected)}</span> },
    { key: "xp", header: "XP за задачи", align: "right", render: (r) => fmtNum(r.xp) },
    { key: "activityXP", header: "Всего XP", align: "right", render: (r) => fmtNum(r.activityXP) },
  ];

  const domTone = (d: string) => (d === "earlyland" ? CHART_COLORS[4] : CHART_COLORS[0]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <KpiGrid>
        <KpiCard testId="task-kpi-users" label="Уник. пользователей" value={fmtNum(k.uniqueUsers)} hint="активны с задачами за период" />
        <KpiCard label="Задач затронуто" value={fmtNum(k.uniqueTasks)} />
        <KpiCard testId="task-kpi-started" label="Начали" value={fmtNum(k.started)} />
        <KpiCard label="На проверке" value={fmtNum(k.underReview)} tone="warn" hint="submitted + under_review" />
        <KpiCard testId="task-kpi-completed" label="Завершили" value={fmtNum(k.completed)} tone="good" />
        <KpiCard label="Отклонено" value={fmtNum(k.rejected)} tone="bad" />
        <KpiCard testId="task-kpi-xp" label="XP начислено" value={fmtNum(k.xpAwarded)} tone="good" hint="через XP Ledger" />
        <KpiCard label="Approval rate" value={fmtPct(k.approvalRate)} hint="completed / (completed+rejected)" />
      </KpiGrid>

      <Card testId="task-funnel">
        <SectionTitle sub="Путь пользователя по задаче: начал → отправил → проверено → завершено (XP)">Воронка задач</SectionTitle>
        {funnel.some((s: any) => s.users) ? (
          <div style={{ display: "grid", gap: 10 }}>
            {funnel.map((s: any, i: number) => (
              <div key={s.key} style={{ display: "grid", gridTemplateColumns: "180px 1fr 150px", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{i + 1}. {s.label}</div>
                <div style={{ background: T.soft, borderRadius: 8, overflow: "hidden", height: 26 }}>
                  <div style={{ width: `${(s.users / maxU) * 100}%`, minWidth: 2, height: "100%", background: CHART_COLORS[0], display: "flex", alignItems: "center", paddingLeft: 8, color: "#fff", fontSize: 12, fontWeight: 700 }}>{fmtNum(s.users)}</div>
                </div>
                <div style={{ fontSize: 12, color: T.sub, textAlign: "right" }}>
                  <Badge tone="info">{fmtPct(s.conversion)}</Badge>{" "}
                  {i > 0 && s.dropOff > 0 ? <Badge tone="bad">-{fmtNum(s.dropOff)}</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        ) : <StateBlock kind="empty" message="За выбранный период активности по задачам не было" />}
      </Card>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card testId="task-domain">
          <SectionTitle sub="Core = глобальные задачи · EarlyLand = задачи активности">Core vs EarlyLand</SectionTitle>
          {domain.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {domain.map((d: any) => (
                <div key={d.domain} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: domTone(d.domain) }} />
                    <span style={{ fontWeight: 700, color: T.ink }}>{d.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                    <div><div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>НАЧАЛИ</div><div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{fmtNum(d.started)}</div></div>
                    <div><div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>ЗАВЕРШИЛИ</div><div style={{ fontSize: 18, fontWeight: 800, color: T.good }}>{fmtNum(d.completed)}</div></div>
                    <div><div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>ОТКЛОНЕНО</div><div style={{ fontSize: 18, fontWeight: 800, color: T.bad }}>{fmtNum(d.rejected)}</div></div>
                    <div><div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>XP</div><div style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>{fmtNum(d.xp)}</div></div>
                    <div><div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>ЮЗЕРОВ</div><div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{fmtNum(d.users)}</div></div>
                  </div>
                </div>
              ))}
            </div>
          ) : <StateBlock kind="empty" />}
        </Card>

        <ChartCard title="Завершения задач по дням" sub="и начисленный XP" testId="task-completions-chart">
          {completions.some((x: any) => x.completed || x.xp) ? (
            <ResponsiveContainer>
              <BarChart data={completions}>
                <CartesianGrid vertical={false} {...grid} />
                <XAxis dataKey="day" tick={axis} tickFormatter={dayTick} minTickGap={24} />
                <YAxis tick={axis} allowDecimals={false} width={32} />
                <Tooltip />
                <Bar dataKey="completed" name="Завершено" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <StateBlock kind="empty" message="Нет завершений за период" />}
        </ChartCard>
      </div>

      <Card>
        <SectionTitle sub="Топ задач по вовлечению — клик по строке пользователя ниже открывает Customer 360">Задачи</SectionTitle>
        <SimpleTable testId="task-top-tasks" columns={taskCols} rows={data?.topTasks || []} empty="Нет задач за период" />
      </Card>

      <Card>
        <SectionTitle sub="Клик по строке → полный профиль Customer 360">Пользователи (drill-down)</SectionTitle>
        <SimpleTable testId="task-top-users" columns={userCols} rows={data?.topUsers || []} onRowClick={(r) => onOpenUser(r.userId)} empty="Нет пользователей за период" />
      </Card>
    </div>
  );
};


/* ============ 4. ACTIVITY ============ */
export const ActivityTab: React.FC<{ filters: StatFilters }> = ({ filters }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.activity(filters), [filters]);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const s = data?.sessions || {};
  const evCols: Column<any>[] = [
    { key: "eventType", header: "Событие" },
    { key: "count", header: "Кол-во", align: "right", render: (r) => fmtNum(r.count) },
  ];
  const pageCols: Column<any>[] = [
    { key: "page", header: "Страница", render: (r) => <span style={{ color: T.accent }}>{r.page}</span> },
    { key: "views", header: "Просмотры", align: "right", render: (r) => fmtNum(r.views) },
    { key: "visitors", header: "Уник.", align: "right", render: (r) => fmtNum(r.visitors) },
  ];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <KpiGrid>
        <KpiCard label="Сессий" value={fmtNum(s.total)} />
        <KpiCard label="Уник. пользователей" value={fmtNum(s.uniqueUsers)} />
        <KpiCard label="Сессий на юзера" value={fmtNum(s.perUser)} />
        <KpiCard label="Ср. активное время" value={fmtDur(s.avgDurationSec)} />
        <KpiCard label="Активное время всего" value={`${fmtNum(s.totalActiveHours)}ч`} />
      </KpiGrid>
      <ChartCard title="События по дням">
        {(data?.charts?.events || []).some((x: any) => x.count) ? (
          <ResponsiveContainer>
            <AreaChart data={data.charts.events}>
              <defs><linearGradient id="gEv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS[2]} stopOpacity={0.35} /><stop offset="100%" stopColor={CHART_COLORS[2]} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} {...grid} />
              <XAxis dataKey="day" tick={axis} tickFormatter={dayTick} minTickGap={24} />
              <YAxis tick={axis} allowDecimals={false} width={32} />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="События" stroke={CHART_COLORS[2]} fill="url(#gEv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <StateBlock kind="empty" />}
      </ChartCard>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card><SectionTitle>Топ событий</SectionTitle><SimpleTable columns={evCols} rows={data?.topEvents || []} /></Card>
        <Card><SectionTitle>Топ страниц</SectionTitle><SimpleTable columns={pageCols} rows={data?.topPages || []} /></Card>
      </div>
    </div>
  );
};

/* ============ 5. XP / RATING ============ */
export const XpTab: React.FC<{ filters: StatFilters; onOpenUser: (id: string) => void }> = ({ filters, onOpenUser }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.xp(filters), [filters]);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const groups = data?.groups || []; const rankDist = data?.rankDistribution || [];
  const evCols: Column<any>[] = [
    { key: "eventType", header: "Тип события" },
    { key: "group", header: "Группа", render: (r) => <Badge tone="info">{r.group}</Badge> },
    { key: "awarded", header: "Начислено", align: "right", render: (r) => fmtNum(r.awarded) },
    { key: "reversed", header: "Reversed", align: "right", render: (r) => <span style={{ color: r.reversed ? T.bad : T.sub }}>{fmtNum(r.reversed)}</span> },
    { key: "net", header: "Net", align: "right", render: (r) => fmtNum(r.net) },
    { key: "users", header: "Юзеров", align: "right", render: (r) => fmtNum(r.users) },
    { key: "tx", header: "Транз.", align: "right", render: (r) => fmtNum(r.tx) },
  ];
  const earnCols: Column<any>[] = [
    { key: "name", header: "Пользователь", render: (r) => r.name || r.email || shortId(r.wallet) },
    { key: "xpInRange", header: "XP за период", align: "right", render: (r) => fmtNum(r.xpInRange) },
    { key: "totalXp", header: "Всего XP", align: "right", render: (r) => fmtNum(r.totalXp) },
    { key: "tx", header: "Транз.", align: "right", render: (r) => fmtNum(r.tx) },
  ];
  const anyXp = groups.some((g: any) => g.awarded || g.pending || g.reversed);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ChartCard title="Начисление XP по дням (awarded)" testId="chart-xp">
        {(data?.charts?.xpIssuance || []).some((x: any) => x.xp) ? (
          <ResponsiveContainer>
            <BarChart data={data.charts.xpIssuance}>
              <CartesianGrid vertical={false} {...grid} />
              <XAxis dataKey="day" tick={axis} tickFormatter={dayTick} minTickGap={24} />
              <YAxis tick={axis} width={40} />
              <Tooltip />
              <Bar dataKey="xp" name="XP" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <StateBlock kind="empty" message="За выбранный период XP через леджер не начислялся" />}
      </ChartCard>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card>
          <SectionTitle sub="Сколько пользователей в каждом глобальном ранге (0–1000 XP)">Распределение по рангам</SectionTitle>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={rankDist} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} {...grid} />
                <XAxis type="number" tick={axis} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={axis} width={130} />
                <Tooltip />
                <Bar dataKey="users" name="Пользователи" radius={[0, 4, 4, 0]}>
                  {rankDist.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionTitle>XP по группам</SectionTitle>
          {anyXp ? (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={groups.filter((g: any) => g.awarded > 0)} dataKey="awarded" nameKey="group" outerRadius={95} label={(e: any) => e.group}>
                    {groups.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <StateBlock kind="empty" message="Нет начислений XP за период" height={220} />}
        </Card>
      </div>

      <Card><SectionTitle>XP по типам событий</SectionTitle><SimpleTable testId="xp-events-table" columns={evCols} rows={data?.events || []} empty="Нет XP-событий за период" /></Card>
      <Card><SectionTitle>Топ получателей XP</SectionTitle><SimpleTable columns={earnCols} rows={data?.topEarners || []} onRowClick={(r) => onOpenUser(r.userId)} empty="Нет данных" /></Card>
      <FomoScoreBlock filters={filters} />
    </div>
  );
};

/* ===== FOMO Score analytics block (distribution + components + dynamics) ===== */
export const FomoScoreBlock: React.FC<{ filters: StatFilters }> = ({ filters }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.fomoScore(filters), [filters]);
  const s = data?.summary || {};
  return (
    <Card testId="fomo-score-block">
      <SectionTitle sub="Распределение, вклад компонентов и динамика перерасчётов">FOMO Score</SectionTitle>
      {loading ? <StateBlock kind="loading" /> : error ? <StateBlock kind="error" message={error} onRetry={refetch} /> : (
        <div style={{ display: "grid", gap: 16 }}>
          <KpiGrid min={150}>
            <KpiCard label="Оценённых юзеров" value={fmtNum(s.scoredUsers)} />
            <KpiCard label="Средний FOMO Score" value={fmtNum(s.avg)} tone="good" />
            <KpiCard label="Медиана" value={fmtNum(s.median)} />
            <KpiCard label="Максимум" value={fmtNum(s.max)} />
          </KpiGrid>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <div>
              <SectionTitle>Распределение по диапазонам</SectionTitle>
              <div style={{ width: "100%", height: 240 }}>
                {(data?.distribution || []).some((d: any) => d.count) ? (
                  <ResponsiveContainer>
                    <BarChart data={data.distribution}>
                      <CartesianGrid vertical={false} {...grid} />
                      <XAxis dataKey="band" tick={axis} />
                      <YAxis tick={axis} allowDecimals={false} width={32} />
                      <Tooltip />
                      <Bar dataKey="count" name="Пользователи" radius={[4, 4, 0, 0]}>
                        {(data.distribution || []).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <StateBlock kind="empty" message="Пока нет рассчитанных FOMO Score" height={200} />}
              </div>
            </div>
            <div>
              <SectionTitle>Вклад компонентов (средний)</SectionTitle>
              <div style={{ width: "100%", height: 240 }}>
                {(data?.components || []).length ? (
                  <ResponsiveContainer>
                    <BarChart data={data.components} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid horizontal={false} {...grid} />
                      <XAxis type="number" tick={axis} />
                      <YAxis type="category" dataKey="label" tick={axis} width={130} />
                      <Tooltip />
                      <Bar dataKey="avgContribution" name="Вклад" radius={[0, 4, 4, 0]}>
                        {(data.components || []).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <StateBlock kind="empty" message="Нет данных по компонентам" height={200} />}
              </div>
            </div>
          </div>
          <div>
            <SectionTitle sub={data?.dynamicsNote}>Динамика: перерасчёты рейтинга по дням</SectionTitle>
            <div style={{ width: "100%", height: 220 }}>
              {(data?.dynamics?.recalcByDay || []).some((d: any) => d.count) ? (
                <ResponsiveContainer>
                  <LineChart data={data.dynamics.recalcByDay}>
                    <CartesianGrid vertical={false} {...grid} />
                    <XAxis dataKey="day" tick={axis} tickFormatter={dayTick} minTickGap={24} />
                    <YAxis tick={axis} allowDecimals={false} width={32} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" name="Перерасчёты" stroke={CHART_COLORS[5]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <StateBlock kind="empty" message="За период перерасчётов рейтинга не было" height={180} />}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

/* ============ 6. CONTENT ============ */
export const ContentTab: React.FC<{ filters: StatFilters }> = ({ filters }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.content(filters), [filters]);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const cCols: Column<any>[] = [
    { key: "eventType", header: "Тип" },
    { key: "count", header: "Кол-во", align: "right", render: (r) => fmtNum(r.count) },
    { key: "uniqueAuthors", header: "Уник. авторов", align: "right", render: (r) => fmtNum(r.uniqueAuthors) },
  ];
  const aCols: Column<any>[] = [
    { key: "category", header: "Категория действия" },
    { key: "count", header: "Кол-во", align: "right", render: (r) => fmtNum(r.count) },
  ];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card><SectionTitle sub="Комментарии/чат — по XP-событиям">Контент-события</SectionTitle><SimpleTable columns={cCols} rows={data?.contentXpEvents || []} empty="Нет контент-событий" /></Card>
        <Card><SectionTitle>Действия по категориям (лог)</SectionTitle><SimpleTable columns={aCols} rows={data?.actionCategories || []} empty="Нет действий в логе" /></Card>
      </div>
      <NotCollected title="Модерация контента (report/spam/delete rate)" block={data?.moderation} />
    </div>
  );
};

/* ============ 7. ANTI-FRAUD ============ */
export const AntifraudTab: React.FC<{ filters: StatFilters; onOpenUser: (id: string) => void }> = ({ filters, onOpenUser }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.antifraud(filters), [filters]);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const s = data?.summary || {};
  const cols: Column<any>[] = [
    { key: "name", header: "Пользователь", render: (r) => r.name || r.email || shortId(r.wallet) },
    { key: "risk", header: "Risk", align: "right", render: (r) => <Badge tone={r.severity === "high" ? "bad" : r.severity === "medium" ? "warn" : "default"}>{r.risk}</Badge> },
    { key: "severity", header: "Severity", render: (r) => r.severity },
    { key: "reversedTx", header: "Reversed tx", align: "right", render: (r) => fmtNum(r.reversedTx) },
    { key: "awardedTx", header: "Awarded tx", align: "right", render: (r) => fmtNum(r.awardedTx) },
  ];
  const capCols: Column<any>[] = [
    { key: "reason", header: "Причина отклонения (rejected)" },
    { key: "count", header: "Кол-во", align: "right", render: (r) => fmtNum(r.count) },
  ];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <KpiGrid>
        <KpiCard label="Rejected транзакций" value={fmtNum(s.rejectedTx)} tone="bad" />
        <KpiCard label="Юзеров с reversed" value={fmtNum(s.reversedUsers)} tone="warn" />
        <KpiCard label="Высокая XP-скорость" value={fmtNum(s.highVelocityUsers)} tone="warn" hint="≥50 tx/период" />
        <KpiCard label="Warnings (лог)" value={fmtNum(s.warnings)} />
        <KpiCard label="Critical (лог)" value={fmtNum(s.critical)} tone="bad" />
      </KpiGrid>
      <Card>
        <SectionTitle sub="Очередь расследований — клик по строке открывает профиль">Подозрительные пользователи</SectionTitle>
        <SimpleTable testId="antifraud-suspicious" columns={cols} rows={data?.suspicious || []} onRowClick={(r) => onOpenUser(r.userId)} empty="Подозрительной активности не обнаружено" />
      </Card>
      <Card><SectionTitle>Причины отклонений XP (cap/cooldown/rules)</SectionTitle><SimpleTable columns={capCols} rows={data?.capHits || []} empty="Нет отклонённых транзакций" /></Card>
      <NotCollected title="Мульти-аккаунты (IP/device fingerprint)" block={data?.multiAccount} />
    </div>
  );
};

/* ============ 8. USERS ============ */
export const UsersTab: React.FC<{ filters: StatFilters; onOpenUser: (id: string) => void }> = ({ filters, onOpenUser }) => {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.users({ ...filters, search: q, limit: 30 }), [filters, q]);
  const cols: Column<any>[] = [
    { key: "name", header: "Пользователь", render: (r) => <div><div style={{ fontWeight: 600 }}>{r.name || "—"}</div><div style={{ fontSize: 11.5, color: T.sub }}>{r.email || shortId(r.wallet)}</div></div> },
    { key: "rank", header: "Ранг", render: (r) => <Badge tone="info">{r.rank}</Badge> },
    { key: "activityXP", header: "XP", align: "right", render: (r) => fmtNum(r.activityXP) },
    { key: "sessions30d", header: "Сессии 30д", align: "right", render: (r) => fmtNum(r.sessions30d) },
    { key: "activeMin30d", header: "Актив. мин 30д", align: "right", render: (r) => fmtNum(r.activeMin30d) },
    { key: "verified", header: "Верифиц.", render: (r) => r.verified ? <Badge tone="good">да</Badge> : <Badge>нет</Badge> },
    { key: "isActive", header: "Активен", render: (r) => r.isActive ? <Badge tone="good">да</Badge> : <Badge tone="warn">нет</Badge> },
    { key: "lastLogin", header: "Последний вход", render: (r) => fmtDate(r.lastLogin) },
    { key: "createdAt", header: "Регистрация", render: (r) => fmtDate(r.createdAt) },
  ];
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          data-testid="users-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setQ(search.trim()); }}
          placeholder="Поиск: имя, email, кошелёк…"
          style={{ flex: 1, maxWidth: 380, padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, outline: "none" }}
        />
        <button onClick={() => setQ(search.trim())} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Найти</button>
        <div style={{ marginLeft: "auto", fontSize: 12.5, color: T.sub }}>{data?.total ? `Всего: ${data.total}` : ""}</div>
      </div>
      <Card>
        {loading ? <StateBlock kind="loading" /> : error ? <StateBlock kind="error" message={error} onRetry={refetch} /> :
          <SimpleTable testId="users-table" columns={cols} rows={data?.rows || []} onRowClick={(r) => onOpenUser(r.userId)} empty="Пользователи не найдены" />}
      </Card>
    </div>
  );
};

/* ============ USER DRILLDOWN DRAWER ============ */
export const UserDrawer: React.FC<{ userId: string; onClose: () => void }> = ({ userId, onClose }) => {
  const { data, loading, error, refetch } = useAsync(() => StatisticsApi.userDetail(userId), [userId]);
  const u = data?.user;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.35)", backdropFilter: "blur(2px)" }} />
      <div data-testid="user-drawer" style={{ position: "relative", width: "min(560px, 94vw)", height: "100%", background: T.pageBg, overflowY: "auto", boxShadow: "-8px 0 24px rgba(16,24,40,0.12)", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>Профиль пользователя</div>
          <button data-testid="drawer-close" onClick={onClose} style={{ border: `1px solid ${T.border}`, background: T.cardBg, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
        {loading ? <Card><StateBlock kind="loading" /></Card> :
          error ? <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card> :
          !data?.found ? <Card><StateBlock kind="empty" message="Пользователь не найден" /></Card> :
          <div style={{ display: "grid", gap: 14 }}>
            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{u.name || "—"}</div>
              <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>{u.email || "—"} · {shortId(u.wallet)}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <Badge tone="info">XP: {fmtNum(u.activityXP)}</Badge>
                {u.verified ? <Badge tone="good">verified</Badge> : <Badge tone="warn">not verified</Badge>}
                {u.isActive ? <Badge tone="good">active</Badge> : <Badge>inactive</Badge>}
                <Badge>рег.: {fmtDate(u.createdAt)}</Badge>
              </div>
            </Card>
            <KpiGrid min={150}>
              <KpiCard label="Сессий" value={fmtNum(data.stats?.sessions)} />
              <KpiCard label="Актив. время" value={`${fmtNum(data.stats?.totalActiveMin)}м`} />
              <KpiCard label="События" value={fmtNum(data.stats?.events)} />
            </KpiGrid>
            <Card><SectionTitle>XP по типам событий</SectionTitle>
              <SimpleTable columns={[{ key: "eventType", header: "Тип" }, { key: "group", header: "Группа", render: (r) => <Badge tone="info">{r.group}</Badge> }, { key: "xp", header: "XP", align: "right", render: (r) => fmtNum(r.xp) }, { key: "tx", header: "Tx", align: "right", render: (r) => fmtNum(r.tx) }]} rows={data.xpByGroup || []} empty="Нет XP" />
            </Card>
            <Card><SectionTitle>Последние XP-транзакции</SectionTitle>
              <SimpleTable columns={[{ key: "eventType", header: "Событие" }, { key: "finalXp", header: "XP", align: "right", render: (r) => fmtNum(r.finalXp) }, { key: "status", header: "Статус", render: (r) => <Badge tone={r.status === "awarded" ? "good" : r.status === "reversed" || r.status === "rejected" ? "bad" : "warn"}>{r.status}</Badge> }, { key: "occurredAt", header: "Когда", render: (r) => fmtDate(r.occurredAt) }]} rows={data.xpTransactions || []} empty="Нет транзакций" />
            </Card>
            <Card><SectionTitle>Сессии</SectionTitle>
              <SimpleTable columns={[{ key: "startedAt", header: "Начало", render: (r) => fmtDate(r.startedAt) }, { key: "activeMin", header: "Актив. мин", align: "right", render: (r) => fmtNum(r.activeMin) }, { key: "pageViews", header: "Просмотры", align: "right", render: (r) => fmtNum(r.pageViews) }]} rows={data.sessions || []} empty="Нет сессий" />
            </Card>
            <Card><SectionTitle>Лента активности</SectionTitle>
              <SimpleTable columns={[{ key: "eventType", header: "Событие" }, { key: "page", header: "Страница" }, { key: "occurredAt", header: "Когда", render: (r) => fmtDate(r.occurredAt) }]} rows={data.activity || []} empty="Нет активности" />
            </Card>
            <Card><SectionTitle>Модерация / лог</SectionTitle>
              <SimpleTable columns={[{ key: "category", header: "Категория" }, { key: "action", header: "Действие" }, { key: "severity", header: "Severity", render: (r) => <Badge tone={r.severity === "critical" ? "bad" : r.severity === "warning" ? "warn" : "default"}>{r.severity || "—"}</Badge> }, { key: "createdAt", header: "Когда", render: (r) => fmtDate(r.createdAt) }]} rows={data.moderationLogs || []} empty="Нет записей" />
            </Card>
          </div>}
      </div>
    </div>
  );
};

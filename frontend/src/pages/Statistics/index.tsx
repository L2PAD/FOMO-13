import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import Layout from "../../components/layouts/main_layout/layout";
import { AdminDatePicker } from "../AdminRating/AdminControls";
import { StatFilters } from "./api";
import { T } from "./ui";
import {
  OverviewTab, AudienceTab, FunnelTab, ActivityTab, XpTab,
  ContentTab, AntifraudTab, UsersTab, TasksTab,
} from "./tabs";
import { FinanceTab } from "./FinanceTab";

type TabKey = "overview" | "audience" | "funnel" | "tasks" | "activity" | "xp" | "content" | "antifraud" | "users" | "finance";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Обзор" },
  { key: "audience", label: "Аудитория" },
  { key: "funnel", label: "Воронка" },
  { key: "tasks", label: "Задачи" },
  { key: "activity", label: "Активность" },
  { key: "xp", label: "XP / Рейтинг" },
  { key: "content", label: "Контент" },
  { key: "antifraud", label: "Антинакрутка" },
  { key: "finance", label: "Финансы" },
  { key: "users", label: "Пользователи" },
];

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const presetRange = (days: number): { from: string; to: string } => {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  return { from: isoDay(from), to: isoDay(to) };
};

const Statistics: React.FC = () => {
  const history = useHistory();
  const [tab, setTab] = useState<TabKey>("overview");
  const [range, setRange] = useState<{ from: string; to: string }>(presetRange(30));
  const [preset, setPreset] = useState<number | null>(30);

  // Statistics = audience aggregate, Customer 360 = per-user drill-down.
  // Any user opened from Statistics routes into their full Customer 360 profile.
  const openUser = (id: string) => { if (id) history.push(`/users_list/user/${id}`); };
  // Finance drill-down opens Customer 360 directly on the Finance tab.
  const openUserFinance = (id: string) => { if (id) history.push(`/users_list/user/${id}?tab=finance`); };

  const filters: StatFilters = useMemo(
    () => ({ from: range.from, to: range.to, tzOffset: new Date().getTimezoneOffset() }),
    [range]
  );

  const setPresetRange = (days: number) => { setPreset(days); setRange(presetRange(days)); };

  return (
    <Layout>
      <div data-testid="statistics-page" style={{ background: T.pageBg, minHeight: "100%", padding: "24px 28px" }}>
        <style>{`::selection{background:${T.accent};color:#fff}`}</style>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Статистика платформы</div>
            <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Аналитика пользователей, активности, XP/рейтинга и антинакрутки</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                data-testid={`range-preset-${d}`}
                onClick={() => setPresetRange(d)}
                style={{
                  padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                  border: `1px solid ${preset === d ? T.accent : T.border}`,
                  background: preset === d ? T.accent : T.cardBg,
                  color: preset === d ? "#fff" : T.ink,
                }}
              >
                {d}д
              </button>
            ))}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <AdminDatePicker testid="range-from" value={range.from} onChange={(v) => { setPreset(null); setRange((r) => ({ ...r, from: v })); }} />
              <span style={{ color: T.faint }}>—</span>
              <AdminDatePicker testid="range-to" value={range.to} onChange={(v) => { setPreset(null); setRange((r) => ({ ...r, to: v })); }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
          {TABS.map((tb) => (
            <button
              key={tb.key}
              data-testid={`stat-tab-${tb.key}`}
              onClick={() => setTab(tb.key)}
              style={{
                padding: "10px 16px", cursor: "pointer", fontSize: 13.5, fontWeight: 700,
                border: "none", background: "transparent",
                color: tab === tb.key ? T.accent : T.sub,
                borderBottom: `2px solid ${tab === tb.key ? T.accent : "transparent"}`,
                marginBottom: -1, transition: "color 150ms ease",
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div>
          {tab === "overview" && <OverviewTab filters={filters} />}
          {tab === "audience" && <AudienceTab filters={filters} />}
          {tab === "funnel" && <FunnelTab filters={filters} />}
          {tab === "tasks" && <TasksTab filters={filters} onOpenUser={openUser} />}
          {tab === "activity" && <ActivityTab filters={filters} />}
          {tab === "xp" && <XpTab filters={filters} onOpenUser={openUser} />}
          {tab === "content" && <ContentTab filters={filters} />}
          {tab === "antifraud" && <AntifraudTab filters={filters} onOpenUser={openUser} />}
          {tab === "finance" && <FinanceTab onOpenUser={openUserFinance} />}
          {tab === "users" && <UsersTab filters={filters} onOpenUser={openUser} />}
        </div>
      </div>
    </Layout>
  );
};

export default Statistics;

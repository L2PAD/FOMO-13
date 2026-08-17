import React, { useCallback, useEffect, useState } from "react";

export const T = {
  pageBg: "#F6F8FB",
  cardBg: "#FFFFFF",
  ink: "#0F172A",
  sub: "#64748B",
  faint: "#94A3B8",
  border: "#E6EAF0",
  soft: "#F1F5F9",
  accent: "#4F46E5",
  good: "#0F9D8C",
  warn: "#B45309",
  bad: "#B91C1C",
  radius: 14,
};

export const CHART_COLORS = ["#4F46E5", "#0EA5E9", "#14B8A6", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];

export const fmtNum = (n: any): string => {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${Math.round(v)}`;
};
export const fmtPct = (n: any): string => `${Math.round((Number(n) || 0) * 10) / 10}%`;
export const fmtDur = (sec: any): string => {
  const s = Number(sec) || 0;
  if (s < 60) return `${Math.round(s)}с`;
  if (s < 3600) return `${Math.round(s / 60)}м`;
  return `${Math.round((s / 3600) * 10) / 10}ч`;
};
export const fmtDate = (d: any): string => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "2-digit" });
  } catch {
    return "—";
  }
};
export const shortId = (s: string, n = 10): string =>
  !s ? "—" : s.length <= n ? s : `${s.slice(0, 6)}…${s.slice(-4)}`;

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; testId?: string }> = ({ children, style, testId }) => (
  <div
    data-testid={testId}
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      padding: 20,
      boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{children}</div>
    {sub ? <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>{sub}</div> : null}
  </div>
);

export interface HeaderTab {
  key: string;
  label: string;
}

/**
 * Canonical CRM page header: large title + subtitle + horizontal tabs with a
 * bottom border. Active tab = accent (purple) text + accent bottom underline.
 * This is the single shared header pattern used across Rating / Statistics /
 * Advertising / Support / EarlyLand. No pill / filled tab buttons.
 */
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  tabs?: HeaderTab[];
  active?: string;
  onTab?: (key: string) => void;
  right?: React.ReactNode;
  testIdPrefix?: string;
}> = ({ title, subtitle, tabs, active, onTab, right, testIdPrefix = "page" }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }} data-testid={`${testIdPrefix}-title`}>{title}</h1>
        {subtitle ? <p style={{ margin: "6px 0 0", fontSize: 13.5, color: T.sub, maxWidth: 900 }}>{subtitle}</p> : null}
      </div>
      {right ? <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{right}</div> : null}
    </div>
    {tabs && tabs.length ? (
      <div
        role="tablist"
        style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${T.border}`, marginTop: 18 }}
      >
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              data-testid={`${testIdPrefix}-tab-${t.key}`}
              onClick={() => onTab?.(t.key)}
              style={{
                position: "relative",
                padding: "11px 18px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                background: "transparent",
                color: isActive ? T.accent : T.sub,
                borderBottom: `2px solid ${isActive ? T.accent : "transparent"}`,
                marginBottom: -1,
                whiteSpace: "nowrap",
                transition: "color 150ms ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    ) : null}
  </div>
);

export const KpiCard: React.FC<{ label: string; value: React.ReactNode; hint?: string; tone?: "default" | "good" | "warn" | "bad"; testId?: string }> = ({ label, value, hint, tone = "default", testId }) => {
  const color = tone === "good" ? T.good : tone === "warn" ? T.warn : tone === "bad" ? T.bad : T.ink;
  return (
    <Card testId={testId} style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 8, lineHeight: 1.1 }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: T.faint, marginTop: 6 }}>{hint}</div> : null}
    </Card>
  );
};

export const KpiGrid: React.FC<{ children: React.ReactNode; min?: number }> = ({ children, min = 190 }) => (
  <div style={{ display: "grid", gap: 14, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}>{children}</div>
);

export const ChartCard: React.FC<{ title: string; sub?: string; children: React.ReactNode; height?: number; testId?: string }> = ({ title, sub, children, height = 280, testId }) => (
  <Card testId={testId}>
    <SectionTitle sub={sub}>{title}</SectionTitle>
    <div style={{ width: "100%", height }}>{children}</div>
  </Card>
);

export const StateBlock: React.FC<{ kind: "loading" | "empty" | "error" | "not-collected"; message?: string; onRetry?: () => void; height?: number }> = ({ kind, message, onRetry, height = 120 }) => {
  if (kind === "loading") {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 14, borderRadius: 8, background: "linear-gradient(90deg,#EEF2F7,#F7FAFC,#EEF2F7)", backgroundSize: "200% 100%", animation: "statShimmer 1.2s ease-in-out infinite" }} />
        ))}
        <style>{`@keyframes statShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }
  const palette = kind === "error" ? T.bad : kind === "not-collected" ? T.warn : T.faint;
  const label = kind === "error" ? "Ошибка загрузки" : kind === "not-collected" ? "Данные пока не собираются" : "Нет данных за период";
  return (
    <div style={{ minHeight: height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: palette, textAlign: "center", padding: 16 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{label}</div>
      {message ? <div style={{ fontSize: 12.5, color: T.sub, maxWidth: 420 }}>{message}</div> : null}
      {kind === "error" && onRetry ? (
        <button onClick={onRetry} style={{ marginTop: 4, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.soft, cursor: "pointer", fontSize: 12.5, color: T.ink }}>
          Повторить
        </button>
      ) : null}
    </div>
  );
};

export interface Column<R> {
  key: string;
  header: string;
  render?: (row: R) => React.ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
}

export function SimpleTable<R extends Record<string, any>>({ columns, rows, empty, onRowClick, testId }: { columns: Column<R>[]; rows: R[]; empty?: string; onRowClick?: (r: R) => void; testId?: string }) {
  if (!rows || rows.length === 0) return <StateBlock kind="empty" message={empty} />;
  return (
    <div style={{ overflowX: "auto" }} data-testid={testId}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align || "left", padding: "10px 12px", color: T.sub, fontWeight: 600, fontSize: 11.5, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              style={{ cursor: onRowClick ? "pointer" : "default", transition: "background 150ms ease" }}
              onMouseEnter={(e) => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = T.soft; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align || "left", padding: "10px 12px", color: T.ink, borderBottom: `1px solid ${T.soft}`, whiteSpace: "nowrap", width: c.width }}>
                  {c.render ? c.render(r) : (r as any)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Badge: React.FC<{ children: React.ReactNode; tone?: "default" | "good" | "warn" | "bad" | "info" }> = ({ children, tone = "default" }) => {
  const map: Record<string, [string, string]> = {
    default: [T.soft, T.sub],
    good: ["#E7F6F3", T.good],
    warn: ["#FEF3E2", T.warn],
    bad: ["#FDECEC", T.bad],
    info: ["#EEF2FF", T.accent],
  };
  const [bg, fg] = map[tone] || map.default;
  return <span style={{ background: bg, color: fg, padding: "2px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>{children}</span>;
};

/** Small async fetch hook with loading/error/refetch. */
export function useAsync<T>(fn: () => Promise<T>, deps: any[]): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e?.message || "Ошибка"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => run(), [run]);
  return { data, loading, error, refetch: run };
}

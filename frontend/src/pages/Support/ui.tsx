import React from 'react';
import { T } from '../Statistics/ui';

export { T };

export const fmtDate = (d: any): string => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
};

export const shortWallet = (w?: string) => (!w ? '' : (w.length > 12 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w));

export const card: React.CSSProperties = { background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' };
export const th: React.CSSProperties = { textAlign: 'left', padding: '12px 14px', fontSize: 11.5, fontWeight: 800, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${T.border}`, background: T.soft, whiteSpace: 'nowrap' };
export const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13.5, color: T.ink, borderBottom: `1px solid ${T.border}`, verticalAlign: 'top' };

export const toneColors: Record<string, { bg: string; fg: string }> = {
  good: { bg: '#E7F6F3', fg: T.good },
  bad: { bg: '#FDECEC', fg: T.bad },
  warn: { bg: '#FEF3E2', fg: T.warn },
  info: { bg: '#EAEBFB', fg: T.accent },
  default: { bg: T.soft, fg: T.sub },
};

export const Badge: React.FC<{ tone?: string; children: React.ReactNode }> = ({ tone = 'default', children }) => {
  const c = toneColors[tone] || toneColors.default;
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: c.bg, color: c.fg, whiteSpace: 'nowrap' }}>{children}</span>;
};

export const Avatar: React.FC<{ user?: any; size?: number }> = ({ user, size = 28 }) => {
  const name = user?.username || 'User';
  const initial = (name || 'U').slice(0, 1).toUpperCase();
  return user?.photo
    ? <img src={user.photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />
    : <span style={{ width: size, height: size, borderRadius: '50%', background: '#EAEBFB', color: T.accent, fontWeight: 800, fontSize: size * 0.42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{initial}</span>;
};

export const UserCell: React.FC<{ user?: any }> = ({ user }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <Avatar user={user} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{user?.username || 'Неизвестно'}</div>
      {user?.wallet ? <div style={{ fontSize: 11.5, color: T.faint }}>{shortWallet(user.wallet)}</div> : null}
    </div>
  </div>
);

export const Loader: React.FC = () => <div style={{ padding: 40, textAlign: 'center', color: T.sub, fontSize: 14 }}>Загрузка…</div>;
export const Empty: React.FC<{ text?: string }> = ({ text }) => <div style={{ padding: 48, textAlign: 'center', color: T.faint, fontSize: 14 }}>{text || 'Пока ничего нет.'}</div>;

export const DrawerShell: React.FC<{ title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, onClose, children, footer }) => (
  <div style={{ width: 'min(560px, 100vw)', background: T.pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 30px rgba(15,23,42,0.12)' }} onMouseDown={(e) => e.stopPropagation()}>
    <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, background: T.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, zIndex: 2 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{title}</div>
      <button data-testid="drawer-close" onClick={onClose} style={{ border: 'none', background: T.soft, width: 32, height: 32, borderRadius: 9, cursor: 'pointer', color: T.sub, fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
    <div style={{ padding: 22, flex: 1, overflowY: 'auto' }}>{children}</div>
    {footer ? <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, background: T.cardBg, position: 'sticky', bottom: 0 }}>{footer}</div> : null}
  </div>
);

export const InfoRow: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13.5 }}>
    <div style={{ width: 130, flex: 'none', color: T.sub, fontWeight: 600 }}>{k}</div>
    <div style={{ color: T.ink, wordBreak: 'break-word', minWidth: 0 }}>{children}</div>
  </div>
);

export const SectionCard: React.FC<{ title?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, children, style }) => (
  <div style={{ ...card, padding: 16, marginBottom: 16, ...style }}>
    {title ? <div style={{ fontSize: 12.5, fontWeight: 800, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>{title}</div> : null}
    {children}
  </div>
);

/* ── Customer 360: unified trust footprint for one user ── */
const Stat: React.FC<{ label: string; value: any; tone?: string }> = ({ label, value, tone }) => (
  <div style={{ flex: '1 1 90px', minWidth: 80, background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
    <div style={{ fontSize: 10.5, fontWeight: 800, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: tone || T.ink, marginTop: 4 }}>{value}</div>
  </div>
);

export const Customer360: React.FC<{ userId?: string; loader: (id: string) => Promise<any> }> = ({ userId, loader }) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    loader(userId).then((r: any) => { if (alive) { setData(r?.data || r || null); setLoading(false); } }).catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [userId]);

  if (!userId) return <div style={{ fontSize: 13, color: T.faint }}>Пользователь не привязан (гость).</div>;
  if (loading) return <div style={{ fontSize: 13, color: T.sub }}>Загрузка профиля доверия…</div>;
  if (!data) return <div style={{ fontSize: 13, color: T.faint }}>Нет данных.</div>;
  const s = data.support || {}, rp = data.reports || {}, dp = data.disputes || {}, md = data.moderation || {};
  return (
    <div data-testid="customer-360" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Поддержка</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Stat label="Открытые" value={s.open ?? 0} tone={T.warn} />
          <Stat label="Закрытые" value={s.closed ?? 0} tone={T.good} />
        </div>
        {s.lastTicket ? <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>Последний тикет: <b>{s.lastTicket.ticketNumber}</b> — {s.lastTicket.subject}</div> : null}
      </div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Жалобы</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Stat label="Подано" value={rp.filed ?? 0} />
          <Stat label="Получено" value={rp.received ?? 0} tone={T.bad} />
          <Stat label="Подтв." value={rp.confirmed ?? 0} tone={T.good} />
          <Stat label="Откл." value={rp.rejected ?? 0} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Торговые споры</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Stat label="Всего" value={dp.filed ?? 0} />
          <Stat label="Открытые" value={dp.open ?? 0} tone={T.warn} />
          <Stat label="Решённые" value={dp.resolved ?? 0} tone={T.good} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Модерация</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Stat label="Открытые" value={md.openCases ?? 0} tone={T.warn} />
          <Stat label="Всего кейсов" value={md.totalCases ?? 0} />
        </div>
      </div>
    </div>
  );
};

/* ── SLA helper: computes remaining/overdue label from a due date ── */
export const SlaBadge: React.FC<{ dueAt?: string | null; label: string }> = ({ dueAt, label }) => {
  if (!dueAt) return <Badge tone="default">{label}: не задан</Badge>;
  const ms = new Date(dueAt).getTime() - Date.now();
  const overdue = ms < 0;
  const hrs = Math.round(Math.abs(ms) / 36e5);
  const txt = overdue ? `просрочено на ${hrs}ч` : hrs <= 4 ? `осталось ${hrs}ч` : `осталось ${hrs}ч`;
  return <Badge tone={overdue ? 'bad' : hrs <= 4 ? 'warn' : 'good'}>{label}: {txt}</Badge>;
};

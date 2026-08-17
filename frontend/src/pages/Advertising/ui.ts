import React from 'react';
import { T } from '../Statistics/ui';

export const primaryBtn: React.CSSProperties = { padding: '10px 16px', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', whiteSpace: 'nowrap' };
export const ghostBtn: React.CSSProperties = { ...primaryBtn, background: '#fff', color: T.ink, border: `1px solid ${T.border}` };
export const dangerBtn: React.CSSProperties = { ...primaryBtn, background: T.bad };
export const field: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' };
export const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 6, display: 'block' };

export const money = (v: number) => `$${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
export const num = (v: number) => Number(v || 0).toLocaleString();

export const statusMeta: Record<string, { label: string; tone: 'good' | 'bad' | 'warn' | 'info' | 'default' }> = {
  draft: { label: 'Черновик', tone: 'default' },
  scheduled: { label: 'Запланирована', tone: 'info' },
  active: { label: 'Активна', tone: 'good' },
  paused: { label: 'На паузе', tone: 'warn' },
  completed: { label: 'Завершена', tone: 'default' },
  cancelled: { label: 'Отменена', tone: 'bad' },
};
export const pricingLabel: Record<string, string> = { cpm: 'CPM', cpc: 'CPC', fixed: 'Fixed / Sponsorship' };

export const Overlay: React.FC<{ onClose: () => void; children: React.ReactNode; align?: 'center' | 'right' }> = ({ onClose, children, align = 'center' }) => (
  React.createElement('div', {
    onMouseDown: (e: any) => { if (e.target === e.currentTarget) onClose(); },
    style: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 1000, display: 'flex', justifyContent: align === 'right' ? 'flex-end' : 'center', alignItems: align === 'right' ? 'stretch' : 'flex-start', padding: align === 'right' ? 0 : 24, overflowY: 'auto' },
  }, children)
);

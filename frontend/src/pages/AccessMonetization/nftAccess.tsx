import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { T } from '../Statistics/ui';
import { AdminSelect } from '../AdminRating/AdminControls';
import * as api from './service';
import { card, label, hint, th, td, input, btn } from './parts';

const badge = (bg: string, color: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: bg, color });
const keySmall: React.CSSProperties = { fontSize: 11, color: T.sub, fontFamily: 'monospace' };
const fmt = (v?: string | null) => (v ? new Date(v).toLocaleDateString('ru-RU') : '—');
const remaining = (v?: string) => { if (!v) return '—'; const d = Math.ceil((+new Date(v) - Date.now()) / 86400000); return d > 0 ? `${d} дн.` : 'истёк'; };
const actBadge = (s: string) => { const m: any = { ACTIVE: ['#D1FAE5', '#059669'], EXPIRED: ['#F1F5F9', '#64748B'], REVOKED: ['#FEE2E2', '#DC2626'] }; const c = m[s] || ['#F1F5F9', '#64748B']; return <span style={badge(c[0], c[1])}>{s}</span>; };

const SUBTABS = [
  { key: 'collections', label: 'Коллекции' },
  { key: 'activations', label: 'Активированные' },
  { key: 'transfers', label: 'Передачи' },
  { key: 'expired', label: 'Истёкшие' },
  { key: 'diagnostics', label: 'Диагностика' },
];

const emptyRule = { name: '', chainId: '1', contractAddress: '', enabled: true, benefitType: 'FOMO_AI_MEMBERSHIP', durationDays: 30, activationMode: 'MANUAL', transferableDuringActivePeriod: true, reactivateAfterExpiry: false, maxActivationsPerToken: 1, startsAt: null, endsAt: null };

/* ---------- Коллекции / Правила ---------- */
const Collections: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [acts, setActs] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const load = useCallback(() => {
    api.nftRules().then(setRules).catch(() => toast.error('Ошибка загрузки правил'));
    api.nftActivations().then(setActs).catch(() => undefined);
  }, []);
  useEffect(() => { load(); }, [load]);
  const stats = (r: any) => {
    const mine = acts.filter((a) => a.chainId === r.chainId && String(a.contractAddress).toLowerCase() === String(r.contractAddress).toLowerCase());
    return { total: mine.length, active: mine.filter((a) => a.status === 'ACTIVE').length, expired: mine.filter((a) => a.status === 'EXPIRED').length };
  };
  const save = async () => {
    try {
      if (edit._id) await api.nftUpdateRule(edit._id, edit); else await api.nftCreateRule(edit);
      toast.success('Правило сохранено'); setEdit(null); load();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ ...hint, marginTop: 0 }}>Управление <b>временным access-benefit</b> NFT. Это НЕ Market / mint / staking / Launchpad — только выдача временного доступа к FOMO AI.</div>
        <button style={btn('primary')} data-testid="nft-rule-new" onClick={() => setEdit({ ...emptyRule })}>+ Коллекция</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead><tr><th style={th}>Название</th><th style={th}>Сеть</th><th style={th}>Contract</th><th style={th}>Benefit</th><th style={th}>Активаций/токен</th><th style={th}>Активно / Истекло</th><th style={th}>Статус</th><th style={th}></th></tr></thead>
          <tbody>
            {rules.length === 0 ? <tr><td style={{ ...td, color: T.sub }} colSpan={8}>Правил пока нет.</td></tr> : rules.map((r) => { const s = stats(r); return (
              <tr key={r._id} data-testid={`nft-rule-${r._id}`}>
                <td style={td}><div style={{ fontWeight: 700 }}>{r.name}</div><div style={keySmall}>{r.durationDays} дн. benefit</div></td>
                <td style={td}>chain {r.chainId}</td>
                <td style={td}><span style={keySmall}>{String(r.contractAddress).slice(0, 10)}…</span></td>
                <td style={td}>{r.benefitType}</td>
                <td style={td}>{r.maxActivationsPerToken}{r.reactivateAfterExpiry ? ' · reactivatable' : ''}{r.transferableDuringActivePeriod ? ' · transferable' : ''}</td>
                <td style={td}>{s.active} / {s.expired} <span style={{ color: T.sub }}>(всего {s.total})</span></td>
                <td style={td}>{r.enabled ? <span style={badge('#D1FAE5', '#059669')}>активна</span> : <span style={badge('#FEE2E2', '#DC2626')}>выкл</span>}</td>
                <td style={td}><button style={btn('ghost')} data-testid={`nft-rule-edit-${r._id}`} onClick={() => setEdit({ ...r })}>Редактировать</button></td>
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
      {edit ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }} onClick={() => setEdit(null)}>
          <div style={{ width: 460, maxWidth: '92vw', background: '#fff', height: '100%', padding: 24, overflowY: 'auto' }} onClick={(e) => e.stopPropagation()} data-testid="nft-rule-editor">
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{edit._id ? 'Коллекция' : 'Новая коллекция'}</div>
            <label style={{ ...label, marginTop: 14 }}>Публичное название</label>
            <input style={input} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} data-testid="nft-rule-name" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 10 }}>
              <div><label style={label}>Chain ID</label><input style={input} value={edit.chainId} onChange={(e) => setEdit({ ...edit, chainId: e.target.value })} /></div>
              <div><label style={label}>Contract address</label><input style={input} value={edit.contractAddress} onChange={(e) => setEdit({ ...edit, contractAddress: e.target.value })} data-testid="nft-rule-contract" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <div><label style={label}>Длительность (дней)</label><input style={input} type="number" value={edit.durationDays} onChange={(e) => setEdit({ ...edit, durationDays: Number(e.target.value) })} /></div>
              <div><label style={label}>Макс. активаций/токен</label><input style={input} type="number" value={edit.maxActivationsPerToken} onChange={(e) => setEdit({ ...edit, maxActivationsPerToken: Number(e.target.value) })} /></div>
            </div>
            <label style={{ ...label, marginTop: 10 }}>Режим активации</label>
            <AdminSelect value={edit.activationMode} onChange={(v: string) => setEdit({ ...edit, activationMode: v })} options={[{ value: 'MANUAL', label: 'Вручную (пользователь)' }, { value: 'AUTO', label: 'Автоматически' }]} testid="nft-rule-mode" />
            <label style={{ ...label, marginTop: 10 }}>Benefit продукт</label>
            <input style={input} value={edit.benefitType} onChange={(e) => setEdit({ ...edit, benefitType: e.target.value })} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              <label style={{ fontSize: 13, color: T.ink, display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={edit.enabled} onChange={(e) => setEdit({ ...edit, enabled: e.target.checked })} data-testid="nft-rule-enabled" /> Акция активна (enabled)</label>
              <label style={{ fontSize: 13, color: T.ink, display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={edit.transferableDuringActivePeriod} onChange={(e) => setEdit({ ...edit, transferableDuringActivePeriod: e.target.checked })} /> Передавать остаток доступа при перепродаже</label>
              <label style={{ fontSize: 13, color: T.ink, display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={edit.reactivateAfterExpiry} onChange={(e) => setEdit({ ...edit, reactivateAfterExpiry: e.target.checked })} /> Разрешить повторную активацию после истечения</label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button style={btn('primary')} data-testid="nft-rule-save" onClick={save}>Сохранить</button>
              <button style={btn('ghost')} onClick={() => setEdit(null)}>Отмена</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ---------- Активированные ---------- */
const Activations: React.FC<{ status?: string; expiredView?: boolean }> = ({ status, expiredView }) => {
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(() => api.nftActivations(status ? `?status=${status}` : '').then(setRows).catch(() => undefined), [status]);
  useEffect(() => { load(); }, [load]);
  const revoke = async (id: string) => { if (!window.confirm('Отозвать доступ по этой активации?')) return; try { await api.nftRevokeActivation(id, 'admin'); toast.success('Отозвано'); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <div>
      {expiredView ? (
        <div style={{ padding: 12, borderRadius: 10, background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          Доступ по NFT истёк. <b>NFT остаётся активом</b> — Launchpad / SpacePort / Market работают независимо.
        </div>
      ) : (
        <div style={{ ...hint, marginTop: 0, marginBottom: 10 }}>Активированные NFT-access-pass. Benefit принадлежит токену+активации, а не первому владельцу.</div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
          <thead><tr><th style={th}>Token ID</th><th style={th}>Пользователь</th><th style={th}>Wallet</th><th style={th}>Активирован</th><th style={th}>Истекает</th><th style={th}>Осталось</th><th style={th}>Статус</th><th style={th}></th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td style={{ ...td, color: T.sub }} colSpan={8}>Записей нет.</td></tr> : rows.map((a) => (
              <tr key={a._id} data-testid={`nft-activation-${a._id}`}>
                <td style={td}><b>#{a.tokenId}</b><div style={keySmall}>chain {a.chainId}</div></td>
                <td style={td}>{a.currentOwnerUserId ? String(a.currentOwnerUserId).slice(-8) : <span style={{ color: T.sub }}>не привязан</span>}</td>
                <td style={td}><span style={keySmall}>{a.currentOwnerWallet}</span></td>
                <td style={td}>{fmt(a.activatedAt)}</td>
                <td style={td}>{fmt(a.accessEndsAt)}</td>
                <td style={td}>{a.status === 'ACTIVE' ? remaining(a.accessEndsAt) : '—'}</td>
                <td style={td}>{actBadge(a.status)}</td>
                <td style={td}>{a.status === 'ACTIVE' ? <button style={btn('danger')} onClick={() => revoke(a._id)}>Отозвать</button> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Передачи ---------- */
const Transfers: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.nftTransfers().then(setRows).catch(() => undefined); }, []);
  return (
    <div>
      <div style={{ ...hint, marginTop: 0, marginBottom: 10 }}>История передач: при перепродаже NFT остаток срока следует за токеном к новому владельцу.</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead><tr><th style={th}>NFT</th><th style={th}>От</th><th style={th}>К</th><th style={th}>Дата</th><th style={th}>Осталось</th><th style={th}>Результат</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td style={{ ...td, color: T.sub }} colSpan={6}>Передач пока нет.</td></tr> : rows.map((r, i) => (
              <tr key={i}>
                <td style={td}>#{r.tokenId}</td>
                <td style={td}>{r.fromUser ? String(r.fromUser).slice(-8) : '—'}</td>
                <td style={td}>{r.toUser ? String(r.toUser).slice(-8) : <span style={{ color: T.sub }}>не привязан</span>}</td>
                <td style={td}>{fmt(r.at)}</td>
                <td style={td}>{r.remainingDays != null ? `${r.remainingDays} дн.` : '—'}</td>
                <td style={td}><span style={badge('#DBEAFE', '#1D4ED8')}>{r.type?.replace('NFT_ACCESS_', '').replace('NFT_', '')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Диагностика ---------- */
const row = (k: string, v: React.ReactNode) => (<div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}><span style={{ fontSize: 12.5, color: T.sub }}>{k}</span><span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{v}</span></div>);
const Diagnostics: React.FC = () => {
  const [f, setF] = useState({ wallet: '', chainId: '1', contract: '', tokenId: '' });
  const [d, setD] = useState<any>(null);
  const run = async () => { try { setD(await api.nftDiagnostics(f)); } catch (e: any) { toast.error(e.message); } };
  return (
    <div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Диагностика NFT-доступа</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div><label style={label}>Wallet</label><input style={input} value={f.wallet} onChange={(e) => setF({ ...f, wallet: e.target.value })} data-testid="nft-diag-wallet" /></div>
          <div><label style={label}>Chain</label><input style={input} value={f.chainId} onChange={(e) => setF({ ...f, chainId: e.target.value })} /></div>
          <div><label style={label}>Contract</label><input style={input} value={f.contract} onChange={(e) => setF({ ...f, contract: e.target.value })} data-testid="nft-diag-contract" /></div>
          <div><label style={label}>Token ID</label><input style={input} value={f.tokenId} onChange={(e) => setF({ ...f, tokenId: e.target.value })} data-testid="nft-diag-token" /></div>
          <button style={btn('primary')} data-testid="nft-diag-run" onClick={run}>Проверить</button>
        </div>
      </div>
      {d ? (
        <div style={card} data-testid="nft-diag-result">
          {row('Ownership', d.ownerMatches === true ? <span style={badge('#D1FAE5', '#059669')}>YES</span> : d.ownerMatches === false ? <span style={badge('#FEE2E2', '#DC2626')}>NO</span> : '—')}
          {row('Collection eligible', d.collectionEligible ? <span style={badge('#D1FAE5', '#059669')}>YES</span> : <span style={badge('#F1F5F9', '#64748B')}>NO</span>)}
          {row('Activation', d.activation ? <span style={badge('#DBEAFE', '#1D4ED8')}>USED</span> : 'нет')}
          {d.activation ? row('Benefit status', actBadge(d.activation.status)) : null}
          {d.activation ? row('Активирован', fmt(d.activation.activatedAt)) : null}
          {d.activation ? row('Истекает', fmt(d.activation.accessEndsAt)) : null}
          {d.activation ? row('Осталось', `${d.activation.remainingDays} дн.`) : null}
          {row('FOMO AI membership', d.premiumAccess === 'ALLOW' ? <span style={badge('#D1FAE5', '#059669')}>ALLOW</span> : <span style={badge('#FEE2E2', '#DC2626')}>DENY</span>)}
          {row('Launchpad NFT utility', <span style={{ color: T.sub }}>independent</span>)}
          {row('SpacePort utility', <span style={{ color: T.sub }}>independent</span>)}
        </div>
      ) : null}
    </div>
  );
};

export const NftAccessCenter: React.FC = () => {
  const [sub, setSub] = useState('collections');
  return (
    <div data-testid="nft-access-center">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {SUBTABS.map((s) => (
          <button key={s.key} data-testid={`nft-subtab-${s.key}`} onClick={() => setSub(s.key)}
            style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${sub === s.key ? T.accent : T.border}`, background: sub === s.key ? '#EEF2FF' : '#fff', color: sub === s.key ? T.accent : T.sub, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{s.label}</button>
        ))}
      </div>
      {sub === 'collections' && <Collections />}
      {sub === 'activations' && <Activations status="ACTIVE" />}
      {sub === 'transfers' && <Transfers />}
      {sub === 'expired' && <Activations status="EXPIRED" expiredView />}
      {sub === 'diagnostics' && <Diagnostics />}
    </div>
  );
};

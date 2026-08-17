import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { trust } from '../../components/services/support';
import OptionSelect from '../Advertising/OptionSelect';
import { primaryBtn, dangerBtn, field, label as labelStyle, Overlay } from '../Advertising/ui';
import { T, card, th, td, Badge, UserCell, Loader, Empty, fmtDate, DrawerShell, InfoRow, SectionCard, Customer360 } from './ui';

const TARGET_OPTS = ['all', 'USER', 'COMMENT', 'MESSAGE', 'CONTENT', 'PROJECT', 'PORTFOLIO', 'OTC_LISTING', 'P2P_LISTING', 'OTHER'].map((v) => ({ value: v, label: v === 'all' ? 'Все объекты' : v }));
const statusTone: Record<string, string> = { new: 'warn', open: 'warn', reviewing: 'info', resolved: 'good', rejected: 'default' };
const statusLabel: Record<string, string> = { new: 'Новая', open: 'Открыта', reviewing: 'На рассмотрении', resolved: 'Подтверждена', rejected: 'Отклонена' };

const TrustReportsTab: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetType, setTargetType] = useState('all');
  const [active, setActive] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => { setLoading(true); const r = await trust.reports({ targetType: targetType === 'all' ? undefined : targetType }); setItems(r.data?.data || r.data || []); setLoading(false); };
  useEffect(() => { load(); }, [targetType]);

  const open = (r: any) => { setActive(r); setResolution(r.resolution || ''); };
  const decide = async (status: string) => {
    if (!active) return; setBusy(true);
    const r = await trust.updateReport(active._id, { status, resolution });
    setBusy(false);
    if (r.success) { toast.success(status === 'resolved' ? 'Жалоба подтверждена' : 'Жалоба отклонена'); setActive(null); load(); } else toast.error('Ошибка');
  };
  const snap = active?.targetSnapshot || {};

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ width: 220 }}><OptionSelect label="Тип объекта" value={targetType} onChange={setTargetType} testid="reports-target" options={TARGET_OPTS} /></div>
        <div style={{ fontSize: 13, color: T.sub, paddingBottom: 10 }}>{items.length} жалоб</div>
      </div>
      {loading ? <Loader /> : items.length === 0 ? <Empty text="Жалобы не найдены." /> : (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }} data-testid="reports-table">
            <thead><tr><th style={th}>Дата</th><th style={th}>Жалобщик</th><th style={th}>Объект</th><th style={th}>Тип</th><th style={th}>Причина</th><th style={th}>Приоритет</th><th style={th}>Статус</th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} onClick={() => open(r)} data-testid={`report-row-${r._id}`} style={{ cursor: 'pointer' }}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: T.sub }}>{fmtDate(r.createdAt)}</td>
                  <td style={td}><UserCell user={r.reporter} /></td>
                  <td style={{ ...td, maxWidth: 220, color: T.sub }}>{r.targetSnapshot?.username || r.targetSnapshot?.author || r.targetId || '—'}</td>
                  <td style={td}><Badge tone="default">{r.targetType}</Badge></td>
                  <td style={{ ...td }}>{r.reasonCode || '—'}</td>
                  <td style={td}><Badge tone={r.priority === 'urgent' ? 'bad' : r.priority === 'high' ? 'warn' : 'info'}>{r.priority}</Badge></td>
                  <td style={td}><Badge tone={statusTone[r.status]}>{statusLabel[r.status] || r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active ? (
        <Overlay onClose={() => setActive(null)} align="right">
          <DrawerShell title={<span>Жалоба · {active.targetType} <Badge tone={statusTone[active.status]}>{statusLabel[active.status]}</Badge></span>} onClose={() => setActive(null)}>
            <SectionCard title="Объект жалобы">
              {snap.text ? <div style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, fontSize: 14, color: T.ink, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{snap.text}</div> : null}
              {snap.username || snap.author ? <InfoRow k="Автор объекта">{snap.username || snap.author}</InfoRow> : null}
              {snap.page ? <InfoRow k="Страница"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{snap.page}</span></InfoRow> : null}
              {Array.isArray(snap.context) && snap.context.length ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 6 }}>Контекст переписки</div>
                  {snap.context.map((c: string, i: number) => <div key={i} style={{ fontSize: 13, color: T.sub, padding: '4px 8px', borderLeft: `2px solid ${T.border}` }}>{c}</div>)}
                </div>
              ) : null}
            </SectionCard>
            <SectionCard>
              <InfoRow k="Жалобщик">{active.reporter?.username || 'Аноним'}</InfoRow>
              <InfoRow k="Причина">{active.reasonCode || '—'}{active.subReason ? ` · ${active.subReason}` : ''}</InfoRow>
              {active.description ? <InfoRow k="Описание"><span style={{ whiteSpace: 'pre-wrap' }}>{active.description}</span></InfoRow> : null}
              {active.evidence?.length ? <InfoRow k="Доказательства">{active.evidence.map((u: string, i: number) => <a key={i} href={u} target="_blank" rel="noreferrer" style={{ color: T.accent, display: 'block' }}>Файл {i + 1} ↗</a>)}</InfoRow> : null}
            </SectionCard>
            <SectionCard title="Customer 360 · история доверия">
              <Customer360
                userId={active.targetType === 'USER' ? (active.targetId || active.reporter?._id) : active.reporter?._id}
                loader={(id) => trust.userSummary(id)}
              />
            </SectionCard>
            {active.status !== 'resolved' && active.status !== 'rejected' ? (
              <SectionCard title="Решение">
                <label style={labelStyle}>Комментарий модератора</label>
                <textarea data-testid="report-resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} placeholder="Итог рассмотрения…" style={{ ...field, resize: 'vertical', marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button data-testid="report-confirm" onClick={() => decide('resolved')} disabled={busy} style={primaryBtn}>Подтвердить нарушение</button>
                  <button data-testid="report-reject" onClick={() => decide('rejected')} disabled={busy} style={dangerBtn}>Отклонить</button>
                </div>
              </SectionCard>
            ) : (
              <SectionCard title="Решение"><div style={{ fontSize: 14, color: T.ink, whiteSpace: 'pre-wrap' }}>{active.resolution || '—'}</div></SectionCard>
            )}
          </DrawerShell>
        </Overlay>
      ) : null}
    </div>
  );
};

export default TrustReportsTab;

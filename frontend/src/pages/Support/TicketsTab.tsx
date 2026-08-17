import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { trust } from '../../components/services/support';
import OptionSelect from '../Advertising/OptionSelect';
import { primaryBtn, ghostBtn, field, label as labelStyle, Overlay } from '../Advertising/ui';
import { T, card, th, td, Badge, UserCell, Avatar, Loader, Empty, fmtDate, DrawerShell, InfoRow, SectionCard, Customer360, SlaBadge } from './ui';

const statusTone: Record<string, string> = { new: 'warn', open: 'warn', waiting_user: 'info', waiting_team: 'bad', resolved: 'good', closed: 'default', reopened: 'bad' };
const statusLabel: Record<string, string> = { new: 'Новый', open: 'Открыт', waiting_user: 'Ждём пользователя', waiting_team: 'Ждём команду', resolved: 'Решён', closed: 'Закрыт', reopened: 'Переоткрыт' };
const prioTone: Record<string, string> = { low: 'default', normal: 'info', high: 'warn', urgent: 'bad' };
const STATUS_OPTS = ['new', 'open', 'waiting_user', 'waiting_team', 'resolved', 'closed', 'reopened'].map((v) => ({ value: v, label: statusLabel[v] }));
const PRIO_OPTS = [['low', 'Низкий'], ['normal', 'Обычный'], ['high', 'Высокий'], ['urgent', 'Срочный']].map(([value, label]) => ({ value, label }));

const TicketsTab: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [active, setActive] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => { setLoading(true); const r = await trust.tickets({ status: status === 'all' ? undefined : status }); setItems(r.data?.data || r.data || []); setLoading(false); };
  useEffect(() => { load(); }, [status]);

  const open = async (t: any) => { setReply(''); setInternal(false); const r = await trust.ticket(t._id); setActive(r.success ? r.data : t); };
  const refresh = async (id: string) => { const r = await trust.ticket(id); if (r.success) setActive(r.data); load(); };

  const send = async () => {
    if (!active || !reply.trim()) return; setBusy(true);
    const r = await trust.ticketMessage(active._id, { body: reply.trim(), authorType: internal ? 'internal' : 'agent' });
    setBusy(false);
    if (r.success) { setReply(''); await refresh(active._id); } else toast.error('Не удалось отправить');
  };
  const setStatusOf = async (s: string) => { if (!active) return; const r = await trust.updateTicket(active._id, { status: s }); if (r.success) { toast.success('Статус обновлён'); await refresh(active._id); } };
  const setPrio = async (p: string) => { if (!active) return; const r = await trust.updateTicket(active._id, { priority: p }); if (r.success) await refresh(active._id); };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ width: 220 }}><OptionSelect label="Статус" value={status} onChange={setStatus} testid="tickets-status" options={[{ value: 'all', label: 'Все статусы' }, ...STATUS_OPTS]} /></div>
        <div style={{ fontSize: 13, color: T.sub, paddingBottom: 10 }}>{items.length} обращений</div>
      </div>
      {loading ? <Loader /> : items.length === 0 ? <Empty text="Обращения не найдены." /> : (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }} data-testid="tickets-table">
            <thead><tr><th style={th}>Тикет</th><th style={th}>Пользователь</th><th style={th}>Категория</th><th style={th}>Тема</th><th style={th}>Приоритет</th><th style={th}>Статус</th><th style={th}>Обновлён</th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t._id} onClick={() => open(t)} data-testid={`ticket-row-${t._id}`} style={{ cursor: 'pointer' }}>
                  <td style={{ ...td, fontWeight: 700, whiteSpace: 'nowrap' }}>{t.ticketNumber}</td>
                  <td style={td}><UserCell user={t.requester} /></td>
                  <td style={{ ...td, color: T.sub }}>{t.categoryCode || '—'}</td>
                  <td style={{ ...td, maxWidth: 220 }}>{t.subject || '—'}</td>
                  <td style={td}><Badge tone={prioTone[t.priority]}>{t.priority}</Badge></td>
                  <td style={td}><Badge tone={statusTone[t.status]}>{statusLabel[t.status] || t.status}</Badge></td>
                  <td style={{ ...td, color: T.sub, whiteSpace: 'nowrap' }}>{fmtDate(t.lastReplyAt || t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active ? (
        <Overlay onClose={() => setActive(null)} align="right">
          <DrawerShell title={<span>{active.ticketNumber} <Badge tone={statusTone[active.status]}>{statusLabel[active.status]}</Badge></span>} onClose={() => setActive(null)}>
            <SectionCard>
              <InfoRow k="Тема">{active.subject || '—'}</InfoRow>
              <InfoRow k="Категория">{active.categoryCode || '—'}{active.subcategoryCode ? ` / ${active.subcategoryCode}` : ''}</InfoRow>
              <InfoRow k="Пользователь">{active.requester?.username || 'Гость'}</InfoRow>
              {active.context && Object.keys(active.context).length ? <InfoRow k="Контекст"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{JSON.stringify(active.context)}</span></InfoRow> : null}
              {active.sla && (active.sla.firstResponseDueAt || active.sla.resolutionDueAt) ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 10 }}>
                  <SlaBadge dueAt={active.sla.firstResponseDueAt} label="Первый ответ" />
                  <SlaBadge dueAt={active.sla.resolutionDueAt} label="Решение" />
                </div>
              ) : null}
            </SectionCard>
            <SectionCard title="Customer 360 · история доверия">
              <Customer360 userId={active.requester?._id} loader={(id) => trust.userSummary(id)} />
            </SectionCard>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}><OptionSelect label="Статус" value={active.status} onChange={setStatusOf} testid="ticket-status" options={STATUS_OPTS} /></div>
              <div style={{ flex: 1, minWidth: 160 }}><OptionSelect label="Приоритет" value={active.priority} onChange={setPrio} testid="ticket-priority" options={PRIO_OPTS} /></div>
            </div>
            <SectionCard title="Диалог">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
                {(active.messages || []).map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <Avatar user={m.author} size={26} />
                    <div style={{ flex: 1, background: m.authorType === 'internal' ? '#FEF3E2' : m.authorType === 'agent' ? '#EAEBFB' : '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '7px 11px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                        <b style={{ fontSize: 12.5, color: m.authorType === 'agent' ? T.accent : T.ink }}>{m.author?.username || (m.authorType === 'user' ? 'Пользователь' : 'Агент')}</b>
                        {m.authorType === 'internal' ? <Badge tone="warn">внутренняя заметка</Badge> : m.authorType === 'agent' ? <Badge tone="info">агент</Badge> : null}
                        <span style={{ fontSize: 11, color: T.faint, marginLeft: 'auto' }}>{fmtDate(m.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 13.5, color: T.ink, whiteSpace: 'pre-wrap' }}>{m.body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: T.ink, margin: '12px 0 8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} data-testid="ticket-internal" /> Внутренняя заметка (пользователь не видит)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input data-testid="ticket-reply" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder={internal ? 'Внутренняя заметка…' : 'Ответ пользователю…'} style={{ ...field, flex: 1 }} />
                <button data-testid="ticket-send" onClick={send} disabled={busy || !reply.trim()} style={primaryBtn}>Отправить</button>
              </div>
            </SectionCard>
          </DrawerShell>
        </Overlay>
      ) : null}
    </div>
  );
};

export default TicketsTab;

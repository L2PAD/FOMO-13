import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  listAppeals, getDealForStaff, getChat, sendMessage, createAppealSupportChat, resolveAppeal, forceCompleteDeal,
  Appeal, AppealStatusFilter, ChatData, ChatMessage,
} from '../../components/services/support';
import OptionSelect from '../Advertising/OptionSelect';
import { primaryBtn, dangerBtn, field, label as labelStyle, Overlay } from '../Advertising/ui';
import { T, card, th, td, Badge, UserCell, Avatar, Loader, Empty, fmtDate, DrawerShell, InfoRow, SectionCard, shortWallet, Customer360 } from './ui';
import { trust } from '../../components/services/support';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'open', label: 'Открыта' },
  { value: 'in_review', label: 'На рассмотрении' },
  { value: 'resolved', label: 'Решена' },
];
const statusTone: Record<string, string> = { open: 'bad', in_review: 'warn', resolved: 'good' };
const statusLabel: Record<string, string> = { open: 'Открыта', in_review: 'На рассмотрении', resolved: 'Решена' };
const roleLabel: Record<string, string> = { buyer: 'покупатель', seller: 'продавец', creator: 'создатель' };

const ChatView: React.FC<{ chat: ChatData | null; testid: string }> = ({ chat, testid }) => {
  const users = useMemo(() => {
    const map: Record<string, any> = {};
    (chat?.participantsData || []).forEach((u: any) => { if (u?._id) map[String(u._id)] = u; });
    return map;
  }, [chat]);
  const msgs = (chat?.messages || []).slice().sort((a: ChatMessage, b: ChatMessage) =>
    new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime());
  return (
    <div data-testid={testid}>
      <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
        {msgs.length === 0 ? <div style={{ color: T.faint, fontSize: 13, padding: 8 }}>Сообщений пока нет.</div> : msgs.map((m) => {
          const u = users[String(m.from)];
          const isStaff = Array.isArray(u?.role) && (u.role.includes('admin') || u.role.includes('moderator'));
          return (
            <div key={m._id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Avatar user={u} size={26} />
              <div style={{ background: m.isSystem ? T.soft : (isStaff ? '#EAEBFB' : '#fff'), border: `1px solid ${T.border}`, borderRadius: 10, padding: '7px 11px', minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: isStaff ? T.accent : T.ink }}>{u?.username || (m.isSystem ? 'Система' : 'Пользователь')}</span>
                  {isStaff ? <Badge tone="info">поддержка</Badge> : null}
                  <span style={{ fontSize: 11, color: T.faint, marginLeft: 'auto' }}>{fmtDate(m.date || m.createdAt)}</span>
                </div>
                <div style={{ fontSize: 13.5, color: m.isSystem ? T.sub : T.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AppealsTab: React.FC = () => {
  const [status, setStatus] = useState<AppealStatusFilter>('all');
  const [items, setItems] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Appeal | null>(null);
  const [dealDetail, setDealDetail] = useState<any>(null);
  const [supportChat, setSupportChat] = useState<ChatData | null>(null);
  const [dealChat, setDealChat] = useState<ChatData | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [rf, setRf] = useState({ resolution: '', recipient: 'escrow_funder', feeMode: 'with_fee', txHash: '', forceCloseDeal: false });
  const pollRef = useRef<any>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    const r = await listAppeals(status, 50, 0);
    setItems(r.success ? (r.data?.appeals || []) : []);
    setLoading(false);
  }, [status]);

  useEffect(() => { loadList(); }, [loadList]);

  const loadChats = useCallback(async (appeal: Appeal, deal: any) => {
    if (appeal.supportChatId) {
      const c = await getChat(String(appeal.supportChatId));
      if (c.success) setSupportChat(c.data);
    } else { setSupportChat(null); }
    const dealChatId = deal?.chatId;
    if (dealChatId) {
      const dc = await getChat(String(dealChatId));
      if (dc.success) setDealChat(dc.data);
    } else { setDealChat(null); }
  }, []);

  const openAppeal = useCallback(async (appeal: Appeal) => {
    setActive(appeal); setDealDetail(null); setSupportChat(null); setDealChat(null); setMsg('');
    setRf({ resolution: '', recipient: 'escrow_funder', feeMode: 'with_fee', txHash: '', forceCloseDeal: false });
    const dealMongoId = appeal.deal?._id;
    let deal: any = appeal.deal;
    if (dealMongoId) {
      const d = await getDealForStaff(String(dealMongoId));
      if (d.success) { deal = { ...appeal.deal, ...d.data }; setDealDetail(d.data); }
    }
    await loadChats(appeal, deal);
  }, [loadChats]);

  // Живое обновление чата поддержки, пока открыта карточка спора.
  useEffect(() => {
    if (!active?.supportChatId) return;
    pollRef.current = setInterval(async () => {
      const c = await getChat(String(active.supportChatId));
      if (c.success) setSupportChat(c.data);
    }, 12000);
    return () => clearInterval(pollRef.current);
  }, [active?.supportChatId]);

  const refreshActive = useCallback(async (appealId: string) => {
    const r = await listAppeals(status, 50, 0);
    const list = r.success ? (r.data?.appeals || []) : [];
    setItems(list);
    const updated = list.find((a: Appeal) => a._id === appealId);
    if (updated) { setActive(updated); await loadChats(updated, dealDetail || updated.deal); }
  }, [status, loadChats, dealDetail]);

  const onCreateChat = async () => {
    if (!active) return;
    setBusy(true);
    const r = await createAppealSupportChat(active._id);
    setBusy(false);
    if (r.success) { toast.success('Чат поддержки создан — вы подключились к спору'); await refreshActive(active._id); }
    else { toast.error('Не удалось создать чат поддержки'); }
  };

  const onSend = async () => {
    if (!active?.supportChatId || !msg.trim()) return;
    const to = active.creator?._id;
    if (!to) { toast.error('Не найден инициатор апелляции'); return; }
    setBusy(true);
    const r = await sendMessage({ to: String(to), message: msg.trim(), chatId: String(active.supportChatId) });
    setBusy(false);
    if (r.success) { setMsg(''); const c = await getChat(String(active.supportChatId)); if (c.success) setSupportChat(c.data); }
    else { toast.error('Не удалось отправить сообщение'); }
  };

  const onResolve = async () => {
    if (!active) return;
    setBusy(true);
    const r = await resolveAppeal(active._id, {
      resolution: rf.resolution || undefined,
      forceCloseDeal: rf.forceCloseDeal,
      recipient: rf.recipient as 'escrow_funder' | 'buyer',
      feeMode: rf.feeMode as 'with_fee' | 'without_fee',
      txHash: rf.txHash || undefined,
    });
    setBusy(false);
    if (r.success) { toast.success('Апелляция решена'); await refreshActive(active._id); }
    else { toast.error('Не удалось решить апелляцию'); }
  };

  const onForceComplete = async () => {
    const dealId = dealDetail?._id || active?.deal?._id;
    if (!dealId) return;
    setBusy(true);
    const r = await forceCompleteDeal(String(dealId));
    setBusy(false);
    if (r.success) { toast.success('Сделка завершена принудительно'); if (active) await refreshActive(active._id); }
    else { toast.error('Не удалось завершить сделку'); }
  };

  const isResolved = active?.status === 'resolved';

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ width: 220 }}>
          <OptionSelect label="Статус" value={status} options={STATUS_OPTIONS} onChange={(v) => setStatus(v as AppealStatusFilter)} testid="appeals-status" />
        </div>
        <div style={{ fontSize: 13, color: T.sub, paddingBottom: 10 }}>{items.length} апелляций</div>
      </div>

      {loading ? <Loader /> : items.length === 0 ? <Empty text="Апелляции не найдены." /> : (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }} data-testid="appeals-table">
            <thead><tr><th style={th}>Создана</th><th style={th}>Сделка</th><th style={th}>Раздел</th><th style={th}>Инициатор</th><th style={th}>Причина</th><th style={th}>Статус</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id} onClick={() => openAppeal(a)} data-testid={`appeal-row-${a._id}`} style={{ cursor: 'pointer' }}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: T.sub }}>{fmtDate(a.createdAt)}</td>
                  <td style={{ ...td, fontWeight: 700 }}>#{a.deal?.dealId ?? '—'}</td>
                  <td style={td}><Badge tone="default">{(a.deal?.section || 'otc').toUpperCase()}</Badge></td>
                  <td style={td}><UserCell user={a.creator} /></td>
                  <td style={{ ...td, maxWidth: 260, color: T.sub }}><div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.reason || '—'}</div></td>
                  <td style={td}><Badge tone={statusTone[a.status] || 'default'}>{statusLabel[a.status] || a.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active ? (
        <Overlay onClose={() => setActive(null)} align="right">
          <DrawerShell
            title={<span>Апелляция <span style={{ color: T.accent }}>#{active.deal?.dealId ?? ''}</span> <Badge tone={statusTone[active.status]}>{statusLabel[active.status]}</Badge></span>}
            onClose={() => setActive(null)}
          >
            <SectionCard title="Спор">
              <InfoRow k="Создана">{fmtDate(active.createdAt)}</InfoRow>
              <InfoRow k="Инициатор">{active.creator?.username || 'Неизвестно'} ({roleLabel[active.role || 'creator'] || active.role})</InfoRow>
              <InfoRow k="Причина">{active.reason || '—'}</InfoRow>
              {active.description ? <InfoRow k="Описание"><span style={{ whiteSpace: 'pre-wrap' }}>{active.description}</span></InfoRow> : null}
              {active.email ? <InfoRow k="Контакт">{active.email}</InfoRow> : null}
              {active.assignedTo?.username ? <InfoRow k="Назначено">{active.assignedTo.username}</InfoRow> : null}
              {active.attachments && active.attachments.length ? (
                <InfoRow k="Вложения">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {active.attachments.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer" style={{ color: T.accent, fontWeight: 700 }}>Файл {i + 1} ↗</a>)}
                  </div>
                </InfoRow>
              ) : null}
              {isResolved ? (<>
                <InfoRow k="Решение"><span style={{ whiteSpace: 'pre-wrap' }}>{active.resolution || '—'}</span></InfoRow>
                {active.txHash ? <InfoRow k="Tx hash"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{shortWallet(active.txHash)}</span></InfoRow> : null}
                {active.resolvedAt ? <InfoRow k="Решена">{fmtDate(active.resolvedAt)}</InfoRow> : null}
              </>) : null}
            </SectionCard>

            <SectionCard title="Сделка и участники">
              <InfoRow k="Сделка">#{active.deal?.dealId ?? '—'} · {(active.deal?.section || 'otc').toUpperCase()} · {active.deal?.type || '—'}</InfoRow>
              <InfoRow k="Статус сделки"><Badge tone={active.deal?.status === 'forced-termination' ? 'bad' : active.deal?.status === 'ended' ? 'good' : 'warn'}>{active.deal?.status || '—'}</Badge></InfoRow>
              {(active.deal?.amount || active.deal?.price) ? <InfoRow k="Кол-во / Цена">{active.deal?.amount ?? '—'} {String(active.deal?.ticker || '').toUpperCase()} @ {active.deal?.price ?? '—'}</InfoRow> : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {active.deal?.creator?._id ? <div><div style={{ fontSize: 11.5, color: T.faint, marginBottom: 4 }}>Создатель сделки</div><UserCell user={active.deal.creator} /></div> : null}
                {active.deal?.buyer?._id ? <div><div style={{ fontSize: 11.5, color: T.faint, marginBottom: 4 }}>Покупатель</div><UserCell user={active.deal.buyer} /></div> : null}
                {active.deal?.seller?._id ? <div><div style={{ fontSize: 11.5, color: T.faint, marginBottom: 4 }}>Продавец</div><UserCell user={active.deal.seller} /></div> : null}
              </div>
            </SectionCard>

            <SectionCard title="Customer 360 · инициатор спора">
              <Customer360 userId={active.creator?._id} loader={(id) => trust.userSummary(id)} />
            </SectionCard>

            <SectionCard title="Чат поддержки (вмешательство модератора)">
              {active.supportChatId ? (
                <>
                  <ChatView chat={supportChat} testid="appeal-support-chat" />
                  {!isResolved ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <input data-testid="appeal-chat-input" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }} placeholder="Написать обеим сторонам как модератор…" style={{ ...field, flex: 1 }} />
                      <button data-testid="appeal-chat-send" onClick={onSend} disabled={busy || !msg.trim()} style={primaryBtn}>Отправить</button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div>
                  <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 12 }}>Чата поддержки ещё нет. Создайте его, чтобы подключиться к обеим сторонам и начать медиацию.</div>
                  {!isResolved ? <button data-testid="appeal-create-chat" onClick={onCreateChat} disabled={busy} style={primaryBtn}>Создать чат поддержки и подключиться</button> : null}
                </div>
              )}
            </SectionCard>

            {dealChat ? (
              <SectionCard title="Чат сделки (только чтение)">
                <ChatView chat={dealChat} testid="appeal-deal-chat" />
              </SectionCard>
            ) : null}

            {!isResolved ? (
              <SectionCard title="Решение апелляции">
                <label style={labelStyle}>Комментарий к решению</label>
                <textarea data-testid="resolve-notes" value={rf.resolution} onChange={(e) => setRf({ ...rf, resolution: e.target.value })} rows={3} placeholder="Опишите итог и принятое решение…" style={{ ...field, resize: 'vertical', marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <OptionSelect label="Получатель средств" value={rf.recipient} onChange={(v) => setRf({ ...rf, recipient: v })} testid="resolve-recipient"
                      options={[{ value: 'escrow_funder', label: 'Эскроу-плательщик' }, { value: 'buyer', label: 'Покупатель' }]} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <OptionSelect label="Комиссия" value={rf.feeMode} onChange={(v) => setRf({ ...rf, feeMode: v })} testid="resolve-fee"
                      options={[{ value: 'with_fee', label: 'С комиссией' }, { value: 'without_fee', label: 'Без комиссии' }]} />
                  </div>
                </div>
                <label style={labelStyle}>Хеш транзакции (необязательно)</label>
                <input data-testid="resolve-txhash" value={rf.txHash} onChange={(e) => setRf({ ...rf, txHash: e.target.value })} placeholder="0x…" style={{ ...field, marginBottom: 12 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: T.ink, cursor: 'pointer', marginBottom: 16 }}>
                  <input type="checkbox" data-testid="resolve-force" checked={rf.forceCloseDeal} onChange={(e) => setRf({ ...rf, forceCloseDeal: e.target.checked })} />
                  Принудительно завершить сделку при решении
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button data-testid="resolve-submit" onClick={onResolve} disabled={busy} style={primaryBtn}>{busy ? 'Обработка…' : 'Решить апелляцию'}</button>
                  <button data-testid="force-complete" onClick={onForceComplete} disabled={busy} style={dangerBtn}>Завершить сделку принудительно</button>
                </div>
              </SectionCard>
            ) : null}
          </DrawerShell>
        </Overlay>
      ) : null}
    </div>
  );
};

export default AppealsTab;

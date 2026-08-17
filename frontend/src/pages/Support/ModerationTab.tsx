import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { trust } from '../../components/services/support';
import OptionSelect from '../Advertising/OptionSelect';
import { Overlay } from '../Advertising/ui';
import { T, card, th, td, Badge, UserCell, Loader, Empty, fmtDate, DrawerShell, InfoRow, SectionCard, Customer360 } from './ui';

const typeLabel: Record<string, string> = { suspicious_activity: 'Подозрительная активность', anti_farm: 'Анти-фарм', abuse: 'Злоупотребление', manual: 'Ручной' };
const statusTone: Record<string, string> = { open: 'warn', reviewing: 'info', actioned: 'good', dismissed: 'default' };
const statusLabel: Record<string, string> = { open: 'Открыт', reviewing: 'На рассмотрении', actioned: 'Действие принято', dismissed: 'Отклонён' };
const ST_OPTS = ['open', 'reviewing', 'actioned', 'dismissed'].map((v) => ({ value: v, label: statusLabel[v] }));
const SEV_OPTS = [['low', 'Низкая'], ['normal', 'Обычная'], ['high', 'Высокая'], ['critical', 'Критическая']].map(([value, label]) => ({ value, label }));

const ModerationTab: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [active, setActive] = useState<any>(null);

  const load = async () => { setLoading(true); const r = await trust.cases({ status: status === 'all' ? undefined : status }); setItems(r.data?.data || r.data || []); setLoading(false); };
  useEffect(() => { load(); }, [status]);
  const upd = async (patch: any) => { if (!active) return; const r = await trust.updateCase(active._id, patch); if (r.success) { toast.success('Обновлено'); setActive({ ...active, ...patch }); load(); } };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ width: 220 }}><OptionSelect label="Статус" value={status} onChange={setStatus} testid="mod-status" options={[{ value: 'all', label: 'Все статусы' }, ...ST_OPTS]} /></div>
        <div style={{ fontSize: 13, color: T.sub, paddingBottom: 10 }}>{items.length} кейсов</div>
      </div>
      {loading ? <Loader /> : items.length === 0 ? <Empty text="Кейсов модерации нет." /> : (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }} data-testid="moderation-table">
            <thead><tr><th style={th}>Кейс</th><th style={th}>Тип</th><th style={th}>Субъект</th><th style={th}>Важность</th><th style={th}>Статус</th><th style={th}>Создан</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id} onClick={() => setActive(c)} data-testid={`case-row-${c._id}`} style={{ cursor: 'pointer' }}>
                  <td style={{ ...td, fontWeight: 700, whiteSpace: 'nowrap' }}>{c.caseNumber}</td>
                  <td style={td}><Badge tone="info">{typeLabel[c.type] || c.type}</Badge></td>
                  <td style={td}>{c.subjectUser ? <UserCell user={c.subjectUser} /> : <span style={{ color: T.faint }}>—</span>}</td>
                  <td style={td}><Badge tone={c.severity === 'critical' || c.severity === 'high' ? 'bad' : 'default'}>{c.severity}</Badge></td>
                  <td style={td}><Badge tone={statusTone[c.status]}>{statusLabel[c.status] || c.status}</Badge></td>
                  <td style={{ ...td, color: T.sub, whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {active ? (
        <Overlay onClose={() => setActive(null)} align="right">
          <DrawerShell title={<span>{active.caseNumber} <Badge tone={statusTone[active.status]}>{statusLabel[active.status]}</Badge></span>} onClose={() => setActive(null)}>
            <SectionCard>
              <InfoRow k="Тип">{typeLabel[active.type] || active.type}</InfoRow>
              <InfoRow k="Источник">{active.source}</InfoRow>
              <InfoRow k="Описание"><span style={{ whiteSpace: 'pre-wrap' }}>{active.description || '—'}</span></InfoRow>
            </SectionCard>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}><OptionSelect label="Статус" value={active.status} onChange={(v) => upd({ status: v })} testid="case-status" options={ST_OPTS} /></div>
              <div style={{ flex: 1, minWidth: 160 }}><OptionSelect label="Важность" value={active.severity} onChange={(v) => upd({ severity: v })} testid="case-severity" options={SEV_OPTS} /></div>
            </div>
            {active.subjectUser?._id ? (
              <SectionCard title="Customer 360 · субъект кейса" style={{ marginTop: 16 }}>
                <Customer360 userId={active.subjectUser._id} loader={(id) => trust.userSummary(id)} />
              </SectionCard>
            ) : null}
          </DrawerShell>
        </Overlay>
      ) : null}
    </div>
  );
};

export default ModerationTab;

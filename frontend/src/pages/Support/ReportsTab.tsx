import React, { useEffect, useState } from 'react';
import { getReports, UserReport } from '../../components/services/support';
import OptionSelect from '../Advertising/OptionSelect';
import { Overlay } from '../Advertising/ui';
import { T, card, th, td, Badge, UserCell, Loader, Empty, fmtDate, DrawerShell, InfoRow, SectionCard } from './ui';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Все типы' },
  { value: 'impersonality', label: 'Выдача себя за другого' },
  { value: 'inappropriateBehavior', label: 'Неприемлемое поведение' },
  { value: 'underageAccount', label: 'Несовершеннолетний' },
];
const typeTone: Record<string, string> = { impersonality: 'warn', inappropriateBehavior: 'bad', underageAccount: 'info' };
const typeLabel: Record<string, string> = { impersonality: 'Выдача себя за другого', inappropriateBehavior: 'Неприемлемое поведение', underageAccount: 'Несовершеннолетний' };

const ReportsTab: React.FC = () => {
  const [items, setItems] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [active, setActive] = useState<UserReport | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const q: Record<string, string> = { limit: '100' };
      if (type !== 'all') q.type = type;
      const r = await getReports(q);
      const data = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setItems(data);
      setLoading(false);
    })();
  }, [type]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ width: 240 }}>
          <OptionSelect label="Тип жалобы" value={type} options={TYPE_OPTIONS} onChange={setType} testid="reports-type" />
        </div>
        <div style={{ fontSize: 13, color: T.sub, paddingBottom: 10 }}>{items.length} жалоб</div>
      </div>

      {loading ? <Loader /> : items.length === 0 ? <Empty text="Жалобы не найдены." /> : (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }} data-testid="reports-table">
            <thead><tr><th style={th}>Дата</th><th style={th}>На кого</th><th style={th}>Кто пожаловался</th><th style={th}>Тип</th><th style={th}>Детали</th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} onClick={() => setActive(r)} data-testid={`report-row-${r._id}`} style={{ cursor: 'pointer' }}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: T.sub }}>{fmtDate(r.createdAt)}</td>
                  <td style={td}><UserCell user={r.user} /></td>
                  <td style={td}><UserCell user={r.creator} /></td>
                  <td style={td}><Badge tone={typeTone[r.type] || 'default'}>{typeLabel[r.type] || r.type}</Badge>{r.subType ? <div style={{ fontSize: 11.5, color: T.faint, marginTop: 4 }}>{r.subType}</div> : null}</td>
                  <td style={{ ...td, color: T.sub, maxWidth: 320 }}><div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.body || '—'}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active ? (
        <Overlay onClose={() => setActive(null)} align="right">
          <DrawerShell title="Жалоба на пользователя" onClose={() => setActive(null)}>
            <SectionCard title="На кого пожаловались"><UserCell user={active.user} /></SectionCard>
            <SectionCard title="Автор жалобы"><UserCell user={active.creator} /></SectionCard>
            <SectionCard>
              <InfoRow k="Дата">{fmtDate(active.createdAt)}</InfoRow>
              <InfoRow k="Тип"><Badge tone={typeTone[active.type] || 'default'}>{typeLabel[active.type] || active.type}</Badge></InfoRow>
              {active.subType ? <InfoRow k="Подтип">{active.subType}</InfoRow> : null}
            </SectionCard>
            <SectionCard title="Детали">
              <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{active.body || '—'}</div>
            </SectionCard>
            {active.attachment ? (
              <SectionCard title="Вложение"><a href={active.attachment} target="_blank" rel="noreferrer" style={{ color: T.accent, fontWeight: 700 }}>Открыть вложение ↗</a></SectionCard>
            ) : null}
          </DrawerShell>
        </Overlay>
      ) : null}
    </div>
  );
};

export default ReportsTab;

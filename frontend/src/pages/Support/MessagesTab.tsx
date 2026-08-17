import React, { useEffect, useMemo, useState } from 'react';
import { getSupportMessages, SupportMessage } from '../../components/services/support';
import OptionSelect from '../Advertising/OptionSelect';
import { field, Overlay } from '../Advertising/ui';
import { T, card, th, td, Badge, UserCell, Loader, Empty, fmtDate, DrawerShell, InfoRow, SectionCard } from './ui';

const MessagesTab: React.FC = () => {
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [active, setActive] = useState<SupportMessage | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await getSupportMessages();
      setItems(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.category && s.add(i.category));
    return [{ value: 'all', label: 'Все категории' }, ...Array.from(s).map((c) => ({ value: c, label: c }))];
  }, [items]);

  const filtered = items.filter((i) =>
    (cat === 'all' || i.category === cat) &&
    (!q || `${i.theme || ''} ${i.message || ''} ${i.userData?.username || ''}`.toLowerCase().includes(q.toLowerCase())));

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ width: 220 }}>
          <OptionSelect label="Категория" value={cat} options={categories} onChange={setCat} testid="messages-category" />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 6, display: 'block' }}>Поиск</label>
          <input data-testid="messages-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по теме, сообщению или пользователю" style={field} />
        </div>
        <div style={{ fontSize: 13, color: T.sub, paddingBottom: 10 }}>{filtered.length} из {items.length}</div>
      </div>

      {filtered.length === 0 ? <Empty text="Обращения не найдены." /> : (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }} data-testid="messages-table">
            <thead><tr><th style={th}>Дата</th><th style={th}>Пользователь</th><th style={th}>Категория</th><th style={th}>Тема</th><th style={th}>Сообщение</th></tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m._id} onClick={() => setActive(m)} data-testid={`message-row-${m._id}`} style={{ cursor: 'pointer' }}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: T.sub }}>{fmtDate(m.date)}</td>
                  <td style={td}><UserCell user={m.userData} /></td>
                  <td style={td}>{m.category ? <Badge tone="info">{m.category}</Badge> : '—'}</td>
                  <td style={{ ...td, fontWeight: 700, maxWidth: 200 }}>{m.theme || '—'}</td>
                  <td style={{ ...td, color: T.sub, maxWidth: 320 }}><div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.message}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active ? (
        <Overlay onClose={() => setActive(null)} align="right">
          <DrawerShell title="Обращение в поддержку" onClose={() => setActive(null)}>
            <SectionCard>
              <InfoRow k="Дата">{fmtDate(active.date)}</InfoRow>
              <InfoRow k="Пользователь">{active.userData?.username || 'Неизвестно'}</InfoRow>
              {active.category ? <InfoRow k="Категория"><Badge tone="info">{active.category}</Badge></InfoRow> : null}
              <InfoRow k="Тема">{active.theme || '—'}</InfoRow>
              {active.projectData?.name ? <InfoRow k="Проект">{active.projectData.name}</InfoRow> : null}
            </SectionCard>
            <SectionCard title="Сообщение">
              <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{active.message}</div>
            </SectionCard>
            {active.file ? (
              <SectionCard title="Вложение">
                <a href={active.file} target="_blank" rel="noreferrer" style={{ color: T.accent, fontWeight: 700 }}>Открыть вложение ↗</a>
              </SectionCard>
            ) : null}
          </DrawerShell>
        </Overlay>
      ) : null}
    </div>
  );
};

export default MessagesTab;

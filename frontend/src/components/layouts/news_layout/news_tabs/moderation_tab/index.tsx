import React, { useState } from 'react';
import { Card, SectionTitle, SimpleTable, Badge, StateBlock, Column, useAsync } from '../../../../../pages/Statistics/ui';
import { btn } from '../../../../../pages/AccessMonetization/parts';
import { fetchData } from '../../../../hooks/useFetch';
import getAccessToken from '../../../../utils/getAccessToken';

const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}`, 'Content-Type': 'application/json' });

interface IReported {
  _id: string; text: string; topicName?: string; isTopic?: boolean;
  author?: any; reportsCount?: number; moderationStatus?: string; reportDetails?: any[];
}

const reasonLabel = (rd: any[]) => {
  if (!Array.isArray(rd) || !rd.length) return 'other';
  const counts: Record<string, number> = {};
  rd.forEach((r) => { const k = r?.reason || 'other'; counts[k] = (counts[k] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} (${n})`).join(', ');
};

const statusTone = (s?: string): 'good' | 'warn' | 'bad' => s === 'HIDDEN' ? 'warn' : s === 'REMOVED' ? 'bad' : 'good';

const ModerationTab: React.FC = () => {
  const { data, loading, error, refetch } = useAsync<any>(async () => {
    const r = await fetchData('comments/admin/reported/all', { headers: authHeaders() });
    return r?.data || {};
  }, []);
  const [busyId, setBusyId] = useState('');

  const payload = data || {};
  const items: IReported[] = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

  const act = async (id: string, kind: 'hide' | 'remove' | 'restore' | 'dismiss') => {
    setBusyId(id);
    if (kind === 'dismiss') {
      await fetchData(`comments/admin/${id}/dismiss-reports`, { method: 'PATCH', headers: authHeaders() });
    } else {
      const status = kind === 'hide' ? 'HIDDEN' : kind === 'remove' ? 'REMOVED' : 'PUBLISHED';
      await fetchData(`comments/admin/${id}/moderation`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
    }
    setBusyId(''); refetch();
  };

  const columns: Column<IReported>[] = [
    { key: 'post', header: 'Пост', width: 360, render: (it) => (
      <div>
        <div style={{ fontWeight: 700 }}>{it.topicName || (it.isTopic ? 'Тема' : 'Комментарий')}</div>
        <div style={{ color: '#64748B', fontSize: 12, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.text}</div>
      </div>
    ) },
    { key: 'author', header: 'Автор', render: (it) => (it.author?.username || it.author?.name || '—') },
    { key: 'reason', header: 'Причина', render: (it) => <Badge tone="warn">{reasonLabel(it.reportDetails || [])}</Badge> },
    { key: 'reportsCount', header: 'Жалобы', render: (it) => it.reportsCount },
    { key: 'status', header: 'Статус', render: (it) => <Badge tone={statusTone(it.moderationStatus)}>{it.moderationStatus || 'PUBLISHED'}</Badge> },
    { key: 'actions', header: 'Действия', render: (it) => busyId === it._id ? '…' : (
      <div style={{ display: 'flex', gap: 6 }}>
        {it.moderationStatus === 'HIDDEN'
          ? <button style={btn('ghost')} onClick={() => act(it._id, 'restore')}>Восстановить</button>
          : <button style={btn('ghost')} onClick={() => act(it._id, 'hide')}>Скрыть</button>}
        <button style={btn('danger')} onClick={() => act(it._id, 'remove')}>Удалить</button>
        <button style={btn('ghost')} onClick={() => act(it._id, 'dismiss')}>Отклонить</button>
      </div>
    ) },
  ];

  return (
    <div style={{ paddingTop: 8 }}>
      <Card>
        <SectionTitle sub="Жалобы на посты и комментарии. «Скрыть» убирает из публичной ленты (обратимо), «Удалить» снимает публикацию, «Отклонить» очищает жалобы.">
          Очередь модерации
        </SectionTitle>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <Badge tone="bad">{payload?.total ?? items.length} жалоб</Badge>
          <Badge tone="info">{payload?.comments ?? items.length} постов/комментариев</Badge>
        </div>
        {loading ? <StateBlock kind="loading" /> : error ? <StateBlock kind="error" onRetry={refetch} /> : (
          <SimpleTable columns={columns} rows={items} empty="Жалоб нет" testId="moderation-table" />
        )}
      </Card>
    </div>
  );
};

export default ModerationTab;

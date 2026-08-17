import React, { useState } from 'react';
import { Card, SectionTitle, SimpleTable, Badge, StateBlock, Column, useAsync } from '../../../../../pages/Statistics/ui';
import { input, label, btn } from '../../../../../pages/AccessMonetization/parts';
import { AdminSelect } from '../../../../../pages/AdminRating/AdminControls';
import { fetchData } from '../../../../hooks/useFetch';
import getAccessToken from '../../../../utils/getAccessToken';

const COLORS = ['gray', 'green', 'blue', 'purple', 'red', 'orange', 'teal', 'pink', 'indigo'];
const STATUSES = ['ACTIVE', 'HIDDEN', 'ARCHIVED'];

const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}`, 'Content-Type': 'application/json' });

interface ITopic {
  _id: string; slug: string; name: string; description?: string;
  colorKey?: string; status: string; sortOrder: number; postsCount?: number;
}

const TopicsTab: React.FC = () => {
  const { data, loading, error, refetch } = useAsync<ITopic[]>(async () => {
    const r = await fetchData('admin/topics', { headers: authHeaders() });
    return Array.isArray(r?.data) ? r.data : [];
  }, []);

  const [form, setForm] = useState<any>({ name: '', slug: '', description: '', colorKey: 'gray', sortOrder: 0 });
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const topics = data || [];
  const reset = () => { setForm({ name: '', slug: '', description: '', colorKey: 'gray', sortOrder: 0 }); setEditId(null); };

  const save = async () => {
    if (!form.name?.trim()) return;
    setBusy(true);
    const path = editId ? `admin/topics/${editId}` : 'admin/topics';
    await fetchData(path, { method: editId ? 'PATCH' : 'POST', headers: authHeaders(), body: JSON.stringify(form) });
    setBusy(false); reset(); refetch();
  };

  const setStatus = async (id: string, status: string) => {
    await fetchData(`admin/topics/${id}/status`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
    refetch();
  };

  const startEdit = (t: ITopic) => { setEditId(t._id); setForm({ name: t.name, slug: t.slug, description: t.description || '', colorKey: t.colorKey || 'gray', sortOrder: t.sortOrder || 0 }); };

  const columns: Column<ITopic>[] = [
    { key: 'name', header: 'Тема', render: (t) => <b>{t.name}</b> },
    { key: 'slug', header: 'Слаг', render: (t) => <span style={{ color: '#64748B' }}>{t.slug}</span> },
    { key: 'colorKey', header: 'Цвет', render: (t) => <Badge tone="info">{t.colorKey}</Badge> },
    { key: 'postsCount', header: 'Посты', render: (t) => t.postsCount ?? 0 },
    { key: 'sortOrder', header: 'Порядок', render: (t) => t.sortOrder },
    { key: 'status', header: 'Статус', render: (t) => (
      <div style={{ minWidth: 140 }}>
        <AdminSelect
          value={t.status}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
          onChange={(v: string) => setStatus(t._id, v)}
          ariaLabel="Статус темы"
        />
      </div>
    ) },
    { key: 'actions', header: '', render: (t) => (
      <button style={btn('ghost')} onClick={() => startEdit(t)}>Изменить</button>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
      <Card>
        <SectionTitle sub="Канонические темы для Buzz. Архивные темы исчезают из «Создать пост» — существующие посты остаются нетронутыми.">
          {editId ? 'Редактировать тему' : 'Добавить тему'}
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 90px 2fr auto', gap: 12, alignItems: 'end' }}>
          <div><label style={label}>Название</label><input style={input} value={form.name} placeholder="DeFi" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label style={label}>Слаг {editId ? '(заблокирован)' : '(авто)'}</label><input style={{ ...input, opacity: editId ? 0.6 : 1 }} disabled={!!editId} value={form.slug} placeholder="defi" onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div><label style={label}>Цвет</label><AdminSelect value={form.colorKey} options={COLORS.map((c) => ({ value: c, label: c }))} onChange={(v: string) => setForm({ ...form, colorKey: v })} ariaLabel="Цвет темы" /></div>
          <div><label style={label}>Порядок</label><input style={input} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
          <div><label style={label}>Описание</label><input style={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn('primary')} disabled={busy} onClick={save}>{busy ? '…' : editId ? 'Обновить' : 'Добавить'}</button>
            {editId && <button style={btn('ghost')} onClick={reset}>Отмена</button>}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Темы</SectionTitle>
        {loading ? <StateBlock kind="loading" /> : error ? <StateBlock kind="error" onRetry={refetch} /> : (
          <SimpleTable columns={columns} rows={topics} empty="Тем пока нет" testId="topics-table" />
        )}
      </Card>
    </div>
  );
};

export default TopicsTab;

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { T, Card, SectionTitle, Badge, StateBlock, SimpleTable } from '../Statistics/ui';
import { AdminSelect } from '../AdminRating/AdminControls';
import {
  fetchFomoV2Flags,
  confirmFomoV2Flag,
  rejectFomoV2Flag,
  FomoV2EntityFlag,
} from '../../components/services/fomoV2Flags';

const ENTITY_LABEL: Record<string, string> = {
  market_project: 'Проект (Market)',
  ico_project: 'ICO-проект',
  backer: 'Фонд',
  person: 'Персона',
};
const TYPE_LABEL: Record<string, string> = { green: 'Зелёный', yellow: 'Жёлтый', red: 'Красный' };
const flagTone = (t: string) => (t === 'green' ? 'good' : t === 'red' ? 'bad' : 'warn');
const statusTone = (s: string) => (s === 'confirmed' ? 'good' : s === 'rejected' ? 'bad' : 'warn');
const statusLabel: Record<string, string> = { pending: 'На модерации', confirmed: 'Подтверждён', rejected: 'Отклонён' };

const input: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', color: T.ink };
const mini = (tone: 'ok' | 'bad'): React.CSSProperties => ({ padding: '5px 10px', borderRadius: 8, border: `1px solid ${tone === 'ok' ? T.accent : '#FCA5A5'}`, background: '#fff', color: tone === 'ok' ? T.accent : '#DC2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' });
const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6, display: 'block' };
const dt = (v?: string) => (v ? new Date(v).toLocaleString('ru-RU') : '—');

const FlagsTab: React.FC = () => {
  const [status, setStatus] = useState('pending');
  const [entityType, setEntityType] = useState('');
  const [flagType, setFlagType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const r = await fetchFomoV2Flags({ status: status || undefined, entityType: entityType || undefined, flagType: flagType || undefined, search: search || undefined, page, limit: 20 });
    if (r.success) setData(r.data); else setError(true);
    setLoading(false);
  }, [status, entityType, flagType, search, page]);
  useEffect(() => { load(); }, [load]);

  const review = async (id: string, action: 'confirm' | 'reject') => {
    const comment = window.prompt(action === 'confirm' ? 'Комментарий модератора (необязательно). Подтвердить флаг — он будет показан на сайте.' : 'Причина отклонения (необязательно). Флаг не будет показан на сайте.') ?? undefined;
    setBusyId(id);
    const r = await (action === 'confirm' ? confirmFomoV2Flag(id, comment) : rejectFomoV2Flag(id, comment));
    setBusyId(null);
    if (r.success) { toast.success(action === 'confirm' ? 'Флаг подтверждён' : 'Флаг отклонён'); load(); }
    else toast.error(r.error || 'Не удалось выполнить действие');
  };

  const counts = data?.counts?.byStatus || {};
  const items: FomoV2EntityFlag[] = data?.items || [];

  return (
    <div style={{ display: 'grid', gap: 16 }} data-testid="support-flags-tab">
      <Card testId="flags-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <SectionTitle sub="Модерация пользовательских флагов (зелёный / жёлтый / красный) по проектам, ICO, фондам и персонам. Подтверждённые флаги отображаются на сайте, отклонённые — нет.">Флаги доверия</SectionTitle>
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
          <div>
            <label style={label}>Статус</label>
            <AdminSelect value={status} onChange={(v: string) => { setPage(1); setStatus(v); }} testid="flags-filter-status" ariaLabel="Статус"
              options={[{ value: 'pending', label: 'На модерации' }, { value: 'confirmed', label: 'Подтверждённые' }, { value: 'rejected', label: 'Отклонённые' }, { value: '', label: 'Все статусы' }]} />
          </div>
          <div>
            <label style={label}>Объект</label>
            <AdminSelect value={entityType} onChange={(v: string) => { setPage(1); setEntityType(v); }} testid="flags-filter-entity" ariaLabel="Объект"
              options={[{ value: '', label: 'Все объекты' }, { value: 'market_project', label: 'Проекты (Market)' }, { value: 'ico_project', label: 'ICO-проекты' }, { value: 'backer', label: 'Фонды' }, { value: 'person', label: 'Персоны' }]} />
          </div>
          <div>
            <label style={label}>Тип флага</label>
            <AdminSelect value={flagType} onChange={(v: string) => { setPage(1); setFlagType(v); }} testid="flags-filter-type" ariaLabel="Тип флага"
              options={[{ value: '', label: 'Все типы' }, { value: 'green', label: 'Зелёные' }, { value: 'yellow', label: 'Жёлтые' }, { value: 'red', label: 'Красные' }]} />
          </div>
          <div>
            <label style={label}>Поиск</label>
            <input style={input} data-testid="flags-search" value={search} placeholder="Текст, URL, ID объекта" onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
        {[['На модерации', counts.pending, T.warn], ['Подтверждено', counts.confirmed, T.good], ['Отклонено', counts.rejected, T.bad], ['Всего в фильтре', data?.total, T.ink]].map(([ttl, val, col]: any) => (
          <Card key={ttl} testId={`flags-kpi-${ttl}`}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4 }}>{ttl}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: col }}>{val ?? 0}</div>
          </Card>
        ))}
      </div>

      <Card testId="flags-table-card">
        {loading ? <StateBlock kind="loading" /> : error ? <StateBlock kind="error" title="Не удалось загрузить флаги" onRetry={load} /> : (
          <>
            <div style={{ overflowX: 'auto', width: '100%' }} data-testid="flags-table-scroll">
            <SimpleTable
              testId="flags-table"
              empty="Флаги не найдены"
              columns={[
                { key: 'flagType', header: 'Флаг', render: (r: any) => <Badge tone={flagTone(r.flagType) as any}>{TYPE_LABEL[r.flagType] || r.flagType}</Badge> },
                { key: 'entity', header: 'Объект', render: (r: any) => (<div><div style={{ fontWeight: 700, color: T.ink }}>{ENTITY_LABEL[r.entityType] || r.entityType}</div><div style={{ fontSize: 12, color: T.faint, fontFamily: 'monospace' }}>{r.entityId}</div></div>) },
                { key: 'description', header: 'Описание', render: (r: any) => (<div style={{ maxWidth: 280, minWidth: 180 }}>{r.title ? <div style={{ fontWeight: 700, color: T.ink, whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.title}</div> : null}<div style={{ fontSize: 13, color: T.sub, whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.description}</div>{r.sourceUrl ? <a href={r.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: T.accent }}>Источник ↗</a> : null}</div>) },
                { key: 'status', header: 'Статус', render: (r: any) => <span style={{ whiteSpace: 'nowrap' }}><Badge tone={statusTone(r.status) as any}>{statusLabel[r.status] || r.status}</Badge></span> },
                { key: 'createdAt', header: 'Отправлен', render: (r: any) => <span style={{ fontSize: 12.5, color: T.sub, whiteSpace: 'nowrap' }}>{dt(r.createdAt)}</span> },
                {
                  key: 'actions', header: '', align: 'right', render: (r: any) => {
                    const id = r.id || r._id;
                    const busy = busyId === id;
                    return (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                        {r.status !== 'pending' && r.adminComment ? <span style={{ fontSize: 12, color: T.faint, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.adminComment}>{r.adminComment}</span> : null}
                        {r.status !== 'confirmed' ? (
                          <button style={mini('ok')} data-testid={`flag-confirm-${id}`} disabled={busy} onClick={() => review(id, 'confirm')}>{r.status === 'rejected' ? 'Показать' : 'Подтвердить'}</button>
                        ) : null}
                        {r.status !== 'rejected' ? (
                          <button style={mini('bad')} data-testid={`flag-reject-${id}`} disabled={busy} onClick={() => review(id, 'reject')}>{r.status === 'confirmed' ? 'Скрыть' : 'Отклонить'}</button>
                        ) : null}
                      </div>
                    );
                  },
                },
              ]}
              rows={items}
            />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <span style={{ fontSize: 13, color: T.sub }}>Стр. {data?.page || 1} из {data?.pages || 1}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...mini('ok'), opacity: (data?.page || 1) <= 1 ? 0.5 : 1 }} data-testid="flags-prev" disabled={(data?.page || 1) <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</button>
                <button style={{ ...mini('ok'), opacity: (data?.page || 1) >= (data?.pages || 1) ? 0.5 : 1 }} data-testid="flags-next" disabled={(data?.page || 1) >= (data?.pages || 1)} onClick={() => setPage((p) => p + 1)}>Вперёд</button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default FlagsTab;

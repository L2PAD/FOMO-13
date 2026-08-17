import React, { useMemo, useState } from 'react';
import { T } from '../Statistics/ui';
import { th, td, input, btn } from '../AccessMonetization/parts';
import { AdminSelect } from '../AdminRating/AdminControls';

export type Col = {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
  sort?: (row: any) => any; // custom sort value; defaults to nested path `key`
  mono?: boolean;
  sortable?: boolean; // default true
  width?: number | string;
};
export type Filter = { key: string; label: string; options: { value: string; label: string }[]; match?: (row: any, v: string) => boolean };

const path = (o: any, p: string) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const norm = (v: any) => (v == null ? '' : String(v)).toLowerCase();

/**
 * Reusable admin table — поиск (кошелёк/почта/…), сортировка по клику,
 * пагинация и скролл длинных списков со «липкой» шапкой. Полностью по дизайну CRM.
 */
export const DataTable: React.FC<{
  rows: any[];
  columns: Col[];
  searchKeys?: string[];
  searchPlaceholder?: string;
  filters?: Filter[];
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  pageSize?: number;
  emptyText?: string;
  testid?: string;
  maxHeight?: number;
}> = ({ rows, columns, searchKeys = [], searchPlaceholder = 'Поиск…', filters = [], initialSort, pageSize = 25, emptyText = 'Нет данных.', testid, maxHeight = 560 }) => {
  const [q, setQ] = useState('');
  const [fvals, setFvals] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState(initialSort?.key || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSort?.dir || 'desc');
  const [size, setSize] = useState(pageSize);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let r = rows || [];
    const ql = q.trim().toLowerCase();
    if (ql && searchKeys.length) r = r.filter((row) => searchKeys.some((k) => norm(path(row, k)).includes(ql)));
    filters.forEach((f) => {
      const v = fvals[f.key];
      if (v) r = r.filter((row) => (f.match ? f.match(row, v) : String(path(row, f.key)) === v));
    });
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      const val = (row: any) => (col?.sort ? col.sort(row) : path(row, sortKey));
      r = [...r].sort((a, b) => {
        const av = val(a), bv = val(b);
        const an = typeof av === 'number', bn = typeof bv === 'number';
        let cmp: number;
        if (an && bn) cmp = (av as number) - (bv as number);
        else cmp = norm(av) < norm(bv) ? -1 : norm(av) > norm(bv) ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, q, fvals, sortKey, sortDir, columns, searchKeys, filters]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * size, cur * size);
  const toggleSort = (k: string) => { if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('asc'); } setPage(1); };

  const ctrl: React.CSSProperties = { border: `1px solid ${T.border}`, background: '#fff', borderRadius: 9, padding: '7px 11px', fontSize: 12.5, fontWeight: 700, color: T.ink, cursor: 'pointer' };

  return (
    <div data-testid={testid}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        {searchKeys.length ? (
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.sub, fontSize: 13 }}>⌕</span>
            <input style={{ ...input, paddingLeft: 30 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={searchPlaceholder} data-testid={testid ? `${testid}-search` : undefined} />
          </div>
        ) : null}
        {filters.map((f) => (
          <div key={f.key} style={{ minWidth: 180 }}>
            <AdminSelect value={fvals[f.key] || ''} onChange={(v: string) => { setFvals({ ...fvals, [f.key]: v }); setPage(1); }} options={[{ value: '', label: f.label }, ...f.options]} testid={testid ? `${testid}-filter-${f.key}` : undefined} />
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: T.sub, fontWeight: 600 }}>{total ? `${(cur - 1) * size + 1}–${Math.min(cur * size, total)} из ${total}` : '0'}</div>
      </div>

      <div style={{ overflow: 'auto', maxHeight, border: `1px solid ${T.border}`, borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>{columns.map((c) => {
              const sortable = c.sortable !== false;
              const active = sortKey === c.key;
              return (
                <th key={c.key} onClick={sortable ? () => toggleSort(c.key) : undefined} style={{ ...th, background: '#F8FAFC', cursor: sortable ? 'pointer' : 'default', userSelect: 'none', width: c.width, whiteSpace: 'nowrap', color: active ? T.accent : th.color }}>
                  {c.label}{sortable ? <span style={{ marginLeft: 5, opacity: active ? 1 : 0.3 }}>{active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span> : null}
                </th>
              );
            })}</tr>
          </thead>
          <tbody>
            {slice.length ? slice.map((row, i) => (
              <tr key={row.id || row.userId || i}>
                {columns.map((c) => (
                  <td key={c.key} style={{ ...td, fontFamily: c.mono ? 'monospace' : undefined, fontSize: c.mono ? 11 : td.fontSize, whiteSpace: c.mono ? 'nowrap' : undefined }}>
                    {c.render ? c.render(row) : (path(row, c.key) ?? '—')}
                  </td>
                ))}
              </tr>
            )) : <tr><td style={{ ...td, color: T.sub }} colSpan={columns.length}>{q || Object.values(fvals).some(Boolean) ? 'Ничего не найдено по фильтрам.' : emptyText}</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: T.sub }}>На странице:</span>
        {[25, 50, 100].map((n) => (
          <button key={n} onClick={() => { setSize(n); setPage(1); }} style={{ ...ctrl, background: size === n ? T.accent : '#fff', color: size === n ? '#fff' : T.ink, borderColor: size === n ? T.accent : T.border }}>{n}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ ...ctrl, opacity: cur <= 1 ? 0.45 : 1 }} disabled={cur <= 1} onClick={() => setPage(cur - 1)} data-testid={testid ? `${testid}-prev` : undefined}>← Назад</button>
          <span style={{ fontSize: 12.5, color: T.ink, fontWeight: 700 }}>{cur} / {pages}</span>
          <button style={{ ...ctrl, opacity: cur >= pages ? 0.45 : 1 }} disabled={cur >= pages} onClick={() => setPage(cur + 1)} data-testid={testid ? `${testid}-next` : undefined}>Вперёд →</button>
        </div>
      </div>
    </div>
  );
};

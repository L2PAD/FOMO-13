import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useStyles } from "./styles";
import { SourceBadge, PROV_LABEL } from "./provenance";
import { labelFor } from "./labels";
import {
  RatingSnapshot,
  SnapshotFilters,
  fetchSnapshots,
  fetchSnapshotSources,
  fetchSnapshotDetail,
  recalcFromSnapshot,
  compareSnapshots,
} from "../../components/services/adminUnifiedRatings";

const ENTITY_OPTIONS = [
  { value: "", label: "Все сущности" },
  { value: "funds", label: "Фонды" },
  { value: "persons", label: "Персоны" },
  { value: "projects", label: "Проекты" },
  { value: "twitter", label: "Twitter" },
  { value: "users", label: "Пользователи" },
  { value: "trade", label: "Торговля" },
];

const shortHash = (h?: string) => (h ? `${h.slice(0, 8)}…${h.slice(-4)}` : "—");
const fmt = (v?: string) => (v ? new Date(v).toLocaleString("ru-RU") : "—");

const SnapshotExplorer = () => {
  const classes = useStyles();
  const [filters, setFilters] = useState<SnapshotFilters>({ limit: 25, skip: 0 });
  const [rows, setRows] = useState<RatingSnapshot[]>([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<{ snapshot: RatingSnapshot; currentResult: any } | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<{ left: RatingSnapshot | null; right: RatingSnapshot | null } | null>(null);

  const load = useCallback(async (f: SnapshotFilters) => {
    setBusy(true);
    const res = await fetchSnapshots(f);
    setBusy(false);
    if (res.success && res.data) {
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } else {
      toast.error(res.error || "Не удалось загрузить снапшоты");
    }
  }, []);

  useEffect(() => { load(filters); }, [load, filters]);
  useEffect(() => {
    (async () => {
      const res = await fetchSnapshotSources();
      if (res.success && Array.isArray(res.data)) setSources(res.data);
    })();
  }, []);

  const patch = (p: Partial<SnapshotFilters>) => setFilters((s) => ({ ...s, skip: 0, ...p }));

  const openDetail = async (id: string) => {
    const res = await fetchSnapshotDetail(id);
    if (res.success && res.data?.snapshot) setSelected(res.data as any);
    else toast.error(res.error || "Снапшот не найден");
  };

  const doRecalc = async (id: string) => {
    const res = await recalcFromSnapshot(id);
    if (!res.success) { toast.error(res.error || "Не удалось пересчитать"); return; }
    toast.success(`Пересчитано: ${res.data?.newScore ?? "—"} (Δ ${res.data?.delta ?? 0})`);
    if (selected) openDetail(id);
    load(filters);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      const next = [...cur, id].slice(-2);
      return next;
    });
  };

  const runCompare = async () => {
    if (compareIds.length !== 2) { toast.info("Выберите два снапшота"); return; }
    const res = await compareSnapshots(compareIds[0], compareIds[1]);
    if (res.success && res.data) setCompareData(res.data);
    else toast.error(res.error || "Не удалось сравнить");
  };

  const page = Math.floor((filters.skip || 0) / (filters.limit || 25)) + 1;
  const pages = Math.max(1, Math.ceil(total / (filters.limit || 25)));

  return (
    <div className={classes.card} data-testid="snapshot-explorer">
      <div className={classes.cardHead}>
        <div>
          <h2>Snapshot Explorer</h2>
          <p>Сырые снапшоты ingestion: сущность, источник, режим, валидность, checksum, idempotencyKey, payload и связанный результат.</p>
        </div>
      </div>

      <div className={classes.filterBar}>
        <select className={`${classes.input} ${classes.selectField}`} data-testid="snap-filter-entity"
          value={filters.entityType || ""} onChange={(e) => patch({ entityType: e.target.value || undefined })}>
          {ENTITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input className={classes.input} placeholder="ID сущности" data-testid="snap-filter-id"
          value={filters.entityId || ""} onChange={(e) => patch({ entityId: e.target.value || undefined })} />
        <select className={`${classes.input} ${classes.selectField}`} data-testid="snap-filter-source"
          value={filters.source || ""} onChange={(e) => patch({ source: e.target.value || undefined })}>
          <option value="">Все источники</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={`${classes.input} ${classes.selectField}`} data-testid="snap-filter-validation"
          value={filters.validationStatus || ""} onChange={(e) => patch({ validationStatus: e.target.value || undefined })}>
          <option value="">Любая валидация</option>
          <option value="valid">valid</option>
          <option value="invalid">invalid</option>
        </select>
        <input className={classes.input} type="date" data-testid="snap-filter-from"
          value={filters.from ? filters.from.slice(0, 10) : ""} onChange={(e) => patch({ from: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
        <input className={classes.input} type="date" data-testid="snap-filter-to"
          value={filters.to ? filters.to.slice(0, 10) : ""} onChange={(e) => patch({ to: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
      </div>

      <div className={classes.btnRow} style={{ marginTop: 0, marginBottom: 10 }}>
        <span className={classes.badge}>{busy ? "Загрузка…" : `Найдено: ${total}`}</span>
        <button className={`${classes.btn} ${classes.btnGhost}`} data-testid="snap-compare-btn"
          disabled={compareIds.length !== 2} onClick={runCompare}>
          Сравнить выбранные ({compareIds.length}/2)
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className={classes.refTable} data-testid="snap-table">
          <thead>
            <tr>
              <th>Сущность</th><th>ID</th><th>Источник</th><th>Валидация</th>
              <th>Checksum</th><th>Idempotency</th><th>Score</th><th>Получено</th><th>Сравн.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className={classes.clickRow} data-testid="snap-row" onClick={() => openDetail(r._id)}>
                <td>{labelFor(r.entityType)}</td>
                <td><code>{r.entityId}</code></td>
                <td><SourceBadge source="derived" label={r.source} /></td>
                <td>
                  <span className={`${classes.srcBadge} ${r.validationStatus === "valid" ? classes.srcDerived : classes.srcMissing}`}>
                    {r.validationStatus}
                  </span>
                </td>
                <td><code>{shortHash(r.checksum)}</code></td>
                <td>{r.idempotencyKey || "—"}</td>
                <td>{r.lastResultScore ?? "—"}</td>
                <td>{fmt(r.receivedAt)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" data-testid="snap-compare-check"
                    checked={compareIds.includes(r._id)} onChange={() => toggleCompare(r._id)} />
                </td>
              </tr>
            ))}
            {!rows.length && !busy ? <tr><td colSpan={9} style={{ color: "#8592A4" }}>Нет снапшотов по фильтру.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className={classes.pager}>
        <button className={`${classes.btn} ${classes.btnGhost}`} disabled={page <= 1}
          onClick={() => setFilters((s) => ({ ...s, skip: Math.max(0, (s.skip || 0) - (s.limit || 25)) }))}>← Назад</button>
        <span>Стр. {page} из {pages}</span>
        <button className={`${classes.btn} ${classes.btnGhost}`} disabled={page >= pages}
          onClick={() => setFilters((s) => ({ ...s, skip: (s.skip || 0) + (s.limit || 25) }))}>Вперёд →</button>
      </div>

      {compareData ? (
        <div className={classes.provPanel} data-testid="snap-compare-result" style={{ marginTop: 16 }}>
          <div className={classes.sectionTitle}>
            <span>Сравнение снапшотов</span>
            <span className={`${classes.srcBadge} ${compareData.left?.checksum === compareData.right?.checksum ? classes.srcDerived : classes.srcStale}`}>
              {compareData.left?.checksum === compareData.right?.checksum ? "payload идентичен" : "payload отличается"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
            {[compareData.left, compareData.right].map((s, i) => (
              <div key={i}>
                <p className={classes.groupTitle}>{s?.entityType}/{s?.entityId} · {s?.source}</p>
                <pre className={classes.pre}>{JSON.stringify(s?.payload ?? {}, null, 2)}</pre>
              </div>
            ))}
          </div>
          <div className={classes.btnRow}>
            <button className={`${classes.btn} ${classes.btnGhost}`} onClick={() => { setCompareData(null); setCompareIds([]); }}>Закрыть</button>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className={classes.provPanel} data-testid="snap-detail" style={{ marginTop: 16 }}>
          <div className={classes.sectionTitle}>
            <span>Снапшот {selected.snapshot.entityType}/{selected.snapshot.entityId}</span>
            <SourceBadge source="derived" label={selected.snapshot.source} />
          </div>
          <dl className={classes.kvGrid} style={{ marginTop: 10 }}>
            <dt>Валидация</dt><dd>{selected.snapshot.validationStatus}</dd>
            <dt>Checksum</dt><dd><code>{selected.snapshot.checksum}</code></dd>
            <dt>Idempotency Key</dt><dd>{selected.snapshot.idempotencyKey || "—"}</dd>
            <dt>Observed / Received</dt><dd>{fmt(selected.snapshot.observedAt)} · {fmt(selected.snapshot.receivedAt)}</dd>
            <dt>Schema version</dt><dd>{selected.snapshot.schemaVersion ?? "—"}</dd>
          </dl>

          <p className={classes.groupTitle} style={{ marginTop: 12 }}>Связанный текущий результат</p>
          {selected.currentResult ? (
            <div className={classes.tradeSummary}>
              <div className={classes.tradeStat}><span>Score</span><strong data-testid="snap-related-score">{selected.currentResult.score ?? "—"}</strong></div>
              <div className={classes.tradeStat}><span>Уровень</span><strong>{selected.currentResult.level ?? "—"}</strong></div>
              <div className={classes.tradeStat}><span>Полнота</span><strong>{selected.currentResult.completeness ?? "—"}%</strong></div>
              <div className={classes.tradeStat}>
                <span>Происхождение</span>
                <strong><SourceBadge source={selected.currentResult.provenance?.mode} label={PROV_LABEL[selected.currentResult.provenance?.mode]} /></strong>
              </div>
            </div>
          ) : <p style={{ fontSize: 12.5, color: "#7A879A" }}>Результат ещё не рассчитан — запустите пересчёт.</p>}

          <p className={classes.groupTitle} style={{ marginTop: 12 }}>Payload</p>
          <pre className={classes.pre} data-testid="snap-payload">{JSON.stringify(selected.snapshot.payload ?? {}, null, 2)}</pre>

          <div className={classes.btnRow}>
            <button className={`${classes.btn} ${classes.btnPrimary}`} data-testid="snap-recalc-btn"
              disabled={selected.snapshot.validationStatus === "invalid"}
              onClick={() => doRecalc(selected.snapshot._id)}>
              Пересчитать из снапшота
            </button>
            <button className={`${classes.btn} ${classes.btnGhost}`} onClick={() => setSelected(null)}>Закрыть</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SnapshotExplorer;

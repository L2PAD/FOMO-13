import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useStyles } from "./styles";
import { SourceBadge, PROV_LABEL } from "./provenance";
import { validationLabel, sourceHuman, freshnessLabel } from "./labels";
import { AdminSelect, AdminDatePicker } from "./AdminControls";
import {
  RatingSnapshot,
  SnapshotFilters,
  fetchSnapshots,
  fetchSnapshotSources,
  fetchSnapshotDetail,
  recalcFromSnapshot,
  compareSnapshots,
} from "../../components/services/adminUnifiedRatings";

const fmt = (v?: string) => (v ? new Date(v).toLocaleString("ru-RU") : "—");

/** Flatten a payload one level deep into readable "показатель → значение". */
const flatten = (payload: any): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!payload || typeof payload !== "object") return out;
  for (const [k, v] of Object.entries(payload)) {
    out[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  return out;
};

const StatusBadge = ({ status }: { status?: string }) => {
  const classes = useStyles();
  const ok = status === "valid";
  return (
    <span className={`${classes.srcBadge} ${ok ? classes.srcDerived : classes.srcMissing}`}>
      {validationLabel(status)}
    </span>
  );
};

/**
 * Entity-scoped "Данные для расчёта" — the admin-facing view of ingested data
 * for ONE rating (funds/persons/…). Technical fields (checksum, idempotency,
 * raw payload, schema version) are hidden inside "Технические детали".
 */
const DataForCalc = ({ entityType }: { entityType: string }) => {
  const classes = useStyles();
  const [filters, setFilters] = useState<SnapshotFilters>({ entityType, limit: 25, skip: 0 });
  const [rows, setRows] = useState<RatingSnapshot[]>([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<{ snapshot: RatingSnapshot; currentResult: any } | null>(null);
  const [showTech, setShowTech] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<{ left: RatingSnapshot | null; right: RatingSnapshot | null } | null>(null);
  const [compareTech, setCompareTech] = useState(false);

  useEffect(() => {
    setFilters((s) => ({ ...s, entityType, skip: 0 }));
    setSelected(null);
    setCompareData(null);
    setCompareIds([]);
  }, [entityType]);

  const load = useCallback(async (f: SnapshotFilters) => {
    setBusy(true);
    const res = await fetchSnapshots(f);
    setBusy(false);
    if (res.success && res.data) {
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } else toast.error(res.error || "Не удалось загрузить данные");
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
    if (res.success && res.data?.snapshot) { setSelected(res.data as any); setShowTech(false); }
    else toast.error(res.error || "Данные не найдены");
  };

  const doRecalc = async (id: string) => {
    const res = await recalcFromSnapshot(id);
    if (!res.success) { toast.error(res.error || "Не удалось пересчитать"); return; }
    toast.success(`Пересчитано: ${res.data?.newScore ?? "—"} (Δ ${res.data?.delta ?? 0})`);
    openDetail(id);
    load(filters);
  };

  const toggleCompare = (id: string) =>
    setCompareIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-2)));

  const runCompare = async () => {
    if (compareIds.length !== 2) { toast.info("Отметьте два набора данных"); return; }
    const res = await compareSnapshots(compareIds[0], compareIds[1]);
    if (res.success && res.data) setCompareData(res.data);
    else toast.error(res.error || "Не удалось сравнить");
  };

  const page = Math.floor((filters.skip || 0) / (filters.limit || 25)) + 1;
  const pages = Math.max(1, Math.ceil(total / (filters.limit || 25)));

  return (
    <div className={classes.card} data-testid="data-for-calc">
      <div className={classes.cardHead}>
        <div>
          <h3>Данные для расчёта</h3>
          <p>Какие исходные данные поступили, откуда, когда и используются ли они в текущем рейтинге. Технические поля скрыты в «Технических деталях».</p>
        </div>
      </div>

      <div className={classes.filterBar}>
        <input className={classes.input} placeholder="ID сущности" data-testid="data-filter-id"
          value={filters.entityId || ""} onChange={(e) => patch({ entityId: e.target.value || undefined })} />
        <AdminSelect testid="data-filter-source" placeholder="Все источники"
          value={filters.source || ""}
          options={[{ value: "", label: "Все источники" }, ...sources.map((s) => ({ value: s, label: sourceHuman(s) }))]}
          onChange={(v) => patch({ source: v || undefined })} searchable />
        <AdminSelect testid="data-filter-validation" placeholder="Любой статус"
          value={filters.validationStatus || ""}
          options={[
            { value: "", label: "Любой статус" },
            { value: "valid", label: "Данные корректны" },
            { value: "invalid", label: "Ошибка данных" },
          ]}
          onChange={(v) => patch({ validationStatus: v || undefined })} />
        <AdminDatePicker testid="data-filter-from" value={filters.from}
          onChange={(v) => patch({ from: v ? new Date(v).toISOString() : undefined })} />
        <AdminDatePicker testid="data-filter-to" value={filters.to}
          onChange={(v) => patch({ to: v ? new Date(v).toISOString() : undefined })} />
      </div>

      <div className={classes.btnRow} style={{ marginTop: 0, marginBottom: 10 }}>
        <span className={classes.badge}>{busy ? "Загрузка…" : `Найдено: ${total}`}</span>
        <button className={`${classes.btn} ${classes.btnGhost}`} data-testid="data-compare-btn"
          disabled={compareIds.length !== 2} onClick={runCompare}>
          Сравнить данные ({compareIds.length}/2)
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className={classes.refTable} data-testid="data-table">
          <thead>
            <tr>
              <th>ID сущности</th><th>Источник</th><th>Статус</th><th>Актуальность</th>
              <th>Получено</th><th>Используется</th><th>Последний результат</th><th>Сравн.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const fresh = freshnessLabel(r.observedAt || r.receivedAt);
              return (
                <tr key={r._id} className={classes.clickRow} data-testid="data-row" onClick={() => openDetail(r._id)}>
                  <td><code>{r.entityId}</code></td>
                  <td><SourceBadge source="derived" label={sourceHuman(r.source)} /></td>
                  <td><StatusBadge status={r.validationStatus} /></td>
                  <td><span className={`${classes.srcBadge} ${fresh.stale ? classes.srcStale : classes.srcDerived}`}>{fresh.label}</span></td>
                  <td>{fmt(r.receivedAt)}</td>
                  <td>{r.validationStatus === "valid" ? "Да" : "Нет"}</td>
                  <td>{r.lastResultScore ?? "—"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" data-testid="data-compare-check"
                      checked={compareIds.includes(r._id)} onChange={() => toggleCompare(r._id)} />
                  </td>
                </tr>
              );
            })}
            {!rows.length && !busy ? <tr><td colSpan={8} style={{ color: "#8592A4" }}>Нет данных по фильтру.</td></tr> : null}
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

      {compareData ? (() => {
        const L = flatten(compareData.left?.payload);
        const R = flatten(compareData.right?.payload);
        const keys = Array.from(new Set([...Object.keys(L), ...Object.keys(R)]));
        const sL = compareData.left?.lastResultScore;
        const sR = compareData.right?.lastResultScore;
        return (
          <div className={classes.provPanel} data-testid="data-compare-result" style={{ marginTop: 16 }}>
            <div className={classes.sectionTitle}>
              <span>Что изменилось в данных</span>
              <span className={`${classes.srcBadge} ${compareData.left?.checksum === compareData.right?.checksum ? classes.srcDerived : classes.srcStale}`}>
                {compareData.left?.checksum === compareData.right?.checksum ? "данные идентичны" : "данные отличаются"}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#7A879A", margin: "4px 0 10px" }}>
              Сравнение показывает, какие исходные данные изменились и как это повлияло на рейтинг.
            </p>
            <table className={classes.breakdownTable}>
              <thead><tr><th>Показатель</th><th>Было</th><th>Стало</th></tr></thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k} style={L[k] !== R[k] ? { background: "rgba(0,192,153,0.06)" } : undefined}>
                    <td>{k}</td><td>{L[k] ?? "—"}</td><td>{R[k] ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={classes.tradeSummary} style={{ marginTop: 12 }}>
              <div className={classes.tradeStat}><span>Рейтинг был</span><strong>{sL ?? "—"}</strong></div>
              <div className={classes.tradeStat}><span>Рейтинг стал</span><strong>{sR ?? "—"}</strong></div>
              <div className={classes.tradeStat}><span>Изменение</span><strong>{sL != null && sR != null ? Math.round((sR - sL) * 100) / 100 : "—"}</strong></div>
            </div>
            <details className={classes.collapsible} style={{ marginTop: 10 }} open={compareTech} onToggle={(e) => setCompareTech((e.target as HTMLDetailsElement).open)}>
              <summary className={classes.collapsibleHead}>Технические детали (raw payload)</summary>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <pre className={classes.pre}>{JSON.stringify(compareData.left?.payload ?? {}, null, 2)}</pre>
                <pre className={classes.pre}>{JSON.stringify(compareData.right?.payload ?? {}, null, 2)}</pre>
              </div>
            </details>
            <div className={classes.btnRow}>
              <button className={`${classes.btn} ${classes.btnGhost}`} onClick={() => { setCompareData(null); setCompareIds([]); }}>Закрыть</button>
            </div>
          </div>
        );
      })() : null}

      {selected ? (
        <div className={classes.provPanel} data-testid="data-detail" style={{ marginTop: 16 }}>
          <div className={classes.sectionTitle}>
            <span>Данные · {selected.snapshot.entityId}</span>
            <SourceBadge source="derived" label={sourceHuman(selected.snapshot.source)} />
          </div>

          <p className={classes.groupTitle} style={{ marginTop: 10 }}>Показатели</p>
          <table className={classes.breakdownTable}>
            <thead><tr><th>Показатель</th><th>Значение</th></tr></thead>
            <tbody>
              {Object.entries(flatten(selected.snapshot.payload)).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
              {!Object.keys(flatten(selected.snapshot.payload)).length ? <tr><td colSpan={2} style={{ color: "#8592A4" }}>Нет показателей</td></tr> : null}
            </tbody>
          </table>

          <p className={classes.groupTitle} style={{ marginTop: 12 }}>Текущий результат рейтинга</p>
          {selected.currentResult ? (
            <div className={classes.tradeSummary}>
              <div className={classes.tradeStat}><span>Рейтинг</span><strong data-testid="data-related-score">{selected.currentResult.score ?? "—"}</strong></div>
              <div className={classes.tradeStat}><span>Уровень</span><strong>{selected.currentResult.level ?? "—"}</strong></div>
              <div className={classes.tradeStat}><span>Полнота</span><strong>{selected.currentResult.completeness ?? "—"}%</strong></div>
              <div className={classes.tradeStat}><span>Происхождение</span><strong><SourceBadge source={selected.currentResult.provenance?.mode} label={PROV_LABEL[selected.currentResult.provenance?.mode]} /></strong></div>
            </div>
          ) : <p style={{ fontSize: 12.5, color: "#7A879A" }}>Рейтинг ещё не рассчитан на этих данных.</p>}

          <details className={classes.collapsible} style={{ marginTop: 12 }} open={showTech} onToggle={(e) => setShowTech((e.target as HTMLDetailsElement).open)}>
            <summary className={classes.collapsibleHead}>Технические детали</summary>
            <dl className={classes.kvGrid} style={{ marginTop: 8 }}>
              <dt>Системный ID</dt><dd><code>{selected.snapshot._id}</code></dd>
              <dt>Checksum</dt><dd><code>{selected.snapshot.checksum}</code></dd>
              <dt>Idempotency key</dt><dd>{selected.snapshot.idempotencyKey || "—"}</dd>
              <dt>Версия схемы</dt><dd>{selected.snapshot.schemaVersion ?? "—"}</dd>
              <dt>Код источника</dt><dd>{selected.snapshot.source}</dd>
            </dl>
            <pre className={classes.pre} data-testid="data-payload">{JSON.stringify(selected.snapshot.payload ?? {}, null, 2)}</pre>
          </details>

          <div className={classes.btnRow}>
            <button className={`${classes.btn} ${classes.btnPrimary}`} data-testid="data-recalc-btn"
              disabled={selected.snapshot.validationStatus === "invalid"}
              onClick={() => doRecalc(selected.snapshot._id)}>
              Пересчитать рейтинг
            </button>
            <button className={`${classes.btn} ${classes.btnGhost}`} onClick={() => setSelected(null)}>Закрыть</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DataForCalc;

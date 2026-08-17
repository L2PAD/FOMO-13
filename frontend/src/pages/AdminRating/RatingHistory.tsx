import React, { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useStyles } from "./styles";
import { SourceBadge, PROV_LABEL } from "./provenance";
import { labelFor, freshnessLabel } from "./labels";
import { AdminEntitySearch, EntityHit } from "./AdminControls";
import {
  searchUnified,
  fetchRatingHistory,
  RatingHistoryItem,
} from "../../components/services/adminUnifiedRatings";

const fmt = (v?: string) => (v ? new Date(v).toLocaleString("ru-RU") : "—");

/** Per-entity rating history: pick an entity, see every recorded version. */
const RatingHistory = ({ entityType }: { entityType: string }) => {
  const classes = useStyles();
  const [selected, setSelected] = useState<EntityHit | null>(null);
  const [items, setItems] = useState<RatingHistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const doSearch = useCallback(
    async (q: string): Promise<EntityHit[]> => {
      const res = await searchUnified(entityType, q);
      if (res.success && res.data?.items) return res.data.items;
      return [];
    },
    [entityType]
  );

  const loadHistory = useCallback(
    async (id: string) => {
      setBusy(true);
      const res = await fetchRatingHistory(entityType, id, 50);
      setBusy(false);
      if (res.success && Array.isArray(res.data)) setItems(res.data);
      else { setItems([]); toast.error(res.error || "Не удалось загрузить историю"); }
    },
    [entityType]
  );

  const onSelect = (hit: EntityHit) => {
    setSelected(hit);
    setOpenRow(null);
    loadHistory(hit.id);
  };

  return (
    <div className={classes.card} data-testid="rating-history">
      <div className={classes.cardHead}>
        <div>
          <h3>История рейтинга</h3>
          <p>Найдите сущность, чтобы увидеть все версии рейтинга: когда, почему и как он менялся.</p>
        </div>
      </div>

      <div style={{ maxWidth: 460 }}>
        <AdminEntitySearch testid="history-search" onSearch={doSearch} onSelect={onSelect} selectedLabel={selected?.label} />
      </div>

      {selected ? (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table className={classes.refTable} data-testid="history-table">
            <thead>
              <tr>
                <th>Дата</th><th>Рейтинг</th><th>Изменение</th><th>Уровень</th>
                <th>Полнота</th><th>Источник</th><th>Причина</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const created = (it as any).createdAt || (it as any).recordedAt || (it as any).calculatedAt;
                return (
                  <React.Fragment key={i}>
                    <tr data-testid="history-row">
                      <td>{fmt(created)} {it.isCurrent ? <span className={classes.badge}>текущий</span> : null}</td>
                      <td><strong>{it.score ?? "—"}</strong></td>
                      <td style={{ color: (it.delta ?? 0) > 0 ? "#017a63" : (it.delta ?? 0) < 0 ? "#E5484D" : "#7A879A" }}>
                        {it.delta != null ? (it.delta > 0 ? `+${it.delta}` : it.delta) : "—"}
                      </td>
                      <td>{it.level ?? "—"}</td>
                      <td>{it.completeness ?? "—"}%</td>
                      <td><SourceBadge source={it.provenance?.mode} label={PROV_LABEL[it.provenance?.mode || ""]} /></td>
                      <td>{it.reason ?? "—"}</td>
                      <td>
                        <button className={classes.smallBtn} title="Открыть breakdown" onClick={() => setOpenRow(openRow === i ? null : i)}>
                          {openRow === i ? "▲" : "▼"}
                        </button>
                      </td>
                    </tr>
                    {openRow === i ? (
                      <tr>
                        <td colSpan={8}>
                          <dl className={classes.kvGrid} data-testid="history-repro" style={{ marginBottom: 10 }}>
                            <dt>Input snapshot</dt><dd><code>{it.inputSnapshotId || (it.inputSnapshotIds && it.inputSnapshotIds[0]) || "—"}</code></dd>
                            <dt>Config snapshot</dt><dd><code>{it.configSnapshotId || "—"}</code></dd>
                            <dt>Полнота</dt><dd>{it.completeness ?? "—"}%</dd>
                            <dt>Актуальность</dt><dd>{freshnessLabel(created).label}</dd>
                            <dt>Происхождение</dt><dd><SourceBadge source={it.provenance?.mode} label={PROV_LABEL[it.provenance?.mode || ""]} /></dd>
                          </dl>
                          <table className={classes.breakdownTable}>
                            <thead><tr><th>Компонент</th><th>Источник</th><th>Вклад</th></tr></thead>
                            <tbody>
                              {Object.entries(it.components || {}).map(([k, c]: any) => (
                                <tr key={k}>
                                  <td>{labelFor(k)}</td>
                                  <td><SourceBadge source={c?.source} /></td>
                                  <td>{c?.contribution ?? c ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
              {!items.length && !busy ? <tr><td colSpan={8} style={{ color: "#8592A4" }}>Нет записей истории для этой сущности.</td></tr> : null}
              {busy ? <tr><td colSpan={8} style={{ color: "#8592A4" }}>Загрузка…</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ marginTop: 16, fontSize: 13, color: "#7A879A" }}>Выберите сущность выше.</p>
      )}
    </div>
  );
};

export default RatingHistory;

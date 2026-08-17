import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useStyles } from "./styles";
import TypedReferenceForm from "./TypedReferenceForm";
import { REFERENCE_SCHEMAS, REFERENCE_TITLES, RefFieldSpec } from "./referenceSchemas";
import {
  fetchReferenceItems,
  upsertReferenceItem,
  deleteReferenceItem,
} from "../../components/services/adminUnifiedRatings";

/** Columns to surface in the human-facing list (technical fields excluded). */
const LIST_COLUMNS: Record<string, string[]> = {
  rating_crises: ["name", "type", "startDate", "endDate", "enabled"],
  rating_jurisdictions: ["countryName", "regulationTier", "baseScore", "licenseRequired", "enabled"],
  rating_tier_registry: ["entityType", "entityId", "tier", "status", "enabled"],
  rating_red_flag_catalog: ["title", "severity", "defaultPenalty", "enabled"],
  rating_role_catalog: ["title", "weight", "enabled"],
  rating_partnership_types: ["title", "rating", "enabled"],
  rating_media_source_tiers: ["title", "weight", "enabled"],
};

/** Fallback RU labels for technical columns not described by a field schema. */
const COLUMN_LABELS: Record<string, string> = {
  enabled: "Активен",
  code: "Код",
};

const optionLabel = (spec: RefFieldSpec | undefined, value: any): string => {
  if (!spec) {
    if (typeof value === "boolean") return value ? "Да" : "Нет";
    return value == null ? "—" : String(value);
  }
  if (spec.type === "boolean") return value ? "Да" : "Нет";
  if (spec.type === "date") return value ? String(value).slice(0, 10) : "—";
  if (spec.type === "select" && spec.options) {
    const o = spec.options.find((x) => x.value === value);
    return o ? o.label : value == null ? "—" : String(value);
  }
  if (value == null || value === "") return "—";
  return String(value);
};

/** Manage ONE reference catalog with a fully russified list + typed form. */
const ReferenceManager = ({ catalog }: { catalog: string }) => {
  const classes = useStyles();
  const schema = REFERENCE_SCHEMAS[catalog] || [];
  const specByKey = Object.fromEntries(schema.map((s) => [s.key, s]));
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ item: any; isNew: boolean } | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    const res = await fetchReferenceItems(catalog);
    setBusy(false);
    const list = Array.isArray(res.data?.items)
      ? res.data.items
      : Array.isArray(res.data)
        ? (res.data as any[])
        : null;
    if (res.success && list) setItems(list);
    else toast.error(res.error || "Не удалось загрузить справочник");
  }, [catalog]);

  useEffect(() => { load(); }, [load]);

  const save = async (body: any) => {
    const code = body.code;
    if (!code) { toast.error("Укажите системный код"); return; }
    const res = await upsertReferenceItem(catalog, code, body);
    if (!res.success) { toast.error(res.error || "Ошибка сохранения"); return; }
    toast.success("Сохранено");
    setEditing(null);
    load();
  };

  const remove = async (code: string) => {
    const res = await deleteReferenceItem(catalog, code);
    if (!res.success) { toast.error(res.error || "Не удалось удалить"); return; }
    toast.success("Удалено");
    load();
  };

  const columns = LIST_COLUMNS[catalog] || ["code", "enabled"];

  return (
    <div data-testid="reference-manager">
      <div className={classes.btnRow} style={{ marginTop: 0 }}>
        <button className={`${classes.btn} ${classes.btnPrimary}`} data-testid="ref-add-btn"
          onClick={() => setEditing({ item: { code: "", enabled: true }, isNew: true })}>
          + Добавить запись
        </button>
        <span className={classes.badge}>{busy ? "Загрузка…" : `Записей: ${items.length}`}</span>
      </div>

      {editing ? (
        <TypedReferenceForm
          catalog={catalog}
          initial={editing.item}
          isNew={editing.isNew}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table className={classes.refTable} data-testid="ref-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c}>{specByKey[c]?.label || COLUMN_LABELS[c] || c}</th>)}
              <th>Системная</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.code}>
                {columns.map((c) => <td key={c}>{optionLabel(specByKey[c], it[c])}</td>)}
                <td>{it.system ? "Да" : "Нет"}</td>
                <td>
                  <button className={classes.smallBtn} title="Редактировать" onClick={() => setEditing({ item: it, isNew: false })}>✎</button>
                  {!it.system ? <button className={classes.smallBtn} title="Удалить" onClick={() => remove(it.code)}>×</button> : null}
                </td>
              </tr>
            ))}
            {!items.length && !busy ? (
              <tr><td colSpan={columns.length + 2} style={{ color: "#8592A4" }}>Записей пока нет.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ReferenceManagerTitle = (catalog: string) => REFERENCE_TITLES[catalog] || catalog;

export default ReferenceManager;

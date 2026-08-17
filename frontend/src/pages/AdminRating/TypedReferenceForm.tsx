import React, { useMemo, useState } from "react";
import { useStyles } from "./styles";
import { REFERENCE_SCHEMAS, RefFieldSpec, CRISIS_CRITERIA_TEMPLATE, EVIDENCE_TYPES, CrisisCriterion } from "./referenceSchemas";
import { AdminSelect } from "./AdminControls";

interface Props {
  catalog: string;
  initial?: Record<string, any> | null;
  isNew: boolean;
  onSave: (body: Record<string, any>) => void;
  onCancel: () => void;
}

const toFormState = (schema: RefFieldSpec[], item: Record<string, any> | null | undefined) => {
  const state: Record<string, any> = {};
  schema.forEach((f) => {
    const v = item ? item[f.key] : undefined;
    if (f.type === "multiselect") state[f.key] = Array.isArray(v) ? v : [];
    else if (f.type === "boolean") state[f.key] = Boolean(v);
    else if (f.type === "number") state[f.key] = v ?? "";
    else if (f.type === "textarea" && f.key === "scoringCriteria" && Array.isArray(v))
      state[f.key] = v.join(", ");
    else state[f.key] = v ?? "";
  });
  state.enabled = item?.enabled ?? true;
  return state;
};

/** Schema-driven typed editor for a single reference-catalog record. */
const TypedReferenceForm = ({ catalog, initial, isNew, onSave, onCancel }: Props) => {
  const classes = useStyles();
  const schema = REFERENCE_SCHEMAS[catalog] || [];
  const [state, setState] = useState<Record<string, any>>(() => toFormState(schema, initial));
  const [error, setError] = useState("");

  const isSystem = Boolean(initial?.system);
  const isCrisis = catalog === "rating_crises";
  const [criteria, setCriteria] = useState<CrisisCriterion[]>(() => {
    if (!isCrisis) return [];
    const src = Array.isArray(initial?.criteria) && initial!.criteria.length ? initial!.criteria : CRISIS_CRITERIA_TEMPLATE;
    return src.map((c: any) => ({ ...c }));
  });
  const enabledWeightSum = criteria.filter((c) => c.enabled).reduce((s, c) => s + Number(c.weight || 0), 0);
  const criteriaValid = !isCrisis || Math.round(enabledWeightSum) === 100;

  const setCrit = (i: number, patch: Partial<CrisisCriterion>) =>
    setCriteria((cur) => cur.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const set = (key: string, value: any) => setState((s) => ({ ...s, [key]: value }));

  const toggleMulti = (key: string, value: string) =>
    setState((s) => {
      const arr: string[] = Array.isArray(s[key]) ? s[key] : [];
      return { ...s, [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });

  const jsonPreview = useMemo(() => JSON.stringify(buildBody(schema, state), null, 2), [schema, state]);

  const submit = () => {
    for (const f of schema) {
      if (isCrisis && f.key === "scoringCriteria") continue;
      if (f.required && (state[f.key] === "" || state[f.key] === undefined || state[f.key] === null)) {
        setError(`Заполните поле «${f.label}»`);
        return;
      }
    }
    if (isCrisis) {
      if (criteria.some((c) => Number(c.weight) < 0)) { setError("Вес критерия не может быть отрицательным"); return; }
      if (Math.round(enabledWeightSum) !== 100) { setError(`Сумма весов включённых критериев должна быть 100% (сейчас ${Math.round(enabledWeightSum)}%)`); return; }
    }
    setError("");
    const body = buildBody(schema, state);
    if (isCrisis) body.criteria = criteria;
    onSave(body);
  };

  return (
    <div className={classes.provPanel} data-testid="ref-typed-form">
      <div className={classes.sectionTitle} style={{ marginBottom: 8 }}>
        <span>{isNew ? "Новая запись" : `Редактирование: ${initial?.code}`}</span>
        {isSystem ? <span className={classes.badge}>системная запись</span> : null}
      </div>

      <div className={classes.formGrid}>
        {schema.map((f) => (isCrisis && f.key === "scoringCriteria") ? null : (
          <div
            className={classes.formField}
            key={f.key}
            style={f.type === "textarea" || f.type === "multiselect" ? { gridColumn: "1 / -1" } : undefined}
          >
            <label className={classes.formLabel}>
              {f.label}
              {f.required ? <span style={{ color: "#E5484D" }}> *</span> : null}
            </label>

            {f.type === "text" ? (
              <input
                className={classes.input}
                data-testid={`ref-field-${f.key}`}
                value={state[f.key] ?? ""}
                placeholder={f.placeholder}
                disabled={f.key === "code" && !isNew}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ) : null}

            {f.type === "number" ? (
              <input
                className={classes.input}
                type="number"
                data-testid={`ref-field-${f.key}`}
                value={state[f.key] ?? ""}
                min={f.min}
                max={f.max}
                step={f.step}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ) : null}

            {f.type === "date" ? (
              <input
                className={classes.input}
                type="date"
                data-testid={`ref-field-${f.key}`}
                value={(state[f.key] || "").slice(0, 10)}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ) : null}

            {f.type === "textarea" ? (
              <textarea
                className={classes.input}
                style={{ minHeight: 64, resize: "vertical", fontFamily: "inherit" }}
                data-testid={`ref-field-${f.key}`}
                value={state[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ) : null}

            {f.type === "select" ? (
              <select
                className={`${classes.input} ${classes.selectField}`}
                data-testid={`ref-field-${f.key}`}
                value={state[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
              >
                <option value="">— не задано —</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : null}

            {f.type === "boolean" ? (
              <label className={classes.switchRow}>
                <input
                  type="checkbox"
                  data-testid={`ref-field-${f.key}`}
                  checked={Boolean(state[f.key])}
                  onChange={(e) => set(f.key, e.target.checked)}
                />
                <span>{state[f.key] ? "Да" : "Нет"}</span>
              </label>
            ) : null}

            {f.type === "multiselect" ? (
              <div className={classes.chipRow} data-testid={`ref-field-${f.key}`}>
                {f.options?.map((o) => {
                  const active = Array.isArray(state[f.key]) && state[f.key].includes(o.value);
                  return (
                    <button
                      type="button"
                      key={o.value}
                      className={`${classes.chip} ${active ? classes.chipActive : ""}`}
                      onClick={() => toggleMulti(f.key, o.value)}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {f.help ? <small className={classes.fieldHelp}>{f.help}</small> : null}
          </div>
        ))}

        <div className={classes.formField}>
          <label className={classes.formLabel}>Включено (enabled)</label>
          <label className={classes.switchRow}>
            <input
              type="checkbox"
              data-testid="ref-field-enabled"
              checked={Boolean(state.enabled)}
              onChange={(e) => set("enabled", e.target.checked)}
            />
            <span>{state.enabled ? "Активна" : "Отключена"}</span>
          </label>
        </div>
      </div>

      {isCrisis ? (
        <div data-testid="crisis-criteria" style={{ marginTop: 14 }}>
          <div className={classes.sectionTitle} style={{ marginBottom: 8 }}>
            <span>Критерии оценки устойчивости</span>
            <span
              className={`${classes.badge}`}
              data-testid="crisis-weight-sum"
              style={{ color: criteriaValid ? "#017a63" : "#E5484D", borderColor: criteriaValid ? undefined : "#E5484D" }}
            >
              Сумма включённых: {Math.round(enabledWeightSum)}% {criteriaValid ? "✓" : "(должно быть 100%)"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#7A879A", margin: "0 0 10px" }}>
            Fund Resilience рассчитывается как взвешенная сумма этих критериев.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className={classes.breakdownTable}>
              <thead>
                <tr><th>Критерий</th><th>Исп.</th><th>Вес, %</th><th>Описание</th><th>Тип evidence</th></tr>
              </thead>
              <tbody>
                {criteria.map((c, i) => (
                  <tr key={c.key}>
                    <td>{c.label}</td>
                    <td>
                      <input type="checkbox" data-testid={`crit-enabled-${c.key}`} checked={c.enabled}
                        onChange={(e) => setCrit(i, { enabled: e.target.checked })} />
                    </td>
                    <td style={{ width: 90 }}>
                      <input className={classes.input} type="number" min={0} max={100} data-testid={`crit-weight-${c.key}`}
                        style={{ height: 34, padding: "0 8px" }} value={c.weight}
                        onChange={(e) => setCrit(i, { weight: Number(e.target.value) })} disabled={!c.enabled} />
                    </td>
                    <td>
                      <input className={classes.input} style={{ height: 34, padding: "0 8px" }} value={c.description || ""}
                        onChange={(e) => setCrit(i, { description: e.target.value })} />
                    </td>
                    <td style={{ minWidth: 190 }}>
                      <AdminSelect value={c.evidenceType || ""} options={EVIDENCE_TYPES}
                        onChange={(v) => setCrit(i, { evidenceType: v })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}


      {error ? <div className={classes.errorText} style={{ marginTop: 8 }}>{error}</div> : null}

      <details className={classes.collapsible} style={{ marginTop: 10 }}>
        <summary className={classes.collapsibleHead}>Технические данные (JSON)</summary>
        <pre className={classes.pre} data-testid="ref-json-preview">{jsonPreview}</pre>
      </details>

      <div className={classes.btnRow}>
        <button className={`${classes.btn} ${classes.btnPrimary}`} data-testid="ref-save-btn" onClick={submit}>
          Сохранить
        </button>
        <button className={`${classes.btn} ${classes.btnGhost}`} onClick={onCancel}>Отмена</button>
      </div>
    </div>
  );
};

function buildBody(schema: RefFieldSpec[], state: Record<string, any>): Record<string, any> {
  const body: Record<string, any> = {};
  schema.forEach((f) => {
    let v = state[f.key];
    if (f.type === "number") v = v === "" || v === null ? undefined : Number(v);
    if (f.type === "textarea" && f.key === "scoringCriteria" && typeof v === "string")
      v = v; // stored as string; formulas split as needed
    if (v !== undefined) body[f.key] = v;
  });
  body.enabled = Boolean(state.enabled);
  return body;
}

export default TypedReferenceForm;

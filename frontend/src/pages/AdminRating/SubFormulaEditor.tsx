import React, { useMemo, useState } from "react";
import {
  ComponentFormula,
  NormRule,
  SubMetricDef,
  ThresholdStep,
} from "../../components/services/adminUnifiedRatings";
import { useStyles } from "./styles";
import { InfoTip } from "./AdminControls";

const round2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const NORM_LABEL: Record<string, string> = {
  pct: "0–100",
  linear: "линейная",
  log: "лог-шкала",
  ratio: "доля",
  recency: "свежесть",
  bool: "да/нет",
  tiered: "ступени",
};

const normLabel = (norm?: NormRule): string => {
  if (!norm) return "";
  if (norm.type === "linear" || norm.type === "log") return `${NORM_LABEL[norm.type]} (cap ${norm.cap})`;
  if (norm.type === "recency") return `${NORM_LABEL.recency} (${norm.halfLifeDays}д)`;
  return NORM_LABEL[norm.type] || norm.type;
};

/* ------- reusable help tooltip (?) — portal-based, never clipped ------- */
export const Help = ({
  title,
  tooltip,
  formula,
  source,
  example,
  testid,
}: {
  title: string;
  tooltip: string;
  formula?: string;
  source?: string;
  example?: string;
  testid?: string;
}) => (
  <InfoTip
    title={title}
    meaning={tooltip}
    formula={formula}
    source={source}
    example={example}
    missing="Компонент помечается как «Нет данных» и не подменяется нулём."
    testid={testid}
  />
);

const NumberInput = ({
  value,
  onChange,
  testid,
  step = "any",
}: {
  value: number;
  onChange: (v: number) => void;
  testid?: string;
  step?: string;
}) => {
  const classes = useStyles();
  return (
    <input
      className={classes.input}
      type="number"
      step={step}
      data-testid={testid}
      value={round2(Number(value) || 0)}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
    />
  );
};

/* ---- threshold (at -> points) editor used by scalar/tiered norms ---- */
const Thresholds = ({
  steps,
  prefix,
  onChange,
}: {
  steps: ThresholdStep[];
  prefix: string;
  onChange: (s: ThresholdStep[]) => void;
}) => {
  const classes = useStyles();
  const upd = (i: number, field: "at" | "points", v: number) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)));
  return (
    <div className={classes.groupBlock}>
      <p className={classes.groupTitle}>Пороги нормализации (значение → 0–100)</p>
      {steps.map((s, i) => (
        <div className={classes.thresholdRow} key={i}>
          <NumberInput value={s.at} onChange={(v) => upd(i, "at", v)} testid={`${prefix}-at-${i}`} />
          <NumberInput value={s.points} onChange={(v) => upd(i, "points", v)} testid={`${prefix}-pts-${i}`} />
          <button
            type="button"
            className={classes.smallBtn}
            onClick={() => onChange(steps.filter((_, idx) => idx !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className={classes.addBtn}
        onClick={() => onChange([...steps, { at: 0, points: 0 }])}
      >
        + Добавить порог
      </button>
    </div>
  );
};

const SubWeights = ({
  subs,
  prefix,
  onChange,
}: {
  subs: SubMetricDef[];
  prefix: string;
  onChange: (subs: SubMetricDef[]) => void;
}) => {
  const classes = useStyles();
  const positiveSum = round2(
    subs.filter((s) => !s.penalty).reduce((a, s) => a + Number(s.weight || 0), 0)
  );
  const ok = Math.abs(positiveSum - 100) <= 1;
  const upd = (i: number, weight: number) =>
    onChange(subs.map((s, idx) => (idx === i ? { ...s, weight } : s)));
  return (
    <>
      <div className={classes.sectionTitle} style={{ marginTop: 4 }}>
        <span>Суб-метрики и веса</span>
        <span
          className={`${classes.badge} ${ok ? classes.badgeOk : classes.badgeErr}`}
          data-testid={`${prefix}-sum`}
        >
          Σ {positiveSum} / 100
        </span>
      </div>
      {subs.map((s, i) => (
        <div className={classes.sfSubRow} key={s.key}>
          <div>
            <span className={classes.sfSubLabel}>{s.label}</span>
            {s.norm ? <span className={classes.normBadge}>{normLabel(s.norm)}</span> : null}
            {s.penalty ? <span className={classes.penaltyTag}>штраф</span> : null}
            <small>Источник: {s.source}</small>
          </div>
          <NumberInput value={s.weight} onChange={(v) => upd(i, v)} testid={`${prefix}-w-${s.key}`} />
          <small style={{ color: "#93A0B2" }}>вес %</small>
        </div>
      ))}
    </>
  );
};

const RecordEditor = ({
  title,
  obj,
  prefix,
  onChange,
}: {
  title: string;
  obj: Record<string, number>;
  prefix: string;
  onChange: (obj: Record<string, number>) => void;
}) => {
  const classes = useStyles();
  return (
    <div className={classes.groupBlock}>
      <p className={classes.groupTitle}>{title}</p>
      {Object.keys(obj).map((k) => (
        <label className={classes.fieldRow} key={k}>
          <span>
            <code>{k}</code>
          </span>
          <NumberInput value={obj[k]} onChange={(v) => onChange({ ...obj, [k]: v })} testid={`${prefix}-${k}`} />
        </label>
      ))}
    </div>
  );
};

const KIND_BADGE: Record<string, string> = {
  weighted: "формула из под-метрик",
  scalar: "нормализация значения",
  tiered: "ступенчатая шкала",
  dealQuality: "значимость сделок",
  resilience: "поведение в кризисы",
  compliance: "юрисдикция + флаги",
  partnerships: "качество связей",
  weightedList: "взвешенный список",
};

const FormulaBody = ({
  entity,
  compKey,
  formula,
  onChange,
}: {
  entity: string;
  compKey: string;
  formula: ComponentFormula;
  onChange: (f: ComponentFormula) => void;
}) => {
  const classes = useStyles();
  const prefix = `sf-${entity}-${compKey}`;
  const patch = (p: Partial<ComponentFormula>) => onChange({ ...formula, ...p });

  return (
    <div className={classes.sfBody}>
      <div className={classes.sfFormula} data-testid={`${prefix}-formula`}>{formula.formula}</div>
      {formula.source ? (
        <p className={classes.sfSource}>
          <b>Источник данных:</b> {formula.source}
        </p>
      ) : null}

      {typeof formula.cap === "number" ? (
        <label className={classes.fieldRow}>
          <span>
            <code>Максимум баллов (cap)</code>
            <small>вклад компонента ограничен этим значением</small>
          </span>
          <NumberInput value={formula.cap} onChange={(v) => patch({ cap: v })} testid={`${prefix}-cap`} />
        </label>
      ) : null}

      {formula.kind === "weighted" && formula.subs ? (
        <SubWeights subs={formula.subs} prefix={prefix} onChange={(subs) => patch({ subs })} />
      ) : null}

      {(formula.kind === "scalar" || formula.kind === "tiered") &&
      (formula.norm?.type === "tiered" || formula.kind === "tiered") ? (
        <Thresholds
          steps={
            formula.kind === "tiered"
              ? formula.table || []
              : (formula.norm as any)?.table || []
          }
          prefix={`${prefix}-th`}
          onChange={(table) =>
            formula.kind === "tiered"
              ? patch({ table })
              : patch({ norm: { type: "tiered", table } })
          }
        />
      ) : null}

      {formula.kind === "scalar" && formula.norm && formula.norm.type !== "tiered" ? (
        <p className={classes.sfSource}>
          Нормализация: <b>{normLabel(formula.norm)}</b>
        </p>
      ) : null}

      {formula.kind === "dealQuality" && formula.rolePoints ? (
        <RecordEditor
          title="Баллы по роли/значимости сделки"
          obj={formula.rolePoints}
          prefix={`${prefix}-role`}
          onChange={(rolePoints) => patch({ rolePoints })}
        />
      ) : null}

      {formula.kind === "resilience" && formula.crisisSubs ? (
        <>
          <p className={classes.sfSource}>
            Оценивается по каждому пережитому кризису из справочника кризисов. Кризисы до
            основания фонда не учитываются.
          </p>
          <SubWeights
            subs={formula.crisisSubs}
            prefix={`${prefix}-crisis`}
            onChange={(crisisSubs) => patch({ crisisSubs })}
          />
        </>
      ) : null}

      {formula.kind === "compliance" && formula.flags ? (
        <div className={classes.groupBlock}>
          <p className={classes.groupTitle}>Модификаторы (флаги)</p>
          {formula.flags.map((f, i) => (
            <label className={classes.fieldRow} key={f.key}>
              <span>
                <code>{f.label}</code>
                <small>{f.key}</small>
              </span>
              <NumberInput
                value={f.delta}
                onChange={(v) =>
                  patch({
                    flags: formula.flags!.map((x, idx) => (idx === i ? { ...x, delta: v } : x)),
                  })
                }
                testid={`${prefix}-flag-${f.key}`}
              />
            </label>
          ))}
          <p className={classes.sfSource}>
            Базовый балл берётся из справочника юрисдикций (категория регулирования → баллы).
          </p>
        </div>
      ) : null}

      {formula.kind === "partnerships" && formula.kindRatings ? (
        <>
          <RecordEditor
            title="Вес типа связи (0–1)"
            obj={formula.kindRatings}
            prefix={`${prefix}-kind`}
            onChange={(kindRatings) => patch({ kindRatings })}
          />
          <label className={classes.fieldRow}>
            <span><code>Делитель</code><small>нормализация суммы</small></span>
            <NumberInput value={formula.divisor ?? 5} onChange={(v) => patch({ divisor: v })} testid={`${prefix}-divisor`} />
          </label>
          <label className={classes.fieldRow}>
            <span><code>Период полураспада свежести</code><small>дней</small></span>
            <NumberInput value={formula.recencyHalfLifeDays ?? 365} onChange={(v) => patch({ recencyHalfLifeDays: v })} testid={`${prefix}-recency`} />
          </label>
        </>
      ) : null}

      {formula.kind === "weightedList" ? (
        <p className={classes.sfSource}>
          Рассчитывается автоматически как взвешенное среднее рейтингов связанных сущностей
          (вес зависит от роли/стадии/доли участия). Ручная настройка не требуется.
        </p>
      ) : null}
    </div>
  );
};

const SubFormulaEditor = ({
  entity,
  formulas,
  onChange,
}: {
  entity: "funds" | "persons" | "twitter" | "projects" | "users";
  formulas: Record<string, ComponentFormula>;
  onChange: (compKey: string, f: ComponentFormula) => void;
}) => {
  const classes = useStyles();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const keys = useMemo(() => Object.keys(formulas || {}), [formulas]);
  if (!keys.length) return null;
  return (
    <section className={classes.section} data-testid={`subformulas-${entity}`}>
      <div className={classes.sectionTitle}>
        <span>Расширенные формулы (подформулы)</span>
      </div>
      <p className={classes.sfIntro}>
        Каждый показатель считается из сырых данных: <b>сырое → нормализация 0–100 → вклад</b>.
        Ниже можно редактировать суб-веса, пороги, лимиты и модификаторы. Наведите на «?» —
        объяснение простым языком, формула и источник данных.
      </p>
      {keys.map((k) => {
        const f = formulas[k];
        const isOpen = !!open[k];
        return (
          <div className={classes.sfCard} key={k}>
            <div
              className={classes.sfHead}
              data-testid={`sf-head-${entity}-${k}`}
              onClick={() => setOpen((o) => ({ ...o, [k]: !o[k] }))}
            >
              <span className={classes.sfHeadLeft}>
                <span className={classes.sfTitle}>{f.label}</span>
                <Help
                  title={f.label}
                  tooltip={f.tooltip}
                  formula={f.formula}
                  source={f.source}
                  testid={`sf-help-${entity}-${k}`}
                />
                <span className={classes.sfKindBadge}>{KIND_BADGE[f.kind] || f.kind}</span>
              </span>
              <span style={{ color: "#8592A4", fontSize: 12 }}>
                {isOpen ? "▲ свернуть" : "▼ Расширенная формула"}
              </span>
            </div>
            {isOpen ? (
              <FormulaBody
                entity={entity}
                compKey={k}
                formula={f}
                onChange={(nf) => onChange(k, nf)}
              />
            ) : null}
          </div>
        );
      })}
    </section>
  );
};

export default SubFormulaEditor;

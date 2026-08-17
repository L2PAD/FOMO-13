import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/layouts/main_layout/layout";
import {
  ThresholdStep,
  UnifiedRatingConfig,
  UnifiedRuntimeState,
  UnifiedScoreResult,
  fetchUnifiedConfig,
  fetchUnifiedStatus,
  previewUnified,
  previewUnifiedRaw,
  fetchReferenceCatalogs,
  fetchReferenceItems,
  upsertReferenceItem,
  deleteReferenceItem,
  recalculateUnified,
  saveUnifiedConfig,
  searchUnified,
  fetchCurrentRating,
} from "../../components/services/adminUnifiedRatings";
import { hintFor, labelFor, subLabelFor, sourceLabel } from "./labels";
import { sourceHuman, freshnessLabel } from "./labels";
import SubFormulaEditor from "./SubFormulaEditor";
import DataForCalc from "./DataForCalc";
import RatingHistory from "./RatingHistory";
import ReferenceDrawer from "./ReferenceDrawer";
import TypedReferenceForm from "./TypedReferenceForm";
import { AdminSelect, AdminEntitySearch, EntityHit } from "./AdminControls";
import AdminXpRanks from "./AdminXpRanks";
import { useStyles } from "./styles";

type TabKey = "funds" | "persons" | "projects" | "twitter" | "users" | "xp" | "trade";

const TABS: { key: TabKey; label: string; recalc?: string }[] = [
  { key: "funds", label: "Фонды", recalc: "funds" },
  { key: "persons", label: "Персоны", recalc: "persons" },
  { key: "projects", label: "Проекты", recalc: "projects" },
  { key: "twitter", label: "Twitter" },
  { key: "users", label: "Пользователи", recalc: "users" },
  { key: "xp", label: "XP / Ранги" },
  { key: "trade", label: "OTC / P2P" },
];

type SubTab = "formula" | "data" | "history";
const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "formula", label: "Формула" },
  { key: "data", label: "Данные для расчёта" },
  { key: "history", label: "История" },
];

// Which reference catalogs belong to each entity's formula (opened in context).
const ENTITY_REFERENCES: Record<TabKey, { catalog: string; label: string; hint: string }[]> = {
  funds: [
    { catalog: "rating_crises", label: "Настроить кризисные периоды", hint: "Устойчивость к кризисам" },
    { catalog: "rating_jurisdictions", label: "Настроить юрисдикции", hint: "Юрисдикция и регулирование" },
  ],
  persons: [
    { catalog: "rating_role_catalog", label: "Настроить роли", hint: "Активность в проектах" },
    { catalog: "rating_partnership_types", label: "Настроить типы партнёрств", hint: "Партнёрства" },
    { catalog: "rating_media_source_tiers", label: "Настроить медиаисточники", hint: "Медиаактивность" },
  ],
  projects: [
    { catalog: "rating_red_flag_catalog", label: "Настроить Red Flags", hint: "Красные флаги проекта" },
    { catalog: "rating_jurisdictions", label: "Настроить юрисдикции", hint: "География проекта" },
    { catalog: "rating_role_catalog", label: "Настроить роли команды", hint: "Персоны и команда" },
  ],
  twitter: [
    { catalog: "rating_tier_registry", label: "Настроить Tier-1 реестр", hint: "Аудитория Tier-1" },
  ],
  users: [],
  trade: [],
};

const REF_LABELS: Record<string, string> = {
  rating_crises: "Системные кризисы",
  rating_jurisdictions: "Юрисдикции",
  rating_tier_registry: "Реестр Tier-1",
  rating_red_flag_catalog: "Каталог Red Flags",
  rating_role_catalog: "Роли персон",
  rating_partnership_types: "Типы партнёрств",
  rating_media_source_tiers: "Тиры медиаисточников",
};

const PROV_LABEL: Record<string, string> = {
  derived: "реальный источник",
  manual: "ручной ввод",
  mock: "демо (mock)",
  missing: "нет данных",
  stale: "устарело",
};

const STATE_LABEL: Record<string, string> = {
  idle: "Ожидание",
  running: "Выполняется",
  completed: "Завершено",
  failed: "Ошибка",
};

const SAMPLE_INPUTS: Record<string, any> = {
  funds: { monthsActive: 150, majorDeals: 5, successfulExits: 5, avgRoiMultiple: 4, crisesSurvived: 3, complianceScore: 15 },
  persons: {
    investingSuccess: 80,
    advisorSuccess: 70,
    twitter: 75,
    marketExperience: 60,
    projectActivity: 50,
    mediaActivity: 60,
    marketInfluence: 40,
    partnerships: 50,
  },
  projects: {
    fundsQuality: 80,
    personsQuality: 70,
    developmentTeam: 75,
    tokenomics: 65,
    niche: 80,
    geography: 60,
    competitors: 70,
    twitter: 75,
    redFlags: 1,
  },
  twitter: {
    followers: 500000,
    followerQuality: 70,
    engagementRate: 5,
    postingFrequency: 80,
    reputation: 80,
    cryptoInfluence: 70,
    tier1Audience: 60,
  },
  users: {
    activityXP: 720,
    otc: { volume: 500000, completedTrades: 50, avgReview: 4.8, reviewCount: 20, uniqueCounterparties: 20 },
    p2p: { volume: 20000, completedTrades: 10, avgReview: 4.5, reviewCount: 8, uniqueCounterparties: 6 },
    nftSubscription: { nftCount: 1, membershipDays: 240, subscriptionMonths: 8 },
    redFlags: 0,
  },
  trade: {
    otc: { volume: 25000, completedTrades: 15, avgReview: 4.8, reviewCount: 12, uniqueCounterparties: 9 },
    p2p: { volume: 10000, completedTrades: 8, avgReview: 4.6, reviewCount: 7, uniqueCounterparties: 6 },
  },
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const sum = (obj: Record<string, number>) =>
  Object.values(obj || {}).reduce((a, b) => a + Number(b || 0), 0);
const round2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const formatDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("ru-RU");
};

/* ------------------------------ atoms ------------------------------ */

const InputField = ({
  label,
  hint,
  value,
  onChange,
  testid,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  testid: string;
}) => {
  const classes = useStyles();
  return (
    <label className={classes.fieldRow}>
      <span>
        <code>{label}</code>
        {hint ? <small>{hint}</small> : null}
      </span>
      <input
        className={classes.input}
        type="number"
        step="any"
        value={Math.round((Number(value) + Number.EPSILON) * 100) / 100}
        data-testid={testid}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    </label>
  );
};

const FieldGroup = ({
  title,
  obj,
  prefix,
  showSum = false,
  onChange,
}: {
  title: string;
  obj: Record<string, number>;
  prefix: string;
  showSum?: boolean;
  onChange: (key: string, value: number) => void;
}) => {
  const classes = useStyles();
  const total = round2(sum(obj));
  const ok = Math.abs(total - 100) <= 1;
  return (
    <section className={classes.section}>
      <div className={classes.sectionTitle}>
        <span>{title}</span>
        {showSum ? (
          <span className={`${classes.badge} ${ok ? classes.badgeOk : classes.badgeErr}`} data-testid={`${prefix}-sum`}>
            Σ {total} / 100
          </span>
        ) : null}
      </div>
      {Object.keys(obj).map((key) => (
        <InputField
          key={key}
          label={labelFor(key)}
          hint={hintFor(key)}
          value={obj[key]}
          testid={`${prefix}-${key}`}
          onChange={(v) => onChange(key, v)}
        />
      ))}
    </section>
  );
};

const ThresholdEditor = ({
  title,
  steps,
  prefix,
  onChange,
}: {
  title: string;
  steps: ThresholdStep[];
  prefix: string;
  onChange: (steps: ThresholdStep[]) => void;
}) => {
  const classes = useStyles();
  const update = (i: number, field: "at" | "points", v: number) => {
    const next = steps.map((s, idx) => (idx === i ? { ...s, [field]: v } : s));
    onChange(next);
  };
  return (
    <div className={classes.groupBlock}>
      <p className={classes.groupTitle}>{title}</p>
      <div className={classes.thresholdRow}>
        <small style={{ color: "#8592A4" }}>Порог (от)</small>
        <small style={{ color: "#8592A4" }}>Баллы / коэф.</small>
        <span />
      </div>
      {steps.map((s, i) => (
        <div className={classes.thresholdRow} key={i}>
          <input
            className={classes.input}
            type="number"
            step="any"
            value={s.at}
            data-testid={`${prefix}-at-${i}`}
            onChange={(e) => update(i, "at", Number(e.target.value))}
          />
          <input
            className={classes.input}
            type="number"
            step="any"
            value={s.points}
            data-testid={`${prefix}-pts-${i}`}
            onChange={(e) => update(i, "points", Number(e.target.value))}
          />
          <button
            type="button"
            className={classes.smallBtn}
            title="Удалить"
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

/* recursive preview input form */
const PreviewForm = ({
  value,
  prefix,
  onChange,
}: {
  value: any;
  prefix: string;
  onChange: (v: any) => void;
}) => {
  const classes = useStyles();
  return (
    <>
      {Object.entries(value).map(([key, v]) => {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          return (
            <div className={classes.groupBlock} key={key}>
              <p className={classes.groupTitle}>{labelFor(key)}</p>
              <PreviewForm
                value={v}
                prefix={`${prefix}-${key}`}
                onChange={(nv) => onChange({ ...value, [key]: nv })}
              />
            </div>
          );
        }
        const numericValue = Array.isArray(v) ? v.length : Number(v);
        if (key === "complianceScore") {
          return (
            <div className={classes.formField} key={key} style={{ padding: "7px 0", borderBottom: "1px dashed #EDF1F6" }}>
              <label className={classes.formLabel}>
                <code style={{ fontSize: 12.5, color: "#41506A", fontFamily: "'Source Code Pro', monospace" }}>{labelFor(key)}</code>
                {hintFor(key) ? <small style={{ display: "block", color: "#9AA6B6", fontSize: 11, marginTop: 2, fontWeight: 400 }}>{hintFor(key)}</small> : null}
              </label>
              <AdminSelect
                testid={`in-${prefix}-${key}`}
                value={String(numericValue)}
                options={[
                  { value: "0", label: "Офшор / нерегулируемая (0)" },
                  { value: "5", label: "Офшор с прозрачным юрлицом (5)" },
                  { value: "10", label: "Среднее регулирование — UAE/HK/JP/KR (10)" },
                  { value: "15", label: "Высокорегулируемая — US/UK/EU/CH/SG (15)" },
                ]}
                onChange={(v) => onChange({ ...value, [key]: Number(v) })}
              />
            </div>
          );
        }
        return (
          <InputField
            key={key}
            label={labelFor(key)}
            hint={hintFor(key)}
            value={numericValue}
            testid={`in-${prefix}-${key}`}
            onChange={(n) => onChange({ ...value, [key]: n })}
          />
        );
      })}
    </>
  );
};

const modeClass = (classes: any, mode?: string) =>
  mode === "derived"
    ? classes.srcDerived
    : mode === "manual"
    ? classes.srcManual
    : mode === "mock"
    ? classes.srcMock
    : mode === "stale"
    ? classes.srcStale
    : classes.srcMissing;

const SourceBadge = ({ source }: { source?: string }) => {
  const classes = useStyles();
  if (!source) return null;
  return <span className={`${classes.srcBadge} ${modeClass(classes, source)}`}>{sourceLabel(source)}</span>;
};

const ProvenanceLegend = () => {
  const classes = useStyles();
  return (
    <div className={classes.provLegend} data-testid="provenance-legend">
      {["derived", "manual", "mock", "missing", "stale"].map((m) => (
        <span key={m} className={`${classes.srcBadge} ${modeClass(classes, m)}`}>{PROV_LABEL[m]}</span>
      ))}
    </div>
  );
};

const ProvenancePanel = ({ provenance }: { provenance: any }) => {
  const classes = useStyles();
  if (!provenance) return null;
  return (
    <div className={classes.provPanel} data-testid="provenance-panel">
      <div className={classes.sectionTitle} style={{ marginBottom: 6 }}>
        <span>Происхождение данных</span>
        <span className={`${classes.srcBadge} ${modeClass(classes, provenance.mode)}`} data-testid="prov-overall-mode">
          {PROV_LABEL[provenance.mode] || provenance.mode}
        </span>
      </div>
      <div className={classes.tradeSummary} style={{ marginBottom: 8 }}>
        <div className={classes.tradeStat}><span>Источник</span><strong>{provenance.source || "—"}</strong></div>
        <div className={classes.tradeStat}><span>Полнота</span><strong>{provenance.completeness}%</strong></div>
        <div className={classes.tradeStat}><span>Свежесть</span><strong>{provenance.freshness}%</strong></div>
      </div>
      <ProvenanceLegend />
      <table className={classes.refTable}>
        <thead><tr><th>Показатель</th><th>Режим</th><th>Наблюдалось</th><th>Возраст (дн.)</th></tr></thead>
        <tbody>
          {Object.values(provenance.components || {}).map((c: any) => (
            <tr key={c.key}>
              <td>{labelFor(c.key)}</td>
              <td><span className={`${classes.srcBadge} ${modeClass(classes, c.mode)}`}>{PROV_LABEL[c.mode] || c.mode}</span></td>
              <td>{c.observedAt ? new Date(c.observedAt).toLocaleDateString("ru-RU") : "—"}</td>
              <td>{c.ageDays ?? "—"}{c.ttlDays ? ` / TTL ${c.ttlDays}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BreakdownTable = ({ result }: { result: UnifiedScoreResult }) => {
  const classes = useStyles();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const rows = Object.entries(result.components || {});
  if (!rows.length) return null;
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <table className={classes.breakdownTable} data-testid="preview-breakdown">
      <thead>
        <tr>
          <th>Показатель</th>
          <th>Значение</th>
          <th>Вес</th>
          <th>Вклад</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([key, c]) => {
          const sub = (c as any).sub as any[] | undefined;
          const hasSub = Array.isArray(sub) && sub.length > 0;
          const isOpen = !!open[key];
          return (
            <React.Fragment key={key}>
              <tr>
                <td>
                  {labelFor(key)}
                  <SourceBadge source={(c as any).source} />
                  {hasSub ? (
                    <span
                      className={classes.subToggle}
                      onClick={() => toggle(key)}
                      data-testid={`sub-toggle-${key}`}
                    >
                      {isOpen ? "▲ скрыть расчёт" : "▼ как рассчитано"}
                    </span>
                  ) : null}
                </td>
                <td>{c.raw}</td>
                <td>{c.weight}</td>
                <td>{c.contribution}</td>
              </tr>
              {hasSub && isOpen
                ? sub!.map((sc, i) => (
                    <tr
                      key={`${key}-sub-${sc.key || i}`}
                      className={`${classes.subRow} ${sc.penalty ? classes.subPenalty : ""}`}
                    >
                      <td>↳ {subLabelFor(sc.key)}</td>
                      <td>{sc.raw}</td>
                      <td>{sc.normalized}</td>
                      <td>{sc.contribution}</td>
                    </tr>
                  ))
                : null}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};

/* ------------------------------ page ------------------------------ */

const RAW_SAMPLE: Record<string, string> = {
  funds: `{
  "monthsActive": 60,
  "majorDeals": [{ "role": "leadLargeRound" }, { "role": "confirmed" }],
  "exits": { "successfulCount": 8, "totalCount": 12 },
  "roi": { "medianRoi": 5, "profitableRatio": 0.7, "realisedShare": 0.5 },
  "crises": [{ "name": "FTX 2022", "operationalContinuity": 100, "portfolioSurvival": 80, "noCriticalDefaults": 100, "continuedInvestment": 60, "reputationStability": 90 }],
  "compliance": { "jurisdictionPoints": 15, "hasLicense": true, "beneficiaryTransparency": true }
}`,
  persons: `{
  "investingSuccess": { "medianRoi": 4, "profitableRatio": 0.8, "realisedShare": 0.5, "consistency": 70, "dataConfidence": 90 },
  "mediaActivity": { "tier1Mentions": 12, "industryMentions": 38, "interviews": 6, "conferences": 3, "recencyDays": 12 },
  "marketExperience": { "yearsActive": 6, "continuity": 80, "marketCycles": 2, "verifiedHistory": 90 }
}`,
  projects: `{
  "developmentTeam": { "verifiedIdentities": 1, "relevantExperience": 80, "previousProducts": 2, "pastProjectSuccess": 70, "technicalCompetence": 85, "reputationIncidents": 90 },
  "tokenomics": { "teamInvestorAllocationScore": 70, "vestingScore": 80, "unlockPressureScore": 60, "fdvAdequacyScore": 65, "initialCirculationScore": 55, "utilityDemandScore": 70 },
  "fundsQuality": [{ "name": "A16Z", "score": 90, "weight": 2 }, { "name": "Seed VC", "score": 60, "weight": 1 }]
}`,
  twitter: `{
  "followers": 125000,
  "followerQuality": { "realAccountRatio": 0.9, "activeFollowerRatio": 0.6, "topFollowerScore": 70, "audienceRelevance": 80, "suspiciousFollowerRatio": 0.1 },
  "engagement": { "medianEngagementRate": 4.5, "commentQuality": 70, "uniqueEngagersRatio": 0.5, "shareRate": 2, "engagementStability": 60 },
  "postingFrequency": { "postsPer30Days": 12, "activeDaysRatio": 0.6, "lastPostDays": 2 }
}`,
  users: `{
  "activityXP": 720,
  "otc": { "volume": 500000, "completedTrades": 50, "avgReview": 4.8, "reviewCount": 20, "uniqueCounterparties": 20 },
  "p2p": { "volume": 60000, "completedTrades": 80, "avgReview": 4.9, "reviewCount": 40, "uniqueCounterparties": 40 },
  "nftSubscription": { "hasNft": true, "nftCount": 1, "tier": "premium", "membershipDays": 240, "subscriptionActive": true, "subscriptionMonths": 8 },
  "launchpad": null,
  "redFlags": 0
}`,
  trade: `{
  "p2p": { "volume": 60000, "completedTrades": 80, "avgReview": 4.9, "reviewCount": 40, "uniqueCounterparties": 40 },
  "otc": {}
}`,
};

/* --------------------- reference directories panel --------------------- */
const sanitizeRef = (it: any) => {
  const { _id, updatedBy, updatedAt, createdAt, ...rest } = it || {};
  return rest;
};

const ReferencesPanel = () => {
  const classes = useStyles();
  const [catalogs, setCatalogs] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ item: any; isNew: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetchReferenceCatalogs();
      if (res.success && res.data?.catalogs?.length) {
        setCatalogs(res.data.catalogs);
        setCatalog(res.data.catalogs[0]);
      }
    })();
  }, []);

  const loadItems = useCallback(async (cat: string) => {
    if (!cat) return;
    setBusy(true);
    const res = await fetchReferenceItems(cat);
    setBusy(false);
    if (res.success) setItems(res.data?.items || []);
    else toast.error(res.error || "Не удалось загрузить справочник");
  }, []);

  useEffect(() => { if (catalog) loadItems(catalog); }, [catalog, loadItems]);

  const save = async (body: any) => {
    const code = body.code;
    if (!code) { toast.error("Укажите code"); return; }
    const res = await upsertReferenceItem(catalog, code, body);
    if (!res.success) { toast.error(res.error || "Ошибка сохранения"); return; }
    toast.success("Сохранено");
    setEditing(null);
    loadItems(catalog);
  };

  const remove = async (code: string) => {
    const res = await deleteReferenceItem(catalog, code);
    if (!res.success) { toast.error(res.error || "Нельзя удалить (системная запись — отключите её)"); return; }
    toast.success("Удалено");
    loadItems(catalog);
  };

  const columns = useMemo(() => {
    const keys = new Set<string>();
    items.slice(0, 20).forEach((it) => Object.keys(it).forEach((k) => { if (!["_id", "updatedBy", "updatedAt", "createdAt"].includes(k)) keys.add(k); }));
    const preferred = ["code", "name", "countryName", "title", "type", "startDate", "endDate", "baseScore", "regulationTier", "tier", "weight", "rating", "severity", "defaultPenalty", "enabled", "system"];
    return [...preferred.filter((k) => keys.has(k)), ...[...keys].filter((k) => !preferred.includes(k))];
  }, [items]);

  return (
    <div className={classes.card} data-testid="references-panel">
      <div className={classes.cardHead}>
        <div>
          <h2>Справочники рейтинга</h2>
          <p>Кризисы, юрисдикции, Tier-1, Red Flags, роли, партнёрства и медиаисточники. Системные записи (system) редактируются, но не удаляются.</p>
        </div>
      </div>
      <div className={classes.refToolbar}>
        <select
          className={`${classes.input} ${classes.selectField}`}
          value={catalog}
          data-testid="ref-catalog-select"
          onChange={(e) => { setEditing(null); setCatalog(e.target.value); }}
        >
          {catalogs.map((c) => <option key={c} value={c}>{REF_LABELS[c] || c}</option>)}
        </select>
        <button
          className={`${classes.btn} ${classes.btnPrimary}`}
          data-testid="ref-add-btn"
          onClick={() => setEditing({ item: { code: "", enabled: true }, isNew: true })}
        >
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
            <tr>{columns.map((c) => <th key={c}>{c}</th>)}<th>Действия</th></tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id || it.code}>
                {columns.map((c) => (
                  <td key={c}>
                    {typeof it[c] === "object" ? JSON.stringify(it[c]) : c === "system" ? (it[c] ? "system" : "—") : String(it[c] ?? "—")}
                  </td>
                ))}
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className={classes.smallBtn} title="Редактировать" onClick={() => setEditing({ item: it, isNew: false })}>✎</button>
                  {!it.system ? <button className={classes.smallBtn} title="Удалить" onClick={() => remove(it.code)}>×</button> : null}
                </td>
              </tr>
            ))}
            {!items.length && !busy ? <tr><td colSpan={columns.length + 1} style={{ color: "#8592A4" }}>Нет записей.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminRatingPage = () => {
  const classes = useStyles();
  const [config, setConfig] = useState<UnifiedRatingConfig | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [version, setVersion] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<Record<string, UnifiedRuntimeState> | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("funds");
  const [subTab, setSubTab] = useState<SubTab>("formula");
  const [refDrawer, setRefDrawer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [previewInput, setPreviewInput] = useState<any>({});
  const [previewResult, setPreviewResult] = useState<UnifiedScoreResult | null>(null);
  const [previewProvenance, setPreviewProvenance] = useState<any>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedJson, setAdvancedJson] = useState("");
  const [recalcId, setRecalcId] = useState("");
  const [recalcBusy, setRecalcBusy] = useState(false);
  const [recalcSelected, setRecalcSelected] = useState<EntityHit | null>(null);
  const [recalcCurrent, setRecalcCurrent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItems, setSearchItems] = useState<{ id: string; label: string; score: number | null }[]>([]);
  const [recalcDiff, setRecalcDiff] = useState<{ before: any; changed: Record<string, { from: number; to: number }>; score: number; result?: UnifiedScoreResult } | null>(null);

  const fingerprint = useMemo(() => (config ? JSON.stringify(config) : ""), [config]);
  const isDirty = fingerprint !== savedFingerprint;

  const applyConfigResponse = (data: any) => {
    setConfig(data.config);
    setSavedFingerprint(JSON.stringify(data.config));
    setVersion(data.version);
    setUpdatedAt(data.updatedAt);
    setRuntime(data.runtime);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const res = await fetchUnifiedConfig();
    if (!res.success || !res.data?.config) {
      setLoadError(res.error || "Не удалось загрузить настройки рейтинга.");
      setLoading(false);
      return;
    }
    applyConfigResponse(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || loadError) return undefined;
    const timer = window.setInterval(async () => {
      const res = await fetchUnifiedStatus();
      if (res.success && res.data?.runtime) setRuntime(res.data.runtime);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loading, loadError]);

  useEffect(() => {
    setPreviewInput(clone(SAMPLE_INPUTS[activeTab] || {}));
    setPreviewResult(null);
    setPreviewProvenance(null);
    setPreviewError("");
  }, [activeTab]);

  const updateConfig = (mutator: (draft: UnifiedRatingConfig) => void) => {
    setConfig((current) => {
      if (!current) return current;
      const next = clone(current);
      mutator(next);
      return next;
    });
  };

  const updateSubFormula = (
    entity: "funds" | "persons" | "twitter" | "projects" | "users",
    compKey: string,
    formula: any
  ) =>
    updateConfig((d) => {
      if (!(d as any).subFormulas) (d as any).subFormulas = {};
      if (!(d as any).subFormulas[entity]) (d as any).subFormulas[entity] = {};
      (d as any).subFormulas[entity][compKey] = formula;
    });

  const validateSubWeights = (cfg: UnifiedRatingConfig): string | null => {
    const sf: any = (cfg as any).subFormulas;
    if (!sf) return null;
    for (const entity of ["funds", "persons", "twitter", "projects", "users"]) {
      const group = sf[entity] || {};
      for (const [k, f] of Object.entries<any>(group)) {
        const subs = f?.kind === "weighted" ? f.subs : f?.kind === "resilience" ? f.crisisSubs : null;
        if (Array.isArray(subs) && subs.length) {
          const total = round2(
            subs.filter((s: any) => !s.penalty).reduce((a: number, s: any) => a + Number(s.weight || 0), 0)
          );
          if (Math.abs(total - 100) > 1)
            return `Подформула «${f.label || k}»: суб-веса должны в сумме давать 100 (сейчас ${total})`;
        }
      }
    }
    return null;
  };

  const validate = (cfg: UnifiedRatingConfig): string | null => {
    const checks: [string, number][] = [
      ["Персоны", sum(cfg.persons.weights)],
      ["Проекты", sum(cfg.projects.weights)],
      ["Twitter", sum(cfg.twitter.weights)],
      ["Пользователи", sum(cfg.users.weights as any)],
      ["Фонды (макс. баллов)", sum(cfg.funds.limits)],
    ];
    for (const [name, total] of checks) {
      if (Math.abs(total - 100) > 1) return `${name}: сумма должна быть 100 (сейчас ${round2(total)})`;
    }
    return null;
  };

  const save = async () => {
    if (!config || version === null) return;
    const err = validate(config) || validateSubWeights(config);
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    const res = await saveUnifiedConfig(version, config);
    setSaving(false);
    if (!res.success || !res.data?.config) {
      toast.error(res.error || "Не удалось сохранить настройки.");
      return;
    }
    applyConfigResponse(res.data);
    toast.success("Настройки рейтинга сохранены.");
  };

  const runPreview = async () => {
    if (!config) return;
    setPreviewError("");
    setPreviewProvenance(null);
    let input = previewInput;
    const useRaw = advancedOpen && advancedJson.trim().length > 0;
    if (useRaw) {
      try {
        input = JSON.parse(advancedJson);
      } catch (e) {
        setPreviewError("Некорректный JSON в расширенном вводе.");
        return;
      }
    }
    setPreviewing(true);
    if (useRaw) {
      // Integration-ready path: raw DTO -> normalizer -> engine + PROVENANCE.
      const res = await previewUnifiedRaw(activeTab, input, "admin-preview");
      setPreviewing(false);
      if (!res.success || !res.data?.result) {
        setPreviewError(res.error || "Не удалось рассчитать предпросмотр.");
        return;
      }
      setPreviewResult(res.data.result);
      setPreviewProvenance(res.data.provenance || null);
      return;
    }
    const entityType = activeTab === "trade" ? "users" : activeTab;
    const res = await previewUnified(entityType, input, config);
    setPreviewing(false);
    if (!res.success || !res.data?.result) {
      setPreviewError(res.error || "Не удалось рассчитать предпросмотр.");
      return;
    }
    setPreviewResult(res.data.result);
  };

  const runRecalc = async (entityType: string, entityId?: string) => {
    setRecalcBusy(true);
    const res = await recalculateUnified(entityType as any, entityId);
    setRecalcBusy(false);
    if (!res.success) {
      toast.error(res.error || "Не удалось запустить пересчёт.");
      return;
    }
    if (res.data?.accepted === false) {
      if (res.data.reason === "already_running") toast.warning("Пересчёт уже выполняется.");
      else if (res.data.reason === "no_data") toast.info("Нет данных для пересчёта.");
      else toast.warning("Раздел отключён.");
    } else if (entityId) {
      toast.success(`Пересчитано: ${entityId}`);
      if (res.data?.result) setPreviewResult(res.data.result);
      setRecalcDiff({
        before: res.data?.before || null,
        changed: res.data?.changed || {},
        score: res.data?.result?.score,
        result: res.data?.result,
      });
    } else {
      toast.success(`Массовый пересчёт запущен (найдено: ${res.data?.matched ?? "?"}).`);
    }
    const status = await fetchUnifiedStatus();
    if (status.success) setRuntime(status.data.runtime);
  };

  const doSearch = async (entityType: string, q: string) => {
    setSearchQuery(q);
    setRecalcId("");
    if (q.trim().length < 2) {
      setSearchItems([]);
      return;
    }
    const res = await searchUnified(entityType, q.trim());
    if (res.success) setSearchItems(res.data.items || []);
  };

  const searchRecalcEntities = async (entityType: string, q: string): Promise<EntityHit[]> => {
    const res = await searchUnified(entityType, q);
    return res.success && res.data?.items ? (res.data.items as EntityHit[]) : [];
  };

  const pickRecalcEntity = async (entityType: string, hit: EntityHit) => {
    setRecalcSelected(hit);
    setRecalcId(hit.id);
    setRecalcCurrent(null);
    const res = await fetchCurrentRating(entityType, hit.id);
    if (res.success) setRecalcCurrent(res.data || null);
  };

  const renderConfigEditor = () => {
    if (!config) return null;
    switch (activeTab) {
      case "funds":
        return (
          <>
            <FieldGroup title="Максимум баллов (Σ = 100)" obj={config.funds.limits} prefix="fund-limit" showSum onChange={(k, v) => updateConfig((d) => { d.funds.limits[k] = v; })} />
            {config.funds.rates && Object.keys(config.funds.rates).length ? (
              <FieldGroup title="Устаревшие коэффициенты (не используются подформулами)" obj={config.funds.rates as any} prefix="fund-rate" onChange={(k, v) => updateConfig((d) => { (d.funds.rates as any)[k] = v; })} />
            ) : null}
            <p style={{ fontSize: 12, color: "#7A879A", margin: "4px 0 10px", lineHeight: "17px" }} data-testid="fund-longevity-note">
              Срок работы фонда считается по КАНОНИЧЕСКОЙ ступенчатой модели:
              &lt;1г=2, 1–2г=6, 2–4г=12, 4–6л=18, 6–10л=22, 10+л=25 баллов. В подформуле ниже
              таблица задаёт нормализацию 0–100, итоговый вклад = нормализация / 100 × максимум 25.
              Линейная схема «1 балл за 6 месяцев» больше не используется.
            </p>
            {config.subFormulas?.funds ? (
              <SubFormulaEditor entity="funds" formulas={config.subFormulas.funds as any} onChange={(k, f) => updateSubFormula("funds", k, f)} />
            ) : null}
          </>
        );
      case "persons":
        return (
          <>
            <FieldGroup title="Веса Person Score (Σ = 100)" obj={config.persons.weights} prefix="person-w" showSum onChange={(k, v) => updateConfig((d) => { d.persons.weights[k] = v; })} />
            {config.subFormulas?.persons ? (
              <SubFormulaEditor entity="persons" formulas={config.subFormulas.persons as any} onChange={(k, f) => updateSubFormula("persons", k, f)} />
            ) : null}
          </>
        );
      case "projects":
        return (
          <>
            <FieldGroup title="Веса Project Score (Σ = 100)" obj={config.projects.weights} prefix="project-w" showSum onChange={(k, v) => updateConfig((d) => { d.projects.weights[k] = v; })} />
            <FieldGroup title="Штрафы за red flags" obj={config.projects.redFlags} prefix="project-rf" onChange={(k, v) => updateConfig((d) => { (d.projects.redFlags as any)[k] = v; })} />
            {config.subFormulas?.projects ? (
              <SubFormulaEditor entity="projects" formulas={config.subFormulas.projects as any} onChange={(k, f) => updateSubFormula("projects", k, f)} />
            ) : null}
          </>
        );
      case "twitter":
        return (
          <>
            <FieldGroup title="Веса Twitter Score (Σ = 100)" obj={config.twitter.weights} prefix="tw-w" showSum onChange={(k, v) => updateConfig((d) => { d.twitter.weights[k] = v; })} />
            <FieldGroup title="Нормализация входных данных" obj={config.twitter.normalization} prefix="tw-norm" onChange={(k, v) => updateConfig((d) => { (d.twitter.normalization as any)[k] = v; })} />
            {config.subFormulas?.twitter ? (
              <SubFormulaEditor entity="twitter" formulas={config.subFormulas.twitter as any} onChange={(k, f) => updateSubFormula("twitter", k, f)} />
            ) : null}
          </>
        );
      case "users":
        return (
          <>
            <FieldGroup title="FOMO Score — веса компонентов (Σ = 100)" obj={config.users.weights as any} prefix="user-w" showSum onChange={(k, v) => updateConfig((d) => { (d.users.weights as any)[k] = v; })} />
            <div className={classes.section}>
              <div className={classes.sectionTitle}><span>XP Reputation — нормализация</span></div>
              <InputField label="Максимум XP" hint="при этом значении XP-репутация равна 100" testid="user-xp-max"
                value={(config.users as any).xpReputation?.activityXpMax ?? 1000}
                onChange={(v) => updateConfig((d) => { (d.users as any).xpReputation = { ...((d.users as any).xpReputation || {}), activityXpMax: v }; })} />
            </div>
            {(config.users as any).nftSubscription ? (
              <FieldGroup
                title="NFT / Подписка — entitlement (не staking days)"
                obj={{
                  hasNftPoints: (config.users as any).nftSubscription.hasNftPoints,
                  membershipPoints: (config.users as any).nftSubscription.membershipPoints,
                  subscriptionContinuityPoints: (config.users as any).nftSubscription.subscriptionContinuityPoints,
                  membershipDaysMax: (config.users as any).nftSubscription.membershipDaysMax,
                }}
                prefix="user-nft"
                onChange={(k, v) => updateConfig((d) => { (d.users as any).nftSubscription[k] = v; })}
              />
            ) : null}
            {(config.users as any).riskPenalties ? (
              <FieldGroup
                title="Штраф за риск (применяется после базового score)"
                obj={(config.users as any).riskPenalties}
                prefix="user-risk"
                onChange={(k, v) => updateConfig((d) => { (d.users as any).riskPenalties[k] = v; })}
              />
            ) : null}
            <p style={{ fontSize: 12, color: "#7A879A", marginTop: 12, lineHeight: "18px" }} data-testid="user-model-note">
              <b>Новая модель FOMO Score.</b> Единая цепочка: действия пользователя → единый XP →
              XP Rank → XP Reputation. Итог = XP Reputation×{round2((config.users.weights as any).xpReputation)}% +
              Торговая репутация×{round2((config.users.weights as any).tradeReputation)}% +
              Launchpad×{round2((config.users.weights as any).launchpad)}% +
              NFT/Подписка×{round2((config.users.weights as any).nftSubscription)}%, затем вычитается штраф за риск.
              <br />
              Комментарии, рефералы, EarlyLand и NFT-стейкинг <b>не</b> входят в формулу напрямую — они
              являются источниками XP (см. вкладку «XP / Ранги»). Двойного учёта нет. Launchpad при
              отсутствии данных = «нет данных» (missing), а не 0. Блок NFT/Подписка оценивает
              entitlement (наличие/tier/срок членства/подписка), но <b>не</b> дни стейкинга.
            </p>
          </>
        );
      case "trade":
        return (
          <>
            <FieldGroup title="OTC — максимум по компонентам" obj={config.users.trade.otc.componentMax} prefix="otc-max" onChange={(k, v) => updateConfig((d) => { (d.users.trade.otc.componentMax as any)[k] = v; })} />
            <ThresholdEditor title="OTC — пороги объёма (USDT → баллы)" steps={config.users.trade.otc.volumeThresholds} prefix="otc-vol" onChange={(s) => updateConfig((d) => { d.users.trade.otc.volumeThresholds = s; })} />
            <ThresholdEditor title="OTC — пороги количества сделок" steps={config.users.trade.otc.tradeThresholds} prefix="otc-trd" onChange={(s) => updateConfig((d) => { d.users.trade.otc.tradeThresholds = s; })} />
            <ThresholdEditor title="OTC — пороги уникальных контрагентов" steps={config.users.trade.otc.counterpartyThresholds} prefix="otc-cp" onChange={(s) => updateConfig((d) => { d.users.trade.otc.counterpartyThresholds = s; })} />
            <FieldGroup title="P2P — максимум по компонентам" obj={config.users.trade.p2p.componentMax} prefix="p2p-max" onChange={(k, v) => updateConfig((d) => { (d.users.trade.p2p.componentMax as any)[k] = v; })} />
            <ThresholdEditor title="P2P — пороги объёма (USDT → баллы)" steps={config.users.trade.p2p.volumeThresholds} prefix="p2p-vol" onChange={(s) => updateConfig((d) => { d.users.trade.p2p.volumeThresholds = s; })} />
            <ThresholdEditor title="P2P — пороги количества сделок" steps={config.users.trade.p2p.tradeThresholds} prefix="p2p-trd" onChange={(s) => updateConfig((d) => { d.users.trade.p2p.tradeThresholds = s; })} />
            <ThresholdEditor title="P2P — пороги уникальных контрагентов" steps={config.users.trade.p2p.counterpartyThresholds} prefix="p2p-cp" onChange={(s) => updateConfig((d) => { d.users.trade.p2p.counterpartyThresholds = s; })} />
            {config.users.trade.shared ? (
              <>
                <div className={classes.section}>
                  <div className={classes.sectionTitle}><span>Единая репутация — веса (ядро + опыт = 1)</span></div>
                  <InputField label="Вес общего ядра" hint="доля переносимой репутации" testid="trade-core-weight"
                    value={config.users.trade.coreWeight ?? 0.7}
                    onChange={(v) => updateConfig((d) => { (d.users.trade as any).coreWeight = v; })} />
                  <InputField label="Вес активного опыта" hint="доля опыта текущего рынка" testid="trade-exp-weight"
                    value={config.users.trade.experienceWeight ?? 0.3}
                    onChange={(v) => updateConfig((d) => { (d.users.trade as any).experienceWeight = v; })} />
                </div>
                <FieldGroup title="Общее ядро — максимум по компонентам" obj={config.users.trade.shared.componentMax} prefix="shared-max" onChange={(k, v) => updateConfig((d) => { (d.users.trade.shared!.componentMax as any)[k] = v; })} />
                <ThresholdEditor title="Общее ядро — пороги объёма (суммарно, USDT → баллы)" steps={config.users.trade.shared.volumeThresholds} prefix="shared-vol" onChange={(s) => updateConfig((d) => { d.users.trade.shared!.volumeThresholds = s; })} />
                <ThresholdEditor title="Общее ядро — пороги количества сделок (суммарно)" steps={config.users.trade.shared.tradeThresholds} prefix="shared-trd" onChange={(s) => updateConfig((d) => { d.users.trade.shared!.tradeThresholds = s; })} />
                <ThresholdEditor title="Общее ядро — пороги уникальных контрагентов (суммарно)" steps={config.users.trade.shared.counterpartyThresholds} prefix="shared-cp" onChange={(s) => updateConfig((d) => { d.users.trade.shared!.counterpartyThresholds = s; })} />
              </>
            ) : null}
            <ThresholdEditor title="Коэффициент доверия к отзывам (кол-во → коэф.)" steps={config.users.trade.reviewConfidence} prefix="review-conf" onChange={(s) => updateConfig((d) => { d.users.trade.reviewConfidence = s; })} />
            <FieldGroup title="Штрафы за нарушения" obj={config.users.trade.riskPenalties} prefix="trade-risk" onChange={(k, v) => updateConfig((d) => { (d.users.trade.riskPenalties as any)[k] = v; })} />
            <div className={classes.section}>
              <div className={classes.sectionTitle}><span>Уровни торговой репутации</span></div>
              <div className={classes.rankLegend}>
                {config.users.trade.ranks.map((r) => (
                  <span className={classes.rankChip} key={r.key}>{r.label} · {r.min}–{r.max}</span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "#7A879A", marginTop: 12, lineHeight: "18px" }} data-testid="trade-rules-note">
                В рейтинг попадают только завершённые валидные сделки. Исключаются: self-trade,
                тестовые, дубли, отменённые и признанные фиктивными сделки. Объём считается в
                эквиваленте USDT по курсу на момент сделки. Подтверждённые нарушения (проигранный
                спор, повторное нарушение) учитываются отдельными штрафами; критическое мошенничество
                блокирует рейтинг. Ранги 🐚–🐋 относятся только к торговой репутации, не к общему
                рейтингу пользователя.
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderPreviewResult = () => {
    if (!previewResult) return null;
    const trade = (previewResult.meta as any)?.trade;
    if (activeTab === "trade" && trade) {
      return (
        <div data-testid="preview-result">
          <div className={classes.previewScore}>
            <span className={classes.previewValue} data-testid="trade-combined">{trade.combinedTradeScore}</span>
            <span className={classes.previewLevel} data-testid="trade-rank">{trade.tradeRank}</span>
            <span className={classes.badge}>Единая торговая репутация</span>
          </div>
          <div className={classes.tradeSummary} style={{ marginTop: 12 }}>
            <div className={classes.tradeStat}><span>Общее ядро (70%)</span><strong data-testid="trade-shared-core">{trade.sharedCore}</strong></div>
            <div className={classes.tradeStat}><span>OTC-опыт</span><strong data-testid="trade-otc">{trade.otcExperience ?? trade.otcScore}</strong></div>
            <div className={classes.tradeStat}><span>P2P-опыт</span><strong data-testid="trade-p2p">{trade.p2pExperience ?? trade.p2pScore}</strong></div>
          </div>
          <p style={{ fontSize: 12, color: "#7A879A", marginTop: 10, lineHeight: "18px" }} data-testid="trade-unified-note">
            Ранг 🐚–🐋 присваивается по <b>единой</b> репутации, а не отдельно по OTC/P2P.
            Общее ядро считается по суммарным сделкам обоих направлений (объём, завершённые
            сделки, отзывы, контрагенты, споры), поэтому репутация переносится между рынками:
            торгуя только в P2P, пользователь сохраняет ранг и в OTC, но его OTC-опыт при этом
            честно показывается отдельно (может быть 0). Итог = Ядро×{trade.meta?.coreWeight ?? 0.7} + Активный&nbsp;опыт×{trade.meta?.experienceWeight ?? 0.3}.
          </p>
          <BreakdownTable result={trade as UnifiedScoreResult} />
        </div>
      );
    }
    return (
      <div data-testid="preview-result">
        <div className={classes.previewScore}>
          <span className={classes.previewValue} data-testid="preview-score">{previewResult.score}</span>
          {previewResult.level ? <span className={classes.previewLevel} data-testid="preview-level">{previewResult.level}</span> : null}
          <span className={classes.badge} data-testid="preview-completeness">Данные: {previewResult.completeness}%</span>
        </div>
        <BreakdownTable result={previewResult} />
        {previewResult.penalties?.length ? (
          <div style={{ marginTop: 12 }}>
            {previewResult.penalties.map((p) => (
              <span key={p.key} className={`${classes.pill} ${classes.pillErr}`}>{labelFor(p.key)}: {p.value} ({p.reason})</span>
            ))}
          </div>
        ) : null}
        {previewResult.missingFields?.length ? (
          <div style={{ marginTop: 6 }}>
            {previewResult.missingFields.map((f) => (
              <span key={f} className={`${classes.pill} ${classes.pillMuted}`}>нет данных: {labelFor(f)}</span>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const currentTab = TABS.find((t) => t.key === activeTab);
  const entityRuntime = currentTab?.recalc ? runtime?.[currentTab.recalc] : undefined;

  return (
    <Layout>
      <main className={classes.page} data-testid="admin-rating-page">
        <header className={classes.header}>
          <div>
            <h1>Рейтинги</h1>
            <p>Настройка формул рейтинга фондов, персон, проектов, пользователей и торговой репутации.</p>
          </div>
          <div className={classes.badgeRow}>
            <span className={`${classes.badge} ${isDirty ? classes.badgeWarn : classes.badgeOk}`} data-testid="dirty-badge">
              {isDirty ? "Есть несохранённые изменения" : "Сохранено"}
            </span>
          </div>
        </header>

        <div className={classes.tabs} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`${classes.tab} ${activeTab === tab.key ? classes.tabActive : ""}`}
              data-testid={`tab-${tab.key}`}
              onClick={() => { setActiveTab(tab.key); setSubTab("formula"); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={classes.subNav} role="tablist" data-testid="entity-subnav" style={activeTab === "xp" ? { display: "none" } : undefined}>
          {SUB_TABS.map((st) => (
            <button
              key={st.key}
              type="button"
              role="tab"
              aria-selected={subTab === st.key}
              className={`${classes.subTab} ${subTab === st.key ? classes.subTabActive : ""}`}
              data-testid={`subtab-${st.key}`}
              onClick={() => setSubTab(st.key)}
            >
              {st.label}
            </button>
          ))}
        </div>

        {activeTab === "xp" ? (
          <AdminXpRanks />
        ) : subTab === "data" ? (
          <DataForCalc entityType={activeTab} />
        ) : subTab === "history" ? (
          <RatingHistory entityType={activeTab} />
        ) : loading ? (
          <div className={classes.stateBox}>Загрузка настроек…</div>
        ) : loadError || !config ? (
          <div className={classes.card}>
            <div className={classes.errorText}>{loadError || "Нет настроек."}</div>
            <div className={classes.btnRow}>
              <button className={`${classes.btn} ${classes.btnGhost}`} onClick={load}>Повторить</button>
            </div>
          </div>
        ) : (
          <div className={classes.grid}>
            <div className={classes.card}>
              <div className={classes.cardHead}>
                <div>
                  <h2>{currentTab?.label} — настройки формулы</h2>
                  <p>Обновлено: {formatDate(updatedAt)}</p>
                </div>
              </div>
              {ENTITY_REFERENCES[activeTab]?.length ? (
                <div data-testid="entity-references" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
                  {ENTITY_REFERENCES[activeTab].map((r) => (
                    <button
                      key={r.catalog}
                      type="button"
                      className={classes.refCtxBtn}
                      data-testid={`ref-ctx-${r.catalog}`}
                      onClick={() => setRefDrawer(r.catalog)}
                    >
                      <span>⚙ {r.label}</span>
                      <span className={classes.refCtxMeta}>· {r.hint}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {renderConfigEditor()}
              <div className={classes.btnRow}>
                <button className={`${classes.btn} ${classes.btnPrimary}`} disabled={!isDirty || saving} data-testid="save-config-btn" onClick={save}>
                  {saving ? "Сохранение…" : "Сохранить"}
                </button>
                <button className={`${classes.btn} ${classes.btnGhost}`} disabled={!isDirty || saving} onClick={() => setConfig(JSON.parse(savedFingerprint))}>
                  Сбросить
                </button>
              </div>
            </div>

            <div>
              <div className={classes.card}>
                <div className={classes.cardHead}>
                  <div>
                    <h3>Предпросмотр расчёта</h3>
                    <p>Заполните пример данных — изменённые веса применяются сразу.</p>
                  </div>
                </div>
                <PreviewForm value={previewInput} prefix={activeTab} onChange={setPreviewInput} />
                <div className={classes.collapsible}>
                  <div className={classes.collapsibleHead} data-testid="advanced-toggle" onClick={() => setAdvancedOpen((v) => !v)}>
                    {advancedOpen ? "▼" : "▶"} Расширенный ввод: сырые данные (JSON) — расчёт по подформулам
                  </div>
                  {advancedOpen ? (
                    <>
                      <p style={{ fontSize: 12, color: "#7A879A", margin: "6px 0", lineHeight: "17px" }}>
                        Передайте сырые сигналы вместо готового значения 0–100. Число трактуется как
                        ручной ввод (fallback), объект/массив — рассчитывается по подформуле с раскладкой
                        «сырое → нормализовано → вклад». Пусто = используется форма выше.
                      </p>
                      <textarea
                        className={classes.advancedArea}
                        data-testid="advanced-json"
                        value={advancedJson}
                        onChange={(e) => setAdvancedJson(e.target.value)}
                        placeholder={RAW_SAMPLE[activeTab] || "{ }"}
                      />
                    </>
                  ) : null}
                </div>
                {previewError ? <div className={classes.errorText}>{previewError}</div> : null}
                <div className={classes.btnRow}>
                  <button className={`${classes.btn} ${classes.btnPrimary}`} disabled={previewing} data-testid="preview-btn" onClick={runPreview}>
                    {previewing ? "Расчёт…" : "Рассчитать"}
                  </button>
                </div>
                {previewResult ? <div style={{ marginTop: 16 }}>{renderPreviewResult()}</div> : null}
                {previewProvenance ? <ProvenancePanel provenance={previewProvenance} /> : null}

                {previewResult ? (
                  <div className={classes.collapsible}>
                    <div className={classes.collapsibleHead} data-testid="raw-toggle" onClick={() => setRawOpen((v) => !v)}>
                      {rawOpen ? "▼" : "▶"} Технические данные (JSON)
                    </div>
                    {rawOpen ? (
                      <pre className={classes.pre} data-testid="raw-json">{JSON.stringify({ input: previewInput, result: previewResult }, null, 2)}</pre>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {currentTab?.recalc ? (
                <div className={classes.card} style={{ marginTop: 22 }}>
                  <div className={classes.cardHead}>
                    <div>
                      <h3>Пересчёт ({currentTab.label})</h3>
                      <p>Пересчёт рейтингов по сохранённым формулам.</p>
                    </div>
                    <span
                      className={`${classes.badge} ${
                        entityRuntime?.state === "running" ? classes.badgeWarn : entityRuntime?.state === "failed" ? classes.badgeErr : classes.badgeOk
                      }`}
                      data-testid="recalc-state"
                    >
                      {STATE_LABEL[entityRuntime?.state || "idle"]}
                    </span>
                  </div>
                  <dl className={classes.runtimeGrid}>
                    <div><dt>Последний запуск</dt><dd>{formatDate(entityRuntime?.lastRunAt)}</dd></div>
                    <div>
                      <dt>Результат</dt>
                      <dd>{entityRuntime?.lastResult ? `${entityRuntime.lastResult.updated}/${entityRuntime.lastResult.scanned}, ошибок ${entityRuntime.lastResult.errors}` : "—"}</dd>
                    </div>
                  </dl>
                  {entityRuntime?.lastError ? <div className={classes.errorText}>{entityRuntime.lastError}</div> : null}
                  <div className={classes.btnRow}>
                    <button className={`${classes.btn} ${classes.btnPrimary}`} disabled={recalcBusy || entityRuntime?.running} data-testid="recalc-all-btn" onClick={() => runRecalc(currentTab.recalc as string)}>
                      Пересчитать все
                    </button>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <label className={classes.formLabel} style={{ display: "block", marginBottom: 6 }}>Найти сущность</label>
                    <AdminEntitySearch
                      testid="recalc-search-input"
                      onSearch={(q) => searchRecalcEntities(currentTab.recalc as string, q)}
                      onSelect={(hit) => pickRecalcEntity(currentTab.recalc as string, hit)}
                      selectedLabel={recalcSelected?.label}
                    />
                  </div>
                  {recalcSelected ? (
                    <div className={classes.groupBlock} data-testid="recalc-current">
                      <p className={classes.groupTitle}>Выбрано: {recalcSelected.label}</p>
                      <div className={classes.tradeSummary}>
                        <div className={classes.tradeStat}><span>Текущий рейтинг</span><strong data-testid="recalc-current-score">{recalcCurrent?.score ?? recalcSelected.score ?? "—"}</strong></div>
                        <div className={classes.tradeStat}><span>Уровень</span><strong>{recalcCurrent?.level ?? "—"}</strong></div>
                        <div className={classes.tradeStat}><span>Полнота</span><strong>{recalcCurrent?.completeness ?? "—"}%</strong></div>
                        <div className={classes.tradeStat}><span>Источник</span><strong><SourceBadge source={recalcCurrent?.provenance?.mode} /></strong></div>
                        <div className={classes.tradeStat}><span>Актуальность</span><strong>{freshnessLabel(recalcCurrent?.createdAt || recalcCurrent?.calculatedAt).label}</strong></div>
                        <div className={classes.tradeStat}><span>Данные</span><strong>{recalcCurrent ? "доступны" : "нет результата"}</strong></div>
                      </div>
                      <div className={classes.btnRow}>
                        <button className={`${classes.btn} ${classes.btnPrimary}`} disabled={recalcBusy || !recalcId} data-testid="recalc-one-btn" onClick={() => runRecalc(currentTab.recalc as string, recalcId)}>
                          Пересчитать рейтинг
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {recalcDiff ? (
                    <div className={classes.groupBlock} data-testid="recalc-diff">
                      <p className={classes.groupTitle}>Было → стало</p>
                      <div className={classes.tradeSummary}>
                        <div className={classes.tradeStat}><span>Было</span><strong>{recalcDiff.before?.score ?? "—"}</strong></div>
                        <div className={classes.tradeStat}><span>Стало</span><strong data-testid="recalc-diff-score">{recalcDiff.score}</strong></div>
                        <div className={classes.tradeStat}><span>Δ</span><strong>{recalcDiff.before?.score != null && recalcDiff.score != null ? round2(recalcDiff.score - recalcDiff.before.score) : "—"}</strong></div>
                        <div className={classes.tradeStat}><span>Уровень</span><strong>{recalcDiff.result?.level ?? "—"}</strong></div>
                        <div className={classes.tradeStat}><span>Полнота</span><strong>{recalcDiff.result?.completeness ?? "—"}%</strong></div>
                      </div>
                      {Object.keys(recalcDiff.changed).length ? (
                        <table className={classes.breakdownTable}>
                          <thead><tr><th>Компонент</th><th>Источник</th><th>Было</th><th>Стало</th></tr></thead>
                          <tbody>
                            {Object.entries(recalcDiff.changed).map(([k, v]) => (
                              <tr key={k}>
                                <td>{labelFor(k)}</td>
                                <td><SourceBadge source={(recalcDiff.result?.components?.[k] as any)?.source} /></td>
                                <td>{v.from}</td><td>{v.to}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p style={{ fontSize: 12.5, color: "#7A879A" }}>Компоненты не изменились.</p>}
                      {recalcDiff.result?.missingFields?.length ? (
                        <div style={{ marginTop: 8 }}>
                          {recalcDiff.result.missingFields.map((f) => (
                            <span key={f} className={`${classes.pill} ${classes.pillMuted}`}>нет данных: {labelFor(f)}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )}
        <ReferenceDrawer catalog={refDrawer} onClose={() => setRefDrawer(null)} />
      </main>
    </Layout>
  );
};

export default AdminRatingPage;

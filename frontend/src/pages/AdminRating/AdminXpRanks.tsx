import React, { useEffect, useMemo, useState } from "react";
import { createUseStyles } from "react-jss";
import { toast } from "react-toastify";
import {
  fetchXpRanks,
  saveXpRanks,
  previewXpRank,
  XpRankItem,
  XpRankPreview,
  fetchXpRules,
  saveXpRule,
  XpRule,
  fetchXpTransactions,
  XpTransaction,
  reverseXp,
  fetchReconciliation,
  fixReconciliation,
  runXpMigration,
  resetXpDemo,
  fetchFomiesForPicker,
  ReconcilePayload,
  FomieLite,
} from "../../components/services/adminUnifiedRatings";
import {
  Dropdown,
  InfoTip,
  eventLabel,
  eventHint,
  GROUP_LABEL,
  sourceLabel,
  STATUS_META,
  UNIQUE_OPTIONS,
  formatDateTime,
  DdOption,
} from "./xpUi";
import SpaceportEditor from "./SpaceportEditor";
import BadgesManager from "./BadgesManager";

const useStyles = createUseStyles({
  wrap: { display: "grid", gap: 18, maxWidth: "100%", boxSizing: "border-box" },
  subnav: { display: "flex", gap: 2, flexWrap: "wrap", borderBottom: "1px solid #EEF2F7", marginBottom: 6 },
  subBtn: {
    border: "none",
    background: "transparent",
    color: "#6B7788",
    borderRadius: 0,
    padding: "10px 14px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
    transition: "color 160ms ease, border-color 160ms ease",
    "&:hover": { color: "#6D28D9" },
  },
  subBtnActive: { background: "transparent", color: "#6D28D9", borderBottomColor: "#6D28D9" },
  card: {
    background: "#fff",
    border: "1px solid #E4EAF1",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  titleRow: { display: "flex", alignItems: "center", gap: 4, margin: "0 0 12px" },
  title: { fontSize: 13, fontWeight: 700, color: "#41506A", textTransform: "uppercase", letterSpacing: 0.4, margin: 0 },
  hint: { color: "#7B8AA0", fontSize: 12.5, margin: "0 0 16px", lineHeight: 1.55, maxWidth: 900, wordBreak: "break-word" },
  scrollShell: { position: "relative", width: "100%" },
  scrollX: { width: "100%", overflowX: "auto", paddingBottom: 4, boxSizing: "border-box" },
  fadeRight: {
    position: "absolute", top: 0, right: 0, bottom: 10, width: 48, pointerEvents: "none",
    background: "linear-gradient(90deg, rgba(255,255,255,0), #fff)", borderRadius: "0 12px 12px 0",
  },
  scrollHint: {
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7B8AA0",
    marginBottom: 10, fontWeight: 600,
  },
  subTableHead: { display: "flex", alignItems: "center", gap: 4, margin: "20px 0 8px" },
  subTitle: { fontSize: 12.5, fontWeight: 700, color: "#41506A", textTransform: "uppercase", letterSpacing: 0.3, margin: 0 },
  tableSplit: { minWidth: 0, tableLayout: "auto" },
  stickyLeft: {
    position: "sticky", left: 0, background: "#fff", zIndex: 3,
    boxShadow: "6px 0 8px -6px rgba(16,24,40,0.10)",
  },
  stickyRight: {
    position: "sticky", right: 0, background: "#fff", zIndex: 3,
    boxShadow: "-6px 0 8px -6px rgba(16,24,40,0.10)",
  },
  table: { width: "100%", minWidth: 940, borderCollapse: "collapse", fontSize: 13 },
  tableWide: { minWidth: 1040 },
  th: {
    textAlign: "left",
    color: "#7B8AA0",
    fontWeight: 600,
    fontSize: 11.5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    padding: "8px 12px",
    borderBottom: "1px solid #EEF2F7",
    whiteSpace: "nowrap",
  },
  thCell: { display: "inline-flex", alignItems: "center" },
  td: { padding: "10px 12px", borderBottom: "1px solid #F3F6FA", verticalAlign: "middle" },
  input: {
    width: "100%",
    height: 38,
    border: "1px solid #D8E1EB",
    borderRadius: 10,
    padding: "4px 10px",
    boxSizing: "border-box",
    fontSize: 13,
    outline: "none",
    "&:focus": { borderColor: "#00C099", boxShadow: "0 0 0 3px rgba(0,192,153,0.12)" },
    "&:disabled": { background: "#F5F8FB", color: "#8A98AC" },
  },
  iconInput: { width: 64, textAlign: "center" },
  numInput: { width: 88 },
  eventName: { fontWeight: 700, color: "#1D2939", display: "inline-flex", alignItems: "center" },
  actions: { display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" },
  btnPrimary: {
    background: "#00C099", border: "none", color: "#fff", borderRadius: 10,
    padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
    "&:disabled": { opacity: 0.55, cursor: "not-allowed" },
  },
  btnGhost: {
    background: "transparent", border: "1px solid #D8E1EB", color: "#41506A", borderRadius: 10,
    padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
    "&:disabled": { opacity: 0.55, cursor: "not-allowed" },
  },
  btnDanger: {
    background: "transparent", border: "1px solid #FDA29B", color: "#B42318", borderRadius: 9,
    padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
    "&:disabled": { opacity: 0.45, cursor: "not-allowed" },
  },
  btnMini: {
    background: "#00C099", border: "none", color: "#fff", borderRadius: 9,
    padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
  previewRow: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" },
  progressOuter: { flex: 1, minWidth: 220, height: 12, background: "#EEF2F7", borderRadius: 999, overflow: "hidden" },
  progressInner: { height: "100%", background: "linear-gradient(90deg, #00C099, #00A9C0)", transition: "width 220ms ease" },
  previewMeta: { fontSize: 13, color: "#41506A" },
  toggle: { display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12.5, color: "#41506A", userSelect: "none" },
  checkbox: { width: 17, height: 17, accentColor: "#00C099", cursor: "pointer" },
  filters: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 },
  statusBadge: { display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700 },
  stAwarded: { background: "rgba(0,192,153,0.12)", color: "#00815F" },
  stPending: { background: "rgba(240,167,0,0.16)", color: "#B54708" },
  stRejected: { background: "rgba(240,68,56,0.10)", color: "#B42318" },
  stReversed: { background: "rgba(102,112,133,0.14)", color: "#475467" },
  kpiRow: { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 4 },
  kpi: { flex: "1 1 160px", border: "1px solid #EEF2F7", borderRadius: 12, padding: "14px 16px", background: "#FBFDFE" },
  kpiLabel: { fontSize: 11.5, color: "#7B8AA0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  kpiValue: { fontSize: 24, fontWeight: 800, color: "#1D2939", marginTop: 4 },
  xpPos: { color: "#00815F", fontWeight: 700 },
  xpNeg: { color: "#B42318", fontWeight: 700 },
  groupTag: { display: "inline-block", padding: "3px 10px", borderRadius: 7, background: "#EEF4FF", color: "#3538CD", fontSize: 11.5, fontWeight: 700 },
  sourceTag: { display: "inline-block", padding: "3px 10px", borderRadius: 7, background: "#F2F4F7", color: "#475467", fontSize: 11.5, fontWeight: 600 },
  cellDate: { color: "#475467", fontSize: 12.5, whiteSpace: "nowrap" },
  note: {
    background: "rgba(0,192,153,0.06)", border: "1px solid rgba(0,192,153,0.22)",
    borderRadius: 12, padding: "16px 18px", color: "#1D2939", fontSize: 13, lineHeight: 1.6,
  },
  noteP: { margin: "0 0 10px" },
  noteList: { margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 },
  dirty: { color: "#B54708", fontSize: 12.5 },
});

type Section = "rules" | "ranks" | "events" | "history" | "spaceport" | "badges";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "rules", label: "Начисление XP" },
  { key: "ranks", label: "Ранги" },
  { key: "events", label: "События" },
  { key: "history", label: "История" },
  { key: "spaceport", label: "Spaceport" },
  { key: "badges", label: "Бейджи" },
];

const StatusBadge: React.FC<{ classes: any; status: string }> = ({ classes, status }) => {
  const map: Record<string, string> = {
    awarded: classes.stAwarded, pending: classes.stPending,
    rejected: classes.stRejected, reversed: classes.stReversed,
  };
  return (
    <span className={`${classes.statusBadge} ${map[status] || classes.stReversed}`}>
      {STATUS_META[status]?.label || status}
    </span>
  );
};

const AdminXpRanks: React.FC = () => {
  const classes = useStyles();
  const [section, setSection] = useState<Section>("ranks");

  const [ranks, setRanks] = useState<XpRankItem[]>([]);
  const [xpMax, setXpMax] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewXp, setPreviewXp] = useState(720);
  const [preview, setPreview] = useState<XpRankPreview | null>(null);

  const [rules, setRules] = useState<XpRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [savingRule, setSavingRule] = useState<string | null>(null);

  const [fomies, setFomies] = useState<FomieLite[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [tx, setTx] = useState<XpTransaction[]>([]);
  const [ledgerXp, setLedgerXp] = useState<number>(0);
  const [txLoading, setTxLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");

  const [recon, setRecon] = useState<ReconcilePayload | null>(null);
  const [reconLoading, setReconLoading] = useState(false);
  const [busyOp, setBusyOp] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetchXpRanks();
    setLoading(false);
    if (res.success && res.data?.ranks) {
      setRanks([...res.data.ranks].sort((a, b) => a.minXp - b.minXp));
      setXpMax(res.data.xpMax || 1000);
      setDirty(false);
    } else toast.error(res.error || "Не удалось загрузить ранги");
  };
  useEffect(() => { load(); }, []);

  const runPreview = async (xp: number) => {
    const res = await previewXpRank(xp);
    if (res.success && res.data) setPreview(res.data);
  };
  useEffect(() => {
    const t = setTimeout(() => runPreview(previewXp), 250);
    return () => clearTimeout(t);
  }, [previewXp]);

  const loadRules = async () => {
    setRulesLoading(true);
    const res = await fetchXpRules();
    setRulesLoading(false);
    if (res.success && res.data?.rules) {
      setRules([...res.data.rules].sort((a, b) => (a.group + a.eventType).localeCompare(b.group + b.eventType)));
    } else toast.error(res.error || "Не удалось загрузить правила");
  };
  const loadFomies = async () => {
    const res = await fetchFomiesForPicker();
    if (res.success && res.data?.users) {
      const list: FomieLite[] = res.data.users.map((u: any) => ({
        _id: u._id, name: u.name, username: u.username, email: u.email, activityXP: u.activityXP, rank: u.rank,
      }));
      setFomies(list);
      if (!selectedUser && list[0]) setSelectedUser(list[0]._id);
    }
  };
  const loadRecon = async () => {
    setReconLoading(true);
    const res = await fetchReconciliation();
    setReconLoading(false);
    if (res.success && res.data) setRecon(res.data);
    else toast.error(res.error || "Ошибка сверки");
  };

  useEffect(() => {
    if ((section === "rules" || section === "spaceport") && rules.length === 0) loadRules();
    if (section === "history" && fomies.length === 0) loadFomies();
    if (section === "events") { loadRecon(); if (fomies.length === 0) loadFomies(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const loadTx = async (userId: string) => {
    if (!userId) return;
    setTxLoading(true);
    const res = await fetchXpTransactions(userId, 100);
    setTxLoading(false);
    if (res.success && res.data) {
      setTx(res.data.transactions || []);
      setLedgerXp(res.data.ledgerXp || 0);
    } else toast.error(res.error || "Не удалось загрузить историю");
  };
  useEffect(() => {
    if (section === "history" && selectedUser) loadTx(selectedUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, section]);

  const normalized = useMemo(() => {
    const rows = [...ranks];
    for (let i = 0; i < rows.length; i++) {
      rows[i] = { ...rows[i], minXp: i === 0 ? 0 : rows[i - 1].maxXp + 1, order: i + 1 };
    }
    return rows;
  }, [ranks]);
  const updateRow = (idx: number, patch: Partial<XpRankItem>) => {
    setRanks((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setDirty(true);
  };
  const valid = useMemo(() => {
    for (const r of normalized) {
      if (!r.name.trim() || !r.key.trim()) return false;
      if (r.maxXp < r.minXp) return false;
    }
    return true;
  }, [normalized]);
  const save = async () => {
    if (!valid) { toast.error("Проверьте пороги: максимум должен быть не меньше минимума в каждом ранге"); return; }
    setSaving(true);
    const res = await saveXpRanks(normalized);
    setSaving(false);
    if (res.success && res.data?.ranks) {
      setRanks([...res.data.ranks].sort((a, b) => a.minXp - b.minXp));
      setDirty(false);
      toast.success("Ранги сохранены");
      runPreview(previewXp);
    } else toast.error(res.error || "Не удалось сохранить ранги");
  };

  const patchRule = (eventType: string, patch: Partial<XpRule>) => {
    setRules((prev) => prev.map((r) => (r.eventType === eventType ? { ...r, ...patch } : r)));
  };
  const persistRule = async (rule: XpRule) => {
    setSavingRule(rule.eventType);
    const { _id, eventType, ...patch } = rule;
    const res = await saveXpRule(eventType, patch);
    setSavingRule(null);
    if (res.success) toast.success(`Правило «${eventLabel(eventType)}» сохранено`);
    else toast.error(res.error || "Не удалось сохранить правило");
  };

  const doMigrate = async () => {
    setBusyOp("migrate");
    const res = await runXpMigration("v1");
    setBusyOp(null);
    if (res.success && res.data) {
      toast.success(`Перенос выполнен: обработано ${res.data.usersChecked}, перенесено ${res.data.migrated}`);
      loadRecon();
    } else toast.error(res.error || "Ошибка переноса");
  };
  const doDemoReset = async () => {
    setBusyOp("demo");
    const res = await resetXpDemo();
    setBusyOp(null);
    if (res.success && res.data) {
      toast.success(`Демо-данные сброшены: удалено ${res.data.removed}, пересчитано ${res.data.recomputedUsers}`);
      loadRecon();
    } else toast.error(res.error || "Ошибка сброса демо-данных");
  };
  const doFix = async (userId: string) => {
    setBusyOp("fix:" + userId);
    const res = await fixReconciliation(userId);
    setBusyOp(null);
    if (res.success) { toast.success("Баланс пересчитан по журналу"); loadRecon(); }
    else toast.error(res.error || "Ошибка пересчёта");
  };
  const doReverse = async (t: XpTransaction) => {
    if (!t._id) return;
    setBusyOp("rev:" + t._id);
    const res = await reverseXp(t._id, "Отмена из админки");
    setBusyOp(null);
    if (res.success) { toast.success("Начисление отменено"); loadTx(selectedUser); }
    else toast.error(res.error || "Не удалось отменить");
  };

  const filteredTx = useMemo(
    () => tx.filter((t) => (statusFilter === "all" || t.status === statusFilter) && (eventFilter === "all" || t.eventType === eventFilter)),
    [tx, statusFilter, eventFilter]
  );
  const eventTypes = useMemo(() => Array.from(new Set(tx.map((t) => t.eventType))), [tx]);
  const spaceportRules = useMemo(() => rules.filter((r) => r.group === "spaceport"), [rules]);

  const statusOptions: DdOption[] = [
    { value: "all", label: "Все статусы" },
    { value: "awarded", label: "Начислено" },
    { value: "pending", label: "Ожидает" },
    { value: "rejected", label: "Отклонено" },
    { value: "reversed", label: "Отменено" },
  ];
  const eventOptions: DdOption[] = [{ value: "all", label: "Все события" }, ...eventTypes.map((et) => ({ value: et, label: eventLabel(et) }))];
  const userOptions: DdOption[] = fomies.map((u) => ({ value: u._id, label: `${u.name || u.username || "Пользователь"} — ${u.activityXP ?? 0} XP` }));

  return (
    <div className={classes.wrap} data-testid="admin-xp-ranks">
      <div className={classes.subnav} role="tablist">
        {SECTIONS.map((s) => (
          <button
            key={s.key} type="button" role="tab" aria-selected={section === s.key}
            data-testid={`xp-section-${s.key}`}
            className={`${classes.subBtn} ${section === s.key ? classes.subBtnActive : ""}`}
            onClick={() => setSection(s.key)}
          >{s.label}</button>
        ))}
      </div>

      {/* ============ RANKS ============ */}
      {section === "ranks" && (
        <>
          <div className={classes.card}>
            <div className={classes.titleRow}>
              <h3 className={classes.title}>Предпросмотр ранга по XP</h3>
              <InfoTip text="Введите значение XP, чтобы увидеть, какой ранг получит пользователь и сколько XP осталось до следующего ранга." />
            </div>
            <div className={classes.previewRow}>
              <input type="number" className={`${classes.input} ${classes.numInput}`} value={previewXp} min={0} max={xpMax}
                data-testid="xp-preview-input" onChange={(e) => setPreviewXp(Number(e.target.value))} />
              <div className={classes.progressOuter}><div className={classes.progressInner} style={{ width: `${preview?.progressPct ?? 0}%` }} /></div>
              <div className={classes.previewMeta} data-testid="xp-preview-result">
                {preview ? (<>{preview.icon} <b>{preview.name}</b> — {preview.progressPct}% ранга{preview.isMax ? " (максимальный ранг)" : `, до следующего: ${preview.xpToNext} XP`}</>) : "—"}
              </div>
            </div>
          </div>

          <div className={classes.card}>
            <div className={classes.titleRow}>
              <h3 className={classes.title}>Ранги — единая шкала XP (0–{xpMax})</h3>
              <InfoTip text="Ранг пользователя зависит только от его XP. Диапазоны идут подряд: минимум каждого ранга — это максимум предыдущего плюс единица." />
            </div>
            <p className={classes.hint}>Прогрессия пользователя одна. Стейкинг и другие активности только пополняют этот же XP, отдельной второй шкалы нет.</p>
            {loading ? <div className={classes.hint}>Загрузка…</div> : (
              <div className={classes.scrollX}>
                <table className={classes.table} data-testid="xp-ranks-table">
                  <thead>
                    <tr>
                      <th className={classes.th}>№</th>
                      <th className={classes.th}>Иконка</th>
                      <th className={classes.th}>Название</th>
                      <th className={classes.th}>От XP</th>
                      <th className={classes.th}>До XP</th>
                      <th className={classes.th}>Активен</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalized.map((r, idx) => (
                      <tr key={r.key} data-testid={`xp-rank-row-${r.key}`}>
                        <td className={classes.td}>{r.order}</td>
                        <td className={classes.td}><input className={`${classes.input} ${classes.iconInput}`} value={r.icon} onChange={(e) => updateRow(idx, { icon: e.target.value })} /></td>
                        <td className={classes.td}><input className={classes.input} value={r.name} onChange={(e) => updateRow(idx, { name: e.target.value })} /></td>
                        <td className={classes.td}><input className={`${classes.input} ${classes.numInput}`} value={r.minXp} disabled /></td>
                        <td className={classes.td}><input type="number" className={`${classes.input} ${classes.numInput}`} value={r.maxXp} data-testid={`xp-rank-max-${r.key}`} onChange={(e) => updateRow(idx, { maxXp: Number(e.target.value) })} /></td>
                        <td className={classes.td}>
                          <label className={classes.toggle}>
                            <input type="checkbox" className={classes.checkbox} checked={r.enabled} onChange={(e) => updateRow(idx, { enabled: e.target.checked })} />
                            {r.enabled ? "Да" : "Нет"}
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className={classes.actions}>
              <button type="button" className={classes.btnPrimary} disabled={saving || !dirty} data-testid="xp-ranks-save" onClick={save}>{saving ? "Сохранение…" : "Сохранить ранги"}</button>
              <button type="button" className={classes.btnGhost} onClick={load} disabled={saving}>Отменить изменения</button>
              {dirty && <span className={classes.dirty}>Есть несохранённые изменения</span>}
            </div>
          </div>
        </>
      )}

      {/* ============ RULES ============ */}
      {section === "rules" && (
        <div className={classes.card}>
          <div className={classes.titleRow}>
            <h3 className={classes.title}>Правила начисления XP</h3>
            <InfoTip text="Здесь настраивается, за какие действия и сколько XP получает пользователь, а также защита от накрутки: лимиты, задержки и требование проверки." />
          </div>
          <p className={classes.hint}>Каждое правило описывает событие и его настройки: сколько XP начислять, как часто это можно делать и нужно ли подтверждение. XP пользователя меняется только по этим правилам.</p>
          {rulesLoading ? <div className={classes.hint}>Загрузка…</div> : (
            <>
              {/* ---- Table 1: XP accrual (fits on screen, no horizontal scroll) ---- */}
              <div className={classes.subTableHead}>
                <h4 className={classes.subTitle}>Начисление</h4>
                <InfoTip text="Сколько XP начислять за событие и с каким множителем." />
              </div>
              <table className={`${classes.table} ${classes.tableSplit}`} data-testid="xp-rules-table">
                <thead>
                  <tr>
                    <th className={classes.th}>Событие</th>
                    <th className={classes.th}>Раздел</th>
                    <th className={classes.th}>Вкл.</th>
                    <th className={classes.th}><span className={classes.thCell}>XP<InfoTip text="Сколько XP начисляется за одно событие." /></span></th>
                    <th className={classes.th}><span className={classes.thCell}>Множитель<InfoTip text="Коэффициент к базовому XP. Обычно 1." /></span></th>
                    <th className={classes.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.eventType} data-testid={`xp-rule-row-${r.eventType}`}>
                      <td className={classes.td}>
                        <span className={classes.eventName}>{eventLabel(r.eventType)}<InfoTip title={eventLabel(r.eventType)} text={eventHint(r.eventType)} source={r.eventType} /></span>
                      </td>
                      <td className={classes.td}><span className={classes.groupTag}>{GROUP_LABEL[r.group] || r.group}</span></td>
                      <td className={classes.td}>
                        <label className={classes.toggle}>
                          <input type="checkbox" className={classes.checkbox} checked={r.enabled} data-testid={`xp-rule-enabled-${r.eventType}`} onChange={(e) => patchRule(r.eventType, { enabled: e.target.checked })} />
                          {r.enabled ? "Да" : "Нет"}
                        </label>
                      </td>
                      <td className={classes.td}><input type="number" className={`${classes.input} ${classes.numInput}`} value={r.baseXp} onChange={(e) => patchRule(r.eventType, { baseXp: Number(e.target.value) })} /></td>
                      <td className={classes.td}><input type="number" step="0.05" className={`${classes.input} ${classes.numInput}`} value={r.multiplier} onChange={(e) => patchRule(r.eventType, { multiplier: Number(e.target.value) })} /></td>
                      <td className={classes.td}>
                        <button type="button" className={classes.btnMini} disabled={savingRule === r.eventType} data-testid={`xp-rule-save-${r.eventType}`} onClick={() => persistRule(r)}>{savingRule === r.eventType ? "…" : "Сохранить"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ---- Table 2: limits & anti-abuse (fits on screen, no horizontal scroll) ---- */}
              <div className={classes.subTableHead}>
                <h4 className={classes.subTitle}>Лимиты и защита от накрутки</h4>
                <InfoTip text="Ограничения по частоте и количеству начислений, а также требование проверки." />
              </div>
              <table className={`${classes.table} ${classes.tableSplit}`} data-testid="xp-rules-table-limits">
                <thead>
                  <tr>
                    <th className={classes.th}>Событие</th>
                    <th className={classes.th}><span className={classes.thCell}>Задержка<InfoTip text="Минимальный интервал между начислениями (в секундах). Защищает от быстрой накрутки." /></span></th>
                    <th className={classes.th}><span className={classes.thCell}>Лимит в день<InfoTip text="Максимальное число начислений за сутки. 0 — без ограничения." /></span></th>
                    <th className={classes.th}><span className={classes.thCell}>Лимит всего<InfoTip text="Максимальное число начислений за всё время. 0 — без ограничения." /></span></th>
                    <th className={classes.th}><span className={classes.thCell}>Без повторов<InfoTip text="Как исключать повторные начисления: по источнику, по конкретной сущности или один раз в день." /></span></th>
                    <th className={classes.th}><span className={classes.thCell}>Проверка<InfoTip text="Если включено — XP сначала ожидает подтверждения и лишь потом попадает в баланс." /></span></th>
                    <th className={classes.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.eventType} data-testid={`xp-rule-row2-${r.eventType}`}>
                      <td className={classes.td}>
                        <span className={classes.eventName}>{eventLabel(r.eventType)}</span>
                      </td>
                      <td className={classes.td}><input type="number" className={`${classes.input} ${classes.numInput}`} value={r.cooldownSec} onChange={(e) => patchRule(r.eventType, { cooldownSec: Number(e.target.value) })} /></td>
                      <td className={classes.td}><input type="number" className={`${classes.input} ${classes.numInput}`} value={r.dailyCap} onChange={(e) => patchRule(r.eventType, { dailyCap: Number(e.target.value) })} /></td>
                      <td className={classes.td}><input type="number" className={`${classes.input} ${classes.numInput}`} value={r.lifetimeCap} onChange={(e) => patchRule(r.eventType, { lifetimeCap: Number(e.target.value) })} /></td>
                      <td className={classes.td}><Dropdown value={r.uniqueBy} options={UNIQUE_OPTIONS} onChange={(v) => patchRule(r.eventType, { uniqueBy: v as any })} minWidth={150} /></td>
                      <td className={classes.td}>
                        <label className={classes.toggle}>
                          <input type="checkbox" className={classes.checkbox} checked={r.verificationRequired} onChange={(e) => patchRule(r.eventType, { verificationRequired: e.target.checked })} />
                          {r.verificationRequired ? "Да" : "Нет"}
                        </label>
                      </td>
                      <td className={classes.td}>
                        <button type="button" className={classes.btnMini} disabled={savingRule === r.eventType} data-testid={`xp-rule-save2-${r.eventType}`} onClick={() => persistRule(r)}>{savingRule === r.eventType ? "…" : "Сохранить"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ============ EVENTS / OPS ============ */}
      {section === "events" && (
        <>
          <div className={classes.card}>
            <div className={classes.titleRow}>
              <h3 className={classes.title}>Сверка баланса и журнала</h3>
              <InfoTip text="Баланс XP каждого пользователя должен точно совпадать с суммой начислений в журнале за вычетом отмен. Здесь можно проверить и восстановить это соответствие." />
            </div>
            <p className={classes.hint}>Перенос заполняет журнал текущими балансами пользователей. Пересчёт восстанавливает баланс по журналу, не меняя саму историю начислений.</p>
            <div className={classes.kpiRow}>
              <div className={classes.kpi}><div className={classes.kpiLabel}>Проверено</div><div className={classes.kpiValue}>{recon?.checked ?? "—"}</div></div>
              <div className={classes.kpi}><div className={classes.kpiLabel}>Расхождений</div><div className={classes.kpiValue} style={{ color: (recon?.mismatches ?? 0) > 0 ? "#B42318" : "#00815F" }}>{recon?.mismatches ?? "—"}</div></div>
            </div>
            <div className={classes.actions}>
              <button type="button" className={classes.btnPrimary} disabled={busyOp === "migrate"} data-testid="xp-migrate-btn" onClick={doMigrate}>{busyOp === "migrate" ? "Перенос…" : "Перенести балансы в журнал"}</button>
              <button type="button" className={classes.btnGhost} disabled={reconLoading} data-testid="xp-reconcile-btn" onClick={loadRecon}>{reconLoading ? "Сверка…" : "Обновить сверку"}</button>
              <button type="button" className={classes.btnDanger} disabled={busyOp === "demo"} data-testid="xp-demo-reset-btn" onClick={doDemoReset}>{busyOp === "demo" ? "Сброс…" : "Сбросить демо-данные"}</button>
            </div>
          </div>

          {recon && recon.diffs.length > 0 && (
            <div className={classes.card}>
              <h3 className={classes.title}>Расхождения</h3>
              <div className={classes.scrollX}>
                <table className={classes.table}>
                  <thead>
                    <tr>
                      <th className={classes.th}>Пользователь</th>
                      <th className={classes.th}>Баланс</th>
                      <th className={classes.th}>По журналу</th>
                      <th className={classes.th}>Разница</th>
                      <th className={classes.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recon.diffs.map((d) => (
                      <tr key={d.userId}>
                        <td className={classes.td}>{(fomies.find((f) => f._id === d.userId)?.name) || d.userId}</td>
                        <td className={classes.td}>{d.stored}</td>
                        <td className={classes.td}>{d.ledger}</td>
                        <td className={classes.td}>{d.delta}</td>
                        <td className={classes.td}><button type="button" className={classes.btnMini} disabled={busyOp === "fix:" + d.userId} onClick={() => doFix(d.userId)}>Пересчитать</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============ HISTORY ============ */}
      {section === "history" && (
        <div className={classes.card}>
          <div className={classes.titleRow}>
            <h3 className={classes.title}>История начислений XP</h3>
            <InfoTip text="Полная история XP пользователя: за что, из какого источника, сколько и когда начислено, а также текущий статус. Отмена создаёт компенсирующую запись и не стирает историю." />
          </div>
          <div className={classes.filters}>
            <Dropdown value={selectedUser} options={userOptions.length ? userOptions : [{ value: "", label: "Нет пользователей" }]} onChange={setSelectedUser} testid="xp-history-user" minWidth={240} />
            <Dropdown value={statusFilter} options={statusOptions} onChange={setStatusFilter} minWidth={170} />
            <Dropdown value={eventFilter} options={eventOptions} onChange={setEventFilter} minWidth={200} />
            <span className={classes.previewMeta}>Всего XP: <b data-testid="xp-history-ledger">{ledgerXp}</b></span>
          </div>
          {txLoading ? <div className={classes.hint}>Загрузка…</div> : filteredTx.length === 0 ? <div className={classes.hint}>Нет начислений.</div> : (
            <div className={classes.scrollX}>
              <table className={classes.table} data-testid="xp-history-table">
                <thead>
                  <tr>
                    <th className={classes.th}>Дата и время</th>
                    <th className={classes.th}>Событие</th>
                    <th className={classes.th}>Источник</th>
                    <th className={classes.th}>XP</th>
                    <th className={classes.th}>Статус</th>
                    <th className={classes.th}>Причина</th>
                    <th className={classes.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((t) => (
                    <tr key={t._id}>
                      <td className={classes.td}><span className={classes.cellDate}>{formatDateTime(t.createdAt || t.occurredAt)}</span></td>
                      <td className={classes.td}><span className={classes.eventName}>{eventLabel(t.eventType)}<InfoTip title={eventLabel(t.eventType)} text={eventHint(t.eventType)} source={t.eventType} /></span></td>
                      <td className={classes.td}><span className={classes.sourceTag}>{sourceLabel(t.source)}</span></td>
                      <td className={classes.td}><span className={t.finalXp >= 0 ? classes.xpPos : classes.xpNeg}>{t.finalXp >= 0 ? `+${t.finalXp}` : t.finalXp}</span></td>
                      <td className={classes.td}><StatusBadge classes={classes} status={t.status} /></td>
                      <td className={classes.td} style={{ maxWidth: 240, fontSize: 12.5, color: "#667085" }}>{t.reason || "—"}</td>
                      <td className={classes.td}>
                        {t.status === "awarded" && t.sourceType !== "migration" ? (
                          <button type="button" className={classes.btnDanger} disabled={busyOp === "rev:" + t._id} onClick={() => doReverse(t)}>Отменить</button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ SPACEPORT ============ */}
      {section === "spaceport" && (
        <>
          <div className={classes.card}>
            <div className={classes.titleRow}>
              <h3 className={classes.title}>Spaceport — источник XP, а не отдельная шкала</h3>
              <InfoTip text="Уровни Spaceport показывают статус стейкинга и достижения. Они не заменяют ранг пользователя — ранг всегда считается по общему XP." />
            </div>
            <div className={classes.note} data-testid="spaceport-decoupling-note">
              <p className={classes.noteP}>
                Уровни Spaceport — это статус стейкинга и достижений. Это <b>не</b> второй ранг: ранг пользователя всегда считается по единому XP (от «Stellar» до «Universal»).
              </p>
              <p className={classes.noteP}>
                Стейкинг NFT приносит умеренный разовый XP в общий счёт — по совокупным подтверждённым дням стейкинга пользователя, а не по каждому NFT отдельно. Поэтому большим числом NFT нельзя накрутить XP. Уже начисленный XP сохраняется даже после снятия со стейкинга, а прогресс продолжается с накопленных дней.
              </p>
              <div><b>Базовые вехи стейкинга</b> (около 270 XP за два года):</div>
              <ul className={classes.noteList}>
                <li>30 дней — плюс 15 XP</li>
                <li>60 дней — плюс 15 XP</li>
                <li>90 дней — плюс 20 XP</li>
                <li>180 дней — плюс 30 XP</li>
                <li>365 дней — плюс 50 XP</li>
                <li>540 дней — плюс 60 XP</li>
                <li>730 дней — плюс 80 XP</li>
              </ul>
            </div>
          </div>

          <div className={classes.card}>
            <div className={classes.titleRow}>
              <h3 className={classes.title}>Правила начисления XP за Spaceport</h3>
              <InfoTip text="Начисления за стейкинг и достижения Spaceport проходят по общим правилам XP и попадают в единый счёт пользователя." />
            </div>
            {rulesLoading ? <div className={classes.hint}>Загрузка…</div> : spaceportRules.length === 0 ? <div className={classes.hint}>Нет правил для Spaceport.</div> : (
              <div className={classes.scrollX}>
                <table className={classes.table} data-testid="spaceport-rules-table">
                  <thead>
                    <tr>
                      <th className={classes.th}>Событие</th>
                      <th className={classes.th}>Вкл.</th>
                      <th className={classes.th}>XP</th>
                      <th className={classes.th}><span className={classes.thCell}>Лимит всего<InfoTip text="Максимальное число начислений за всё время. 0 — без ограничения." /></span></th>
                      <th className={classes.th}>Без повторов</th>
                      <th className={classes.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {spaceportRules.map((r) => (
                      <tr key={r.eventType}>
                        <td className={classes.td}><span className={classes.eventName}>{eventLabel(r.eventType)}<InfoTip title={eventLabel(r.eventType)} text={eventHint(r.eventType)} source={r.eventType} /></span></td>
                        <td className={classes.td}>
                          <label className={classes.toggle}>
                            <input type="checkbox" className={classes.checkbox} checked={r.enabled} onChange={(e) => patchRule(r.eventType, { enabled: e.target.checked })} />
                            {r.enabled ? "Да" : "Нет"}
                          </label>
                        </td>
                        <td className={classes.td}><input type="number" className={`${classes.input} ${classes.numInput}`} value={r.baseXp} onChange={(e) => patchRule(r.eventType, { baseXp: Number(e.target.value) })} /></td>
                        <td className={classes.td}><input type="number" className={`${classes.input} ${classes.numInput}`} value={r.lifetimeCap} onChange={(e) => patchRule(r.eventType, { lifetimeCap: Number(e.target.value) })} /></td>
                        <td className={classes.td}><Dropdown value={r.uniqueBy} options={UNIQUE_OPTIONS} onChange={(v) => patchRule(r.eventType, { uniqueBy: v as any })} minWidth={150} /></td>
                        <td className={classes.td}><button type="button" className={classes.btnMini} disabled={savingRule === r.eventType} onClick={() => persistRule(r)}>{savingRule === r.eventType ? "…" : "Сохранить"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <SpaceportEditor />
        </>
      )}

      {section === "badges" && <BadgesManager />}
    </div>
  );
};

export default AdminXpRanks;

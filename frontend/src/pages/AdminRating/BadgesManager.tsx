import React, { useEffect, useMemo, useState } from "react";
import { createUseStyles } from "react-jss";
import { toast } from "react-toastify";
import { Dropdown, DdOption } from "./xpUi";
import BadgeHex from "./BadgeHex";
import { BADGE_GLYPH_KEYS } from "./badgeGlyphs";
import { fetchFomiesForPicker, FomieLite } from "../../components/services/adminUnifiedRatings";
import {
  BadgeDefinition,
  BadgeCondition,
  fetchBadgeDefs,
  createBadgeDef,
  updateBadgeDef,
  deleteBadgeDef,
  fetchBadgeHistory,
  fetchBadgeDiagnostics,
  fetchBadgeAnalytics,
  awardUserBadge,
  revokeUserBadge,
  fetchUserBadges,
  BADGE_CATEGORIES,
  BADGE_RARITIES,
  BADGE_AWARD_MODES,
  BADGE_RETENTION,
  BADGE_OPERATORS,
  METRIC_CATALOG,
  allMetrics,
} from "../../components/services/badgesAdmin";

const useStyles = createUseStyles({
  wrap: { display: "grid", gap: 16 },
  subnav: { display: "flex", gap: 2, flexWrap: "wrap", borderBottom: "1px solid #EEF2F7", marginBottom: 6 },
  subBtn: { border: "none", background: "transparent", color: "#6B7788", borderRadius: 0, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -1, transition: "color 160ms ease, border-color 160ms ease", "&:hover": { color: "#6D28D9" } },
  subBtnOn: { background: "transparent", color: "#6D28D9", borderBottomColor: "#6D28D9" },
  card: { border: "1px solid #EEF2F7", borderRadius: 14, padding: 18, background: "#fff" },
  titleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: 800, color: "#1D2939", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 },
  badgeCard: { border: "1px solid #EEF2F7", borderRadius: 12, padding: 14, background: "#FBFDFE", display: "grid", gap: 8 },
  bTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  bName: { fontSize: 14, fontWeight: 800, color: "#1D2939" },
  chip: { display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3 },
  chipCat: { background: "#EDE9FE", color: "#6D28D9" },
  chipRar: { background: "#E0F2FE", color: "#0369A1" },
  chipOff: { background: "#FEE2E2", color: "#B91C1C" },
  bDesc: { fontSize: 12.5, color: "#5B6B82", minHeight: 30 },
  bMeta: { fontSize: 11.5, color: "#8592A6" },
  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  btn: { border: "1px solid #E4EAF1", background: "#fff", color: "#41506A", borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  btnPrimary: { background: "#6D28D9", color: "#fff", borderColor: "#6D28D9", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", border: "none" },
  btnDanger: { background: "#fff", color: "#B91C1C", borderColor: "#FCA5A5", border: "1px solid #FCA5A5", borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 },
  field: { display: "grid", gap: 5 },
  label: { fontSize: 12, fontWeight: 700, color: "#41506A" },
  input: { border: "1px solid #E4EAF1", borderRadius: 9, padding: "9px 11px", fontSize: 13, color: "#1D2939", outline: "none", width: "100%", boxSizing: "border-box" },
  cond: { display: "grid", gridTemplateColumns: "2fr 90px 110px 1fr auto", gap: 8, alignItems: "end", marginBottom: 8 },
  condBox: { border: "1px dashed #DDE5EE", borderRadius: 12, padding: 12, background: "#FAFBFD", marginTop: 6 },
  hint: { fontSize: 12.5, color: "#8592A6", padding: "8px 0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "8px 10px", color: "#6B7788", fontWeight: 700, borderBottom: "1px solid #EEF2F7", fontSize: 12 },
  td: { padding: "8px 10px", borderBottom: "1px solid #F3F6FA", color: "#334155" },
  toggle: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#41506A", fontWeight: 700 },
  userBadgeChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "#EDE9FE", color: "#5B21B6", fontSize: 12, fontWeight: 700, border: "1px solid #DDD6FE" },
});

type SubTab = "list" | "manual" | "history" | "diagnostics" | "analytics";

const emptyDef = (): BadgeDefinition => ({
  code: "", name: "", description: "", category: "STAKING", icon: "", rarity: "common",
  active: true, awardMode: "automatic", criteria: { logic: "AND", conditions: [] },
  xpReward: 0, displayPriority: 100, publicVisible: true, hiddenProgress: false, retentionMode: "permanent",
});

const dd = (arr: string[]): DdOption[] => arr.map((v) => ({ value: v, label: v }));

const BadgesManager: React.FC = () => {
  const classes = useStyles();
  const [tab, setTab] = useState<SubTab>("list");
  const [defs, setDefs] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<BadgeDefinition | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fomies, setFomies] = useState<FomieLite[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [awardCode, setAwardCode] = useState("");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [diag, setDiag] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);

  const loadDefs = async () => {
    setLoading(true);
    const res = await fetchBadgeDefs();
    if (res.success && Array.isArray(res.data)) setDefs(res.data);
    else toast.error("Не удалось загрузить бейджи");
    setLoading(false);
  };
  useEffect(() => { loadDefs(); }, []);
  useEffect(() => {
    if (tab === "manual" && fomies.length === 0) {
      fetchFomiesForPicker().then((res) => {
        if (res.success && res.data?.users) {
          const list = res.data.users.map((u: any) => ({ _id: u._id, name: u.name, username: u.username, email: u.email }));
          setFomies(list);
          if (list[0]) setSelectedUser(list[0]._id);
        }
      });
    }
    if (tab === "history") loadHistory();
    if (tab === "diagnostics") fetchBadgeDiagnostics().then((r) => setDiag(r.success ? r.data : null));
    if (tab === "analytics") fetchBadgeAnalytics().then((r) => setAnalytics(r.success ? r.data : null));
    // eslint-disable-next-line
  }, [tab]);
  useEffect(() => { if (selectedUser) loadUserBadges(selectedUser); }, [selectedUser]);

  const loadUserBadges = async (uid: string) => {
    const res = await fetchUserBadges(uid);
    setUserBadges(res.success ? res.data?.badges || [] : []);
  };
  const loadHistory = async () => {
    const res = await fetchBadgeHistory();
    setHistory(res.success && Array.isArray(res.data) ? res.data : []);
  };

  // ---------------- editor ----------------
  const openNew = () => { setEditing(emptyDef()); setIsNew(true); };
  const openEdit = (b: BadgeDefinition) => { setEditing(JSON.parse(JSON.stringify(b))); setIsNew(false); };
  const patch = (p: Partial<BadgeDefinition>) => setEditing((e) => (e ? { ...e, ...p } : e));
  const patchCriteria = (p: Partial<NonNullable<BadgeDefinition["criteria"]>>) =>
    setEditing((e) => (e ? { ...e, criteria: { logic: e.criteria?.logic || "AND", conditions: e.criteria?.conditions || [], ...p } } : e));
  const patchCond = (idx: number, p: Partial<BadgeCondition>) =>
    setEditing((e) => {
      if (!e) return e;
      const conditions = (e.criteria?.conditions || []).map((c, i) => (i === idx ? { ...c, ...p } : c));
      return { ...e, criteria: { logic: e.criteria?.logic || "AND", conditions } };
    });
  const addCond = () => {
    const cat = editing?.category || "STAKING";
    const first = (METRIC_CATALOG[cat] || allMetrics())[0] || allMetrics()[0];
    patchCriteria({ conditions: [...(editing?.criteria?.conditions || []), { metric: first?.metric || "xp", op: ">=", value: 1, unit: first?.unit || "" }] });
  };
  const removeCond = (idx: number) =>
    setEditing((e) => (e ? { ...e, criteria: { logic: e.criteria?.logic || "AND", conditions: (e.criteria?.conditions || []).filter((_, i) => i !== idx) } } : e));

  const metricOptionsFor = (cat: string): DdOption[] => {
    const list = METRIC_CATALOG[cat]?.length ? METRIC_CATALOG[cat] : allMetrics();
    return list.map((m) => ({ value: m.metric, label: `${m.label}${m.unit ? ` (${m.unit})` : ""}` }));
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.code || !editing.name) { toast.error("Код и название обязательны"); return; }
    setSaving(true);
    const res = isNew ? await createBadgeDef(editing) : await updateBadgeDef(editing.code, editing);
    setSaving(false);
    if (res.success) { toast.success(isNew ? "Бейдж создан" : "Бейдж сохранён"); setEditing(null); loadDefs(); }
    else toast.error(res.data?.message || "Ошибка сохранения");
  };
  const remove = async (code: string) => {
    if (!window.confirm(`Удалить бейдж «${code}»?`)) return;
    const res = await deleteBadgeDef(code);
    if (res.success) { toast.success("Бейдж удалён"); loadDefs(); } else toast.error("Ошибка удаления");
  };

  // ---------------- manual ----------------
  const doAward = async () => {
    if (!selectedUser || !awardCode) { toast.error("Выберите пользователя и бейдж"); return; }
    if (!reason.trim()) { toast.error("Укажите причину"); return; }
    const res = await awardUserBadge(selectedUser, awardCode, reason.trim());
    if (res.success && res.data?.success) { toast.success("Бейдж выдан"); setReason(""); loadUserBadges(selectedUser); }
    else toast.error(res.data?.message || "Не удалось выдать (возможно уже есть)");
  };
  const doRevoke = async (code: string) => {
    const r = window.prompt(`Причина отзыва бейджа «${code}»:`);
    if (r === null) return;
    if (!r.trim()) { toast.error("Причина обязательна"); return; }
    const res = await revokeUserBadge(selectedUser, code, r.trim());
    if (res.success) { toast.success("Бейдж отозван"); loadUserBadges(selectedUser); } else toast.error("Ошибка отзыва");
  };

  const userOptions: DdOption[] = useMemo(
    () => fomies.map((f) => ({ value: f._id, label: f.name || f.username || f.email || f._id })),
    [fomies]
  );
  const badgeOptions: DdOption[] = useMemo(() => defs.map((d) => ({ value: d.code, label: `${d.name} (${d.category})` })), [defs]);

  return (
    <div className={classes.wrap} data-testid="badges-manager">
      <div className={classes.subnav} role="tablist">
        {([["list", "Все бейджи"], ["manual", "Выдача / отзыв"], ["history", "История"], ["diagnostics", "Диагностика"], ["analytics", "Аналитика"]] as [SubTab, string][]).map(([k, l]) => (
          <button key={k} type="button" className={`${classes.subBtn} ${tab === k ? classes.subBtnOn : ""}`} onClick={() => setTab(k)} data-testid={`badges-tab-${k}`}>{l}</button>
        ))}
      </div>

      {/* -------- LIST / EDITOR -------- */}
      {tab === "list" && (
        <>
          {editing ? (
            <div className={classes.card} data-testid="badge-editor">
              <div className={classes.titleRow}>
                <h3 className={classes.title}>{isNew ? "Новый бейдж" : `Редактирование: ${editing.name}`}</h3>
                <button type="button" className={classes.btn} onClick={() => setEditing(null)}>Закрыть</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0 18px" }} data-testid="badge-preview">
                <BadgeHex icon={editing.icon} earned size={72} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1D2939" }}>{editing.name || "Название бейджа"}</div>
                  <div style={{ fontSize: 12.5, color: "#8592A6" }}>{editing.category} · {editing.rarity} · {editing.awardMode}</div>
                </div>
              </div>
              <div className={classes.formGrid}>
                <div className={classes.field}><span className={classes.label}>Код (уникальный)</span><input className={classes.input} value={editing.code} disabled={!isNew} onChange={(e) => patch({ code: e.target.value.trim() })} placeholder="staking-90" /></div>
                <div className={classes.field}><span className={classes.label}>Название</span><input className={classes.input} value={editing.name} onChange={(e) => patch({ name: e.target.value })} /></div>
                <div className={classes.field}><span className={classes.label}>Категория</span><Dropdown value={editing.category} options={dd(BADGE_CATEGORIES)} onChange={(v) => patch({ category: v })} minWidth={180} /></div>
                <div className={classes.field}><span className={classes.label}>Редкость</span><Dropdown value={editing.rarity || "common"} options={dd(BADGE_RARITIES)} onChange={(v) => patch({ rarity: v })} minWidth={150} /></div>
                <div className={classes.field}><span className={classes.label}>Режим выдачи</span><Dropdown value={editing.awardMode || "automatic"} options={dd(BADGE_AWARD_MODES)} onChange={(v) => patch({ awardMode: v as any })} minWidth={150} /></div>
                <div className={classes.field}><span className={classes.label}>Хранение</span><Dropdown value={editing.retentionMode || "permanent"} options={dd(BADGE_RETENTION)} onChange={(v) => patch({ retentionMode: v as any })} minWidth={150} /></div>
                <div className={classes.field}><span className={classes.label}>XP-награда (0 = без XP)</span><input type="number" className={classes.input} value={editing.xpReward ?? 0} onChange={(e) => patch({ xpReward: Number(e.target.value) })} /></div>
                <div className={classes.field}><span className={classes.label}>Приоритет отображения</span><input type="number" className={classes.input} value={editing.displayPriority ?? 100} onChange={(e) => patch({ displayPriority: Number(e.target.value) })} /></div>
              </div>
              <div className={classes.field} style={{ marginBottom: 12 }}><span className={classes.label}>Описание</span><input className={classes.input} value={editing.description || ""} onChange={(e) => patch({ description: e.target.value })} /></div>
              <div className={classes.field} style={{ marginBottom: 12 }}>
                <span className={classes.label}>Иконка бейджа (единый стиль)</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 10, border: "1px solid #E4EAF1", borderRadius: 12, maxHeight: 168, overflowY: "auto", background: "#FAFBFD" }} data-testid="badge-icon-picker">
                  {BADGE_GLYPH_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      title={k}
                      onClick={() => patch({ icon: k })}
                      data-testid={`icon-pick-${k}`}
                      style={{ border: editing.icon === k ? "2px solid #2F6BFF" : "2px solid transparent", background: editing.icon === k ? "#EFF5FF" : "transparent", borderRadius: 12, padding: 4, cursor: "pointer", lineHeight: 0, transition: "border-color 150ms ease, background 150ms ease" }}
                    >
                      <BadgeHex icon={k} earned size={40} />
                    </button>
                  ))}
                </div>
              </div>
              <div className={classes.row} style={{ marginBottom: 8 }}>
                <label className={classes.toggle}><input type="checkbox" checked={editing.active !== false} onChange={(e) => patch({ active: e.target.checked })} /> Активен</label>
                <label className={classes.toggle}><input type="checkbox" checked={editing.publicVisible !== false} onChange={(e) => patch({ publicVisible: e.target.checked })} /> Публичный</label>
                <label className={classes.toggle}><input type="checkbox" checked={!!editing.hiddenProgress} onChange={(e) => patch({ hiddenProgress: e.target.checked })} /> Скрывать прогресс</label>
              </div>

              {/* Rule builder */}
              <div className={classes.condBox}>
                <div className={classes.row} style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <span className={classes.label}>Условия начисления (Rule Builder)</span>
                  <div className={classes.row}>
                    <span className={classes.label}>Логика:</span>
                    <Dropdown value={editing.criteria?.logic || "AND"} options={dd(["AND", "OR"])} onChange={(v) => patchCriteria({ logic: v as any })} minWidth={90} />
                    <button type="button" className={classes.btn} onClick={addCond}>+ Условие</button>
                  </div>
                </div>
                {(editing.criteria?.conditions || []).length === 0 ? (
                  <div className={classes.hint}>Условий нет. Для ручных бейджей (Founding Member и т.п.) это нормально — выдаются вручную.</div>
                ) : (
                  (editing.criteria?.conditions || []).map((c, idx) => (
                    <div className={classes.cond} key={idx}>
                      <div className={classes.field}><span className={classes.label}>Метрика</span><Dropdown value={c.metric} options={metricOptionsFor(editing.category)} onChange={(v) => { const meta = allMetrics().find((m) => m.metric === v); patchCond(idx, { metric: v, unit: meta?.unit || c.unit }); }} minWidth={200} /></div>
                      <div className={classes.field}><span className={classes.label}>Оператор</span><Dropdown value={c.op} options={dd(BADGE_OPERATORS)} onChange={(v) => patchCond(idx, { op: v as any })} minWidth={70} /></div>
                      <div className={classes.field}><span className={classes.label}>Значение</span><input type="number" className={classes.input} value={c.value} onChange={(e) => patchCond(idx, { value: Number(e.target.value) })} /></div>
                      <div className={classes.field}><span className={classes.label}>Единица</span><input className={classes.input} value={c.unit || ""} onChange={(e) => patchCond(idx, { unit: e.target.value })} /></div>
                      <button type="button" className={classes.btnDanger} onClick={() => removeCond(idx)}>×</button>
                    </div>
                  ))
                )}
              </div>

              <div className={classes.row} style={{ marginTop: 14 }}>
                <button type="button" className={classes.btnPrimary} disabled={saving} onClick={save} data-testid="badge-save">{saving ? "Сохранение…" : "Сохранить"}</button>
                <button type="button" className={classes.btn} onClick={() => setEditing(null)}>Отмена</button>
              </div>
            </div>
          ) : (
            <div className={classes.card}>
              <div className={classes.titleRow}>
                <h3 className={classes.title}>Каталог бейджей ({defs.length})</h3>
                <button type="button" className={classes.btnPrimary} onClick={openNew} data-testid="badge-new">+ Новый бейдж</button>
              </div>
              {loading ? <div className={classes.hint}>Загрузка…</div> : (
                <div className={classes.grid}>
                  {defs.map((b) => (
                    <div className={classes.badgeCard} key={b.code} data-testid={`badge-card-${b.code}`}>
                      <div className={classes.bTop}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <BadgeHex icon={b.icon} earned size={48} />
                          <span className={classes.bName}>{b.name}</span>
                        </div>
                        <span className={`${classes.chip} ${b.active === false ? classes.chipOff : classes.chipRar}`}>{b.active === false ? "OFF" : b.rarity}</span>
                      </div>
                      <div className={classes.row}><span className={`${classes.chip} ${classes.chipCat}`}>{b.category}</span><span className={classes.bMeta}>{b.awardMode}</span></div>
                      <div className={classes.bDesc}>{b.description || "—"}</div>
                      <div className={classes.bMeta}>{(b.criteria?.conditions || []).map((c) => `${c.metric} ${c.op} ${c.value}`).join(` ${b.criteria?.logic || "AND"} `) || "ручной"}{b.xpReward ? ` · +${b.xpReward}XP` : ""}</div>
                      <div className={classes.row}>
                        <button type="button" className={classes.btn} onClick={() => openEdit(b)} data-testid={`badge-edit-${b.code}`}>Изменить</button>
                        <button type="button" className={classes.btnDanger} onClick={() => remove(b.code)}>Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* -------- MANUAL -------- */}
      {tab === "manual" && (
        <div className={classes.card} data-testid="badges-manual">
          <h3 className={classes.title} style={{ marginBottom: 12 }}>Ручная выдача / отзыв</h3>
          <div className={classes.formGrid}>
            <div className={classes.field}><span className={classes.label}>Пользователь</span><Dropdown value={selectedUser} options={userOptions} onChange={setSelectedUser} minWidth={240} /></div>
            <div className={classes.field}><span className={classes.label}>Бейдж</span><Dropdown value={awardCode} options={badgeOptions} onChange={setAwardCode} minWidth={240} /></div>
            <div className={classes.field}><span className={classes.label}>Причина</span><input className={classes.input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ambassador program" /></div>
          </div>
          <button type="button" className={classes.btnPrimary} onClick={doAward} data-testid="badge-award-btn">Выдать бейдж</button>

          <div style={{ marginTop: 18 }}>
            <span className={classes.label}>Бейджи пользователя:</span>
            <div className={classes.row} style={{ marginTop: 8 }}>
              {userBadges.length === 0 ? <span className={classes.hint}>Нет бейджей</span> : userBadges.map((b) => (
                <span className={classes.userBadgeChip} key={b.code}>{b.name}<button type="button" className={classes.btnDanger} style={{ padding: "1px 7px" }} onClick={() => doRevoke(b.code)}>отозвать</button></span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------- HISTORY -------- */}
      {tab === "history" && (
        <div className={classes.card} data-testid="badges-history">
          <h3 className={classes.title} style={{ marginBottom: 12 }}>История действий</h3>
          <table className={classes.table}>
            <thead><tr><th className={classes.th}>Действие</th><th className={classes.th}>Бейдж</th><th className={classes.th}>Пользователь</th><th className={classes.th}>Кто</th><th className={classes.th}>Причина</th></tr></thead>
            <tbody>
              {history.length === 0 ? <tr><td className={classes.td} colSpan={5}>Пусто</td></tr> : history.map((h, i) => (
                <tr key={i}><td className={classes.td}>{h.action}</td><td className={classes.td}>{h.badgeCode}</td><td className={classes.td}>{h.userId || "—"}</td><td className={classes.td}>{h.actorType}</td><td className={classes.td}>{h.reason || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* -------- DIAGNOSTICS -------- */}
      {tab === "diagnostics" && (
        <div className={classes.card} data-testid="badges-diagnostics">
          <h3 className={classes.title} style={{ marginBottom: 12 }}>Диагностика источников данных</h3>
          {!diag ? <div className={classes.hint}>Загрузка…</div> : (
            <>
              <div className={classes.row} style={{ gap: 18, marginBottom: 14 }}>
                <span className={classes.bMeta}>Определений: <b>{diag.totals.definitions}</b></span>
                <span className={classes.bMeta}>Выдано всего: <b>{diag.totals.totalAwarded}</b></span>
                <span style={{ color: "#0E9F73", fontWeight: 800, fontSize: 12.5 }}>connected: {diag.totals.connected}</span>
                <span style={{ color: "#B45309", fontWeight: 800, fontSize: 12.5 }}>missing: {diag.totals.missing}</span>
                <span style={{ color: "#6B7788", fontWeight: 800, fontSize: 12.5 }}>ручные: {diag.totals.manualOnly}</span>
              </div>
              <table className={classes.table}>
                <thead><tr><th className={classes.th}>Бейдж</th><th className={classes.th}>Категория</th><th className={classes.th}>Источник данных</th><th className={classes.th}>Держателей</th><th className={classes.th}>Редкость %</th><th className={classes.th}>Хранение</th></tr></thead>
                <tbody>
                  {diag.badges.map((b: any) => (
                    <tr key={b.code}>
                      <td className={classes.td}>{b.name}</td>
                      <td className={classes.td}>{b.category}</td>
                      <td className={classes.td}>
                        <span style={{ fontWeight: 700, color: b.dataState === "connected" ? "#0E9F73" : b.dataState === "missing" ? "#B45309" : "#6B7788" }}>
                          {b.dataState === "connected" ? "✓ подключён" : b.dataState === "missing" ? "⚠ не подключён" : "ручной"}
                        </span>
                        {b.metrics.length > 0 && <div className={classes.bMeta}>{b.metrics.map((m: any) => m.metric).join(", ")}</div>}
                      </td>
                      <td className={classes.td}>{b.holders}</td>
                      <td className={classes.td}>{b.rarityPercent}%</td>
                      <td className={classes.td}>{b.retentionMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* -------- ANALYTICS -------- */}
      {tab === "analytics" && (
        <div className={classes.card} data-testid="badges-analytics">
          <h3 className={classes.title} style={{ marginBottom: 12 }}>Аналитика бейджей</h3>
          {!analytics ? <div className={classes.hint}>Загрузка…</div> : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  ["Определений", analytics.totals.definitions, "#2F6BFF"],
                  ["Выдано всего", analytics.totals.issuedTotal, "#0E9F73"],
                  ["Автоматически", analytics.totals.autoIssued, "#6D28D9"],
                  ["Вручную", analytics.totals.manualIssued, "#B45309"],
                  ["Заработано", analytics.totals.earned, "#0369A1"],
                  ["Отозвано", analytics.totals.revoked, "#DC2626"],
                ].map(([label, value, color]) => (
                  <div key={label as string} style={{ background: "#fff", border: "1px solid #E4EAF1", borderRadius: 12, padding: "14px 16px" }} data-testid={`analytics-kpi-${label}`}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: color as string }}>{value as number}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7A879A", textTransform: "uppercase", letterSpacing: 0.3 }}>{label as string}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 20 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1D2939", margin: "0 0 10px" }}>По категориям</h4>
                  {Object.entries(analytics.byCategory as Record<string, any>).sort((a: any, b: any) => b[1].holders - a[1].holders).map(([cat, v]: any) => {
                    const max = Math.max(1, ...Object.values(analytics.byCategory as Record<string, any>).map((x: any) => x.holders));
                    return (
                      <div key={cat} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475467", marginBottom: 3 }}>
                          <span>{cat}</span><span>{v.holders} <span style={{ color: "#98A2B3" }}>({v.definitions})</span></span>
                        </div>
                        <div style={{ height: 8, background: "#EEF2F7", borderRadius: 999 }}>
                          <div style={{ width: `${(v.holders / max) * 100}%`, height: "100%", background: "#2F6BFF", borderRadius: 999, minWidth: v.holders ? 6 : 0 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1D2939", margin: "0 0 10px" }}>По редкости</h4>
                  {Object.entries(analytics.byRarity as Record<string, any>).map(([rar, v]: any) => {
                    const max = Math.max(1, ...Object.values(analytics.byRarity as Record<string, any>).map((x: any) => x.holders));
                    const colors: Record<string, string> = { common: "#64748B", uncommon: "#0E9F73", rare: "#0369A1", epic: "#6D28D9", legendary: "#B45309" };
                    return (
                      <div key={rar} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475467", marginBottom: 3 }}>
                          <span style={{ textTransform: "capitalize" }}>{rar}</span><span>{v.holders} <span style={{ color: "#98A2B3" }}>({v.definitions})</span></span>
                        </div>
                        <div style={{ height: 8, background: "#EEF2F7", borderRadius: 999 }}>
                          <div style={{ width: `${(v.holders / max) * 100}%`, height: "100%", background: colors[rar] || "#64748B", borderRadius: 999, minWidth: v.holders ? 6 : 0 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1D2939", margin: "0 0 10px" }}>Топ обладателей</h4>
              {analytics.topEarners.length === 0 ? <div className={classes.hint} style={{ marginBottom: 18 }}>Пока никто не заработал бейджи</div> : (
                <table className={classes.table} style={{ marginBottom: 20 }}>
                  <thead><tr><th className={classes.th}>Пользователь</th><th className={classes.th}>Email / Кошелёк</th><th className={classes.th}>Бейджей</th><th className={classes.th}>Последний</th></tr></thead>
                  <tbody>
                    {analytics.topEarners.map((u: any) => (
                      <tr key={u.userId}>
                        <td className={classes.td}>{u.name || "—"}</td>
                        <td className={classes.td}>{u.email || u.wallet || "—"}</td>
                        <td className={classes.td}><b>{u.badges}</b></td>
                        <td className={classes.td}>{u.lastEarned ? new Date(u.lastEarned).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1D2939", margin: "0 0 10px" }}>Редчайшие (по держателям)</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {analytics.rarest.map((b: any) => (
                  <div key={b.code} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #EEF2F7", borderRadius: 12, padding: "10px 14px", minWidth: 200 }}>
                    <BadgeHex icon={b.icon} earned size={40} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#101828" }}>{b.name}</div>
                      <div className={classes.bMeta}>{b.holders} держателей · {b.rarityPercent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BadgesManager;

import React, { useEffect, useMemo, useState } from "react";
import { createUseStyles } from "react-jss";
import { toast } from "react-toastify";
import {
  fetchSpaceportConfig,
  saveSpaceportConfig,
  previewSpaceportUser,
  fetchFomiesForPicker,
  SpaceportAdminConfig,
  SpaceportAdminMilestone,
  SpaceportAdminLevel,
  SpaceportPreview,
  FomieLite,
} from "../../components/services/adminUnifiedRatings";
import { Dropdown, DdOption } from "./xpUi";

const useStyles = createUseStyles({
  wrap: { display: "grid", gap: 18 },
  card: {
    background: "#fff",
    border: "1px solid #E4EAF1",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  title: { fontSize: 13, fontWeight: 700, color: "#41506A", textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 6px" },
  hint: { color: "#7B8AA0", fontSize: 12.5, margin: "0 0 16px", lineHeight: 1.55 },
  scrollX: { width: "100%", overflowX: "auto", paddingBottom: 4 },
  table: { width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left", color: "#7B8AA0", fontWeight: 600, fontSize: 11.5,
    textTransform: "uppercase", letterSpacing: 0.3, padding: "8px 12px",
    borderBottom: "1px solid #EEF2F7", whiteSpace: "nowrap",
  },
  td: { padding: "10px 12px", borderBottom: "1px solid #F3F6FA", verticalAlign: "middle" },
  input: {
    width: "100%", height: 38, border: "1px solid #D8E1EB", borderRadius: 10,
    padding: "4px 10px", boxSizing: "border-box", fontSize: 13, outline: "none",
    "&:focus": { borderColor: "#00C099", boxShadow: "0 0 0 3px rgba(0,192,153,0.12)" },
  },
  numInput: { width: 100 },
  textarea: {
    width: "100%", minHeight: 60, border: "1px solid #D8E1EB", borderRadius: 10,
    padding: "8px 10px", boxSizing: "border-box", fontSize: 13, outline: "none", resize: "vertical",
    "&:focus": { borderColor: "#00C099", boxShadow: "0 0 0 3px rgba(0,192,153,0.12)" },
  },
  actions: { display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" },
  btnPrimary: {
    background: "#00C099", border: "none", color: "#fff", borderRadius: 10,
    padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
    "&:disabled": { opacity: 0.55, cursor: "not-allowed" },
  },
  btnGhost: {
    background: "transparent", border: "1px solid #D8E1EB", color: "#41506A", borderRadius: 10,
    padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  btnDanger: {
    background: "transparent", border: "1px solid #FDA29B", color: "#B42318", borderRadius: 9,
    padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
  },
  btnMini: {
    background: "#EEF4FF", border: "none", color: "#3538CD", borderRadius: 9,
    padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
  },
  toggle: { display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12.5, color: "#41506A" },
  checkbox: { width: 17, height: 17, accentColor: "#00C099", cursor: "pointer" },
  err: { color: "#B42318", fontSize: 12.5, marginTop: 8 },
  levelCard: { border: "1px solid #EEF2F7", borderRadius: 12, padding: 16, marginBottom: 14, background: "#FBFDFE" },
  levelHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  levelTitle: { fontSize: 14, fontWeight: 800, color: "#1D2939" },
  grid: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11.5, fontWeight: 600, color: "#7B8AA0", textTransform: "uppercase", letterSpacing: 0.3 },
  full: { gridColumn: "1 / -1" },
  previewGrid: { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", marginBottom: 16 },
  kpi: { border: "1px solid #EEF2F7", borderRadius: 12, padding: "14px 16px", background: "#FBFDFE" },
  kpiLabel: { fontSize: 11.5, color: "#7B8AA0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  kpiValue: { fontSize: 20, fontWeight: 800, color: "#1D2939", marginTop: 4 },
  reqPill: {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
    borderRadius: 999, fontSize: 12.5, fontWeight: 600, marginRight: 8, marginBottom: 8,
  },
  reqOk: { background: "rgba(0,192,153,0.12)", color: "#00815F" },
  reqNo: { background: "#F2F4F7", color: "#667085" },
  lvlRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F3F6FA", flexWrap: "wrap" },
  statusTag: { padding: "2px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700 },
});

const UNIQUE_DAYS = (ms: SpaceportAdminMilestone[]) => new Set(ms.map((m) => m.days)).size === ms.length;
const ASCENDING = (ms: SpaceportAdminMilestone[]) => ms.every((m, i) => i === 0 || m.days > ms[i - 1].days);

const SpaceportEditor: React.FC = () => {
  const classes = useStyles();
  const [cfg, setCfg] = useState<SpaceportAdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMs, setSavingMs] = useState(false);
  const [savingLv, setSavingLv] = useState(false);

  const [fomies, setFomies] = useState<FomieLite[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [preview, setPreview] = useState<SpaceportPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetchSpaceportConfig();
    setLoading(false);
    if (res.success && res.data) {
      setCfg({
        milestones: (res.data.milestones || []).map((m) => ({ days: m.days, xp: m.xp, active: m.active !== false })),
        levels: (res.data.levels || []) as SpaceportAdminLevel[],
        stakingPeriodsMonths: res.data.stakingPeriodsMonths || [1, 3, 6, 12, 18, 24],
        version: res.data.version || 1,
      });
    } else toast.error(res.error || "Не удалось загрузить конфигурацию Spaceport");
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
  useEffect(() => { load(); loadFomies(); /* eslint-disable-next-line */ }, []);

  const runPreview = async (userId: string) => {
    if (!userId) return;
    setPreviewLoading(true);
    const res = await previewSpaceportUser(userId);
    setPreviewLoading(false);
    if (res.success && res.data) setPreview(res.data);
    else toast.error(res.error || "Не удалось получить предпросмотр");
  };
  useEffect(() => { if (selectedUser) runPreview(selectedUser); /* eslint-disable-next-line */ }, [selectedUser]);

  /* ---------- Milestones ---------- */
  const msValid = useMemo(() => {
    if (!cfg) return false;
    if (!ASCENDING(cfg.milestones)) return false;
    if (!UNIQUE_DAYS(cfg.milestones)) return false;
    return cfg.milestones.every((m) => m.days > 0 && m.xp >= 0);
  }, [cfg]);

  const patchMilestone = (idx: number, patch: Partial<SpaceportAdminMilestone>) =>
    setCfg((c) => (c ? { ...c, milestones: c.milestones.map((m, i) => (i === idx ? { ...m, ...patch } : m)) } : c));
  const addMilestone = () =>
    setCfg((c) => {
      if (!c) return c;
      const lastDays = c.milestones.length ? c.milestones[c.milestones.length - 1].days : 0;
      return { ...c, milestones: [...c.milestones, { days: lastDays + 30, xp: 10, active: true }] };
    });
  const removeMilestone = (idx: number) =>
    setCfg((c) => (c ? { ...c, milestones: c.milestones.filter((_, i) => i !== idx) } : c));

  const saveMilestones = async () => {
    if (!cfg) return;
    if (!msValid) { toast.error("Проверьте вехи: дни должны возрастать и быть уникальными, XP ≥ 0."); return; }
    setSavingMs(true);
    const res = await saveSpaceportConfig({ milestones: cfg.milestones });
    setSavingMs(false);
    if (res.success) { toast.success("Вехи стейкинга сохранены"); load(); if (selectedUser) runPreview(selectedUser); }
    else toast.error(res.error || "Не удалось сохранить вехи");
  };

  /* ---------- Levels ---------- */
  const patchLevel = (idx: number, patch: Partial<SpaceportAdminLevel>) =>
    setCfg((c) => (c ? { ...c, levels: c.levels.map((l, i) => (i === idx ? { ...l, ...patch } : l)) } : c));
  const addLevel = () =>
    setCfg((c) => {
      if (!c) return c;
      const nextLevel = c.levels.length ? Math.max(...c.levels.map((l) => l.level)) + 1 : 1;
      return {
        ...c,
        levels: [...c.levels, {
          level: nextLevel, name: `Уровень ${nextLevel}`, description: "", active: true,
          minLifetimeDays: 0, minActivityXp: 0, requiresNft: true, minLaunchpad: 0, minTrades: 0, benefits: [],
        }],
      };
    });
  const removeLevel = (idx: number) =>
    setCfg((c) => (c ? { ...c, levels: c.levels.filter((_, i) => i !== idx) } : c));

  const saveLevels = async () => {
    if (!cfg) return;
    setSavingLv(true);
    const res = await saveSpaceportConfig({ levels: cfg.levels });
    setSavingLv(false);
    if (res.success) { toast.success("Уровни Spaceport сохранены"); load(); if (selectedUser) runPreview(selectedUser); }
    else toast.error(res.error || "Не удалось сохранить уровни");
  };

  const userOptions: DdOption[] = fomies.map((u) => ({
    value: u._id, label: `${u.name || u.username || "Пользователь"} — ${u.activityXP ?? 0} XP`,
  }));

  if (loading) return <div className={classes.hint}>Загрузка конфигурации Spaceport…</div>;
  if (!cfg) return <div className={classes.hint}>Конфигурация недоступна.</div>;

  return (
    <div className={classes.wrap} data-testid="spaceport-editor">
      {/* A. MILESTONES */}
      <div className={classes.card}>
        <h3 className={classes.title}>A. XP-вехи стейкинга</h3>
        <p className={classes.hint}>
          Разовый XP за совокупные подтверждённые дни стейкинга. Дни должны возрастать и быть уникальными. XP попадает в единый счёт пользователя.
        </p>
        <div className={classes.scrollX}>
          <table className={classes.table} data-testid="spaceport-milestones-table">
            <thead>
              <tr>
                <th className={classes.th}>Период (дней)</th>
                <th className={classes.th}>XP</th>
                <th className={classes.th}>Активно</th>
                <th className={classes.th}></th>
              </tr>
            </thead>
            <tbody>
              {cfg.milestones.map((m, idx) => (
                <tr key={idx} data-testid={`spaceport-milestone-row-${idx}`}>
                  <td className={classes.td}>
                    <input type="number" className={`${classes.input} ${classes.numInput}`} value={m.days}
                      data-testid={`spaceport-milestone-days-${idx}`}
                      onChange={(e) => patchMilestone(idx, { days: Number(e.target.value) })} />
                  </td>
                  <td className={classes.td}>
                    <input type="number" className={`${classes.input} ${classes.numInput}`} value={m.xp}
                      data-testid={`spaceport-milestone-xp-${idx}`}
                      onChange={(e) => patchMilestone(idx, { xp: Number(e.target.value) })} />
                  </td>
                  <td className={classes.td}>
                    <label className={classes.toggle}>
                      <input type="checkbox" className={classes.checkbox} checked={m.active}
                        onChange={(e) => patchMilestone(idx, { active: e.target.checked })} />
                      {m.active ? "Да" : "Нет"}
                    </label>
                  </td>
                  <td className={classes.td}>
                    <button type="button" className={classes.btnDanger} onClick={() => removeMilestone(idx)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!msValid && <div className={classes.err}>Дни должны строго возрастать и быть уникальными, XP ≥ 0.</div>}
        <div className={classes.actions}>
          <button type="button" className={classes.btnPrimary} disabled={savingMs || !msValid} data-testid="spaceport-milestones-save" onClick={saveMilestones}>
            {savingMs ? "Сохранение…" : "Сохранить вехи"}
          </button>
          <button type="button" className={classes.btnMini} onClick={addMilestone} data-testid="spaceport-milestone-add">+ Добавить веху</button>
          <button type="button" className={classes.btnGhost} onClick={load}>Отменить изменения</button>
        </div>
      </div>

      {/* B. LEVELS */}
      <div className={classes.card}>
        <h3 className={classes.title}>B. Уровни Spaceport</h3>
        <p className={classes.hint}>Статус стейкинга Lv.1–Lv.5. Это не второй ранг: ранг пользователя всегда считается по единому XP.</p>
        {cfg.levels.map((l, idx) => (
          <div className={classes.levelCard} key={idx} data-testid={`spaceport-level-card-${l.level}`}>
            <div className={classes.levelHead}>
              <span className={classes.levelTitle}>Ур. {l.level}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label className={classes.toggle}>
                  <input type="checkbox" className={classes.checkbox} checked={l.active !== false}
                    onChange={(e) => patchLevel(idx, { active: e.target.checked })} />
                  Активен
                </label>
                <button type="button" className={classes.btnDanger} onClick={() => removeLevel(idx)}>Удалить</button>
              </div>
            </div>
            <div className={classes.grid}>
              <div className={`${classes.field} ${classes.full}`}>
                <span className={classes.label}>Название</span>
                <input className={classes.input} value={l.name} data-testid={`spaceport-level-name-${l.level}`}
                  onChange={(e) => patchLevel(idx, { name: e.target.value })} />
              </div>
              <div className={`${classes.field} ${classes.full}`}>
                <span className={classes.label}>Описание</span>
                <textarea className={classes.textarea} value={l.description || ""}
                  onChange={(e) => patchLevel(idx, { description: e.target.value })} />
              </div>
              <div className={classes.field}>
                <span className={classes.label}>Мин. дней стейкинга</span>
                <input type="number" className={classes.input} value={l.minLifetimeDays || 0}
                  data-testid={`spaceport-level-days-${l.level}`}
                  onChange={(e) => patchLevel(idx, { minLifetimeDays: Number(e.target.value) })} />
              </div>
              <div className={classes.field}>
                <span className={classes.label}>Мин. XP</span>
                <input type="number" className={classes.input} value={l.minActivityXp || 0}
                  data-testid={`spaceport-level-xp-${l.level}`}
                  onChange={(e) => patchLevel(idx, { minActivityXp: Number(e.target.value) })} />
              </div>
              <div className={classes.field}>
                <span className={classes.label}>Участие в Launchpad</span>
                <input type="number" className={classes.input} value={l.minLaunchpad || 0}
                  onChange={(e) => patchLevel(idx, { minLaunchpad: Number(e.target.value) })} />
              </div>
              <div className={classes.field}>
                <span className={classes.label}>Сделки (мин.)</span>
                <input type="number" className={classes.input} value={l.minTrades || 0}
                  onChange={(e) => patchLevel(idx, { minTrades: Number(e.target.value) })} />
              </div>
              <div className={classes.field}>
                <span className={classes.label}>Требуется NFT</span>
                <label className={classes.toggle}>
                  <input type="checkbox" className={classes.checkbox} checked={l.requiresNft !== false}
                    onChange={(e) => patchLevel(idx, { requiresNft: e.target.checked })} />
                  {l.requiresNft !== false ? "Да" : "Нет"}
                </label>
              </div>
              <div className={`${classes.field} ${classes.full}`}>
                <span className={classes.label}>Привилегии (через запятую)</span>
                <input className={classes.input} value={(l.benefits || []).join(", ")}
                  onChange={(e) => patchLevel(idx, { benefits: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
            </div>
          </div>
        ))}
        <div className={classes.actions}>
          <button type="button" className={classes.btnPrimary} disabled={savingLv} data-testid="spaceport-levels-save" onClick={saveLevels}>
            {savingLv ? "Сохранение…" : "Сохранить уровни"}
          </button>
          <button type="button" className={classes.btnMini} onClick={addLevel} data-testid="spaceport-level-add">+ Добавить уровень</button>
          <button type="button" className={classes.btnGhost} onClick={load}>Отменить изменения</button>
        </div>
      </div>

      {/* C. USER PREVIEW */}
      <div className={classes.card}>
        <h3 className={classes.title}>C. Предпросмотр пользователя</h3>
        <p className={classes.hint}>Как текущая конфигурация применяется к конкретному пользователю: XP, ранг, NFT, стейкинг и статус уровней.</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <Dropdown value={selectedUser} options={userOptions.length ? userOptions : [{ value: "", label: "Нет пользователей" }]}
            onChange={setSelectedUser} testid="spaceport-preview-user" minWidth={260} />
          <button type="button" className={classes.btnGhost} onClick={() => runPreview(selectedUser)} disabled={previewLoading}>
            {previewLoading ? "Загрузка…" : "Обновить"}
          </button>
        </div>

        {preview ? (
          <div data-testid="spaceport-preview-result">
            <div className={classes.previewGrid}>
              <div className={classes.kpi}><div className={classes.kpiLabel}>Глобальный XP</div><div className={classes.kpiValue}>{preview.activityXp}</div></div>
              <div className={classes.kpi}><div className={classes.kpiLabel}>XP-ранг</div><div className={classes.kpiValue} style={{ fontSize: 15 }}>{preview.xpRank}</div></div>
              <div className={classes.kpi}><div className={classes.kpiLabel}>Уровень Spaceport</div><div className={classes.kpiValue} style={{ fontSize: 15 }}>Ур. {preview.spaceport.currentLevel} — {preview.spaceport.currentLevelName}</div></div>
              <div className={classes.kpi}><div className={classes.kpiLabel}>Стейкинг</div><div className={classes.kpiValue} style={{ fontSize: 15 }}>{preview.staking.active ? "Активен" : "Не активен"}</div></div>
              <div className={classes.kpi}><div className={classes.kpiLabel}>Непрерывный / всего дней</div><div className={classes.kpiValue} style={{ fontSize: 15 }}>{preview.staking.currentContinuousStakeDays} / {preview.staking.lifetimeQualifiedStakeDays}</div></div>
              <div className={classes.kpi}><div className={classes.kpiLabel}>Активных NFT</div><div className={classes.kpiValue}>{preview.nft.activeCount}</div></div>
              <div className={classes.kpi}>
                <div className={classes.kpiLabel}>Следующая веха</div>
                <div className={classes.kpiValue} style={{ fontSize: 15 }}>
                  {preview.staking.nextMilestoneDays
                    ? `${preview.staking.nextMilestoneDays} дн. (+${preview.staking.nextMilestoneXp} XP, осталось ${preview.staking.daysToNextMilestone})`
                    : "Все достигнуты"}
                </div>
              </div>
            </div>

            <div>
              {preview.spaceport.levels.map((l) => {
                const tagColor =
                  l.status === "current" ? { background: "rgba(0,192,153,0.14)", color: "#00815F" }
                  : l.status === "completed" ? { background: "rgba(53,56,205,0.10)", color: "#3538CD" }
                  : { background: "#F2F4F7", color: "#667085" };
                const statusLabel = l.status === "current" ? "Текущий" : l.status === "completed" ? "Пройден" : l.status === "next" ? "Следующий" : "Закрыт";
                return (
                  <div className={classes.lvlRow} key={l.level} data-testid={`spaceport-preview-level-${l.level}`}>
                    <span style={{ fontWeight: 800, color: "#1D2939", minWidth: 52 }}>Ур. {l.level}</span>
                    <span style={{ fontWeight: 600, color: "#41506A", minWidth: 90 }}>{l.name}</span>
                    <span className={classes.statusTag} style={tagColor as any}>{statusLabel}</span>
                    <span style={{ fontSize: 12, color: "#7B8AA0" }}>{l.requirementsMet ?? 0}/{l.requirementsTotal ?? l.requirements.length} условий</span>
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {l.requirements.map((r) => (
                        <span key={r.key} className={`${classes.reqPill} ${r.met ? classes.reqOk : classes.reqNo}`}>
                          {r.met ? "✓" : "✗"} {r.label}
                          {typeof r.current === "number" && typeof r.target === "number" && r.target > 0 ? ` (${r.current}/${r.target})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={classes.hint}>Выберите пользователя для предпросмотра.</div>
        )}
      </div>
    </div>
  );
};

export default SpaceportEditor;

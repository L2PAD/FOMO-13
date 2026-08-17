import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { T, Card, KpiCard, KpiGrid, SimpleTable, Badge, StateBlock, fmtDate, Column } from "../Statistics/ui";
import avatarImage from "../../assets/img/avatar.png";
import {
  listModerators,
  createModerator,
  deleteModerator,
  updateModerator,
  getModeratorDetail,
  addModeratorTask,
  updateModeratorTask,
  deleteModeratorTask,
  ModeratorRow,
  ModeratorsOverview,
  ModeratorTask,
} from "../../components/services/moderators";

/* ── shared styles ── */
const primary: React.CSSProperties = { padding: "10px 16px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" };
const ghost: React.CSSProperties = { ...primary, background: "#fff", color: T.ink, border: `1px solid ${T.border}` };
const danger: React.CSSProperties = { ...primary, background: T.bad };
const field: React.CSSProperties = { width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 6, display: "block" };

const roleTone = (role: string): "info" | "default" => (role === "admin" ? "info" : "default");
const roleLabel = (role: string): string => (role === "admin" ? "Администратор" : role === "moderator" ? "Модератор" : role);
const statusTone = (s: string): "good" | "bad" | "warn" | "default" => (s === "active" ? "good" : s === "blocked" ? "bad" : "warn");
const statusLabel = (s: string): string => (s === "active" ? "Активен" : s === "blocked" ? "Заблокирован" : "Неактивен");
const prioTone = (p: string): "bad" | "warn" | "default" => (p === "high" ? "bad" : p === "medium" ? "warn" : "default");
const prioLabel = (p: string): string => (p === "high" ? "Высокий" : p === "medium" ? "Средний" : "Низкий");
const taskStatusTone = (s: string): "good" | "info" | "default" => (s === "done" ? "good" : s === "in_progress" ? "info" : "default");
const taskStatusLabel = (s: string): string => (s === "done" ? "Готово" : s === "in_progress" ? "В работе" : "Открыта");

const Avatar: React.FC<{ src?: string; size?: number }> = ({ src, size = 34 }) => (
  <img
    src={src || avatarImage}
    alt=""
    style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `1px solid ${T.border}`, background: T.soft }}
    onError={(e) => { (e.currentTarget as HTMLImageElement).src = avatarImage; }}
  />
);

/* ── Overlay wrapper for modal / drawer ── */
const Overlay: React.FC<{ onClose: () => void; children: React.ReactNode; align?: "center" | "right" }> = ({ onClose, children, align = "center" }) => (
  <div
    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.42)", zIndex: 1000,
      display: "flex", justifyContent: align === "right" ? "flex-end" : "center",
      alignItems: align === "right" ? "stretch" : "flex-start", padding: align === "right" ? 0 : 24,
      overflowY: "auto",
    }}
  >
    {children}
  </div>
);

/* ── Add moderator modal ── */
const AddModeratorModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ email: "", name: "", wallet: "", password: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!form.email.trim() || !form.password.trim()) return toast.error("Email и пароль обязательны");
    setBusy(true);
    const r = await createModerator({ email: form.email.trim(), password: form.password, name: form.name.trim(), wallet: form.wallet.trim() });
    setBusy(false);
    if (r.success) { toast.success("Модератор добавлен"); onCreated(); onClose(); }
    else toast.error(r.data?.message || "Не удалось создать модератора");
  };
  return (
    <Overlay onClose={onClose}>
      <div style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 16, border: `1px solid ${T.border}`, padding: 22, marginTop: 40 }} data-testid="add-moderator-modal">
        <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Добавить модератора</div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 18 }}>Создаётся аккаунт с ролью модератора и доступом в CRM.</div>
        <div style={{ display: "grid", gap: 14 }}>
          <div><label style={label}>Email *</label><input style={field} value={form.email} data-testid="add-mod-email" onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="moderator@fomo.local" /></div>
          <div><label style={label}>Имя</label><input style={field} value={form.name} data-testid="add-mod-name" onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Имя модератора" /></div>
          <div><label style={label}>Wallet address</label><input style={field} value={form.wallet} data-testid="add-mod-wallet" onChange={(e) => setForm({ ...form, wallet: e.target.value })} placeholder="0x… (необязательно)" /></div>
          <div><label style={label}>Пароль *</label><input type="password" style={field} value={form.password} data-testid="add-mod-password" onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button style={ghost} onClick={onClose} disabled={busy}>Отмена</button>
          <button style={primary} onClick={submit} disabled={busy} data-testid="add-mod-submit">{busy ? "Создание…" : "Добавить"}</button>
        </div>
      </div>
    </Overlay>
  );
};

/* ── Tasks manager (inside drawer) ── */
const TasksManager: React.FC<{ moderatorId: string; tasks: ModeratorTask[]; onChanged: () => void }> = ({ moderatorId, tasks, onChanged }) => {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!form.title.trim()) return toast.error("Введите название задачи");
    setBusy(true);
    const r = await addModeratorTask(moderatorId, { title: form.title.trim(), description: form.description.trim(), priority: form.priority });
    setBusy(false);
    if (r.success) { setForm({ title: "", description: "", priority: "medium" }); onChanged(); }
    else toast.error("Не удалось добавить задачу");
  };
  const setStatus = async (t: ModeratorTask, status: string) => {
    const r = await updateModeratorTask(moderatorId, t._id, { status: status as any });
    if (r.success) onChanged(); else toast.error("Ошибка обновления");
  };
  const remove = async (t: ModeratorTask) => {
    const r = await deleteModeratorTask(moderatorId, t._id);
    if (r.success) onChanged(); else toast.error("Ошибка удаления");
  };

  return (
    <div data-testid="tasks-manager">
      <div style={{ display: "grid", gap: 10, marginBottom: 14, padding: 14, background: T.soft, borderRadius: 12 }}>
        <input style={field} placeholder="Новая задача (например: проверить очередь проектов)" value={form.title} data-testid="task-title"
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input style={field} placeholder="Описание (необязательно)" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select style={{ ...field, maxWidth: 180 }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Низкий приоритет</option>
            <option value="medium">Средний приоритет</option>
            <option value="high">Высокий приоритет</option>
          </select>
          <button style={primary} onClick={add} disabled={busy} data-testid="task-add">{busy ? "…" : "Назначить задачу"}</button>
        </div>
      </div>

      {!tasks.length ? (
        <StateBlock kind="empty" message="Задач пока нет. Назначьте первую задачу модератору." height={80} />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {tasks.map((t) => (
            <div key={t._id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }} data-testid="task-item">
              <div style={{ minWidth: 200, flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: T.ink, fontSize: 13.5, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
                  <Badge tone={prioTone(t.priority)}>{prioLabel(t.priority)}</Badge>
                  <Badge tone={taskStatusTone(t.status)}>{taskStatusLabel(t.status)}</Badge>
                </div>
                {t.description ? <div style={{ fontSize: 12.5, color: T.sub, marginTop: 4 }}>{t.description}</div> : null}
                <div style={{ fontSize: 11.5, color: T.faint, marginTop: 4 }}>Создана {fmtDate(t.createdAt)}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {t.status !== "in_progress" && t.status !== "done" ? <button style={{ ...ghost, padding: "6px 10px", fontSize: 12 }} onClick={() => setStatus(t, "in_progress")}>В работу</button> : null}
                {t.status !== "done" ? <button style={{ ...primary, padding: "6px 10px", fontSize: 12 }} onClick={() => setStatus(t, "done")} data-testid="task-done">Готово</button> : <button style={{ ...ghost, padding: "6px 10px", fontSize: 12 }} onClick={() => setStatus(t, "open")}>Вернуть</button>}
                <button style={{ ...ghost, padding: "6px 10px", fontSize: 12, color: T.bad, borderColor: "#F3C6C6" }} onClick={() => remove(t)} data-testid="task-delete">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Moderator detail drawer ── */
const ModeratorDrawer: React.FC<{ id: string; onClose: () => void; onChanged: () => void }> = ({ id, onClose, onChanged }) => {
  const [detail, setDetail] = useState<(ModeratorRow & { bio: string; tasks: ModeratorTask[]; recentActions: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await getModeratorDetail(id);
    setDetail(r.success ? r.data : null);
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (status: string) => {
    const r = await updateModerator(id, { status });
    if (r.success) { toast.success("Статус обновлён"); load(); onChanged(); } else toast.error("Ошибка");
  };
  const remove = async () => {
    if (!window.confirm("Удалить этого пользователя? Действие необратимо.")) return;
    const r = await deleteModerator(id);
    if (r.success) { toast.success("Удалён"); onChanged(); onClose(); } else toast.error("Ошибка удаления");
  };

  return (
    <Overlay onClose={onClose} align="right">
      <div style={{ width: "100%", maxWidth: 560, background: T.pageBg, height: "100%", overflowY: "auto", borderLeft: `1px solid ${T.border}`, padding: 24 }} data-testid="moderator-drawer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>Профиль сотрудника</div>
          <button style={{ ...ghost, padding: "6px 12px" }} onClick={onClose} data-testid="drawer-close">Закрыть</button>
        </div>

        {loading || !detail ? (
          <Card><StateBlock kind={loading ? "loading" : "error"} message={loading ? undefined : "Не удалось загрузить профиль"} /></Card>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <Card>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar src={detail.avatar} size={52} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>{detail.name || detail.email}</div>
                  <div style={{ fontSize: 13, color: T.sub }}>{detail.email}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <Badge tone={roleTone(detail.role)}>{roleLabel(detail.role)}</Badge>
                    <Badge tone={statusTone(detail.status)}>{statusLabel(detail.status)}</Badge>
                    {detail.is2FAEnabled ? <Badge tone="good">2FA</Badge> : null}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {detail.role !== "admin" && (
                  detail.status === "active"
                    ? <button style={{ ...ghost, color: T.bad, borderColor: "#F3C6C6" }} onClick={() => changeStatus("blocked")} data-testid="drawer-block">Заблокировать</button>
                    : <button style={ghost} onClick={() => changeStatus("active")} data-testid="drawer-activate">Активировать</button>
                )}
                {detail.role !== "admin" && <button style={danger} onClick={remove} data-testid="drawer-delete">Удалить</button>}
              </div>
            </Card>

            <KpiGrid min={150}>
              <KpiCard label="Обработано" value={detail.stats.totalHandled} testId="drawer-handled" />
              <KpiCard label="Подтверждено" value={detail.stats.confirmed} tone="good" />
              <KpiCard label="Отклонено" value={detail.stats.rejected} tone="bad" />
              <KpiCard label="Аппрув-рейт" value={`${detail.stats.approvalRate}%`} />
            </KpiGrid>

            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Задачи модератора</div>
              <TasksManager moderatorId={id} tasks={detail.tasks} onChanged={() => { load(); onChanged(); }} />
            </Card>

            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Недавняя работа</div>
              <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 12 }}>Последние подтверждённые действия (как часто модератор апрувит события).</div>
              {detail.recentActions?.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {detail.recentActions.map((a) => (
                    <div key={a._id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.soft}` }}>
                      <span style={{ fontSize: 13, color: T.ink }}>{a.name || a.type} <span style={{ color: T.faint }}>· {a.category}</span></span>
                      <span style={{ fontSize: 12, color: T.sub, whiteSpace: "nowrap" }}>{fmtDate(a.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <StateBlock kind="empty" message="Пока нет обработанных событий. Данные появятся, когда модератор начнёт апрувить очередь." height={70} />
              )}
            </Card>
          </div>
        )}
      </div>
    </Overlay>
  );
};

/* ── Main tab ── */
const ModeratorsTab: React.FC = () => {
  const [rows, setRows] = useState<ModeratorRow[]>([]);
  const [overview, setOverview] = useState<ModeratorsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "moderator">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const r = await listModerators();
    if (r.success) { setRows(r.data.rows || []); setOverview(r.data.overview || null); }
    else setError("Не удалось загрузить список сотрудников");
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (!q) return true;
      return [r.email, r.name, r.username, r.wallet].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, search, roleFilter]);

  const columns: Column<ModeratorRow>[] = [
    {
      key: "user", header: "Пользователь", render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={r.avatar} />
          <div>
            <div style={{ fontWeight: 700, color: T.ink }}>{r.name || r.email}</div>
            <div style={{ fontSize: 11.5, color: T.faint }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Роль", render: (r) => <Badge tone={roleTone(r.role)}>{roleLabel(r.role)}</Badge> },
    { key: "status", header: "Статус", render: (r) => <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge> },
    { key: "handled", header: "Обработано", align: "right", render: (r) => <span style={{ fontWeight: 700 }}>{r.stats.totalHandled}</span> },
    { key: "confirmed", header: "Подтв.", align: "right", render: (r) => <span style={{ color: T.good, fontWeight: 700 }}>{r.stats.confirmed}</span> },
    { key: "rejected", header: "Откл.", align: "right", render: (r) => <span style={{ color: T.bad, fontWeight: 700 }}>{r.stats.rejected}</span> },
    { key: "rate", header: "Аппрув", align: "right", render: (r) => <span>{r.stats.approvalRate}%</span> },
    { key: "tasks", header: "Задачи", align: "right", render: (r) => (r.openTasks ? <Badge tone="warn">{r.openTasks}</Badge> : <span style={{ color: T.faint }}>0</span>) },
    { key: "lastLogin", header: "Вход", render: (r) => <span style={{ color: T.sub }}>{fmtDate(r.lastLogin)}</span> },
  ];

  const segBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px", borderRadius: 9, border: `1px solid ${active ? T.accent : T.border}`,
    background: active ? "#EEF2FF" : "#fff", color: active ? T.accent : T.sub, fontWeight: 700, fontSize: 13, cursor: "pointer",
  });

  return (
    <div data-testid="moderators-tab" style={{ display: "grid", gap: 18 }}>
      {/* Overview */}
      <KpiGrid min={180}>
        <KpiCard label="Модераторы" value={overview?.totalModerators ?? "—"} hint={`Админов: ${overview?.totalAdmins ?? 0}`} testId="kpi-moderators" />
        <KpiCard label="Активные" value={overview?.activeModerators ?? "—"} tone="good" />
        <KpiCard label="Обработано действий" value={overview?.totalHandled ?? "—"} />
        <KpiCard label="Аппрув-рейт" value={overview ? `${overview.approvalRate}%` : "—"} />
        <KpiCard label="Очередь на модерацию" value={overview?.pendingQueue ?? "—"} tone={overview?.pendingQueue ? "warn" : "default"} />
      </KpiGrid>

      {/* Toolbar */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.faint, fontSize: 14 }}>⌕</span>
              <input
                data-testid="mod-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по email, имени, кошельку…"
                style={{ ...field, width: 300, maxWidth: "70vw", paddingLeft: 32 }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={segBtn(roleFilter === "all")} onClick={() => setRoleFilter("all")} data-testid="filter-all">Все</button>
              <button style={segBtn(roleFilter === "admin")} onClick={() => setRoleFilter("admin")} data-testid="filter-admins">Администраторы</button>
              <button style={segBtn(roleFilter === "moderator")} onClick={() => setRoleFilter("moderator")} data-testid="filter-moderators">Модераторы</button>
            </div>
          </div>
          <button style={primary} onClick={() => setShowAdd(true)} data-testid="add-moderator-btn">+ Добавить модератора</button>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 8 }}>
        {loading ? (
          <div style={{ padding: 16 }}><StateBlock kind="loading" /></div>
        ) : error ? (
          <StateBlock kind="error" message={error} onRetry={load} />
        ) : (
          <SimpleTable
            testId="moderators-table"
            columns={columns}
            rows={filtered}
            empty="Сотрудники не найдены. Добавьте первого модератора."
            onRowClick={(r) => setOpenId(r._id)}
          />
        )}
      </Card>

      {showAdd && <AddModeratorModal onClose={() => setShowAdd(false)} onCreated={load} />}
      {openId && <ModeratorDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
};

export default ModeratorsTab;

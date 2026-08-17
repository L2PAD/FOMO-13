/* eslint-disable */
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import Modal from "../../common/modal";
import { AdminSelect } from "../../../pages/AdminRating/AdminControls";
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  lifecycleCalendarEvent,
  fetchCalendarTypes,
  fetchCalendarDiagnostics,
  ICalendarEvent,
  ICalendarType,
  ICalendarDigest,
  fetchDigests,
  createDigest,
  updateDigest,
  deleteDigest,
  lifecycleDigest,
  generateDigestDraft,
  uploadDigestCover,
} from "../../services/calendar/adminCalendar";
import TextEditor from "../../common/text_editor/TextEditor";

const GREEN = "#04A584";
const PURPLE = "#7C5CFC";
const BORDER = "#E6EBF1";
const INK = "#0B1220";
const SUB = "#738094";

const CALENDAR_TABS = [
  { key: "overview", label: "Обзор" },
  { key: "events", label: "События" },
  { key: "DRAFT", label: "Черновики" },
  { key: "SCHEDULED", label: "Запланировано" },
  { key: "PUBLISHED", label: "Опубликовано" },
  { key: "types", label: "Типы" },
  { key: "sources", label: "Источники" },
  { key: "diagnostics", label: "Диагностика" },
];
const DIGEST_TABS = [{ key: "digests", label: "Дайджесты" }];

const DIGEST_PERIOD_OPTS = [
  { value: "WEEK", label: "7 дней (рутина)" },
  { value: "MONTH", label: "Месяц" },
  { value: "QUARTER", label: "Квартал" },
  { value: "HALF_YEAR", label: "Полгода" },
  { value: "YEAR", label: "Год" },
];
const DIGEST_OUTLOOK_OPTS = [
  { value: "BULLISH", label: "Bullish" },
  { value: "BEARISH", label: "Bearish" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "MIXED", label: "Mixed" },
];
const DIGEST_STATUS_OPTS = [
  { value: "DRAFT", label: "Черновик" },
  { value: "PUBLISHED", label: "Опубликовано" },
  { value: "ARCHIVED", label: "В архиве" },
];
const EMPTY_DIGEST: Partial<ICalendarDigest> = {
  title: "", period: "WEEK", summary: "", bodyHtml: "", coverImage: "",
  outlook: "NEUTRAL", status: "DRAFT", tags: [],
};

const VISIBILITY_OPTS = [
  { value: "PUBLIC", label: "Публичное" },
  { value: "AUTHENTICATED", label: "Для авторизованных" },
  { value: "PRIVATE", label: "Приватное" },
];
const STATUS_OPTS = [
  { value: "DRAFT", label: "Черновик" },
  { value: "SCHEDULED", label: "Запланировано" },
  { value: "PUBLISHED", label: "Опубликовано" },
  { value: "COMPLETED", label: "Завершено" },
  { value: "CANCELLED", label: "Отменено" },
  { value: "ARCHIVED", label: "В архиве" },
];
const SOURCE_OPTS = [
  { value: "PLATFORM", label: "Платформа (FOMO)" },
  { value: "EARLYLAND_ACTIVITY", label: "EarlyLand / активность" },
  { value: "PROJECT", label: "Проект" },
  { value: "TOKEN", label: "Токен / Unlock" },
  { value: "NEWS", label: "Новости" },
  { value: "LAUNCHPAD", label: "Launchpad" },
  { value: "SPACEPORT", label: "Spaceport" },
  { value: "USER", label: "Пользователь" },
  { value: "SYSTEM", label: "Система" },
];
const GENERATED_OPTS = [
  { value: "MANUAL", label: "Вручную" },
  { value: "CLAUDE", label: "Claude" },
  { value: "OPENAI", label: "OpenAI" },
  { value: "IMPORT", label: "Импорт" },
];

const EMPTY: Partial<ICalendarEvent> = {
  title: "",
  shortDescription: "",
  description: "",
  eventType: "PROJECT_UPDATE",
  category: "",
  sourceType: "PLATFORM",
  entityType: "",
  entityId: "",
  visibility: "PUBLIC",
  lifecycleStatus: "DRAFT",
  allDay: false,
  timezone: "UTC",
  priority: 0,
  ctaLabel: "",
  ctaUrl: "",
  sourceUrl: "",
  sourceName: "",
  generatedBy: "MANUAL",
  reviewStatus: "UNREVIEWED",
};

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const badge = (status?: string) => {
  const map: Record<string, string> = {
    PUBLISHED: GREEN, DRAFT: SUB, SCHEDULED: "#2F80ED",
    CANCELLED: "#D14141", COMPLETED: "#8A96A8", ARCHIVED: "#B0B8C4",
  };
  const c = map[status || "DRAFT"] || SUB;
  return { color: c, background: `${c}1A`, border: `1px solid ${c}55` };
};

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", background: "#fff",
};
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700, color: INK };

const CalendarControlCenter: React.FC<{ mode?: "calendar" | "digests" }> = ({ mode = "calendar" }) => {
  const TABS = mode === "digests" ? DIGEST_TABS : CALENDAR_TABS;
  const [tab, setTab] = useState(mode === "digests" ? "digests" : "events");
  const [events, setEvents] = useState<ICalendarEvent[]>([]);
  const [types, setTypes] = useState<ICalendarType[]>([]);
  const [diag, setDiag] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ICalendarEvent>>(EMPTY);
  const [saving, setSaving] = useState(false);

  // ── Digests state ──
  const [digests, setDigests] = useState<ICalendarDigest[]>([]);
  const [digestModalOpen, setDigestModalOpen] = useState(false);
  const [digestEditingId, setDigestEditingId] = useState<string | null>(null);
  const [digestForm, setDigestForm] = useState<Partial<ICalendarDigest>>(EMPTY_DIGEST);
  const [digestSaving, setDigestSaving] = useState(false);
  const [digestGenerating, setDigestGenerating] = useState(false);
  const [digestPreview, setDigestPreview] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast.error("Только изображения (PNG, JPEG, WebP, GIF)"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Изображение не должно превышать 5 МБ"); return; }
    setCoverUploading(true);
    const res = await uploadDigestCover(file);
    setCoverUploading(false);
    if (res.success && res.url) {
      setDigestForm((p) => ({ ...p, coverImage: res.url }));
      toast.success("Обложка загружена");
    } else {
      toast.error("Не удалось загрузить обложку");
    }
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const loadDigests = useCallback(async () => {
    const res = await fetchDigests({ limit: 100 });
    if (res.success) setDigests(res.data?.items || []);
    else toast.error("Не удалось загрузить дайджесты");
  }, []);

  const openDigestCreate = () => { setDigestEditingId(null); setDigestForm(EMPTY_DIGEST); setDigestPreview(false); setDigestModalOpen(true); };
  const openDigestEdit = (d: ICalendarDigest) => { setDigestEditingId(d.id); setDigestForm({ ...d }); setDigestPreview(false); setDigestModalOpen(true); };

  const saveDigest = async () => {
    if (!digestForm.title) return toast.error("Укажите заголовок дайджеста");
    setDigestSaving(true);
    const body: any = {
      ...digestForm,
      tags: typeof (digestForm as any).tags === "string"
        ? (digestForm as any).tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : digestForm.tags,
      keyTakeaways: typeof (digestForm as any).keyTakeaways === "string"
        ? (digestForm as any).keyTakeaways.split("\n").map((t: string) => t.trim()).filter(Boolean)
        : digestForm.keyTakeaways,
    };
    const res = digestEditingId ? await updateDigest(digestEditingId, body) : await createDigest(body);
    setDigestSaving(false);
    if (!res.success) return toast.error(res.data?.message || "Не удалось сохранить дайджест");
    toast.success(digestEditingId ? "Дайджест обновлён" : "Дайджест создан");
    setDigestModalOpen(false);
    loadDigests();
  };

  const generateDigest = async () => {
    setDigestGenerating(true);
    const res = await generateDigestDraft({ period: digestForm.period || "WEEK" });
    setDigestGenerating(false);
    if (!res.success || !res.data?.ok) {
      return toast.error(res.data?.message || "AI-генерация недоступна");
    }
    const draft = res.data.draft || {};
    setDigestForm((prev) => ({
      ...prev,
      title: draft.title || prev.title,
      summary: draft.summary || prev.summary,
      keyTakeaways: Array.isArray(draft.keyTakeaways) && draft.keyTakeaways.length ? draft.keyTakeaways : prev.keyTakeaways,
      bodyHtml: draft.bodyHtml || prev.bodyHtml,
      outlook: draft.outlook || prev.outlook,
      period: draft.period || prev.period,
      aiGenerated: true,
      aiModel: draft.aiModel,
    }));
    const m = res.data.meta || {};
    toast.success(`Черновик сгенерирован (${m.events || 0} событий, ${m.news || 0} новостей)`);
  };

  const doDigestLifecycle = async (id: string, action: "publish" | "unpublish" | "archive") => {
    const res = await lifecycleDigest(id, action);
    if (!res.success) return toast.error("Действие не выполнено");
    toast.success("Готово");
    loadDigests();
  };
  const doDigestDelete = async (id: string) => {
    if (!window.confirm("Удалить дайджест безвозвратно?")) return;
    const res = await deleteDigest(id);
    if (!res.success) return toast.error("Не удалось удалить");
    toast.success("Дайджест удалён");
    loadDigests();
  };

  const statusFilter = ["DRAFT", "SCHEDULED", "PUBLISHED"].includes(tab) ? tab : undefined;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const res = await fetchCalendarEvents({ status: statusFilter, search, limit: 200 });
    setLoading(false);
    if (res.success) setEvents(res.data?.items || []);
    else toast.error("Не удалось загрузить события");
  }, [statusFilter, search]);

  useEffect(() => {
    if (["events", "DRAFT", "SCHEDULED", "PUBLISHED"].includes(tab)) loadEvents();
    if (tab === "digests") loadDigests();
    if (tab === "types") fetchCalendarTypes().then((r) => r.success && setTypes(r.data?.items || []));
    if (tab === "overview" || tab === "diagnostics" || tab === "sources")
      fetchCalendarDiagnostics().then((r) => r.success && setDiag(r.data));
  }, [tab, loadEvents, loadDigests]);

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (e: ICalendarEvent) => {
    setEditingId(e.id);
    setForm({ ...e, startAt: toLocalInput(e.startAt), endAt: toLocalInput(e.endAt) });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title) return toast.error("Укажите название");
    if (!form.startAt) return toast.error("Укажите дату начала");
    setSaving(true);
    const body: any = {
      ...form,
      startAt: new Date(form.startAt as string).toISOString(),
      endAt: form.endAt ? new Date(form.endAt as string).toISOString() : undefined,
      tags: typeof (form as any).tags === "string"
        ? (form as any).tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : form.tags,
      priority: Number(form.priority || 0),
    };
    const res = editingId ? await updateCalendarEvent(editingId, body) : await createCalendarEvent(body);
    setSaving(false);
    if (!res.success) return toast.error(res.data?.message || "Не удалось сохранить событие");
    toast.success(editingId ? "Событие обновлено" : "Событие создано");
    setModalOpen(false);
    loadEvents();
  };

  const doLifecycle = async (id: string, action: "publish" | "unpublish" | "cancel" | "duplicate") => {
    const res = await lifecycleCalendarEvent(id, action);
    if (!res.success) return toast.error(res.data?.message || "Действие не выполнено");
    toast.success("Готово");
    loadEvents();
  };
  const doDelete = async (id: string) => {
    if (!window.confirm("Удалить событие безвозвратно?")) return;
    const res = await deleteCalendarEvent(id);
    if (!res.success) return toast.error("Не удалось удалить");
    toast.success("Событие удалено");
    loadEvents();
  };

  const typeOptions = useMemo(
    () => (types.length ? types : []).map((t) => ({ value: t.key, label: t.name })),
    [types],
  );
  // fallback type options (registry may not be loaded on events tab)
  const typeSelectOptions = typeOptions.length ? typeOptions : [
    { value: "PROJECT_UPDATE", label: "Обновление проекта" },
    { value: "TOKEN_UNLOCK", label: "Разблокировка токенов" },
    { value: "ACTIVITY", label: "Активность" },
    { value: "DEADLINE", label: "Дедлайн" },
    { value: "NEWS", label: "Новость" },
    { value: "FOMO_UPDATE", label: "Обновление FOMO" },
    { value: "LISTING", label: "Листинг" },
    { value: "TGE", label: "TGE" },
    { value: "CUSTOM", label: "Другое" },
  ];

  useEffect(() => { fetchCalendarTypes().then((r) => r.success && setTypes(r.data?.items || [])); }, []);

  return (
    <div data-testid="calendar-control-center" style={{ color: INK }}>
      <style>{`::selection{background:${GREEN};color:#fff}`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: `1px solid ${BORDER}`, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }} role="tablist">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`calendar-tab-${t.key}`}
              style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "none", background: "transparent",
                color: tab === t.key ? PURPLE : SUB, borderBottom: `2px solid ${tab === t.key ? PURPLE : "transparent"}`, marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={tab === "digests" ? openDigestCreate : openCreate} data-testid={tab === "digests" ? "digest-create" : "calendar-create"}
          style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 8, padding: "9px 15px", fontWeight: 700, cursor: "pointer", margin: "0 0 6px" }}>
          {tab === "digests" ? "+ Создать дайджест" : "+ Создать событие"}
        </button>
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {diag ? Object.entries(diag.counts || {}).map(([k, v]: any) => (
            <div key={k} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, background: "#fff" }}>
              <div style={{ color: SUB, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>{k}</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{v as any}</div>
            </div>
          )) : <div style={{ color: SUB }}>Загрузка...</div>}
        </div>
      )}

      {/* EVENTS TABLE */}
      {["events", "DRAFT", "SCHEDULED", "PUBLISHED"].includes(tab) && (
        <div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию"
            onKeyDown={(e) => e.key === "Enter" && loadEvents()}
            style={{ ...field, maxWidth: 320, marginBottom: 12 }} />
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr 2.4fr", gap: 8, padding: "10px 14px", background: "#F8FAFB", fontSize: 12, fontWeight: 800, color: SUB }}>
              <div>Событие</div><div>Тип</div><div>Источник</div><div>Дата / Статус</div><div>Действия</div>
            </div>
            {loading ? <div style={{ padding: 20, color: SUB }}>Загрузка...</div> :
              events.length ? events.map((e) => (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr 2.4fr", gap: 8, padding: "12px 14px", borderTop: `1px solid ${BORDER}`, alignItems: "center", fontSize: 13 }}>
                  <div><strong>{e.title}</strong><div style={{ color: SUB, fontSize: 12 }}>{e.category || ""}</div></div>
                  <div>{e.eventType}</div>
                  <div>{e.sourceType || "PLATFORM"}</div>
                  <div>
                    <div>{e.startAt ? new Date(e.startAt).toLocaleDateString("ru-RU") : "-"}</div>
                    <span style={{ ...badge(e.lifecycleStatus), fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, display: "inline-block", marginTop: 3 }}>{e.lifecycleStatus}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => openEdit(e)} style={btn}>Изменить</button>
                    {e.lifecycleStatus !== "PUBLISHED"
                      ? <button onClick={() => doLifecycle(e.id, "publish")} style={{ ...btn, color: GREEN, borderColor: GREEN }}>Опубликовать</button>
                      : <button onClick={() => doLifecycle(e.id, "unpublish")} style={btn}>Снять</button>}
                    <button onClick={() => doLifecycle(e.id, "cancel")} style={btn}>Отменить</button>
                    <button onClick={() => doLifecycle(e.id, "duplicate")} style={btn}>Дубль</button>
                    <button onClick={() => doDelete(e.id)} style={{ ...btn, color: "#D14141", borderColor: "#D1414155" }}>Удалить</button>
                  </div>
                </div>
              )) : <div style={{ padding: 20, color: SUB }}>Событий пока нет</div>}
          </div>
        </div>
      )}

      {/* DIGESTS */}
      {tab === "digests" && (
        <div>
          <div style={{ color: SUB, fontSize: 13, marginBottom: 12 }}>
            Редакционные обзоры рынка: 7 дней (рутина), месяц, квартал, полгода, год. AI-черновик + ручная доработка.
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1fr 2fr", gap: 8, padding: "10px 14px", background: "#F8FAFB", fontSize: 12, fontWeight: 800, color: SUB }}>
              <div>Заголовок</div><div>Период</div><div>Взгляд</div><div>Статус</div><div>Действия</div>
            </div>
            {digests.length ? digests.map((d) => (
              <div key={d.id} style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1fr 2fr", gap: 8, padding: "12px 14px", borderTop: `1px solid ${BORDER}`, alignItems: "center", fontSize: 13 }}>
                <div>
                  <strong>{d.title}</strong>
                  <div style={{ color: SUB, fontSize: 12 }}>{d.aiGenerated ? "AI-черновик · " : ""}{d.summary?.slice(0, 60) || ""}</div>
                </div>
                <div>{(DIGEST_PERIOD_OPTS.find((p) => p.value === d.period) || {}).label || d.period}</div>
                <div>{d.outlook}</div>
                <div><span style={{ ...badge(d.status === "PUBLISHED" ? "PUBLISHED" : d.status === "ARCHIVED" ? "ARCHIVED" : "DRAFT"), fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, display: "inline-block" }}>{d.status}</span></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => openDigestEdit(d)} style={btn}>Изменить</button>
                  {d.status !== "PUBLISHED"
                    ? <button onClick={() => doDigestLifecycle(d.id, "publish")} style={{ ...btn, color: GREEN, borderColor: GREEN }}>Опубликовать</button>
                    : <button onClick={() => doDigestLifecycle(d.id, "unpublish")} style={btn}>Снять</button>}
                  <button onClick={() => doDigestDelete(d.id)} style={{ ...btn, color: "#D14141", borderColor: "#D1414155" }}>Удалить</button>
                </div>
              </div>
            )) : <div style={{ padding: 20, color: SUB }}>Дайджестов пока нет. Нажмите «+ Создать дайджест».</div>}
          </div>
        </div>
      )}

      {/* TYPES */}
      {tab === "types" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
          {types.map((t) => (
            <div key={t.key} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, background: "#fff" }}>
              <div style={{ fontWeight: 800 }}>{t.name}</div>
              <div style={{ color: SUB, fontSize: 12 }}>{t.key} · {t.category}</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Видимость: {t.defaultVisibility}</div>
              <div style={{ fontSize: 12 }}>Автопубликация: {t.allowAutoPublish ? "да" : "нет"}</div>
            </div>
          ))}
        </div>
      )}

      {/* SOURCES */}
      {tab === "sources" && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, background: "#fff", overflow: "hidden" }}>
          {(diag?.sources || []).map((s: any) => (
            <div key={s.sourceType} style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderTop: `1px solid ${BORDER}` }}>
              <span style={{ fontWeight: 700 }}>{s.sourceType}</span>
              <span style={{ color: GREEN, fontWeight: 700 }}>{s.status} · {s.count}</span>
            </div>
          ))}
          {!diag?.sources?.length && <div style={{ padding: 16, color: SUB }}>Нет данных</div>}
        </div>
      )}

      {/* DIAGNOSTICS */}
      {tab === "diagnostics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {diag ? [
            ["Orphan source", diag.health?.orphanSource],
            ["Invalid date", diag.health?.invalidDate],
            ["Duplicate externalId", diag.health?.duplicateExternalId],
          ].map(([k, v]: any) => (
            <div key={k} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, background: "#fff" }}>
              <div style={{ color: SUB, fontSize: 12 }}>{k}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: Number(v) > 0 ? "#D14141" : GREEN }}>{v}</div>
            </div>
          )) : <div style={{ color: SUB }}>Загрузка...</div>}
        </div>
      )}

      {modalOpen && (
        <Modal title={editingId ? "Редактировать событие" : "Создать событие"} variant="big" onClose={() => setModalOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Название
                <input style={field} value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Например: Monad Testnet Deadline" />
              </label>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Краткое описание
                <input style={field} value={form.shortDescription || ""} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
              </label>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Полное описание
                <textarea style={{ ...field, minHeight: 70, resize: "vertical" }} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label style={labelStyle}>Дата и время начала
                <input type="datetime-local" style={field} value={(form.startAt as string) || ""} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
              </label>
              <label style={labelStyle}>Дата и время конца
                <input type="datetime-local" style={field} value={(form.endAt as string) || ""} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
              </label>
              <label style={labelStyle}>Тип события
                <AdminSelect value={form.eventType || "PROJECT_UPDATE"} options={typeSelectOptions} searchable ariaLabel="Тип" onChange={(v) => setForm({ ...form, eventType: v })} />
              </label>
              <label style={labelStyle}>Источник
                <AdminSelect value={form.sourceType || "PLATFORM"} options={SOURCE_OPTS} ariaLabel="Источник" onChange={(v) => setForm({ ...form, sourceType: v })} />
              </label>
              <label style={labelStyle}>Видимость
                <AdminSelect value={form.visibility || "PUBLIC"} options={VISIBILITY_OPTS} ariaLabel="Видимость" onChange={(v) => setForm({ ...form, visibility: v })} />
              </label>
              <label style={labelStyle}>Статус
                <AdminSelect value={form.lifecycleStatus || "DRAFT"} options={STATUS_OPTS} ariaLabel="Статус" onChange={(v) => setForm({ ...form, lifecycleStatus: v })} />
              </label>
              <label style={labelStyle}>Категория
                <input style={field} value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </label>
              <label style={labelStyle}>Часовой пояс
                <input style={field} value={form.timezone || "UTC"} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
              </label>
              <label style={labelStyle}>Связанная сущность (тип)
                <input style={field} value={form.entityType || ""} onChange={(e) => setForm({ ...form, entityType: e.target.value })} placeholder="Project / Activity / Token..." />
              </label>
              <label style={labelStyle}>Связанная сущность (ID)
                <input style={field} value={form.entityId || ""} onChange={(e) => setForm({ ...form, entityId: e.target.value })} />
              </label>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Связанная новость (ID) — сквозной переход в News
                <input style={field} value={form.relatedArticleId || ""} onChange={(e) => setForm({ ...form, relatedArticleId: e.target.value })} placeholder="ID новости из раздела Новости" />
              </label>
              <label style={labelStyle}>CTA — подпись
                <input style={field} value={form.ctaLabel || ""} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="Открыть активность" />
              </label>
              <label style={labelStyle}>CTA — ссылка
                <input style={field} value={form.ctaUrl || ""} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} />
              </label>
              <label style={labelStyle}>Источник (URL)
                <input style={field} value={form.sourceUrl || ""} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} />
              </label>
              <label style={labelStyle}>Приоритет
                <input type="number" style={field} value={form.priority || 0} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
              </label>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Теги (через запятую)
                <input style={field} value={Array.isArray(form.tags) ? form.tags.join(", ") : ((form as any).tags || "")} onChange={(e) => setForm({ ...form, tags: e.target.value as any })} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
                <input type="checkbox" checked={!!form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} /> Весь день
              </label>
            </div>

            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: SUB, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>AI-provenance</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                <label style={labelStyle}>Создано (generatedBy)
                  <AdminSelect value={form.generatedBy || "MANUAL"} options={GENERATED_OPTS} ariaLabel="generatedBy" onChange={(v) => setForm({ ...form, generatedBy: v })} />
                </label>
                <label style={labelStyle}>Источник (название)
                  <input style={field} value={form.sourceName || ""} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} />
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
              <button onClick={() => setModalOpen(false)} style={{ ...btn, padding: "10px 18px" }}>Отмена</button>
              <button onClick={save} disabled={saving} style={{ border: "none", background: GREEN, color: "#fff", borderRadius: 8, padding: "10px 18px", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать событие"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {digestModalOpen && (
        <Modal title={digestEditingId ? "Редактировать дайджест" : "Создать дайджест"} variant="big" onClose={() => setDigestModalOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "#F6F4FF", border: `1px solid ${PURPLE}33`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 13, color: INK, fontWeight: 700 }}>
                AI-плагин: подтянет события и новости за выбранный период и создаст черновик обзора.
              </div>
              <button onClick={generateDigest} disabled={digestGenerating}
                style={{ border: "none", background: PURPLE, color: "#fff", borderRadius: 8, padding: "9px 15px", fontWeight: 700, cursor: "pointer", opacity: digestGenerating ? 0.6 : 1, whiteSpace: "nowrap" }}>
                {digestGenerating ? "Генерация..." : "✨ Сгенерировать AI"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Заголовок
                <input style={field} value={digestForm.title || ""} onChange={(e) => setDigestForm({ ...digestForm, title: e.target.value })} placeholder="Напр.: Недельный обзор рынка" />
              </label>
              <label style={labelStyle}>Период
                <AdminSelect value={digestForm.period || "WEEK"} options={DIGEST_PERIOD_OPTS} ariaLabel="Период" onChange={(v) => setDigestForm({ ...digestForm, period: v as any })} />
              </label>
              <label style={labelStyle}>Взгляд на рынок
                <AdminSelect value={digestForm.outlook || "NEUTRAL"} options={DIGEST_OUTLOOK_OPTS} ariaLabel="Взгляд" onChange={(v) => setDigestForm({ ...digestForm, outlook: v as any })} />
              </label>
              <label style={labelStyle}>Статус
                <AdminSelect value={digestForm.status || "DRAFT"} options={DIGEST_STATUS_OPTS} ariaLabel="Статус" onChange={(v) => setDigestForm({ ...digestForm, status: v as any })} />
              </label>
              <label style={labelStyle}>Обложка (файл или URL)
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input style={{ ...field, flex: 1 }} value={digestForm.coverImage || ""} onChange={(e) => setDigestForm({ ...digestForm, coverImage: e.target.value })} placeholder="https://... или загрузите файл" />
                  <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: "none" }} onChange={handleCoverFile} data-testid="digest-cover-file" />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    data-testid="digest-cover-upload-btn"
                    style={{ whiteSpace: "nowrap", border: `1px solid ${BORDER}`, background: "#fff", color: "#04a584", borderRadius: 8, padding: "0 14px", height: 38, fontSize: 13, fontWeight: 700, cursor: coverUploading ? "wait" : "pointer" }}
                  >
                    {coverUploading ? "Загрузка..." : "Загрузить файл"}
                  </button>
                </div>
              </label>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Краткое описание (тизер)
                <textarea style={{ ...field, minHeight: 54, resize: "vertical" }} value={digestForm.summary || ""} onChange={(e) => setDigestForm({ ...digestForm, summary: e.target.value })} />
              </label>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Теги (через запятую)
                <input style={field} value={Array.isArray(digestForm.tags) ? digestForm.tags.join(", ") : ((digestForm as any).tags || "")} onChange={(e) => setDigestForm({ ...digestForm, tags: e.target.value as any })} />
              </label>
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Ключевые тезисы (по одному в строке) — показываются в сайдбаре обзора
                <textarea style={{ ...field, minHeight: 84, resize: "vertical" }} value={Array.isArray(digestForm.keyTakeaways) ? digestForm.keyTakeaways.join("\n") : ((digestForm as any).keyTakeaways || "")} onChange={(e) => setDigestForm({ ...digestForm, keyTakeaways: e.target.value as any })} placeholder={"ETF-притоки ускоряются\nБалансы на биржах снижаются\n..."} />
              </label>
            </div>
            <label style={{ ...labelStyle }}>Тело обзора (редактор: текст, ссылки, изображения, видео)
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, marginTop: 4 }}>
                <TextEditor value={digestForm.bodyHtml || ""} onChange={(val: string) => setDigestForm((p) => ({ ...p, bodyHtml: val }))} name="bodyHtml" />
              </div>
            </label>
            {digestForm.aiGenerated && (
              <div style={{ fontSize: 12, color: PURPLE, fontWeight: 700 }}>✨ Черновик подготовлен AI{digestForm.aiModel ? ` · ${digestForm.aiModel}` : ""}. Отредактируйте перед публикацией.</div>
            )}
            {digestPreview && (
              <div data-testid="digest-preview" style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                <div style={{ padding: "8px 14px", background: "#0B1020", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
                  ПРЕДПРОСМОТР — как на сайте
                </div>
                <div style={{ maxWidth: 760, margin: "0 auto", padding: 20 }}>
                  {digestForm.coverImage ? (
                    <div style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 16, background: `#eef1f5 url(${digestForm.coverImage}) center/cover no-repeat` }} />
                  ) : (
                    <div style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 16, background: "linear-gradient(135deg, #04a58422, #6172f322)" }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#067647", background: "#DCFAE6" }}>{digestForm.outlook || "NEUTRAL"}</span>
                    <span style={{ fontSize: 12, color: "#98a2b3", fontWeight: 700 }}>{(DIGEST_PERIOD_OPTS.find((p) => p.value === digestForm.period) || {}).label || digestForm.period}</span>
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: "#070b35", margin: "0 0 8px" }}>{digestForm.title || "Заголовок дайджеста"}</h2>
                  {digestForm.summary ? <p style={{ color: "#667085", fontSize: 15, lineHeight: "22px", margin: "0 0 14px" }}>{digestForm.summary}</p> : null}
                  <div style={{ fontSize: 15, lineHeight: "24px", color: "#344054" }} dangerouslySetInnerHTML={{ __html: digestForm.bodyHtml || "<p style='color:#98a2b3'>Тело обзора пусто…</p>" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingTop: 4, flexWrap: "wrap" }}>
              <button onClick={() => setDigestPreview((v) => !v)} data-testid="digest-preview-toggle" style={{ ...btn, padding: "10px 18px", borderColor: PURPLE, color: PURPLE }}>
                {digestPreview ? "Скрыть предпросмотр" : "👁 Предпросмотр"}
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDigestModalOpen(false)} style={{ ...btn, padding: "10px 18px" }}>Отмена</button>
                <button onClick={saveDigest} disabled={digestSaving} style={{ border: "none", background: GREEN, color: "#fff", borderRadius: 8, padding: "10px 18px", fontWeight: 700, cursor: "pointer", opacity: digestSaving ? 0.6 : 1 }}>
                  {digestSaving ? "Сохранение..." : digestEditingId ? "Сохранить" : "Создать дайджест"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const btn: React.CSSProperties = {
  border: `1px solid ${BORDER}`, background: "#fff", color: INK, borderRadius: 8,
  padding: "7px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
};

export default CalendarControlCenter;

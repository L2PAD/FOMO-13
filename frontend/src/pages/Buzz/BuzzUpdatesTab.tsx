import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { T } from "../Statistics/ui";
import { fetchAllNews, deleteNews } from "../../components/services/buzz/buzzStats";
import CreateUpdateModal from "../../components/layouts/news_layout/modals/create_update_modal";

const card: React.CSSProperties = {
  background: T.cardBg,
  border: `1px solid ${T.border}`,
  borderRadius: T.radius,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

const btn: React.CSSProperties = {
  border: `1px solid ${T.border}`,
  background: "#fff",
  color: T.ink,
  borderRadius: 8,
  padding: "7px 12px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const fmt = (d: any) => {
  try { return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

const normalize = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.news)) return raw.news;
  return [];
};

const BuzzUpdatesTab: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchAllNews("crypto");
    setLoading(false);
    if (!r.success) { toast.error("Не удалось загрузить обновления"); return; }
    const all = normalize(r.data);
    setItems(all.filter((n) => (n.newsSection || "") === "fomo-update"));
  }, []);

  useEffect(() => { load(); }, [load]);

  const doDelete = async (id: string) => {
    if (!window.confirm("Удалить это обновление?")) return;
    const r = await deleteNews(id);
    if (!r.success) { toast.error("Не удалось удалить"); return; }
    toast.success("Обновление удалено");
    load();
  };

  const filtered = items.filter((n) => !search || (n.title || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="buzz-updates-tab">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: T.sub, maxWidth: 560 }}>
          FOMO Updates — анонсы платформы, новые функции и системные изменения. Публикуются на публичной вкладке «FOMO Updates» и в разделе /updates.
        </div>
        <button
          onClick={() => setModalOpen(true)}
          data-testid="buzz-update-create"
          style={{ border: "none", background: T.accent, color: "#fff", borderRadius: 8, padding: "9px 15px", fontWeight: 700, cursor: "pointer" }}
        >
          + Создать обновление
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по заголовку"
        style={{ width: "100%", maxWidth: 320, boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 11px", fontSize: 14, marginBottom: 12 }}
      />

      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.6fr 1.1fr 1fr 1.2fr", gap: 8, padding: "10px 14px", background: T.soft, fontSize: 12, fontWeight: 800, color: T.sub }}>
          <div>Заголовок</div><div>Категория</div><div>Дата</div><div>Действия</div>
        </div>
        {loading ? (
          <div style={{ padding: 20, color: T.sub }}>Загрузка...</div>
        ) : filtered.length ? filtered.map((n) => (
          <div key={n._id} style={{ display: "grid", gridTemplateColumns: "2.6fr 1.1fr 1fr 1.2fr", gap: 8, padding: "12px 14px", borderTop: `1px solid ${T.border}`, alignItems: "center", fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 700, color: T.ink }}>{n.title || "Без названия"}</div>
              <div style={{ color: T.faint, fontSize: 12, maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.text || ""}</div>
            </div>
            <div style={{ color: T.sub }}>{n.type || "—"}</div>
            <div style={{ color: T.sub }}>{fmt(n.date)}</div>
            <div>
              <button onClick={() => doDelete(n._id)} style={{ ...btn, color: T.bad, borderColor: `${T.bad}55` }}>Удалить</button>
            </div>
          </div>
        )) : (
          <div style={{ padding: 24, color: T.faint, textAlign: "center" }}>
            Обновлений пока нет. Нажмите «+ Создать обновление».
          </div>
        )}
      </div>

      {modalOpen && <CreateUpdateModal onClose={() => { setModalOpen(false); load(); }} />}
    </div>
  );
};

export default BuzzUpdatesTab;

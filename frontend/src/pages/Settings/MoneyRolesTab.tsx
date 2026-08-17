import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { T } from "../Statistics/ui";
import {
  getMyMoneyPermissions, getMoneyPermissionTemplates, getMoneyPermissionAdmins, setMoneyPermissionAssignment,
} from "../AccessMonetization/service";

/**
 * H3 — Settings → Роли и права.
 * Manages canonical MONEY_* permissions per admin via role templates +
 * individual overrides. A plain admin must NOT auto-get withdraw/signer rights;
 * only a Superadmin (MONEY_SETTINGS_EDIT) can change assignments.
 */

const card: React.CSSProperties = { background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, marginBottom: 16 };
const th: React.CSSProperties = { textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3, color: T.sub, fontWeight: 700, padding: "9px 12px", borderBottom: `1px solid ${T.border}` };
const td: React.CSSProperties = { padding: "9px 12px", borderBottom: `1px solid #F1F5F9`, fontSize: 13, color: T.ink };
const chip = (on: boolean): React.CSSProperties => ({ display: "inline-block", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: on ? "#D1FAE5" : "#F1F5F9", color: on ? "#059669" : "#94A3B8", margin: "2px 3px 2px 0" });

const MoneyRolesTab: React.FC = () => {
  const [me, setMe] = useState<any>(null);
  const [cat, setCat] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [edit, setEdit] = useState<any>(null); // { userId, email, template, grants, revokes }

  const load = () => {
    setLoading(true);
    getMyMoneyPermissions().then(setMe).catch(() => {});
    getMoneyPermissionTemplates().then(setCat).catch(() => {});
    getMoneyPermissionAdmins()
      .then((r) => { setAdmins(r.items || []); setForbidden(false); })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const canManage = me?.permissions?.includes("MONEY_SETTINGS_EDIT");
  const allPerms: { key: string; label: string }[] = cat?.permissions || [];
  const templates: any[] = cat?.templates || [];

  const openEdit = (a: any) => setEdit({ userId: a.userId, email: a.email, template: a.template, grants: [...(a.grants || [])], revokes: [...(a.revokes || [])] });
  const toggle = (list: "grants" | "revokes", perm: string) => {
    setEdit((e: any) => {
      const has = e[list].includes(perm);
      const next = has ? e[list].filter((p: string) => p !== perm) : [...e[list], perm];
      const other = list === "grants" ? "revokes" : "grants";
      return { ...e, [list]: next, [other]: e[other].filter((p: string) => p !== perm) };
    });
  };
  const save = () => {
    setMoneyPermissionAssignment(edit.userId, { template: edit.template, grants: edit.grants, revokes: edit.revokes, reason: "roles & permissions update" })
      .then(() => { toast.success("Права обновлены"); setEdit(null); load(); })
      .catch((e) => toast.error(e?.message || "Ошибка"));
  };

  if (loading) return <div style={{ color: T.sub }}>Загрузка…</div>;

  return (
    <div data-testid="money-roles-tab">
      <div style={{ ...card, background: "#F8FAFC" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Финансовые права (MONEY_*)</div>
        <div style={{ fontSize: 12.5, color: T.sub }}>
          Обычный <b>admin</b> по умолчанию НЕ может подписывать выводы USDC или управлять ключами/treasury.
          Права выдаются шаблоном роли + индивидуальными исключениями. Изменять назначения может только <b>Superadmin</b>.
        </div>
        {me ? (
          <div style={{ marginTop: 10, fontSize: 12.5, color: T.sub }}>
            Ваша роль: <b style={{ color: T.ink }}>{me.template}</b> · права:
            <span style={{ marginLeft: 6 }}>{(me.permissions || []).map((p: string) => <span key={p} style={chip(true)}>{p.replace("MONEY_", "")}</span>)}</span>
          </div>
        ) : null}
      </div>

      {/* Templates reference */}
      {templates.length ? (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Шаблоны ролей</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {templates.map((t) => (
              <div key={t.key} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>{t.label}</div>
                <div style={{ fontSize: 11.5, color: T.sub, margin: "4px 0 8px" }}>{t.description}</div>
                <div>{(t.permissions || []).map((p: string) => <span key={p} style={chip(true)}>{p.replace("MONEY_", "")}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {forbidden ? (
        <div style={{ ...card, color: T.sub }} data-testid="money-roles-forbidden">
          Недостаточно прав для управления ролями. Требуется <b>Superadmin</b> (MONEY_SETTINGS_EDIT). Обратитесь к суперадмину.
        </div>
      ) : (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Администраторы</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead><tr><th style={th}>Пользователь</th><th style={th}>JWT роли</th><th style={th}>Шаблон</th><th style={th}>Эффективные права</th><th style={th}></th></tr></thead>
              <tbody>{admins.map((a) => (
                <tr key={a.userId} data-testid={`money-role-row-${a.userId}`}>
                  <td style={td}>{a.email || a.username || a.userId}{!a.assigned ? <span style={{ ...chip(false), marginLeft: 6 }}>default</span> : null}</td>
                  <td style={{ ...td, fontSize: 12, color: T.sub }}>{(a.jwtRoles || []).join(", ")}</td>
                  <td style={td}><b>{a.template}</b></td>
                  <td style={td}>{(a.permissions || []).map((p: string) => <span key={p} style={chip(true)}>{p.replace("MONEY_", "")}</span>)}</td>
                  <td style={td}>{canManage ? <button data-testid={`money-role-edit-${a.userId}`} onClick={() => openEdit(a)} style={{ border: `1px solid ${T.border}`, background: "#fff", borderRadius: 8, padding: "5px 12px", fontSize: 12.5, fontWeight: 700, color: T.accent, cursor: "pointer" }}>Изменить</button> : <span style={{ color: T.sub }}>—</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit drawer */}
      {edit ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 200, display: "flex", justifyContent: "flex-end" }} onClick={() => setEdit(null)}>
          <div style={{ width: 480, maxWidth: "94vw", background: "#fff", height: "100%", overflowY: "auto", padding: 22 }} onClick={(e) => e.stopPropagation()} data-testid="money-role-drawer">
            <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>Права: {edit.email || edit.userId}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4, marginBottom: 14 }}>Шаблон задаёт базовые права; исключения переопределяют отдельные пункты.</div>

            <label style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Шаблон роли</label>
            <select value={edit.template} onChange={(e) => setEdit({ ...edit, template: e.target.value })} data-testid="money-role-template-select"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.border}`, marginTop: 4, marginBottom: 16, fontSize: 13 }}>
              {templates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>

            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Индивидуальные исключения</div>
            {allPerms.map((p) => {
              const inTemplate = (templates.find((t) => t.key === edit.template)?.permissions || []).includes(p.key);
              const granted = edit.grants.includes(p.key);
              const revoked = edit.revokes.includes(p.key);
              const effective = (inTemplate || granted) && !revoked;
              return (
                <div key={p.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 0", borderBottom: `1px solid #F1F5F9` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: effective ? T.ink : T.sub }}>{p.key.replace("MONEY_", "")}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{p.label}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggle("grants", p.key)} style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 7, cursor: "pointer", border: `1px solid ${granted ? "#059669" : T.border}`, background: granted ? "#D1FAE5" : "#fff", color: granted ? "#059669" : T.sub }}>+ grant</button>
                    <button onClick={() => toggle("revokes", p.key)} style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 7, cursor: "pointer", border: `1px solid ${revoked ? "#DC2626" : T.border}`, background: revoked ? "#FEE2E2" : "#fff", color: revoked ? "#DC2626" : T.sub }}>− revoke</button>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={save} data-testid="money-role-save" style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Сохранить</button>
              <button onClick={() => setEdit(null)} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: T.sub, cursor: "pointer" }}>Отмена</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MoneyRolesTab;

import React, { useEffect, useState } from "react";
import { fetchInvites, createUserInvite } from "../../components/services/customer360";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #E4EAF1", borderRadius: 14, padding: 18, margin: "0 16px" };
const th: React.CSSProperties = { textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#7A879A", textTransform: "uppercase", padding: "8px 10px", borderBottom: "1px solid #EEF2F7" };
const td: React.CSSProperties = { fontSize: 13, color: "#101828", padding: "10px 10px", borderBottom: "1px solid #F4F6F9" };

const STATUS_COLORS: Record<string, string> = { pending: "#B45309", not_sent: "#94A3B8", sent: "#0E9F73", error: "#DC2626", accepted: "#0369A1" };

const Invitations: React.FC = () => {
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const r = await fetchInvites();
    setInvites(r.success && Array.isArray(r.data) ? r.data : []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!email) return;
    setBusy(true);
    const r = await createUserInvite(email);
    setBusy(false);
    setMsg(r.success ? `Создано приглашение (${r.data?.invite?.status || "pending"})` : "Ошибка");
    setTimeout(() => setMsg(""), 3000);
    setEmail("");
    load();
  };

  return (
    <div style={card} data-testid="invitations-panel">
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1D2939", marginBottom: 12 }}>Приглашения</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
          style={{ flex: 1, minWidth: 240, padding: "9px 12px", border: "1px solid #E4EAF1", borderRadius: 10, fontSize: 13 }} data-testid="invite-email-input" />
        <button disabled={busy} onClick={create} style={{ background: "#2F6BFF", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, cursor: "pointer" }} data-testid="invite-create-btn">Пригласить</button>
      </div>
      {msg && <div style={{ marginBottom: 12, color: "#0E9F73", fontWeight: 700, fontSize: 13 }}>{msg}</div>}
      <div style={{ fontSize: 12, color: "#8592A6", marginBottom: 10 }}>
        Resend не настроен → приглашения создаются со статусом <b>not_sent</b> (без фейковой отправки). Настройте ключ в «Настройки → Email / Resend».
      </div>
      {invites.length === 0 ? <div style={{ color: "#8592A6", fontSize: 13 }}>Приглашений пока нет</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Email</th><th style={th}>Статус</th><th style={th}>Заметка</th><th style={th}>Дата</th></tr></thead>
          <tbody>
            {invites.map((inv) => (
              <tr key={inv._id}>
                <td style={td}>{inv.email}</td>
                <td style={td}><span style={{ color: STATUS_COLORS[inv.status] || "#64748B", fontWeight: 700 }}>{inv.status}</span></td>
                <td style={td}>{inv.note || "—"}</td>
                <td style={td}>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Invitations;

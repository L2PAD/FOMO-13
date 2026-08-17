import React, { useEffect, useState } from "react";
import { T, Card, SectionTitle, Badge, StateBlock } from "../Statistics/ui";
import { getEmailSettings, updateEmailSettings, testEmailSettings } from "../../components/services/settings";

const field: React.CSSProperties = { width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" };
const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 6, display: "block" };
const primary: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" };

const EmailTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cfg, setCfg] = useState<any>({});
  const [form, setForm] = useState({ apiKey: "", fromEmail: "", fromName: "", replyTo: "", provider: "resend" });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4500); };
  const load = async () => {
    setLoading(true);
    const r = await getEmailSettings();
    if (r.success) {
      setCfg(r.data);
      setForm({ apiKey: r.data.apiKeyMasked || "", fromEmail: r.data.fromEmail || "", fromName: r.data.fromName || "", replyTo: r.data.replyTo || "", provider: r.data.provider || "resend" });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    const body: any = { provider: form.provider, fromEmail: form.fromEmail, fromName: form.fromName, replyTo: form.replyTo };
    // Only send apiKey if it was changed (does not contain mask bullet).
    if (form.apiKey && !form.apiKey.includes("\u2022")) body.apiKey = form.apiKey;
    const r = await updateEmailSettings(body); setBusy(false);
    if (r.success) { flash("Настройки сохранены"); setCfg(r.data); setForm((f) => ({ ...f, apiKey: r.data.apiKeyMasked || "" })); }
    else flash("Ошибка сохранения", false);
  };
  const test = async () => {
    setBusy(true); const r = await testEmailSettings(); setBusy(false);
    flash(r.data?.message || (r.data?.status === "not_connected" ? "Провайдер не подключён" : "Проверка выполнена"), r.data?.status !== "not_connected");
  };

  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  const configured = !!cfg.hasApiKey;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      {msg ? <div style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13, background: msg.ok ? "#E7F6F3" : "#FEF3E2", color: msg.ok ? T.good : T.warn }} data-testid="email-msg">{msg.text}</div> : null}
      <Card testId="email-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <SectionTitle sub="Транзакционная почта и приглашения через Resend. Ключ хранится в БД и маскируется.">Email-провайдер (Resend)</SectionTitle>
          <Badge tone={configured ? "good" : "warn"}>{configured ? "Подключён" : "Не подключён"}</Badge>
        </div>

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>API-ключ Resend</label>
            <input data-testid="email-apikey" style={field} value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="re_xxx… (скрыт после сохранения)" />
            <div style={{ fontSize: 11.5, color: T.faint, marginTop: 4 }}>Оставьте маскированное значение без изменений, чтобы сохранить текущий ключ.</div>
          </div>
          <div>
            <label style={label}>From Email</label>
            <input data-testid="email-from" style={field} value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} placeholder="noreply@fomo.cx" />
          </div>
          <div>
            <label style={label}>From Name</label>
            <input data-testid="email-fromname" style={field} value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="FOMO" />
          </div>
          <div>
            <label style={label}>Reply-To</label>
            <input style={field} value={form.replyTo} onChange={(e) => setForm({ ...form, replyTo: e.target.value })} placeholder="support@fomo.cx" />
          </div>
          <div>
            <label style={label}>Провайдер</label>
            <input style={{ ...field, background: T.soft }} value={form.provider} disabled />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button disabled={busy} onClick={save} style={primary} data-testid="email-save">Сохранить</button>
          <button disabled={busy} onClick={test} style={{ ...primary, background: T.soft, color: T.ink }} data-testid="email-test">Проверить подключение</button>
        </div>
      </Card>

      <Card style={{ background: T.soft, borderStyle: "dashed" }}>
        <SectionTitle sub="Приглашения не отправляются вживую без ключа. При отсутствии ключа инвайты сохраняются со статусом not_sent, при наличии — pending. Никакой фейковой отправки.">Жизненный цикл приглашений</SectionTitle>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge tone="default">not_sent</Badge>
          <Badge tone="warn">pending</Badge>
          <Badge tone="good">sent</Badge>
          <Badge tone="info">accepted</Badge>
        </div>
      </Card>
    </div>
  );
};

export default EmailTab;

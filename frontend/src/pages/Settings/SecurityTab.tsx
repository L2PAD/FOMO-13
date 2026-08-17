import React, { useEffect, useState } from "react";
import { T, Card, SectionTitle, Badge, StateBlock } from "../Statistics/ui";
import getAccessToken from "../../components/utils/getAccessToken";
import { configureUrl } from "../../components/services/config";
import { get2FAStatus, setup2FA, verify2FA, disable2FA } from "../../components/services/settings";

/* ── shared styles (unified «2FA» look, purple accent) ── */
const primary: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: T.accent,
  color: "#fff",
  fontWeight: 700,
  fontSize: 13.5,
  cursor: "pointer",
};
const ghost: React.CSSProperties = {
  ...primary,
  background: T.soft,
  color: T.ink,
  border: `1px solid ${T.border}`,
};
const danger: React.CSSProperties = { ...primary, background: T.bad };
const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 6, display: "block" };
const field: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};
const codeInput: React.CSSProperties = { ...field, maxWidth: 260, letterSpacing: 3, fontSize: 15 };

const Flash: React.FC<{ msg: { text: string; ok: boolean } | null; testId?: string }> = ({ msg, testId }) =>
  msg ? (
    <div
      data-testid={testId}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 13,
        background: msg.ok ? "#E7F6F3" : "#FDECEC",
        color: msg.ok ? T.good : T.bad,
      }}
    >
      {msg.text}
    </div>
  ) : null;

/* ── Password change (unified purple design) ── */
const PasswordCard: React.FC = () => {
  const [pw, setPw] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4500); };

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!pw.oldPassword || !pw.newPassword) return flash("Заполните все поля", false);
    if (pw.newPassword.length < 6) return flash("Новый пароль слишком короткий (мин. 6 символов)", false);
    if (pw.newPassword !== pw.confirmPassword) return flash("Пароли не совпадают", false);
    setBusy(true);
    try {
      const res = await fetch(configureUrl("user/new/password"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
        credentials: "include",
        body: JSON.stringify({ oldPassword: pw.oldPassword, newPassword: pw.newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success !== false) {
        flash("Пароль изменён");
        setPw({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        flash(data?.message || "Не удалось изменить пароль (проверьте текущий пароль)", false);
      }
    } catch {
      flash("Ошибка сети", false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card testId="password-card">
      <SectionTitle sub="Смена пароля администратора. Требуется текущий пароль для подтверждения.">
        Пароль
      </SectionTitle>
      <form onSubmit={submit} style={{ display: "grid", gap: 14, maxWidth: 420 }}>
        <div>
          <label style={label}>Текущий пароль</label>
          <input type="password" style={field} value={pw.oldPassword} data-testid="pw-old"
            onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })} placeholder="••••••••" />
        </div>
        <div>
          <label style={label}>Новый пароль</label>
          <input type="password" style={field} value={pw.newPassword} data-testid="pw-new"
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="••••••••" />
        </div>
        <div>
          <label style={label}>Повторите новый пароль</label>
          <input type="password" style={field} value={pw.confirmPassword} data-testid="pw-confirm"
            onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} placeholder="••••••••" />
        </div>
        <Flash msg={msg} testId="pw-msg" />
        <div>
          <button type="submit" disabled={busy} style={primary} data-testid="pw-submit">
            {busy ? "Сохранение…" : "Изменить пароль"}
          </button>
        </div>
      </form>
    </Card>
  );
};

const STATE_LABEL: Record<string, string> = { disabled: "Выключена", setup_pending: "Настройка не завершена", enabled: "Включена" };
const STATE_TONE: Record<string, "good" | "warn" | "bad" | "default"> = { disabled: "default", setup_pending: "warn", enabled: "good" };

/* ── 2FA card ── */
const TwoFactorCard: React.FC = () => {
  const [state, setState] = useState<string>("disabled");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };
  const loadStatus = async () => { setLoading(true); const r = await get2FAStatus(); setState(r.success ? r.data?.state || "disabled" : "disabled"); setLoading(false); };
  useEffect(() => { loadStatus(); }, []);

  const startSetup = async () => {
    setBusy(true);
    const r = await setup2FA(); setBusy(false);
    if (r.success && r.data?.qrCodeImage) { setQr(r.data.qrCodeImage); setSetupKey(r.data.setupKey || ""); setState("setup_pending"); }
    else flash("Не удалось начать настройку", false);
  };
  const confirm = async () => {
    if (!code.trim()) return;
    setBusy(true); const r = await verify2FA(code.trim()); setBusy(false);
    if (r.success && (r.data?.success !== false)) { flash("2FA включена"); setCode(""); setQr(""); await loadStatus(); }
    else flash("Неверный код подтверждения", false);
  };
  const doDisable = async () => {
    if (!code.trim()) return;
    setBusy(true); const r = await disable2FA(code.trim()); setBusy(false);
    if (r.success) { flash("2FA выключена"); setCode(""); await loadStatus(); }
    else flash("Неверный код", false);
  };

  if (loading) return <Card><StateBlock kind="loading" /></Card>;

  return (
    <Card testId="twofa-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <SectionTitle sub="Двухфакторная аутентификация (TOTP) для аккаунтов администраторов.">Двухфакторная аутентификация</SectionTitle>
        <Badge tone={STATE_TONE[state]}>{STATE_LABEL[state] || state}</Badge>
      </div>

      {msg ? <div style={{ marginBottom: 12 }}><Flash msg={msg} testId="twofa-msg" /></div> : null}

      {state === "disabled" && (
        <button disabled={busy} onClick={startSetup} style={primary} data-testid="twofa-start">Начать настройку 2FA</button>
      )}

      {state === "setup_pending" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ fontSize: 13.5, color: T.sub }}>Отсканируйте QR-код в приложении-аутентификаторе (Google Authenticator, Authy) и введите 6-значный код.</div>
          {qr ? <img src={qr} alt="2FA QR" style={{ width: 180, height: 180, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, background: "#fff" }} /> : null}
          {setupKey ? <div style={{ fontSize: 13, color: T.ink }}>Ключ вручную: <code style={{ background: T.soft, padding: "3px 8px", borderRadius: 6 }}>{setupKey}</code></div> : null}
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} style={codeInput} data-testid="twofa-code" />
          <div style={{ display: "flex", gap: 10 }}>
            <button disabled={busy} onClick={confirm} style={primary} data-testid="twofa-confirm">Подтвердить и включить</button>
            <button disabled={busy} onClick={loadStatus} style={ghost}>Отмена</button>
          </div>
        </div>
      )}

      {state === "enabled" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13.5, color: T.good, fontWeight: 700 }}>Двухфакторная аутентификация активна.</div>
          <div style={{ fontSize: 13, color: T.sub }}>Чтобы отключить, введите текущий код из приложения:</div>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} style={codeInput} data-testid="twofa-disable-code" />
          <button disabled={busy} onClick={doDisable} style={danger} data-testid="twofa-disable">Отключить 2FA</button>
        </div>
      )}
    </Card>
  );
};

/* ── Recovery codes contract (integration-ready) ── */
const RecoveryCard: React.FC = () => (
  <Card style={{ background: T.soft, borderStyle: "dashed" }}>
    <SectionTitle sub="Контракт готов. Одноразовые резервные коды будут выданы бэкендом при боевом подключении — без фейковой генерации.">
      Резервные коды восстановления
    </SectionTitle>
    <StateBlock kind="not-collected" message="Резервные коды пока не выпускаются провайдером 2FA (integration-ready)" height={70} />
  </Card>
);

const SecurityTab: React.FC = () => {
  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 760 }} data-testid="security-tab">
      <PasswordCard />
      <TwoFactorCard />
      <RecoveryCard />
    </div>
  );
};

export default SecurityTab;

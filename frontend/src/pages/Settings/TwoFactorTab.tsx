import React, { useEffect, useState } from "react";
import { T, Card, SectionTitle, Badge, StateBlock } from "../Statistics/ui";
import { get2FAStatus, setup2FA, verify2FA, disable2FA } from "../../components/services/settings";

const input: React.CSSProperties = { width: "100%", maxWidth: 260, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 15, letterSpacing: 2, outline: "none", boxSizing: "border-box" };
const primary: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" };
const danger: React.CSSProperties = { ...primary, background: T.bad };

const STATE_LABEL: Record<string, string> = { disabled: "Выключена", setup_pending: "Настройка не завершена", enabled: "Включена" };
const STATE_TONE: Record<string, "good" | "warn" | "bad" | "default"> = { disabled: "default", setup_pending: "warn", enabled: "good" };

const TwoFactorTab: React.FC = () => {
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

  const recoveryContract = (
    <Card style={{ marginTop: 16, background: T.soft, borderStyle: "dashed" }}>
      <SectionTitle sub="Контракт готов. Одноразовые резервные коды будут выданы бэкендом при боевом подключении — без фейковой генерации.">Резервные коды восстановления</SectionTitle>
      <StateBlock kind="not-collected" message="Резервные коды пока не выпускаются провайдером 2FA (integration-ready)" height={70} />
    </Card>
  );

  if (loading) return <Card><StateBlock kind="loading" /></Card>;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      {msg ? <div style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13, background: msg.ok ? "#E7F6F3" : "#FDECEC", color: msg.ok ? T.good : T.bad }} data-testid="twofa-msg">{msg.text}</div> : null}
      <Card testId="twofa-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <SectionTitle sub="Двухфакторная аутентификация (TOTP) для аккаунтов администраторов">Статус 2FA</SectionTitle>
          <Badge tone={STATE_TONE[state]} >{STATE_LABEL[state] || state}</Badge>
        </div>

        {state === "disabled" && (
          <button disabled={busy} onClick={startSetup} style={primary} data-testid="twofa-start">Начать настройку 2FA</button>
        )}

        {state === "setup_pending" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ fontSize: 13.5, color: T.sub }}>Отсканируйте QR-код в приложении-аутентификаторе (Google Authenticator, Authy) и введите 6-значный код.</div>
            {qr ? <img src={qr} alt="2FA QR" style={{ width: 180, height: 180, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, background: "#fff" }} /> : null}
            {setupKey ? <div style={{ fontSize: 13, color: T.ink }}>Ключ вручную: <code style={{ background: T.soft, padding: "3px 8px", borderRadius: 6 }}>{setupKey}</code></div> : null}
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} style={input} data-testid="twofa-code" />
            <div style={{ display: "flex", gap: 10 }}>
              <button disabled={busy} onClick={confirm} style={primary} data-testid="twofa-confirm">Подтвердить и включить</button>
              <button disabled={busy} onClick={loadStatus} style={{ ...primary, background: T.soft, color: T.ink }}>Отмена</button>
            </div>
          </div>
        )}

        {state === "enabled" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 13.5, color: T.good, fontWeight: 700 }}>Двухфакторная аутентификация активна.</div>
            <div style={{ fontSize: 13, color: T.sub }}>Чтобы отключить, введите текущий код из приложения:</div>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} style={input} data-testid="twofa-disable-code" />
            <button disabled={busy} onClick={doDisable} style={danger} data-testid="twofa-disable">Отключить 2FA</button>
          </div>
        )}
      </Card>
      {recoveryContract}
    </div>
  );
};

export default TwoFactorTab;

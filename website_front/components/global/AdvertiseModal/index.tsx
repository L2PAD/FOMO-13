import React, { useState } from "react";
import submitAdRequest from "../../../http/ads/submitAdRequest";
import CustomSelect from "../common/CustomSelect";

const PLACEMENTS = [
  { value: "", label: "Any / recommend for me" },
  { value: "GLOBAL_TOP_BANNER", label: "Site-wide top banner" },
  { value: "HOME_HERO", label: "Homepage" },
  { value: "ECHO_FEED", label: "Echo" },
  { value: "OTC_MARKET", label: "OTC / P2P" },
  { value: "LAUNCHPAD_FEATURED", label: "Launchpad" },
  { value: "CRYPTO_PROMOTED", label: "Crypto" },
];

const AD_TYPES = [
  { value: "banner_global", label: "Site-wide top banner" },
  { value: "homepage", label: "Homepage placement" },
  { value: "local", label: "Local section placement" },
  { value: "floating", label: "Floating banner (corner)" },
  { value: "sponsored", label: "Sponsored post / project" },
  { value: "newsletter", label: "Newsletter" },
  { value: "other", label: "Other" },
];

const field: React.CSSProperties = { width: "100%", padding: "11px 13px", border: "1px solid #E5E8EE", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", color: "#0B1220" };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#5B6472", marginBottom: 6, display: "block" };

/** Small non-intrusive "Your Ad Here" promo that opens a request modal. */
const AdvertiseCTA: React.FC<{ compact?: boolean; source?: string }> = ({ compact, source }) => {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ projectName: "", email: "", contactName: "", telegram: "", website: "", adType: "", placement: "", budget: "", message: "" });

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr("");
    if (!f.projectName.trim() || !f.email.trim()) { setErr("Please enter your project and email"); return; }
    setBusy(true);
    const r = await submitAdRequest({ ...f, source: source || (typeof window !== "undefined" ? window.location.pathname : "") });
    setBusy(false);
    if (r.success) setSent(true); else setErr(r.message === "Invalid email" ? "Invalid email address" : "Could not send, please try again later");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-testid="advertise-cta"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", width: compact ? "100%" : undefined,
          padding: compact ? "7px 12px" : "9px 16px",
          borderRadius: compact ? 8 : 999, border: "1px dashed rgba(255,255,255,0.22)",
          background: "linear-gradient(135deg,#0B1220 0%,#0f1730 55%,#141d3a 100%)", color: "#fff",
          fontWeight: 700, fontSize: compact ? 13 : 13, whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", padding: "2px 7px", borderRadius: 6, background: "rgba(255,255,255,0.15)", color: "#fff" }}>Ad</span>
        <span style={{ color: "rgba(255,255,255,0.85)" }}>Your ad here</span>
      </button>

      {open && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(11,18,32,0.55)", zIndex: 4000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}>
          <div data-testid="advertise-modal" style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 16, marginTop: 48, boxShadow: "0 24px 60px rgba(7,11,53,0.28)", overflow: "hidden" }}>
            <div style={{ padding: "20px 22px", background: "linear-gradient(120deg,#0b1220,#3730A3)", color: "#fff" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.8 }}>Advertise on FOMO</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Promote your project</div>
              <div style={{ fontSize: 13, opacity: 0.82, marginTop: 6 }}>Submit a request — our team will reach out and find the best placement for your budget.</div>
            </div>

            {sent ? (
              <div style={{ padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0B1220" }}>Request sent</div>
                <div style={{ fontSize: 13.5, color: "#5B6472", marginTop: 6 }}>We will get in touch with you at the email you provided.</div>
                <button onClick={() => { setOpen(false); setSent(false); }} style={{ marginTop: 18, padding: "10px 18px", borderRadius: 10, border: "none", background: "#4F46E5", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Close</button>
              </div>
            ) : (
              <div style={{ padding: 22, display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Project / brand *</label><input style={field} data-testid="ar-project" value={f.projectName} onChange={(e) => set("projectName", e.target.value)} /></div>
                  <div><label style={labelStyle}>Email *</label><input style={field} data-testid="ar-email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
                  <div><label style={labelStyle}>Contact name</label><input style={field} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} /></div>
                  <div><label style={labelStyle}>Telegram</label><input style={field} value={f.telegram} onChange={(e) => set("telegram", e.target.value)} placeholder="@handle" /></div>
                  <div><label style={labelStyle}>Website</label><input style={field} value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></div>
                  <div><label style={labelStyle}>Budget</label><input style={field} value={f.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. $2000/mo" /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Ad type *</label>
                    <CustomSelect className="small-select" placeholder="Select a type" options={AD_TYPES} onChange={(v) => set("adType", v)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Preferred placement</label>
                    <CustomSelect className="small-select" placeholder={PLACEMENTS[0].label} options={PLACEMENTS.filter((p) => p.value).map((p) => ({ value: p.value, label: p.label }))} onChange={(v) => set("placement", v)} />
                  </div>
                </div>
                <div><label style={labelStyle}>About the project / message</label><textarea style={{ ...field, minHeight: 72, resize: "vertical", fontFamily: "inherit" }} data-testid="ar-message" value={f.message} onChange={(e) => set("message", e.target.value)} placeholder="Briefly describe your project, campaign goals and any preferences" /></div>
                {err ? <div style={{ color: "#DC2626", fontSize: 13, fontWeight: 700 }}>{err}</div> : null}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                  <button onClick={() => setOpen(false)} disabled={busy} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E5E8EE", background: "#fff", color: "#0B1220", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button onClick={submit} disabled={busy} data-testid="ar-submit" style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#4F46E5", color: "#fff", fontWeight: 800, cursor: "pointer" }}>{busy ? "Sending…" : "Send request"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdvertiseCTA;

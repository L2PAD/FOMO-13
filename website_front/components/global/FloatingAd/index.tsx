import React, { useEffect, useRef, useState } from "react";
import serveAd, { ServedAd } from "../../../http/ads/serveAd";
import trackAd, { AdEventType } from "../../../http/ads/trackAd";

const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  try {
    let sid = localStorage.getItem("fomo_ad_sid");
    if (!sid) { sid = "sid-" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("fomo_ad_sid", sid); }
    return sid;
  } catch { return "anon"; }
};

interface Props {
  placement?: string;
  position?: "bottom-right" | "bottom-left";
}

/** Floating corner ad card that sits ON TOP of the site (does not cut layout). Dismissible. */
const FloatingAd: React.FC<Props> = ({ placement = "HOME_HERO", position = "bottom-right" }) => {
  const [ad, setAd] = useState<ServedAd | null>(null);
  const [closed, setClosed] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const firedRef = useRef<Record<string, boolean>>({});
  const ctxRef = useRef<{ device: string; loggedIn: boolean; session: string } | null>(null);

  // Coordinate with the header ad popover so the two ads never overlap.
  useEffect(() => {
    const onPop = (e: any) => setPopoverOpen(!!e?.detail?.open);
    window.addEventListener("fomo-ad-popover", onPop as EventListener);
    return () => window.removeEventListener("fomo-ad-popover", onPop as EventListener);
  }, []);

  const fire = (type: AdEventType) => {
    if (!ad?.filled || !ad.deliveryId) return;
    if (type !== "click" && type !== "cta_click" && firedRef.current[type]) return;
    firedRef.current[type] = true;
    const ctx = ctxRef.current!;
    trackAd({ deliveryId: ad.deliveryId, campaignId: ad.campaignId, creativeId: ad.creativeId, placement, type, sessionId: ctx.session, device: ctx.device, loggedIn: ctx.loggedIn, viewablePct: type === "viewable_impression" ? 100 : undefined, dwellMs: type === "viewable_impression" ? 1000 : undefined });
  };

  useEffect(() => {
    try { if (sessionStorage.getItem("fomo_fad_" + placement) === "1") { setClosed(true); return; } } catch {}
    const device = typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";
    ctxRef.current = { device, loggedIn: false, session: getSessionId() };
    serveAd(placement, ctxRef.current).then(setAd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  useEffect(() => {
    if (!ad?.filled) return;
    fire("loaded"); fire("impression");
    const t = setTimeout(() => fire("viewable_impression"), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  if (closed || !ad || !ad.filled || !ad.creative) return null;
  const c = ad.creative;
  const variant = c.variant || "gradient";
  const dark = variant === "dark" || variant === "gradient";
  const bg = variant === "light" ? "#FFFFFF" : variant === "dark" ? "#0B1220" : "linear-gradient(135deg,#0B1220 0%,#0f1730 55%,#141d3a 100%)";
  const textColor = dark ? "#fff" : "#0B1220";
  const subColor = dark ? "rgba(255,255,255,0.75)" : "#5B6472";

  const close = (e: React.MouseEvent) => { e.stopPropagation(); setClosed(true); try { sessionStorage.setItem("fomo_fad_" + placement, "1"); } catch {} fire("close" as AdEventType); };
  const onClick = () => { fire("cta_click"); fire("click"); if (c.destinationUrl && typeof window !== "undefined") window.open(c.destinationUrl, "_blank", "noopener"); };

  const pos: React.CSSProperties = position === "bottom-left" ? { left: 18 } : { right: 18 };

  return (
    <div data-testid={`floating-ad-${placement}`} onClick={onClick}
      style={{ position: "fixed", bottom: 18, ...pos, zIndex: 900, width: 330, maxWidth: "calc(100vw - 32px)", borderRadius: 16, overflow: "hidden", background: bg, border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E5E8EE", boxShadow: "0 18px 44px rgba(7,11,53,0.32)", cursor: "pointer", animation: "fomoFadIn .35s ease", opacity: popoverOpen ? 0 : 1, transform: popoverOpen ? "translateY(12px)" : "translateY(0)", pointerEvents: popoverOpen ? "none" : "auto", transition: "opacity .2s ease, transform .2s ease" }}>
      <style>{`@keyframes fomoFadIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <button aria-label="Close ad" data-testid="floating-ad-close" onClick={close}
        style={{ position: "absolute", top: 8, right: 8, zIndex: 2, width: 24, height: 24, borderRadius: "50%", border: "none", background: dark ? "rgba(255,255,255,0.18)" : "rgba(11,18,32,0.08)", color: dark ? "#fff" : "#0B1220", fontSize: 14, lineHeight: "24px", cursor: "pointer", fontWeight: 700 }}>×</button>
      {c.imageUrl ? <img src={c.imageUrl} alt={c.alt || ""} style={{ width: "100%", display: "block", aspectRatio: "16 / 7", objectFit: "cover" }} /> : null}
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", padding: "2px 6px", borderRadius: 5, background: dark ? "rgba(255,255,255,0.16)" : "#EEF2FF", color: dark ? "#fff" : "#4F46E5" }}>{c.sponsoredLabel || "Ad"}</span>
          {c.brandName ? <span style={{ fontSize: 11.5, color: subColor, fontWeight: 800 }}>{c.brandName}</span> : null}
        </div>
        <div style={{ fontSize: 15.5, lineHeight: "20px", fontWeight: 800, color: textColor }}>{c.headline}</div>
        {c.description ? <div style={{ fontSize: 12.5, lineHeight: "17px", color: subColor, marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</div> : null}
        <div style={{ marginTop: 12, padding: "9px 14px", borderRadius: 10, textAlign: "center", background: dark ? "#fff" : "#4F46E5", color: dark ? "#0B1220" : "#fff", fontWeight: 800, fontSize: 13 }}>{c.ctaLabel || "Learn more"}</div>
      </div>
    </div>
  );
};

export default FloatingAd;

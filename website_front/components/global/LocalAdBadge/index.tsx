import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import serveAd, { ServedAd } from "../../../http/ads/serveAd";
import trackAd, { AdEventType } from "../../../http/ads/trackAd";

const getSid = (): string => {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem("fomo_ad_sid");
    if (!s) { s = "sid-" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("fomo_ad_sid", s); }
    return s;
  } catch { return "anon"; }
};

interface Props {
  placement: string;
  /** small (badge only) is default; inline shows brand text next to the badge */
  label?: string;
  /** human-friendly placement name shown in the popover detail rows */
  placementLabel?: string;
}

/**
 * Unified compact "Ad" badge shown next to a section title.
 * - renders nothing when no ad is served (never clutters the title)
 * - dark premium style, matches the header pill
 * - expands a rich popover on hover with the full creative + real tracking
 */
const LocalAdBadge: React.FC<Props> = ({ placement, label = "Ad", placementLabel }) => {
  const [ad, setAd] = useState<ServedAd | null>(null);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const firedRef = useRef<Record<string, boolean>>({});
  const ctxRef = useRef<{ device: string; session: string } | null>(null);
  const closeTimer = useRef<any>(null);
  const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    const device = typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";
    ctxRef.current = { device, session: getSid() };
    serveAd(placement, { device, loggedIn: false, session: ctxRef.current.session }).then(setAd);
  }, [placement]);

  const fire = (type: AdEventType) => {
    if (!ad?.filled || !ad.deliveryId) return;
    if (type !== "click" && type !== "cta_click" && type !== "expand" && firedRef.current[type]) return;
    if (type !== "click" && type !== "cta_click") firedRef.current[type] = true;
    const ctx = ctxRef.current!;
    trackAd({ deliveryId: ad.deliveryId, campaignId: ad.campaignId, creativeId: ad.creativeId, placement, type, sessionId: ctx.session, device: ctx.device, viewablePct: type === "viewable_impression" ? 100 : undefined, dwellMs: type === "viewable_impression" ? 1000 : undefined });
  };

  useEffect(() => {
    if (!ad?.filled) return;
    fire("loaded"); fire("impression");
    const t = setTimeout(() => fire("viewable_impression"), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const width = 320;
    let left = r.left;
    if (typeof window !== "undefined" && left + width > window.innerWidth - 12) left = Math.max(12, window.innerWidth - 12 - width);
    setCoords({ left, top: r.bottom + 8 });
  }, [open]);

  if (!ad || !ad.filled || !ad.creative) return null;
  const c = ad.creative;
  const kind = ad.placement?.kind || "";
  const template = c.template || "facts";
  const progress = Math.max(0, Math.min(100, Number(c.progress || 0)));
  const highlights = (c.highlights || []).filter((h) => h && h.label && h.value).slice(0, 6);
  const useRows = template === "deal" || template === "offer" || template === "profile";
  const showProgress = progress > 0 && (template === "deal" || template === "offer");
  const goLink = (url?: string) => {
    fire("cta_click"); fire("click");
    const dest = url || c.destinationUrl;
    if (dest && typeof window !== "undefined") window.open(dest, "_blank", "noopener");
  };

  const openPop = () => { if (closeTimer.current) clearTimeout(closeTimer.current); if (!open) { setOpen(true); if (!firedRef.current["expand"]) { firedRef.current["expand"] = true; fire("expand" as AdEventType); } } };
  const closePop = () => { closeTimer.current = setTimeout(() => setOpen(false), 120); };
  const go = () => { fire("cta_click"); fire("click"); if (c.destinationUrl && typeof window !== "undefined") window.open(c.destinationUrl, "_blank", "noopener"); };

  return (
    <span ref={anchorRef} onMouseEnter={openPop} onMouseLeave={closePop} style={{ display: "inline-flex", verticalAlign: "middle" }}>
      <span data-testid={`localad-${placement}`} onClick={go}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", marginLeft: 12, padding: "5px 11px 5px 7px", borderRadius: 10, transform: "scale(0.98)", transformOrigin: "left center", background: "linear-gradient(135deg,#0B1220 0%,#0f1730 55%,#141d3a 100%)", border: "1px solid rgba(120,150,255,0.25)", boxShadow: "0 4px 14px rgba(7,11,53,0.28), inset 0 0 0 1px rgba(255,255,255,0.02)" }}>
        {c.logoUrl
          ? <img src={c.logoUrl} alt="" style={{ width: 22, height: 22, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
          : <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 800 }}>{(c.brandName || "A").slice(0, 1).toUpperCase()}</span>}
        <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", padding: "1px 5px", borderRadius: 4, background: "linear-gradient(135deg,#4F46E5,#6D5EF6)", color: "#fff" }}>{c.sponsoredLabel || label}</span>
            {c.brandName ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.7)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.brandName}</span> : null}
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginTop: 2, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.headline}</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.8, flexShrink: 0 }}><path d="M3 5.5L7 9.5L11 5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      {open && typeof document !== "undefined" ? createPortal(
        <div data-testid={`localad-pop-${placement}`} onMouseEnter={openPop} onMouseLeave={closePop} onClick={go}
          style={{ position: "fixed", left: coords.left, top: coords.top, width: 340, zIndex: 4000, borderRadius: 16, overflow: "hidden", background: "#0B1220", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 56px rgba(7,11,53,0.4)", cursor: "pointer", animation: "localAdPop .2s ease" }}>
          <style>{`@keyframes localAdPop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {c.imageUrl ? <img src={c.imageUrl} alt={c.alt || ""} style={{ width: "100%", display: "block", aspectRatio: "16 / 7", objectFit: "cover" }} /> : null}
          <div style={{ padding: 16 }}>
            {/* context chip = the page's product direction (what is promoted here) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {c.logoUrl ? <img src={c.logoUrl} alt="" style={{ width: 24, height: 24, borderRadius: 7, objectFit: "cover" }} /> : null}
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.brandName}</span>
              </div>
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", padding: "3px 7px", borderRadius: 999, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)", flexShrink: 0 }}>{c.sponsoredLabel || "Ad"}</span>
            </div>

            {kind ? <div style={{ display: "inline-block", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, padding: "4px 9px", borderRadius: 999, background: "rgba(79,70,229,0.2)", color: "#B9C2FF", border: "1px solid rgba(120,150,255,0.28)", marginBottom: 10 }}>{kind}</div> : null}

            <div style={{ fontSize: 17, lineHeight: "22px", fontWeight: 800 }}>{c.headline}</div>
            {c.description ? <div style={{ fontSize: 12.5, lineHeight: "18px", color: "rgba(255,255,255,0.7)", marginTop: 6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</div> : null}

            {/* progress bar — deal / offer templates */}
            {showProgress ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{c.progressLabel || "Progress"}</span>
                  <span style={{ color: "#B9C2FF" }}>{progress}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#4F46E5,#6D5EF6)" }} />
                </div>
              </div>
            ) : null}

            {/* product facts (real, admin-provided) — rows for deal/offer/profile, grid for facts */}
            {highlights.length ? (
              useRows ? (
                <div style={{ marginTop: 14, display: "grid", gap: 1, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {highlights.map((h, i) => (
                    <div key={i} onClick={(e) => { if (h.link) { e.stopPropagation(); goLink(h.link); } }}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 12px", background: "rgba(255,255,255,0.04)", cursor: h.link ? "pointer" : "inherit" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{h.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: h.link ? "#B9C2FF" : "#fff", textAlign: "right" }}>{h.value}{h.link ? " \u2197" : ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: highlights.length > 2 ? "1fr 1fr" : "1fr", gap: 8, marginTop: 14 }}>
                  {highlights.map((h, i) => (
                    <div key={i} onClick={(e) => { if (h.link) { e.stopPropagation(); goLink(h.link); } }}
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 10px", cursor: h.link ? "pointer" : "inherit" }}>
                      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.3 }}>{h.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: h.link ? "#B9C2FF" : "#fff", marginTop: 2 }}>{h.value}{h.link ? " \u2197" : ""}</div>
                    </div>
                  ))}
                </div>
              )
            ) : null}

            <button onClick={go} style={{ width: "100%", marginTop: 14, padding: "11px 14px", borderRadius: 11, border: "none", textAlign: "center", fontWeight: 800, fontSize: 13.5, background: "linear-gradient(135deg,#4F46E5,#6D5EF6)", color: "#fff", cursor: "pointer" }}>{c.ctaLabel || "Learn more"} &rarr;</button>
          </div>
        </div>,
        document.body,
      ) : null}
    </span>
  );
};

export default LocalAdBadge;

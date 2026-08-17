import React, { useEffect, useRef, useState } from "react";
import serveAd, { ServedAd } from "../../../http/ads/serveAd";
import trackAd, { AdEventType } from "../../../http/ads/trackAd";

/** Stable per-browser session id for ad frequency + unique counting. */
const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  try {
    let sid = localStorage.getItem("fomo_ad_sid");
    if (!sid) {
      sid = "sid-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("fomo_ad_sid", sid);
    }
    return sid;
  } catch {
    return "anon";
  }
};

const isLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return !!(localStorage.getItem("token") || localStorage.getItem("accessToken"));
  } catch {
    return false;
  }
};

interface Props {
  placement: string;
  format?: "compact" | "expanded";
  style?: React.CSSProperties;
  className?: string;
  fallback?: React.ReactNode;
}

const SponsoredTag: React.FC<{ label?: string; dark?: boolean }> = ({ label, dark }) => (
  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", padding: "3px 7px", borderRadius: 6, background: dark ? "rgba(255,255,255,0.16)" : "#EEF2FF", color: dark ? "#fff" : "#4F46E5" }}>
    {label || "Ad"}
  </span>
);

/**
 * Unified public ad renderer + real delivery tracking.
 * Fires: loaded -> impression (in viewport) -> viewable_impression (>=50% for >=1s) -> click/cta_click.
 * Server dedupes per deliveryId so a refresh cannot inflate metrics.
 */
const AdSlot: React.FC<Props> = ({ placement, format, style, className, fallback }) => {
  const [ad, setAd] = useState<ServedAd | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<{ device: string; loggedIn: boolean; session: string } | null>(null);
  const firedRef = useRef<Record<string, boolean>>({});
  const viewTimer = useRef<any>(null);

  const fire = (type: AdEventType, extra: Partial<{ viewablePct: number; dwellMs: number }> = {}) => {
    if (!ad?.filled || !ad.deliveryId) return;
    if (type !== "click" && type !== "cta_click" && firedRef.current[type]) return;
    firedRef.current[type] = true;
    const ctx = ctxRef.current!;
    trackAd({
      deliveryId: ad.deliveryId,
      campaignId: ad.campaignId,
      creativeId: ad.creativeId,
      placement,
      type,
      sessionId: ctx.session,
      device: ctx.device,
      loggedIn: ctx.loggedIn,
      ...extra,
    });
  };

  // fetch an ad on mount
  useEffect(() => {
    const device = typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";
    const ctx = { device, loggedIn: isLoggedIn(), session: getSessionId() };
    ctxRef.current = ctx;
    let alive = true;
    serveAd(placement, ctx).then((res) => {
      if (alive) setAd(res);
    });
    return () => {
      alive = false;
      if (viewTimer.current) clearTimeout(viewTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  // once filled -> loaded + viewability observer
  useEffect(() => {
    if (!ad?.filled || !ref.current) return;
    fire("loaded");

    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.intersectionRatio > 0) fire("impression");
        if (e.intersectionRatio >= 0.5) {
          if (!viewTimer.current && !firedRef.current["viewable_impression"]) {
            viewTimer.current = setTimeout(() => {
              fire("viewable_impression", { viewablePct: Math.round(e.intersectionRatio * 100) || 60, dwellMs: 1000 });
            }, 1000);
          }
        } else if (viewTimer.current) {
          clearTimeout(viewTimer.current);
          viewTimer.current = null;
        }
      },
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  if (!ad || !ad.filled || !ad.creative) {
    // No live campaign for this slot: render the explicit fallback if provided,
    // otherwise render nothing (empty slot — no placeholder).
    if (fallback !== undefined && fallback !== null) return <>{fallback}</>;
    return null;
  }

  const c = ad.creative;
  const fmt = c.displaySize === "compact"
    ? "compact"
    : c.displaySize === "standard"
    ? (format || (ad.placement?.format === "compact" ? "compact" : "expanded"))
    : format || (ad.placement?.format === "compact" ? "compact" : "expanded");
  const variant = c.variant || "gradient";
  const dark = variant === "dark" || variant === "gradient";
  const bg = variant === "light" ? "#FFFFFF" : variant === "dark" ? "#0B1220" : "linear-gradient(135deg,#0B1220 0%,#0f1730 55%,#141d3a 100%)";
  const textColor = dark ? "#fff" : "#0B1220";
  const subColor = dark ? "rgba(255,255,255,0.72)" : "#5B6472";

  const onClick = () => {
    fire("cta_click");
    fire("click");
    if (c.destinationUrl && typeof window !== "undefined") {
      window.open(c.destinationUrl, "_blank", "noopener");
    }
  };

  if (fmt === "compact") {
    const uid = `mq-${placement}`.replace(/[^a-zA-Z0-9_-]/g, "");
    const accent = dark ? "rgba(255,255,255,0.06)" : "#F1F4FA";
    return (
      <div ref={ref} className={className} data-testid={`adslot-${placement}`} onClick={onClick}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 12, background: bg, border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E5E8EE", minHeight: 56, cursor: "pointer", width: "100%", boxSizing: "border-box", overflow: "hidden", ...style }}>
        <style>{`
          @keyframes ${uid}{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
          .${uid}-track{display:inline-flex;gap:48px;white-space:nowrap;will-change:transform;animation:${uid} 22s linear infinite}
          .${uid}-wrap:hover .${uid}-track{animation-play-state:paused}
        `}</style>
        {c.logoUrl ? <img src={c.logoUrl} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} /> : null}
        <div style={{ flexShrink: 0, minWidth: 0, maxWidth: "42%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SponsoredTag label={c.sponsoredLabel} dark={dark} />
            {c.brandName ? <span style={{ fontSize: 11.5, color: subColor, fontWeight: 700 }}>{c.brandName}</span> : null}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: textColor, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.headline}</div>
        </div>
        {/* animated ticker fills the middle space and draws attention */}
        <div className={`${uid}-wrap`} style={{ flex: 1, minWidth: 0, overflow: "hidden", position: "relative", maskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)" }}>
          <div className={`${uid}-track`}>
            {[0, 1].map((k) => (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 48 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: subColor }}>{c.description || c.headline}</span>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: dark ? "rgba(255,255,255,0.35)" : "#9AA6B8", background: accent, padding: "3px 10px", borderRadius: 999 }}>{c.ctaLabel || "Learn more"}</span>
              </span>
            ))}
          </div>
        </div>
        <span style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: dark ? "#fff" : "#4F46E5", color: dark ? "#0B1220" : "#fff", fontWeight: 800, fontSize: 12.5, whiteSpace: "nowrap", flexShrink: 0 }}>{c.ctaLabel || "Learn more"}</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={className} data-testid={`adslot-${placement}`}
      style={{ borderRadius: 16, overflow: "hidden", background: bg, border: dark ? "none" : "1px solid #E5E8EE", boxShadow: "0 12px 30px rgba(7,11,53,0.10)", width: "100%", boxSizing: "border-box", ...style }}>
      {c.imageUrl ? (
        <div style={{ position: "relative" }}>
          <img src={c.imageUrl} alt={c.alt || ""} style={{ width: "100%", display: "block", aspectRatio: "3 / 1", objectFit: "cover" }} />
          <div style={{ position: "absolute", top: 10, left: 10 }}><SponsoredTag label={c.sponsoredLabel} dark /></div>
        </div>
      ) : null}
      <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {c.logoUrl ? <img src={c.logoUrl} alt="" style={{ width: 26, height: 26, borderRadius: 7, objectFit: "cover" }} /> : null}
            {c.brandName ? <span style={{ fontSize: 12.5, color: subColor, fontWeight: 800 }}>{c.brandName}</span> : null}
            {!c.imageUrl ? <SponsoredTag label={c.sponsoredLabel} dark={dark} /> : null}
          </div>
          <div style={{ fontSize: 20, lineHeight: "26px", fontWeight: 800, color: textColor }}>{c.headline}</div>
          {c.description ? <div style={{ fontSize: 13.5, lineHeight: "19px", color: subColor, marginTop: 8 }}>{c.description}</div> : null}
          {Array.isArray(c.highlights) && c.highlights.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {c.highlights.filter((h) => h && h.label && h.value).slice(0, 4).map((h, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: 6, padding: "5px 10px", borderRadius: 999, background: dark ? "rgba(255,255,255,0.06)" : "#F1F4FA", border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E5E8EE" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, color: subColor }}>{h.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: textColor }}>{h.value}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <button onClick={onClick} style={{ padding: "12px 20px", borderRadius: 11, border: dark ? "1px solid rgba(255,255,255,0.28)" : "none", background: dark ? "#fff" : "#4F46E5", color: dark ? "#0B1220" : "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>{c.ctaLabel || "Learn more"}</button>
      </div>
    </div>
  );
};

export default AdSlot;

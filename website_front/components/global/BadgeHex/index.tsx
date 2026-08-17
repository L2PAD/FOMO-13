import React from "react";
import { BADGE_GLYPHS, resolveGlyphKey } from "./glyphs";

const HEX = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
const FACE_ACTIVE = "linear-gradient(150deg,#5AA2FF 0%,#2F6BFF 55%,#1D4ED8 100%)";
const FACE_PROGRESS = "linear-gradient(150deg,#9CC0FF 0%,#6E93E6 100%)";
const FACE_LOCKED = "linear-gradient(150deg,#CBD5E1 0%,#94A3B8 100%)";

export interface BadgeHexProps {
  icon?: string;
  size?: number;
  earned?: boolean;
  progress?: number | null;
  hidden?: boolean;
  title?: string;
  className?: string;
}

/**
 * Unified FOMO badge patch (website). Blue hexagon + white glyph.
 * earned (blue) · in-progress (muted blue + ring + %) · locked/hidden (grey "?").
 */
const BadgeHex: React.FC<BadgeHexProps> = ({ icon, size = 56, earned = false, progress = null, hidden = false, title, className }) => {
  const glyphKey = resolveGlyphKey(icon);
  const pct = typeof progress === "number" ? Math.max(0, Math.min(100, Math.round(progress))) : null;
  const showRing = !earned && !hidden && pct != null;
  const asQuestion = hidden || (!earned && !glyphKey);
  const face = earned ? FACE_ACTIVE : !hidden && pct != null ? FACE_PROGRESS : FACE_LOCKED;
  const glow = earned ? "rgba(47,107,255,0.45)" : "rgba(148,163,184,0.30)";
  const inner = Math.round(size * 0.86);
  const glyphSize = Math.round(size * 0.44);
  const R = size / 2 - 1.5;
  const C = 2 * Math.PI * R;
  const off = pct != null ? C * (1 - pct / 100) : C;

  return (
    <span
      title={title}
      className={className}
      style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", filter: `drop-shadow(0 6px 10px ${glow})` }}
    >
      {showRing && (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#E2E8F0" strokeWidth={2.5} />
          <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#2F6BFF" strokeWidth={2.5} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} />
        </svg>
      )}
      <span style={{ position: "absolute", width: inner + 4, height: inner + 4, background: "linear-gradient(150deg,#ffffff,#dbe4f2)", clipPath: HEX }} />
      <span style={{ position: "absolute", width: inner, height: inner, background: face, clipPath: HEX }} />
      <span style={{ position: "absolute", width: inner, height: inner, clipPath: HEX, background: "linear-gradient(180deg,rgba(255,255,255,0.38),rgba(255,255,255,0) 52%)" }} />
      <span style={{ position: "relative", display: "inline-flex", opacity: earned ? 1 : hidden ? 0.9 : 0.92 }}>
        {asQuestion ? (
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.2 9a2.8 2.8 0 1 1 4.6 2.2c-1 .8-1.8 1.3-1.8 2.6" />
            <circle cx="12" cy="17.5" r="0.6" fill="#fff" stroke="none" />
          </svg>
        ) : (
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            {glyphKey ? BADGE_GLYPHS[glyphKey] : BADGE_GLYPHS.award}
          </svg>
        )}
      </span>
      {showRing && pct! > 0 && pct! < 100 && (
        <span style={{ position: "absolute", bottom: -6, right: -6, background: "#2F6BFF", color: "#fff", fontSize: Math.max(9, size * 0.16), fontWeight: 800, lineHeight: 1, padding: "3px 5px", borderRadius: 999, border: "2px solid #fff" }}>
          {pct}%
        </span>
      )}
    </span>
  );
};

export default BadgeHex;

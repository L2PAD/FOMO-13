import React, { FC } from "react";

// Rarity-driven premium gradients for the badge "patch".
const RARITY_GRADIENT: Record<string, string> = {
  common: "linear-gradient(145deg,#AEB9CC 0%,#8494AE 100%)",
  uncommon: "linear-gradient(145deg,#41E0A9 0%,#0E9F73 100%)",
  rare: "linear-gradient(145deg,#5AA2FF 0%,#2563EB 100%)",
  epic: "linear-gradient(145deg,#A78BFA 0%,#6D28D9 100%)",
  legendary: "linear-gradient(145deg,#FCD34D 0%,#D97706 100%)",
};

const RARITY_GLOW: Record<string, string> = {
  common: "rgba(132,148,174,0.35)",
  uncommon: "rgba(14,159,115,0.40)",
  rare: "rgba(37,99,235,0.42)",
  epic: "rgba(109,40,217,0.45)",
  legendary: "rgba(217,119,6,0.50)",
};

const HEX = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

const glyph = (category: string, s: number) => {
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (category) {
    case "STAKING":
      return (<svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>);
    case "TRADE":
      return (<svg {...common}><path d="M4 8h13l-3-3M20 16H7l3 3" /></svg>);
    case "ACTIVITY":
      return (<svg {...common}><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>);
    case "REFERRAL":
      return (<svg {...common}><circle cx="9" cy="8" r="3" /><path d="M4 19a5 5 0 0 1 10 0M16 6a3 3 0 0 1 0 6M20 19a5 5 0 0 0-3-4.6" /></svg>);
    case "NFT":
      return (<svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="9" cy="9" r="1.6" /><path d="m5 17 4.5-4.5a2 2 0 0 1 2.8 0L19 19" /></svg>);
    case "CONTENT":
      return (<svg {...common}><path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3z" /><path d="M14 7l3 3" /></svg>);
    case "PORTFOLIO":
      return (<svg {...common}><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>);
    case "EARLYLAND":
    case "LAUNCHPAD":
      return (<svg {...common}><path d="M12 3c3 2 4.5 5 4.5 8L12 15l-4.5-4c0-3 1.5-6 4.5-8Z" /><circle cx="12" cy="9" r="1.6" /><path d="M8 16l-2 4 4-2M16 16l2 4-4-2" /></svg>);
    case "CONTRIBUTION":
      return (<svg {...common}><path d="M12 3l2.5 2 3.4-.3.6 3.3L21 12l-2.5 3.9-.6 3.4-3.4-.3L12 21l-2.5-2-3.4.3-.6-3.4L3 12l2.5-3.9.6-3.3L9.5 5 12 3Z" /><path d="m9 12 2 2 4-4" /></svg>);
    case "SPECIAL":
      return (<svg {...common}><path d="M5 8l3 3 4-6 4 6 3-3-1.5 10h-11L5 8Z" /></svg>);
    default:
      return (<svg {...common}><path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8L12 4Z" /></svg>);
  }
};

interface Props {
  category: string;
  rarity?: string;
  size?: number;
  locked?: boolean;
}

/** Premium hexagon badge patch — rarity colour + category glyph. */
const BadgeVisual: FC<Props> = ({ category, rarity = "common", size = 56, locked = false }) => {
  const grad = locked ? "linear-gradient(145deg,#E2E8F0 0%,#CBD5E1 100%)" : RARITY_GRADIENT[rarity] || RARITY_GRADIENT.common;
  const glow = locked ? "rgba(148,163,184,0.25)" : RARITY_GLOW[rarity] || RARITY_GLOW.common;
  const inner = Math.round(size * 0.86);
  return (
    <span style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", filter: `drop-shadow(0 6px 10px ${glow})` }}>
      {/* outer rim */}
      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,#ffffff,#dfe6f0)", clipPath: HEX }} />
      {/* colored face */}
      <span style={{ position: "absolute", width: inner, height: inner, background: grad, clipPath: HEX }} />
      {/* gloss */}
      <span style={{ position: "absolute", width: inner, height: inner, clipPath: HEX, background: "linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0) 55%)" }} />
      {/* glyph */}
      <span style={{ position: "relative", display: "inline-flex", opacity: locked ? 0.75 : 1 }}>
        {locked ? (
          <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        ) : (
          glyph(category, Math.round(size * 0.42))
        )}
      </span>
    </span>
  );
};

export default BadgeVisual;

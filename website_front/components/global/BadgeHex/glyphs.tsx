import React from "react";

/**
 * Unified FOMO badge glyph library (website mirror of the CRM set).
 * House style: crisp white line-art glyph on a blue hexagon.
 * Keep in sync with /app/frontend/src/pages/AdminRating/badgeGlyphs.tsx
 */
export const BADGE_GLYPHS: Record<string, React.ReactNode> = {
  trophy: (<><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" /><path d="M10 14.5V17M14 14.5V17M8 20h8M9 20v-1a3 3 0 0 1 6 0v1" /></>),
  medal: (<><path d="M8 3 6 8M16 3l2 5" /><circle cx="12" cy="15" r="5" /><path d="M11 15.5l1 1 1.5-2" /></>),
  crown: (<><path d="M4 8l3 9h10l3-9-5 4-3-6-3 6-5-4Z" /><path d="M4 20h16" /></>),
  star: (<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />),
  rocket: (<><path d="M12 3c3 2.5 4.5 6 4.5 9L12 15l-4.5-3c0-3 1.5-6.5 4.5-9Z" /><circle cx="12" cy="9" r="1.6" /><path d="M8 15l-2 4 4-1.5M16 15l2 4-4-1.5" /></>),
  diamond: (<><path d="M6 4h12l3 5-9 11L3 9l3-5Z" /><path d="M3 9h18M9 4l-3 5 6 11M15 4l3 5-6 11" /></>),
  gem: (<><path d="M12 3l7 6-7 12L5 9l7-6Z" /><path d="M5 9h14M12 3v18" /></>),
  shield: (<><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>),
  fire: (<path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 1-1.5 1-3 2 2 3 4 3 6a6 6 0 0 1-12 0c0-4 4-5 6-10Z" />),
  bolt: (<path d="M13 3 5 13h6l-1 8 8-11h-6l1-7Z" />),
  target: (<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" fill="#fff" /></>),
  flag: (<><path d="M6 3v18" /><path d="M6 4h11l-2 3 2 3H6" /></>),
  compass: (<><circle cx="12" cy="12" r="9" /><path d="m15 9-2 5-4 1 2-5 4-1Z" /></>),
  telescope: (<><path d="m3 15 5-9 4 2-5 9-4-2ZM12 8l5-3 2 3-5 3" /><path d="M9 16v4M7 20h4" /></>),
  planet: (<><circle cx="11" cy="11" r="6" /><path d="M4 16c6 4 14 0 15-6" /></>),
  moon: (<path d="M20 14a8 8 0 1 1-9-11 6 6 0 0 0 9 11Z" />),
  sparkles: (<><path d="M12 4l1.5 4L18 9.5 13.5 11 12 15l-1.5-4L6 9.5 10.5 8 12 4Z" /><path d="M18 15l.8 2 2 .8-2 .8L18 21l-.8-2-2-.8 2-.8.8-2Z" /></>),
  coins: (<><ellipse cx="9" cy="7" rx="5" ry="2.5" /><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7" /><ellipse cx="15" cy="15" rx="5" ry="2.5" /><path d="M10 15v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4" /></>),
  wallet: (<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 9h18M16 13h2" /></>),
  chart: (<><path d="M4 4v16h16" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></>),
  trending: (<path d="M3 17l6-6 4 4 8-8M21 7v5h-5" />),
  handshake: (<><path d="m3 12 4-4 4 3 2-2 4 4M3 12l3 3M13 9l4 4-2 2-3-3" /></>),
  users: (<><circle cx="9" cy="8" r="3" /><path d="M4 20a5 5 0 0 1 10 0M16 6a3 3 0 0 1 0 6M20 20a5 5 0 0 0-3-4.6" /></>),
  userCheck: (<><circle cx="10" cy="8" r="3.2" /><path d="M4 20a6 6 0 0 1 12 0M16 12l2 2 4-4" /></>),
  book: (<><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" /><path d="M5 18a2 2 0 0 1 2-2h11" /></>),
  pen: (<><path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z" /><path d="m14 7 3 3" /></>),
  image: (<><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="9" cy="9" r="1.6" /><path d="m5 17 4.5-4.5a2 2 0 0 1 2.8 0L19 19" /></>),
  camera: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l2-3h4l2 3" /><circle cx="12" cy="13.5" r="3.5" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>),
  heart: (<path d="M12 20s-7-4.4-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.6 12 20 12 20Z" />),
  key: (<><circle cx="8" cy="8" r="4" /><path d="m11 11 8 8M16 16l2-2M18 18l2-2" /></>),
  lock: (<><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  clock: (<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>),
  checkCircle: (<><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>),
  award: (<><circle cx="12" cy="9" r="5" /><path d="m9 13-2 8 5-3 5 3-2-8" /><path d="m10 9 1.4 1.4L14 8" /></>),
  atom: (<><circle cx="12" cy="12" r="1.6" fill="#fff" /><ellipse cx="12" cy="12" rx="9" ry="4" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)" /></>),
  leaf: (<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14ZM5 19c3-5 7-7 11-8" />),
  anchor: (<><circle cx="12" cy="5" r="2.5" /><path d="M12 7.5V21M5 13a7 7 0 0 0 14 0M8 11H5v2M16 11h3v2" /></>),
  crosshair: (<><circle cx="12" cy="12" r="8" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>),
  gift: (<><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M4 13h16M12 9v11M8.5 9C6 9 6 5.5 8.5 5.5S12 9 12 9M15.5 9C18 9 18 5.5 15.5 5.5S12 9 12 9" /></>),
};

export const BADGE_GLYPH_KEYS: string[] = Object.keys(BADGE_GLYPHS);

export const LEGACY_ICON_ALIAS: Record<string, string> = {
  nova: "star", nebula: "sparkles", pulsar: "bolt", quasar: "atom",
  supernova: "fire", galaxy: "planet", cosmos: "crown",
  "P2P Pro": "handshake", "Market Maker": "chart", "Hot Streak": "fire",
  "XP Pioneer": "rocket", "Onboarding Master": "checkCircle",
  "Community Star": "users", Singularity: "diamond",
  "Project Reviewer": "shield", "Top Predictor": "target",
};

export const resolveGlyphKey = (icon?: string): string | null => {
  const key = (icon || "").trim();
  if (!key) return null;
  if (BADGE_GLYPHS[key]) return key;
  if (LEGACY_ICON_ALIAS[key] && BADGE_GLYPHS[LEGACY_ICON_ALIAS[key]]) return LEGACY_ICON_ALIAS[key];
  return null;
};

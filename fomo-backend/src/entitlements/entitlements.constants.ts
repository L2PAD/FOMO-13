/**
 * FOMO Monetization Core — Capability Registry (system catalog).
 * Capabilities are the atoms the AccessResolver checks. Plans/NFT/grants grant
 * ENTITLEMENTS to capabilities; resources require capabilities. Never gate on a
 * raw plan code or a single `isPremium` flag.
 */

export interface CapabilityDef {
  key: string;
  name: string;
  domain: string;
  description?: string;
}

// domain groups capabilities for the CRM capability matrix.
export const CAPABILITY_REGISTRY: CapabilityDef[] = [
  { key: "fomo_ai.membership", name: "FOMO AI Membership", domain: "fomo_ai", description: "Каноническое premium-право. Выдаётся подпиской, NFT-активацией или admin-грантом; открывает включённые в продукт capabilities." },
  { key: "earlyland.prime", name: "EarlyLand Prime", domain: "earlyland", description: "Доступ к Prime-контенту EarlyLand (review, task guide)." },
  { key: "parsing.access", name: "Parsing / XRank (Basic)", domain: "parsing", description: "Базовый доступ к парсингу." },
  { key: "parsing.advanced", name: "Parsing Advanced", domain: "parsing", description: "Расширенный парсинг / custom." },
  { key: "xrank.access", name: "XRank", domain: "parsing", description: "XRank аналитика." },
  { key: "fomo_ai.access", name: "FOMO AI", domain: "fomo_ai", description: "Доступ к FOMO AI (базовые запросы)." },
  { key: "fomo_ai.deep_research", name: "FOMO AI Deep Research", domain: "fomo_ai", description: "Глубокие исследования." },
  { key: "fomo_ai.portfolio_analysis", name: "FOMO AI Portfolio", domain: "fomo_ai", description: "Анализ портфеля." },
  { key: "blockcore.access", name: "BlockCore", domain: "blockcore", description: "Доступ к BlockCore." },
  { key: "launchpad.view", name: "Launchpad View", domain: "launchpad", description: "Просмотр Launchpad (не инвестиции)." },
  { key: "launchpad.analytics", name: "Launchpad Analytics", domain: "launchpad", description: "Аналитика Launchpad." },
  { key: "launchpad.invest", name: "Launchpad Invest", domain: "launchpad", description: "Eligibility решает существующий NFT/staking engine, НЕ подписка." },
  { key: "spaceport.view", name: "SpacePort View", domain: "spaceport", description: "Просмотр SpacePort." },
  { key: "spaceport.stake", name: "SpacePort Stake", domain: "spaceport", description: "Staking решает существующий NFT engine, НЕ подписка." },
  { key: "fomies.private", name: "FOMIES Private", domain: "fomies", description: "Приватный FOMIES." },
  { key: "fomo_intel.access", name: "FOMO Intel", domain: "fomo_intel", description: "Integration boundary — billing остаётся внутри FOMO Intel." },
];

export const CAPABILITY_KEYS = CAPABILITY_REGISTRY.map((c) => c.key);

// B4: capability access types.
//  ACCESS_ONLY          -> gated purely by entitlement (subscription/grant/NFT)
//  EXTERNAL_ELIGIBILITY -> real gate owned by an existing engine (NFT/staking); never emulated
//  HYBRID               -> access layer (entitlement) + external eligibility both required
export type CapabilityAccessType = "ACCESS_ONLY" | "EXTERNAL_ELIGIBILITY" | "HYBRID";

export const CAPABILITY_ACCESS_TYPE: Record<string, CapabilityAccessType> = {
  "launchpad.invest": "HYBRID",
  "spaceport.stake": "EXTERNAL_ELIGIBILITY",
};
export const CAPABILITY_ELIGIBILITY_PROVIDER: Record<string, string> = {
  "launchpad.invest": "launchpad",
  "spaceport.stake": "spaceport",
};
export function accessTypeOf(key: string): CapabilityAccessType {
  return CAPABILITY_ACCESS_TYPE[key] || "ACCESS_ONLY";
}

// Capabilities whose real gating is owned by an existing engine (resolver reports
// requirements but must NOT emulate them).
export const EXTERNAL_ELIGIBILITY_CAPABILITIES = new Set([
  "launchpad.invest",
  "spaceport.stake",
]);

// FOMO Intel keeps its own billing; resolver only reflects a boundary decision.
export const BILLING_BOUNDARY_CAPABILITIES = new Set(["fomo_intel.access"]);

// ── Phase G: Unified FOMO Access Engine ──
// The single canonical premium right. Every premium ACCESS_ONLY capability is
// unlocked by an ACTIVE membership entitlement whose product includes it.
export const MEMBERSHIP_CAPABILITY_KEY = "fomo_ai.membership";

// Fallback set of capabilities the FOMO AI Membership unlocks, used when the
// active FOMO_AI product config does not (yet) enumerate them. External/HYBRID
// capabilities (launchpad.invest, spaceport.stake) are intentionally EXCLUDED —
// their real eligibility stays with the existing NFT/staking engine.
export const DEFAULT_MEMBERSHIP_CAPABILITIES = new Set<string>([
  "earlyland.prime",
  "parsing.access",
  "parsing.advanced",
  "xrank.access",
  "fomo_ai.access",
  "fomo_ai.deep_research",
  "fomo_ai.portfolio_analysis",
  "fomies.private",
  "blockcore.access",
]);

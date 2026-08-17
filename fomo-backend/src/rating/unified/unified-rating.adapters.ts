/**
 * Field-mapping adapters: REAL platform entity documents -> Unified engine inputs.
 *
 * Purpose (per rework round 3): the unified rating must be computed from the
 * ACTUAL Fund/Person/User entities, not from hand-typed abstract numbers.
 * Where a real field exists we map it deterministically; where the platform
 * does not (yet) store a signal we return `undefined` so the engine reports it
 * through `missingFields` / lowered `completeness` instead of inventing a value.
 *
 * These are PURE functions (no DB, no side effects) so they are unit-testable.
 * A per-document `ratingInputsV2` override always wins (manual curation escape
 * hatch) — handled by the recalculation service before these run.
 */
import {
  FundInput,
  PersonInput,
  ProjectInput,
  UserInput,
} from "./unified-rating.types";

/* --------------------------- small helpers --------------------------- */

const numOrUndef = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const countOf = (value: any): number | undefined => {
  if (Array.isArray(value)) return value.length;
  return numOrUndef(value);
};

/** Months between a date-ish value and now (undefined when unparseable). */
export const monthsSince = (value: any): number | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44)));
};

/* ----------------------- jurisdiction -> compliance ------------------- */
/**
 * Maps a country/jurisdiction string to the spec's compliance category points:
 *   high-regulation (US/UK/EU & peers) = 15, mid = 10, offshore/unregulated = 0.
 * Returns `undefined` for unknown values so it surfaces as a missing field
 * rather than a fabricated score.
 */
const HIGH_REG = new Set([
  "united states", "usa", "us", "u.s.", "u.s.a.",
  "united kingdom", "uk", "great britain", "england",
  "germany", "france", "netherlands", "ireland", "spain", "italy",
  "sweden", "finland", "denmark", "belgium", "austria", "portugal",
  "luxembourg", "poland", "czech republic", "czechia", "greece",
  "switzerland", "singapore", "japan", "canada", "australia",
  "new zealand", "norway", "south korea", "korea",
]);

const MID_REG = new Set([
  "uae", "united arab emirates", "hong kong", "estonia", "lithuania",
  "latvia", "malta", "gibraltar", "cyprus", "liechtenstein", "israel",
  "brazil", "india", "turkey", "georgia", "kazakhstan", "thailand",
]);

const OFFSHORE = new Set([
  "british virgin islands", "bvi", "cayman islands", "cayman",
  "seychelles", "panama", "belize", "marshall islands", "bahamas",
  "bermuda", "vanuatu", "saint kitts and nevis", "st kitts and nevis",
  "curacao", "mauritius", "samoa", "anguilla",
]);

export const jurisdictionCompliance = (
  country: any
): number | undefined => {
  const key = String(country || "").trim().toLowerCase();
  if (!key) return undefined;
  if (HIGH_REG.has(key)) return 15;
  if (MID_REG.has(key)) return 10;
  if (OFFSHORE.has(key)) return 0;
  return undefined; // unknown -> missing field, not an invented number
};

/* ------------------------------- fund -------------------------------- */

export function mapFundDoc(doc: any): FundInput {
  const d = doc || {};
  return {
    monthsActive:
      numOrUndef(d.monthsActive) ??
      monthsSince(d.foundedDate || d.establishedAt || d.foundedAt),
    majorDeals:
      numOrUndef(d.majorDeals) ??
      numOrUndef(d.numberOfInvestments) ??
      countOf(d.leadInvestments) ??
      countOf(d.investments),
    successfulExits:
      numOrUndef(d.successfulExits) ?? countOf(d.recentExits),
    // averageRoi is stored as a multiple (x). Left undefined when absent.
    avgRoiMultiple: numOrUndef(d.avgRoiMultiple) ?? numOrUndef(d.averageRoi),
    // Not tracked on the entity yet -> surfaces as a missing field.
    crisesSurvived: numOrUndef(d.crisesSurvived),
    complianceScore:
      numOrUndef(d.complianceScore) ??
      jurisdictionCompliance(d.country || d.jurisdiction),
  };
}

/* ------------------------------ person ------------------------------- */

export function mapPersonDoc(doc: any): PersonInput {
  const d = doc || {};
  return {
    investingSuccess: numOrUndef(d.investingSuccess) ?? numOrUndef(d.roi),
    advisorSuccess:
      numOrUndef(d.advisorSuccess) ?? numOrUndef(d.advisorScore),
    // Reuse the already-computed platform Twitter sub-score when present.
    twitter: numOrUndef(d.twitterScore) ?? d.twitterInputs,
    marketExperience:
      numOrUndef(d.marketExperience) ?? monthsSince(d.careerStartedAt),
    projectActivity:
      numOrUndef(d.projectActivity) ??
      numOrUndef(d.tableSupportedProjectsCount) ??
      countOf(d.projectSupported),
    mediaActivity: numOrUndef(d.mediaActivity),
    marketInfluence: numOrUndef(d.marketInfluence),
    partnerships: numOrUndef(d.partnerships) ?? countOf(d.partners),
  };
}

/* ------------------------------ project ------------------------------ */
/**
 * Canonical projects do not (yet) persist the granular sub-signals (team,
 * tokenomics, niche, ...) as flat fields — those need a dedicated aggregation
 * pipeline. We map what exists; the rest returns undefined -> missingFields,
 * so the admin sees data gaps rather than fabricated scores.
 */
export function mapProjectDoc(doc: any): ProjectInput {
  const d = doc || {};
  return {
    fundsQuality: numOrUndef(d.fundsQuality),
    personsQuality: numOrUndef(d.personsQuality),
    developmentTeam: numOrUndef(d.developmentTeam),
    tokenomics: numOrUndef(d.tokenomics),
    niche: numOrUndef(d.niche),
    geography:
      numOrUndef(d.geography) ?? jurisdictionCompliance(d.country),
    competitors: numOrUndef(d.competitors),
    twitter: numOrUndef(d.twitterScore) ?? d.twitterInputs,
    redFlags: Array.isArray(d.redFlags)
      ? d.redFlags
      : numOrUndef(d.redFlagsCount) ?? numOrUndef(d.redFlags),
  };
}

/* ------------------------------- user -------------------------------- */

export function mapUserDoc(doc: any): UserInput {
  const d = doc || {};
  const nftCount = countOf(d.nfts) ?? numOrUndef(d.nftsValue) ?? 0;
  return {
    // Single global XP -> XP Reputation.
    activityXP: numOrUndef(d.activityXP) ?? 0,
    // OTC/P2P stats aggregated from the trades domain (pre-aggregated snapshots when present).
    otc: d.otcStats || d.otc || {},
    p2p: d.p2pStats || d.p2p || {},
    // Launchpad reputation source not wired yet -> undefined so the component is MISSING (not 0).
    launchpad: d.launchpadReputation ?? d.launchpad ?? null,
    // NFT / Subscription ENTITLEMENT (not staking days — staking already grants XP).
    nftSubscription: d.nftSubscription ?? {
      hasNft: Number(nftCount) > 0,
      nftCount: Number(nftCount) || 0,
      tier: d.nftTier || d.subscriptionTier || "basic",
      membershipDays: numOrUndef(d.membershipDays) ?? 0,
      subscriptionActive: !!d.subscriptionActive,
      subscriptionMonths: numOrUndef(d.subscriptionMonths) ?? 0,
    },
    redFlags: numOrUndef(d.redFlags) ?? countOf(d.redFlagsList) ?? 0,
  };
}

export function mapEntityDoc(entityType: string, doc: any): any {
  switch (entityType) {
    case "funds":
      return mapFundDoc(doc);
    case "persons":
      return mapPersonDoc(doc);
    case "projects":
      return mapProjectDoc(doc);
    case "users":
      return mapUserDoc(doc);
    default:
      return {};
  }
}

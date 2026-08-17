/**
 * CONTRACT-FIRST raw rating inputs (integration-ready).
 *
 * These DTOs describe the RAW SIGNALS the rating engine expects from external
 * sources (parser, portfolio DB, EarlyLand, NFT indexer, OTC/P2P ledger, user
 * analytics). They intentionally contain RAW facts, never pre-baked abstract
 * scores like 70/100. A source fills a DTO, the normalizer turns it into engine
 * input + provenance, and the formula engine produces the score.
 *
 * Nothing here talks to Mongo/Twitter/etc. Real providers implement the
 * `providers` interfaces and return these DTOs; the formulas never change.
 */

export const RATING_SCHEMA_VERSION = 1;

export const RATING_ENTITY_TYPES = [
  "funds",
  "persons",
  "projects",
  "twitter",
  "users",
  "trade",
] as const;
export type RatingEntityType = (typeof RATING_ENTITY_TYPES)[number];

/** Envelope every ingestion / provider payload is wrapped in. */
export interface RatingInputEnvelope<T = any> {
  /** Logical source id, e.g. "twitter-parser", "portfolio-db", "admin-preview", "mock". */
  source: string;
  sourceVersion?: string;
  /** When the underlying data was observed (ISO). Drives freshness/stale. */
  observedAt?: string;
  /** De-dup / replay-safety key, e.g. "twitter:acc-123:2026-08-06". */
  idempotencyKey?: string;
  /** DTO schema version this payload conforms to. */
  schemaVersion?: number;
  payload: T;
}

/* ------------------------------- FUND -------------------------------- */
export interface FundRawRatingInput {
  fundId?: string;
  foundedAt?: string;
  investments?: Array<{
    projectId?: string;
    roundSizeUsd?: number;
    investedAmountUsd?: number;
    stage?: "pre_seed" | "seed" | "private" | "series_a" | "later";
    role?: "lead" | "co_lead" | "participant";
    verified?: boolean;
    projectScore?: number;
    resultRoi?: number;
  }>;
  exits?: Array<{
    projectId?: string;
    type?: "token_sale" | "secondary" | "acquisition" | "equity_sale";
    realisedRoi?: number;
    verified?: boolean;
    occurredAt?: string;
  }>;
  portfolioReturns?: Array<{
    projectId?: string;
    realisedRoi?: number;
    unrealisedRoi?: number;
    verified?: boolean;
  }>;
  crisisEvidence?: Array<{
    crisisId: string;
    operationalContinuity?: number;
    portfolioSurvival?: number;
    noCriticalDefaults?: number;
    continuedActivity?: number;
    reputationStability?: number;
    evidenceIds?: string[];
  }>;
  jurisdictionCode?: string;
  licenseIds?: string[];
  legalEntityDisclosed?: boolean;
  beneficiaryTransparency?: boolean;
  regulatoryIncidents?: number;
}

/* ------------------------------ TWITTER ------------------------------ */
export interface TwitterRawRatingInput {
  accountId?: string;
  followers?: number;
  following?: number;
  accountCreatedAt?: string;
  verified?: boolean;
  posts?: Array<{
    postedAt: string;
    likes?: number;
    reposts?: number;
    replies?: number;
    views?: number;
    uniqueEngagers?: number;
    spamProbability?: number;
  }>;
  audienceSample?: Array<{
    accountId?: string;
    accountAgeDays?: number;
    postCount?: number;
    followers?: number;
    following?: number;
    hasAvatar?: boolean;
    isRatedEntity?: boolean;
    ratedEntityScore?: number;
    cryptoRelevance?: number;
    geoCode?: string;
    suspiciousProbability?: number;
  }>;
  suspensions?: number;
  scamAssociations?: number;
  handleChanges?: number;
  mentionsByPersons?: number;
  mentionsByFunds?: number;
  mentionsByProjects?: number;
  collaborations?: number;
  networkCentrality?: number;
  priorityGeoCodes?: string[];
}

/* ------------------------------- USER -------------------------------- */
export interface UserRawRatingInput {
  activeDays30?: number;
  meaningfulSessions30?: number;
  viewedEntities30?: number;
  returnDays30?: number;
  savedEntities?: number;
  followedEntities?: number;

  comments?: number;
  validComments?: number;
  reactions?: number;
  externalShares?: number;
  saves?: number;
  discussionActions?: number;
  farmingSignals?: number;

  usefulReports?: number;
  acceptedDataCorrections?: number;
  verifiedSources?: number;
  successfulModerations?: number;
  acceptedFeedback?: number;

  tasks?: Array<{
    taskId?: string;
    type?: string;
    basePoints?: number;
    difficulty?: number;
    verification?: number;
    quality?: number;
    campaignImportance?: number;
    fraudProbability?: number;
  }>;
  nfts?: Array<{
    nftId?: string;
    tier?: number;
    heldDays?: number;
    activeUtility?: number;
  }>;
  referrals?: {
    activeL1?: number;
    retainedL1?: number;
    activeL2?: number;
    qualityScore?: number;
    fraudCount?: number;
  };
  /** Optional inline trade signals (also ingestible via /trade). */
  trade?: TradeRawRatingInput;
}

/* ------------------------------ PERSON ------------------------------- */
export interface PersonRawRatingInput {
  personId?: string;
  careerStartedAt?: string;
  investments?: Array<{ projectId?: string; enteredAt?: string; entryPrice?: number; realisedRoi?: number; unrealisedRoi?: number; verified?: boolean }>;
  advisorRoles?: Array<{ projectId?: string; startedAt?: string; endedAt?: string; verified?: boolean; projectRoi?: number; projectAlive?: boolean; roleWeight?: number; milestonesHit?: number }>;
  projectRoles?: Array<{ projectId?: string; roleCode?: string; startedAt?: string; lastActivityAt?: string; active?: boolean; verified?: boolean; projectScore?: number }>;
  activityYears?: number[];
  mediaMentions?: Array<{ sourceId?: string; sourceTier?: 1 | 2 | 3; type?: "article" | "interview" | "podcast" | "conference"; publishedAt?: string; verified?: boolean }>;
  influenceMentions?: Array<{ byEntityType?: "fund" | "person" | "project"; byEntityScore?: number; crossPlatform?: boolean }>;
  marketReactionScore?: number;
  networkCentrality?: number;
  partnerships?: Array<{ kind?: string; rating?: number; strength?: number; recencyDays?: number; verified?: boolean; name?: string }>;
  twitterScore?: number;
}

/* ------------------------------ PROJECT ------------------------------ */
export interface ProjectRawRatingInput {
  projectId?: string;
  fundRelations?: Array<{ fundId?: string; stage?: string; leadRole?: boolean; investedAmountUsd?: number; roundSizeUsd?: number; fundScore?: number; verified?: boolean }>;
  personRelations?: Array<{ personId?: string; roleCode?: string; personScore?: number; verified?: boolean }>;
  teamMembers?: Array<{ identityVerified?: boolean; relevantYears?: number; previousProducts?: number; pastSuccess?: boolean; technical?: boolean; incident?: boolean }>;
  tokenomics?: {
    teamAllocationPct?: number; investorAllocationPct?: number; communityAllocationPct?: number;
    initialCirculationPct?: number; cliffMonths?: number; vestingMonths?: number;
    unlock30dPct?: number; unlock90dPct?: number; fdvUsd?: number; raisedUsd?: number; hasUtility?: boolean; demandScore?: number;
  };
  niche?: { marketGrowth?: number; investorInterest?: number; userDemand?: number; competitionSaturation?: number; regulatoryRisk?: number };
  jurisdictionCode?: string;
  legalTransparency?: number; teamLocationScore?: number; mainMarketScore?: number; sanctionsRisk?: number;
  competitorMetrics?: Array<{ valuationUsd?: number; traction?: number; product?: number; team?: number; fundingUsd?: number }>;
  ownValuationUsd?: number; ownTraction?: number; ownProduct?: number; ownTeam?: number; ownFundingUsd?: number;
  twitterScore?: number;
  redFlagEvidence?: Array<{ code?: string; reason?: string; sourceIds?: string[]; verificationStatus?: string; penalty?: number }>;
}

/* ------------------------------- TRADE ------------------------------- */
export interface TradeRawRatingInput {
  otcTrades?: TradeRecord[];
  p2pTrades?: TradeRecord[];
}
export interface TradeRecord {
  tradeId?: string;
  market?: "otc" | "p2p";
  settlementCurrency?: string;
  usdtEquivalentAtTrade?: number;
  completedAt?: string;
  counterpartyId?: string;
  review?: number;
  disputeStatus?: "none" | "open" | "resolved_ok" | "resolved_bad";
  valid?: boolean;
  selfTrade?: boolean;
}

/* ============================ VALIDATION ============================ */

export interface ValidationResult<T = any> {
  valid: boolean;
  errors: string[];
  envelope?: RatingInputEnvelope<T>;
}

const isObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);
const isNum = (v: any) => v === undefined || typeof v === "number";
const isIso = (v: any) => v === undefined || (typeof v === "string" && !Number.isNaN(Date.parse(v)));

/** Lightweight, dependency-free envelope + payload validation. */
export function validateRawEnvelope(
  entityType: string,
  body: any
): ValidationResult {
  const errors: string[] = [];
  if (!RATING_ENTITY_TYPES.includes(entityType as RatingEntityType))
    errors.push(`Unknown entityType "${entityType}"`);
  if (!isObj(body)) {
    return { valid: false, errors: ["body must be an object"] };
  }
  if (!body.source || typeof body.source !== "string")
    errors.push("source is required (string)");
  if (body.schemaVersion !== undefined && typeof body.schemaVersion !== "number")
    errors.push("schemaVersion must be a number");
  if (body.schemaVersion !== undefined && body.schemaVersion > RATING_SCHEMA_VERSION)
    errors.push(`schemaVersion ${body.schemaVersion} is newer than supported ${RATING_SCHEMA_VERSION}`);
  if (!isIso(body.observedAt)) errors.push("observedAt must be an ISO date string");
  if (!isObj(body.payload)) errors.push("payload must be an object");

  if (isObj(body.payload)) {
    const p = body.payload;
    switch (entityType) {
      case "twitter":
        if (!isNum(p.followers)) errors.push("payload.followers must be a number");
        if (p.posts !== undefined && !Array.isArray(p.posts)) errors.push("payload.posts must be an array");
        if (p.audienceSample !== undefined && !Array.isArray(p.audienceSample)) errors.push("payload.audienceSample must be an array");
        break;
      case "funds":
        if (p.foundedAt !== undefined && !isIso(p.foundedAt)) errors.push("payload.foundedAt must be ISO date");
        for (const k of ["investments", "exits", "portfolioReturns", "crisisEvidence"])
          if (p[k] !== undefined && !Array.isArray(p[k])) errors.push(`payload.${k} must be an array`);
        break;
      case "trade":
        if (p.otcTrades !== undefined && !Array.isArray(p.otcTrades)) errors.push("payload.otcTrades must be an array");
        if (p.p2pTrades !== undefined && !Array.isArray(p.p2pTrades)) errors.push("payload.p2pTrades must be an array");
        break;
      default:
        break;
    }
  }

  if (errors.length) return { valid: false, errors };
  return {
    valid: true,
    errors: [],
    envelope: {
      source: body.source,
      sourceVersion: body.sourceVersion,
      observedAt: body.observedAt,
      idempotencyKey: body.idempotencyKey,
      schemaVersion: body.schemaVersion ?? RATING_SCHEMA_VERSION,
      payload: body.payload,
    },
  };
}

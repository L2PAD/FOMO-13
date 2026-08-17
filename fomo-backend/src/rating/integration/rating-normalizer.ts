/**
 * DATA ADAPTER (pure): Raw DTO -> engine input.
 *
 *   Real source -> Data Provider -> Raw DTO -> [normalizer] -> engine input -> engine
 *
 * The normalizer only computes intermediate RAW SIGNALS the sub-formulas expect
 * (counts, ratios, medians, per-crisis behaviour, ...). It never invents an
 * abstract 70/100. Missing raw facts stay `undefined` so the engine surfaces
 * them via completeness / missingFields, and provenance marks them `missing`.
 */
import {
  FundRawRatingInput,
  ProjectRawRatingInput,
  PersonRawRatingInput,
  TradeRawRatingInput,
  TwitterRawRatingInput,
  UserRawRatingInput,
} from "./rating-raw-dto";

export interface ReferenceData {
  /** jurisdiction code (lower) -> base score 0..15 */
  jurisdictions?: Record<string, number>;
  /** enabled crisis id -> { startDate, endDate } */
  crises?: Record<string, { startDate?: string; endDate?: string; enabled?: boolean }>;
}

export interface NormalizedInput {
  input: any;
  /** component key -> whether raw signals were present */
  present: Record<string, boolean>;
}

/* ------------------------------ helpers ------------------------------ */
const num = (v: any): number | undefined =>
  v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? undefined : Number(v);
const monthsSince = (v: any): number | undefined => {
  if (!v) return undefined;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return undefined;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24 * 30.44)));
};
const daysSince = (v: any): number | undefined => {
  if (!v) return undefined;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return undefined;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
};
const median = (arr: number[]): number | undefined => {
  const a = arr.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return undefined;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const hasArr = (v: any): v is any[] => Array.isArray(v) && v.length > 0;

/* ------------------------------- FUND -------------------------------- */
export function normalizeFund(p: FundRawRatingInput = {}, refs: ReferenceData = {}): NormalizedInput {
  const present: Record<string, boolean> = {};
  const input: any = {};

  input.longevity = num(p.foundedAt ? monthsSince(p.foundedAt) : undefined);
  present.longevity = input.longevity !== undefined;

  if (hasArr(p.investments)) {
    input.majorDeals = p.investments.map((iv) => ({ role: classifyDeal(iv), project: iv.projectId }));
    present.majorDeals = true;
  } else present.majorDeals = false;

  if (hasArr(p.exits)) {
    const verified = p.exits.filter((e) => e.verified !== false);
    const successful = verified.filter((e) => (num(e.realisedRoi) ?? 0) > 1);
    input.exits = {
      successfulCount: successful.length,
      successRatio: verified.length ? successful.length / verified.length : 0,
      medianRealisedRoi: median(successful.map((e) => num(e.realisedRoi) ?? 0)) ?? 0,
    };
    present.exits = true;
  } else present.exits = false;

  if (hasArr(p.portfolioReturns)) {
    const rets = p.portfolioReturns;
    const roiOf = (r: any) => num(r.realisedRoi) ?? num(r.unrealisedRoi);
    const known = rets.map(roiOf).filter((x): x is number => x !== undefined);
    const realised = rets.filter((r) => num(r.realisedRoi) !== undefined);
    input.roi = {
      medianRoi: median(known) ?? 0,
      profitableRatio: known.length ? known.filter((x) => x > 1).length / known.length : 0,
      realisedShare: rets.length ? realised.length / rets.length : 0,
    };
    present.roi = true;
  } else present.roi = false;

  // Resilience: only crises the fund actually lived through (founded before end)
  if (hasArr(p.crisisEvidence)) {
    const founded = p.foundedAt ? Date.parse(p.foundedAt) : NaN;
    const rows = p.crisisEvidence
      .filter((c) => {
        const ref = refs.crises?.[c.crisisId];
        if (refs.crises && !ref) return false; // unknown crisis id ignored
        if (ref && ref.enabled === false) return false;
        if (ref?.startDate && !Number.isNaN(founded)) {
          // founded AFTER crisis started -> did not live through it (skip, not zero)
          if (founded > Date.parse(ref.startDate)) return false;
        }
        return true;
      })
      .map((c) => ({
        name: c.crisisId,
        operationalContinuity: num(c.operationalContinuity),
        portfolioSurvival: num(c.portfolioSurvival),
        noCriticalDefaults: num(c.noCriticalDefaults),
        continuedActivity: num(c.continuedActivity),
        reputationStability: num(c.reputationStability),
      }));
    if (rows.length) {
      input.resilience = rows;
      present.resilience = true;
    } else present.resilience = false;
  } else present.resilience = false;

  // Compliance from jurisdictions directory + transparency flags
  const jcode = String(p.jurisdictionCode || "").toLowerCase();
  const jp = jcode && refs.jurisdictions ? refs.jurisdictions[jcode] : undefined;
  if (jp !== undefined || p.licenseIds || p.legalEntityDisclosed !== undefined || p.regulatoryIncidents !== undefined) {
    input.compliance = {
      jurisdictionPoints: jp,
      hasLicense: p.licenseIds ? p.licenseIds.length > 0 : undefined,
      legalEntityDisclosed: p.legalEntityDisclosed,
      beneficiaryTransparency: p.beneficiaryTransparency,
      noLegalIncidents: p.regulatoryIncidents !== undefined ? p.regulatoryIncidents === 0 : undefined,
    };
    present.compliance = jp !== undefined;
  } else present.compliance = false;

  return { input, present };
}

function classifyDeal(iv: FundRawRatingInput["investments"][number]): string {
  if (iv.verified === false) return "unconfirmed";
  const lead = iv.role === "lead" || iv.role === "co_lead";
  const big = (num(iv.roundSizeUsd) ?? 0) >= 20_000_000;
  const early = iv.stage === "pre_seed" || iv.stage === "seed";
  const good = (num(iv.projectScore) ?? 0) >= 70 || (num(iv.resultRoi) ?? 0) >= 2;
  if (lead && big) return "leadLargeRound";
  if (early && good) return "earlySuccessful";
  if (lead && good) return "majorLead";
  if (good) return "major";
  if (lead) return "significant";
  if ((num(iv.projectScore) ?? 0) >= 60) return "topProjectParticipant";
  return "confirmed";
}

/* ------------------------------ TWITTER ------------------------------ */
export function normalizeTwitter(p: TwitterRawRatingInput = {}): NormalizedInput {
  const present: Record<string, boolean> = {};
  const input: any = {};

  input.followers = num(p.followers);
  present.followers = input.followers !== undefined;

  if (hasArr(p.audienceSample)) {
    const s = p.audienceSample;
    const avg = (f: (x: any) => number | undefined) => {
      const v = s.map(f).filter((x): x is number => x !== undefined);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
    };
    const suspicious = avg((x) => num(x.suspiciousProbability)) ?? 0;
    input.quality = {
      realAccountRatio: 1 - suspicious,
      activeFollowerRatio: s.filter((x) => (num(x.postCount) ?? 0) > 0).length / s.length,
      topFollowerScore: (s.filter((x) => x.isRatedEntity).length / s.length) * 100,
      audienceRelevance: (avg((x) => num(x.cryptoRelevance)) ?? 0) * 100,
      suspiciousFollowerRatio: suspicious,
    };
    present.quality = true;
  } else present.quality = false;

  if (hasArr(p.posts)) {
    const posts = p.posts;
    const followers = input.followers || 0;
    const ers = posts.map((x) => ((num(x.likes) ?? 0) + (num(x.reposts) ?? 0) + (num(x.replies) ?? 0)) / Math.max(1, followers) * 100);
    const now = Date.now();
    const last30 = posts.filter((x) => now - Date.parse(x.postedAt) <= 30 * 864e5);
    const activeDays = new Set(last30.map((x) => new Date(x.postedAt).toISOString().slice(0, 10))).size;
    const lastPostDays = daysSince(posts.map((x) => x.postedAt).sort().slice(-1)[0]);
    const spam = posts.map((x) => num(x.spamProbability) ?? 0);
    const spamAvg = spam.length ? spam.reduce((a, b) => a + b, 0) / spam.length : 0;
    input.engagement = {
      medianEngagementRate: median(ers) ?? 0,
      uniqueEngagersRatio: (() => {
        const v = posts.map((x) => (num(x.uniqueEngagers) && num(x.views) ? num(x.uniqueEngagers)! / num(x.views)! : undefined)).filter((x): x is number => x !== undefined);
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
      })(),
      replyQuality: 60,
      shareRate: median(posts.map((x) => num(x.reposts) ?? 0)) ?? 0,
      engagementStability: ers.length ? Math.max(0, 100 - stddev(ers)) : 0,
    };
    input.frequency = {
      postsPer30Days: last30.length,
      activeDaysRatio: activeDays / 30,
      lastPostDays: lastPostDays ?? 999,
      consistency: activeDays ? Math.min(100, (activeDays / 30) * 100) : 0,
      spamRatio: spamAvg,
    };
    present.engagement = true;
    present.frequency = true;
  } else {
    present.engagement = false;
    present.frequency = false;
  }

  const ageMonths = monthsSince(p.accountCreatedAt);
  if (ageMonths !== undefined || p.verified !== undefined || p.suspensions !== undefined) {
    input.reputation = {
      accountAgeMonths: ageMonths,
      verified: p.verified,
      noSuspensions: p.suspensions !== undefined ? p.suspensions === 0 : undefined,
      noSpamPatterns: undefined,
      stableIdentity: p.handleChanges !== undefined ? p.handleChanges === 0 : undefined,
      noScamAssociations: p.scamAssociations !== undefined ? p.scamAssociations === 0 : undefined,
    };
    present.reputation = ageMonths !== undefined;
  } else present.reputation = false;

  if (p.mentionsByPersons !== undefined || p.mentionsByFunds !== undefined || p.mentionsByProjects !== undefined) {
    input.cryptoInfluence = {
      mentionsByRatedPersons: num(p.mentionsByPersons) ?? 0,
      mentionsByRatedFunds: num(p.mentionsByFunds) ?? 0,
      mentionsByRatedProjects: num(p.mentionsByProjects) ?? 0,
      crossNetworkCentrality: num(p.networkCentrality),
      collaborationScore: num(p.collaborations),
    };
    present.cryptoInfluence = true;
  } else present.cryptoInfluence = false;

  if (hasArr(p.audienceSample)) {
    const s = p.audienceSample;
    const prio = new Set((p.priorityGeoCodes || []).map((x) => x.toLowerCase()));
    input.tier1Audience = {
      ratedEntityFollowers: s.filter((x) => x.isRatedEntity).length,
      geoQuality: prio.size ? (s.filter((x) => prio.has(String(x.geoCode || "").toLowerCase())).length / s.length) * 100 : undefined,
      professionalAudience: (s.filter((x) => (num(x.ratedEntityScore) ?? 0) > 0).length / s.length) * 100,
      purchasingPower: undefined,
    };
    present.tier1Audience = true;
  } else present.tier1Audience = false;

  return { input, present };
}

function stddev(a: number[]): number {
  if (a.length < 2) return 0;
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length);
}

/* ------------------------------- USER -------------------------------- */
export function normalizeUser(p: UserRawRatingInput = {}): NormalizedInput {
  const present: Record<string, boolean> = {};
  const pa: any = {};

  const hasEng = [p.activeDays30, p.meaningfulSessions30, p.viewedEntities30, p.returnDays30, p.savedEntities, p.followedEntities].some((x) => x !== undefined);
  if (hasEng) {
    pa.platformEngagement = {
      activeDays: num(p.activeDays30),
      meaningfulSessions: num(p.meaningfulSessions30),
      entityConsumption: num(p.viewedEntities30),
      returnFrequency: p.returnDays30 !== undefined ? (num(p.returnDays30) ?? 0) / 30 : undefined,
      savedFollowed: (num(p.savedEntities) ?? 0) + (num(p.followedEntities) ?? 0),
    };
  }
  present.platformEngagement = hasEng;

  const hasContent = [p.validComments, p.comments, p.reactions, p.externalShares, p.saves, p.discussionActions].some((x) => x !== undefined);
  if (hasContent) {
    const totalActions = (num(p.validComments) ?? num(p.comments) ?? 0) + (num(p.reactions) ?? 0) + (num(p.externalShares) ?? 0);
    pa.contentInteraction = {
      validComments: num(p.validComments) ?? num(p.comments),
      reactions: num(p.reactions),
      shares: num(p.externalShares),
      saves: num(p.saves),
      discussions: num(p.discussionActions),
      farmingRatio: p.farmingSignals !== undefined ? (num(p.farmingSignals) ?? 0) / Math.max(1, totalActions) : 0,
    };
  }
  present.contentInteraction = hasContent;

  const hasContrib = [p.usefulReports, p.acceptedDataCorrections, p.verifiedSources, p.successfulModerations, p.acceptedFeedback].some((x) => x !== undefined);
  if (hasContrib) {
    pa.meaningfulContribution = {
      usefulReports: num(p.usefulReports),
      dataCorrections: num(p.acceptedDataCorrections),
      verifiedSources: num(p.verifiedSources),
      moderatedContributions: num(p.successfulModerations),
      acceptedFeedback: num(p.acceptedFeedback),
    };
  }
  present.meaningfulContribution = hasContrib;

  if (hasArr(p.tasks)) {
    pa.earlyland = {
      tasks: p.tasks.map((t) => ({
        base: num(t.basePoints),
        difficulty: num(t.difficulty),
        verification: num(t.verification),
        quality: num(t.quality),
        importance: num(t.campaignImportance),
        fraud: num(t.fraudProbability),
      })),
    };
    present.earlyland = true;
  } else present.earlyland = false;

  if (hasArr(p.nfts)) {
    const nfts = p.nfts;
    pa.nft = {
      owns: nfts.length > 0,
      holdingMonths: Math.max(...nfts.map((x) => (num(x.heldDays) ?? 0) / 30.44)),
      tier: Math.max(...nfts.map((x) => num(x.tier) ?? 0)),
      activeUse: (nfts.map((x) => num(x.activeUtility) ?? 0).reduce((a, b) => a + b, 0) / nfts.length),
    };
    present.nft = true;
  } else present.nft = false;

  if (p.referrals) {
    const r = p.referrals;
    pa.referrals = {
      activeL1: num(r.activeL1),
      activeL2: num(r.activeL2),
      retention: r.retainedL1 !== undefined && (num(r.activeL1) ?? 0) > 0 ? (num(r.retainedL1) ?? 0) / (num(r.activeL1) ?? 1) : undefined,
    };
    present.referrals = true;
  } else present.referrals = false;

  const input: any = { platformActivity: pa };
  if (p.trade) {
    const t = normalizeTrade(p.trade);
    input.otc = t.input.otc;
    input.p2p = t.input.p2p;
  }
  return { input, present };
}

/* ------------------------------- TRADE ------------------------------- */
export function normalizeTrade(p: TradeRawRatingInput = {}): NormalizedInput {
  const agg = (trades: any[] = []) => {
    const valid = trades.filter((t) => t.valid !== false && !t.selfTrade && t.disputeStatus !== "open");
    const volume = valid.reduce((s, t) => s + (num(t.usdtEquivalentAtTrade) ?? 0), 0);
    const reviews = valid.map((t) => num(t.review)).filter((x): x is number => x !== undefined);
    return {
      volume,
      completedTrades: valid.length,
      avgReview: reviews.length ? reviews.reduce((a, b) => a + b, 0) / reviews.length : 0,
      reviewCount: reviews.length,
      uniqueCounterparties: new Set(valid.map((t) => t.counterpartyId).filter(Boolean)).size,
      disputes: valid.filter((t) => t.disputeStatus === "resolved_bad").length,
    };
  };
  const present: Record<string, boolean> = {
    otc: hasArr(p.otcTrades),
    p2p: hasArr(p.p2pTrades),
  };
  return { input: { otc: agg(p.otcTrades), p2p: agg(p.p2pTrades) }, present };
}

/**
 * Person & Project are NO LONGER pass-through. They accept RAW FACTS and the
 * normalizer computes every Person/Project Score component (facts -> signals).
 * A future provider supplies facts only; it never needs to know FOMO formulas.
 */
export function normalizePerson(p: PersonRawRatingInput = {}): NormalizedInput {
  const present: Record<string, boolean> = {};
  const input: any = {};
  const clampPct = (n: number) => Math.max(0, Math.min(100, n));

  if (hasArr(p.investments)) {
    const known = p.investments.map((i) => num(i.realisedRoi) ?? num(i.unrealisedRoi)).filter((x): x is number => x !== undefined);
    const realised = p.investments.filter((i) => num(i.realisedRoi) !== undefined);
    input.investingSuccess = {
      medianRoi: median(known) ?? 0,
      profitableRatio: known.length ? known.filter((x) => x > 1).length / known.length : 0,
      realisedShare: p.investments.length ? realised.length / p.investments.length : 0,
      consistency: known.length ? clampPct(100 - stddev(known) * 10) : 0,
      dataConfidence: Math.min(100, p.investments.length * 20),
    };
    present.investingSuccess = true;
  } else present.investingSuccess = false;

  if (hasArr(p.advisorRoles)) {
    const v = p.advisorRoles.filter((r) => r.verified !== false);
    const success = v.filter((r) => (num(r.projectRoi) ?? 0) > 1 || r.projectAlive);
    input.advisorSuccess = {
      successfulProjectsRatio: v.length ? success.length / v.length : 0,
      medianProjectRoi: median(v.map((r) => num(r.projectRoi) ?? 0)) ?? 0,
      projectSurvivalRate: v.length ? v.filter((r) => r.projectAlive).length / v.length : 0,
      roleSignificance: (v.map((r) => num(r.roleWeight) ?? 0.6).reduce((a, b) => a + b, 0) / Math.max(1, v.length)) * 100,
      dataConfidence: Math.min(100, v.length * 25),
    };
    present.advisorSuccess = true;
  } else present.advisorSuccess = false;

  const years = p.careerStartedAt ? (monthsSince(p.careerStartedAt) ?? 0) / 12 : undefined;
  if (years !== undefined || hasArr(p.projectRoles)) {
    const roleVerified = (p.projectRoles || []).filter((r) => r.verified !== false);
    input.marketExperience = {
      yearsActive: years ?? 0,
      continuity: hasArr(p.activityYears) ? clampPct((p.activityYears!.length / Math.max(1, years ?? 1)) * 100) : hasArr(p.projectRoles) ? 70 : 0,
      marketCycles: years ? Math.min(100, Math.floor(years / 2) * 25) : 0,
      verifiedHistory: p.projectRoles && p.projectRoles.length ? (roleVerified.length / p.projectRoles.length) * 100 : 0,
    };
    present.marketExperience = years !== undefined;
  } else present.marketExperience = false;

  if (hasArr(p.projectRoles)) {
    const roles = p.projectRoles;
    const recency = daysSince(roles.map((r) => r.lastActivityAt).filter(Boolean).sort().slice(-1)[0]);
    input.projectActivity = {
      activeProjects: roles.filter((r) => r.active).length,
      roleSignificance: (roles.map((r) => ROLE_WEIGHTS[r.roleCode || ""] ?? 0.5).reduce((a, b) => a + b, 0) / roles.length) * 100,
      recencyDays: recency ?? 999,
      projectQuality: median(roles.map((r) => num(r.projectScore) ?? 0)) ?? 0,
    };
    present.projectActivity = true;
  } else present.projectActivity = false;

  if (hasArr(p.mediaMentions)) {
    const m = p.mediaMentions;
    const recency = daysSince(m.map((x) => x.publishedAt).filter(Boolean).sort().slice(-1)[0]);
    input.mediaActivity = {
      tier1Mentions: m.filter((x) => x.sourceTier === 1).length,
      industryMentions: m.filter((x) => x.sourceTier === 2).length,
      interviews: m.filter((x) => x.type === "interview" || x.type === "podcast").length,
      conferences: m.filter((x) => x.type === "conference").length,
      recencyDays: recency ?? 999,
    };
    present.mediaActivity = true;
  } else present.mediaActivity = false;

  if (hasArr(p.influenceMentions)) {
    const im = p.influenceMentions;
    input.marketInfluence = {
      mentionsByTopEntities: im.filter((x) => (num(x.byEntityScore) ?? 0) >= 70).length,
      followerNetworkQuality: (im.map((x) => num(x.byEntityScore) ?? 0).reduce((a, b) => a + b, 0) / im.length),
      marketReaction: num(p.marketReactionScore) ?? 0,
      crossPlatform: (im.filter((x) => x.crossPlatform).length / im.length) * 100,
      networkCentrality: num(p.networkCentrality) ?? 0,
    };
    present.marketInfluence = true;
  } else present.marketInfluence = false;

  if (hasArr(p.partnerships)) { input.partnerships = p.partnerships; present.partnerships = true; } else present.partnerships = false;
  if (p.twitterScore !== undefined) input.twitter = num(p.twitterScore);
  present.twitter = p.twitterScore !== undefined;
  return { input, present };
}

const ROLE_WEIGHTS: Record<string, number> = { founder: 1, core_team: 0.9, investor: 0.7, advisor: 0.6, ambassador: 0.3, mention: 0.1 };

export function normalizeProject(p: ProjectRawRatingInput = {}, refs: ReferenceData = {}): NormalizedInput {
  const present: Record<string, boolean> = {};
  const input: any = {};
  const clampPct = (n: number) => Math.max(0, Math.min(100, n));

  if (hasArr(p.fundRelations)) {
    input.fundsQuality = p.fundRelations.map((f) => ({
      score: num(f.fundScore) ?? 0,
      weight: (f.leadRole ? 1.5 : 1) * (f.stage === "seed" || f.stage === "pre_seed" ? 1.2 : 1),
    }));
    present.fundsQuality = true;
  } else present.fundsQuality = false;

  if (hasArr(p.personRelations)) {
    input.personsQuality = p.personRelations.map((pr) => ({ score: num(pr.personScore) ?? 0, weight: ROLE_WEIGHTS[pr.roleCode || ""] ?? 0.5 }));
    present.personsQuality = true;
  } else present.personsQuality = false;

  if (hasArr(p.teamMembers)) {
    const t = p.teamMembers;
    const pct = (f: (m: any) => boolean) => (t.filter(f).length / t.length) * 100;
    input.developmentTeam = {
      verifiedIdentities: pct((m) => !!m.identityVerified),
      relevantExperience: clampPct((t.map((m) => num(m.relevantYears) ?? 0).reduce((a, b) => a + b, 0) / t.length) * 12),
      previousProducts: clampPct((t.map((m) => num(m.previousProducts) ?? 0).reduce((a, b) => a + b, 0) / t.length) * 25),
      pastProjectSuccess: pct((m) => !!m.pastSuccess),
      technicalCompetence: pct((m) => !!m.technical),
      reputationIncidents: pct((m) => !!m.incident),
    };
    present.developmentTeam = true;
  } else present.developmentTeam = false;

  if (p.tokenomics) {
    const tk = p.tokenomics;
    const insiders = (num(tk.teamAllocationPct) ?? 0) + (num(tk.investorAllocationPct) ?? 0);
    input.tokenomics = {
      teamInvestorAllocationScore: clampPct(100 - insiders),
      initialCirculationScore: clampPct((num(tk.initialCirculationPct) ?? 0) * 5),
      vestingScore: clampPct((num(tk.cliffMonths) ?? 0) * 4 + (num(tk.vestingMonths) ?? 0) * 2),
      unlockPressureScore: clampPct(100 - (num(tk.unlock30dPct) ?? 0) * 2 - (num(tk.unlock90dPct) ?? 0)),
      fdvAdequacyScore: tk.fdvUsd && tk.raisedUsd ? clampPct((num(tk.raisedUsd)! / num(tk.fdvUsd)!) * 1000) : undefined,
      utilityDemandScore: tk.demandScore !== undefined ? num(tk.demandScore) : tk.hasUtility ? 60 : undefined,
    };
    present.tokenomics = true;
  } else present.tokenomics = false;

  if (p.niche) {
    input.niche = {
      marketGrowth: num(p.niche.marketGrowth),
      investorInterest: num(p.niche.investorInterest),
      userDemand: num(p.niche.userDemand),
      competitionSaturation: num(p.niche.competitionSaturation),
      regulatoryRisk: num(p.niche.regulatoryRisk),
    };
    present.niche = true;
  } else present.niche = false;

  const jcode = String(p.jurisdictionCode || "").toLowerCase();
  const jp = jcode && refs.jurisdictions ? refs.jurisdictions[jcode] : undefined;
  if (jp !== undefined || p.legalTransparency !== undefined || p.sanctionsRisk !== undefined) {
    input.geography = {
      jurisdictionScore: jp !== undefined ? (jp / 15) * 100 : undefined,
      legalTransparency: num(p.legalTransparency),
      teamLocationScore: num(p.teamLocationScore),
      mainMarketScore: num(p.mainMarketScore),
      sanctionsRisk: num(p.sanctionsRisk),
    };
    present.geography = jp !== undefined;
  } else present.geography = false;

  if (hasArr(p.competitorMetrics)) {
    const c = p.competitorMetrics;
    const avg = (f: (x: any) => number | undefined) => { const v = c.map(f).filter((x): x is number => x !== undefined); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined; };
    const rel = (own?: number, peer?: number) => (own !== undefined && peer ? clampPct((own / peer) * 50) : undefined);
    input.competitors = {
      relativeValuation: rel(num(p.ownValuationUsd), avg((x) => num(x.valuationUsd))),
      productDifferentiation: rel(num(p.ownProduct), avg((x) => num(x.product))),
      tractionComparison: rel(num(p.ownTraction), avg((x) => num(x.traction))),
      teamComparison: rel(num(p.ownTeam), avg((x) => num(x.team))),
      fundingComparison: rel(num(p.ownFundingUsd), avg((x) => num(x.fundingUsd))),
    };
    present.competitors = true;
  } else present.competitors = false;

  if (p.twitterScore !== undefined) input.twitter = num(p.twitterScore);
  present.twitter = p.twitterScore !== undefined;
  if (hasArr(p.redFlagEvidence)) { input.redFlags = p.redFlagEvidence; present.redFlags = true; } else present.redFlags = false;
  return { input, present };
}

export function normalizeByEntity(entityType: string, payload: any, refs: ReferenceData = {}): NormalizedInput {
  switch (entityType) {
    case "funds": return normalizeFund(payload, refs);
    case "twitter": return normalizeTwitter(payload);
    case "users": return normalizeUser(payload);
    case "trade": return normalizeTrade(payload);
    case "persons": return normalizePerson(payload);
    case "projects": return normalizeProject(payload, refs);
    default: return { input: {}, present: {} };
  }
}

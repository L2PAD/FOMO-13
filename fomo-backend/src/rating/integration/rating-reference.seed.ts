/**
 * Canonical SYSTEM DEFAULT seed for the rating reference directories.
 * These define STRUCTURE + agreed periods/tiers the formulas reference. They
 * are NOT fund-specific evidence: a fund is only credited for a crisis when it
 * actually provides evidence AND existed during that crisis.
 */
export const RATING_REFERENCE_SEED: Record<string, any[]> = {
  rating_crises: [
    { code: "crypto_winter_2018", name: "Crypto Winter 2018", type: "market", startDate: "2018-01-16", endDate: "2018-12-15", description: "Продолжительный медвежий рынок после ICO-пузыря.", scoringCriteria: "operationalContinuity, portfolioSurvival, noCriticalDefaults, continuedActivity, reputationStability" },
    { code: "covid_crash_2020", name: "COVID Crash 2020", type: "macro", startDate: "2020-03-01", endDate: "2020-04-30", description: "Резкий обвал на фоне пандемии (Black Thursday)." },
    { code: "terra_luna_2022", name: "Terra/Luna Collapse 2022", type: "protocol", startDate: "2022-05-07", endDate: "2022-05-20", description: "Депег UST и коллапс LUNA." },
    { code: "ftx_collapse_2022", name: "FTX Collapse 2022", type: "exchange", startDate: "2022-11-06", endDate: "2022-11-30", description: "Банкротство FTX и эффект заражения." },
    { code: "banking_stress_2023", name: "Banking Stress 2023", type: "macro", startDate: "2023-03-08", endDate: "2023-03-27", description: "SVB/Signature; депег USDC." },
  ],
  rating_jurisdictions: [
    { code: "us", countryName: "United States", regulationTier: "high", baseScore: 15, licenseRequired: true, sanctionsRisk: "low", transparencyModifier: 0 },
    { code: "uk", countryName: "United Kingdom", regulationTier: "high", baseScore: 15, licenseRequired: true, sanctionsRisk: "low", transparencyModifier: 0 },
    { code: "eu", countryName: "European Union", regulationTier: "high", baseScore: 15, licenseRequired: true, sanctionsRisk: "low", transparencyModifier: 0 },
    { code: "ch", countryName: "Switzerland", regulationTier: "high", baseScore: 15, licenseRequired: true, sanctionsRisk: "low", transparencyModifier: 0 },
    { code: "sg", countryName: "Singapore", regulationTier: "high", baseScore: 15, licenseRequired: true, sanctionsRisk: "low", transparencyModifier: 0 },
    { code: "ae", countryName: "UAE", regulationTier: "mid", baseScore: 10, licenseRequired: true, sanctionsRisk: "medium", transparencyModifier: 0 },
    { code: "hk", countryName: "Hong Kong", regulationTier: "mid", baseScore: 10, licenseRequired: true, sanctionsRisk: "medium", transparencyModifier: 0 },
    { code: "ky", countryName: "Cayman Islands", regulationTier: "offshore_transparent", baseScore: 5, licenseRequired: false, sanctionsRisk: "medium", transparencyModifier: 0 },
    { code: "bvi", countryName: "British Virgin Islands", regulationTier: "offshore", baseScore: 0, licenseRequired: false, sanctionsRisk: "high", transparencyModifier: 0 },
    { code: "sc", countryName: "Seychelles", regulationTier: "offshore", baseScore: 0, licenseRequired: false, sanctionsRisk: "high", transparencyModifier: 0 },
  ],
  rating_tier_registry: [
    { code: "tier1:example-fund", entityType: "fund", entityId: "example-fund", tier: 1, reason: "Системный пример — замените реальными entityId", status: "active", validFrom: null, validUntil: null, sourceIds: [] },
  ],
  rating_red_flag_catalog: [
    { code: "unverified_team", title: "Неподтверждённая команда", severity: "medium", defaultPenalty: 10, requiredEvidence: true, applicableTo: ["projects"], description: "Личности команды не подтверждены." },
    { code: "anonymous_founders", title: "Анонимные основатели", severity: "high", defaultPenalty: 15, requiredEvidence: true, applicableTo: ["projects", "persons"], description: "Основатели полностью анонимны." },
    { code: "suspicious_tokenomics", title: "Подозрительная токеномика", severity: "high", defaultPenalty: 15, requiredEvidence: true, applicableTo: ["projects"], description: "Непрозрачное распределение / большой анлок insiders." },
    { code: "scam_association", title: "Связь со скамом", severity: "critical", defaultPenalty: 25, requiredEvidence: true, applicableTo: ["projects", "persons"], description: "Подтверждённая связь с мошенническими проектами." },
    { code: "regulatory_action", title: "Регуляторное дело", severity: "high", defaultPenalty: 15, requiredEvidence: true, applicableTo: ["projects", "funds", "persons"], description: "Официальные регуляторные претензии." },
  ],
  rating_role_catalog: [
    { code: "founder", title: "Founder", weight: 1.0, applicableTo: ["persons"] },
    { code: "core_team", title: "Core team", weight: 0.9, applicableTo: ["persons"] },
    { code: "investor", title: "Investor", weight: 0.7, applicableTo: ["persons"] },
    { code: "advisor", title: "Advisor", weight: 0.6, applicableTo: ["persons"] },
    { code: "ambassador", title: "Ambassador", weight: 0.3, applicableTo: ["persons"] },
    { code: "mention", title: "Mention", weight: 0.1, applicableTo: ["persons"] },
  ],
  rating_partnership_types: [
    { code: "official_partnership", title: "Official partnership", rating: 1.0 },
    { code: "joint_product", title: "Joint product", rating: 0.9 },
    { code: "advisory_agreement", title: "Advisory agreement", rating: 0.7 },
    { code: "investment_link", title: "Investment link", rating: 0.8 },
    { code: "strategic", title: "Strategic cooperation", rating: 0.6 },
    { code: "mention_only", title: "Mention only (не считается)", rating: 0.0 },
  ],
  rating_media_source_tiers: [
    { code: "tier1", title: "Tier-1 media", weight: 1.0, examples: "Крупные отраслевые/деловые СМИ" },
    { code: "tier2", title: "Industry media", weight: 0.6, examples: "Отраслевые издания" },
    { code: "interview_podcast", title: "Interview / podcast", weight: 0.5 },
    { code: "conference", title: "Conference", weight: 0.4 },
    { code: "blog_social", title: "Blog / social", weight: 0.2 },
  ],
};

import {
  LaunchpadCanonicalProject,
  LaunchpadLaunchDetails,
  LaunchpadReadiness,
} from '../../components/services/fomoV2Launchpad';

export interface LaunchpadFaqFormItem {
  id: string;
  question: string;
  answer: string;
}

export interface LaunchpadInvestorFormItem {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
}

export interface LaunchpadTeamFormItem {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  website: string;
}

export interface LaunchpadDocumentFormItem {
  id: string;
  title: string;
  url: string;
  type: string;
}

export type LaunchpadDisplaySetting = 'default' | 'show' | 'hide';

/** Mirrors FomoV2LaunchpadDetailsDto so invalid editorial data is rejected before save. */
export const LAUNCHPAD_DETAILS_LIMITS = Object.freeze({
  title: 300,
  shortDescription: 1_000,
  longText: 50_000,
  saleType: 200,
  category: 200,
  url: 2_048,
  gallery: 20,
  zoneDescription: 10_000,
  participationRules: 100,
  participationRule: 2_000,
  faq: 100,
  faqQuestion: 500,
  faqAnswer: 10_000,
  documents: 50,
  documentTitle: 300,
  documentType: 100,
  investors: 100,
  investorName: 300,
  team: 100,
  teamName: 300,
  teamRole: 300,
  flags: 100,
  flag: 500,
  displayLabel: 300,
  tokenSymbol: 40,
});

export interface LaunchpadDetailsForm {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  saleType: string;
  category: string;
  logoUrl: string;
  bannerUrl: string;
  gallery: string[];
  about: string;
  problem: string;
  solution: string;
  tokenUtility: string;
  revenueModel: string;
  greenZoneDescription: string;
  yellowZoneDescription: string;
  redZoneDescription: string;
  participationRules: string[];
  faq: LaunchpadFaqFormItem[];
  investors: LaunchpadInvestorFormItem[];
  team: LaunchpadTeamFormItem[];
  documents: LaunchpadDocumentFormItem[];
  greenFlags: string[];
  yellowFlags: string[];
  redFlags: string[];
  fundingTotalRaisedLabel: string;
  fundingType: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: string;
  tokenPriceLabel: string;
  tokenAllocationLabel: string;
  showLeaderboard: LaunchpadDisplaySetting;
  showParticipants: LaunchpadDisplaySetting;
  showCountdown: LaunchpadDisplaySetting;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  whitepaper: string;
}

export type ResolvedValueSource = 'launch override' | 'canonical project' | 'missing';

export interface ResolvedLaunchpadIdentity {
  title: string;
  titleSource: ResolvedValueSource;
  logoUrl: string;
  logoSource: ResolvedValueSource;
  description: string;
  descriptionSource: ResolvedValueSource;
  website: string;
  websiteSource: ResolvedValueSource;
}

const clean = (value: unknown): string => String(value || '').trim();

const optional = (value: string): string | undefined => {
  const normalized = value.trim();
  return normalized || undefined;
};

const compactStrings = (values: string[]): string[] => values
  .map((value) => value.trim())
  .filter(Boolean);

export const launchpadMediaUrlsFromDetails = (
  details?: LaunchpadLaunchDetails,
): string[] => compactStrings([
  details?.logoUrl || '',
  details?.bannerUrl || '',
  ...(details?.gallery || []),
  ...(details?.investors || []).map((item) => item.logoUrl || ''),
  ...(details?.team || []).map((item) => item.avatarUrl || ''),
]);

export const launchpadMediaUrlsFromForm = (form: LaunchpadDetailsForm): string[] => (
  compactStrings([
    form.logoUrl,
    form.bannerUrl,
    ...form.gallery,
    ...form.investors.map((item) => item.logoUrl),
    ...form.team.map((item) => item.avatarUrl),
  ])
);

export const emptyLaunchpadDetailsForm = (): LaunchpadDetailsForm => ({
  slug: '',
  title: '',
  shortDescription: '',
  description: '',
  saleType: '',
  category: '',
  logoUrl: '',
  bannerUrl: '',
  gallery: [],
  about: '',
  problem: '',
  solution: '',
  tokenUtility: '',
  revenueModel: '',
  greenZoneDescription: '',
  yellowZoneDescription: '',
  redZoneDescription: '',
  participationRules: [],
  faq: [],
  investors: [],
  team: [],
  documents: [],
  greenFlags: [],
  yellowFlags: [],
  redFlags: [],
  fundingTotalRaisedLabel: '',
  fundingType: '',
  tokenName: '',
  tokenSymbol: '',
  tokenDecimals: '',
  tokenPriceLabel: '',
  tokenAllocationLabel: '',
  showLeaderboard: 'default',
  showParticipants: 'default',
  showCountdown: 'default',
  website: '',
  twitter: '',
  telegram: '',
  discord: '',
  whitepaper: '',
});

export const slugifyLaunchpad = (value: string): string => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 160);

const displaySettingFromBoolean = (value?: boolean): LaunchpadDisplaySetting => {
  if (value === true) return 'show';
  if (value === false) return 'hide';
  return 'default';
};

const booleanFromDisplaySetting = (value: LaunchpadDisplaySetting): boolean | undefined => {
  if (value === 'show') return true;
  if (value === 'hide') return false;
  return undefined;
};

const tokenDecimalsFromString = (value: string): number | undefined => {
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d{0,2})$/.test(normalized)) return undefined;
  const decimals = Number(normalized);
  return decimals <= 255 ? decimals : undefined;
};

export const launchpadDetailsToForm = (
  slug?: string,
  details?: LaunchpadLaunchDetails,
): LaunchpadDetailsForm => ({
  ...emptyLaunchpadDetailsForm(),
  slug: clean(slug),
  title: clean(details?.title),
  shortDescription: clean(details?.shortDescription),
  description: clean(details?.description),
  saleType: clean(details?.saleType),
  category: clean(details?.category),
  logoUrl: clean(details?.logoUrl),
  bannerUrl: clean(details?.bannerUrl),
  gallery: compactStrings(details?.gallery || []),
  about: clean(details?.about),
  problem: clean(details?.problem),
  solution: clean(details?.solution),
  tokenUtility: clean(details?.tokenUtility),
  revenueModel: clean(details?.revenueModel),
  greenZoneDescription: clean(details?.zoneDescriptions?.green),
  yellowZoneDescription: clean(details?.zoneDescriptions?.yellow),
  redZoneDescription: clean(details?.zoneDescriptions?.red),
  participationRules: compactStrings(details?.participationRules || []),
  faq: (details?.faq || [])
    .map((item, index) => ({
      id: `faq-${index}-${item.question.slice(0, 12)}`,
      question: clean(item.question),
      answer: clean(item.answer),
    }))
    .filter((item) => item.question || item.answer),
  investors: (details?.investors || []).map((item, index) => ({
    id: clean(item.id) || `investor-${index}-${item.name.slice(0, 12)}`,
    name: clean(item.name),
    logoUrl: clean(item.logoUrl),
    website: clean(item.website),
  })),
  team: (details?.team || []).map((item, index) => ({
    id: clean(item.id) || `team-${index}-${item.name.slice(0, 12)}`,
    name: clean(item.name),
    role: clean(item.role),
    avatarUrl: clean(item.avatarUrl),
    website: clean(item.website),
  })),
  documents: (details?.documents || []).map((item, index) => ({
    id: `document-${index}-${item.title.slice(0, 12)}`,
    title: clean(item.title),
    url: clean(item.url),
    type: clean(item.type),
  })),
  greenFlags: compactStrings(details?.analysisFlags?.green || []),
  yellowFlags: compactStrings(details?.analysisFlags?.yellow || []),
  redFlags: compactStrings(details?.analysisFlags?.red || []),
  fundingTotalRaisedLabel: clean(details?.funding?.totalRaisedLabel),
  fundingType: clean(details?.funding?.fundingType),
  tokenName: clean(details?.tokenDisplay?.name),
  tokenSymbol: clean(details?.tokenDisplay?.symbol),
  tokenDecimals: details?.tokenDisplay?.decimals === undefined
    ? ''
    : String(details.tokenDisplay.decimals),
  tokenPriceLabel: clean(details?.tokenDisplay?.priceLabel),
  tokenAllocationLabel: clean(details?.tokenDisplay?.allocationLabel),
  showLeaderboard: displaySettingFromBoolean(details?.flags?.showLeaderboard),
  showParticipants: displaySettingFromBoolean(details?.flags?.showParticipants),
  showCountdown: displaySettingFromBoolean(details?.flags?.showCountdown),
  website: clean(details?.links?.website),
  twitter: clean(details?.links?.twitter),
  telegram: clean(details?.links?.telegram),
  discord: clean(details?.links?.discord),
  whitepaper: clean(details?.links?.whitepaper),
});

export const launchpadDetailsFromForm = (
  form: LaunchpadDetailsForm,
): LaunchpadLaunchDetails => ({
  title: optional(form.title),
  shortDescription: optional(form.shortDescription),
  description: optional(form.description),
  saleType: optional(form.saleType),
  category: optional(form.category),
  logoUrl: optional(form.logoUrl),
  bannerUrl: optional(form.bannerUrl),
  gallery: compactStrings(form.gallery),
  about: optional(form.about),
  problem: optional(form.problem),
  solution: optional(form.solution),
  tokenUtility: optional(form.tokenUtility),
  revenueModel: optional(form.revenueModel),
  zoneDescriptions: {
    green: optional(form.greenZoneDescription),
    yellow: optional(form.yellowZoneDescription),
    red: optional(form.redZoneDescription),
  },
  participationRules: compactStrings(form.participationRules),
  faq: form.faq
    .map(({ question, answer }) => ({
      question: question.trim(),
      answer: answer.trim(),
    }))
    .filter((item) => item.question || item.answer),
  investors: form.investors
    .map((item) => ({
      id: optional(item.id),
      name: item.name.trim(),
      logoUrl: optional(item.logoUrl),
      website: optional(item.website),
    }))
    .filter((item) => item.name),
  team: form.team
    .map((item) => ({
      id: optional(item.id),
      name: item.name.trim(),
      role: optional(item.role),
      avatarUrl: optional(item.avatarUrl),
      website: optional(item.website),
    }))
    .filter((item) => item.name),
  documents: form.documents
    .map((item) => ({
      title: item.title.trim(),
      url: item.url.trim(),
      type: optional(item.type),
    }))
    .filter((item) => item.title && item.url),
  analysisFlags: {
    green: compactStrings(form.greenFlags),
    yellow: compactStrings(form.yellowFlags),
    red: compactStrings(form.redFlags),
  },
  funding: {
    totalRaisedLabel: optional(form.fundingTotalRaisedLabel),
    fundingType: optional(form.fundingType),
  },
  flags: {
    showLeaderboard: booleanFromDisplaySetting(form.showLeaderboard),
    showParticipants: booleanFromDisplaySetting(form.showParticipants),
    showCountdown: booleanFromDisplaySetting(form.showCountdown),
  },
  tokenDisplay: {
    name: optional(form.tokenName),
    symbol: optional(form.tokenSymbol),
    decimals: tokenDecimalsFromString(form.tokenDecimals),
    priceLabel: optional(form.tokenPriceLabel),
    allocationLabel: optional(form.tokenAllocationLabel),
  },
  links: {
    website: optional(form.website),
    twitter: optional(form.twitter),
    telegram: optional(form.telegram),
    discord: optional(form.discord),
    whitepaper: optional(form.whitepaper),
  },
});

const resolved = (
  override: string,
  canonical: string | undefined,
): { value: string; source: ResolvedValueSource } => {
  if (override.trim()) return { value: override.trim(), source: 'launch override' };
  if (clean(canonical)) return { value: clean(canonical), source: 'canonical project' };
  return { value: '', source: 'missing' };
};

export const resolveLaunchpadIdentity = (
  form: LaunchpadDetailsForm,
  canonical?: LaunchpadCanonicalProject,
): ResolvedLaunchpadIdentity => {
  const title = resolved(form.title, canonical?.name || canonical?.canonicalName);
  const logo = resolved(form.logoUrl, canonical?.logo);
  const description = resolved(
    form.description,
    canonical?.descriptionText,
  );
  const website = resolved(form.website, canonical?.website);
  return {
    title: title.value,
    titleSource: title.source,
    logoUrl: logo.value,
    logoSource: logo.source,
    description: description.value,
    descriptionSource: description.source,
    website: website.value,
    websiteSource: website.source,
  };
};

export const isLaunchpadUrl = (value: string): boolean => {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return /^\/(?!\/)\S+$/.test(value.trim());
  }
};

export const launchpadReadinessMessages = (readiness?: LaunchpadReadiness): string[] => (
  readiness?.issues?.map((issue) => (
    typeof issue === 'string' ? issue : issue.message
  )).filter(Boolean) || []
);

const launchpadDetailsLimitIssues = (form: LaunchpadDetailsForm): string[] => {
  const issues: string[] = [];
  const max = (value: string, limit: number, label: string) => {
    if (value.length > limit) issues.push(`${label} must not exceed ${limit} characters.`);
  };
  const count = (length: number, limit: number, label: string) => {
    if (length > limit) issues.push(`${label} supports at most ${limit} items.`);
  };

  max(form.title, LAUNCHPAD_DETAILS_LIMITS.title, 'Launch title');
  max(form.shortDescription, LAUNCHPAD_DETAILS_LIMITS.shortDescription, 'Short description');
  [
    ['Description', form.description],
    ['About', form.about],
    ['Problem', form.problem],
    ['Solution', form.solution],
    ['Token utility', form.tokenUtility],
    ['Revenue model', form.revenueModel],
  ].forEach(([label, value]) => max(value, LAUNCHPAD_DETAILS_LIMITS.longText, label));
  max(form.saleType, LAUNCHPAD_DETAILS_LIMITS.saleType, 'Sale type');
  max(form.category, LAUNCHPAD_DETAILS_LIMITS.category, 'Category');
  [form.logoUrl, form.bannerUrl, form.website, form.twitter, form.telegram, form.discord, form.whitepaper]
    .forEach((value) => max(value, LAUNCHPAD_DETAILS_LIMITS.url, 'URL'));
  [form.greenZoneDescription, form.yellowZoneDescription, form.redZoneDescription]
    .forEach((value) => max(value, LAUNCHPAD_DETAILS_LIMITS.zoneDescription, 'Zone description'));

  count(form.gallery.length, LAUNCHPAD_DETAILS_LIMITS.gallery, 'Gallery');
  form.gallery.forEach((value) => max(value, LAUNCHPAD_DETAILS_LIMITS.url, 'Gallery URL'));
  count(form.participationRules.length, LAUNCHPAD_DETAILS_LIMITS.participationRules, 'Participation rules');
  form.participationRules.forEach((value) => max(value, LAUNCHPAD_DETAILS_LIMITS.participationRule, 'Participation rule'));
  count(form.faq.length, LAUNCHPAD_DETAILS_LIMITS.faq, 'FAQ');
  form.faq.forEach((item) => {
    max(item.question, LAUNCHPAD_DETAILS_LIMITS.faqQuestion, 'FAQ question');
    max(item.answer, LAUNCHPAD_DETAILS_LIMITS.faqAnswer, 'FAQ answer');
  });
  count(form.documents.length, LAUNCHPAD_DETAILS_LIMITS.documents, 'Documents');
  form.documents.forEach((item) => {
    max(item.title, LAUNCHPAD_DETAILS_LIMITS.documentTitle, 'Document title');
    max(item.type, LAUNCHPAD_DETAILS_LIMITS.documentType, 'Document type');
    max(item.url, LAUNCHPAD_DETAILS_LIMITS.url, 'Document URL');
  });
  count(form.investors.length, LAUNCHPAD_DETAILS_LIMITS.investors, 'Investors');
  form.investors.forEach((item) => {
    max(item.id, 200, 'Investor id');
    max(item.name, LAUNCHPAD_DETAILS_LIMITS.investorName, 'Investor name');
    max(item.logoUrl, LAUNCHPAD_DETAILS_LIMITS.url, 'Investor logo URL');
    max(item.website, LAUNCHPAD_DETAILS_LIMITS.url, 'Investor website URL');
  });
  count(form.team.length, LAUNCHPAD_DETAILS_LIMITS.team, 'Team');
  form.team.forEach((item) => {
    max(item.id, 200, 'Team member id');
    max(item.name, LAUNCHPAD_DETAILS_LIMITS.teamName, 'Team member name');
    max(item.role, LAUNCHPAD_DETAILS_LIMITS.teamRole, 'Team member role');
    max(item.avatarUrl, LAUNCHPAD_DETAILS_LIMITS.url, 'Team avatar URL');
    max(item.website, LAUNCHPAD_DETAILS_LIMITS.url, 'Team website URL');
  });
  ([form.greenFlags, form.yellowFlags, form.redFlags] as string[][]).forEach((flags) => {
    count(flags.length, LAUNCHPAD_DETAILS_LIMITS.flags, 'Analysis flags');
    flags.forEach((value) => max(value, LAUNCHPAD_DETAILS_LIMITS.flag, 'Analysis flag'));
  });
  [
    ['Historic total raised label', form.fundingTotalRaisedLabel],
    ['Funding type', form.fundingType],
    ['Token display name', form.tokenName],
    ['Token price label', form.tokenPriceLabel],
    ['Token allocation label', form.tokenAllocationLabel],
  ].forEach(([label, value]) => max(value, LAUNCHPAD_DETAILS_LIMITS.displayLabel, label));
  max(form.tokenSymbol, LAUNCHPAD_DETAILS_LIMITS.tokenSymbol, 'Token display symbol');

  return issues;
};

export const validateLaunchpadDetails = (
  form: LaunchpadDetailsForm,
  canonical?: LaunchpadCanonicalProject,
): string[] => {
  const issues: string[] = launchpadDetailsLimitIssues(form);
  const identity = resolveLaunchpadIdentity(form, canonical);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
    issues.push('Launch slug must contain lowercase letters, numbers and single hyphens.');
  }
  if (!identity.title) issues.push('Project name or launch title is required.');
  if (!form.shortDescription.trim()) issues.push('Launch short description is required.');
  if (!identity.description) issues.push('Launch or canonical description is required.');
  if (!form.saleType.trim()) issues.push('Sale type is required.');
  if (!form.category.trim()) issues.push('Launch category is required.');
  if (!form.bannerUrl.trim()) issues.push('Launch detail banner is required.');
  if (!identity.logoUrl) issues.push('Launch or canonical logo is required.');
  if (!form.problem.trim()) issues.push('Problem description is required.');
  if (!form.solution.trim()) issues.push('Solution description is required.');
  if (!form.tokenUtility.trim()) issues.push('Token utility is required.');
  if (!form.participationRules.some((item) => item.trim())) {
    issues.push('Add at least one participation rule.');
  }
  if (!form.faq.some((item) => item.question.trim() && item.answer.trim())) {
    issues.push('Add at least one complete FAQ item.');
  }
  const urls = [
    form.logoUrl,
    form.bannerUrl,
    ...form.gallery,
    form.website,
    form.twitter,
    form.telegram,
    form.discord,
    form.whitepaper,
    ...form.investors.flatMap((item) => [item.logoUrl, item.website]),
    ...form.team.flatMap((item) => [item.avatarUrl, item.website]),
    ...form.documents.map((item) => item.url),
  ];
  if (urls.some((url) => !isLaunchpadUrl(url))) {
    issues.push('Media and external links must be valid http(s) URLs or stored upload paths.');
  }
  if (form.documents.some((item) => (
    item.title.trim() || item.url.trim() || item.type.trim()
  ) && (!item.title.trim() || !item.url.trim()))) {
    issues.push('Each document needs both a title and URL.');
  }
  if (form.tokenDecimals.trim() && tokenDecimalsFromString(form.tokenDecimals) === undefined) {
    issues.push('Token decimals must be a whole number from 0 to 255.');
  }
  return issues;
};

export const validateLaunchpadDetailsStep = (
  step: number,
  form: LaunchpadDetailsForm,
  canonical?: LaunchpadCanonicalProject,
): string[] => {
  const identity = resolveLaunchpadIdentity(form, canonical);
  if (step === 1) {
    const issues: string[] = [];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      issues.push('Enter a valid launch slug before continuing.');
    }
    if (!identity.title) issues.push('Select/create a canonical project or enter a launch title.');
    if (!form.shortDescription.trim()) issues.push('Enter a short launch description.');
    if (!form.saleType.trim()) issues.push('Enter the sale type.');
    if (!form.category.trim()) issues.push('Enter the launch category.');
    return issues;
  }
  if (step === 2) {
    return [
      !identity.description ? 'Enter a launch description or use canonical content.' : '',
      !form.problem.trim() ? 'Enter the problem description.' : '',
      !form.solution.trim() ? 'Enter the solution description.' : '',
      !form.tokenUtility.trim() ? 'Enter the token utility.' : '',
      form.tokenDecimals.trim() && tokenDecimalsFromString(form.tokenDecimals) === undefined
        ? 'Token decimals must be a whole number from 0 to 255.'
        : '',
    ].filter(Boolean);
  }
  if (step === 3) {
    return [
      !identity.logoUrl ? 'Add a launch logo or select a canonical project with a logo.' : '',
      !form.bannerUrl.trim() ? 'Add the launch detail banner.' : '',
    ].filter(Boolean);
  }
  if (step === 5) {
    return [
      !form.participationRules.some((item) => item.trim()) ? 'Add a participation rule.' : '',
      !form.faq.some((item) => item.question.trim() && item.answer.trim())
        ? 'Add a complete FAQ item.'
        : '',
    ].filter(Boolean);
  }
  if (step === 6) {
    const issues: string[] = [];
    const urls = [
      form.website,
      form.twitter,
      form.telegram,
      form.discord,
      form.whitepaper,
      ...form.documents.map((item) => item.url),
    ];
    if (urls.some((url) => !isLaunchpadUrl(url))) {
      issues.push('External links and document links must be valid http(s) URLs.');
    }
    if (form.documents.some((item) => (
      item.title.trim() || item.url.trim() || item.type.trim()
    ) && (!item.title.trim() || !item.url.trim()))) {
      issues.push('Each document needs both a title and URL.');
    }
    return issues;
  }
  return [];
};

export const ALLOWED_LAUNCHPAD_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const MAX_LAUNCHPAD_IMAGE_SIZE = 10 * 1024 * 1024;

export const validateLaunchpadImage = (file: Pick<File, 'type' | 'size'>): string | undefined => {
  if (!ALLOWED_LAUNCHPAD_IMAGE_TYPES.includes(file.type as typeof ALLOWED_LAUNCHPAD_IMAGE_TYPES[number])) {
    return 'Use JPG, PNG, WEBP or GIF images.';
  }
  if (file.size <= 0) return 'The selected image is empty.';
  if (file.size > MAX_LAUNCHPAD_IMAGE_SIZE) return 'The selected image exceeds 10 MB.';
  return undefined;
};

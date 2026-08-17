import {
  emptyLaunchpadDetailsForm,
  launchpadDetailsFromForm,
  launchpadDetailsToForm,
  resolveLaunchpadIdentity,
  validateLaunchpadDetails,
  validateLaunchpadImage,
} from './launchDetailsForm';

const canonical = {
  id: 'canonical-1',
  name: 'Canonical Project',
  logo: 'https://cdn.example.test/canonical-logo.webp',
  website: 'https://canonical.example',
  descriptionText: 'Canonical description',
};

describe('Launchpad launch-details form', () => {
  it('resolves empty overrides from canonical data without copying them into the payload', () => {
    const form = {
      ...emptyLaunchpadDetailsForm(),
      slug: 'canonical-project-sale',
      shortDescription: 'Token sale',
      saleType: 'IDO',
      category: 'Infrastructure',
      bannerUrl: '/uploads/launch-banner.webp',
      problem: 'Fragmented liquidity',
      solution: 'Unified liquidity',
      tokenUtility: 'Gas and staking',
      participationRules: ['Stake a FOMO NFT'],
      faq: [{ id: 'faq-1', question: 'How?', answer: 'Stake and participate.' }],
    };

    expect(resolveLaunchpadIdentity(form, canonical)).toMatchObject({
      title: 'Canonical Project',
      titleSource: 'canonical project',
      logoUrl: canonical.logo,
      logoSource: 'canonical project',
      description: canonical.descriptionText,
      descriptionSource: 'canonical project',
      website: canonical.website,
      websiteSource: 'canonical project',
    });
    const payload = launchpadDetailsFromForm(form);
    expect(payload.title).toBeUndefined();
    expect(payload.logoUrl).toBeUndefined();
    expect(payload.description).toBeUndefined();
    expect(payload.links?.website).toBeUndefined();
    expect(validateLaunchpadDetails(form, canonical)).toEqual([]);
  });

  it('round-trips launch overrides, arrays and FAQ while trimming empty values', () => {
    const form = launchpadDetailsToForm('custom-sale', {
      title: ' Launch override ',
      shortDescription: ' Short ',
      description: ' Full ',
      saleType: ' Seed ',
      category: ' DeFi ',
      gallery: [' /uploads/one.webp ', ''],
      participationRules: [' Rule ', ''],
      faq: [{ question: ' Question ', answer: ' Answer ' }],
      investors: [{ id: 'investor-1', name: ' Fund ', logoUrl: '/uploads/fund.webp' }],
      team: [{
        id: 'team-1',
        name: ' Alice ',
        role: ' CEO ',
        website: ' https://alice.example ',
      }],
      documents: [{ title: ' Audit ', url: ' https://docs.example/audit.pdf ', type: ' PDF ' }],
      analysisFlags: { green: [' Strong team '], yellow: [], red: [' Audit pending '] },
      funding: { totalRaisedLabel: ' $12.5M ', fundingType: ' Seed ' },
      flags: { showLeaderboard: false, showParticipants: true },
      tokenDisplay: {
        name: ' Project Token ',
        symbol: ' TKN ',
        decimals: 18,
        priceLabel: ' $0.025 ',
        allocationLabel: ' 2,500 USDT ',
      },
      zoneDescriptions: { green: ' Guaranteed ' },
      links: { twitter: 'https://x.com/project' },
    });
    const payload = launchpadDetailsFromForm(form);

    expect(payload).toMatchObject({
      title: 'Launch override',
      shortDescription: 'Short',
      description: 'Full',
      saleType: 'Seed',
      category: 'DeFi',
      gallery: ['/uploads/one.webp'],
      participationRules: ['Rule'],
      faq: [{ question: 'Question', answer: 'Answer' }],
      investors: [{ id: 'investor-1', name: 'Fund', logoUrl: '/uploads/fund.webp' }],
      team: [{ id: 'team-1', name: 'Alice', role: 'CEO', website: 'https://alice.example' }],
      documents: [{ title: 'Audit', url: 'https://docs.example/audit.pdf', type: 'PDF' }],
      analysisFlags: { green: ['Strong team'], yellow: [], red: ['Audit pending'] },
      funding: { totalRaisedLabel: '$12.5M', fundingType: 'Seed' },
      flags: { showLeaderboard: false, showParticipants: true },
      tokenDisplay: {
        name: 'Project Token',
        symbol: 'TKN',
        decimals: 18,
        priceLabel: '$0.025',
        allocationLabel: '2,500 USDT',
      },
      zoneDescriptions: { green: 'Guaranteed' },
      links: { twitter: 'https://x.com/project' },
    });
  });

  it('rejects unsupported or oversized image files before upload', () => {
    expect(validateLaunchpadImage({ type: 'image/svg+xml', size: 100 })).toContain('JPG');
    expect(validateLaunchpadImage({ type: 'image/png', size: 11 * 1024 * 1024 })).toContain('10 MB');
    expect(validateLaunchpadImage({ type: 'image/png', size: 100 })).toBeUndefined();
  });

  it('keeps display labels as strings and validates token decimals and documents', () => {
    const form = {
      ...emptyLaunchpadDetailsForm(),
      tokenPriceLabel: '0.000000000000000001',
      tokenDecimals: '18.5',
      documents: [{ id: 'doc-1', title: 'Audit', url: '', type: 'PDF' }],
    };

    const issues = validateLaunchpadDetails(form);
    expect(issues).toContain('Token decimals must be a whole number from 0 to 255.');
    expect(issues).toContain('Each document needs both a title and URL.');
    expect(launchpadDetailsFromForm(form).tokenDisplay?.priceLabel)
      .toBe('0.000000000000000001');
  });

  it('mirrors backend DTO collection and field limits before save', () => {
    const form = {
      ...emptyLaunchpadDetailsForm(),
      gallery: Array.from({ length: 21 }, (_, index) => `/uploads/${index}.webp`),
      documents: Array.from({ length: 51 }, (_, index) => ({
        id: `doc-${index}`,
        title: 'Audit',
        url: 'https://docs.example/audit.pdf',
        type: 'PDF',
      })),
      tokenSymbol: 'T'.repeat(41),
      shortDescription: 'S'.repeat(1_001),
    };

    const issues = validateLaunchpadDetails(form);
    expect(issues).toContain('Gallery supports at most 20 items.');
    expect(issues).toContain('Documents supports at most 50 items.');
    expect(issues).toContain('Token display symbol must not exceed 40 characters.');
    expect(issues).toContain('Short description must not exceed 1000 characters.');
  });

  it('accepts values exactly at the backend DTO boundaries', () => {
    const form = {
      ...emptyLaunchpadDetailsForm(),
      gallery: Array.from({ length: 20 }, (_, index) => `/uploads/${index}.webp`),
      documents: Array.from({ length: 50 }, (_, index) => ({
        id: `doc-${index}`,
        title: 'Audit',
        url: 'https://docs.example/audit.pdf',
        type: 'PDF',
      })),
      tokenSymbol: 'T'.repeat(40),
      shortDescription: 'S'.repeat(1_000),
    };

    const issues = validateLaunchpadDetails(form);
    expect(issues).not.toContain('Gallery supports at most 20 items.');
    expect(issues).not.toContain('Documents supports at most 50 items.');
    expect(issues).not.toContain('Token display symbol must not exceed 40 characters.');
    expect(issues).not.toContain('Short description must not exceed 1000 characters.');
  });

  it('rejects every repeated DTO collection and URL at one item over its limit', () => {
    const form = {
      ...emptyLaunchpadDetailsForm(),
      participationRules: Array.from({ length: 101 }, () => 'Stake a FOMO NFT'),
      faq: Array.from({ length: 101 }, (_, index) => ({
        id: `faq-${index}`,
        question: 'How?',
        answer: 'Stake and participate.',
      })),
      investors: Array.from({ length: 101 }, (_, index) => ({
        id: `investor-${index}`,
        name: `Fund ${index}`,
        logoUrl: '',
        website: '',
      })),
      team: Array.from({ length: 101 }, (_, index) => ({
        id: `member-${index}`,
        name: `Member ${index}`,
        role: 'Contributor',
        avatarUrl: '',
        website: '',
      })),
      greenFlags: Array.from({ length: 101 }, () => 'Verified signal'),
      website: `https://example.test/${'x'.repeat(2_048)}`,
    };

    const issues = validateLaunchpadDetails(form);
    expect(issues).toContain('Participation rules supports at most 100 items.');
    expect(issues).toContain('FAQ supports at most 100 items.');
    expect(issues).toContain('Investors supports at most 100 items.');
    expect(issues).toContain('Team supports at most 100 items.');
    expect(issues).toContain('Analysis flags supports at most 100 items.');
    expect(issues).toContain('URL must not exceed 2048 characters.');
  });
});

/**
 * Advertising Placement Registry — single source of truth for every ad surface.
 *
 * Migration map (legacy -> unified):
 *  - layout.banner (text pill "Ad ... Is Live")      -> GLOBAL_TOP_BANNER
 *  - banner module page='main'                        -> HOME_HERO
 *  - banner module page='gemslab' (GemsLab Slides)    -> GEMSLAB_SLIDES
 *  - launchpad placements surface='launchpad'         -> LAUNCHPAD_FEATURED (compat adapter)
 *  - launchpad placements surface='crypto_projects'   -> CRYPTO_PROMOTED (compat adapter)
 * Legacy blocks keep rendering via adapters, but new campaigns are served by this engine
 * (source of truth = ad_campaigns / ad_creatives / ad_placements registry).
 */

export type CreativeType = 'image' | 'text' | 'rich';
export type PlacementFormat = 'compact' | 'expanded' | 'both';

export interface PlacementDef {
  code: string;
  adminName: string;      // human label shown in CRM (never the raw code)
  group: 'global' | 'home' | 'local';
  surface: string;        // logical surface
  route: string;          // where it renders on the public site
  format: PlacementFormat;
  devices: Array<'desktop' | 'mobile'>;
  allowedCreativeTypes: CreativeType[];
  maxHeadline: number;
  maxDescription: number;
  cta: boolean;
  aspectDesktop: string;  // e.g. '4:1'
  aspectMobile: string;
  rotation: 'weighted' | 'single';
  availability: 'available' | 'limited' | 'sold_out';
  baselineInventoryPerDay: number; // used ONLY as flagged baseline when no real history
  legacy?: string;        // legacy source identifier if migrated
}

export const AD_PLACEMENTS: PlacementDef[] = [
  {
    code: 'GLOBAL_TOP_BANNER',
    adminName: 'Сквозной баннер (шапка сайта)',
    group: 'global',
    surface: 'global-header',
    route: '* (все страницы)',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['text', 'image'],
    maxHeadline: 42,
    maxDescription: 0,
    cta: true,
    aspectDesktop: 'pill',
    aspectMobile: 'pill',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 12000,
    legacy: 'layout.banner',
  },
  {
    code: 'HOME_HERO',
    adminName: 'Главная — герой-баннер',
    group: 'home',
    surface: 'market-home',
    route: '/ (market)',
    format: 'expanded',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'rich'],
    maxHeadline: 60,
    maxDescription: 140,
    cta: true,
    aspectDesktop: '4:1',
    aspectMobile: '3:2',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 8000,
    legacy: "banner:main",
  },
  {
    code: 'GEMSLAB_SLIDES',
    adminName: 'GemsLab — слайды',
    group: 'local',
    surface: 'gemslab',
    route: '/gemslab',
    format: 'expanded',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'rich'],
    maxHeadline: 60,
    maxDescription: 160,
    cta: true,
    aspectDesktop: '16:9',
    aspectMobile: '3:2',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 2500,
    legacy: 'banner:gemslab',
  },
  {
    code: 'ECHO_FEED',
    adminName: 'Echo — рекламный блок в ленте',
    group: 'local',
    surface: 'echo',
    route: '/echo',
    format: 'both',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text', 'rich'],
    maxHeadline: 64,
    maxDescription: 160,
    cta: true,
    aspectDesktop: '2:1',
    aspectMobile: '3:2',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 4000,
  },
  {
    code: 'OTC_MARKET',
    adminName: 'OTC / P2P — рекламный блок',
    group: 'local',
    surface: 'otc',
    route: '/echo (OTC/P2P)',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 48,
    maxDescription: 120,
    cta: true,
    aspectDesktop: '3:1',
    aspectMobile: '2:1',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 2000,
  },
  {
    code: 'LAUNCHPAD_FEATURED',
    adminName: 'Launchpad — featured',
    group: 'local',
    surface: 'launchpad',
    route: '/launchpad',
    format: 'expanded',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'rich'],
    maxHeadline: 60,
    maxDescription: 160,
    cta: true,
    aspectDesktop: '3:1',
    aspectMobile: '3:2',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 1800,
    legacy: 'launchpad:launchpad',
  },
  {
    code: 'CRYPTO_PROMOTED',
    adminName: 'Crypto — промо-проекты',
    group: 'local',
    surface: 'crypto',
    route: '/crypto',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52,
    maxDescription: 120,
    cta: true,
    aspectDesktop: '3:1',
    aspectMobile: '2:1',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 3000,
    legacy: 'launchpad:crypto_projects',
  },
  {
    code: 'EARLYLAND_FEED',
    adminName: 'EarlyLand — рекламный блок',
    group: 'local',
    surface: 'earlyland',
    route: '/earlyland',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52,
    maxDescription: 130,
    cta: true,
    aspectDesktop: '3:1',
    aspectMobile: '2:1',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 1500,
  },
  {
    code: 'FOMIES_SPOTLIGHT',
    adminName: 'Fomies — spotlight',
    group: 'local',
    surface: 'fomies',
    route: '/ (spotlight)',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52,
    maxDescription: 120,
    cta: true,
    aspectDesktop: '2:1',
    aspectMobile: '2:1',
    rotation: 'weighted',
    availability: 'available',
    baselineInventoryPerDay: 1200,
  },
  {
    code: 'BAKERS_FEED',
    adminName: 'Bakers — рекламный бейдж у заголовка',
    group: 'local',
    surface: 'bakers',
    route: '/bakers',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52, maxDescription: 130, cta: true,
    aspectDesktop: '3:1', aspectMobile: '2:1',
    rotation: 'weighted', availability: 'available', baselineInventoryPerDay: 1000,
  },
  {
    code: 'UNLOCKING_FEED',
    adminName: 'Unlocking — рекламный бейдж у заголовка',
    group: 'local',
    surface: 'unlocking',
    route: '/unlocking',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52, maxDescription: 130, cta: true,
    aspectDesktop: '3:1', aspectMobile: '2:1',
    rotation: 'weighted', availability: 'available', baselineInventoryPerDay: 1000,
  },
  {
    code: 'SPACEPORT_FEED',
    adminName: 'Spaceport — рекламный бейдж у заголовка',
    group: 'local',
    surface: 'spaceport',
    route: '/spaceport',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52, maxDescription: 130, cta: true,
    aspectDesktop: '3:1', aspectMobile: '2:1',
    rotation: 'weighted', availability: 'available', baselineInventoryPerDay: 1000,
  },
  {
    code: 'FUNDING_FEED',
    adminName: 'Funding Feed — рекламный бейдж у заголовка',
    group: 'local',
    surface: 'funding',
    route: '/funding',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52, maxDescription: 130, cta: true,
    aspectDesktop: '3:1', aspectMobile: '2:1',
    rotation: 'weighted', availability: 'available', baselineInventoryPerDay: 1000,
  },
  {
    code: 'BAZAR_FEED',
    adminName: 'Bazar — рекламный бейдж у заголовка',
    group: 'local',
    surface: 'bazar',
    route: '/bazar',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52, maxDescription: 130, cta: true,
    aspectDesktop: '3:1', aspectMobile: '2:1',
    rotation: 'weighted', availability: 'available', baselineInventoryPerDay: 1000,
  },
  {
    code: 'YURYLAND_FEED',
    adminName: 'YuryLand — рекламный бейдж у заголовка',
    group: 'local',
    surface: 'yuryland',
    route: '/yuryland',
    format: 'compact',
    devices: ['desktop', 'mobile'],
    allowedCreativeTypes: ['image', 'text'],
    maxHeadline: 52, maxDescription: 130, cta: true,
    aspectDesktop: '3:1', aspectMobile: '2:1',
    rotation: 'weighted', availability: 'available', baselineInventoryPerDay: 1000,
  },
];

export const AD_PLACEMENT_CODES = AD_PLACEMENTS.map((p) => p.code);
export const getPlacement = (code: string): PlacementDef | undefined =>
  AD_PLACEMENTS.find((p) => p.code === code);

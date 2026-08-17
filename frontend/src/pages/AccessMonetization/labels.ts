// Human-friendly labels so admins never read raw enums/keys in the primary UI.
// Raw keys/enums stay only inside "technical" expandable sections.

export const CAP_LABELS: Record<string, string> = {
  'earlyland.prime': 'EarlyLand Prime',
  'parsing.access': 'Parsing',
  'parsing.advanced': 'Parsing Advanced',
  'xrank.access': 'XRank',
  'fomo_ai.access': 'FOMO AI',
  'fomo_ai.deep_research': 'FOMO AI — Deep Research',
  'fomo_ai.portfolio_analysis': 'FOMO AI — Portfolio',
  'blockcore.access': 'BlockCore',
  'launchpad.view': 'Launchpad View',
  'launchpad.analytics': 'Launchpad Analytics',
  'launchpad.invest': 'Launchpad Invest',
  'spaceport.view': 'SpacePort View',
  'spaceport.stake': 'SpacePort Staking',
  'fomies.private': 'FOMIES Private',
  'fomo_intel.access': 'FOMO Intel',
};
export const capName = (key: string) => CAP_LABELS[key] || key;

// Which backend product each capability is actually wired to (CONNECTED vs not).
export const CAP_BACKEND: Record<string, { label: string; connected: boolean }> = {
  'earlyland.prime': { label: 'FomoV2ActivityAccessPolicy → AccessResolver', connected: true },
  'launchpad.invest': { label: 'Launchpad Eligibility (внешний движок)', connected: true },
  'launchpad.analytics': { label: 'Launchpad', connected: false },
  'launchpad.view': { label: 'Launchpad', connected: false },
  'spaceport.stake': { label: 'Spaceport NFT / Staking (внешний)', connected: true },
  'spaceport.view': { label: 'SpacePort', connected: false },
  'parsing.access': { label: 'Parsing / XRank', connected: false },
  'parsing.advanced': { label: 'Parsing / XRank', connected: false },
  'xrank.access': { label: 'XRank', connected: false },
  'fomo_ai.access': { label: 'FOMO AI pipeline (планируется)', connected: false },
  'fomo_ai.deep_research': { label: 'FOMO AI pipeline (планируется)', connected: false },
  'fomo_ai.portfolio_analysis': { label: 'FOMO AI pipeline (планируется)', connected: false },
  'blockcore.access': { label: 'BlockCore', connected: false },
  'fomies.private': { label: 'FOMIES', connected: false },
  'fomo_intel.access': { label: 'FOMO Intel (внешний биллинг)', connected: true },
};

export const SOURCE_LABELS: Record<string, string> = {
  subscription: 'Подписка',
  admin_grant: 'Выдан администратором',
  legacy_backend_grant: 'Ручной доступ (legacy)',
  legacy_earlyland_grant: 'Ручной доступ (legacy)',
  nft_event: 'NFT-привилегия',
  promo: 'Промо',
  entitlement: 'Entitlement',
  external: 'Внешний биллинг',
};
export const sourceLabel = (s?: string | null) => (s ? SOURCE_LABELS[s] || s : '—');

// Human explanation of a DENY/decision reason.
export const REASON_LABELS: Record<string, string> = {
  capability_required: 'Не входит в текущий тариф',
  auth_required: 'Требуется вход пользователя',
  external_eligibility_required: 'Требуется NFT / staking eligibility',
  billing_boundary: 'Внешний биллинг (FOMO Intel)',
  entitlement_unavailable: 'Нет активного доступа',
};
export const reasonLabel = (r?: string | null) => (r ? REASON_LABELS[r] || r : '—');

export const SUBSCRIPTION_SOURCE_LABELS: Record<string, string> = {
  CRYPTO_PAYMENT: 'Crypto',
  NFT_PRIMARY: 'NFT (первичная)',
  NFT_LEGACY: 'NFT (legacy)',
  ADMIN_GRANT: 'Администратор',
  PROMO: 'Промо',
  PARTNER: 'Партнёр',
};
export const subSourceLabel = (s?: string) => (s ? SUBSCRIPTION_SOURCE_LABELS[s] || s : '—');

export const DURATION_PRESETS = [
  { value: '', label: 'Бессрочно' },
  { value: '1', label: '1 день' },
  { value: '7', label: '7 дней' },
  { value: '14', label: '14 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '90 дней' },
];

export const REASON_PRESETS = ['Beta tester', 'Partner', 'Support compensation', 'Internal team', 'Promo'];

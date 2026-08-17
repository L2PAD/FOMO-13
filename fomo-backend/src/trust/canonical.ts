// Canonical Support & Trust taxonomy. Public Support UI is English-only, so
// category / reason display strings are stored in English. CRM may localise.

export interface CanonicalCategory {
  code: string; name: string; parentCode?: string; icon?: string;
  allowedRequestTypes?: string[]; publicVisible?: boolean; description?: string;
}

export const CANONICAL_CATEGORIES: CanonicalCategory[] = [
  // Trading
  { code: 'trading', name: 'Trading', icon: 'trending-up', allowedRequestTypes: ['support', 'dispute'] },
  { code: 'trading_otc', name: 'OTC', parentCode: 'trading', allowedRequestTypes: ['support', 'dispute'] },
  { code: 'trading_p2p', name: 'P2P', parentCode: 'trading', allowedRequestTypes: ['support', 'dispute'] },
  { code: 'trading_payment', name: 'Payment', parentCode: 'trading', allowedRequestTypes: ['support', 'dispute'] },
  { code: 'trading_counterparty', name: 'Counterparty', parentCode: 'trading', allowedRequestTypes: ['support', 'dispute'] },
  { code: 'trading_deal_stuck', name: 'Deal stuck', parentCode: 'trading', allowedRequestTypes: ['support', 'dispute'] },
  // Account
  { code: 'account', name: 'Account', icon: 'user' },
  { code: 'account_auth', name: 'Authentication', parentCode: 'account' },
  { code: 'account_email', name: 'Email', parentCode: 'account' },
  { code: 'account_twitter', name: 'Twitter', parentCode: 'account' },
  { code: 'account_wallet', name: 'Wallet', parentCode: 'account' },
  { code: 'account_verification', name: 'Verification', parentCode: 'account' },
  // FOMO
  { code: 'fomo', name: 'FOMO', icon: 'sparkles' },
  { code: 'fomo_xp_rank', name: 'XP / Rank', parentCode: 'fomo' },
  { code: 'fomo_score', name: 'FOMO Score', parentCode: 'fomo' },
  { code: 'fomo_badges', name: 'Badges', parentCode: 'fomo' },
  { code: 'fomo_spaceport', name: 'SpacePort', parentCode: 'fomo' },
  // Products
  { code: 'products', name: 'Products', icon: 'layers' },
  { code: 'products_launchpad', name: 'Launchpad', parentCode: 'products' },
  { code: 'products_earlyland', name: 'EarlyLand', parentCode: 'products' },
  { code: 'products_echo', name: 'Echo', parentCode: 'products' },
  { code: 'products_portfolio', name: 'Portfolio', parentCode: 'products' },
  { code: 'products_projects', name: 'Projects', parentCode: 'products' },
];

export interface CanonicalReason {
  code: string; label: string; allowedTargetTypes: string[]; description?: string;
}

// System reasons — code is immutable and cannot be deleted by admins.
export const CANONICAL_REASONS: CanonicalReason[] = [
  { code: 'impersonation', label: 'Impersonation', allowedTargetTypes: ['USER', 'PROJECT'] },
  { code: 'inappropriate_behavior', label: 'Inappropriate behavior', allowedTargetTypes: ['USER', 'COMMENT', 'MESSAGE'] },
  { code: 'underage_account', label: 'Underage user', allowedTargetTypes: ['USER'] },
  { code: 'spam', label: 'Spam', allowedTargetTypes: ['COMMENT', 'MESSAGE', 'CONTENT', 'USER'] },
  { code: 'fraud', label: 'Fraud / scam', allowedTargetTypes: ['USER', 'OTC_LISTING', 'P2P_LISTING', 'PROJECT'] },
  { code: 'misleading_info', label: 'Misleading information', allowedTargetTypes: ['COMMENT', 'CONTENT', 'PROJECT', 'MESSAGE'] },
  { code: 'harassment', label: 'Harassment / abuse', allowedTargetTypes: ['USER', 'COMMENT', 'MESSAGE'] },
  { code: 'suspicious_trading', label: 'Suspicious trading activity', allowedTargetTypes: ['USER', 'OTC_LISTING', 'P2P_LISTING'] },
  { code: 'manipulation', label: 'Manipulation', allowedTargetTypes: ['PROJECT', 'CONTENT', 'USER'] },
  { code: 'platform_violation', label: 'Platform rules violation', allowedTargetTypes: ['USER', 'COMMENT', 'MESSAGE', 'CONTENT', 'PROJECT', 'OTC_LISTING', 'P2P_LISTING', 'OTHER'] },
  { code: 'other', label: 'Other', allowedTargetTypes: ['USER', 'COMMENT', 'MESSAGE', 'CONTENT', 'PORTFOLIO', 'PROJECT', 'OTC_LISTING', 'P2P_LISTING', 'OTHER'] },
];

// Legacy report type -> canonical reason code (for migration/adapters).
export const LEGACY_REASON_MAP: Record<string, string> = {
  impersonality: 'impersonation',
  inappropriateBehavior: 'inappropriate_behavior',
  underageAccount: 'underage_account',
};

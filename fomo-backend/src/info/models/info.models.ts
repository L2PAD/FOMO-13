export type InfoDocument = Record<string, any> & {
  id?: string;
  key?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export type InfoBootstrap = {
  version: string;
  updatedAt: string;
  navigation: InfoDocument[];
  hero: InfoDocument;
  about: InfoDocument;
  utilities: {
    settings: InfoDocument;
    items: InfoDocument[];
    navButtons: InfoDocument[];
  };
  platform: InfoDocument;
  nftMechanics: InfoDocument;
  ecosystem: InfoDocument[];
  roadmap: InfoDocument;
  evolution: {
    levels: InfoDocument[];
    badges: InfoDocument[];
  };
  team: InfoDocument[];
  partners: InfoDocument[];
  community: InfoDocument;
  faq: InfoDocument[];
  footer: InfoDocument;
  cookieConsent: InfoDocument;
  seo: InfoDocument;
};

export type InfoAnalyticsEvent = {
  id: string;
  type: string;
  timestamp: Date;
  session_id?: string;
  visitor_id?: string;
  payload: Record<string, any>;
};

export type InfoMarketCoin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
};

export type InfoMarketData = {
  coins: InfoMarketCoin[];
  indices: {
    fear_greed: number;
    altcoin_season: number;
  };
  updated_at: string;
  source?: string;
  is_fallback?: boolean;
};

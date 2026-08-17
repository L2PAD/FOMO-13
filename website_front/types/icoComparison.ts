export interface IcoComparisonInvestor {
  name: string;
  slug?: string | null;
  logo?: string | null;
  tier?: string | null;
  type?: string | null;
  investmentsCount?: number | null;
}

export interface IcoComparisonRound {
  name?: string | null;
  date?: string | null;
  amount?: number | null;
  amountRaw?: string | null;
  valuation?: number | null;
  valuationRaw?: string | null;
  price?: number | null;
  investors?: IcoComparisonInvestor[];
}

export interface IcoComparisonPeer {
  id?: string | null;
  name: string;
  slug: string;
  symbol?: string | null;
  logo?: string | null;
  screenshotUrl?: string | null;
  screenshot?: string | null;
  categories?: string[];
  chains?: string[];
  investedAmount?: number | null;
  currentValue?: number | null;
  entryPrice?: number | null;
  currentPrice?: number | null;
  athPrice?: number | null;
  fundraisingTotal?: number | null;
  marketCap?: number | null;
  fdv?: number | null;
  roiX?: number | null;
  roiPercent?: number | null;
  athRoiX?: number | null;
  athRoiPercent?: number | null;
  currentRoiXFromIco?: number | null;
  currentRoiFromIco?: number | null;
  athRoiXFromIco?: number | null;
  athRoiFromIco?: number | null;
  totalRaised?: number | null;
  fundsRaised?: number | null;
  fullyDilutedMarketCap?: number | null;
  entryRoundName?: string | null;
  entrySource?: string | null;
  totalInvestors?: number | null;
  rating?: number | null;
  fomoScore?: number | null;
}

export interface IcoComparisonResponse {
  project: {
    id: string;
    name: string;
    slug: string;
    symbol?: string | null;
    logo?: string | null;
    screenshotUrl?: string | null;
    screenshot?: string | null;
    categories?: string[];
    chains?: string[];
  };
  market: {
    currentPrice?: number | null;
    marketCap?: number | null;
    fdv?: number | null;
    volume24h?: number | null;
    circulatingSupply?: number | null;
    totalSupply?: number | null;
    athPrice?: number | null;
    atlPrice?: number | null;
  };
  fundraising: {
    totalRaised?: number | null;
    rounds: IcoComparisonRound[];
  };
  roi: {
    entryPrice?: number | null;
    roiX?: number | null;
    roiPercent?: number | null;
    athRoiX?: number | null;
    athRoiPercent?: number | null;
    icoPrice?: number | null;
    listingPrice?: number | null;
    currentPrice?: number | null;
    athPrice?: number | null;
    currentRoiXFromIco?: number | null;
    currentRoiFromIco?: number | null;
    athRoiXFromIco?: number | null;
    athRoiFromIco?: number | null;
    currentRoiXFromListing?: number | null;
    currentRoiFromListing?: number | null;
    athRoiXFromListing?: number | null;
    athRoiFromListing?: number | null;
  };
  tokenomics: Record<string, any>;
  unlocks: {
    nextUnlockDate?: string | null;
    nextUnlockAmount?: number | null;
    nextUnlockPercent?: number | null;
    events: Array<Record<string, any>>;
  };
  backers: {
    totalInvestors?: number | null;
    leadInvestors?: number | null;
    topInvestors?: IcoComparisonInvestor[];
  };
  scores: {
    rating?: number | null;
    fomoScore?: number | null;
    fullness?: number | null;
    riskScore?: number | null;
    sourceConfidence?: number | null;
  };
  comparisonTable?: IcoComparisonPeer[];
  comparisonPeers: IcoComparisonPeer[];
  dataQuality: {
    sources: string[];
    missingFields: string[];
    staleFields: string[];
    confidence: number;
    updatedAt?: string | null;
    safeguards?: Record<string, boolean>;
  };
}

export type IcoComparisonHistoryRange = "30D" | "90D" | "6M" | "YTD" | "Since ICO";

export interface IcoComparisonHistoryPoint {
  timestamp: number;
  date: string;
  value?: number | null;
  price?: number | null;
  investmentPrice?: number | null;
  roundName?: string | null;
  marketCap?: number | null;
  fdv?: number | null;
  volume24h?: number | null;
  roiFromIco?: number | null;
  roiFromListing?: number | null;
  roiMultiplier?: number | null;
  roiSource?: string | null;
  source?: string | null;
}

export interface IcoComparisonIndustryHistoryPoint {
  timestamp: number;
  date: string;
  marketCap?: number | null;
  fdv?: number | null;
  roi?: number | null;
  medianRoi?: number | null;
  topQuartileRoi?: number | null;
}

export interface IcoComparisonPeerHistory {
  id?: string | null;
  name: string;
  slug: string;
  symbol?: string | null;
  logo?: string | null;
  series: IcoComparisonHistoryPoint[];
}

export interface IcoComparisonHistoryResponse {
  range: IcoComparisonHistoryRange;
  generatedAt?: string;
  roiHistory: IcoComparisonHistoryPoint[];
  marketCapHistory: IcoComparisonHistoryPoint[];
  fdvHistory: IcoComparisonHistoryPoint[];
  peerComparisonHistory: IcoComparisonPeerHistory[];
  industryAverageHistory: IcoComparisonIndustryHistoryPoint[];
  dataQuality?: {
    sources?: string[];
    snapshots?: number;
    peers?: number;
    includeIndustry?: boolean;
    safeguards?: Record<string, boolean>;
  };
}

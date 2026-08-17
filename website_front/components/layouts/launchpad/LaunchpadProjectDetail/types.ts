export type ZoneVariant =
  | "green"
  | "yellow"
  | "red"
  | "greenPassive"
  | "yellowFilled"
  | "redFilled";
export type TabVariant = "details" | "ido" | "leaderboard";

export interface SocialLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  whitepaper?: string;
}

export interface TimelineStep {
  id: string;
  label: string;
  descriptionLines: string[];
  isActive: boolean;
  isDone: boolean;
  icon: "layers" | "cart" | "gift";
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface InvestorData {
  id: string;
  name: string;
  logo: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  nftCount: number;
  nftLevel: number;
  nftsStaked: number;
  allocation: string;
  zone: ZoneVariant;
  isCurrentUser?: boolean;
}

export interface SimilarProject {
  id: string;
  name: string;
  category: string;
  logo: string;
  statusLabel: string;
  statusVariant: "green" | "yellow" | "blue";
  totalRaise: string;
  allocation: string;
  fundingProgress: number;
  timeLeft?: string;
  isEligible: boolean;
}

export interface AllocationData {
  position: string;
  amount: string;
  zone: ZoneVariant;
  congratsMessage: string;
}

export interface NftStakedData {
  subtitle: string;
  countdownLabel: string;
  countdownValue: string;
}

export interface FlagsData {
  greenFlags: string[];
  yellowFlags: string[];
  redFlags: string[];
}

export interface IdoData {
  raised: string;
  hardCap: string;
  progress: number;
  participants: number;
  tokenPrice: string;
  allocationSize: string;
  minInvestment: string;
  maxInvestment: string;
  timeRemaining: string;
  zoneDescriptions: {
    green: string;
    yellow: string;
    red: string;
  };
}

export interface LaunchpadProjectDetailData {
  id: string;
  name: string;
  logo: string;
  statusBadge: string;
  typeBadge: string;
  category: string;
  description: string;
  socialLinks: SocialLinks;
  totalRaised: string;
  tokenPrice: string;
  participants: string;

  saleTimeline: TimelineStep[];

  aboutTitle: string;
  aboutText: string;
  aboutTotalRaised: string;
  aboutFundingType: string;

  problem: string;
  solution: string;
  tokenUtility: string;

  investors: InvestorData[];
  team: TeamMember[];
  revenueModel: string;

  faq: FaqItem[];

  allocation: AllocationData;
  nftStaked: NftStakedData;
  leaderboard: LeaderboardEntry[];
  flags: FlagsData;
  participationRules: string[];
  ido: IdoData;
  similarProjects: SimilarProject[];
  claimDisplay: {
    amount: string;
    symbol: string;
    isRefund: boolean;
    investment: string;
  };
  display: {
    showLeaderboard: boolean;
    showParticipants: boolean;
    showCountdown: boolean;
  };
}

import { ICurrency } from "../components/global/common/CurrenciesDropdown";
import { ICountry } from "../components/global/GlobalMap";
import { ParsingTypes } from "../components/layouts/projects/modals/CreateParsingModal";
import { IPersonPortfolioItem } from "../components/layouts/projects/Persons/Person/AddPortfolioItem";

export enum STATUS_LIST {
  ACTIVE = "Active",
  UPCOMING = "Upcoming",
  ENDED = "Ended",
  NEW = "New",
  BLOCKED = "Blocked",
}

export enum USERS_STATUS_LIST {
  ACTIVE = "Active",
  BLOCKED = "Blocked",
}

export type StepType = {
  handler: string;
  isActive: boolean;
  isAvailable: boolean;
  text: string;
  index: number;
};

export type UserType = {
  _id?: string;
  wallet: string;
  email?: string;
  twitterData?: any;
  discordData?: any;
  telegramData?: any;
  isCodeActivated?: boolean;
};

export type ProjectTwitterData = {
  tweets: Array<any>;
  twitterName: string;
  followers: Array<any>;
  projectId: string;
};

export type RegistrationType = {
  email: string;
  password: string;
  username: string;
};

export type LoginType = {
  email: string;
  password: string;
};

export type ChangePasswordType = {
  oldPassword: string;
  newPassword: string;
};

export type UserRiskStatus = "Default" | "Low" | "Medium" | "High";

export interface IUserMemberStats {
  completedDeals: number;
  totalSales: number;
  totalPurchases: number;
  lastDeal?: string | Date | null;
}

export interface IUser {
  _id: string;
  email: string;
  password: string;
  isActive: boolean;
  bio?: string;
  name?: string;
  role: Array<string>;
  avatar?: string;
  rating?: string;
  projects?: Array<any>;
  points?: number;
  staking?: string;
  wallet: string;
  telegram?: string;
  redFlags?: number;
  lastLogin: Date;
  selected?: boolean;
  blocked?: boolean;
  username?: string;
  actions?: Array<any>;
  createDate?: Date;
  photo?: string;
  twitterData?: any;
  telegramData?: any;
  discordData?: any;
  telegramNotification?: boolean;
  emailNotification?: boolean;
  invites?: Array<IInvite>;
  claimedProjects?: Array<any>;
  reviewDislikes?: Array<IReview>;
  reviewLikes?: Array<IReview>;
  risk?: UserRiskStatus;
  verificationStatus: boolean;

  is2FAEnabled?: boolean;
  specialization?: string;
  cosmosAddress?: string;
  solanaAddress?: string;
  polkadotAddress?: string;
  regionData?: any;
  parsingTwitterData?: any;
  projectTwitterData?: ProjectTwitterData;
  twitterScore?: number;
  previousTwitterScore?: number;
  twitterScoreUpdate?: Date;

  followers?: Array<string>;
  following?: Array<string>;
  blockedUsers?: Array<string>;
  onlineDate?: Date;
  memberStats?: IUserMemberStats;
}

export interface IReview {
  userId: string;
  dealId: string;
  date: Date;
}

export interface INft {
  _id: string;
  name: string;
  status: string;
  niche: string;
  logo?: File;
  totalRaised: string;
  investors?: Array<any>;
  rating: string;
  fullness: string;
  banner: string;
  lastFunding: Date;
  floorPrice?: string;
  items?: Array<any>;
  owners?: Array<any>;
  redFlags?: string;
  redStatus: boolean;
  actionDate?: Date;
  type?: string;
}

export interface INews {
  _id: string;
  image: string;
  text: string;
  title: string;
  type: string;
  date: Date;
  recommendations?: Array<string>;
  recommendationNewsItems?: Array<INews>;
  isAdminCreate?: boolean;
  creator?: Array<IUser>;
  readTime?: string;
  likes?: Array<string>;
  dislikes?: Array<string>;
  page?: string;
  author?: string;
  // ── NEWS-1 Phase 6A: AI-generated publication fields (from canonical News) ──
  aiGenerated?: boolean;
  summary?: string;
  aiView?: string;
  whyMatters?: string;
  keyPoints?: Array<string>;
  provenanceUrls?: Array<string>;
  trustColor?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface Initiator {
  _id: string;
  email: string;
  avatar?: string;
  username?: string;
}

export interface IAction {
  _id: string;
  action: string;
  actionDate: Date;
  actionInitiator: string;
  initiator: Initiator;
  logo?: string;
  image?: string;
  name?: string;
  type?: string;
  status?: string;
  rating?: string;
  title?: string;
  fullness?: string;
  niche?: string;
  selected?: boolean;
}

export interface IFundActivity {
  id: string;
  project?: IProject;
  description: string;
  round: string;
  date: Date;
}

export interface IRecentExits {
  id: string;
  project?: IProject;
  description: string;
  round: string;
  initialInvestment: number;
  roundDate: Date;
  date: Date;
  exitAmount: number;
  roi: number;
}

export interface FundSocialLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  telegram?: string;
  discord?: string;
  medium?: string;
  github?: string;
  crunchbase?: string;
  [key: string]: string | undefined;
}

export interface FundSupportedProject {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  logo?: string;
  image?: string;
  symbol?: string;
  category?: string;
  stage?: string;
  roundDate?: string | Date;
  amount?: number;
  roi?: number;
  status?: string;
  source?: string;
}

export interface FundraisingRound {
  id?: string;
  projectName?: string;
  projectSlug?: string;
  projectLogo?: string;
  roundName?: string;
  stage?: string;
  date?: string | Date;
  endDate?: string | Date;
  amount?: number;
  roi?: number;
  valuation?: number;
  status?: string;
  leadInvestors?: Array<any>;
  coInvestors?: Array<any>;
}

export interface FundCoInvestor {
  id?: string;
  name: string;
  slug?: string;
  logo?: string;
  type?: string;
  totalInvestments?: number;
  investmentsCount?: number;
  count?: number;
  averageRoi?: number;
  roi?: number;
  dealsCount?: number;
  lastRoundDate?: string | Date;
}

export interface FundLockedUnlockedProject {
  logo?: string;
  name: string;
  nich?: string;
  locked: number;
  unlocked: number;
  symbol?: string;
}

export interface FundLockedUnlockedDistributionItem {
  name: string;
  locked: number;
  unlocked: number;
  symbol?: string;
  items?: Array<FundLockedUnlockedProject>;
}

export interface FundStats {
  totalInvestments?: number;
  leadInvestments?: number;
  coInvestments?: number;
  exits?: number;
  unicorns?: number;
  averageRoundSize?: number;
  medianRoundSize?: number;
  lastInvestmentDate?: string | Date;
  portfolioProjects?: number;
  totalInvestedAmount?: number;
}

export interface IFund {
  _id?: string;
  id?: string;
  slug?: string;
  routeId?: string;
  backerId?: string;
  canonicalBackerId?: string;
  name: string;
  status: string;
  niche: string;
  logo?: string;
  avatar?: string;
  totalRaised: string;
  investors?: Array<any>;
  rating: string;
  fullness: string;
  ratingBreakdown?: Record<string, any>;
  fullnessBreakdown?: Record<string, any>;
  lastRatingCalculatedAt?: Date | string;
  banner: string;
  lastFunding: Date;
  maxParticipants?: string;
  activityType?: string;
  reward?: string;
  type?: string;
  radFlags?: string;
  redStatus?: boolean;
  price?: number;
  socialmedia?: Array<ISocialMediaItem>;
  bio?: string;
  smartContracts?: Array<string>;
  topFollowers?: Array<object>;
  allocation?: string;
  totalAllocation?: Array<{ name: string; value: number }>;
  lowPrice?: number;
  highPrice?: number;
  priceRange?: number;
  marketCap?: number;
  dominance?: number;
  volume?: number;
  volumeGrowth?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  totalForSale?: number;
  FullyDilVal?: string;
  exchange?: Array<object>;
  fundraising?: Array<object>;
  news?: Array<INews>;
  tokenMetrics?: ITokenMetrics;
  assets?: Array<IAsset>;
  team?: Array<Investor>;
  advisor?: Array<Investor>;
  partners?: Array<Investor>;
  greenFlagsList?: Array<IFlag>;
  yellowFlagsList?: Array<IFlag>;
  redFlagsList?: Array<IFlag>;
  comments?: Array<IComment>;
  socialMedia?: Array<ISocialItem>;
  isEth?: boolean;
  regionData?: ICountry;
  industryFocus?: string;
  investAmount?: number;
  foundedDate?: Date;
  company?: string;
  position?: string;
  participated?: Array<string | IProject>;
  descriptionText?: string;
  projects?: Array<string>;
  categories?: Array<string>;
  georaphyInvestments?: Array<IGeographyDistributionItem>;
  numberOfInvestments?: number;
  averageRoi?: number;
  currentAum?: number;
  activities?: Array<IFundActivity>;
  recentExits?: Array<IRecentExits>;
  investmentPorfolio?: Array<IPersonPortfolioItem>;
  investmentDistribution?: Array<IFundCategoryDistributionItem>;
  isSponsored?: boolean;
  country?: string;
  location?: string;
  about?: string;
  roi?: number;
  roiDisplay?: string;
  projectsCount?: number;
  supportedProjectsCount?: number;
  supportedProjects?: Array<FundSupportedProject>;
  supportedProjectsPreview?: Array<FundSupportedProject>;
  portfolioCoins?: Array<FundSupportedProject>;
  topFundedProjectData?: FundSupportedProject;
  highestRoiProject?: FundSupportedProject;
  fundraisingRounds?: Array<FundraisingRound>;
  lockedUnlockedDistribution?: Array<FundLockedUnlockedDistributionItem>;
  coInvestors?: Array<FundCoInvestor>;
  sectors?: Array<string>;
  tags?: Array<string>;
  portfolioCategories?: Array<string>;
  categoryDistribution?: Array<IFundCategoryDistributionItem>;
  investmentStages?: Array<string>;
  socialLinks?: FundSocialLinks;
  stats?: FundStats;
  source?: {
    sourceName?: string;
    sourceUrl?: string;
    detailUrl?: string;
    lastParsedAt?: string | Date;
    enrichedFromInvestor?: boolean;
    matchedBy?: string;
  };
  dataQuality?: Record<string, any>;
  lastRoundDate?: Date | string;
  totalInvestments?: number;
  leadInvestments?: number;
  portfolioCoinsCount?: number;

  likes?: Array<string>;
  dislikes?: Array<string>;
  likesCount?: number;
  dislikesCount?: number;
  userReaction?: "like" | "dislike" | null;
  parsingTwitterData?: any;
  projectTwitterData?: ProjectTwitterData;
  twitterScore?: number;
  previousTwitterScore?: number;
  twitterScoreUpdate?: Date;
  roundsByCategory?: Array<any>;
  explorers?: any;
  bridge?: any;
}

export interface Investor {
  _id: string;
  img: string | File;
  name: string;
  selected: boolean;
  rating?: string | number;
  description?: string;
  logo?: string;
  banner?: string;
  redFlags?: number;
  redFlagsList?: Array<string>;
  avatar?: any;
  status?: any;
  athRoi?: any;
  redFlagsCount?: any;
  variant?: any;
  percentage?: any;
  isLead?: boolean;
  totalRaised?: number;
}

export interface IRoundItem {
  price: number;
  raised: number;
  preValuation: number;
  date: Date;
}
export type Quote = {
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap: number;
  market_cap_dominance: number;
  fully_diluted_market_cap: number;
  last_updated: string;
};

export type TaskStatus =
  | "completed"
  | "in progress"
  | "not started"
  | "missed"
  | "pending";

export interface IAchievement {
  id: string;
  name: string;
  description: string;
}

export interface IProjectCollaborator {
  id: string;
  value: string;
  link?: string;
  img: string;
}

export interface IFundingRound {
  icon: "selected" | "privateSell" | "hourGlass";
  type?: string;
  startDate?: Date;
  endDate?: Date;
  goal?: number;
  raised?: number;
  investors: Array<any>;
  tokenPrice: number;
  tokenSold: number;
  totalSupply: number;
  preValuation: number;
  platformName: string;
  platformImg: string;
  distributionType: string;
  minInvestment?: number;
  maxInvestment?: number;
  usdRoi: number;
  btcRoi: number;
  ethRoi: number;
  athRoi: number;
  currenciesList: Array<ICurrency>;
  tokenAllocated?: number;
  unlockDate?: Date;
}

export interface ITokenAllocationItem {
  name: string;
  value: number;
  allocated: number;
}

// export interface ICategoryDistributionItem {
//   id: number;
//   name: string;
//   value: number;
//   allocated: number;
//   items: Array<IPersonPortfolioItem>;
// }

export interface IFundCategoryDistributionItem {
  _id: string;
  name: string;
  value: number;
  amount: number;
}

export interface ICategoryDistributionItem {
  id: number;
  name: string;
  value: number;
  allocated: number;
  items: Array<any>;
}

export interface IGeographyDistributionItem {
  id: number;
  name: string;
  value: number;
  allocated: number;
  items: Array<any>;
}

export interface IPersonInfoBlock {
  name: string;
  value: string;
  date: string;
}
type ChangeValues = {
  USD: number | null;
  BTC: number | null;
  ETH: number | null;
  SOL: number | null;
};

type Changes = {
  "1H": ChangeValues;
  "4H": ChangeValues;
  "12H": ChangeValues;
  "1D": ChangeValues;
  "1W": ChangeValues;
  "1M": ChangeValues;
  "3M": ChangeValues;
  "6M": ChangeValues;
  YTD: ChangeValues;
  "1Y": ChangeValues;
  ALL: ChangeValues;
};
export interface IProject {
  _id?: string;
  name: string;
  sector?: string
  status: string;
  description?: string
  niche: string;
  organizations?: any
  symbol?: string;
  coingeckoId?: string;
  rank?: number;
  logo?: File | string;
  image?: string
  metadataLogo?: string;
  totalRaised: string;
  investors: Array<any>;
  categories?: Array<string>;
  rating: string;
  fullness: string;
  banner: string;
  lastFunding: Date;
  maxParticipants?: string;
  activityType?: string;
  reward?: string;
  type?: string;
  website?: Array<string>;
  redFlags?: string;
  redStatus?: boolean;
  price?: number;
  tvl?: number
  socialmedia?: Array<ISocialMediaItem>;
  bio?: string;
  round?: string;
  smartContracts?: Array<string>;
  topFollowers?: Array<object>;
  allocation?: string;
  totalAllocation?: Array<ITokenAllocationItem>;
  lowPrice?: number;
  highPrice?: number;
  priceRange?: number;
  marketCap?: number;
  dominance?: number;
  volume?: number;
  volumeGrowth?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  totalSupplyChange?: number;
  dateAdded?: Date
  totalForSale?: number;
  FullyDilVal?: string;
  exchange?: Array<object>;
  comparison?: Array<IProject>;
  news?: Array<INews>;
  tokenMetrics?: ITokenMetrics;
  assets?: Array<IAsset>;
  team?: Array<Investor>;
  advisors?: Array<Investor>;
  partners?: Array<Investor>;
  greenFlagsList?: Array<IFlag>;
  yellowFlagsList?: Array<IFlag>;
  redFlagsList?: Array<IFlag>;
  comments?: Array<IComment>;
  projectType?: string;
  projectStatus?: string;
  source?: string;
  sourceId?: string;
  sourceUrl?: string;
  detailUrl?: string;
  lastParsedAt?: Date;
  rawIcoData?: any;
  interestLevel?: any;
  dates?: any;
  isVestingReview?: boolean;
  ecosystems?: Array<string>;
  launchpads?: Array<string>;
  saleRounds?: Array<any>;
  tokenomics?: any;
  vesting?: any;
  social?: any;
  ending?: string;
  projects?: Array<any>;
  fomoScore?: number;
  rewards?: number;
  requirements?: any;
  dateRewards?: Date;
  isCompendium?: boolean;
  participated?: Array<IProject>;
  colleagues?: Array<IProject>;
  volumeAndMarketCap?: number;
  fullyDilutedMarketCap?: number;
  volume24hChange?: number;
  volume24h?: number;
  priceBTC?: number;
  priceChange?: number;
  twitterAcc?: string;
  tokenAddress?: string;
  isIdea?: boolean;
  goal?: number;
  ethQuote?: Quote;
  btcQuote?: Quote;
  usdQuote?: Quote;
  publicVestingValue?: number;
  publicVestingDate?: Date;
  stage?: string;
  historicalUnlockValue?: number;
  historicalUnlockDate?: Date;
  nextUnlockValue?: number;
  nextUnlockDate?: Date;
  fundsRaised?: number;

  // NFT

  floorPrice?: number;
  items?: number;

  // SMART

  stakingDateStart?: Date;
  stakingDateEnd?: Date;
  stakingTimeStart?: string;
  stakingTimeEnd?: string;

  purchaseDateStart?: Date;
  purchaseDateEnd?: Date;
  purchaseTimeStart?: string;
  purchaseTimeEnd?: string;

  distributionStart?: Date;
  distributionTimeStart?: string;

  greenDate?: Date;
  greenTimeStart?: string;

  yellowDate?: Date;
  yellowTimeStart?: string;

  greenZone?: number;
  yellowZone?: number;
  nftStakeNeed?: number;
  comission?: number;
  mediaComission?: number;
  media?: Array<string>;
  poolId?: number;
  poolActive?: boolean;
  isMainProject?: boolean;
  isClaimStart?: boolean;
  isRefunded?: boolean;
  hardCap?: string;
  inititialMarketCap?: string;
  valuation?: string;

  descriptionText?: string;
  overviewText?: string;
  tokenUtilityText?: string;
  revenueText?: string;
  stakingText?: string;
  purchaseText?: string;
  distributionText?: string;

  totalIssued?: string;
  redemptionAmount?: string;

  minInvest?: number;
  maxInvest?: number;
  totalMaxInvest?: number;
  blockchain?: string;
  platformRaise?: string;
  recommendations?: Array<any>;
  faq?: Array<any>;
  descriptionImage?: File | string;

  funded?: number;
  totalAmount?: number;
  tags?: Array<{ value: string }>;
  isEth?: boolean;

  isClaimed?: boolean;
  claimValue?: number;
  investValue?: number;
  ticker?: string;

  regionData?: ICountry;
  investAmount?: number;
  foundedDate?: Date;
  industryFocus?: string;

  achievements?: Array<IAchievement>;
  collaborators?: Array<IProjectCollaborator>;
  fundraising?: Array<IFundingRound>;
  descriptionImages?: Array<string>;
  descriptionImagesToUpdate?: Array<IUploadImg>;
  descriptionImagesOld?: Array<string>;
  isSponsored?: boolean;
  isSandbox?: boolean;

  likes?: Array<string>;
  dislikes?: Array<string>;
  likesCount?: number;
  dislikesCount?: number;
  userReaction?: "like" | "dislike" | null;
  canonicalProjectId?: string;
  projectKind?: string;

  ohlcv?: any;
  parsingTwitterData?: any;
  projectTwitterData?: ProjectTwitterData;

  twitterScore?: number;
  previousTwitterScore?: number;
  twitterScoreUpdate?: Date;
  roundsByCategory?: Array<any>;
  roundsByStage?: Array<any>;

  athUsd?: number;
  athUsdDate?: Date;
  atlUsd?: number;
  atlUsdDate?: Date;

  yearHigh?: number;
  yearLow?: number;
  yearHighDate?: Date;
  yearLowDate?: Date;

  highs?: any;
  lows?: any;
  highsDates?: any;
  lowsDates?: any;
  priceChangePercentFromYearHighDate?: any;
  priceChangePercentFromYearLowDate?: any;
  twitterPerformance?: number;
  slug?: string;
  chart7d?: string;
  mainCategory?: any;
  contracts?: Array<any>;
  fundsRounds?: Array<any>;
  allTimePriceChange?: Changes;
  topfollowers?: Array<object>;
  twitterFollowers?: Array<any>;
  xfromIco?: {
    USD: number | null;
    BTC: number | null;
    ETH: number | null;
    SOL: number | null;
  };
  icoPrice?: {
    USD: number | null;
    BTC: number | null;
    ETH: number | null;
    SOL: number | null;
  };
  explorers?: Array<string>;
  bridge?: Array<string>;
  tokenDetails?: any;
  mcapPerGainPotential?: number;
  fdvPerGainPotential?: number;
  gainPotentialPercent?: number;
}

export interface IUploadImg {
  id: string;
  img: string;
}

export interface IActivityLeaderboard {
  address: string;
  partners: number;
  stakingNft: number;
  creater: number;
  tasks: number;
  investmentsQuanity: number;
  points: number;
  totalScore: number;
}

export interface IEvent {
  _id?: string;
  name: string;
  date?: Date;
  endDate?: Date;
  stars: number;
  time: string;
  endTime?: string;
  project?: IProject | INft;
  projectId?: string;
  projectsData?: Array<IProject>;
  isPrivate?: boolean;
  userId?: string;
  page?: string;
  isProjectEvent?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
}

export interface ISocialMediaItem {
  href: string;
  name: string;
  icon?: any;
}

export interface ITokenMetrics {
  ticket?: string;
  ticker?: string;
  tokenType?: string;
  tokenPrice?: string;
  preSale?: string;
  KYC?: string;
  whitelist?: string;
  personalCap?: string;
  accepts?: string;
  totalSupply?: string;
  maxSupply?: string;
  blockchain?: string;
  circulatingSupply?: string;
}

export interface IAsset {
  asset?: string;
  tokenSupply?: string;
  publicVesting?: string;
  seedVesting?: string;
  privateVesting?: string;
  strategicVesting?: string;
  stage?: STATUS_LIST;
  upcomingEvent?: string;
  lastEvent?: string;
}

export interface IProjectNews {
  date: Date;
  time: string;
  title: string;
  text: string;
}

export interface IFlag {
  text: string;
  link: string;
  type: boolean;
}

export interface IComment {
  _id?: string;
  authorId?: string;
  author: Array<IUser>;
  date: Date;
  text: string;
  isTopic?: boolean;
  topicName?: string;
  topicKey?: string;
  categoryKey?: string;
  image?: string;
  answersList?: Array<IComment>;
  answers?: Array<IComment>;
  replies?: Array<IComment>;
  likes?: Array<string>;
  dislikes?: Array<string>;
  reports?: Array<string>;
  path?: string;
  replyCount?: number;
  topicId?: string;
  viewsCount?: number;
  // Rich forum post fields (Telegram-style composer) + engagement.
  bodyHtml?: string;
  images?: Array<string>;
  coverImage?: string;
  mediaUrls?: Array<string>;
  tags?: Array<string>;
  audience?: "PUBLIC" | "FOLLOWERS";
  authorType?: "USER" | "SYSTEM_AI";
  reposts?: Array<string>;
  repostsCount?: number;
}

export interface ITopicSentiment {
  score: number;
  label: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface ITopicContributor {
  name: string;
  username: string;
  avatar: string;
  badge: string;
  xp: number;
  upvotes: number;
  comments: number;
  engagement: string;
}

export interface ITopicInsights {
  overview: string;
  takeaways: string[];
  pulse: string[];
  sentiment: ITopicSentiment;
  contributors: ITopicContributor[];
  updatedAt: string;
}

export interface ITopicDetailResponse {
  topic: IComment;
  insights: ITopicInsights;
}

export interface ITopicListResponse {
  items: IComment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ITwitterAcc {
  _id: string;
  name?: string;
  username: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  last100Tweets?: Array<any>;
  description?: string;
}

export interface ISocialItem {
  name: string;
  url: string;
  icon: any;
}

export interface ICreateMember {
  name: string;
  lastname: string;
  avatar?: File;
  profession: string;
}

export interface IMember {
  _id: string;
  name: string;
  lastname: string;
  avatar: string;
  profession: string;
}

export interface ICreatePartner {
  url: string;
  img?: File;
}

export interface IPartner {
  _id: string;
  url: string;
  img: string;
}

export interface ISocial {
  email: string;
  twitter: string;
  telegramRu: string;
  telegramEn: string;
  youtube: string;
}

export interface ILegal {
  policy: string;
  terms: string;
  disclaimer: string;
}

export interface IPersonAchievements {
  totalInvestments: string;
  highestRoi: string;
  deals: Array<string>;
}

export interface IPerson {
  _id?: string;
  id?: string;
  slug?: string;
  routeId?: string;
  backerId?: string;
  canonicalBackerId?: string;
  name: string;
  status: string;
  niche: string;
  logo?: string;
  totalRaised: string;
  investors?: Array<any>;
  rating: string;
  fullness: string;
  banner: string;
  lastFunding: Date;
  maxParticipants?: string;
  activityType?: string;
  reward?: string;
  type?: string;
  redFlags?: string;
  redStatus?: boolean;
  price?: number;
  socialmedia?: Array<ISocialMediaItem>;
  bio?: string;
  smartContracts?: Array<string>;
  topFollowers?: Array<object>;
  allocation?: string;
  totalAllocation?: Array<{ name: string; value: number }>;
  lowPrice?: number;
  highPrice?: number;
  priceRange?: number;
  marketCap?: number;
  dominance?: number;
  volume?: number;
  volumeGrowth?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  totalForSale?: number;
  FullyDilVal?: string;
  exchange?: Array<object>;
  fundraising?: Array<object>;
  news?: Array<INews>;
  tokenMetrics?: ITokenMetrics;
  assets?: Array<IAsset>;
  team?: Array<Investor>;
  advisor?: Array<Investor>;
  partners?: Array<Investor>;
  greenFlagsList?: Array<IFlag>;
  yellowFlagsList?: Array<IFlag>;
  redFlagsList?: Array<IFlag>;
  comments?: Array<IComment>;
  socialMedia?: Array<ISocialItem>;
  isEth?: boolean;
  regionData?: ICountry;
  industryFocus?: string;
  investAmount?: number;
  foundedDate?: Date;
  company?: string;
  position?: string;
  participated?: Array<string | IProject>;
  descriptionText?: string;
  categories?: Array<string>;
  totalInvested?: number | string;
  investmentsVariant?: "amount" | "count";
  athRoi?: number | string;
  roi?: number;
  roiDisplay?: string;
  topFundedProject?: string;
  topFundedProjectData?: FundSupportedProject;
  projectSupported?: number;
  highestRoi?: number;
  highestRoiProject?: FundSupportedProject;
  projectsCount?: number;
  supportedProjectsCount?: number;
  numberOfInvestments?: number;
  totalInvestments?: number;
  portfolioCoinsCount?: number;
  portfolioCoins?: Array<FundSupportedProject>;
  supportedProjects?: Array<FundSupportedProject>;
  actionDate?: Date;
  educationBlock?: Array<IPersonInfoBlock>;
  experienceBlock?: Array<IPersonInfoBlock>;
  contributionsBlock?: Array<string>;
  networkBlock?: Array<string>;
  influenceBlock?: Array<string>;
  achievementsBlock?: IPersonAchievements;
  investmentPorfolio?: Array<IPersonPortfolioItem>;
  investmentDistribution?: Array<IFundCategoryDistributionItem>;
  isSponsored?: boolean;

  likes?: Array<string>;
  dislikes?: Array<string>;
  likesCount?: number;
  dislikesCount?: number;
  userReaction?: "like" | "dislike" | null;
  parsingTwitterData?: any;
  projectTwitterData?: ProjectTwitterData;
  twitterScore?: number;
  previousTwitterScore?: number;
  twitterScoreUpdate?: Date;

  roundsByCategory?: Array<any>;
}

export interface ICreateNews {
  title: string;
  date: Date;
  type: string;
  text: string;
  image?: File;
  recommendations?: Array<string>;
  RecommendationNewsItems?: Array<INews>;
  page?: string;
  sourceUrl?: string;
}

export interface FAQItem {
  _id?: string;
  title: string;
  description: string;
  items: Array<{ title: string; description: string; isOpen?: boolean }>;
}

export interface IBannerItem {
  _id?: string;
  title: string;
  description: string;
  link: string;
  timeStart: string;
  date: Date;
  img: File | string;
  page?: string;
  isTimerVisible?: boolean;
}

export interface IInfoItem {
  link: string;
  img: string | File;
}

export interface ICreateInfo {
  partners: string;
  portfolio: string;
  progress: string;
}

export type FeatureItem = {
  title: string;
  text: string;
};

export interface IInfo {
  partners: Array<IInfoItem>;
  portfolio: Array<IInfoItem>;
  progress: Array<any>;
  headerText: string;
  aboutUsText: string;
  featuresItems: Array<FeatureItem>;
  whyFomo: Array<FeatureItem>;
}

export type TaskTypes = "default" | "special";

export interface ITask {
  _id?: string;
  name: string;
  date: Date;
  link: string;
  description: string;
  time: string;
  projectId?: string;
  awardedUsers?: Array<any>;
  usersRequests?: Array<any>;
  type: TaskTypes;
  points: number;
  project?: any;
  isPending?: boolean;
  isFinished?: boolean;
  isMissed?: boolean;
  isTodayTask?: boolean;
  smallDescription?: string;
}

export type IParsingLabels = "Negative" | "Positive" | "Neutral";

export interface IParcingTwitterAcc {
  _id: string;
  avatar: string;
  description: string;
  followersCount: number;
  followingCount: number;
  last100Tweets: Array<any>;
  name: string;
  tweetCount: number;
  username: string;
  tweets?: Array<any>;
  followers?: Array<any>;
  keywords?: string;
  type: ParsingTypes;
  mood?: {
    score: number;
    label: IParsingLabels;
  };
}

export interface IParsingKeywords {
  items: Array<string>;
  creator: string;
  lastUpdate: string;
  _id: string;
}

export type NotificationsTypes = "telegram" | "email";

export interface ICreateAlert {
  projectId: string;
  name: string;
  sensitivity: Array<number>;
  notificationTypes: Array<NotificationsTypes>;
}

export interface IMessage {
  _id?: string;
  date?: Date;
  from: string;
  to: string;
  message: string;
  title: string;
  sender?: IUser;
  isNew?: boolean;
  attachments?: Array<{
    url: string;
    name?: string;
    type?: string;
    size?: number;
  }>;
  replyTo?: string;
  replyToMessage?: {
    _id?: string;
    message?: string;
    sender?: IUser;
  };
  reports?: string[];
  isSystem?: boolean;
  systemType?: 'funds_reserved' | 'payment_marked' | 'appeal_created' | 'deal_completed';
  dealId?: string;
}

export interface IBoardTask {
  _id?: string;
  title: string;
  description: string;
  status: string;
  img: string;
}

export interface ICreateBoard {
  name: string;
  img?: File | string;
  projectId?: string;
}

export interface IUpdateBoard {
  name: string;
  columns?: Array<{ name: string; tasks: string[] }>;
  img?: File | string;
}

export interface ICreateTask {
  title: string;
  status: number;
  description?: string;
  img?: File | string;
  isInviteUser?: boolean;
}

export interface IBoard {
  _id: string;
  name: string;
  users: IUser[];
  owner: IUser;
  img?: string;
  project?: IProject;
  columns: Array<{ name: string; tasks: Array<IBoardTask> }>;
}

export interface INotification {
  itemId: string;
  userId: string;
}

export interface ICreateInvite {
  users: Array<string>;
  boardId: string;
}

export interface IInvite {
  _id?: string;
  inviter: IUser;
  board: IBoard;
  sender: IUser;
}

export interface IUpdateInvite {
  id: string;
  inviterId: string;
  boardId?: string;
  isInviteUser?: boolean;
}
export interface ICollectionTypes {
  "FOMO Key": "FOMO Key";
  "Early rounds": "Early rounds";
  "Public rounds": "Public rounds";
  "NFT Launch": "NFT Launch";
}

export type ICollectionMarketStatsPeriod = "1m" | "5m" | "1h" | "24h" | "7d" | "1y";

export interface ICollectionMarketStatsPoint {
  minPriceUsd: number;
  maxPriceUsd: number;
  avgPriceUsd: number;
  listingsCount: number;
}

export interface ICollectionMarketStatsPeriodPoint
  extends ICollectionMarketStatsPoint {
  windowStart: Date | string;
  windowEnd: Date | string;
}

export interface ICollectionMarketStats {
  ethUsdRate: number;
  allTime: ICollectionMarketStatsPoint;
  periods: Record<ICollectionMarketStatsPeriod, ICollectionMarketStatsPeriodPoint>;
  updatedAt: Date | string;
}

export interface ICollection {
  _id?: string;
  name: string;
  type: keyof ICollectionTypes;
  smart: string;
  royalty: number;
  project: IProject;
  nftQuantity: number;
  nfts: Array<any>;
  creatorFee: number;
  revenue: number;
  mintPrice: number;
  lastFunding: Date;
  tokenStandart: string;
  isPinned: boolean;
  metadataLink?: string;
  creator?: IUser;
  likes?: Array<string>;
  dislikes?: Array<string>;
  viewsCount?: number;
  greenFlags?: Array<string>;
  yellowFlags?: Array<string>;
  redFlags?: Array<string>;
  marketStats?: ICollectionMarketStats;
}
export type INftDisplayCurrency = "ETH" | "USDC";

export interface ICollectionNftPublicUser {
  _id: string;
  username: string;
  photo: string;
  twitterData?: any;
  wallet: string;
  avatar?: string;
  displayName?: string;
}

export interface ICollectionNftPagePrice {
  amount: number;
  usd: number;
  currency: INftDisplayCurrency;
}

export interface ICollectionNftPageCollectionInfo {
  _id: string;
  name: string;
  avatar: string;
  smart: string;
  tokenStandard: string;
  metadataLink: string;
  metadataLabel: string;
  blockchain: string;
}

export interface ICollectionNftPageInfo {
  contractAddress: string;
  tokenId: string;
  tokenStandard: string;
  blockchain: string;
  metadataLink: string;
  metadataLabel: string;
}

export interface ICollectionNftPageOffer {
  _id: string;
  price: number;
  priceUsd: number;
  currency: INftDisplayCurrency;
  createdAt?: Date | string | null;
  endDate?: Date | string | null;
  canCancel?: boolean;
  user: ICollectionNftPublicUser;
}

export interface ICollectionNftPageActivity {
  id: string;
  type: string;
  status: string;
  itemImage: string;
  collectionName: string;
  itemName: string;
  price: number;
  priceUsd: number;
  currency: INftDisplayCurrency;
  from: string;
  to: string;
  createdAt: Date | string;
}

export interface ICollectionNftPagePricePoint {
  id: string;
  timestamp: Date | string;
  price: number;
  priceUsd: number;
  currency: INftDisplayCurrency;
  source: "sale" | "listing";
}

export interface ICollectionNftPageRelatedItem {
  _id: string;
  nftId: number;
  name: string;
  price: number;
  priceUsd: number;
  currency: INftDisplayCurrency;
  image: string;
  chain: string;
  rarity: string;
  hiddenRarity: boolean;
  floorPrice: string;
  isEth: boolean;
  isUsdc: boolean;
}

export interface ICollectionNftPageData {
  image: string;
  rarity: string;
  views: number;
  listedAt?: Date | string | null;
  endDate?: Date | string | null;
  description: string;
  price: ICollectionNftPagePrice;
  collection: ICollectionNftPageCollectionInfo;
  creator: ICollectionNftPublicUser;
  owner: ICollectionNftPublicUser;
  info: ICollectionNftPageInfo;
  offers: ICollectionNftPageOffer[];
  activities: ICollectionNftPageActivity[];
  priceHistory: ICollectionNftPagePricePoint[];
  related: {
    fromCollection: ICollectionNftPageRelatedItem[];
    fromSeller: ICollectionNftPageRelatedItem[];
  };
}
export interface ICreateCollectionNft {
  nftId: number;
  description: string;
  external_url: string;
  image: string;
  name: string;
  attributes: Array<any>;
  collectionId: string;
  price: number;
  orderId: number;
  endDate?: Date | string | null;
  isEth: boolean;
  isUsdc: boolean;
  tokenAddress: string;
}
export interface ICollectionNft {
  _id: string;
  nftId: number;
  description: string;
  external_url: string;
  image: string;
  name: string;
  attributes: Array<any>;
  collectionId?: string;
  price: number;
  orderId?: number;
  endDate?: Date | string | null;
  isEth: boolean;
  isUsdc: boolean;
  isActive?: boolean;
  tokenAddress: string;
  project?: IProject;
  collection?: ICollection;
  owner?: IUser;
  currency?: INftDisplayCurrency;
  priceUsd?: number;
  rarity?: string;
  rarityRank?: number | null;
  viewsCount?: number;
  views?: number;
  hiddenRarity?: boolean;
  displayImage?: string;
  nftPage?: ICollectionNftPageData;
}
export interface ICreateOrder {
  collectionId: string;
  collectionNftId: string;
  projectId: string;
  price: number;
  isEth: boolean;
  isUsdc: boolean;
  endDate: Date;
  belowFloor: number;
}
export interface IOrder {
  _id: string;
  user: IUser;
  collection: ICollection;
  nft: ICollectionNft;
  project: IProject;
  created: Date;
  price: number;
  isEth: boolean;
  isUsdc: boolean;
  endDate: Date;
  belowFloor: number;
  isConfirm: boolean;
  smartOrderId?: number;
  isActive: boolean;
  status?: "Completed" | "Approved" | "Pending" | "Rejected";
}

export type DealType = "buy" | "sell";

export type DealTicker = "usd" | "eth";

export type DealStatus =
  | "waiting"
  | "started"
  | "ended"
  | "blocked"
  | "forced-termination"
  ;

export type DealServiceTypes =
  | "Services"
  | "NFT"
  | "Project account"
  | "Projects"
  | "KYC"
  | "Social network"
  | "Other";

export type DealSection = "otc" | "p2p";

export type AppealRole = "buyer" | "seller" | "creator";
export type AppealStatus = "open" | "in_review" | "resolved";

export interface IAppeal {
  _id?: string;
  appealId?: string;
  dealId: string;
  creator: IUser;
  role: AppealRole;
  reason: string;
  description: string;
  email: string;
  attachments: string[];
  status: AppealStatus;
  supportChatId?: string;
  assignedTo?: IUser;
  resolution?: string;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateDeal {
  type: DealType;
  name: string;
  amount: number;
  price: number;
  ticker: DealTicker | null;
  date: Date | null;
  description: string;
  dealId: number | null;
  creator: string;
  movingTokens?: boolean;
  buyer?: string;
  serviceType?: DealServiceTypes;
  tokenAddress?: string;
  section?: DealSection;
  smartContract?: string
  isRealAsset?: boolean
  decimals?: number
  paymentMethods?: string[]
  currency?: string
  isSponsored?: boolean;
  p2pSaleTime?: string;
}

export interface IDeal {
  _id: string;
  type: DealType;
  name: string;
  amount: number;
  price: number;
  ticker: DealTicker;
  date: Date;
  description: string;
  dealId: number;
  creator: IUser;
  movingTokens: boolean;
  buyer?: IUser;
  seller?: IUser;
  status: DealStatus;
  offersList?: Array<IDeal>;
  isReservedFunds?: boolean;
  isMakePayment?: boolean;
  lastStatusUpdate: Date;
  createDate: Date;
  serviceType: DealServiceTypes;
  isCompleteByAdmin?: boolean;
  likesCount: number;
  likes: Array<string>;
  dislikesCount: number;
  dislikes: Array<string>;
  creatorDetails?: IUser;
  tokenAddress?: string;
  transaction?: string;
  section?: DealSection;
  isRealAsset?: boolean
  smartContract?: string
  isPinned?: boolean
  decimals?: number
  currency?: string
  paymentMethods?: Array<
    | string
    | {
      _id?: string;
      label?: string;
      bankName?: string;
      meta?: { bankKey?: string };
    }
  >
  isSponsored?: boolean;
  nextPromotedDate?: Date
  promoteDateEnd?: Date
  orderNumber?: number
  expectPaymentDate?: Date
  isAppeal?: boolean
  appeal?: IAppeal
  chatId?: string
  p2pSaleTime?: string;
  p2pSaleTimeEnd?: Date | string | null
  isReturnFunds?: boolean;
}

export interface ICreateMessage {
  date: Date;
  to: string;
  message: string;
  title: string;
  chatId?: string;
  attachments?: Array<{
    url: string;
    name?: string;
    type?: string;
    size?: number;
  }>;
  replyTo?: string;
}

export interface IChat {
  created: string;
  messages: Array<IMessage>;
  participantsData: Array<IUser>;
  user?: IUser;
  lastMessage?: IMessage;
  _id: string;
  isPinned?: boolean
}

export interface IOtcMember {
  _id: string
  deals: Array<string>;
  lastDeal?: string | Date | null;
  totalEthPurchases: number;
  totalEthSales: number;
  totalPurchases: number;
  totalSales: number;
  totalUsdcPurchases: number;
  totalUsdcSales: number;
  user: IUser;
}

export interface IOtcComment {
  _id: string;
  date: string;
  deal: IDeal;
  text: string;
  type: "like" | "dislike";
  user: IUser;
  reviews?: Array<any>;
  users?: Array<IUser>;
}

export interface IGlobalLiveNews {
  id: string;
  text: string;
  createdAt: string;
  username?: string;
}

export type AssetTypes = "buy" | "sell";

export interface IGlobalAsset {
  _id?: string;
  projectId?: string
  marketAssetId?: string
  canonicalProjectId?: string
  type: AssetTypes;
  name: string;
  ticker: string;
  symbol?: string;
  amount: number;
  price: number;
  date?: Date;
  totalPrice: number;
  fee: number;
  feeAmount?: number;
  feeType?: "percent" | "usd";
  note?: string;
  logo?: string | null;
  isSelectedAsset?: boolean;
}

export type ActivityTypes =
  | "all"
  | "investments"
  | "deals"
  | "comments"
  | "other";

export interface IActivity {
  _id: string;
  userId: string;
  createdAt: Date;
  title: string;
  type: ActivityTypes;
  link: string;
}
export type UserRankType =
  | "Stellar Awakening"
  | "Celestial Master"
  | "Cosmic Explorer"
  | "Astral Sage"
  | "Galactic Navigator"
  | "Universal Enlightenment";

export interface IFomonautTableData {
  _id: string;
  name?: string;
  username?: string;
  wallet?: string;
  followers?: number;
  socialNetworks?: Array<any>;
  twitterData?: any;
  discordData?: any;
  rating?: string;
  photo?: string;
  redFlagsList?: Array<IFlag>;
  greenFlagsList?: Array<IFlag>;
  yellowFlagsList?: Array<IFlag>;
  activityXP?: number;
  verificationStatus?: boolean;
  rank?: UserRankType;
  reviewLikes: Array<any>;
  likes?: Array<any>;
  redFlags?: number;
}

export interface IExchangeTicker {
  base: string;
  quote: string;
  priceUsd: number;
  volume24h: number;
  link: string;
  verified: boolean;
  marginAvailable: boolean;
  type: string;
  marginLeverage: number;
  tradingViewBase: string | null;
  tradingViewQuote: string | null;
}

export interface IExchange {
  id: number;
  slug: string;
  name: string;
  image?: string;
  verified: boolean;
  type?: string;
  rankVerified?: number;
  rankReported?: number;
  volume24hReported?: number;
  volume24hVerified?: number;
  marketsCount?: number;
  tickers: IExchangeTicker[];
}
export interface IFlattenedTicker {
  index?: number;
  base: string;
  quote: string;
  priceUsd: number;
  volume24h: number;
  link: string;
  verified: boolean;
  marginAvailable: boolean;
  marginLeverage: number | null;
  type: string;
  tradingViewBase: string | null;
  tradingViewQuote: string | null;
  exchangeId: number;
  exchangeName: string;
  exchangeSlug: string;
  exchangeImage: string;
  exchangeRankReported: number | null;
  exchangeRankVerified: number | null;
  volume24Percent: number;
}

export interface IChartPriceData {
  timestamp: number;
  price: {
    USD: number;
    BTC: number;
    ETH: number;
    SOL: number;
    [key: string]: number;
  };
  marketCap: number;
  volume24h: number;
  funding: number;
  category?: string
}

export interface IPortfolioPriceData {
  date: Date
  totalBalance: number
  totalProfit?: number
  totalProfitPercent?: number
  totalInvested?: number
  btcPrice?: number
  ethPrice?: number
  categoryDistribution?:
    | Record<string, number>
    | Array<{ name: string; value: number; allocated?: number }>
  isApproximation?: boolean
  isCurrent?: boolean
  _id?: string
}

export type IKeywordTweet = {
  id: string;
  text: string;
  createdAt: string;
  description: string;
  statuses_count: number;
  media_count: number;
  friends_count: number;
  favourites_count: number;
  listed_count: number;
  author: {
    name: string;
    screenName: string;
    avatar?: string;
  };
  photos: string[] | null;
  views: string;
  mood?: { score: number; label: IParsingLabels };
  comments?: Array<any>;
};

export interface ICategory {
  _id: string;
  name: string;
  type: string;
  page: string;
  createdAt: Date;
}

export type NNHistoryItem = {
  predictedPrice: number;
  actualPrice: number;
  realChangePct: number;
  predChange: number;
  date: string;
  predictedVsActualPct?: number
};

export interface ITradingStatsData {
  name?: string;
  logo?: string;
  symbol: string;
  priceUSD: number;
  percentChange1h: number;
  percentChange24h: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply: number;
  marketCap: number;
  auditInfo?: any;
  neuralNetworkPrediction: {
    probabilityUp: number;
    date: string;
  };
  mood?: any;
  otherSources?: any;
  twitterAccs: string[];
  keywords: string[];
  timestamp: string;
}

export interface ITradingData {
  _id: string
  userId?: string | null
  coinId: number
  name: string
  logo: string
  data: ITradingStatsData[];
  currentData: ITradingStatsData;
  isPrivate: boolean;
  nnHistory?: NNHistoryItem[];
}

export interface ICreatePortfolio {
  name: string;
  description?: string;
  logo?: string | null;
}

export interface IPortfolioAsset {
  img: string;
  name: string;
  niche: string;
  amountUsd: string;
  amountTkn: string;
  invested: string;
  avgBuyPrice: string;
  profitUsd: number;
  profitPercent: number;
  index: number
  projectId: string
  _id: string
  category: string
}

export interface IPortfolio extends ICreatePortfolio {
  _id: string;
  creator: any;
  code: string;
  createdAt: string;
  isBattle?: boolean
  assets?: any[]
  isShare?: boolean
  shareLink?: string
  shareType?: any
  history: IPortfolioPriceData[]
  isAssets?: boolean
  totalInvested?: number | string
  atl: number
  ath: number
  athDate: Date
  atlDate: Date
  totalBalance: number
  unrealizedProfit: number
  realizedProfit: number
  profitPercent: number
  profit: number

  performance1h: any
  performance7d: any
  performance24h: any
  performance30d: any
  performance90d: any
  performance1y: any
  categoryDistribution: any
  calculatedAssets?: Array<{
    allocationPercent?: number
    currentValue?: number
    currency?: string
    category?: string
  }>
}

export interface IPortfolioSummary {
  _id: string;
  name: string;
  description?: string;
  code?: string;
  logo?: string;
  isBattle?: boolean;
  isShare?: boolean;
  shareType?: any;
  totalBalance?: number;
  profit?: number;
  profitPercent?: number;
  totalInvested?: number | string;
  performance1h?: any;
  isAssets?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPublicPortfolioSearchOwner {
  id?: string;
  displayName: string;
  username?: string;
  avatar?: string;
  fomoId?: number;
}

export interface IPublicPortfolioSearchItem {
  id: string;
  name: string;
  description?: string;
  shareCode: string;
  logo?: string;
  updatedAt?: string;
  totalBalance: number;
  profitPercent: number;
  owner: IPublicPortfolioSearchOwner;
}

export interface IPublicPortfolioSearchResponse {
  query: string;
  items: IPublicPortfolioSearchItem[];
}

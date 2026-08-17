import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { FundraisingDto } from "./dto/fundraising.dto";
import MainInfoDto from "src/social-parcing/dto/main-info.dto";
import { RegionData } from "src/funds/funds.model";
import { ParsingTwitterData } from "src/twitter/project-twitter.model";

export type ProjectDocument = HydratedDocument<Project>;

export interface IDates {
  [key: string]: Date;
}

export class Quote {
  price: number;
  volume_24h?: number;
  percent_change_1h: number;
  percent_change_24h: number;
  volume_change_24h?: number;
  percent_change_7d: number;
  market_cap?: number;
  market_cap_dominance?: number;
  fully_diluted_market_cap?: number;
  last_updated?: string;
}

export type QuoteDetails = {
  USD: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    last_updated: string;
  };
};

export class CryptoOHLCV {
  id: number;
  name: string;
  symbol: string;
  last_updated: string;
  time_open: string;
  time_close: null | string;
  time_high: string;
  time_low: string;
  quote: QuoteDetails;
}

@Schema()
export class Project {
  @Prop({ required: true, default: "project" })
  projectType: string;

  @Prop({ required: true, default: "moderation" })
  projectStatus: string;

  @Prop({ index: true })
  source?: string;

  @Prop({ index: true })
  sourceId?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ index: true })
  detailUrl?: string;

  @Prop({ index: true })
  lastParsedAt?: Date;

  @Prop({ type: Object })
  rawIcoData?: any;

  @Prop({ type: Object })
  interestLevel?: any;

  @Prop({ type: Object })
  dates?: any;

  @Prop({ type: Array, default: [] })
  ecosystems?: Array<string>;

  @Prop({ type: Array, default: [] })
  launchpads?: Array<string>;

  @Prop({ type: Array, default: [] })
  saleRounds?: Array<any>;

  @Prop({ type: Object })
  tokenomics?: any;

  @Prop({ type: Object })
  vesting?: any;

  @Prop({ type: Object })
  social?: any;

  @Prop({ default: false })
  isDuplicate: boolean;

  @Prop({ unique: true })
  capId: number;

  @Prop()
  originalEntityId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop()
  normalizedName?: string;

  @Prop({ default: [] })
  sections: Array<string>

  @Prop({ default: [] })
  tags: Array<string>;

  @Prop({ type: [String], default: [] })
  aliases?: string[];

  @Prop({ type: [Object], default: [] })
  sourceMappings?: Array<Record<string, any>>;

  @Prop()
  symbol: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  niche: string;

  @Prop()
  logo: string;

  @Prop()
  type: string;

  @Prop()
  investments: string;

  @Prop()
  rating: string;

  @Prop()
  ratingDateUpdate: string;

  @Prop()
  occupancy: string;

  @Prop()
  banner: string;

  @Prop({ type: Array })
  socialmedia;

  @Prop({ type: Array })
  website;

  @Prop({ type: Array })
  explorers;

  @Prop({ type: Array })
  bridge;

  @Prop()
  round: string;

  @Prop({ type: Array })
  topfollowers;

  @Prop({ type: Array })
  topFollowers;

  @Prop({ type: Array })
  links;

  @Prop({ type: Object, default: {} })
  tokenMetrics;

  @Prop({ default: [] })
  fundraising: Array<FundraisingDto>;

  @Prop({ type: Array })
  news;

  @Prop({ default: [] })
  comparison: Array<mongoose.Types.ObjectId>;

  @Prop()
  investors: Array<mongoose.Types.ObjectId>;

  @Prop()
  team: Array<mongoose.Types.ObjectId>;

  @Prop()
  advisors: Array<mongoose.Types.ObjectId>;

  @Prop()
  partners: Array<mongoose.Types.ObjectId>;

  @Prop()
  comments: Array<mongoose.Types.ObjectId>;

  @Prop({ type: Array })
  exchange;

  @Prop({ type: Array })
  overview;

  @Prop({ type: Array })
  info;

  @Prop({ default: 0 })
  redFlags: number;

  @Prop()
  redFlagsList: Array<{ text: string; links: string; type: boolean }>;

  @Prop()
  greenFlagsList: Array<{ text: string; links: string; type: boolean }>;

  @Prop({ default: false })
  redStatus: boolean;

  @Prop({ default: 0 })
  totalRaised: number;

  @Prop()
  lastFunding: Date;

  @Prop({ default: "0%" })
  fullness: string;

  @Prop({ type: Object })
  ratingBreakdown: Record<string, any>;

  @Prop({ type: Object })
  fullnessBreakdown: Record<string, any>;

  @Prop()
  lastRatingCalculatedAt: Date;

  @Prop()
  action: string;

  @Prop({ default: "projects" })
  actionType: string;

  @Prop({ default: new Date() })
  actionDate: Date;

  @Prop()
  actionInitiator: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({ default: 0 })
  priceBTC: number;

  @Prop({ default: 0 })
  priceETH: number;

  @Prop({ default: 0 })
  priceSOL: number;

  @Prop({ default: 0 })
  priceChange: number;

  @Prop({ default: 0 })
  lowPrice: number;

  @Prop({ default: 0 })
  highPrice: number;

  @Prop({ default: "" })
  bio: string;

  @Prop({ default: 0 })
  marketCap: number;

  @Prop({ default: 0 })
  volume: number;

  @Prop({ default: 0 })
  volume24h: number;

  @Prop({ default: 0 })
  volume24hChange: number;

  @Prop({ default: 0 })
  circulatingSupply: number;

  @Prop({ default: 0 })
  volumeGrowth: number;

  @Prop({ default: 0 })
  dominance: number;

  @Prop({ default: 0 })
  fullyDilutedMarketCap: number;

  @Prop({ default: 0 })
  totalSupply: number;

  @Prop({ default: 0 })
  maxSupply: number;

  @Prop({ default: 0 })
  totalForSale: number;

  @Prop({ default: [] })
  totalAllocation: Array<{ name: string; value: number }>;

  @Prop({ default: {} })
  twitterData: MainInfoDto;

  @Prop({ default: 0 })
  volumeAndMarketCap: number;

  @Prop()
  twitterAcc: string;

  @Prop()
  tokenAddress: string;

  @Prop({ default: false })
  isIdea: boolean;

  //SMART PROPS

  @Prop()
  stakingDateStart: Date;

  @Prop()
  stakingDateEnd: Date;

  @Prop()
  stakingTimeStart: string;

  @Prop()
  stakingTimeEnd: string;

  @Prop()
  purchaseDateStart: Date;

  @Prop()
  purchaseDateEnd: Date;

  @Prop()
  distributionStart: Date;

  @Prop()
  distributionTimeStart: string;

  @Prop()
  purchaseTimeStart: string;

  @Prop()
  purchaseTimeEnd: string;

  @Prop()
  greenDate: Date;

  @Prop()
  greenTimeStart: string;

  @Prop()
  yellowDate: string;

  @Prop()
  yellowTimeStart: string;

  @Prop({ default: 0 })
  greenZone: number;

  @Prop({ default: 0 })
  yellowZone: number;

  @Prop({ default: 0 })
  nftStakeNeed: number;

  @Prop({ default: 0 })
  comission: number;

  @Prop({ default: 0 })
  mediaComission: number;

  @Prop()
  media: Array<string>;

  @Prop()
  poolId: number;

  @Prop({ default: true })
  poolActive: boolean;

  @Prop({ default: true })
  isMainProject: boolean;

  @Prop({ default: false })
  isClaimStart: boolean;

  @Prop({ default: false })
  isRefunded: boolean;

  @Prop()
  hardCap: string;

  @Prop()
  inititialMarketCap: string;

  @Prop()
  valuation: string;

  @Prop()
  overviewText: string;

  @Prop()
  tokenUtilityText: string;

  @Prop()
  revenueText: string;

  @Prop()
  totalIssued: string;

  @Prop()
  redemptionAmount: string;

  @Prop()
  stakingText: string;

  @Prop()
  purchaseText: string;

  @Prop()
  distributionText: string;

  @Prop()
  descriptionText: string;

  @Prop()
  minInvest: number;

  @Prop()
  maxInvest: number;

  @Prop()
  totalMaxInvest: number;

  @Prop()
  blockchain: string;

  @Prop()
  platformRaise: string;

  @Prop()
  recommendations: Array<mongoose.Types.ObjectId>;

  @Prop()
  faq: Array<any>;

  @Prop()
  descriptionImage: string;

  @Prop({ default: 0 })
  fundingGoal: number;

  @Prop({ default: false })
  isETH: boolean;

  @Prop()
  ticker: string;

  @Prop()
  ethQuote: Quote;

  @Prop()
  btcQuote: Quote;

  @Prop()
  usdQuote: Quote;

  @Prop()
  regionData: RegionData;

  @Prop()
  categories: Array<string>;

  @Prop()
  achievements: Array<any>;

  @Prop()
  collaborators: Array<any>;

  @Prop({ default: [] })
  descriptionImages: Array<string>;

  @Prop({ default: false })
  isSponsored: boolean;

  @Prop({ default: false })
  isSandbox: boolean;

  @Prop({ default: false })
  isEralash: boolean;

  @Prop()
  eralashAdded: Date;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  })
  likes: mongoose.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  })
  dislikes: mongoose.Types.ObjectId[];

  @Prop()
  ohlcv: CryptoOHLCV;

  @Prop()
  dateAdded: Date;

  @Prop({ default: [] })
  history: Array<any>;

  @Prop({ default: 0 })
  circulatingSupplyPercent: number;

  @Prop({ default: 0 })
  fomoScore: number;

  @Prop({ default: [] })
  twitterFollowers: Array<any>;

  @Prop({ default: [] })
  twitterTweets: Array<any>;

  @Prop({ type: Object, default: {} })
  parsingTwitterData: ParsingTwitterData;

  @Prop({ default: 0 })
  twitterScore: number;

  @Prop({ default: 0 })
  previousTwitterScore: number;

  @Prop({ default: new Date() })
  twitterScoreUpdate: Date;

  @Prop()
  trading: string;

  @Prop()
  anomalyDetected: boolean;

  @Prop() athUsd: number;
  @Prop() athUsdDate: Date;
  @Prop() atlUsd: number;
  @Prop() atlUsdDate: Date;

  @Prop() yearHigh: number;
  @Prop() yearLow: number;
  @Prop() yearHighDate: Date;
  @Prop() yearLowDate: Date;

  @Prop({ type: Object }) priceRange: any;
  @Prop({ type: Object }) highs: any;
  @Prop({ type: Object }) lows: any;
  @Prop({ type: Object }) highsDates: any;
  @Prop({ type: Object }) lowsDates: any;
  @Prop({ type: Object }) priceChangePercentFromYearHighDate: any;
  @Prop({ type: Object }) priceChangePercentFromYearLowDate: any;
  @Prop({ type: Object }) icoPrice: any;
  @Prop({ type: Object }) xfromIco: any;
  @Prop({ type: Object }) allTimePriceChange: any;

  @Prop() twitterPerformance: number;
  @Prop() slug: string;

  @Prop({ index: true })
  coingeckoId?: string;

  @Prop()
  coinMarketCapId?: string;

  @Prop()
  dropstabId?: string;

  @Prop()
  cryptorankId?: string;

  @Prop()
  icodropsId?: string;

  @Prop() chart7d: string;
  @Prop() chartImage7d: string;
  @Prop() chartImage7dGeneratedAt: Date;
  @Prop() chartImage7dSourceLastTimestamp: Date;
  @Prop() chartImage7dPointsCount: number;
  @Prop() chartImage7dTrend: string;
  @Prop() lastPriceHistoryUpdate: Date;
  @Prop() marketDataUpdatedAt: Date;

  @Prop({ type: Object })
  mainCategory: any;

  @Prop()
  contracts: Array<any>;

  @Prop({ default: 0 })
  fundsRaised: Number;

  @Prop({ default: [], type: Array })
  fundsRounds: Array<any>;

  @Prop({ type: Object })
  roiData: any;

  @Prop({ default: 0 })
  tokensSold: number;

  @Prop()
  consensusAlgorithm: string

  @Prop({ default: [], type: Array })
  organizations: any[]

  @Prop({ default: [], type: Array })
  contributors: any[]

  @Prop()
  sector: string

  @Prop({ type: Object })
  tokenDistribution: any

  @Prop({ type: Object })
  tokenDetails: any

  @Prop()
  rank: number

  @Prop()
  tvl: number
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ dateAdded: -1 });
ProjectSchema.index({ dateAdded: -1 });
ProjectSchema.index({ priceChange: -1 });
ProjectSchema.index({ volume24h: -1 });
ProjectSchema.index({ volume24hChange: -1 });
ProjectSchema.index({ coingeckoId: 1, marketDataUpdatedAt: -1 });
ProjectSchema.index({ source: 1, sourceId: 1 });
ProjectSchema.index({ source: 1, detailUrl: 1 });
ProjectSchema.index({ source: 1, sourceUrl: 1 });
ProjectSchema.index({ projectType: 1, isSandbox: 1, status: 1 });
ProjectSchema.index({ slug: 1 });
ProjectSchema.index({ symbol: 1 });
ProjectSchema.index({ normalizedName: 1 });
ProjectSchema.index({ aliases: 1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, categories: 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, tags: 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, "rawIcoData.categories": 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, mainCategory: 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, "mainCategory.name": 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, "mainCategory.slug": 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, ecosystems: 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, launchpads: 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, status: 1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, categories: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, tags: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, "rawIcoData.categories": 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, "mainCategory.name": 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, "mainCategory.slug": 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, ecosystems: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, launchpads: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
ProjectSchema.index({ projectType: 1, projectStatus: 1, status: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
ProjectSchema.index({ "sourceMappings.source": 1, "sourceMappings.sourceId": 1 });
ProjectSchema.index({ "sourceMappings.source": 1, "sourceMappings.sourceSlug": 1 });
ProjectSchema.index({ coinMarketCapId: 1 });
ProjectSchema.index({ dropstabId: 1 });
ProjectSchema.index({ cryptorankId: 1 });
ProjectSchema.index({ icodropsId: 1 });
ProjectSchema.index({ "rawIcoData.slug": 1 });
ProjectSchema.index({ "rawIcoData.sourceId": 1 });
ProjectSchema.index({ "rawIcoData.coingeckoId": 1 });
ProjectSchema.index({ "rawIcoData.coinMarketCapId": 1 });
ProjectSchema.index({ "rawIcoData.dropstabId": 1 });
ProjectSchema.index({ "rawIcoData.dropstabSlug": 1 });

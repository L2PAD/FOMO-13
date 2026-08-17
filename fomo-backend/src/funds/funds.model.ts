import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ParsingTwitterData } from "src/twitter/project-twitter.model";

export type FundsDocument = HydratedDocument<Funds>;

export class RegionData {
  geometry: any;
  id: string;
  properties: { name: string };
  rsmKey: string;
  svgPath: string;
  type: string;
  img?: string;
  region?: string;
  subregion?: string;
}

@Schema()
export class Funds {
  @Prop()
  source: string;

  @Prop()
  sourceKey: string;

  @Prop({ required: true, default: "moderator" })
  projectStatus: string;

  @Prop({ default: false })
  isDuplicate: boolean;

  @Prop()
  originalEntityId: mongoose.Types.ObjectId;

  @Prop({ required: true, index: true })
  status: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop()
  normalizedName?: string;

  @Prop({ type: [String], default: [] })
  aliases?: string[];

  @Prop({ type: [Object], default: [] })
  sourceMappings?: Array<Record<string, any>>;

  @Prop()
  niche: string;

  @Prop()
  logo: string;

  @Prop()
  type: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  rating: string | number;

  @Prop()
  occupancy: string;

  @Prop()
  banner: string;

  @Prop({ type: Array })
  socialmedia;

  @Prop({ type: Array })
  website;

  @Prop({ type: Array })
  topfollowers;

  @Prop({ type: Array })
  links;

  @Prop({ type: Array })
  tokenMetrics;

  @Prop({ type: Array })
  fundraising;

  @Prop({ type: Array })
  news;

  @Prop({ type: Array })
  comparison;

  @Prop()
  investors: Array<any>;

  @Prop()
  team: Array<any>;

  @Prop()
  advisors: Array<any>;

  @Prop()
  partners: Array<any>;

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

  @Prop({ default: "0" })
  totalRaised: string;

  @Prop()
  lastFunding: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: "0%" })
  fullness: string | number;

  @Prop({ type: Object, default: {} })
  ratingBreakdown: Record<string, any>;

  @Prop({ type: Object, default: {} })
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
  volumeGrowth: number;

  @Prop({ default: 0 })
  totalSupply: number;

  @Prop({ default: 0 })
  totalForSale: number;

  @Prop({ default: [] })
  totalAllocation: Array<{ name: string; value: number }>;

  @Prop()
  regionData: RegionData;

  @Prop()
  industryFocus: string;

  @Prop({ default: 0 })
  investAmount: number;

  @Prop()
  foundedDate: Date;

  @Prop({ default: 0 })
  roi: number;

  @Prop({ default: 0 })
  fomoScore: number;

  @Prop({ default: 0, index: true })
  tableRating: number;

  @Prop({ default: 0, index: true })
  tableFullness: number;

  @Prop({ default: 0, index: true })
  tableRoi: number;

  @Prop({ default: 0, index: true })
  tableProjectsCount: number;

  @Prop({ default: 0, index: true })
  tableSupportedProjectsCount: number;

  @Prop({ default: "", index: true })
  tableCountry: string;

  @Prop({ index: true })
  tableLastUpdatedAt: Date;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    default: [],
  })
  projects: Array<mongoose.Types.ObjectId>;

  @Prop({ default: 0, index: true })
  projectsCount: number;

  @Prop({ default: 0, index: true })
  supportedProjectsCount: number;

  @Prop({ default: [] })
  categories: Array<string>;

  @Prop({ default: [] })
  georaphyInvestments: Array<any>;

  @Prop({ default: 0 })
  numberOfInvestments: number;

  @Prop({ default: 0 })
  averageRoi: number;

  @Prop({ default: 0 })
  currentAum: number;

  @Prop({ default: [] })
  activities: Array<any>;

  @Prop({ default: [] })
  recentExits: Array<any>;

  @Prop({ default: false })
  isSponsored: boolean;

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

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: Object, default: {} })
  parsingTwitterData: ParsingTwitterData;

  @Prop({ default: 0 })
  twitterScore: number;

  @Prop({ default: 0 })
  previousTwitterScore: number;

  @Prop({ default: new Date() })
  twitterScoreUpdate: Date;

  @Prop({ type: Object })
  binanceListing: any;

  @Prop({ default: 0 })
  publicSalesCount: number;

  @Prop({ default: 0 })
  retailRoiPercent: number;

  @Prop({ default: 0 })
  privateRoiPercent: number;

  @Prop({ default: 0 })
  totalInvestments: number;

  @Prop({ default: 0 })
  leadInvestments: number;

  @Prop({ default: 0 })
  portfolioCoinsCount: number;

  @Prop()
  dropstabId: number;

  @Prop()
  slug: string;

  @Prop()
  dropstabRank: number;

  @Prop()
  country: string;

  @Prop()
  tier: string;

  @Prop()
  websiteUrl: string;

  @Prop()
  twitterUrl: string;

  @Prop()
  linkedinUrl: string;

  @Prop()
  crunchbaseUrl: string;

  @Prop()
  countryFlag: string;

  @Prop()
  lastRoundDate: Date;

  @Prop({ type: Array, default: [] })
  saleIds: Array<number | string>;

  @Prop({ default: false })
  isLeadInvestor: boolean;

  @Prop()
  investments: string;

  @Prop({
    type: [
      {
        name: { type: String },
        amount: { type: Number },
        value: { type: Number },
      },
    ],
    default: [],
  })
  roundsByCategory: {
    name: string;
    amount: number;
    value: number;
  }[];

  @Prop({
    type: [
      {
        name: { type: String },
        amount: { type: Number },
        value: { type: Number },
      },
    ],
    default: [],
  })
  roundsByStage: {
    name: string;
    amount: number;
    value: number;
  }[];

  @Prop({
    type: [
      {
        id: { type: Number },
        investorSlug: { type: String },
        name: { type: String },
        ventureType: { type: String },
        image: { type: String },
        lastRoundDate: { type: Date },
        count: { type: Number },
      },
    ],
    default: [],
  })
  coInvestors: {
    id: number;
    investorSlug: string;
    name: string;
    ventureType: string;
    image: string;
    lastRoundDate?: Date;
    count: number;
  }[];

  @Prop({
    type: [
      {
        name: { type: String },
        slug: { type: String },
        symbol: { type: String },
        image: { type: String },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
        matchedProjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
        projectLinks: [
          {
            projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
            projectType: { type: String, enum: ["market", "project"] },
            confidence: { type: String },
            matchedBy: { type: String },
            reason: { type: String },
            linkedAt: { type: Date },
          },
        ],
        matchMethod: { type: String },
        matchConfidence: { type: Number },
        currencyId: { type: Number },
        lastRoundDate: { type: Date },
        fundsRaised: { type: Number },
        marketCap: { type: Number },
        roi: { type: Number },
        price: { type: Number },
        status: { type: String },
      },
    ],
    default: [],
  })
  portfolioCoins: {
    name: string;
    slug: string;
    symbol: string;
    image: string;
    projectId?: mongoose.Types.ObjectId;
    matchedProjectId?: mongoose.Types.ObjectId;
    projectLinks?: Array<{
      projectId: mongoose.Types.ObjectId;
      projectType: "market" | "project";
      confidence: string;
      matchedBy: string;
      reason: string;
      linkedAt?: Date;
    }>;
    matchMethod?: string;
    matchConfidence?: number;
    currencyId?: number;
    lastRoundDate?: Date;
    fundsRaised?: number;
    marketCap?: number;
    roi?: number;
    price?: number;
    status?: string;
  }[];

  @Prop({ type: Object, default: {} })
  intelInvestorData: any;

  @Prop({ type: Object, default: {} })
  investorSnapshot: any;

  @Prop()
  syncedInvestorId: mongoose.Types.ObjectId;

  @Prop()
  syncedInvestorSource: string;

  @Prop()
  syncedInvestorAt: Date;
}

export const FundsSchema = SchemaFactory.createForClass(Funds);

FundsSchema.index({ sourceKey: 1 }, { sparse: true });
FundsSchema.index({ slug: 1 }, { sparse: true });
FundsSchema.index({ source: 1, sourceKey: 1 });
FundsSchema.index({ dropstabId: 1 });
FundsSchema.index({ normalizedName: 1 });
FundsSchema.index({ aliases: 1 });
FundsSchema.index({ "sourceMappings.source": 1, "sourceMappings.sourceId": 1 });
FundsSchema.index({
  "sourceMappings.source": 1,
  "sourceMappings.sourceSlug": 1,
});
FundsSchema.index({ projects: 1 });
FundsSchema.index({ "portfolioCoins.projectId": 1 });
FundsSchema.index({ "portfolioCoins.projectLinks.projectId": 1 });
FundsSchema.index({ type: 1 });
FundsSchema.index({ niche: 1 });
FundsSchema.index({ country: 1 });
FundsSchema.index({ "regionData.region": 1 });
FundsSchema.index({ rating: -1 });
FundsSchema.index({ fullness: -1 });
FundsSchema.index({ roi: -1 });
FundsSchema.index({ averageRoi: -1 });
FundsSchema.index({ privateRoiPercent: -1 });
FundsSchema.index({ retailRoiPercent: -1 });
FundsSchema.index({ updatedAt: -1 });
FundsSchema.index({ lastRoundDate: -1 });
FundsSchema.index({ actionDate: -1 });
FundsSchema.index({ status: 1, rating: -1, projectsCount: -1, name: 1 });
FundsSchema.index({ status: 1, projectsCount: -1, rating: -1, name: 1 });
FundsSchema.index({ status: 1, roi: -1, rating: -1, name: 1 });
FundsSchema.index({
  status: 1,
  tableRating: -1,
  tableProjectsCount: -1,
  name: 1,
});
FundsSchema.index({
  status: 1,
  tableProjectsCount: -1,
  tableRating: -1,
  name: 1,
});
FundsSchema.index({ status: 1, tableRoi: -1, tableRating: -1, name: 1 });
FundsSchema.index({ status: 1, tableFullness: -1, tableRating: -1, name: 1 });
FundsSchema.index({
  status: 1,
  tableLastUpdatedAt: -1,
  tableRating: -1,
  name: 1,
});

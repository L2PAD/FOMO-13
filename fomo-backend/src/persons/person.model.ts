import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { RegionData } from "src/funds/funds.model";
import { ParsingTwitterData } from "src/twitter/project-twitter.model";

export type PersonDocument = HydratedDocument<Person>;

export class PersonInfoBlock {
  name: string;
  value: string;
  date: string;
}

export class PersonAchievements {
  totalInvestments: string;
  highestRoi: string;
  deals: Array<string>;
}

@Schema()
export class Person {
  @Prop()
  source: string;

  @Prop()
  sourceKey: string;

  @Prop({ required: true, default: "moderator" })
  projectStatus: string;

  @Prop({ default: false })
  isDuplicate: boolean;

  @Prop()
  descriptionText: string;

  @Prop()
  originalEntityId: mongoose.Types.ObjectId;

  @Prop({ required: true })
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

  @Prop()
  investments: string;

  @Prop()
  rating: string;

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

  @Prop({ default: "0%" })
  fullness: string;

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

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    default: [],
  })
  participated: Array<mongoose.Types.ObjectId>;

  @Prop({ default: [] })
  colleagues: Array<mongoose.Types.ObjectId>;

  @Prop()
  regionData: RegionData;

  @Prop()
  categories: Array<string>;

  @Prop()
  totalInvested: string;

  @Prop()
  athRoi: string;

  @Prop({ default: 0 })
  roi: number;

  @Prop({ default: 0 })
  averageRoi: number;

  @Prop()
  topFundedProject: string;

  @Prop()
  projectSupported: string;

  @Prop()
  highestRoi: string;

  @Prop()
  educationBlock: Array<PersonInfoBlock>;

  @Prop()
  experienceBlock: Array<PersonInfoBlock>;

  @Prop()
  contributionsBlock: Array<string>;

  @Prop()
  networkBlock: Array<string>;

  @Prop()
  influenceBlock: Array<string>;

  @Prop()
  achievementsBlock: PersonAchievements;

  @Prop()
  investmentPorfolio: Array<any>;

  @Prop()
  investmentDistribution: Array<any>;

  @Prop({ default: false })
  isSponsored: boolean;

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

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 0 })
  fomoScore: number;

  @Prop({ type: Object, default: {} })
  ratingBreakdown: Record<string, any>;

  @Prop({ type: Object, default: {} })
  fullnessBreakdown: Record<string, any>;

  @Prop()
  lastRatingCalculatedAt: Date;

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

export const PersonSchema = SchemaFactory.createForClass(Person);

PersonSchema.index({ sourceKey: 1 }, { sparse: true });
PersonSchema.index({ slug: 1 }, { sparse: true });
PersonSchema.index({ source: 1, sourceKey: 1 });
PersonSchema.index({ dropstabId: 1 });
PersonSchema.index({ normalizedName: 1 });
PersonSchema.index({ aliases: 1 });
PersonSchema.index({
  "sourceMappings.source": 1,
  "sourceMappings.sourceId": 1,
});
PersonSchema.index({
  "sourceMappings.source": 1,
  "sourceMappings.sourceSlug": 1,
});
PersonSchema.index({ participated: 1 });
PersonSchema.index({ "portfolioCoins.projectId": 1 });
PersonSchema.index({ "portfolioCoins.projectLinks.projectId": 1 });
PersonSchema.index({ projectStatus: 1, name: 1 });
PersonSchema.index({ projectStatus: 1, niche: 1 });
PersonSchema.index({ projectStatus: 1, type: 1 });
PersonSchema.index({ projectStatus: 1, country: 1 });
PersonSchema.index({ projectStatus: 1, "regionData.region": 1 });
PersonSchema.index({
  projectStatus: 1,
  tableRating: -1,
  tableSupportedProjectsCount: -1,
  name: 1,
});
PersonSchema.index({
  projectStatus: 1,
  tableFullness: -1,
  tableRating: -1,
  name: 1,
});
PersonSchema.index({
  projectStatus: 1,
  tableRoi: -1,
  tableRating: -1,
  name: 1,
});
PersonSchema.index({
  projectStatus: 1,
  tableLastUpdatedAt: -1,
  tableRating: -1,
  name: 1,
});

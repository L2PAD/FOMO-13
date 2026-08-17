import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { TelegramDto } from "src/telegram/dto/telegram.dto";
import { SocialNetworksDto } from "./dto/socialNetwork.dto";
import { NavItemDto } from "./dto/menu.dto";
import { RegionData } from "src/funds/funds.model";
import { ParsingTwitterData } from "src/twitter/project-twitter.model";
import {
  SpaceportClaimedBadgeEntry,
  SpaceportClaimedRewardEntry,
  SpaceportProgressionData,
} from "./spaceport-progression";

export enum UserRating {
  "birth",
  "journey_start",
  "nft_master",
  "elemental_master",
  "sensei",
  "enlighment",
}

export type UserRankType =
  | "Stellar Awakening"
  | "Celestial Master"
  | "Cosmic Explorer"
  | "Astral Sage"
  | "Galactic Navigator"
  | "Universal Enlightenment";

export type UserRiskStatus = "Default" | "Low" | "Medium" | "High";

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ unique: true })
  fomoId: number;

  @Prop({
    type: String,
  })
  email?: string;

  @Prop({ unique: false, default: "" })
  name: string;

  @Prop({ unique: false, default: "" })
  username: string;

  @Prop({})
  password: string;

  @Prop({ default: "" })
  bio: string;

  @Prop()
  code: string;

  @Prop({ default: false })
  is2FAEnabled: boolean;

  @Prop()
  twoFactorSecret?: string;

  @Prop()
  solanaAddress: string;

  @Prop()
  cosmosAddress: string;

  @Prop()
  polkadotAddress: string;

  @Prop()
  nearAddress: string;

  @Prop()
  kusamaAddress: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isCodeActivated: boolean;

  @Prop()
  inviter: string;

  @Prop({ default: 0 })
  partners: number;

  @Prop({ default: ["user"] })
  role: Array<string>;

  @Prop()
  photo: string;

  @Prop()
  rating: string;

  @Prop()
  projects: Array<any>;

  @Prop()
  persons: Array<any>;

  @Prop()
  funds: Array<any>;

  @Prop()
  news: Array<any>;

  @Prop()
  nfts: Array<any>;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  tasks: number;

  @Prop({ default: 0 })
  creater: number;

  @Prop({ default: 0 })
  staking: number;

  @Prop({ unique: true })
  wallet: string;

  @Prop()
  redFlags: number;

  @Prop({ default: new Date() })
  lastLogin: Date;

  @Prop({ default: UserRating.birth })
  status: UserRating;

  @Prop()
  multichainwallet: Array<any>;

  @Prop()
  kyc: string;

  @Prop()
  actions: Array<mongoose.Types.ObjectId>;

  @Prop({ default: new Date() })
  createDate?: Date;

  @Prop()
  telegramData: TelegramDto;

  @Prop()
  discordData: TelegramDto;

  @Prop()
  twitterData: TelegramDto;

  @Prop()
  socialNetworks: SocialNetworksDto;

  @Prop({ default: false })
  banned: boolean;

  @Prop({ default: 5 })
  projectLimit: number;

  @Prop({ default: 5 })
  newsLimit: number;

  @Prop({ default: 5 })
  personLimit: number;

  @Prop({ default: 5 })
  fundLimit: number;

  @Prop({ default: 10 })
  shareLimit: number;

  @Prop({ default: 5 })
  nftsLimit: number;

  @Prop({ default: 5 })
  eventsLimit: number;

  @Prop({ default: 0 })
  rejectedEntities: number;

  @Prop({ default: new Date() })
  lastReset: Date;

  @Prop({ default: [] })
  notifications: Array<mongoose.Types.ObjectId>;

  @Prop({ default: [] })
  privateEvents: Array<mongoose.Types.ObjectId>;

  @Prop({ default: [] })
  events: Array<any>;

  @Prop({ default: true })
  telegramNotification: boolean;

  @Prop({ default: true })
  emailNotification: boolean;

  @Prop({ default: [] })
  invitedBoards: Array<mongoose.Types.ObjectId>;

  @Prop({ default: [] })
  investedProjects: Array<mongoose.Types.ObjectId>;

  @Prop({ default: [] })
  claimedProjects: Array<mongoose.Types.ObjectId>;

  @Prop({ default: [] })
  reviewLikes: Array<{
    reviewId: mongoose.Types.ObjectId;
    dealId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
  }>;

  @Prop({ default: [] })
  reviewDislikes: Array<{
    reviewId: mongoose.Types.ObjectId;
    dealId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
  }>;

  @Prop({ default: [] })
  userMenu: Array<NavItemDto>;

  @Prop({ default: false })
  isMenuDisplay: boolean;

  @Prop({ default: "Default" })
  risk: UserRiskStatus;

  @Prop({ default: false })
  verificationStatus: boolean;

  @Prop({ default: "" })
  specialization: string;

  @Prop()
  regionData: RegionData;

  @Prop({ default: 0 })
  activityXP: number;

  @Prop({ default: 0 })
  spaceportClaimedStakingXp: number;

  @Prop({
    type: [{ key: String, claimedAt: Date, xpAwarded: Number }],
    default: [],
  })
  spaceportClaimedBadges: SpaceportClaimedBadgeEntry[];

  @Prop({
    type: [{ key: String, claimedAt: Date, xpAwarded: Number }],
    default: [],
  })
  spaceportClaimedRewards: SpaceportClaimedRewardEntry[];

  @Prop({ type: [Object], default: [] })
  moderatorTasks: Array<any>;

  @Prop({ default: [] })
  refLvlOne: Array<mongoose.Types.ObjectId>;

  @Prop({ default: [] })
  refLvlTwo: Array<mongoose.Types.ObjectId>;

  @Prop({ default: 0 })
  totalInvested: number;

  @Prop({ default: 0 })
  numberOfDeals: number;

  @Prop({ default: 0 })
  averageInvestments: number;

  @Prop()
  lastInvestments: string;

  @Prop({ default: 0 })
  averageRoi: number;

  @Prop({ default: [] })
  activity: Array<mongoose.Types.ObjectId>;

  @Prop({ default: 0 })
  nftsValue: number;

  @Prop({ default: "Stellar Awakening" })
  rank: UserRankType;

  @Prop()
  redFlagsList: Array<{ text: string; links: string; type: boolean }>;

  @Prop()
  greenFlagsList: Array<{ text: string; links: string; type: boolean }>;

  @Prop({ default: 0 })
  fomoScore: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: "0%" })
  fullness: string | number;

  @Prop({ type: Object, default: {} })
  ratingBreakdown: Record<string, any>;

  @Prop({ type: Object, default: {} })
  fullnessBreakdown: Record<string, any>;

  @Prop()
  lastRatingCalculatedAt: Date;

  @Prop({ default: 0 })
  followersCount: number;

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

  @Prop({ default: [] })
  portfolio: mongoose.Types.ObjectId[];

  @Prop({ type: Object, default: {} })
  parsingTwitterData: ParsingTwitterData;

  @Prop({ default: 0 })
  twitterScore: number;

  @Prop({ default: 0 })
  previousTwitterScore: number;

  @Prop({ default: new Date() })
  twitterScoreUpdate: Date;

  @Prop({ default: 0 })
  hoursOnline: number;

  @Prop({ default: 0 })
  portfolioBalance: number;

  @Prop({ default: [] })
  claimedTasks: Array<{
    taskId: mongoose.Types.ObjectId;
    date: Date;
  }>;

  @Prop({ type: Object, default: {} })
  spaceportProgression: SpaceportProgressionData;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  })
  followers: mongoose.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  })
  following: mongoose.Types.ObjectId[];

  @Prop({ default: [] })
  pinnedDeals: mongoose.Types.ObjectId[];

  @Prop({ default: "wallet" })
  authProvider: "wallet" | "email";

  @Prop()
  emailTmp: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  })
  blockedUsers: mongoose.Types.ObjectId[];

  @Prop({ default: new Date() })
  onlineDate: Date;

  // ── Admin lifecycle (canonical account state) ──────────────────────────────
  // active → muted → suspended → deleted (soft-delete). Hard-delete is a
  // strictly separate, restricted action and never overwrites the ledger.
  @Prop({ default: "active", enum: ["active", "muted", "suspended", "deleted"] })
  accountState: "active" | "muted" | "suspended" | "deleted";

  @Prop({ type: Date, default: null })
  mutedUntil?: Date | null;

  @Prop({ default: "" })
  muteReason?: string;

  @Prop({ type: Date, default: null })
  suspendedUntil?: Date | null;

  @Prop({ default: "" })
  suspendReason?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ default: "" })
  deleteReason?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    name: "email_1",
    partialFilterExpression: {
      email: { $type: "string", $ne: "" },
    },
  }
);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";


export type TokenUnlockDocument = HydratedDocument<TokenUnlock>;

@Schema({ strict: false, timestamps: true })
export class TokenUnlock {
  @Prop()
  source?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null })
  projectId?: mongoose.Types.ObjectId | null;

  @Prop({
    type: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
        projectType: { type: String, required: true, enum: ["market", "project"] },
        confidence: { type: String },
        matchedBy: { type: String },
        reason: { type: String },
        linkedAt: { type: Date },
      },
    ],
    default: [],
  })
  projectLinks?: Array<{
    projectId: mongoose.Types.ObjectId;
    projectType: "market" | "project";
    confidence?: string;
    matchedBy?: string;
    reason?: string;
    linkedAt?: Date;
  }>;

  @Prop()
  sourceId?: string;

  @Prop()
  sourceKey?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  detailUrl?: string;

  @Prop({ type: [String], default: [] })
  sources?: string[];

  @Prop({ required: true })
  coinId: number;

  @Prop({ required: true })
  coinSlug: string;

  @Prop({ required: true })
  coinSymbol: string;

  @Prop()
  projectName?: string;

  @Prop()
  unlockDate?: Date;

  @Prop()
  image?: string;

  @Prop()
  logo?: string;

  @Prop()
  icon?: string;

  @Prop()
  priceUsd?: number;

  @Prop({ type: [String], required: true })
  icoPlatforms: string[];

  @Prop()
  icoRoi?: number;

  @Prop()
  marketCap?: number;

  @Prop()
  fdv?: number;

  @Prop()
  circulatingSupply?: number;

  @Prop()
  totalSupply?: number;

  @Prop()
  maxSupply?: number;

  @Prop()
  circulationSupplyPercent?: number;

  @Prop({ required: true })
  totalTokensUnlockedPercent: number;

  @Prop({ required: true })
  totalTokensLockedPercent: number;

  @Prop({ required: true })
  tgeDate: Date;

  @Prop({
    type: Array,
    required: true,
  })
  allocations: any[];

  @Prop({ type: Object, default: {} })
  detailed: Object

  @Prop()
  publicVestingPercent: number

  @Prop()
  nextUnlockPercent?: number

  @Prop()
  nextUnlockValueUsd?: number

  @Prop()
  nextUnlockTokensAmount?: number

  @Prop()
  totalTokensUnlockedAmount: number

  @Prop()
  totalTokensLockedAmount: number

  @Prop()
  totalTokensUntrackedPercent: number

  @Prop()
  totalTokensUntrackedAmount: number

  @Prop()
  lastTokenUnlockDate: Date

  @Prop()
  nextTokenUnlockDate: Date

  @Prop({ default: [] })
  vesting: Array<any>

  @Prop({ default: [] })
  chart: Array<any>

  @Prop({ type: [Object], default: [] })
  unlockEvents?: Record<string, any>[];

  @Prop({ type: Object, default: null })
  nextUnlockEvent?: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  largestUnlockEvent?: Record<string, any> | null;

  @Prop({ type: [Object], default: [] })
  rawUnlockData?: Record<string, any>[];

  @Prop({ type: [Object], default: [] })
  intelSourceEvents?: Record<string, any>[];

  @Prop({ type: [Object], default: [] })
  intelNormalizedEvents?: Record<string, any>[];

  @Prop({ type: Object, default: {} })
  intelSourceSnapshot?: Record<string, any>;

  @Prop({ type: Object, default: {} })
  intelSyncMeta?: Record<string, any>;

  @Prop()
  lastParsedAt?: Date;
}

export const TokenUnlockSchema = SchemaFactory.createForClass(TokenUnlock);

TokenUnlockSchema.index({ coinSlug: 1 });
TokenUnlockSchema.index({ nextTokenUnlockDate: 1 });
TokenUnlockSchema.index({ sourceKey: 1 });
TokenUnlockSchema.index({ projectId: 1 });
TokenUnlockSchema.index({ "projectLinks.projectId": 1 });
TokenUnlockSchema.index({ "projectLinks.projectType": 1 });
TokenUnlockSchema.index({ source: 1, sourceKey: 1 });
TokenUnlockSchema.index({ source: 1, sourceId: 1 });
TokenUnlockSchema.index({ lastParsedAt: -1 });
TokenUnlockSchema.index({ "intelSyncMeta.lastSourceUpdatedAt": -1 });
TokenUnlockSchema.index({ projectName: 1 });
TokenUnlockSchema.index({ coinSymbol: 1 });
TokenUnlockSchema.index({ unlockDate: 1 });
TokenUnlockSchema.index({ coinSlug: 1, nextTokenUnlockDate: 1 });
TokenUnlockSchema.index({ coinSymbol: 1, nextTokenUnlockDate: 1 });
TokenUnlockSchema.index({ "unlockEvents.sourceKey": 1 });
TokenUnlockSchema.index({ "unlockEvents.unlockDate": 1 });
TokenUnlockSchema.index({ "unlockEvents.unlockValueUsd": -1 });

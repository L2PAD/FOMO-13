import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FundingRoundDocument = HydratedDocument<FundingRound>;

@Schema({ timestamps: true })
export class FundingRound {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ index: true, sparse: true, unique: true })
  sourceKey?: string;

  @Prop()
  source?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null })
  projectId?: Types.ObjectId | null;

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
    projectId: Types.ObjectId;
    projectType: "market" | "project";
    confidence?: string;
    matchedBy?: string;
    reason?: string;
    linkedAt?: Date;
  }>;

  @Prop()
  sourceId?: string;

  @Prop()
  sourceUpdatedAt?: Date;

  @Prop()
  lastParsedAt?: Date;

  @Prop({ type: Object, default: {} })
  intelSyncMeta?: Record<string, any>;

  @Prop()
  roundId?: string;

  @Prop()
  projectName?: string;

  @Prop({ required: true })
  coinSlug: string;

  @Prop({ required: true })
  coinSymbol: string;

  @Prop({ required: true })
  fundsRaised: number;

  @Prop({ required: true })
  preValuation: number;

  @Prop({ default: false })
  preValuationInaccurate: boolean;

  @Prop({ required: true })
  stage: string;

  @Prop([{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    investorSlug: { type: String, required: true },
    ventureType: { type: String, required: true },
    tier: { type: String, default: '' },
    image: { type: String, default: '' },
    lead: { type: Boolean, default: false }
  }])
  investors: {
    id: number;
    name: string;
    investorSlug: string;
    ventureType: string;
    tier?: string;
    lead?: boolean;
    image?: string
  }[];

  @Prop([{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    investorSlug: { type: String, required: true },
    ventureType: { type: String, required: true },
    tier: { type: String, default: '' },
    image: { type: String, default: '' },
    lead: { type: Boolean, default: false }
  }])
  leadInvestors: {
    id: number;
    name: string;
    investorSlug: string;
    ventureType: string;
    tier?: string;
    lead?: boolean;
    image?: string
  }[];

  @Prop({ default: 0 })
  twitterPerformance: number;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: null })
  tokenForSale: number | null;

  @Prop({ default: null })
  tokenPrice: number | null;

  @Prop({ default: 0 })
  totalSupplyPercent: number;

  @Prop({ default: null })
  platform: string | null;

  @Prop({ default: null })
  roiUsd: number | null;

  @Prop({ default: null })
  distributionType: string | null;

  @Prop([{
    title: { type: String, required: true },
    url: { type: String, required: true }
  }])
  details: {
    title: string;
    url: string;
  }[];

  @Prop()
  trading: boolean

  @Prop({ default: [] })
  tags: any[]

  @Prop()
  image: string

  @Prop()
  saleId: number

  @Prop({ default: false })
  hasToken: boolean

}

export const FundingRoundSchema = SchemaFactory.createForClass(FundingRound);

FundingRoundSchema.index({ coinSlug: 1 });
FundingRoundSchema.index({ coinSymbol: 1 });
FundingRoundSchema.index({ stage: 1 });
FundingRoundSchema.index({ date: 1 });
FundingRoundSchema.index({ 'investors.id': 1 });
FundingRoundSchema.index({ 'investors.name': 1 });
FundingRoundSchema.index({ sourceKey: 1 });
FundingRoundSchema.index({ projectId: 1 });
FundingRoundSchema.index({ "projectLinks.projectId": 1 });
FundingRoundSchema.index({ "projectLinks.projectType": 1 });
FundingRoundSchema.index({ source: 1, sourceKey: 1 });
FundingRoundSchema.index({ source: 1, sourceId: 1 });
FundingRoundSchema.index({ source: 1, roundId: 1 });
FundingRoundSchema.index({ sourceUpdatedAt: -1 });
FundingRoundSchema.index({ lastParsedAt: -1 });
FundingRoundSchema.index({ "intelSyncMeta.lastSourceUpdatedAt": -1 });
FundingRoundSchema.index({ projectName: 1 });
FundingRoundSchema.index({ hasToken: 1 });
FundingRoundSchema.index({ coinSlug: 1, date: -1 });
FundingRoundSchema.index({ coinSymbol: 1, date: -1 });
FundingRoundSchema.index({ coinSlug: 1, stage: 1, date: -1 });

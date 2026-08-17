import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type InvestorDocument = HydratedDocument<Investor>;

@Schema({ collection: "investors", timestamps: true, strict: false })
export class Investor {
  @Prop({ index: true })
  source: string;

  @Prop()
  sourceId: string;

  @Prop({ index: true })
  syncSource: string;

  @Prop()
  syncVersion: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ index: true })
  normalizedName: string;

  @Prop({ index: true })
  slug: string;

  @Prop({ index: true })
  detailUrl: string;

  @Prop()
  logo: string;

  @Prop()
  description: string;

  @Prop()
  type: string;

  @Prop({ type: Object })
  category: any;

  @Prop()
  country: string;

  @Prop()
  location: string;

  @Prop()
  website: string;

  @Prop({ type: Object, default: {} })
  socialLinks: any;

  @Prop({ type: Object, default: {} })
  stats: any;

  @Prop({ type: Array, default: [] })
  portfolio: Array<any>;

  @Prop({ type: Array, default: [] })
  fundraisingRounds: Array<any>;

  @Prop({ type: Array, default: [] })
  coInvestors: Array<any>;

  @Prop({ type: Array, default: [] })
  sectors: Array<any>;

  @Prop({ type: Array, default: [] })
  chains: Array<any>;

  @Prop({ type: Array, default: [] })
  tags: Array<string>;

  @Prop({ index: true })
  lastParsedAt: Date;

  @Prop({ index: true })
  lastDetailParsedAt: Date;

  @Prop({ index: true })
  lastSyncedAt: Date;

  @Prop()
  parserVersion: string;

  @Prop({ type: Object, default: {} })
  dataQuality: any;

  @Prop({ type: Object, default: {} })
  sourceRefs: any;
}

export const InvestorSchema = SchemaFactory.createForClass(Investor);

InvestorSchema.index(
  { source: 1, slug: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      source: { $type: "string" },
      slug: { $type: "string" },
    },
  }
);
InvestorSchema.index(
  { source: 1, detailUrl: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      source: { $type: "string" },
      detailUrl: { $type: "string" },
    },
  }
);
InvestorSchema.index({ normalizedName: 1 });
InvestorSchema.index({ sourceId: 1 });
InvestorSchema.index({ "sourceRefs.key": 1 });
InvestorSchema.index({ lastDetailParsedAt: -1 });
InvestorSchema.index({ lastSyncedAt: -1 });
InvestorSchema.index({ "portfolio.matchedProjectId": 1 });
InvestorSchema.index({ "portfolio.projectId": 1 });
InvestorSchema.index({ "portfolio.projectLinks.projectId": 1 });
InvestorSchema.index({ "fundraisingRounds.matchedFundingRoundId": 1 });
InvestorSchema.index({ "fundraisingRounds.projectId": 1 });
InvestorSchema.index({ "fundraisingRounds.projectLinks.projectId": 1 });

export type InvestorProjectLink = {
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
  matchMethod: "slug" | "sourceId" | "detailUrl" | "name" | "none";
  matchConfidence: number;
};

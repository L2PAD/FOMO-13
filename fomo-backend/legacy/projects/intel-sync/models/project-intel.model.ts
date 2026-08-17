import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type ProjectIntelDocument = HydratedDocument<ProjectIntel>;

@Schema({ collection: "project_intel", timestamps: true, strict: false })
export class ProjectIntel {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true })
  projectId: mongoose.Types.ObjectId;

  @Prop({ type: Object, default: {} })
  profile: {
    description?: string;
    categories?: string[];
    ecosystems?: string[];
    links?: any;
    socials?: any;
    dropstabAbout?: any;
    dropstabDescription?: any;
    dropstabCategories?: string[];
    dropstabTags?: string[];
    dropstabLinks?: any;
    dropstabSocials?: any;
  };

  @Prop({ type: Object, default: {} })
  about?: any;

  @Prop({ type: Object, default: {} })
  description?: any;

  @Prop({ type: Object, default: {} })
  fundraising: {
    totalRaised?: number;
    totalRaisedFormatted?: string;
    valuation?: number;
    valuationFormatted?: string;
    saleRounds?: any[];
    fundraisingRounds?: any[];
    dropstab?: any;
    dropstabRounds?: any[];
    investors?: any[];
    leadInvestors?: any[];
    launchpads?: any[];
    investorsCount?: number;
    roundsCount?: number;
  };

  @Prop({ type: Object, default: {} })
  dropstab?: {
    about?: any;
    description?: any;
    fundraising?: any;
    fundraisingRounds?: any[];
    sourceLinks?: any[];
    parsedAt?: Date;
    dataQuality?: any;
  };

  @Prop({ type: Object, default: {} })
  tokenomics: {
    tokenAllocation?: any[];
    initialMarketCap?: number;
    fdv?: number;
    supply?: any;
    vestingFromIcodrops?: any;
  };

  @Prop({ type: [Object], default: [] })
  team?: any[];

  @Prop({ type: Object, default: {} })
  marketData?: any;

  @Prop({ type: Object, default: {} })
  sourceRefs: {
    icodrops?: {
      sourceProjectId?: mongoose.Types.ObjectId | string;
      slug?: string;
      sourceUrl?: string;
      lastSyncedAt?: Date;
    };
    dropstab?: {
      sourceProjectId?: mongoose.Types.ObjectId | string;
      slug?: string;
      sourceUrl?: string;
      lastSyncedAt?: Date;
    };
  };

  @Prop({ type: Object, default: {} })
  dataQuality: {
    icodropsConfidence?: number;
    dropstabConfidence?: number;
    completeness?: number;
    warnings?: string[];
  };
}

export const ProjectIntelSchema = SchemaFactory.createForClass(ProjectIntel);

ProjectIntelSchema.index({ projectId: 1 });
ProjectIntelSchema.index({ "sourceRefs.icodrops.slug": 1 });
ProjectIntelSchema.index({ "sourceRefs.dropstab.slug": 1 });
ProjectIntelSchema.index({ updatedAt: -1 });

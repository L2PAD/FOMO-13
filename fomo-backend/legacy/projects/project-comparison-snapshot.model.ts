import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProjectComparisonSnapshotDocument = HydratedDocument<ProjectComparisonSnapshot>;

@Schema({ collection: "project_comparison_snapshots", strict: false })
export class ProjectComparisonSnapshot {
  @Prop({ type: Types.ObjectId, ref: "Project", required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, index: true })
  slug: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true, index: true })
  dateBucket: string;

  @Prop({ default: "hourly", index: true })
  bucketGranularity?: "hourly" | "daily" | "weekly" | "monthly";

  @Prop({ default: null })
  price?: number | null;

  @Prop({ default: null })
  marketCap?: number | null;

  @Prop({ default: null })
  fdv?: number | null;

  @Prop({ default: null })
  volume24h?: number | null;

  @Prop({ default: null })
  roiFromIco?: number | null;

  @Prop({ default: null })
  roiFromListing?: number | null;

  @Prop({ default: null })
  athPriceToDate?: number | null;

  @Prop({ default: null })
  atlPriceToDate?: number | null;

  @Prop({ default: null })
  circulatingSupply?: number | null;

  @Prop({ default: null })
  totalSupply?: number | null;

  @Prop({ default: null })
  industryAverageMarketCap?: number | null;

  @Prop({ default: null })
  industryAverageFDV?: number | null;

  @Prop({ default: null })
  industryAverageROI?: number | null;

  @Prop({ default: null })
  industryMedianROI?: number | null;

  @Prop({ default: null })
  industryTopQuartileROI?: number | null;

  @Prop({ default: null, index: true })
  categoryRank?: number | null;

  @Prop({ default: null, index: true })
  roiRank?: number | null;

  @Prop({ type: [String], default: [], index: true })
  categories?: string[];

  @Prop({ type: [String], default: [], index: true })
  chains?: string[];

  @Prop({ default: null })
  launchYear?: number | null;

  @Prop({ default: null })
  fundraisingRange?: string | null;

  @Prop({ default: null })
  fundraisingEfficiency?: number | null;

  @Prop({ type: Object, default: {} })
  industryAverages?: any;

  @Prop({ type: Object, default: {} })
  rankings?: any;

  @Prop({ type: Object, default: {} })
  dataQuality?: any;

  @Prop({ default: Date.now, index: true })
  createdAt: Date;
}

export const ProjectComparisonSnapshotSchema =
  SchemaFactory.createForClass(ProjectComparisonSnapshot);

ProjectComparisonSnapshotSchema.index({ projectId: 1, timestamp: 1 });
ProjectComparisonSnapshotSchema.index({ slug: 1, timestamp: 1 });
ProjectComparisonSnapshotSchema.index({ projectId: 1, bucketGranularity: 1, timestamp: 1 });
ProjectComparisonSnapshotSchema.index({ slug: 1, bucketGranularity: 1, timestamp: 1 });
ProjectComparisonSnapshotSchema.index({ timestamp: 1 });
ProjectComparisonSnapshotSchema.index({ projectId: 1, dateBucket: 1 }, { unique: true });
ProjectComparisonSnapshotSchema.index({ categories: 1 });
ProjectComparisonSnapshotSchema.index({ roiRank: 1 });
ProjectComparisonSnapshotSchema.index({ createdAt: 1 });

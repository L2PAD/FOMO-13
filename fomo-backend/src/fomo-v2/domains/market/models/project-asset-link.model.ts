import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_ASSET_LINK_RELATION_TYPES,
  FOMO_V2_CONFIDENCE_LEVELS,
  FOMO_V2_LINK_STATUSES,
  FomoV2AssetLinkRelationType,
  FomoV2Confidence,
  FomoV2LinkStatus,
} from "../../../fomo-v2.types";

export type FomoV2ProjectAssetLinkDocument = HydratedDocument<FomoV2ProjectAssetLink>;

@Schema({ collection: "project_asset_links", timestamps: true, strict: true, autoIndex: false })
export class FomoV2ProjectAssetLink {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject", required: true })
  canonicalProjectId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset", required: true })
  marketAssetId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: FOMO_V2_ASSET_LINK_RELATION_TYPES, default: "primary_token" })
  relationType: FomoV2AssetLinkRelationType;

  @Prop({ type: String, required: true, enum: FOMO_V2_LINK_STATUSES, default: "proposed" })
  status: FomoV2LinkStatus;

  @Prop({ type: String, enum: FOMO_V2_CONFIDENCE_LEVELS, default: "none" })
  confidence?: FomoV2Confidence;

  @Prop()
  source?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceSnapshot" })
  sourceSnapshotId?: Types.ObjectId;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  matchedBy?: string;

  @Prop()
  reason?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2ProjectAssetLinkSchema = SchemaFactory.createForClass(FomoV2ProjectAssetLink);

FomoV2ProjectAssetLinkSchema.index(
  { canonicalProjectId: 1, marketAssetId: 1, relationType: 1 },
  { unique: true, name: "uniq_project_asset_links_project_asset_relation" },
);
FomoV2ProjectAssetLinkSchema.index(
  { marketAssetId: 1, relationType: 1, status: 1 },
  {
    unique: true,
    name: "uniq_project_asset_links_active_primary_asset",
    partialFilterExpression: { relationType: "primary_token", status: "active" },
  },
);
FomoV2ProjectAssetLinkSchema.index(
  { canonicalProjectId: 1, status: 1 },
  { name: "idx_project_asset_links_project_status" },
);
FomoV2ProjectAssetLinkSchema.index({ marketAssetId: 1, status: 1 }, { name: "idx_project_asset_links_asset_status" });

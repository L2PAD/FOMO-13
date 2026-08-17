import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES,
  FomoV2LaunchpadPlacementBanner,
  FomoV2LaunchpadPlacementSurface,
} from "../types";

export type FomoV2LaunchpadPlacementDocument =
  HydratedDocument<FomoV2LaunchpadPlacement>;

const FomoV2LaunchpadPlacementBannerSchema = new mongoose.Schema(
  {
    desktopUrl: { type: String, required: true },
    mobileUrl: { type: String },
    linkUrl: { type: String },
    alt: { type: String },
  },
  { _id: false, strict: true }
);

@Schema({
  collection: "launchpad_placements",
  timestamps: true,
  strict: true,
  autoIndex: false,
  optimisticConcurrency: true,
})
export class FomoV2LaunchpadPlacement {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2LaunchpadPool",
    required: true,
  })
  launchpadPoolId: Types.ObjectId;

  @Prop({
    type: String,
    enum: FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES,
    required: true,
  })
  surface: FomoV2LaunchpadPlacementSurface;

  @Prop({ type: Boolean, required: true, default: true })
  enabled: boolean;

  @Prop({ type: Boolean, required: true, default: false })
  featured: boolean;

  @Prop({ type: Boolean, required: true, default: false })
  ad: boolean;

  @Prop({ type: FomoV2LaunchpadPlacementBannerSchema, required: true })
  banner: FomoV2LaunchpadPlacementBanner;

  @Prop({ type: Number, required: true, default: 0 })
  sortOrder: number;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
}

export const FomoV2LaunchpadPlacementSchema = SchemaFactory.createForClass(
  FomoV2LaunchpadPlacement
);

FomoV2LaunchpadPlacementSchema.index(
  { launchpadPoolId: 1, surface: 1 },
  {
    unique: true,
    name: "uniq_launchpad_placement_pool_surface",
  }
);
FomoV2LaunchpadPlacementSchema.index(
  { surface: 1 },
  {
    unique: true,
    partialFilterExpression: { featured: true },
    name: "uniq_launchpad_featured_placement_surface",
  }
);
FomoV2LaunchpadPlacementSchema.index(
  {
    surface: 1,
    enabled: 1,
    featured: -1,
    ad: -1,
    sortOrder: 1,
    _id: 1,
  },
  { name: "idx_launchpad_placements_public_surface_order" }
);
FomoV2LaunchpadPlacementSchema.index(
  { updatedBy: 1, updatedAt: -1 },
  { name: "idx_launchpad_placements_admin_audit" }
);

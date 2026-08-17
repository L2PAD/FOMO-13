import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FomoV2IcoProjectReadModelDocument =
  HydratedDocument<FomoV2IcoProjectReadModel>;

@Schema({
  collection: "ico_project_read_models",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2IcoProjectReadModel {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
  })
  canonicalProjectId: Types.ObjectId;

  @Prop({ required: true })
  sourceType: string;

  @Prop()
  name?: string;

  @Prop()
  symbol?: string;

  @Prop()
  slug?: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  description?: string;

  @Prop()
  website?: string;

  @Prop({ type: [String], default: [] })
  categories?: string[];

  @Prop()
  status?: string;

  @Prop()
  launchDate?: Date;

  @Prop({ required: true, default: false })
  hasMarketData: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset" })
  marketAssetId?: Types.ObjectId;

  @Prop()
  profileCompleteness?: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2IcoProjectReadModelSchema =
  SchemaFactory.createForClass(FomoV2IcoProjectReadModel);

FomoV2IcoProjectReadModelSchema.index(
  { canonicalProjectId: 1 },
  { name: "idx_ico_project_read_models_canonical_project" },
);
FomoV2IcoProjectReadModelSchema.index(
  { sourceType: 1, slug: 1 },
  { name: "idx_ico_project_read_models_source_slug", sparse: true },
);
FomoV2IcoProjectReadModelSchema.index(
  { canonicalProjectId: 1, sourceType: 1 },
  {
    unique: true,
    name: "uniq_ico_project_read_models_project_source",
  },
);
FomoV2IcoProjectReadModelSchema.index(
  { sourceType: 1, updatedAt: -1, _id: -1 },
  { name: "idx_ico_project_read_models_source_updated" },
);

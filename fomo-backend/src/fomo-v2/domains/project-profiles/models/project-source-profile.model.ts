import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FomoV2ProjectSourceProfileDocument =
  HydratedDocument<FomoV2ProjectSourceProfile>;

@Schema({
  collection: "project_source_profiles",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ProjectSourceProfile {
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
  sourceProjectId?: string;

  @Prop()
  sourceSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  name?: string;

  @Prop()
  symbol?: string;

  @Prop()
  slug?: string;

  @Prop()
  description?: string;

  @Prop()
  website?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  socials?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    medium?: string;
    github?: string;
  };

  @Prop()
  logoUrl?: string;

  @Prop({ type: [String], default: [] })
  categories?: string[];

  @Prop()
  status?: string;

  @Prop()
  launchDate?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  sourceEntityId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceSnapshot" })
  sourceSnapshotId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2ProjectSourceProfileSchema =
  SchemaFactory.createForClass(FomoV2ProjectSourceProfile);

FomoV2ProjectSourceProfileSchema.index(
  { canonicalProjectId: 1, sourceType: 1 },
  {
    unique: true,
    name: "uniq_project_source_profiles_project_source",
  },
);
FomoV2ProjectSourceProfileSchema.index(
  { sourceType: 1, sourceSlug: 1 },
  {
    unique: true,
    name: "uniq_project_source_profiles_source_slug",
    partialFilterExpression: { sourceSlug: { $type: "string" } },
  },
);
FomoV2ProjectSourceProfileSchema.index(
  { sourceType: 1, sourceProjectId: 1 },
  {
    unique: true,
    name: "uniq_project_source_profiles_source_project_id",
    partialFilterExpression: { sourceProjectId: { $type: "string" } },
  },
);

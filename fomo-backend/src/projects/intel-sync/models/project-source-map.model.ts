import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type ProjectSource =
  | "icodrops"
  | "dropstab"
  | "coingecko"
  | "coinmarketcap"
  | "manual";

export type ProjectSourceMatchMethod =
  | "manual"
  | "exact_slug"
  | "normalized_slug"
  | "name_symbol"
  | "manual_override"
  | "website"
  | "contract"
  | "legacy";

export type ProjectSourceMapDocument = HydratedDocument<ProjectSourceMap>;

@Schema({ collection: "project_source_maps", timestamps: true, strict: false })
export class ProjectSourceMap {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true })
  projectId: mongoose.Types.ObjectId;

  @Prop({ required: true, index: true })
  source: ProjectSource;

  @Prop({ index: true })
  sourceSlug?: string;

  @Prop({ index: true })
  sourceId?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  sourceName?: string;

  @Prop()
  sourceSymbol?: string;

  @Prop()
  sourceWebsite?: string;

  @Prop({ type: [String], default: [] })
  sourceLinks?: string[];

  @Prop({ required: true })
  matchMethod: ProjectSourceMatchMethod;

  @Prop({ required: true, min: 0, max: 100 })
  confidence: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  lastSyncedAt?: Date;
}

export const ProjectSourceMapSchema = SchemaFactory.createForClass(ProjectSourceMap);

ProjectSourceMapSchema.index({ projectId: 1, source: 1 });
ProjectSourceMapSchema.index({ source: 1, sourceSlug: 1 });
ProjectSourceMapSchema.index({ source: 1, sourceId: 1 });
ProjectSourceMapSchema.index({ source: 1, sourceUrl: 1 });
ProjectSourceMapSchema.index({ isVerified: 1, confidence: -1 });

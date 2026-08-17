import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_PROJECT_DOMAIN_SOURCE_STATUSES,
  FomoV2ProjectDomainSourceStatus,
} from "../types";

export type FomoV2ProjectDomainSourceDocument =
  HydratedDocument<FomoV2ProjectDomainSource>;

@Schema({
  collection: "project_domain_sources",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ProjectDomainSource {
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
  domain: string;

  @Prop({ required: true })
  selectedSourceType: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_PROJECT_DOMAIN_SOURCE_STATUSES,
    default: "locked",
  })
  status: FomoV2ProjectDomainSourceStatus;

  @Prop()
  reason?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  createdBySyncRunId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  updatedBySyncRunId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2ProjectDomainSourceSchema = SchemaFactory.createForClass(
  FomoV2ProjectDomainSource
);

FomoV2ProjectDomainSourceSchema.index(
  { canonicalProjectId: 1, domain: 1 },
  { unique: true, name: "uniq_project_domain_sources_project_domain" }
);
FomoV2ProjectDomainSourceSchema.index(
  { domain: 1, selectedSourceType: 1 },
  { name: "idx_project_domain_sources_domain_source" }
);
FomoV2ProjectDomainSourceSchema.index(
  { canonicalProjectId: 1, status: 1 },
  { name: "idx_project_domain_sources_project_status" }
);

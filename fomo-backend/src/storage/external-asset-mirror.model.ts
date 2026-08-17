import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type ExternalAssetMirrorProvider =
  | "coingecko"
  | "dropstab"
  | "icodrops"
  | "local_uploads"
  | "unknown";

export type ExternalAssetMirrorStatus = "pending" | "ok" | "failed" | "skipped";

export interface ExternalAssetMirrorUsage {
  collection: string;
  documentId: string;
  fieldPath: string;
  sourceName?: string;
  database?: string;
}

export type ExternalAssetMirrorDocument = HydratedDocument<ExternalAssetMirror>;

const ExternalAssetMirrorUsageSchema = new mongoose.Schema(
  {
    collection: { type: String, required: true },
    documentId: { type: String, required: true },
    fieldPath: { type: String, required: true },
    sourceName: { type: String },
    database: { type: String },
  },
  { _id: false, supressReservedKeysWarning: true },
);

@Schema({
  collection: "external_asset_mirrors",
  timestamps: true,
  strict: true,
  autoIndex: false,
  supressReservedKeysWarning: true,
})
export class ExternalAssetMirror {
  @Prop({ required: true })
  sourceUrl: string;

  @Prop({ required: true })
  sourceUrlHash: string;

  @Prop({
    required: true,
    enum: ["coingecko", "dropstab", "icodrops", "local_uploads", "unknown"],
    default: "unknown",
  })
  provider: ExternalAssetMirrorProvider;

  @Prop()
  assetKey?: string;

  @Prop()
  publicUrl?: string;

  @Prop()
  contentType?: string;

  @Prop()
  size?: number;

  @Prop({
    required: true,
    enum: ["pending", "ok", "failed", "skipped"],
    default: "pending",
  })
  status: ExternalAssetMirrorStatus;

  @Prop()
  error?: string;

  @Prop()
  retryCount?: number;

  @Prop()
  lastError?: string;

  @Prop()
  lastErrorAt?: Date;

  @Prop()
  httpStatus?: number;

  @Prop({ required: true, default: Date.now })
  firstSeenAt: Date;

  @Prop()
  mirroredAt?: Date;

  @Prop()
  lastCheckedAt?: Date;

  @Prop({
    type: [ExternalAssetMirrorUsageSchema],
    default: [],
  })
  usages: ExternalAssetMirrorUsage[];
}

export const ExternalAssetMirrorSchema =
  SchemaFactory.createForClass(ExternalAssetMirror);

ExternalAssetMirrorSchema.index(
  { sourceUrlHash: 1 },
  { unique: true, name: "uniq_external_asset_mirrors_source_url_hash" },
);
ExternalAssetMirrorSchema.index(
  { status: 1 },
  { name: "idx_external_asset_mirrors_status" },
);
ExternalAssetMirrorSchema.index(
  { provider: 1 },
  { name: "idx_external_asset_mirrors_provider" },
);
ExternalAssetMirrorSchema.index(
  { publicUrl: 1 },
  { sparse: true, name: "idx_external_asset_mirrors_public_url" },
);

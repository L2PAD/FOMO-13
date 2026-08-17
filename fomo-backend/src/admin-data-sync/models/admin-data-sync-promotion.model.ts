import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export const ADMIN_DATA_SYNC_PROMOTION_STATUSES = [
  "draft",
  "approved",
  "applying",
  "applied",
  "failed",
  "rejected",
] as const;

export type AdminDataSyncPromotionStatus =
  (typeof ADMIN_DATA_SYNC_PROMOTION_STATUSES)[number];

export type AdminDataSyncPromotionDocument =
  HydratedDocument<AdminDataSyncPromotion>;

@Schema({
  collection: "admin_data_sync_promotions",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class AdminDataSyncPromotion {
  @Prop({ required: true, unique: true, index: true })
  promotionId: string;

  @Prop()
  createdByAdminId?: string;

  @Prop()
  approvedByAdminId?: string;

  @Prop()
  appliedByAdminId?: string;

  @Prop({
    type: String,
    required: true,
    enum: ADMIN_DATA_SYNC_PROMOTION_STATUSES,
    index: true,
  })
  status: AdminDataSyncPromotionStatus;

  @Prop({ required: true })
  sourceDb: string;

  @Prop({ required: true })
  targetDb: string;

  @Prop({ type: [String], default: [] })
  selectedCollections: string[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  selectedFilters?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  diffSummary?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  diffDetails?: Record<string, any>;

  @Prop()
  backupPath?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  appliedSummary?: Record<string, any>;

  @Prop()
  errorSummary?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  appliedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminDataSyncPromotionSchema =
  SchemaFactory.createForClass(AdminDataSyncPromotion);

AdminDataSyncPromotionSchema.index(
  { status: 1, createdAt: -1 },
  { name: "idx_admin_data_sync_promotions_status_created" }
);
AdminDataSyncPromotionSchema.index(
  { createdAt: -1 },
  { name: "idx_admin_data_sync_promotions_created_desc" }
);


import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type AdminDataSyncSnapshotDocument =
  HydratedDocument<AdminDataSyncSnapshot>;

@Schema({
  collection: "admin_data_sync_snapshots",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class AdminDataSyncSnapshot {
  @Prop({ required: true, index: true })
  snapshotId: string;

  @Prop({ required: true, enum: ["promotion_apply_backup"] })
  type: "promotion_apply_backup";

  @Prop()
  promotionId?: string;

  @Prop()
  createdByAdminId?: string;

  @Prop({ required: true })
  sourceDb: string;

  @Prop({ required: true })
  backupPath: string;

  @Prop({ type: [String], default: [] })
  collections: string[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  documentsByCollection?: Record<string, any[]>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  countsByCollection?: Record<string, number>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminDataSyncSnapshotSchema =
  SchemaFactory.createForClass(AdminDataSyncSnapshot);

AdminDataSyncSnapshotSchema.index(
  { promotionId: 1, createdAt: -1 },
  { name: "idx_admin_data_sync_snapshots_promotion_created" }
);


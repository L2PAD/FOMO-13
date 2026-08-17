import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_LAUNCHPAD_OPERATION_STATUSES,
  FOMO_V2_LAUNCHPAD_OPERATION_TYPES,
  FomoV2LaunchpadOperationStatus,
  FomoV2LaunchpadOperationType,
} from "../types";

export type FomoV2LaunchpadOperationDocument =
  HydratedDocument<FomoV2LaunchpadOperation>;

@Schema({
  collection: "launchpad_operations",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2LaunchpadOperation {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2LaunchpadPool",
  })
  launchpadPoolId?: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  chainId: number;

  @Prop({ type: String, required: true })
  launchpadAddress: string;

  @Prop({ type: String })
  onchainPoolId?: string;

  @Prop({
    type: String,
    enum: FOMO_V2_LAUNCHPAD_OPERATION_TYPES,
    required: true,
  })
  type: FomoV2LaunchpadOperationType;

  @Prop({ type: String, required: true })
  transactionHash: string;

  @Prop({ type: String })
  from?: string;

  @Prop({ type: String })
  nonce?: string;

  @Prop({ type: Boolean })
  calldataValidated?: boolean;

  @Prop({ type: String })
  to?: string;

  @Prop({ type: String })
  blockNumber?: string;

  @Prop({ type: String })
  blockHash?: string;

  @Prop({ type: Number, min: 0 })
  confirmations?: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  params: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  requestedParams: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  observedParams: Record<string, any>;

  @Prop({
    type: String,
    enum: FOMO_V2_LAUNCHPAD_OPERATION_STATUSES,
    required: true,
    default: "pending",
  })
  status: FomoV2LaunchpadOperationStatus;

  @Prop({ type: Date, required: true })
  submittedAt: Date;

  @Prop({ type: Date })
  confirmedAt?: Date;

  @Prop({ type: Date })
  lastCheckedAt?: Date;

  @Prop({ type: String })
  verificationError?: string;

  @Prop({ type: String })
  createdBy?: string;
}

export const FomoV2LaunchpadOperationSchema = SchemaFactory.createForClass(
  FomoV2LaunchpadOperation
);

FomoV2LaunchpadOperationSchema.index(
  { chainId: 1, transactionHash: 1 },
  { unique: true, name: "uniq_launchpad_operation_chain_tx_hash" }
);
FomoV2LaunchpadOperationSchema.index(
  { launchpadPoolId: 1, createdAt: -1 },
  { name: "idx_launchpad_operations_pool_created_at" }
);
FomoV2LaunchpadOperationSchema.index(
  { status: 1, updatedAt: 1 },
  { name: "idx_launchpad_operations_pending" }
);

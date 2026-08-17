import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type FomoV2LaunchpadSyncStateDocument =
  HydratedDocument<FomoV2LaunchpadSyncState>;

@Schema({
  collection: "launchpad_sync_states",
  timestamps: true,
  strict: true,
  autoIndex: false,
  optimisticConcurrency: true,
})
export class FomoV2LaunchpadSyncState {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ type: Number, required: true, min: 1 })
  chainId: number;

  @Prop({ type: String, required: true })
  launchpadAddress: string;

  @Prop({ type: String, required: true, default: "0" })
  nextBlock: string;

  @Prop({ type: String })
  finalizedBlock?: string;

  @Prop({ type: String })
  finalizedBlockHash?: string;

  @Prop({ type: Date })
  leaseUntil?: Date;

  @Prop({ type: String })
  leaseOwner?: string;

  @Prop({ type: Date })
  lastSyncedAt?: Date;

  @Prop({ type: String })
  lastError?: string;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  consecutiveErrors: number;
}

export const FomoV2LaunchpadSyncStateSchema =
  SchemaFactory.createForClass(FomoV2LaunchpadSyncState);

FomoV2LaunchpadSyncStateSchema.index(
  { chainId: 1, launchpadAddress: 1 },
  { unique: true, name: "uniq_launchpad_sync_state_deployment" }
);

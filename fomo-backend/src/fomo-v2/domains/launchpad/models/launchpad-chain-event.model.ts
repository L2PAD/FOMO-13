import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FomoV2LaunchpadChainEventDocument =
  HydratedDocument<FomoV2LaunchpadChainEvent>;

@Schema({
  collection: "launchpad_chain_events",
  timestamps: { createdAt: true, updatedAt: false },
  strict: true,
  autoIndex: false,
})
export class FomoV2LaunchpadChainEvent {
  _id?: Types.ObjectId;
  createdAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2LaunchpadPool",
  })
  launchpadPoolId?: Types.ObjectId;

  @Prop({ type: Number, required: true, immutable: true, min: 1 })
  chainId: number;

  @Prop({ type: String, required: true, immutable: true })
  launchpadAddress: string;

  @Prop({ type: String })
  onchainPoolId?: string;

  @Prop({ type: String, required: true, immutable: true })
  transactionHash: string;

  @Prop({ type: String, required: true, immutable: true })
  logIndex: string;

  @Prop({ type: String, required: true, immutable: true })
  blockNumber: string;

  @Prop({ type: Number, required: true, immutable: true, min: 0 })
  blockNumberValue: number;

  @Prop({ type: String, required: true, immutable: true })
  blockHash: string;

  @Prop({ type: String, required: true, immutable: true })
  eventName: string;

  @Prop({ type: String })
  walletAddress?: string;

  @Prop({ type: String })
  receiptTokenId?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true, immutable: true })
  values: Record<string, any>;

  @Prop({ type: Date, required: true, immutable: true })
  observedAt: Date;
}

export const FomoV2LaunchpadChainEventSchema =
  SchemaFactory.createForClass(FomoV2LaunchpadChainEvent);

FomoV2LaunchpadChainEventSchema.index(
  { chainId: 1, launchpadAddress: 1, transactionHash: 1, logIndex: 1 },
  { unique: true, name: "uniq_launchpad_chain_event_log" }
);
FomoV2LaunchpadChainEventSchema.index(
  { chainId: 1, launchpadAddress: 1, blockNumberValue: 1, logIndex: 1 },
  { name: "idx_launchpad_chain_event_block" }
);
FomoV2LaunchpadChainEventSchema.index(
  { launchpadPoolId: 1, walletAddress: 1, blockNumber: -1 },
  { name: "idx_launchpad_chain_event_pool_wallet" }
);

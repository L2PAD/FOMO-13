import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { FomoV2LaunchpadClaimKind } from "../types";

export type FomoV2LaunchpadParticipantDocument =
  HydratedDocument<FomoV2LaunchpadParticipant>;

@Schema({
  collection: "launchpad_participants",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2LaunchpadParticipant {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2LaunchpadPool",
    required: true,
  })
  launchpadPoolId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  chainId: number;

  @Prop({ type: String, required: true })
  launchpadAddress: string;

  @Prop({ type: String, required: true })
  onchainPoolId: string;

  @Prop({ type: String, required: true })
  walletAddress: string;

  @Prop({ type: String, required: true, default: "0" })
  grossAmount: string;

  @Prop({ type: String, required: true, default: "0" })
  netAmount: string;

  @Prop({ type: String, required: true, default: "0" })
  feeAmount: string;

  @Prop({ type: String, required: true, default: "0" })
  investedAmount: string;

  @Prop({ type: [String], default: [] })
  receiptTokenIds: string[];

  @Prop({ type: [String], default: [] })
  activeStakedTokenIds: string[];

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  activeStakeCount: number;

  @Prop({ type: Boolean, required: true, default: false })
  claimed: boolean;

  @Prop({ type: String, required: true, default: "0" })
  claimAmount: string;

  @Prop({
    type: String,
    enum: ["project_token", "payment_token_refund"],
  })
  claimKind?: FomoV2LaunchpadClaimKind;

  @Prop({ type: String })
  firstSeenBlock?: string;

  @Prop({ type: String })
  lastSeenBlock?: string;

  @Prop({ type: Date })
  lastObservedAt?: Date;
}

export const FomoV2LaunchpadParticipantSchema =
  SchemaFactory.createForClass(FomoV2LaunchpadParticipant);

FomoV2LaunchpadParticipantSchema.index(
  { launchpadPoolId: 1, walletAddress: 1 },
  { unique: true, name: "uniq_launchpad_participant_pool_wallet" }
);
FomoV2LaunchpadParticipantSchema.index(
  { chainId: 1, launchpadAddress: 1, onchainPoolId: 1, netAmount: -1 },
  { name: "idx_launchpad_participant_leaderboard" }
);
FomoV2LaunchpadParticipantSchema.index(
  { chainId: 1, launchpadAddress: 1, receiptTokenIds: 1 },
  {
    unique: true,
    partialFilterExpression: { receiptTokenIds: { $type: "string" } },
    name: "uniq_launchpad_participant_receipt_token",
  }
);

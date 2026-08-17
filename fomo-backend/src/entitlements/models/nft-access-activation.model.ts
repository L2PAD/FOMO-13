import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export const NFT_ACTIVATION_STATUSES = ["ACTIVE", "EXPIRED", "REVOKED"] as const;

/**
 * Phase G — a single activation of an NFT into a temporary access pass. The
 * premium benefit belongs to (tokenId + activation), NOT to the first owner:
 * on transfer the remaining period follows the token to the new owner.
 */
@Schema({ collection: "nft_access_activations", timestamps: true })
export class NftAccessActivation {
  @Prop({ type: String, required: true, index: true })
  chainId: string;

  @Prop({ type: String, required: true, index: true, lowercase: true, trim: true })
  contractAddress: string;

  @Prop({ type: String, required: true, index: true })
  tokenId: string;

  @Prop({ type: Types.ObjectId, default: null })
  ruleId: Types.ObjectId | null;

  @Prop({ type: Date, default: () => new Date() })
  activatedAt: Date;

  @Prop({ type: Date, required: true })
  accessStartsAt: Date;

  @Prop({ type: Date, required: true })
  accessEndsAt: Date;

  @Prop({ type: Number, default: 30 })
  durationDays: number;

  @Prop({ type: Types.ObjectId, index: true })
  activatedByUserId: Types.ObjectId;

  @Prop({ type: String, default: "" })
  activatedByWallet: string;

  @Prop({ type: String, default: "" })
  currentOwnerWallet: string;

  @Prop({ type: Types.ObjectId, default: null, index: true })
  currentOwnerUserId: Types.ObjectId | null;

  @Prop({ type: String, enum: NFT_ACTIVATION_STATUSES, default: "ACTIVE", index: true })
  status: string;

  @Prop({ type: String, default: "" })
  sourceTransactionHash: string;

  @Prop({ type: String, default: "" })
  activationTransactionHash: string;

  // The membership entitlement materialized from this activation.
  @Prop({ type: String, default: "" })
  entitlementId: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export type NftAccessActivationDocument = NftAccessActivation & Document;
export const NftAccessActivationSchema = SchemaFactory.createForClass(NftAccessActivation);
// One live activation per token.
NftAccessActivationSchema.index(
  { chainId: 1, contractAddress: 1, tokenId: 1, status: 1 },
);

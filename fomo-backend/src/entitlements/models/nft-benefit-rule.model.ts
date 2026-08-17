import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * Phase G — admin-managed NFT benefit rule for a collection. Grants a TEMPORARY
 * FOMO AI Membership when a token of the collection is activated. The NFT itself
 * keeps all its native utility (Launchpad/SpacePort/Market/Rating) independently.
 */
@Schema({ collection: "nft_benefit_rules", timestamps: true })
export class NftBenefitRule {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, index: true })
  chainId: string;

  @Prop({ type: String, required: true, index: true, lowercase: true, trim: true })
  contractAddress: string;

  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  // What this activation grants. Only FOMO_AI_MEMBERSHIP for now.
  @Prop({ type: String, default: "FOMO_AI_MEMBERSHIP" })
  benefitType: string;

  // Optional product code the membership maps to (defaults to active FOMO_AI product).
  @Prop({ type: String, default: "" })
  productCode: string;

  @Prop({ type: Number, default: 30 })
  durationDays: number;

  @Prop({ type: String, enum: ["MANUAL", "AUTO"], default: "MANUAL" })
  activationMode: string;

  @Prop({ type: Boolean, default: true })
  transferableDuringActivePeriod: boolean;

  @Prop({ type: Boolean, default: false })
  reactivateAfterExpiry: boolean;

  @Prop({ type: Number, default: 1 })
  maxActivationsPerToken: number;

  // Campaign window (null = always on while enabled).
  @Prop({ type: Date, default: null })
  startsAt: Date | null;

  @Prop({ type: Date, default: null })
  endsAt: Date | null;

  @Prop({ type: Boolean, default: false })
  demo: boolean;
}

export type NftBenefitRuleDocument = NftBenefitRule & Document;
export const NftBenefitRuleSchema = SchemaFactory.createForClass(NftBenefitRule);
NftBenefitRuleSchema.index({ chainId: 1, contractAddress: 1 });

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

/**
 * MoneyLedgerEntry (Phase H) — single source of truth for FOMO Money balances.
 * Balances are ALWAYS derived from the ledger, never a mutable user.balance.
 * Idempotency: idempotencyKey unique; deposits keyed by network+txHash.
 * This is a DIFFERENT economy from AI Credits (usage units) and XP.
 */
@Schema({ collection: "money_ledger_entries", timestamps: true })
export class MoneyLedgerEntry extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, default: "USDC", index: true })
  asset: string;

  @Prop({ type: String, default: "ZKSYNC", index: true })
  network: string;

  @Prop({
    type: String,
    required: true,
    enum: [
      "DEPOSIT",
      "WITHDRAWAL",
      "PURCHASE",
      "REFUND",
      "OTC_RESERVE",
      "OTC_RELEASE",
      "OTC_SETTLEMENT",
      "P2P_RESERVE",
      "P2P_RELEASE",
      "P2P_SETTLEMENT",
      "ADMIN_ADJUSTMENT",
    ],
    index: true,
  })
  type: string;

  @Prop({ type: String, enum: ["CREDIT", "DEBIT"], required: true })
  direction: string;

  // Stored as Number (rounded to 6dp). USDC has 6 decimals.
  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: "" })
  referenceType: string;

  @Prop({ type: String, default: "" })
  referenceId: string;

  @Prop({ type: String, default: "", index: true })
  txHash: string;

  @Prop({ type: Number, default: null })
  blockNumber: number | null;

  @Prop({ type: String, required: true, unique: true })
  idempotencyKey: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String, default: "" })
  createdBy: string;
}
export const MoneyLedgerEntrySchema = SchemaFactory.createForClass(MoneyLedgerEntry);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

/**
 * Purchase (Phase H / H4 custody saga) — commercial operation paid from FOMO
 * Balance. Price is always snapshotted. Two flows share this ONE model:
 *  - LEDGER  : legacy off-chain settle (create -> RESERVED -> SETTLED).
 *  - CUSTODY : H4 on-chain escrow saga that actually reduces on-chain
 *              usdBalance(user) via safeMoneyUSD + owner adminResolveUSD.
 *
 * Additive only: legacy statuses kept for backward-compat; new saga statuses +
 * the `custody` trace are added. Provisioning always goes through the canonical
 * SubscriptionService (never touches AI credits directly). No private keys here.
 */

export const PURCHASE_STATUSES = [
  // legacy LEDGER flow
  "RESERVED", "PAID", "SETTLING",
  // H4 CUSTODY saga
  "CREATED",
  "LEDGER_RESERVED",
  "CUSTODY_ITEM_PENDING", // item lot not yet created on-chain (owner signer required)
  "CUSTODY_ITEM_READY",
  "USER_SIGNATURE_REQUIRED",
  "USER_TX_SUBMITTED",
  "CUSTODY_LOCKED",
  "OWNER_SETTLEMENT_PENDING",
  "OWNER_SETTLING", // transient lock to guarantee a single owner tx
  "OWNER_SETTLED",
  "PROVISIONING",
  "SETTLED",
  // failure / reversal branches
  "CANCELLED",
  "RELEASED",
  "OWNER_SETTLEMENT_FAILED",
  "MANUAL_REVIEW",
  "PROVISIONING_FAILED",
  "REFUND_REQUIRED",
  "REFUND_PENDING",
  "REFUND_MANUAL_REVIEW",
  "REFUNDED",
  "FAILED",
];

@Schema({ _id: false })
class CustodyTrace {
  @Prop({ type: String, default: "" }) contractAddress: string;
  @Prop({ type: Number, default: null }) networkConfigVersion: number | null;
  @Prop({ type: String, default: "" }) itemId: string;
  @Prop({ type: Number, default: 0 }) itemPrice: number;
  @Prop({ type: String, default: "" }) itemCreateTxHash: string;
  @Prop({ type: String, default: "" }) userWallet: string;
  @Prop({ type: String, default: "" }) userLockTxHash: string;
  @Prop({ type: Number, default: null }) userLockBlock: number | null;
  @Prop({ type: Date, default: null }) userLockConfirmedAt: Date | null;
  @Prop({ type: String, default: "" }) ownerCredentialId: string;
  @Prop({ type: String, default: "" }) ownerAddress: string;
  @Prop({ type: String, default: "" }) ownerSettlementTxHash: string;
  @Prop({ type: Number, default: null }) ownerSettlementBlock: number | null;
  @Prop({ type: Date, default: null }) ownerSettledAt: Date | null;
  @Prop({ type: String, default: "" }) refundTxHash: string;
  @Prop({ type: Date, default: null }) refundedAt: Date | null;
  @Prop({ type: Boolean, default: false }) takeFee: boolean;
}
const CustodyTraceSchema = SchemaFactory.createForClass(CustodyTrace);

@Schema({ collection: "money_purchases", timestamps: true })
export class Purchase extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true }) // FOMO_AI | FOMO_INTEL | AI_CREDIT_TOPUP
  productCode: string;

  @Prop({ type: String, default: "" })
  planCode: string;

  @Prop({ type: String, default: "" })
  productId: string;

  @Prop({ type: Object, default: {} })
  productSnapshot: Record<string, any>;

  @Prop({ type: Object, default: {} })
  economicsSnapshot: Record<string, any>;

  @Prop({ type: String, default: "USDC" })
  settlementAsset: string;

  @Prop({ type: String, default: "ZKSYNC" })
  network: string;

  @Prop({ type: Number, required: true })
  amount: number;

  // LEDGER (legacy) | CUSTODY (H4 on-chain escrow saga)
  @Prop({ type: String, default: "LEDGER", index: true })
  flow: string;

  @Prop({ type: String, default: "CREATED", enum: PURCHASE_STATUSES, index: true })
  status: string;

  @Prop({ type: String, default: "FOMO_BALANCE" })
  paymentSource: string;

  @Prop({ type: String, required: true, unique: true })
  idempotencyKey: string;

  @Prop({ type: String, default: "" })
  ledgerReservationId: string;

  @Prop({ type: CustodyTraceSchema, default: () => ({}) })
  custody: CustodyTrace;

  @Prop({ type: String, default: "" })
  subscriptionId: string;

  @Prop({ type: Boolean, default: false })
  isRenewal: boolean;

  @Prop({ type: Number, default: 0 })
  aiCreditsGranted: number;

  @Prop({ type: String, default: "" })
  failReason: string;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  @Prop({ type: Date, default: null })
  settledAt: Date | null;
}
export const PurchaseSchema = SchemaFactory.createForClass(Purchase);

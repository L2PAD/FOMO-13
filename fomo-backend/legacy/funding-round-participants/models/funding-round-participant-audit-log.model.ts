import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FundingRoundParticipantAuditLogDocument = HydratedDocument<FundingRoundParticipantAuditLog>;

export type FundingRoundParticipantAuditOperation =
  | "propose"
  | "verify"
  | "conflict"
  | "backfill_dry_run"
  | "backfill_apply";

export type FundingRoundParticipantAuditStatus = "success" | "skipped" | "conflict" | "error";

@Schema({ collection: "funding_round_participant_audit_logs", timestamps: { createdAt: true, updatedAt: false } })
export class FundingRoundParticipantAuditLog {
  @Prop({
    required: true,
    enum: ["propose", "verify", "conflict", "backfill_dry_run", "backfill_apply"],
  })
  operation: FundingRoundParticipantAuditOperation;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FundingRoundParticipant", default: null })
  participantId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FundingRound", default: null })
  fundingRoundId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "CanonicalProject", default: null })
  canonicalProjectId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Funds", default: null })
  fundId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Person", default: null })
  personId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  before?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  after?: any;

  @Prop()
  confidence?: number;

  @Prop()
  matchedBy?: string;

  @Prop()
  reason?: string;

  @Prop({ required: true, default: false })
  dryRun: boolean;

  @Prop({ required: true, enum: ["success", "skipped", "conflict", "error"], default: "success" })
  status: FundingRoundParticipantAuditStatus;

  @Prop()
  error?: string;
}

export const FundingRoundParticipantAuditLogSchema = SchemaFactory.createForClass(FundingRoundParticipantAuditLog);

FundingRoundParticipantAuditLogSchema.index({ operation: 1, createdAt: -1 });
FundingRoundParticipantAuditLogSchema.index({ fundingRoundId: 1, createdAt: -1 });
FundingRoundParticipantAuditLogSchema.index({ participantId: 1 });
FundingRoundParticipantAuditLogSchema.index({ status: 1, createdAt: -1 });

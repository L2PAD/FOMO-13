import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * AiProviderCredential (P51) — canonical, manageable provider API keys.
 * Secrets are stored ENCRYPTED (AES-256-GCM); the full secret is NEVER returned
 * to the frontend (only secretLast4 / masked). Supports rotation without
 * downtime and soft-revoke so historical usage stays attributable.
 */
@Schema({ collection: "ai_provider_credentials", timestamps: true })
export class AiProviderCredential {
  @Prop({ type: String, required: true, enum: ["OPENAI", "EMERGENT"], index: true })
  provider: string;

  @Prop({ type: String, default: "" })
  label: string;

  // AES-256-GCM payload: iv:tag:ciphertext (base64). Never exposed via API.
  @Prop({ type: String, default: "" })
  encryptedSecret: string;

  @Prop({ type: String, default: "" })
  secretLast4: string;

  @Prop({ type: String, default: "" })
  baseUrl: string;

  @Prop({
    type: String,
    default: "INACTIVE",
    enum: ["ACTIVE", "INACTIVE", "INVALID", "PROVIDER_BALANCE_EMPTY", "REVOKED"],
    index: true,
  })
  status: string;

  @Prop({ type: Number, default: 100 })
  priority: number;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Date, default: null })
  lastTestedAt: Date | null;

  @Prop({ type: String, default: "" })
  lastTestStatus: string; // SUCCESS | FAILED

  @Prop({ type: Number, default: null })
  lastTestLatencyMs: number | null;

  @Prop({ type: Date, default: null })
  lastUsedAt: Date | null;

  @Prop({ type: String, default: "" })
  createdBy: string;

  @Prop({ type: String, default: "" })
  updatedBy: string;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;

  @Prop({ type: String, default: "" })
  revokedBy: string;
}
export type AiProviderCredentialDocument = AiProviderCredential & Document;
export const AiProviderCredentialSchema = SchemaFactory.createForClass(AiProviderCredential);

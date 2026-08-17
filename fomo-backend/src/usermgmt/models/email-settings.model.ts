import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type EmailSettingsDocument = EmailSettings & Document;

/**
 * Resend / Email provider settings (single document).
 * The API key is stored but never returned in full to the client.
 */
@Schema({ collection: "email_settings", timestamps: true })
export class EmailSettings {
  @Prop({ default: "resend" })
  provider: string;

  @Prop({ default: "" })
  apiKey: string;

  @Prop({ default: "" })
  fromEmail: string;

  @Prop({ default: "" })
  fromName: string;

  @Prop({ default: "" })
  replyTo: string;

  // not_configured | configured | error
  @Prop({ default: "not_configured" })
  status: string;
}

export const EmailSettingsSchema = SchemaFactory.createForClass(EmailSettings);

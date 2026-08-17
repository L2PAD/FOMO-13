import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserInviteDocument = UserInvite & Document;

@Schema({ collection: "user_invites", timestamps: true })
export class UserInvite {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ default: null })
  userId?: string;

  @Prop({ default: "" })
  invitedBy?: string;

  @Prop({ default: "" })
  reason?: string;

  // pending (queued, provider configured) | not_sent (provider missing) | sent | error | accepted
  @Prop({ default: "not_sent" })
  status: string;

  @Prop({ default: "" })
  token?: string;

  @Prop({ default: null })
  sentAt?: Date | null;

  @Prop({ default: "" })
  note?: string;
}

export const UserInviteSchema = SchemaFactory.createForClass(UserInvite);

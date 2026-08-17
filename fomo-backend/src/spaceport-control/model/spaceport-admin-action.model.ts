import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** Audit trail for owner-signed Contract Control actions (no keys stored). */
@Schema({ timestamps: true, collection: 'spaceport_admin_actions' })
export class SpaceportAdminAction extends Document {
  @Prop({ type: Number, required: true }) chainId: number;
  @Prop({ type: String, required: true }) action: string; // setSalePaused | setPrice | setMergeStartTime ...
  @Prop({ type: String, required: true, trim: true, lowercase: true }) contractAddress: string;
  @Prop({ type: Object, default: {} }) params: Record<string, any>;
  @Prop({ type: String, default: null }) beforeValue?: string | null;
  @Prop({ type: String, default: null }) afterValue?: string | null;
  @Prop({ type: String, trim: true, lowercase: true, default: null }) actorWallet?: string | null;
  @Prop({ type: String, default: null }) actorUserId?: string | null;
  @Prop({ type: String, trim: true, lowercase: true, default: null }) txHash?: string | null;
  @Prop({ type: String, default: 'prepared' }) status: string; // prepared | submitted | confirmed | failed | verified
  @Prop({ type: Boolean, default: false }) ownerVerified: boolean;
}

export const SpaceportAdminActionSchema = SchemaFactory.createForClass(SpaceportAdminAction);
SpaceportAdminActionSchema.index({ chainId: 1, createdAt: -1 });
SpaceportAdminActionSchema.index({ txHash: 1 });

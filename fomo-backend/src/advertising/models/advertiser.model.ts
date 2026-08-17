import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdAdvertiserDocument = HydratedDocument<AdAdvertiser>;

@Schema({ collection: 'ad_advertisers', timestamps: true })
export class AdAdvertiser {
  @Prop({ required: true }) name: string;
  @Prop({ default: '' }) contactEmail: string;
  @Prop({ default: '' }) website: string;
  @Prop({ default: '' }) logoUrl: string;
  @Prop({ default: '' }) notes: string;
}

export const AdAdvertiserSchema = SchemaFactory.createForClass(AdAdvertiser);

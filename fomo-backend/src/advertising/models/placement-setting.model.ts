import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdPlacementSettingDocument = AdPlacementSetting & Document;

/**
 * Per-placement admin override. Lets admins turn a local placement on/off per page
 * without touching the code registry. Absence of a row => enabled by default.
 */
@Schema({ collection: 'ad_placement_settings', timestamps: true })
export class AdPlacementSetting {
  @Prop({ required: true, unique: true, index: true }) code: string;
  @Prop({ default: true }) enabled: boolean;

  // What renders in this slot for the public site:
  //   'ads'    — serve paid ads (fallback to the "Your ad here" form when unfilled)
  //   'form'   — always show the "Your ad here" request form (ads suppressed here)
  //   'rotate' — alternate between the ad and the request form on a timer
  @Prop({ default: 'ads' }) mode: string;

  // Rotation timings (seconds) used when mode === 'rotate'.
  @Prop({ default: 30 }) rotateAdSeconds: number;
  @Prop({ default: 10 }) rotateFormSeconds: number;
}

export const AdPlacementSettingSchema = SchemaFactory.createForClass(AdPlacementSetting);

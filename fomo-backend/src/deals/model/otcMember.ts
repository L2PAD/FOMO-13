import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OtcMemberDocument = HydratedDocument<OtcMember>;

@Schema({ timestamps: true })
export class OtcMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  totalSales: number;

  @Prop({ default: 0 })
  totalPurchases: number;

  @Prop({ default: 0 })
  totalUsdcSales: number;

  @Prop({ default: 0 })
  totalEthSales: number;

  @Prop({ default: 0 })
  totalUsdcPurchases: number;

  @Prop({ default: 0 })
  totalEthPurchases: number;

  @Prop({ type: [Types.ObjectId], ref: 'Deal', default: [] })
  deals: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  lastDeal: Date | null;
}

export const OtcMemberSchema = SchemaFactory.createForClass(OtcMember);

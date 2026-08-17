import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'spaceport_purchases',
})
export class SpaceportPurchase extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    required: true,
    index: true,
  })
  userId: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  walletAddress: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  txHash: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  totalPrice: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  totalPriceRaw: string;

  @Prop({
    type: Number,
    default: 6,
    min: 0,
  })
  tokenDecimals: number;

  @Prop({
    type: String,
    trim: true,
  })
  paymentTokenAddress?: string;

  @Prop({
    type: String,
    trim: true,
  })
  marketAddress?: string;

  @Prop({
    type: String,
    trim: true,
  })
  nftAddress?: string;

  @Prop({
    type: Number,
  })
  blockNumber?: number;

  @Prop({
    type: Date,
    required: true,
  })
  purchasedAt: Date;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  referralAddress?: string;

  @Prop({
    type: Object,
    default: {},
  })
  metadata?: Record<string, any>;

  @Prop({
    type: Date,
  })
  createdAt: Date;

  @Prop({
    type: Date,
  })
  updatedAt: Date;
}

export const SpaceportPurchaseSchema = SchemaFactory.createForClass(SpaceportPurchase);

SpaceportPurchaseSchema.index({ userId: 1, purchasedAt: -1 });
SpaceportPurchaseSchema.index({ walletAddress: 1, purchasedAt: -1 });
SpaceportPurchaseSchema.index({ txHash: 1 }, { unique: true });

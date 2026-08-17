import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'spaceport_fusions',
})
export class SpaceportFusion extends Document {
  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  walletAddress: string;

  @Prop({
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  })
  nftAddress?: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  txHash: string;

  @Prop({
    type: Number,
    min: 0,
  })
  tokenId1?: number;

  @Prop({
    type: Number,
    min: 0,
  })
  tokenId2?: number;

  @Prop({
    type: Number,
    min: 0,
    index: true,
  })
  resultTokenId?: number;

  @Prop({
    type: Number,
    min: 0,
  })
  resultRarityId?: number;

  @Prop({
    type: String,
    trim: true,
  })
  resultRarityName?: string;

  @Prop({
    type: Number,
    min: 0,
  })
  chainId?: number;

  @Prop({
    type: Number,
    min: 0,
  })
  blockNumber?: number;

  @Prop({
    type: Number,
    min: 0,
    default: 0,
  })
  transactionIndex?: number;

  @Prop({
    type: Number,
    min: 0,
    default: 0,
  })
  logIndex?: number;

  @Prop({
    type: Date,
    required: true,
  })
  mergedAt: Date;

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

export const SpaceportFusionSchema =
  SchemaFactory.createForClass(SpaceportFusion);

SpaceportFusionSchema.index({ txHash: 1, logIndex: 1 }, { unique: true });
SpaceportFusionSchema.index({ walletAddress: 1, mergedAt: -1 });

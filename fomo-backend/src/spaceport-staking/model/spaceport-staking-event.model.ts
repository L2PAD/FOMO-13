import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SpaceportStakingAction } from '../dto/create-spaceport-staking-event.dto';

@Schema({
  timestamps: true,
  collection: 'spaceport_staking_events',
})
export class SpaceportStakingEvent extends Document {
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
    type: Number,
    required: true,
    index: true,
    min: 0,
  })
  tokenId: number;

  @Prop({
    type: String,
    required: true,
    enum: ['stake', 'unstake'],
    index: true,
  })
  action: SpaceportStakingAction;

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
    default: 0,
  })
  chainId?: number;

  @Prop({
    type: Number,
    default: 0,
    index: true,
  })
  blockNumber?: number;

  @Prop({
    type: Number,
    default: 0,
  })
  transactionIndex?: number;

  @Prop({
    type: Number,
    default: 0,
  })
  logIndex?: number;

  @Prop({
    type: Date,
  })
  stakedAt?: Date;

  @Prop({
    type: Date,
  })
  unstakedAt?: Date;

  @Prop({
    type: Number,
    min: 0,
  })
  stakedSeconds?: number;

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

export const SpaceportStakingEventSchema =
  SchemaFactory.createForClass(SpaceportStakingEvent);

SpaceportStakingEventSchema.index(
  { txHash: 1, logIndex: 1, tokenId: 1, action: 1 },
  { unique: true },
);
SpaceportStakingEventSchema.index({ walletAddress: 1, tokenId: 1, createdAt: -1 });

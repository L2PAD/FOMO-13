import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'spaceport_openings',
})
export class SpaceportOpening extends Document {
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
    min: 0,
    index: true,
  })
  tokenId: number;

  @Prop({
    type: String,
    trim: true,
    lowercase: true,
  })
  txHash?: string;

  @Prop({
    type: Date,
    required: true,
  })
  openedAt: Date;

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

export const SpaceportOpeningSchema =
  SchemaFactory.createForClass(SpaceportOpening);

SpaceportOpeningSchema.index(
  { nftAddress: 1, tokenId: 1 },
  { unique: true, partialFilterExpression: { nftAddress: { $exists: true } } },
);
SpaceportOpeningSchema.index({ walletAddress: 1, openedAt: -1 });

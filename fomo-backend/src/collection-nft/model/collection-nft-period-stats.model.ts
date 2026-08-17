import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CollectionStatsCurrency } from './collection-nft-market-snapshot.model';

export type CollectionNftPeriodStatsDocument =
  HydratedDocument<CollectionNftPeriodStats>;

export type CollectionStatsPeriod = '1m' | '5m' | '1h' | '24h' | '7d' | '1y';

@Schema({ collection: 'collection_nft_period_stats' })
export class CollectionNftPeriodStats {
  @Prop({ required: true, index: true })
  collectionAddress: string;

  @Prop({ type: mongoose.Types.ObjectId, default: null, index: true })
  collectionId: mongoose.Types.ObjectId | null;

  @Prop({ type: String, required: true, enum: ['ETH', 'USDC'], index: true })
  currency: CollectionStatsCurrency;

  @Prop({ type: String, required: true, enum: ['1m', '5m', '1h', '24h', '7d', '1y'], index: true })
  period: CollectionStatsPeriod;

  @Prop({ required: true })
  windowStart: Date;

  @Prop({ required: true })
  windowEnd: Date;

  @Prop({ required: true, default: 0 })
  lowPrice: number;

  @Prop({ required: true, default: 0 })
  highPrice: number;

  @Prop({ required: true, default: 0 })
  avgPrice: number;

  @Prop({ required: true, default: 0 })
  fromAvgPrice: number;

  @Prop({ required: true, default: 0 })
  toAvgPrice: number;

  @Prop({ required: true, default: 0 })
  growthAbs: number;

  @Prop({ required: true, default: 0 })
  growthPercent: number;

  @Prop({ required: true, default: 0 })
  samplesCount: number;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CollectionNftPeriodStatsSchema =
  SchemaFactory.createForClass(CollectionNftPeriodStats);

CollectionNftPeriodStatsSchema.index(
  { collectionAddress: 1, currency: 1, period: 1 },
  { unique: true, name: 'collection_currency_period_unique' }
);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type CollectionNftMarketSnapshotDocument =
  HydratedDocument<CollectionNftMarketSnapshot>;

export type CollectionStatsCurrency = 'ETH' | 'USDC';

@Schema({ collection: 'collection_nft_market_snapshots' })
export class CollectionNftMarketSnapshot {
  @Prop({ required: true, index: true })
  collectionAddress: string;

  @Prop({ type: mongoose.Types.ObjectId, default: null, index: true })
  collectionId: mongoose.Types.ObjectId | null;

  @Prop({ type: String, required: true, enum: ['ETH', 'USDC'], index: true })
  currency: CollectionStatsCurrency;

  @Prop({ required: true, index: true })
  bucketStart: Date;

  @Prop({ required: true, default: 0 })
  lowPrice: number;

  @Prop({ required: true, default: 0 })
  highPrice: number;

  @Prop({ required: true, default: 0 })
  avgPrice: number;

  @Prop({ required: true, default: 0 })
  listingsCount: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CollectionNftMarketSnapshotSchema = SchemaFactory.createForClass(
  CollectionNftMarketSnapshot
);

CollectionNftMarketSnapshotSchema.index(
  { collectionAddress: 1, currency: 1, bucketStart: 1 },
  { unique: true, name: 'collection_currency_bucket_unique' }
);

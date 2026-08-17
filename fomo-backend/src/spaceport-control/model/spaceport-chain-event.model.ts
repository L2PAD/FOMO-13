import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Canonical raw chain-event cache for the Spaceport Control Center indexer.
 * Uniqueness: chainId + txHash + logIndex (idempotent re-sync).
 */
@Schema({ timestamps: true, collection: 'spaceport_chain_events' })
export class SpaceportChainEvent extends Document {
  @Prop({ type: Number, required: true, index: true })
  chainId: number;

  @Prop({ type: String, required: true, trim: true, lowercase: true, index: true })
  contractAddress: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  eventType: string; // Transfer | Purchased

  @Prop({ type: Number, required: true, index: true })
  blockNumber: number;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  txHash: string;

  @Prop({ type: Number, required: true })
  logIndex: number;

  @Prop({ type: Number, default: null })
  tokenId?: number | null;

  @Prop({ type: String, trim: true, lowercase: true, default: null })
  from?: string | null;

  @Prop({ type: String, trim: true, lowercase: true, default: null })
  to?: string | null;

  @Prop({ type: String, trim: true, lowercase: true, default: null })
  buyer?: string | null;

  @Prop({ type: Number, default: null })
  quantity?: number | null;

  @Prop({ type: String, default: null })
  amountRaw?: string | null; // token units (wei) as string

  @Prop({ type: Date, default: null })
  blockTime?: Date | null;

  @Prop({ type: Object, default: {} })
  raw?: Record<string, any>;
}

export const SpaceportChainEventSchema =
  SchemaFactory.createForClass(SpaceportChainEvent);

SpaceportChainEventSchema.index(
  { chainId: 1, txHash: 1, logIndex: 1 },
  { unique: true },
);
SpaceportChainEventSchema.index({ eventType: 1, blockNumber: -1 });
SpaceportChainEventSchema.index({ tokenId: 1, blockNumber: 1 });

/** Indexer cursor per contract+event. */
@Schema({ timestamps: true, collection: 'spaceport_index_cursors' })
export class SpaceportIndexCursor extends Document {
  @Prop({ type: Number, required: true })
  chainId: number;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  contractAddress: string;

  @Prop({ type: String, required: true })
  eventType: string;

  @Prop({ type: Number, default: 0 })
  lastProcessedBlock: number;

  @Prop({ type: Date, default: null })
  lastSyncedAt?: Date | null;
}

export const SpaceportIndexCursorSchema =
  SchemaFactory.createForClass(SpaceportIndexCursor);

SpaceportIndexCursorSchema.index(
  { chainId: 1, contractAddress: 1, eventType: 1 },
  { unique: true },
);

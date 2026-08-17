import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ShareTypes = 'public' | 'private'
export type TransactionType = 'buy' | 'sell';
export type TransactionDocument = HydratedDocument<Transaction>;
export type PortfolioDocument = HydratedDocument<Portfolio>;
export type PortfolioSystemStateDocument = HydratedDocument<PortfolioSystemState>;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true })
    portfolioId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2MarketAsset', required: true })
    projectId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2MarketAsset', required: true })
    marketAssetId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2CanonicalProject' })
    canonicalProjectId?: mongoose.Types.ObjectId;

    @Prop({ type: String, enum: ['buy', 'sell'], required: true })
    type: TransactionType;

    @Prop({ type: Number, required: true })
    quantity: number;

    @Prop({ type: String, required: true, default: 'BTC' })
    currency: string;

    @Prop({ type: Number, required: true })
    price: number;

    @Prop({ type: String, required: true, default: 'USD' })
    priceCurrency: string;

    @Prop({ type: Number, required: true })
    total: number;

    @Prop({ type: Number, default: 0 })
    gainLoss: number;

    @Prop({ type: Number, default: 0 })
    gainLossPercent: number;

    @Prop({ type: Date, required: true })
    date: Date;

    @Prop({ type: String, maxlength: 300 })
    note?: string;

    @Prop({ type: String, enum: ['percent', 'usd'] })
    feeType?: 'percent' | 'usd';

    @Prop({ type: Number, default: 0 })
    feeAmount: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioAsset' })
    portfolioAssetId?: mongoose.Types.ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

@Schema()
export class PortfolioPerformance {
    @Prop({ type: Number, default: 0 })
    usd: number;

    @Prop({ type: Number, default: 0 })
    btc: number;

    @Prop({ type: Number, default: 0 })
    eth: number;
}

export const PortfolioPerformanceSchema = SchemaFactory.createForClass(PortfolioPerformance);

@Schema()
export class PortfolioAsset {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2MarketAsset', required: true })
    projectId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2MarketAsset', required: true })
    marketAssetId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2CanonicalProject' })
    canonicalProjectId?: mongoose.Types.ObjectId;

    @Prop({ type: Number, required: true, default: 0 })
    amount: number;

    @Prop({ type: String, required: true, default: 'BTC' })
    currency: string;

    @Prop({ type: String, enum: ['buy', 'sell'], required: true })
    type: 'buy' | 'sell';

    @Prop({ type: Number, required: true, default: 0 })
    price: number;

    @Prop({ type: String, required: true, default: 'USD' })
    priceCurrency: string;

    @Prop({ type: Date, required: true })
    date: Date;

    @Prop({ type: Number, required: true, default: 0 })
    totalPrice: number;

    @Prop({ type: String, maxlength: 300 })
    note?: string;

    @Prop({ type: String, enum: ['percent', 'usd'], required: true })
    feeType: 'percent' | 'usd';

    @Prop({ type: Number, default: 0 })
    feeAmount: number;

    @Prop({ type: Number, required: true })
    index: number;

    @Prop({ type: Number, default: 0 })
    currentValue: number;

    @Prop({ type: Number, default: 0 })
    avgBuyPrice: number;

    @Prop({ type: Number, default: 0 })
    profit: number;

    @Prop({ type: Number, default: 0 })
    profitPercent: number;

    @Prop()
    category: string
}

export const PortfolioAssetSchema = SchemaFactory.createForClass(PortfolioAsset);

@Schema()
export class PortfolioCalculatedAsset {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2MarketAsset', required: true })
    projectId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2MarketAsset', required: true })
    marketAssetId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'FomoV2CanonicalProject' })
    canonicalProjectId?: mongoose.Types.ObjectId;

    @Prop({ type: Number, default: 0 })
    quantity: number;

    @Prop({ type: Number, default: 0 })
    currentPrice: number;

    @Prop({ type: Number, default: 0 })
    currentValue: number;

    @Prop({ type: Number, default: 0 })
    invested: number;

    @Prop({ type: Number, default: 0 })
    averageBuyPrice: number;

    @Prop({ type: Number, default: 0 })
    unrealizedProfit: number;

    @Prop({ type: Number, default: 0 })
    profitPercent: number;

    @Prop({ type: Number, default: 0 })
    realizedProfit: number;

    @Prop({ type: Number, default: 0 })
    totalProfit: number;

    @Prop({ type: Number, default: 0 })
    totalFees: number;

    @Prop({ type: Number, default: 0 })
    allocationPercent: number;

    @Prop({ type: String, default: 'Other' })
    category: string;

    @Prop({ type: String, default: 'TKN' })
    currency: string;

    @Prop({ type: Number, default: 0 })
    index: number;

    @Prop({ type: Date })
    lastTransactionDate?: Date;
}

export const PortfolioCalculatedAssetSchema = SchemaFactory.createForClass(PortfolioCalculatedAsset);

@Schema()
export class PortfolioHistory {
    @Prop({ required: true })
    date: Date;

    @Prop()
    totalBalance: number;

    @Prop()
    totalProfit: number

    @Prop()
    totalProfitPercent: number

    @Prop()
    totalInvested?: number

    @Prop({ type: Object })
    categoryDistribution: any

    @Prop({ type: Number, default: 1 })
    btcPrice: number;

    @Prop({ type: Number, default: 1 })
    ethPrice: number;

    @Prop({ type: Boolean, default: false })
    isApproximation?: boolean;
}

export const PortfolioHistorySchema = SchemaFactory.createForClass(PortfolioHistory);

@Schema({ timestamps: true })
export class Portfolio {
    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop()
    code: string

    @Prop()
    logo?: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    creator: mongoose.Types.ObjectId;

    @Prop({ type: [PortfolioAssetSchema], default: [] })
    assets: PortfolioAsset[];

    @Prop({ type: [PortfolioCalculatedAssetSchema], default: [] })
    calculatedAssets: PortfolioCalculatedAsset[];

    @Prop({ type: Number, default: 0 })
    totalBalance: number;

    @Prop({ type: Number, default: 0 })
    profit: number;

    @Prop({ type: Number, default: 0 })
    profitPercent: number;

    @Prop({ type: [PortfolioHistorySchema], default: [] })
    history: PortfolioHistory[];

    @Prop({ type: Number, default: 0 })
    historyBackfillVersion?: number;

    @Prop({ default: false })
    isBattle: boolean

    @Prop({ default: false })
    isShare: boolean

    @Prop()
    shareType: ShareTypes

    @Prop()
    shareLink: string

    @Prop({ type: Number, default: 0 })
    realizedProfit: number;

    @Prop({ type: Number, default: 0 })
    unrealizedProfit: number;

    @Prop({ type: Number, default: 0 })
    totalInvested: number

    @Prop({ type: Number, default: 0 })
    atl: number

    @Prop({ type: Date })
    atlDate: Date

    @Prop({ type: Number, default: 0 })
    ath: number

    @Prop({ type: Date })
    athDate: Date

    @Prop({ type: Object, default: {} })
    categoryDistribution: Record<string, number>;

    @Prop({ type: PortfolioPerformanceSchema })
    performance1h: PortfolioPerformance;

    @Prop({ type: PortfolioPerformanceSchema })
    performance24h: PortfolioPerformance;

    @Prop({ type: PortfolioPerformanceSchema })
    performance7d: PortfolioPerformance;

    @Prop({ type: PortfolioPerformanceSchema })
    performance30d: PortfolioPerformance;

    @Prop({ type: PortfolioPerformanceSchema })
    performance90d: PortfolioPerformance;

    @Prop({ type: PortfolioPerformanceSchema })
    performance1y: PortfolioPerformance;

    @Prop({ type: Date })
    lastRecalculatedAt?: Date;

    @Prop({ type: Date })
    lastViewedAt?: Date;

    @Prop({ type: Date })
    lastMutationAt?: Date;

    @Prop({ type: Date })
    lastMarketSyncAt?: Date;

    @Prop({ type: Date })
    lastMarketInvalidatedAt?: Date;

    @Prop({ type: Date })
    lastMarketDataAt?: Date;

    @Prop({ type: String })
    lastMarketDataFingerprint?: string;

    @Prop({ type: Boolean, default: false })
    needsRecalculation: boolean;

    @Prop({ type: Date })
    lastHistorySnapshotAt?: Date;

    @Prop({ type: Date })
    lastHistorySnapshotCheckAt?: Date;

    @Prop({ type: Date })
    lastHistoryMarketDataAt?: Date;

    @Prop({ type: String })
    lastHistoryMarketDataFingerprint?: string;

    @Prop({ type: Number, default: 6 })
    recalculationVersion: number;

    @Prop({ type: Date })
    recalculationLockUntil?: Date;

    @Prop({ type: Date })
    recalculationStartedAt?: Date;

    @Prop({ type: String })
    lastRecalculationReason?: string;

    @Prop({ type: String })
    lastRecalculationError?: string;

    @Prop({ type: Number })
    lastRecalculationDurationMs?: number;
}

export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);

@Schema({ collection: 'portfolio_system_states', timestamps: true })
export class PortfolioSystemState {
    @Prop({ required: true, unique: true })
    key: string;

    @Prop({ type: Date })
    lastWorkerHeartbeatAt?: Date;

    @Prop({ type: String })
    workerInstanceId?: string;
}

export const PortfolioSystemStateSchema = SchemaFactory.createForClass(PortfolioSystemState);

TransactionSchema.index({ portfolioId: 1, date: -1 });
TransactionSchema.index({ projectId: 1, portfolioId: 1 });
TransactionSchema.index({ marketAssetId: 1, portfolioId: 1 });
PortfolioSchema.index({ creator: 1, name: 1 }, { unique: true });
PortfolioSchema.index({ creator: 1, createdAt: -1 });
PortfolioSchema.index({ code: 1, isShare: 1 });
PortfolioSchema.index({ isBattle: 1 });
PortfolioSchema.index({ isShare: 1, shareType: 1, updatedAt: -1 });
PortfolioSchema.index({ creator: 1, isShare: 1, shareType: 1, updatedAt: -1 });
PortfolioSchema.index({ needsRecalculation: 1, lastMutationAt: -1 });
PortfolioSchema.index({ needsRecalculation: 1, lastRecalculatedAt: 1 });
PortfolioSchema.index({ lastViewedAt: -1, lastRecalculatedAt: 1 });
PortfolioSchema.index({ lastViewedAt: -1, lastMarketSyncAt: 1 });
PortfolioSchema.index({ lastHistorySnapshotAt: 1 });
PortfolioSchema.index({ lastHistorySnapshotCheckAt: 1, lastHistorySnapshotAt: 1 });
PortfolioSchema.index({ recalculationLockUntil: 1 });
PortfolioSchema.index({ creator: 1, lastViewedAt: -1 });

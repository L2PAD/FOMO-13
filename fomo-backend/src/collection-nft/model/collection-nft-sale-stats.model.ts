import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { CompleteCollectionNftCheckoutCurrency } from "../dto/complete-checkout.dto";

export type CollectionNftSaleStatsDocument = HydratedDocument<CollectionNftSaleStats>;

@Schema({ collection: 'collection_nft_sale_stats' })
export class CollectionNftSaleStats {
    @Prop({ type: Types.ObjectId, ref: 'Collection', default: null })
    collectionId: Types.ObjectId | null

    @Prop({ default: '' })
    collectionAddress: string

    @Prop({ type: String, required: true, enum: ['ETH', 'USDC'] })
    currency: CompleteCollectionNftCheckoutCurrency

    @Prop({ default: 0 })
    totalSalesCount: number

    @Prop({ default: 0 })
    totalItemsSold: number

    @Prop({ default: 0 })
    totalVolume: number

    @Prop({ default: 0 })
    lastSalePrice: number

    @Prop({ default: null })
    lastSaleAt: Date | null

    @Prop({ default: new Date() })
    updatedAt: Date

    @Prop({ default: new Date() })
    createdAt: Date
}

export const CollectionNftSaleStatsSchema = SchemaFactory.createForClass(CollectionNftSaleStats);

CollectionNftSaleStatsSchema.index(
    { collectionAddress: 1, currency: 1 },
    { unique: true }
);

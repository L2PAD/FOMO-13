import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { CompleteCollectionNftCheckoutCurrency } from "../dto/complete-checkout.dto";

export type CollectionNftSaleDocument = HydratedDocument<CollectionNftSale>;

@Schema({ collection: 'collection_nft_sales' })
export class CollectionNftSale {
    @Prop({ type: Types.ObjectId, ref: 'CollectionNft', default: null })
    collectionNftId: Types.ObjectId | null

    @Prop({ type: Types.ObjectId, ref: 'Collection', required: true })
    collectionId: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    buyerId: Types.ObjectId

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    sellerId: Types.ObjectId

    @Prop({ default: '' })
    buyerWallet: string

    @Prop({ default: '' })
    sellerWallet: string

    @Prop({ required: true })
    nftId: number

    @Prop({ default: '' })
    name: string

    @Prop({ default: '' })
    image: string

    @Prop({ default: '' })
    tokenAddress: string

    @Prop({ required: true })
    orderId: number

    @Prop({ required: true })
    price: number

    @Prop({ type: String, required: true, enum: ['ETH', 'USDC'] })
    currency: CompleteCollectionNftCheckoutCurrency

    @Prop({ default: '' })
    txHash: string

    @Prop({ default: 0 })
    blockNumber: number

    @Prop({ default: new Date() })
    createdAt: Date
}

export const CollectionNftSaleSchema = SchemaFactory.createForClass(CollectionNftSale);

CollectionNftSaleSchema.index(
    { txHash: 1, orderId: 1, currency: 1 },
    { unique: true, sparse: true }
);

CollectionNftSaleSchema.index({ collectionId: 1, currency: 1, createdAt: -1 });
CollectionNftSaleSchema.index({ tokenAddress: 1, currency: 1, createdAt: -1 });

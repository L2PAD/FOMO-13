import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { PaymentMethod } from "./payment-method.model";
import { ReviewDto } from "../dto/create-deal.dto";

export type DealDocument = HydratedDocument<Deal>;

export type DealType = 'buy' | 'sell'

export type DealTicker = 'usd' | 'eth'

export type DealStatus = 'waiting' | 'started' | 'ended' | 'blocked' | 'forced-termination' 

export type DealAction = 'confirm' | 'reject'

export type DealServiceTypes
    =
    'Services' | 'NFT' | 'Project account' | 'Projects'
    | 'KYC' | 'Social network'

export type DealSection = 'otc' | 'p2p'

@Schema()
export class Deal {
    @Prop({ default: 'buy' })
    type: DealType

    @Prop({ default: true })
    isActive: boolean

    @Prop({ default: 'waiting' })
    status: DealStatus

    @Prop({ default: '', index: true })
    name: string

    @Prop({ default: 0 })
    amount: number

    @Prop({ default: 0 })
    price: number

    @Prop({ default: 'usd' })
    ticker: DealTicker

    @Prop({ default: Date })
    date: Date

    @Prop({ type: Date, default: Date.now })
    createDate: Date

    @Prop({ default: '' })
    description: string

    @Prop()
    dealId: number

    @Prop({ default: false })
    movingTokens: boolean

    @Prop({ required: true })
    creator: mongoose.Types.ObjectId

    @Prop()
    buyer: mongoose.Types.ObjectId | null

    @Prop()
    seller: mongoose.Types.ObjectId | null

    @Prop({ default: [] })
    offers: Array<mongoose.Types.ObjectId>

    @Prop({ default: false })
    isReservedFunds: boolean

    @Prop({ default: false })
    isMakePayment: boolean

    @Prop({ default: false })
    isRefund: boolean

    @Prop({ default: false })
    isCompleteByAdmin: boolean

    @Prop({ default: false })
    isAppeal: boolean

    @Prop({ default: new Date() })
    lastStatusUpdate: Date

    @Prop({ default: 'Services' })
    serviceType: DealServiceTypes

    @Prop({ default: [] })
    likes: mongoose.Types.ObjectId[];

    @Prop({ default: [] })
    dislikes: mongoose.Types.ObjectId[];

    @Prop({ default: 'otc' })
    section: DealSection

    @Prop()
    tokenAddress: string

    @Prop()
    transaction: string

    @Prop()
    subsection: string

    @Prop()
    smartContract: string

    @Prop()
    isRealAsset: boolean

    @Prop()
    decimals: number

    @Prop({ default: false })
    isSponsored: boolean

    @Prop({ type: [mongoose.Types.ObjectId], ref: PaymentMethod.name, default: [] })
    paymentMethods: Types.ObjectId[]

    @Prop()
    currency: string

    @Prop()
    chatId: mongoose.Types.ObjectId

    @Prop({ default: new Date() })
    lastPromotedDate: Date

    @Prop({ default: new Date() })
    nextPromotedDate: Date

    @Prop({ default: new Date() })
    promoteDateEnd: Date

    @Prop()
    orderNumber: number

    @Prop()
    expectPaymentDate: Date

    @Prop({ default: '00:30' })
    p2pSaleTime: string

    @Prop()
    p2pSaleTimeEnd: Date

    @Prop({ default: false })
    isReturnFunds: boolean

    @Prop({ default: '' })
    source: string
}

export const DealSchema = SchemaFactory.createForClass(Deal);


DealSchema.index({ isSponsored: 1, nextPromotedDate: 1, lastPromotedDate: 1, section: 1, });
DealSchema.index({ creator: 1, section: 1, createDate: -1 });
DealSchema.index({ buyer: 1, section: 1, createDate: -1 });
DealSchema.index({ seller: 1, section: 1, createDate: -1 });

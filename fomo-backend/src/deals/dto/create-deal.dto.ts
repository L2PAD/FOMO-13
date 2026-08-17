import mongoose from "mongoose"
import { DealSection, DealServiceTypes, DealTicker, DealType } from "../model/deal.model"

export class CreateDealDto {
    type: DealType
    name: string
    amount: number
    price: number
    ticker: DealTicker
    date: Date
    description: string
    dealId: number
    creator: string
    movingTokens: boolean
    buyer?: string
    serviceType: DealServiceTypes
    paymentMethods?: string[]
    currency?: string
    isRealAsset?: boolean
    isSponsored?: boolean
    section: DealSection
    p2pSaleTime?: string
}

export class ReviewDto {
    userId: mongoose.Types.ObjectId;
    dealId: mongoose.Types.ObjectId;
    date: Date;
    text: string
}


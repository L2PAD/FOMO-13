export type CompleteCollectionNftCheckoutCurrency = 'ETH' | 'USDC'

export class CompleteCollectionNftCheckoutItemDto {
    collectionNftId: string
    orderId: number
    nftId: number
    tokenAddress: string
    price: number
    currency: CompleteCollectionNftCheckoutCurrency
}

export class CompleteCollectionNftCheckoutDto {
    txHash: string
    blockNumber?: number
    items: Array<CompleteCollectionNftCheckoutItemDto>
}

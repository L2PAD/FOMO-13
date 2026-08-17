export class CreateSpaceportPurchaseDto {
  txHash: string;
  quantity: number;
  totalPrice: number;
  totalPriceRaw: string;
  tokenDecimals?: number;
  walletAddress: string;
  paymentTokenAddress?: string;
  marketAddress?: string;
  nftAddress?: string;
  blockNumber?: number;
  purchasedAt?: string;
  referralAddress?: string;
  metadata?: Record<string, any>;
}

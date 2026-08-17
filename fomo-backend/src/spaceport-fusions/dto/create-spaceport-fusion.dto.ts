export class CreateSpaceportFusionDto {
  txHash: string;
  walletAddress: string;
  nftAddress?: string;
  tokenId1?: number;
  tokenId2?: number;
  resultTokenId?: number;
  resultRarityId?: number;
  resultRarityName?: string;
  chainId?: number;
  blockNumber?: number;
  mergedAt?: string;
  metadata?: Record<string, any>;
}

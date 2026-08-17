export class CreateSpaceportOpeningDto {
  walletAddress: string;
  nftAddress?: string;
  tokenId: number;
  txHash?: string;
  openedAt?: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    rarityId?: number;
    rarityName?: string;
    tokenUri?: string;
    attributes?: Array<{
      trait_type?: string;
      value?: string | number | boolean;
    }>;
  };
}

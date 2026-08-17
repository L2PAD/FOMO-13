export type SpaceportStakingAction = 'stake' | 'unstake';

export class CreateSpaceportStakingEventDto {
  txHash: string;
  walletAddress?: string;
  nftAddress?: string;
  tokenId?: number;
  action?: SpaceportStakingAction;
  stakedAt?: string;
  unstakedAt?: string;
  stakedSeconds?: number;
  chainId?: number;
  blockNumber?: number;
  metadata?: Record<string, any>;
}

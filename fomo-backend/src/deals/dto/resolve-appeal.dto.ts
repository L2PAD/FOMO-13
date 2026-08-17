export class ResolveAppealDto {
  resolution?: string;
  forceCloseDeal?: boolean;
  recipient?: 'escrow_funder' | 'buyer';
  feeMode?: 'with_fee' | 'without_fee';
  txHash?: string;
}

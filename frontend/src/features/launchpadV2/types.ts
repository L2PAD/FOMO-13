export type RawUint = string;
export type UintInput = string | number;

export interface CreatePoolInput {
  investToken: string;
  targetAmount: RawUint;
  greenSeats: UintInput;
  yellowSeats: UintInput;
  stakeStart: UintInput;
  greenStart: UintInput;
  greenEnd: UintInput;
  yellowSlotDuration: UintInput;
  minInvestment: RawUint;
  feePercent: UintInput;
  confirmations?: number;
  /** Called immediately after broadcast, before waiting for confirmations. */
  onSubmitted?: (submission: CreatePoolSubmission) => void | Promise<void>;
}

export interface CreatePoolSubmission {
  txHash: string;
  predictedPoolId: string;
}

export interface LaunchpadMutationSubmission {
  txHash: string;
}

export interface LaunchpadMutationSubmissionAware {
  /** Called immediately after broadcast, before waiting for confirmations. */
  onSubmitted?: (
    submission: LaunchpadMutationSubmission,
  ) => void | Promise<void>;
}

export interface TransactionReceiptSummary {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  confirmations: number;
}

export interface MinedTransactionResult {
  /** Hash of the transaction which was actually mined. */
  txHash: string;
  /** Present when the wallet replaced the originally submitted transaction. */
  submittedTxHash?: string;
  receipt: TransactionReceiptSummary;
}

export interface CreatePoolResult extends MinedTransactionResult {
  predictedPoolId: string;
  /** Authoritative id decoded from PoolCreated in the mined receipt. */
  poolId: string;
  /** Explicit alias for persistence code which should not use the prediction. */
  confirmedPoolId: string;
  predictionMatched: boolean;
}

export interface LaunchpadAdminContext {
  account: string;
  chainId: number;
  owner: string;
  isOwner: boolean;
  isAdmin: boolean;
  investmentReceiver: string;
  feeReceiver: string;
  stakingNft: string;
  launchpadAddress: string;
}

export interface LaunchpadPool {
  id: string;
  investToken: string;
  targetAmount: string;
  raisedAmount: string;
  greenSeats: number;
  yellowSeats: number;
  stakeStart: string;
  greenStart: string;
  greenEnd: string;
  yellowSlotDuration: string;
  minInvestment: string;
  feePercent: number;
  projectToken: string;
  projectTokenAmount: string;
  claimEnabled: boolean;
  stakeReleaseEnabled: boolean;
  closed: boolean;
  exists: boolean;
}

export interface PoolActionInput extends LaunchpadMutationSubmissionAware {
  poolId: UintInput;
  confirmations?: number;
}

export interface UpdatePoolFeeInput extends PoolActionInput {
  feePercent: UintInput;
}

export interface UpdatePoolMinInvestmentInput extends PoolActionInput {
  minInvestment: RawUint;
}

export interface DepositProjectTokensInput extends PoolActionInput {
  projectToken: string;
  amount: RawUint;
}

export interface DepositProjectTokensResult extends MinedTransactionResult {
  approvalTransactions: MinedTransactionResult[];
}

export interface AdminAccountActionInput extends LaunchpadMutationSubmissionAware {
  account: string;
  confirmations?: number;
}

export interface ReceiverActionInput extends LaunchpadMutationSubmissionAware {
  receiver: string;
  confirmations?: number;
}

export interface TransferOwnershipInput extends LaunchpadMutationSubmissionAware {
  newOwner: string;
  confirmations?: number;
}

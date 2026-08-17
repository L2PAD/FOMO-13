import { Injectable } from "@nestjs/common";
import { Contract, Interface, JsonRpcProvider, LogDescription } from "ethers";
import {
  FomoV2LaunchpadCreateParams,
  FomoV2LaunchpadFailureKind,
  FomoV2LaunchpadOperationType,
  FomoV2LaunchpadUserAction,
} from "../types";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";

export const FOMO_V2_LAUNCHPAD_ABI = [
  "function createPool(address investToken,uint256 targetAmount,uint32 greenSeats,uint32 yellowSeats,uint64 stakeStart,uint64 greenStart,uint64 greenEnd,uint64 yellowSlotDuration,uint256 minInvestment,uint16 feePercent) returns (uint256 poolId)",
  "function updatePoolFeePercent(uint256 poolId,uint16 newFeePercent)",
  "function updatePoolMinInvestment(uint256 poolId,uint256 newMinInvestment)",
  "function depositProjectTokens(uint256 poolId,address projectToken,uint256 amount)",
  "function closePoolIfFinished(uint256 poolId)",
  "function adminUnstakeAllPoolUsers(uint256 poolId)",
  "function addAdmin(address admin)",
  "function removeAdmin(address admin)",
  "function setInvestmentReceiver(address newReceiver)",
  "function setFeeReceiver(address newReceiver)",
  "function transferOwnership(address newOwner)",
  "function invest(uint256 poolId,uint256 amount)",
  "function stakeNfts(uint256 poolId,uint256[] tokenIds)",
  "function unstakePoolNfts(uint256 poolId)",
  "function claim(uint256 receiptTokenId)",
  "function getPoolInfo(uint256 poolId) view returns (tuple(uint256 id,address investToken,uint256 targetAmount,uint256 raisedAmount,uint32 greenSeats,uint32 yellowSeats,uint64 stakeStart,uint64 greenStart,uint64 greenEnd,uint64 yellowSlotDuration,uint256 minInvestment,uint16 feePercent,address projectToken,uint256 projectTokenAmount,bool claimEnabled,bool stakeReleaseEnabled,bool closed,bool exists))",
  "function getPoolParticipants(uint256 poolId) view returns (address[])",
  "function getSortedParticipants(uint256 poolId) view returns (address[])",
  "function canUserInvestNow(uint256 poolId,address user) view returns (bool)",
  "function getUserMaxAllowedNow(uint256 poolId,address user) view returns (uint256)",
  "function getUserRank(uint256 poolId,address user) view returns (uint256)",
  "function getUserStakeCount(uint256 poolId,address user) view returns (uint256)",
  "function getUserFirstStakeTime(uint256 poolId,address user) view returns (uint64)",
  "function getUserStakedTokenIds(uint256 poolId,address user) view returns (uint256[])",
  "function getUserUnstakeablePoolsWithCounts(address user) view returns (uint256[] poolIds,uint256[] activeCounts)",
  "function isTokenStakedInPool(uint256 poolId,address user,uint256 tokenId) view returns (bool)",
  "function userTokenPoolUsageCount(address user,uint256 tokenId) view returns (uint256)",
  "function getUserYellowSlot(uint256 poolId,address user) view returns (uint256 slotStart,uint256 slotEnd)",
  "function getUserZone(uint256 poolId,address user) view returns (uint8)",
  "function positions(uint256 poolId,address user) view returns (uint256 poolId,address investor,uint256 investedAmount,uint256 receiptTokenId,bool claimed,bool exists)",
  "function getReceiptInfo(uint256 receiptTokenId) view returns (uint256 poolId,address investor,uint256 investedAmount,bool burned)",
  "function previewClaim(uint256 receiptTokenId) view returns (uint256)",
  "function stakingNft() view returns (address)",
  "function investmentReceiver() view returns (address)",
  "function feeReceiver() view returns (address)",
  "function DEFAULT_MIN_INVESTMENT() view returns (uint256)",
  "function owner() view returns (address)",
  "function admins(address user) view returns (bool)",
  "event PoolCreated(uint256 indexed poolId,address indexed investToken,uint256 targetAmount,uint32 greenSeats,uint32 yellowSeats,uint64 stakeStart,uint64 greenStart,uint64 greenEnd,uint64 yellowSlotDuration,uint256 minInvestment,uint16 feePercent)",
  "event PoolClosed(uint256 indexed poolId,uint256 raisedAmount)",
  "event PoolFeeUpdated(uint256 indexed poolId,uint16 oldFeePercent,uint16 newFeePercent)",
  "event ProjectTokensDeposited(uint256 indexed poolId,address indexed projectToken,uint256 amount)",
  "event Invested(uint256 indexed poolId,address indexed user,uint256 grossAmount,uint256 netAmount,uint256 feeAmount)",
  "event NftStaked(uint256 indexed poolId,address indexed user,uint256 indexed tokenId)",
  "event NftUnstaked(uint256 indexed poolId,address indexed user,uint256 indexed tokenId)",
  "event ReceiptMinted(uint256 indexed poolId,address indexed investor,uint256 indexed receiptTokenId)",
  "event ReceiptUpdated(uint256 indexed poolId,address indexed investor,uint256 indexed receiptTokenId,uint256 newAmount)",
  "event Claimed(uint256 indexed poolId,address indexed investor,uint256 indexed receiptTokenId,uint256 investedAmount,uint256 claimAmount)",
];

const OPERATION_METHODS: Record<
  Exclude<FomoV2LaunchpadOperationType, "create_pool">,
  string
> = {
  update_pool_fee_percent: "updatePoolFeePercent",
  update_pool_min_investment: "updatePoolMinInvestment",
  deposit_project_tokens: "depositProjectTokens",
  close_pool: "closePoolIfFinished",
  admin_unstake_all_pool_users: "adminUnstakeAllPoolUsers",
  add_admin: "addAdmin",
  remove_admin: "removeAdmin",
  set_investment_receiver: "setInvestmentReceiver",
  set_fee_receiver: "setFeeReceiver",
  transfer_ownership: "transferOwnership",
};

const POOL_OPERATION_TYPES = new Set<FomoV2LaunchpadOperationType>([
  "update_pool_fee_percent",
  "update_pool_min_investment",
  "deposit_project_tokens",
  "close_pool",
  "admin_unstake_all_pool_users",
]);

const CREATE_PARAM_FIELDS: ReadonlyArray<keyof FomoV2LaunchpadCreateParams> = [
  "investToken",
  "targetAmount",
  "greenSeats",
  "yellowSeats",
  "stakeStart",
  "greenStart",
  "greenEnd",
  "yellowSlotDuration",
  "minInvestment",
  "feePercent",
];

export type FomoV2LaunchpadVerificationStatus =
  | "pending"
  | "confirmed"
  | "failed";

export interface FomoV2LaunchpadTxVerification {
  status: FomoV2LaunchpadVerificationStatus;
  failureKind?: FomoV2LaunchpadFailureKind;
  safeToRetry: boolean;
  transactionHash: string;
  confirmations: number;
  requiredConfirmations: number;
  reason?: string;
  from?: string;
  nonce?: string;
  calldataValidated?: boolean;
  to?: string;
  blockNumber?: string;
  blockHash?: string;
  logIndex?: string;
  poolId?: string;
  replacesTransactionHash?: string;
  replacementValidated?: boolean;
  decodedParams?: Record<string, any>;
}

export interface FomoV2LaunchpadReplacementEvidence {
  transactionHash: string;
  from?: string;
  nonce?: string;
  to?: string;
  calldataValidated?: boolean;
}

export interface FomoV2LaunchpadDecodedEvent {
  eventName: string;
  transactionHash: string;
  logIndex: string;
  blockNumber: string;
  blockHash: string;
  values: Record<string, any>;
}

export interface FomoV2LaunchpadUserTxVerification {
  status: FomoV2LaunchpadVerificationStatus;
  transactionHash: string;
  action: FomoV2LaunchpadUserAction;
  confirmations: number;
  requiredConfirmations: number;
  reason?: string;
  from?: string;
  to?: string;
  blockNumber?: string;
  blockHash?: string;
  events: FomoV2LaunchpadDecodedEvent[];
}

@Injectable()
export class FomoV2LaunchpadChainService {
  private readonly launchpadInterface = new Interface(FOMO_V2_LAUNCHPAD_ABI);

  constructor(
    private readonly deploymentService: FomoV2LaunchpadDeploymentService
  ) {}

  async verifyCreateTransaction(
    transactionHash: string,
    expectedParams: FomoV2LaunchpadCreateParams,
    replacement?: FomoV2LaunchpadReplacementEvidence
  ): Promise<FomoV2LaunchpadTxVerification> {
    const base = this.verificationBase(transactionHash);
    const provider = this.provider();
    if (!provider) {
      return {
        ...base,
        status: "pending",
        reason: "FOMO_V2_LAUNCHPAD_RPC_URL is not configured.",
      };
    }

    try {
      await this.assertProviderNetwork(provider);
      const [receipt, transaction] = await Promise.all([
        provider.getTransactionReceipt(transactionHash),
        provider.getTransaction(transactionHash),
      ]);
      if (!transaction) {
        return {
          ...base,
          status: "pending",
          reason: "Transaction calldata is not available yet.",
        };
      }

      const transactionDetails: Partial<FomoV2LaunchpadTxVerification> = {
        from: String(transaction.from || receipt?.from || "").toLowerCase(),
        nonce: String(transaction.nonce),
        to: transaction.to ? String(transaction.to).toLowerCase() : undefined,
      };
      if (!this.isExpectedContract(transaction.to)) {
        return {
          ...base,
          ...transactionDetails,
          status: "failed",
          failureKind: "integrity",
          calldataValidated: false,
          reason:
            "Transaction target does not match configured Launchpad contract.",
        };
      }

      const calldataMismatch = this.createCalldataMismatch(
        transaction,
        expectedParams
      );
      if (calldataMismatch) {
        return {
          ...base,
          ...transactionDetails,
          status: "failed",
          failureKind: "integrity",
          calldataValidated: false,
          reason: calldataMismatch,
        };
      }
      transactionDetails.calldataValidated = true;

      let replacementDetails: Partial<FomoV2LaunchpadTxVerification> = {};
      if (replacement) {
        const normalizedReplacedHash =
          replacement.transactionHash.toLowerCase();
        let replacementMismatch: string | undefined;
        if (
          replacement.from &&
          replacement.nonce !== undefined &&
          replacement.to &&
          replacement.calldataValidated
        ) {
          replacementMismatch = this.persistedReplacementMismatch(
            replacement,
            transaction
          );
        } else {
          const replacedTransaction = await provider.getTransaction(
            normalizedReplacedHash
          );
          if (!replacedTransaction) {
            return {
              ...base,
              ...transactionDetails,
              status: "pending",
              replacesTransactionHash: normalizedReplacedHash,
              replacementValidated: false,
              reason:
                "Original transaction evidence is incomplete and the transaction is unavailable from RPC.",
            };
          }
          replacementMismatch = this.replacementMismatch(
            replacedTransaction,
            transaction,
            expectedParams
          );
        }
        if (replacementMismatch) {
          return {
            ...base,
            ...transactionDetails,
            status: "failed",
            failureKind: "integrity",
            replacesTransactionHash: normalizedReplacedHash,
            replacementValidated: false,
            reason: replacementMismatch,
          };
        }
        replacementDetails = {
          replacesTransactionHash: normalizedReplacedHash,
          replacementValidated: true,
        };
      }

      if (!receipt) {
        return {
          ...base,
          ...transactionDetails,
          ...replacementDetails,
          status: "pending",
          reason: "Transaction receipt is not available yet.",
        };
      }

      const receiptDetails = {
        ...(await this.receiptDetails(provider, receipt)),
        ...transactionDetails,
      };
      if (receipt.status !== 1) {
        return {
          ...base,
          ...receiptDetails,
          ...replacementDetails,
          status: "failed",
          failureKind: "reverted",
          safeToRetry: true,
          reason: "Create-pool transaction reverted.",
        };
      }
      if (!this.isExpectedContract(receipt.to)) {
        return {
          ...base,
          ...receiptDetails,
          ...replacementDetails,
          status: "failed",
          failureKind: "integrity",
          reason:
            "Transaction receipt target does not match configured Launchpad contract.",
        };
      }

      const poolCreated = this.findPoolCreatedEvent(receipt.logs);
      if (!poolCreated) {
        return {
          ...base,
          ...receiptDetails,
          status: "failed",
          failureKind: "integrity",
          reason:
            "Expected PoolCreated event from configured Launchpad was not found.",
        };
      }

      const mismatch = this.createEventMismatch(
        poolCreated.parsed,
        expectedParams
      );
      const poolId = poolCreated.parsed.args.poolId.toString();
      const eventDetails = {
        ...receiptDetails,
        ...replacementDetails,
        poolId,
        logIndex: String(poolCreated.logIndex),
      };
      if (mismatch) {
        return {
          ...base,
          ...eventDetails,
          status: "failed",
          failureKind: "integrity",
          reason: mismatch,
        };
      }
      if (receiptDetails.confirmations < base.requiredConfirmations) {
        return {
          ...base,
          ...eventDetails,
          status: "pending",
          reason: "Waiting for required block confirmations.",
        };
      }

      return { ...base, ...eventDetails, status: "confirmed" };
    } catch (error: any) {
      return {
        ...base,
        status: "pending",
        reason: `RPC verification unavailable: ${String(
          error?.message || error
        )}`,
      };
    }
  }

  async verifyOperationTransaction(
    transactionHash: string,
    type: Exclude<FomoV2LaunchpadOperationType, "create_pool">,
    expectedPoolId?: string
  ): Promise<FomoV2LaunchpadTxVerification> {
    const base = this.verificationBase(transactionHash);
    const provider = this.provider();
    if (!provider) {
      return {
        ...base,
        status: "pending",
        reason: "FOMO_V2_LAUNCHPAD_RPC_URL is not configured.",
      };
    }

    try {
      await this.assertProviderNetwork(provider);
      const [receipt, transaction] = await Promise.all([
        provider.getTransactionReceipt(transactionHash),
        provider.getTransaction(transactionHash),
      ]);
      if (!receipt || !transaction) {
        return {
          ...base,
          status: "pending",
          reason: "Transaction data is not available yet.",
        };
      }

      const receiptDetails = await this.receiptDetails(provider, receipt);
      if (receipt.status !== 1) {
        return {
          ...base,
          ...receiptDetails,
          status: "failed",
          failureKind: "reverted",
          safeToRetry: true,
          reason: "Launchpad admin transaction reverted.",
        };
      }
      if (
        !this.isExpectedContract(receipt.to) ||
        !this.isExpectedContract(transaction.to)
      ) {
        return {
          ...base,
          ...receiptDetails,
          status: "failed",
          failureKind: "integrity",
          reason:
            "Transaction target does not match configured Launchpad contract.",
        };
      }

      let parsed: any;
      try {
        parsed = this.launchpadInterface.parseTransaction({
          data: transaction.data,
          value: transaction.value,
        });
      } catch {
        return {
          ...base,
          ...receiptDetails,
          status: "failed",
          failureKind: "integrity",
          reason:
            "Transaction calldata cannot be decoded with the configured Launchpad ABI.",
        };
      }
      const expectedMethod = OPERATION_METHODS[type];
      if (!parsed || parsed.name !== expectedMethod) {
        return {
          ...base,
          ...receiptDetails,
          status: "failed",
          failureKind: "integrity",
          reason: `Transaction calls ${
            parsed?.name || "unknown"
          }; expected ${expectedMethod}.`,
        };
      }

      if (POOL_OPERATION_TYPES.has(type)) {
        const actualPoolId = parsed.args[0]?.toString();
        if (!expectedPoolId || actualPoolId !== expectedPoolId) {
          return {
            ...base,
            ...receiptDetails,
            status: "failed",
            failureKind: "integrity",
            reason: `Transaction poolId ${
              actualPoolId || "missing"
            } does not match backend poolId ${expectedPoolId || "missing"}.`,
          };
        }
      }

      const decodedParams = this.decodedArgs(parsed);
      const eventMismatch = this.operationEventMismatch(
        type,
        receipt.logs,
        parsed
      );
      if (eventMismatch) {
        return {
          ...base,
          ...receiptDetails,
          decodedParams,
          status: "failed",
          failureKind: "integrity",
          reason: eventMismatch,
        };
      }
      if (receiptDetails.confirmations < base.requiredConfirmations) {
        return {
          ...base,
          ...receiptDetails,
          decodedParams,
          status: "pending",
          reason: "Waiting for required block confirmations.",
        };
      }

      return {
        ...base,
        ...receiptDetails,
        decodedParams,
        status: "confirmed",
      };
    } catch (error: any) {
      return {
        ...base,
        status: "pending",
        reason: `RPC verification unavailable: ${String(
          error?.message || error
        )}`,
      };
    }
  }

  async verifyCreateCancellationTransaction(
    replacementTransactionHash: string,
    original: FomoV2LaunchpadReplacementEvidence
  ): Promise<FomoV2LaunchpadTxVerification> {
    const base = this.verificationBase(replacementTransactionHash);
    const provider = this.provider();
    const originalHash = String(original.transactionHash || "").toLowerCase();
    if (!provider) {
      return {
        ...base,
        status: "pending",
        replacesTransactionHash: originalHash,
        reason: "FOMO_V2_LAUNCHPAD_RPC_URL is not configured.",
      };
    }

    try {
      await this.assertProviderNetwork(provider);
      const [receipt, transaction] = await Promise.all([
        provider.getTransactionReceipt(replacementTransactionHash),
        provider.getTransaction(replacementTransactionHash),
      ]);
      if (!transaction) {
        return {
          ...base,
          status: "pending",
          replacesTransactionHash: originalHash,
          replacementValidated: false,
          reason: "Cancellation replacement transaction is not available yet.",
        };
      }

      const transactionDetails: Partial<FomoV2LaunchpadTxVerification> = {
        from: String(transaction.from || receipt?.from || "").toLowerCase(),
        nonce: String(transaction.nonce),
        to: transaction.to ? String(transaction.to).toLowerCase() : undefined,
        replacesTransactionHash: originalHash,
      };
      if (replacementTransactionHash.toLowerCase() === originalHash) {
        return {
          ...base,
          ...transactionDetails,
          status: "failed",
          failureKind: "integrity",
          replacementValidated: false,
          reason: "Cancellation transaction must differ from the original create transaction.",
        };
      }

      const replacementMismatch = this.persistedReplacementMismatch(
        original,
        transaction
      );
      if (replacementMismatch) {
        return {
          ...base,
          ...transactionDetails,
          status: "failed",
          failureKind: "integrity",
          replacementValidated: false,
          reason: replacementMismatch,
        };
      }

      if (this.isExpectedContract(transaction.to)) {
        try {
          const parsed = this.launchpadInterface.parseTransaction({
            data: transaction.data,
            value: transaction.value,
          });
          if (parsed?.name === "createPool") {
            return {
              ...base,
              ...transactionDetails,
              status: "failed",
              failureKind: "integrity",
              replacementValidated: false,
              reason:
                "Replacement still calls createPool and cannot be accepted as a wallet cancellation.",
            };
          }
        } catch {
          // A non-decodable call is acceptable only after the mined replacement
          // itself proves that the original sender/nonce can no longer execute.
        }
      }

      if (!receipt) {
        return {
          ...base,
          ...transactionDetails,
          status: "pending",
          replacementValidated: true,
          reason: "Cancellation replacement is not mined yet.",
        };
      }
      const receiptDetails = {
        ...(await this.receiptDetails(provider, receipt)),
        ...transactionDetails,
      };
      if (Number(receipt.status) !== 1) {
        return {
          ...base,
          ...receiptDetails,
          status: "failed",
          failureKind: "integrity",
          replacementValidated: false,
          reason: "Wallet cancellation replacement reverted.",
        };
      }
      if (receiptDetails.confirmations < base.requiredConfirmations) {
        return {
          ...base,
          ...receiptDetails,
          status: "pending",
          replacementValidated: true,
          reason: "Waiting for cancellation replacement confirmations.",
        };
      }

      return {
        ...base,
        ...receiptDetails,
        status: "confirmed",
        failureKind: "cancelled",
        safeToRetry: true,
        replacementValidated: true,
      };
    } catch (error: any) {
      return {
        ...base,
        status: "pending",
        replacesTransactionHash: originalHash,
        reason: `RPC cancellation verification unavailable: ${String(
          error?.message || error
        )}`,
      };
    }
  }

  async readPoolInfo(
    poolId: string,
    blockTag?: number
  ): Promise<Record<string, any>> {
    const provider = this.requireProvider();
    await this.assertProviderNetwork(provider);
    const contract = new Contract(
      this.deploymentService.getDeployment().launchpadAddress,
      FOMO_V2_LAUNCHPAD_ABI,
      provider
    );
    const value: any = await contract.getPoolInfo(
      poolId,
      ...this.blockTagOverrides(blockTag)
    );
    return {
      id: String(value.id ?? value[0]),
      investToken: String(value.investToken ?? value[1]).toLowerCase(),
      targetAmount: String(value.targetAmount ?? value[2]),
      raisedAmount: String(value.raisedAmount ?? value[3]),
      greenSeats: String(value.greenSeats ?? value[4]),
      yellowSeats: String(value.yellowSeats ?? value[5]),
      stakeStart: String(value.stakeStart ?? value[6]),
      greenStart: String(value.greenStart ?? value[7]),
      greenEnd: String(value.greenEnd ?? value[8]),
      yellowSlotDuration: String(value.yellowSlotDuration ?? value[9]),
      minInvestment: String(value.minInvestment ?? value[10]),
      feePercent: String(value.feePercent ?? value[11]),
      projectToken: String(value.projectToken ?? value[12]).toLowerCase(),
      projectTokenAmount: String(value.projectTokenAmount ?? value[13]),
      claimEnabled: Boolean(value.claimEnabled ?? value[14]),
      stakeReleaseEnabled: Boolean(value.stakeReleaseEnabled ?? value[15]),
      closed: Boolean(value.closed ?? value[16]),
      exists: Boolean(value.exists ?? value[17]),
    };
  }

  async readUserState(
    poolId: string,
    walletAddress: string,
    blockTag?: number
  ): Promise<Record<string, any>> {
    const provider = this.requireProvider();
    await this.assertProviderNetwork(provider);
    const deployment = this.deploymentService.getDeployment();
    const wallet = walletAddress.toLowerCase();
    const contract: any = new Contract(
      deployment.launchpadAddress,
      FOMO_V2_LAUNCHPAD_ABI,
      provider
    );
    const overrides = this.blockTagOverrides(blockTag);
    const [
      pool,
      canInvestNow,
      maxAllowedNow,
      rank,
      stakeCount,
      firstStakeTime,
      stakedTokenIds,
      unstakeablePools,
      zone,
      yellowSlot,
      position,
    ] = await Promise.all([
      this.readPoolInfo(poolId, blockTag),
      this.safeContractRead(
        () => contract.canUserInvestNow(poolId, wallet, ...overrides),
        false
      ),
      this.safeContractRead(
        () => contract.getUserMaxAllowedNow(poolId, wallet, ...overrides),
        BigInt(0)
      ),
      this.safeContractRead(
        () => contract.getUserRank(poolId, wallet, ...overrides),
        BigInt(0)
      ),
      contract.getUserStakeCount(poolId, wallet, ...overrides),
      this.safeContractRead(
        () => contract.getUserFirstStakeTime(poolId, wallet, ...overrides),
        BigInt(0)
      ),
      contract.getUserStakedTokenIds(poolId, wallet, ...overrides),
      this.safeContractRead(
        () => contract.getUserUnstakeablePoolsWithCounts(wallet, ...overrides),
        [[], []]
      ),
      this.safeContractRead(
        () => contract.getUserZone(poolId, wallet, ...overrides),
        BigInt(0)
      ),
      this.safeContractRead(
        () => contract.getUserYellowSlot(poolId, wallet, ...overrides),
        [BigInt(0), BigInt(0)]
      ),
      contract.positions(poolId, wallet, ...overrides),
    ]);
    const activeStakedTokenIds = await this.filterActiveStakedTokenIds(
      contract,
      poolId,
      wallet,
      Array.from(stakedTokenIds || []).map(String),
      blockTag
    );
    const positionExists = Boolean(position?.exists ?? position?.[5]);
    const receiptTokenId = positionExists
      ? String(position?.receiptTokenId ?? position?.[3] ?? "0")
      : undefined;
    const claimed = Boolean(position?.claimed ?? position?.[4]);
    const previewClaim =
      receiptTokenId && !claimed && pool.claimEnabled
        ? await contract.previewClaim(receiptTokenId, ...overrides)
        : BigInt(0);
    const claimKind = this.claimKind(pool);
    const unstakeablePoolIds = Array.from(
      (unstakeablePools as any)?.poolIds ?? unstakeablePools?.[0] ?? []
    ).map(String);
    const unstakeableCounts = Array.from(
      (unstakeablePools as any)?.activeCounts ?? unstakeablePools?.[1] ?? []
    ).map(String);
    return {
      wallet,
      investedAmount: positionExists
        ? String(position?.investedAmount ?? position?.[2] ?? "0")
        : "0",
      receiptTokenIds: receiptTokenId ? [receiptTokenId] : [],
      activeStakedTokenIds,
      activeStakeCount: Number(stakeCount || 0),
      firstStakeTime: String(firstStakeTime || 0),
      unstakeablePools: unstakeablePoolIds.map((unstakeablePoolId, index) => ({
        poolId: unstakeablePoolId,
        activeCount: unstakeableCounts[index] || "0",
      })),
      claimed,
      claimAmount: String(previewClaim || 0),
      claimKind,
      zone: Number(zone || 0),
      yellowSlotStart: String(
        (yellowSlot as any)?.slotStart ?? yellowSlot?.[0] ?? 0
      ),
      yellowSlotEnd: String(
        (yellowSlot as any)?.slotEnd ?? yellowSlot?.[1] ?? 0
      ),
      rank: String(rank || 0),
      canInvestNow: Boolean(canInvestNow),
      maxAllowedNow: String(maxAllowedNow || 0),
      canClaim: Boolean(pool.claimEnabled && positionExists && !claimed),
      canRefund: Boolean(
        pool.claimEnabled &&
          positionExists &&
          !claimed &&
          claimKind === "payment_token_refund"
      ),
      canUnstake: Boolean(pool.stakeReleaseEnabled && Number(stakeCount || 0) > 0),
    };
  }

  async readSortedParticipants(poolId: string): Promise<string[]> {
    const provider = this.requireProvider();
    await this.assertProviderNetwork(provider);
    const contract: any = new Contract(
      this.deploymentService.getDeployment().launchpadAddress,
      FOMO_V2_LAUNCHPAD_ABI,
      provider
    );
    const addresses = await contract.getSortedParticipants(poolId);
    return Array.from(addresses || []).map((value) =>
      String(value).toLowerCase()
    );
  }

  async readTokenMetadata(address: string): Promise<{
    address: string;
    symbol?: string;
    name?: string;
    decimals?: number;
  }> {
    const normalizedAddress = address.toLowerCase();
    const deployment = this.deploymentService.getDeployment();
    if (normalizedAddress === deployment.investTokenAddress.toLowerCase()) {
      return {
        address: normalizedAddress,
        symbol: deployment.investTokenSymbol,
        decimals: deployment.investTokenDecimals,
      };
    }
    const provider = this.requireProvider();
    await this.assertProviderNetwork(provider);
    const token: any = new Contract(
      address,
      [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
      ],
      provider
    );
    const [name, symbol, decimals] = await Promise.all([
      this.safeContractRead(() => token.name(), undefined),
      this.safeContractRead(() => token.symbol(), undefined),
      this.safeContractRead(() => token.decimals(), undefined),
    ]);
    return {
      address: normalizedAddress,
      name: name ? String(name) : undefined,
      symbol: symbol ? String(symbol) : undefined,
      decimals: decimals === undefined ? undefined : Number(decimals),
    };
  }

  async validateContractInterface(poolId?: string): Promise<{
    ready: boolean;
    codePresent: boolean;
    stakingNftMatches: boolean;
    poolExists?: boolean;
    issues: string[];
  }> {
    const provider = this.requireProvider();
    await this.assertProviderNetwork(provider);
    const deployment = this.deploymentService.getDeployment();
    const code = await provider.getCode(deployment.launchpadAddress);
    const codePresent = Boolean(code && code !== "0x");
    const issues: string[] = [];
    if (!codePresent) issues.push("Configured Launchpad address has no bytecode.");
    let stakingNftMatches = false;
    let poolExists: boolean | undefined;
    if (codePresent) {
      const contract: any = new Contract(
        deployment.launchpadAddress,
        FOMO_V2_LAUNCHPAD_ABI,
        provider
      );
      try {
        stakingNftMatches =
          String(await contract.stakingNft()).toLowerCase() ===
          deployment.stakingNftAddress.toLowerCase();
      } catch {
        issues.push("Configured contract does not expose the expected stakingNft interface.");
      }
      if (!stakingNftMatches && !issues.some((item) => item.includes("stakingNft interface"))) {
        issues.push("Launchpad staking NFT address does not match configuration.");
      }
      if (poolId) {
        try {
          poolExists = Boolean((await this.readPoolInfo(poolId)).exists);
          if (!poolExists) issues.push("The verified pool does not exist in the contract.");
        } catch {
          poolExists = false;
          issues.push("The configured contract does not expose the expected getPoolInfo interface.");
        }
      }
    }
    return {
      ready: issues.length === 0,
      codePresent,
      stakingNftMatches,
      poolExists,
      issues,
    };
  }

  async verifyUserTransaction(
    transactionHash: string,
    action: FomoV2LaunchpadUserAction,
    expectedPoolId: string,
    expectedWallet: string
  ): Promise<FomoV2LaunchpadUserTxVerification> {
    const base = {
      transactionHash: transactionHash.toLowerCase(),
      action,
      confirmations: 0,
      requiredConfirmations: this.deploymentService.getDeployment().confirmations,
      events: [] as FomoV2LaunchpadDecodedEvent[],
    };
    const provider = this.provider();
    if (!provider) {
      return { ...base, status: "pending", reason: "FOMO_V2_LAUNCHPAD_RPC_URL is not configured." };
    }
    try {
      await this.assertProviderNetwork(provider);
      const [transaction, receipt] = await Promise.all([
        provider.getTransaction(transactionHash),
        provider.getTransactionReceipt(transactionHash),
      ]);
      if (!transaction || !receipt) {
        return { ...base, status: "pending", reason: "Transaction is not mined yet." };
      }
      const receiptDetails = await this.receiptDetails(provider, receipt);
      const details = {
        ...base,
        ...receiptDetails,
        from: String(transaction.from || receipt.from || "").toLowerCase(),
        to: transaction.to ? String(transaction.to).toLowerCase() : undefined,
      };
      if (!this.isExpectedContract(transaction.to) || !this.isExpectedContract(receipt.to)) {
        return { ...details, status: "failed" as const, reason: "Transaction target is not the configured Launchpad contract." };
      }
      if (details.from !== expectedWallet.toLowerCase()) {
        return { ...details, status: "failed" as const, reason: "Transaction sender does not match wallet." };
      }
      if (Number(receipt.status) !== 1) {
        return { ...details, status: "failed" as const, reason: "Transaction reverted." };
      }
      const expectedMethod: Record<FomoV2LaunchpadUserAction, string> = {
        invest: "invest",
        stake: "stakeNfts",
        unstake: "unstakePoolNfts",
        claim: "claim",
      };
      let parsedTransaction: any;
      try {
        parsedTransaction = this.launchpadInterface.parseTransaction({
          data: transaction.data,
          value: transaction.value,
        });
      } catch {
        return { ...details, status: "failed" as const, reason: "Transaction calldata cannot be decoded with the Launchpad ABI." };
      }
      if (parsedTransaction?.name !== expectedMethod[action]) {
        return { ...details, status: "failed" as const, reason: `Transaction calls ${parsedTransaction?.name || "unknown"}; expected ${expectedMethod[action]}.` };
      }
      if (action !== "claim" && String(parsedTransaction.args[0]) !== expectedPoolId) {
        return { ...details, status: "failed" as const, reason: "Transaction poolId does not match the requested launch." };
      }
      const decodedEvents = this.decodeLogs(receipt.logs);
      const expectedEvent: Record<FomoV2LaunchpadUserAction, string> = {
        invest: "Invested",
        stake: "NftStaked",
        unstake: "NftUnstaked",
        claim: "Claimed",
      };
      const wallet = expectedWallet.toLowerCase();
      const matching = decodedEvents.filter((event) => {
        if (event.eventName !== expectedEvent[action]) return false;
        if (String(event.values.poolId || "") !== expectedPoolId) return false;
        const eventWallet = String(event.values.user || event.values.investor || "").toLowerCase();
        return eventWallet === wallet;
      });
      if (!matching.length) {
        return { ...details, status: "failed" as const, events: decodedEvents, reason: `Expected ${expectedEvent[action]} event for this pool and wallet was not found.` };
      }
      const relatedEvents = decodedEvents.filter((event) =>
        String(event.values.poolId || "") === expectedPoolId
      );
      if (details.confirmations < details.requiredConfirmations) {
        return { ...details, status: "pending" as const, events: relatedEvents, reason: "Waiting for required block confirmations." };
      }
      return { ...details, status: "confirmed" as const, events: relatedEvents };
    } catch (error: any) {
      const message = String(error?.message || error);
      const chainMismatch = message.includes("RPC returned chainId");
      return {
        ...base,
        status: chainMismatch ? "failed" : "pending",
        reason: `RPC verification unavailable: ${message}`,
      };
    }
  }

  async scanEvents(fromBlock: number, toBlock: number): Promise<FomoV2LaunchpadDecodedEvent[]> {
    const provider = this.requireProvider();
    await this.assertProviderNetwork(provider);
    const logs = await provider.getLogs({
      address: this.deploymentService.getDeployment().launchpadAddress,
      fromBlock,
      toBlock,
    });
    return this.decodeLogs(logs);
  }

  async getHeadBlockNumber(): Promise<number> {
    const provider = this.requireProvider();
    await this.assertProviderNetwork(provider);
    return provider.getBlockNumber();
  }

  async getBlockHash(blockNumber: number): Promise<string | undefined> {
    const provider = this.requireProvider();
    await this.assertProviderNetwork(provider);
    return (await provider.getBlock(blockNumber))?.hash?.toLowerCase();
  }

  private requireProvider(): JsonRpcProvider {
    const provider = this.provider();
    if (!provider) {
      throw new Error("FOMO_V2_LAUNCHPAD_RPC_URL is not configured.");
    }
    return provider;
  }

  private async safeContractRead<T>(read: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await read();
    } catch {
      return fallback;
    }
  }

  private async filterActiveStakedTokenIds(
    contract: any,
    poolId: string,
    wallet: string,
    historicalTokenIds: string[],
    blockTag?: number
  ): Promise<string[]> {
    const active: string[] = [];
    const batchSize = 20;
    for (let offset = 0; offset < historicalTokenIds.length; offset += batchSize) {
      const batch = historicalTokenIds.slice(offset, offset + batchSize);
      const overrides = this.blockTagOverrides(blockTag);
      const statuses = await Promise.all(
        batch.map((tokenId) =>
          contract.isTokenStakedInPool(
            poolId,
            wallet,
            tokenId,
            ...overrides
          )
        )
      );
      batch.forEach((tokenId, index) => {
        if (statuses[index]) active.push(tokenId);
      });
    }
    return active;
  }

  private blockTagOverrides(blockTag?: number): [] | [{ blockTag: number }] {
    return blockTag === undefined ? [] : [{ blockTag }];
  }

  private claimKind(pool: Record<string, any>): "project_token" | "payment_token_refund" | undefined {
    const projectToken = String(pool?.projectToken || "").toLowerCase();
    const investToken = String(pool?.investToken || "").toLowerCase();
    if (!pool?.claimEnabled || !projectToken || /^0x0{40}$/.test(projectToken)) return undefined;
    return projectToken === investToken ? "payment_token_refund" : "project_token";
  }

  private decodeLogs(logs: readonly any[]): FomoV2LaunchpadDecodedEvent[] {
    const output: FomoV2LaunchpadDecodedEvent[] = [];
    for (const log of logs) {
      if (!this.isExpectedContract(log.address)) continue;
      try {
        const parsed = this.launchpadInterface.parseLog({ topics: log.topics, data: log.data });
        if (!parsed) continue;
        const values: Record<string, any> = {};
        parsed.fragment.inputs.forEach((input: any, index: number) => {
          values[input.name || String(index)] = this.serializableValue(parsed.args[index]);
        });
        output.push({
          eventName: parsed.name,
          transactionHash: String(log.transactionHash || "").toLowerCase(),
          logIndex: String(log.index ?? log.logIndex ?? 0),
          blockNumber: String(log.blockNumber ?? ""),
          blockHash: String(log.blockHash || "").toLowerCase(),
          values,
        });
      } catch {
        // ERC20/ERC721 logs emitted in the same transaction are outside this read model.
      }
    }
    return output;
  }

  private serializableValue(value: any): any {
    if (typeof value === "bigint") return value.toString();
    if (Array.isArray(value)) return value.map((entry) => this.serializableValue(entry));
    if (typeof value === "string") return value.startsWith("0x") ? value.toLowerCase() : value;
    return value;
  }

  private provider(): JsonRpcProvider | undefined {
    const rpcUrl = this.deploymentService.getRpcUrl();
    if (!rpcUrl) return undefined;
    return new JsonRpcProvider(rpcUrl);
  }

  private async assertProviderNetwork(
    provider: JsonRpcProvider
  ): Promise<void> {
    const deployment = this.deploymentService.getDeployment();
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(deployment.chainId)) {
      throw new Error(
        `RPC returned chainId ${network.chainId.toString()}, expected ${
          deployment.chainId
        }.`
      );
    }
  }

  private verificationBase(transactionHash: string) {
    return {
      transactionHash: transactionHash.toLowerCase(),
      confirmations: 0,
      safeToRetry: false,
      requiredConfirmations:
        this.deploymentService.getDeployment().confirmations,
    };
  }

  private async receiptDetails(provider: JsonRpcProvider, receipt: any) {
    const currentBlock = await provider.getBlockNumber();
    const confirmations = Math.max(0, currentBlock - receipt.blockNumber + 1);
    return {
      confirmations,
      from: receipt.from ? String(receipt.from).toLowerCase() : undefined,
      to: receipt.to ? String(receipt.to).toLowerCase() : undefined,
      blockNumber: String(receipt.blockNumber),
      blockHash: receipt.blockHash
        ? String(receipt.blockHash).toLowerCase()
        : undefined,
    };
  }

  private findPoolCreatedEvent(
    logs: readonly any[]
  ): { parsed: LogDescription; logIndex: number } | undefined {
    const events: Array<{ parsed: LogDescription; logIndex: number }> = [];
    for (const log of logs) {
      if (!this.isExpectedContract(log.address)) continue;
      try {
        const parsed = this.launchpadInterface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed?.name === "PoolCreated") {
          events.push({
            parsed,
            logIndex: Number(log.index ?? log.logIndex ?? 0),
          });
        }
      } catch {
        // Other events emitted by the Launchpad are intentionally ignored.
      }
    }
    return events.length === 1 ? events[0] : undefined;
  }

  private createEventMismatch(
    event: LogDescription,
    expected: FomoV2LaunchpadCreateParams
  ): string | undefined {
    const actual = {
      investToken: String(event.args.investToken).toLowerCase(),
      targetAmount: event.args.targetAmount.toString(),
      greenSeats: event.args.greenSeats.toString(),
      yellowSeats: event.args.yellowSeats.toString(),
      stakeStart: event.args.stakeStart.toString(),
      greenStart: event.args.greenStart.toString(),
      greenEnd: event.args.greenEnd.toString(),
      yellowSlotDuration: event.args.yellowSlotDuration.toString(),
      minInvestment: event.args.minInvestment.toString(),
      feePercent: event.args.feePercent.toString(),
    };
    const normalizedExpected = this.normalizeCreateParams(expected);
    for (const key of CREATE_PARAM_FIELDS) {
      const expectedValue = normalizedExpected[key];
      if (actual[key] !== expectedValue) {
        return `PoolCreated ${key}=${
          actual[key]
        } does not match draft value ${expectedValue}.`;
      }
    }
    return undefined;
  }

  private createCalldataMismatch(
    transaction: any,
    expected: FomoV2LaunchpadCreateParams
  ): string | undefined {
    let parsed: any;
    try {
      parsed = this.launchpadInterface.parseTransaction({
        data: transaction.data,
        value: transaction.value,
      });
    } catch {
      return "Create transaction calldata cannot be decoded with the configured Launchpad ABI.";
    }
    if (!parsed || parsed.name !== "createPool") {
      return `Create transaction calls ${
        parsed?.name || "unknown"
      }; expected createPool.`;
    }
    const actual: FomoV2LaunchpadCreateParams = {
      investToken: String(parsed.args.investToken).toLowerCase(),
      targetAmount: parsed.args.targetAmount.toString(),
      greenSeats: parsed.args.greenSeats.toString(),
      yellowSeats: parsed.args.yellowSeats.toString(),
      stakeStart: parsed.args.stakeStart.toString(),
      greenStart: parsed.args.greenStart.toString(),
      greenEnd: parsed.args.greenEnd.toString(),
      yellowSlotDuration: parsed.args.yellowSlotDuration.toString(),
      minInvestment: parsed.args.minInvestment.toString(),
      feePercent: parsed.args.feePercent.toString(),
    };
    const normalizedExpected = this.normalizeCreateParams(expected);
    for (const key of CREATE_PARAM_FIELDS) {
      const expectedValue = normalizedExpected[key];
      if (actual[key] !== expectedValue) {
        return `createPool calldata ${key}=${
          actual[key]
        } does not match draft value ${expectedValue}.`;
      }
    }
    return undefined;
  }

  private normalizeCreateParams(value: any): FomoV2LaunchpadCreateParams {
    return {
      investToken: String(value?.investToken || "").toLowerCase(),
      targetAmount: String(value?.targetAmount ?? ""),
      greenSeats: String(value?.greenSeats ?? ""),
      yellowSeats: String(value?.yellowSeats ?? ""),
      stakeStart: String(value?.stakeStart ?? ""),
      greenStart: String(value?.greenStart ?? ""),
      greenEnd: String(value?.greenEnd ?? ""),
      yellowSlotDuration: String(value?.yellowSlotDuration ?? ""),
      minInvestment: String(value?.minInvestment ?? ""),
      feePercent: String(value?.feePercent ?? ""),
    };
  }

  private replacementMismatch(
    replacedTransaction: any,
    replacementTransaction: any,
    expected: FomoV2LaunchpadCreateParams
  ): string | undefined {
    const replacedFrom = String(replacedTransaction.from || "").toLowerCase();
    const replacementFrom = String(
      replacementTransaction.from || ""
    ).toLowerCase();
    if (!replacedFrom || replacedFrom !== replacementFrom) {
      return "Replacement transaction sender does not match the original transaction sender.";
    }
    if (replacedTransaction.nonce !== replacementTransaction.nonce) {
      return "Replacement transaction nonce does not match the original transaction nonce.";
    }
    if (!this.isExpectedContract(replacedTransaction.to)) {
      return "Original transaction target does not match the configured Launchpad contract.";
    }
    const originalCalldataMismatch = this.createCalldataMismatch(
      replacedTransaction,
      expected
    );
    if (originalCalldataMismatch) {
      return `Original transaction is not the same createPool operation: ${originalCalldataMismatch}`;
    }
    return undefined;
  }

  private persistedReplacementMismatch(
    original: FomoV2LaunchpadReplacementEvidence,
    replacementTransaction: any
  ): string | undefined {
    const originalFrom = String(original.from || "").toLowerCase();
    const replacementFrom = String(
      replacementTransaction.from || ""
    ).toLowerCase();
    if (!originalFrom || originalFrom !== replacementFrom) {
      return "Replacement transaction sender does not match persisted original transaction evidence.";
    }
    if (String(original.nonce) !== String(replacementTransaction.nonce)) {
      return "Replacement transaction nonce does not match persisted original transaction evidence.";
    }
    if (!this.isExpectedContract(original.to)) {
      return "Persisted original transaction target does not match the configured Launchpad contract.";
    }
    if (!original.calldataValidated) {
      return "Persisted original createPool calldata was not verified.";
    }
    return undefined;
  }

  private decodedArgs(parsed: any): Record<string, any> {
    const output: Record<string, any> = {};
    parsed.fragment.inputs.forEach((input: any, index: number) => {
      const value = parsed.args[index];
      output[input.name || String(index)] =
        typeof value === "bigint" ? value.toString() : String(value);
    });
    return output;
  }

  private operationEventMismatch(
    type: Exclude<FomoV2LaunchpadOperationType, "create_pool">,
    logs: readonly any[],
    transaction: any
  ): string | undefined {
    const expectedEventByType: Partial<
      Record<FomoV2LaunchpadOperationType, string>
    > = {
      update_pool_fee_percent: "PoolFeeUpdated",
      deposit_project_tokens: "ProjectTokensDeposited",
      close_pool: "PoolClosed",
    };
    const expectedEventName = expectedEventByType[type];
    if (!expectedEventName) return undefined;

    const matchingEvents: LogDescription[] = [];
    for (const log of logs) {
      if (!this.isExpectedContract(log.address)) continue;
      try {
        const parsed = this.launchpadInterface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (
          parsed?.name === expectedEventName &&
          parsed.args.poolId?.toString() === transaction.args[0]?.toString()
        ) {
          matchingEvents.push(parsed);
        }
      } catch {
        // Unrelated Launchpad events are ignored.
      }
    }
    if (matchingEvents.length !== 1) {
      return `Expected one ${expectedEventName} event for poolId ${transaction.args[0]?.toString()}, found ${
        matchingEvents.length
      }.`;
    }

    const event = matchingEvents[0];
    if (
      type === "update_pool_fee_percent" &&
      event.args.newFeePercent.toString() !== transaction.args[1].toString()
    ) {
      return "PoolFeeUpdated event does not match transaction calldata.";
    }
    if (
      type === "deposit_project_tokens" &&
      (String(event.args.projectToken).toLowerCase() !==
        String(transaction.args[1]).toLowerCase() ||
        event.args.amount.toString() !== transaction.args[2].toString())
    ) {
      return "ProjectTokensDeposited event does not match transaction calldata.";
    }
    return undefined;
  }

  private isExpectedContract(value: string | null | undefined): boolean {
    if (!value) return false;
    return (
      value.toLowerCase() ===
      this.deploymentService.getDeployment().launchpadAddress.toLowerCase()
    );
  }
}

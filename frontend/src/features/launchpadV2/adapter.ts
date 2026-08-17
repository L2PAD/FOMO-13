import {
  BigNumber,
  BigNumberish,
  Contract,
  ContractTransaction,
  constants,
  providers,
  utils,
} from "ethers";

import { erc20AdminAbi, launchpadAbi } from "./abi";
import {
  LAUNCHPAD_CHAIN_ID,
  launchpadDeployment,
} from "./config";
import {
  AdminAccountActionInput,
  CreatePoolInput,
  CreatePoolResult,
  DepositProjectTokensInput,
  DepositProjectTokensResult,
  LaunchpadMutationSubmissionAware,
  LaunchpadAdminContext,
  LaunchpadPool,
  MinedTransactionResult,
  PoolActionInput,
  ReceiverActionInput,
  TransactionReceiptSummary,
  TransferOwnershipInput,
  UintInput,
  UpdatePoolFeeInput,
  UpdatePoolMinInvestmentInput,
} from "./types";

type InjectedEthereum = providers.ExternalProvider & {
  request: (request: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

interface WaitedTransaction extends MinedTransactionResult {
  rawReceipt: providers.TransactionReceipt;
}

interface ReplacementError {
  code?: string;
  cancelled?: boolean;
  reason?: string;
  receipt?: providers.TransactionReceipt;
  replacement?: ContractTransaction;
}

interface NormalizedCreatePoolInput {
  investToken: string;
  targetAmount: BigNumber;
  greenSeats: BigNumber;
  yellowSeats: BigNumber;
  stakeStart: BigNumber;
  greenStart: BigNumber;
  greenEnd: BigNumber;
  yellowSlotDuration: BigNumber;
  minInvestment: BigNumber;
  feePercent: BigNumber;
}

export class LaunchpadNetworkError extends Error {
  readonly expectedChainId = LAUNCHPAD_CHAIN_ID;

  constructor(readonly actualChainId: number) {
    super(`Launchpad requires BSC Testnet (chain ${LAUNCHPAD_CHAIN_ID}); connected chain is ${actualChainId}`);
    this.name = "LaunchpadNetworkError";
  }
}

export class LaunchpadSubmissionCallbackError extends Error {
  constructor(
    readonly txHash: string,
    readonly predictedPoolId: string,
    readonly originalError: unknown,
  ) {
    super("Pool transaction was broadcast, but its submission could not be persisted");
    this.name = "LaunchpadSubmissionCallbackError";
  }
}

export class LaunchpadMutationSubmissionCallbackError extends Error {
  constructor(
    readonly txHash: string,
    readonly originalError: unknown,
  ) {
    super("Launchpad transaction was broadcast, but its submission could not be persisted");
    this.name = "LaunchpadMutationSubmissionCallbackError";
  }
}

/**
 * The wallet mined a different transaction with the same nonce. This is not
 * locally safe to retry: the backend must verify the mined replacement before
 * it may unlock/reset the persisted create attempt.
 */
export class LaunchpadTransactionCancelledError extends Error {
  constructor(
    readonly submittedTxHash: string,
    readonly replacementTxHash: string,
    readonly receipt: TransactionReceiptSummary,
  ) {
    super("Pool creation was replaced by a wallet cancellation transaction");
    this.name = "LaunchpadTransactionCancelledError";
  }
}

const launchpadInterface = new utils.Interface(launchpadAbi);
const poolCreatedTopic = launchpadInterface.getEventTopic("PoolCreated");

const getInjectedEthereum = (): InjectedEthereum => {
  if (typeof window === "undefined") {
    throw new Error("An injected EVM wallet is only available in a browser");
  }

  const ethereum = (window as unknown as { ethereum?: InjectedEthereum }).ethereum;
  if (!ethereum || typeof ethereum.request !== "function") {
    throw new Error("No injected EVM wallet was found");
  }

  return ethereum;
};

const parseChainId = (value: unknown): number => {
  const parsed = typeof value === "string" ? Number.parseInt(value, 16) : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`Wallet returned an invalid chain id: ${String(value)}`);
  }
  return parsed;
};

const readProviderChainId = async (provider: providers.Provider): Promise<number> => {
  if (provider instanceof providers.JsonRpcProvider) {
    return parseChainId(await provider.send("eth_chainId", []));
  }

  return (await provider.getNetwork()).chainId;
};

const assertExpectedChain = async (provider: providers.Provider): Promise<void> => {
  const chainId = await readProviderChainId(provider);
  if (chainId !== LAUNCHPAD_CHAIN_ID) {
    throw new LaunchpadNetworkError(chainId);
  }
};

const getWalletErrorCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined;

  const directCode = (error as { code?: unknown }).code;
  if (typeof directCode === "number") return directCode;
  if (typeof directCode === "string" && /^\d+$/.test(directCode)) return Number(directCode);

  const nested = (error as { data?: { originalError?: { code?: unknown } } }).data?.originalError?.code;
  return typeof nested === "number" ? nested : undefined;
};

export const switchToLaunchpadNetwork = async (): Promise<void> => {
  const ethereum = getInjectedEthereum();

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: launchpadDeployment.chainIdHex }],
    });
  } catch (error) {
    if (getWalletErrorCode(error) !== 4902) throw error;

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: launchpadDeployment.chainIdHex,
          chainName: launchpadDeployment.chainName,
          nativeCurrency: launchpadDeployment.nativeCurrency,
          rpcUrls: [launchpadDeployment.rpcUrl],
          blockExplorerUrls: [launchpadDeployment.explorerUrl],
        },
      ],
    });

    // EIP-3085 does not require a wallet to select a chain after adding it.
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: launchpadDeployment.chainIdHex }],
    });
  }

  const provider = new providers.Web3Provider(ethereum, "any");
  await assertExpectedChain(provider);
};

const getInjectedProvider = async (
  requestAccounts: boolean,
  switchNetwork: boolean,
): Promise<providers.Web3Provider> => {
  const ethereum = getInjectedEthereum();
  const provider = new providers.Web3Provider(ethereum, "any");

  if (requestAccounts) {
    await provider.send("eth_requestAccounts", []);
  }

  const chainId = await readProviderChainId(provider);
  if (chainId !== LAUNCHPAD_CHAIN_ID && switchNetwork) {
    await switchToLaunchpadNetwork();
  }

  await assertExpectedChain(provider);
  return provider;
};

const assertDeployedContract = async (
  provider: providers.Provider,
  address: string,
  label: string,
): Promise<void> => {
  const code = await provider.getCode(address);
  if (!code || code === "0x") {
    throw new Error(`${label} is not deployed at ${address} on BSC Testnet`);
  }
};

const normalizeAddress = (value: string, label: string): string => {
  let address: string;
  try {
    address = utils.getAddress(value.trim());
  } catch {
    throw new Error(`${label} must be a valid EVM address`);
  }

  if (address === constants.AddressZero) {
    throw new Error(`${label} cannot be the zero address`);
  }

  return address;
};

const normalizeUint = (
  value: UintInput,
  label: string,
  bits = 256,
  allowZero = true,
): BigNumber => {
  if (typeof value === "number" && (!Number.isSafeInteger(value) || value < 0)) {
    throw new Error(`${label} must be a safe non-negative integer`);
  }

  const asString = String(value).trim();
  if (!/^\d+$/.test(asString)) {
    throw new Error(`${label} must be a raw non-negative integer string`);
  }

  const parsed = BigNumber.from(asString);
  if (!allowZero && parsed.isZero()) {
    throw new Error(`${label} must be greater than zero`);
  }

  if (bits < 256 && parsed.gt(BigNumber.from(2).pow(bits).sub(1))) {
    throw new Error(`${label} exceeds uint${bits}`);
  }

  return parsed;
};

const normalizeConfirmations = (value?: number): number => {
  const confirmations = value ?? launchpadDeployment.confirmations;
  if (!Number.isInteger(confirmations) || confirmations < 1 || confirmations > 100) {
    throw new Error("confirmations must be an integer from 1 to 100");
  }
  return confirmations;
};

const normalizeCreatePoolInput = (input: CreatePoolInput): NormalizedCreatePoolInput => {
  const normalized: NormalizedCreatePoolInput = {
    investToken: normalizeAddress(input.investToken, "investToken"),
    targetAmount: normalizeUint(input.targetAmount, "targetAmount", 256, false),
    greenSeats: normalizeUint(input.greenSeats, "greenSeats", 32, false),
    yellowSeats: normalizeUint(input.yellowSeats, "yellowSeats", 32),
    stakeStart: normalizeUint(input.stakeStart, "stakeStart", 64, false),
    greenStart: normalizeUint(input.greenStart, "greenStart", 64, false),
    greenEnd: normalizeUint(input.greenEnd, "greenEnd", 64, false),
    yellowSlotDuration: normalizeUint(
      input.yellowSlotDuration,
      "yellowSlotDuration",
      64,
      false,
    ),
    minInvestment: normalizeUint(input.minInvestment, "minInvestment", 256, false),
    feePercent: normalizeUint(input.feePercent, "feePercent", 16),
  };

  if (!normalized.stakeStart.lt(normalized.greenStart)) {
    throw new Error("stakeStart must be earlier than greenStart");
  }
  if (!normalized.greenStart.lt(normalized.greenEnd)) {
    throw new Error("greenStart must be earlier than greenEnd");
  }
  if (normalized.feePercent.gt(100)) {
    throw new Error("feePercent cannot exceed 100");
  }

  return normalized;
};

const createPoolArgs = (input: NormalizedCreatePoolInput): BigNumberish[] => [
  input.investToken,
  input.targetAmount,
  input.greenSeats,
  input.yellowSeats,
  input.stakeStart,
  input.greenStart,
  input.greenEnd,
  input.yellowSlotDuration,
  input.minInvestment,
  input.feePercent,
];

const summarizeReceipt = (receipt: providers.TransactionReceipt): TransactionReceiptSummary => ({
  blockNumber: receipt.blockNumber,
  blockHash: receipt.blockHash,
  transactionIndex: receipt.transactionIndex,
  confirmations: receipt.confirmations,
});

const assertReceipt = (
  receipt: providers.TransactionReceipt,
  expectedTarget: string,
): void => {
  if (receipt.status !== 1) {
    throw new Error(`Transaction ${receipt.transactionHash} was not successful`);
  }

  if (!receipt.to || utils.getAddress(receipt.to) !== utils.getAddress(expectedTarget)) {
    throw new Error(`Transaction receipt target is not ${expectedTarget}`);
  }
};

const waitForMinedTransaction = async (
  tx: ContractTransaction,
  confirmations: number,
  expectedTarget: string,
): Promise<WaitedTransaction> => {
  const submittedTxHash = tx.hash;
  let receipt: providers.TransactionReceipt;

  try {
    receipt = await tx.wait(confirmations);
  } catch (error) {
    const replacementError = error as ReplacementError;
    if (replacementError.code !== "TRANSACTION_REPLACED") {
      throw error;
    }

    if (replacementError.cancelled) {
      const cancellationReceipt = replacementError.receipt
        || (replacementError.replacement
          ? await replacementError.replacement.wait(confirmations)
          : undefined);
      if (!cancellationReceipt?.transactionHash) throw error;
      throw new LaunchpadTransactionCancelledError(
        submittedTxHash,
        cancellationReceipt.transactionHash,
        summarizeReceipt(cancellationReceipt),
      );
    }

    if (replacementError.receipt) {
      receipt = replacementError.receipt;
    } else if (replacementError.replacement) {
      receipt = await replacementError.replacement.wait(confirmations);
    } else {
      throw error;
    }
  }

  assertReceipt(receipt, expectedTarget);

  return {
    txHash: receipt.transactionHash,
    ...(receipt.transactionHash.toLowerCase() !== submittedTxHash.toLowerCase()
      ? { submittedTxHash }
      : {}),
    receipt: summarizeReceipt(receipt),
    rawReceipt: receipt,
  };
};

const toPublicTransactionResult = (result: WaitedTransaction): MinedTransactionResult => ({
  txHash: result.txHash,
  ...(result.submittedTxHash ? { submittedTxHash: result.submittedTxHash } : {}),
  receipt: result.receipt,
});

const loadAdminContext = async (
  provider: providers.Provider,
  account: string,
): Promise<LaunchpadAdminContext> => {
  await assertExpectedChain(provider);
  await assertDeployedContract(provider, launchpadDeployment.contracts.launchpad, "Launchpad");

  const normalizedAccount = normalizeAddress(account, "account");
  const contract = new Contract(
    launchpadDeployment.contracts.launchpad,
    launchpadAbi,
    provider,
  );
  const [owner, isAdmin, investmentReceiver, feeReceiver, stakingNft] = await Promise.all([
    contract.owner() as Promise<string>,
    contract.admins(normalizedAccount) as Promise<boolean>,
    contract.investmentReceiver() as Promise<string>,
    contract.feeReceiver() as Promise<string>,
    contract.stakingNft() as Promise<string>,
  ]);

  const normalizedOwner = utils.getAddress(owner);
  const normalizedStakingNft = utils.getAddress(stakingNft);
  if (normalizedStakingNft !== launchpadDeployment.contracts.nft) {
    throw new Error(
      `Launchpad staking NFT is ${normalizedStakingNft}, expected ${launchpadDeployment.contracts.nft}`,
    );
  }

  return {
    account: normalizedAccount,
    chainId: LAUNCHPAD_CHAIN_ID,
    owner: normalizedOwner,
    isOwner: normalizedOwner === normalizedAccount,
    isAdmin,
    investmentReceiver: utils.getAddress(investmentReceiver),
    feeReceiver: utils.getAddress(feeReceiver),
    stakingNft: normalizedStakingNft,
    launchpadAddress: launchpadDeployment.contracts.launchpad,
  };
};

export const connectLaunchpadAdmin = async (options?: {
  switchNetwork?: boolean;
}): Promise<LaunchpadAdminContext> => {
  const provider = await getInjectedProvider(true, options?.switchNetwork ?? true);
  const account = await provider.getSigner().getAddress();
  return loadAdminContext(provider, account);
};

export const getLaunchpadAdminContext = async (): Promise<LaunchpadAdminContext> => {
  const provider = await getInjectedProvider(false, false);
  const accounts = await provider.listAccounts();
  if (!accounts.length) {
    throw new Error("Connect an admin wallet first");
  }
  return loadAdminContext(provider, accounts[0]);
};

const getAuthorizedLaunchpadContract = async (
  ownerOnly: boolean,
): Promise<{
  provider: providers.Web3Provider;
  contract: Contract;
  context: LaunchpadAdminContext;
}> => {
  const provider = await getInjectedProvider(true, true);
  const signer = provider.getSigner();
  const context = await loadAdminContext(provider, await signer.getAddress());

  if (ownerOnly ? !context.isOwner : !context.isOwner && !context.isAdmin) {
    throw new Error(
      ownerOnly
        ? `Connected wallet ${context.account} is not the Launchpad owner ${context.owner}`
        : `Connected wallet ${context.account} is neither the Launchpad owner ${context.owner} nor an authorized admin`,
    );
  }

  return {
    provider,
    contract: new Contract(launchpadDeployment.contracts.launchpad, launchpadAbi, signer),
    context,
  };
};

const assertTransactionTarget = (tx: ContractTransaction, expectedTarget: string): void => {
  if (!tx.to || utils.getAddress(tx.to) !== utils.getAddress(expectedTarget)) {
    throw new Error(`Wallet returned a transaction for an unexpected target: ${String(tx.to)}`);
  }
};

const assertPoolCreatedEventMatches = (
  args: utils.Result,
  expected: NormalizedCreatePoolInput,
): void => {
  const numericFields: Array<keyof Omit<NormalizedCreatePoolInput, "investToken">> = [
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

  if (utils.getAddress(args.investToken) !== expected.investToken) {
    throw new Error("PoolCreated investToken does not match the submitted pool");
  }

  numericFields.forEach((field) => {
    if (!BigNumber.from(args[field]).eq(expected[field])) {
      throw new Error(`PoolCreated ${field} does not match the submitted pool`);
    }
  });
};

const parseCreatedPoolId = (
  receipt: providers.TransactionReceipt,
  expected: NormalizedCreatePoolInput,
): string => {
  const matchingLogs = receipt.logs.filter(
    (log) =>
      log.address.toLowerCase() === launchpadDeployment.contracts.launchpad.toLowerCase() &&
      log.topics[0]?.toLowerCase() === poolCreatedTopic.toLowerCase(),
  );

  if (matchingLogs.length !== 1) {
    throw new Error(`Expected exactly one PoolCreated event, received ${matchingLogs.length}`);
  }

  const parsed = launchpadInterface.parseLog(matchingLogs[0]);
  if (parsed.name !== "PoolCreated") {
    throw new Error("The matching receipt log is not PoolCreated");
  }

  assertPoolCreatedEventMatches(parsed.args, expected);
  return BigNumber.from(parsed.args.poolId).toString();
};

export const createPoolWithPredictedId = async (
  input: CreatePoolInput,
): Promise<CreatePoolResult> => {
  const normalized = normalizeCreatePoolInput(input);
  const args = createPoolArgs(normalized);
  const { provider, contract } = await getAuthorizedLaunchpadContract(false);
  await assertExpectedChain(provider);

  const predictedPoolId = BigNumber.from(
    await contract.callStatic.createPool(...args),
  ).toString();
  const tx = (await contract.createPool(...args)) as ContractTransaction;
  assertTransactionTarget(tx, launchpadDeployment.contracts.launchpad);

  if (input.onSubmitted) {
    try {
      await input.onSubmitted({ txHash: tx.hash, predictedPoolId });
    } catch (error) {
      throw new LaunchpadSubmissionCallbackError(tx.hash, predictedPoolId, error);
    }
  }

  const mined = await waitForMinedTransaction(
    tx,
    normalizeConfirmations(input.confirmations),
    launchpadDeployment.contracts.launchpad,
  );
  const confirmedPoolId = parseCreatedPoolId(mined.rawReceipt, normalized);

  return {
    ...toPublicTransactionResult(mined),
    predictedPoolId,
    poolId: confirmedPoolId,
    confirmedPoolId,
    predictionMatched: predictedPoolId === confirmedPoolId,
  };
};

const runLaunchpadMutation = async (
  method: string,
  args: BigNumberish[],
  confirmations: number | undefined,
  ownerOnly = false,
  onSubmitted?: LaunchpadMutationSubmissionAware["onSubmitted"],
): Promise<MinedTransactionResult> => {
  const { provider, contract } = await getAuthorizedLaunchpadContract(ownerOnly);
  await assertExpectedChain(provider);

  const tx = (await contract[method](...args)) as ContractTransaction;
  assertTransactionTarget(tx, launchpadDeployment.contracts.launchpad);
  if (onSubmitted) {
    try {
      await onSubmitted({ txHash: tx.hash });
    } catch (error) {
      throw new LaunchpadMutationSubmissionCallbackError(tx.hash, error);
    }
  }
  return toPublicTransactionResult(
    await waitForMinedTransaction(
      tx,
      normalizeConfirmations(confirmations),
      launchpadDeployment.contracts.launchpad,
    ),
  );
};

export const updatePoolFee = async (
  input: UpdatePoolFeeInput,
): Promise<MinedTransactionResult> => {
  const poolId = normalizeUint(input.poolId, "poolId", 256, false);
  const feePercent = normalizeUint(input.feePercent, "feePercent", 16);
  if (feePercent.gt(100)) throw new Error("feePercent cannot exceed 100");
  return runLaunchpadMutation(
    "updatePoolFeePercent",
    [poolId, feePercent],
    input.confirmations,
    false,
    input.onSubmitted,
  );
};

export const updatePoolFeePercent = updatePoolFee;

export const updatePoolMinInvestment = async (
  input: UpdatePoolMinInvestmentInput,
): Promise<MinedTransactionResult> =>
  runLaunchpadMutation(
    "updatePoolMinInvestment",
    [
      normalizeUint(input.poolId, "poolId", 256, false),
      normalizeUint(input.minInvestment, "minInvestment", 256, false),
    ],
    input.confirmations,
    false,
    input.onSubmitted,
  );

export const closePoolIfFinished = async (
  input: PoolActionInput,
): Promise<MinedTransactionResult> =>
  runLaunchpadMutation(
    "closePoolIfFinished",
    [normalizeUint(input.poolId, "poolId", 256, false)],
    input.confirmations,
    false,
    input.onSubmitted,
  );

export const adminUnstakeAllPoolUsers = async (
  input: PoolActionInput,
): Promise<MinedTransactionResult> =>
  runLaunchpadMutation(
    "adminUnstakeAllPoolUsers",
    [normalizeUint(input.poolId, "poolId", 256, false)],
    input.confirmations,
    false,
    input.onSubmitted,
  );

export const depositProjectTokens = async (
  input: DepositProjectTokensInput,
): Promise<DepositProjectTokensResult> => {
  const poolId = normalizeUint(input.poolId, "poolId", 256, false);
  const amount = normalizeUint(input.amount, "amount", 256, false);
  const projectToken = normalizeAddress(input.projectToken, "projectToken");
  const confirmations = normalizeConfirmations(input.confirmations);
  const { provider, contract, context } = await getAuthorizedLaunchpadContract(false);

  await assertDeployedContract(provider, projectToken, "Project token");
  const token = new Contract(projectToken, erc20AdminAbi, provider.getSigner());
  const [allowance, balance] = (await Promise.all([
    token.allowance(context.account, launchpadDeployment.contracts.launchpad),
    token.balanceOf(context.account),
  ])) as [BigNumber, BigNumber];

  if (balance.lt(amount)) {
    throw new Error("The connected admin wallet does not have enough project tokens");
  }

  const approvalTransactions: MinedTransactionResult[] = [];
  if (allowance.lt(amount)) {
    // Reset first for tokens which reject non-zero -> non-zero allowance changes.
    if (!allowance.isZero()) {
      await assertExpectedChain(provider);
      const resetTx = (await token.approve(
        launchpadDeployment.contracts.launchpad,
        0,
      )) as ContractTransaction;
      assertTransactionTarget(resetTx, projectToken);
      approvalTransactions.push(
        toPublicTransactionResult(
          await waitForMinedTransaction(resetTx, confirmations, projectToken),
        ),
      );
    }

    await assertExpectedChain(provider);
    const approveTx = (await token.approve(
      launchpadDeployment.contracts.launchpad,
      amount,
    )) as ContractTransaction;
    assertTransactionTarget(approveTx, projectToken);
    approvalTransactions.push(
      toPublicTransactionResult(
        await waitForMinedTransaction(approveTx, confirmations, projectToken),
      ),
    );

    const confirmedAllowance = BigNumber.from(
      await token.allowance(context.account, launchpadDeployment.contracts.launchpad),
    );
    if (confirmedAllowance.lt(amount)) {
      throw new Error("Project token allowance is still lower than the deposit amount");
    }
  }

  await assertExpectedChain(provider);
  const depositTx = (await contract.depositProjectTokens(
    poolId,
    projectToken,
    amount,
  )) as ContractTransaction;
  assertTransactionTarget(depositTx, launchpadDeployment.contracts.launchpad);
  if (input.onSubmitted) {
    try {
      await input.onSubmitted({ txHash: depositTx.hash });
    } catch (error) {
      throw new LaunchpadMutationSubmissionCallbackError(depositTx.hash, error);
    }
  }
  const mined = await waitForMinedTransaction(
    depositTx,
    confirmations,
    launchpadDeployment.contracts.launchpad,
  );

  return {
    ...toPublicTransactionResult(mined),
    approvalTransactions,
  };
};

export const addAdmin = async (
  input: AdminAccountActionInput,
): Promise<MinedTransactionResult> =>
  runLaunchpadMutation(
    "addAdmin",
    [normalizeAddress(input.account, "account")],
    input.confirmations,
    true,
    input.onSubmitted,
  );

export const removeAdmin = async (
  input: AdminAccountActionInput,
): Promise<MinedTransactionResult> =>
  runLaunchpadMutation(
    "removeAdmin",
    [normalizeAddress(input.account, "account")],
    input.confirmations,
    true,
    input.onSubmitted,
  );

export const setInvestmentReceiver = async (
  input: ReceiverActionInput,
): Promise<MinedTransactionResult> =>
  runLaunchpadMutation(
    "setInvestmentReceiver",
    [normalizeAddress(input.receiver, "receiver")],
    input.confirmations,
    true,
    input.onSubmitted,
  );

export const setFeeReceiver = async (
  input: ReceiverActionInput,
): Promise<MinedTransactionResult> =>
  runLaunchpadMutation(
    "setFeeReceiver",
    [normalizeAddress(input.receiver, "receiver")],
    input.confirmations,
    true,
    input.onSubmitted,
  );

export const transferOwnership = async (
  input: TransferOwnershipInput,
): Promise<MinedTransactionResult> =>
  runLaunchpadMutation(
    "transferOwnership",
    [normalizeAddress(input.newOwner, "newOwner")],
    input.confirmations,
    true,
    input.onSubmitted,
  );

const getReadProvider = async (
  provider?: providers.Provider,
): Promise<providers.Provider> => {
  if (provider) {
    await assertExpectedChain(provider);
    return provider;
  }

  if (typeof window !== "undefined") {
    const ethereum = (window as unknown as { ethereum?: InjectedEthereum }).ethereum;
    if (ethereum) {
      const injectedProvider = new providers.Web3Provider(ethereum, "any");
      await assertExpectedChain(injectedProvider);
      return injectedProvider;
    }
  }

  const rpcProvider = new providers.JsonRpcProvider(
    launchpadDeployment.rpcUrl,
    LAUNCHPAD_CHAIN_ID,
  );
  await assertExpectedChain(rpcProvider);
  return rpcProvider;
};

export const readLaunchpadPool = async (input: {
  poolId: UintInput;
  provider?: providers.Provider;
}): Promise<LaunchpadPool> => {
  const provider = await getReadProvider(input.provider);
  await assertDeployedContract(provider, launchpadDeployment.contracts.launchpad, "Launchpad");
  const contract = new Contract(
    launchpadDeployment.contracts.launchpad,
    launchpadAbi,
    provider,
  );
  const pool = await contract.getPoolInfo(
    normalizeUint(input.poolId, "poolId", 256, false),
  );

  return {
    id: BigNumber.from(pool.id).toString(),
    investToken: utils.getAddress(pool.investToken),
    targetAmount: BigNumber.from(pool.targetAmount).toString(),
    raisedAmount: BigNumber.from(pool.raisedAmount).toString(),
    greenSeats: BigNumber.from(pool.greenSeats).toNumber(),
    yellowSeats: BigNumber.from(pool.yellowSeats).toNumber(),
    stakeStart: BigNumber.from(pool.stakeStart).toString(),
    greenStart: BigNumber.from(pool.greenStart).toString(),
    greenEnd: BigNumber.from(pool.greenEnd).toString(),
    yellowSlotDuration: BigNumber.from(pool.yellowSlotDuration).toString(),
    minInvestment: BigNumber.from(pool.minInvestment).toString(),
    feePercent: BigNumber.from(pool.feePercent).toNumber(),
    projectToken: utils.getAddress(pool.projectToken),
    projectTokenAmount: BigNumber.from(pool.projectTokenAmount).toString(),
    claimEnabled: Boolean(pool.claimEnabled),
    stakeReleaseEnabled: Boolean(pool.stakeReleaseEnabled),
    closed: Boolean(pool.closed),
    exists: Boolean(pool.exists),
  };
};

export const readErc20Metadata = async (input: {
  token: string;
  provider?: providers.Provider;
}): Promise<{ address: string; symbol: string; decimals: number }> => {
  const address = normalizeAddress(input.token, "token");
  const provider = await getReadProvider(input.provider);
  await assertDeployedContract(provider, address, "ERC20 token");
  const token = new Contract(address, erc20AdminAbi, provider);
  const [symbol, decimals] = await Promise.all([
    token.symbol() as Promise<string>,
    token.decimals() as Promise<number>,
  ]);

  return { address, symbol, decimals: Number(decimals) };
};

const findRevertData = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as {
    data?: unknown;
    error?: { data?: unknown; error?: { data?: unknown } };
  };
  const values = [candidate.data, candidate.error?.data, candidate.error?.error?.data];
  return values.find((value): value is string => typeof value === "string" && value.startsWith("0x"));
};

export const getLaunchpadErrorMessage = (error: unknown): string => {
  const revertData = findRevertData(error);
  if (revertData) {
    try {
      return launchpadInterface.parseError(revertData).name;
    } catch {
      // Fall through to the provider/wallet message.
    }
  }

  if (error && typeof error === "object") {
    const reason = (error as { reason?: unknown }).reason;
    if (typeof reason === "string" && reason) return reason;
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }

  return String(error || "Unknown Launchpad error");
};

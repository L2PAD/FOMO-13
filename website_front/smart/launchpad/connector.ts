import type { Address, Hash, PublicClient, WalletClient } from "viem";
import { erc20LaunchpadAbi, erc721LaunchpadAbi, launchpadAbi } from "./abi";

export interface LaunchpadWriteClients {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: Address;
}

export interface LaunchpadWriteResult {
  /** Authoritative hash from the mined receipt (may differ after wallet replacement). */
  hash: Hash;
  /** Original broadcast hash when the wallet sped up/repriced the transaction. */
  submittedHash?: Hash;
  blockNumber: bigint;
  status: "success";
}

const writeAndWait = async (
  clients: LaunchpadWriteClients,
  request: Parameters<WalletClient["writeContract"]>[0],
  onSubmitted?: (hash: Hash) => void
): Promise<LaunchpadWriteResult> => {
  const submittedHash = await clients.walletClient.writeContract(request);
  onSubmitted?.(submittedHash);
  const receipt = await clients.publicClient.waitForTransactionReceipt({ hash: submittedHash });
  if (receipt.status !== "success") {
    throw new Error("The wallet transaction was reverted.");
  }
  const hash = receipt.transactionHash;
  return {
    hash,
    ...(hash.toLowerCase() !== submittedHash.toLowerCase() ? { submittedHash } : {}),
    blockNumber: receipt.blockNumber,
    status: "success",
  };
};

export const approveLaunchpadInvestment = async (
  clients: LaunchpadWriteClients,
  token: Address,
  launchpad: Address,
  amount: bigint,
  onSubmitted?: (hash: Hash) => void
): Promise<LaunchpadWriteResult> => {
  const { request } = await clients.publicClient.simulateContract({
    account: clients.account,
    address: token,
    abi: erc20LaunchpadAbi,
    functionName: "approve",
    args: [launchpad, amount],
  });
  return writeAndWait(clients, request, onSubmitted);
};

export const investInLaunchpadPool = async (
  clients: LaunchpadWriteClients,
  launchpad: Address,
  poolId: bigint,
  amount: bigint,
  onSubmitted?: (hash: Hash) => void
): Promise<LaunchpadWriteResult> => {
  const { request } = await clients.publicClient.simulateContract({
    account: clients.account,
    address: launchpad,
    abi: launchpadAbi,
    functionName: "invest",
    args: [poolId, amount],
  });
  return writeAndWait(clients, request, onSubmitted);
};

export const approveLaunchpadNfts = async (
  clients: LaunchpadWriteClients,
  nft: Address,
  launchpad: Address,
  onSubmitted?: (hash: Hash) => void
): Promise<LaunchpadWriteResult> => {
  const { request } = await clients.publicClient.simulateContract({
    account: clients.account,
    address: nft,
    abi: erc721LaunchpadAbi,
    functionName: "setApprovalForAll",
    args: [launchpad, true],
  });
  return writeAndWait(clients, request, onSubmitted);
};

export const stakeLaunchpadNfts = async (
  clients: LaunchpadWriteClients,
  launchpad: Address,
  poolId: bigint,
  tokenIds: bigint[],
  onSubmitted?: (hash: Hash) => void
): Promise<LaunchpadWriteResult> => {
  if (tokenIds.length === 0) {
    throw new Error("Select at least one NFT to stake.");
  }
  if (new Set(tokenIds.map(String)).size !== tokenIds.length) {
    throw new Error("The NFT stake selection contains duplicate token IDs.");
  }
  const { request } = await clients.publicClient.simulateContract({
    account: clients.account,
    address: launchpad,
    abi: launchpadAbi,
    functionName: "stakeNfts",
    args: [poolId, tokenIds],
  });
  return writeAndWait(clients, request, onSubmitted);
};

export const unstakeLaunchpadNfts = async (
  clients: LaunchpadWriteClients,
  launchpad: Address,
  poolId: bigint,
  onSubmitted?: (hash: Hash) => void
): Promise<LaunchpadWriteResult> => {
  const { request } = await clients.publicClient.simulateContract({
    account: clients.account,
    address: launchpad,
    abi: launchpadAbi,
    functionName: "unstakePoolNfts",
    args: [poolId],
  });
  return writeAndWait(clients, request, onSubmitted);
};

export const claimLaunchpadReceipt = async (
  clients: LaunchpadWriteClients,
  launchpad: Address,
  receiptTokenId: bigint,
  onSubmitted?: (hash: Hash) => void
): Promise<LaunchpadWriteResult> => {
  const { request } = await clients.publicClient.simulateContract({
    account: clients.account,
    address: launchpad,
    abi: launchpadAbi,
    functionName: "claim",
    args: [receiptTokenId],
  });
  return writeAndWait(clients, request, onSubmitted);
};

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getWalletClient } from "@wagmi/core";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useChainId, usePublicClient, useSwitchChain } from "wagmi";
import { formatUnits, getAddress, isAddress, parseUnits, type Address, type Hash, type PublicClient } from "viem";
import { toast } from "react-toastify";
import {
  PageWrapper,
  TwoColLayout,
  MainColumn,
  Sidebar,
  StatusBadge,
  SimilarSection,
  SimilarTitle,
  SimilarGrid,
  SimilarCard,
  SimilarCardTop,
  SimilarCardHeader,
  SimilarCardInfo,
  SimilarLogo,
  SimilarCardMeta,
  SimilarCardName,
  SimilarCardCategory,
  SimilarStatsRow,
  SimilarStatBox,
  SimilarStatLabel,
  SimilarStatValue,
  SimilarCardBottom,
  ProgressSection,
  ProgressHeader,
  ProgressLabel,
  ProgressPercent,
  ProgressBarBg,
  ProgressBarFill,
  SimilarCardDivider,
  SimilarCardFooter,
  TimeLeftLabel,
  EligibleLabel,
  ToastContainer,
  ToastBox,
  ToastIconWrap,
  ToastContent,
  ToastTitle,
  ToastText,
  ModalOverlay,
  ModalCard,
  ModalHeader,
  ModalIconCircle,
  ModalTitleGroup,
  ModalTitle,
  ModalSubtitle,
  ModalAmountBox,
  ModalAmountLabel,
  ModalAmountRow,
  ModalAmountNumber,
  ModalAmountTicker,
  ModalViewBtn,
  Card,
} from "./styles";
import { TabVariant } from "./types";
import {
  IconCircleCheck,
  IconClockMedium,
  IconCheckbox,
  IconCircleCheck36,
  IconExternalLink,
} from "../../../global/Icons/Launchpad/icons";
import ProjectHeader from "./ProjectHeader";
import SaleTimeline from "./SaleTimeline";
import DetailsTab from "./DetailsTab";
import IdoTab from "./IdoTab";
import LeaderboardTab from "./LeaderboardTab";
import SidebarAllocationCard from "./SidebarAllocationCard";
import SidebarNftCard from "./SidebarNftCard";
import SidebarLeaderboard from "./SidebarLeaderboard";
import SidebarFlags from "./SidebarFlags";
import NftStakeSelectionModal from "./NftStakeSelectionModal";
import { LaunchpadDetailSkeleton } from "../LaunchpadLoadingSkeletons";
import { LoadingContext } from "../../../global/Layout";
import {
  fetchFomoV2LaunchpadDetail,
  LaunchpadApiError,
  verifyFomoV2LaunchpadTransaction,
} from "../../../../http/fomoV2Launchpad";
import type {
  FomoV2LaunchpadDetail,
  FomoV2LaunchpadTransactionAction,
} from "../../../../types/fomoV2Launchpad";
import {
  amountToRaw,
  clearLaunchpadRecovery,
  isCurrentLaunchpadInvestZone,
  lifecycleTimelineIndex,
  mapLaunchpadDetailToView,
  normalizeLaunchpadZone,
  rawBigInt,
  rawUint,
  readLaunchpadRecovery,
  saveLaunchpadRecovery,
  validateInvestmentAmount,
} from "../../../../utils/fomoV2Launchpad";
import {
  fulfilledValues,
  hasOnlyAvailableNftSelection,
  mergeStakeableNftTokenIds,
  settledValue,
} from "../../../../utils/launchpadParticipation";
import { wagmiAdapter } from "../../../../config/web3";
import { erc20LaunchpadAbi, erc721LaunchpadAbi, launchpadAbi } from "../../../../smart/launchpad/abi";
import {
  approveLaunchpadInvestment,
  approveLaunchpadNfts,
  claimLaunchpadReceipt,
  investInLaunchpadPool,
  stakeLaunchpadNfts,
  unstakeLaunchpadNfts,
  type LaunchpadWriteClients,
  type LaunchpadWriteResult,
} from "../../../../smart/launchpad/connector";
import {
  BSC_TESTNET_CHAIN_ID,
  FOMO_LAUNCHPAD_ADDRESS,
  FOMO_LAUNCHPAD_USDT_ADDRESS,
  FOMO_STAKING_NFT_ADDRESS,
} from "../../../../smart/launchpad/constants";

interface LaunchpadProjectDetailProps {
  id: string;
}

type PendingAction = FomoV2LaunchpadTransactionAction | "approve_investment" | "approve_nft" | null;

const errorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "shortMessage" in error) {
    return String((error as { shortMessage?: unknown }).shortMessage || "Transaction failed.");
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
};

const normalizeAddress = (value: string, label: string): Address => {
  if (!isAddress(value)) throw new Error(`${label} address is invalid.`);
  return getAddress(value);
};

const LaunchpadProjectDetail: React.FC<LaunchpadProjectDetailProps> = ({ id }) => {
  const { address, isConnected } = useAccount();
  const { loadingStateHandler } = useContext(LoadingContext);
  const { open: openAppKit } = useAppKit();
  const chainId = useChainId();
  const bscClient = usePublicClient({ chainId: BSC_TESTNET_CHAIN_ID });
  const { switchChainAsync } = useSwitchChain();
  const [detail, setDetail] = useState<FomoV2LaunchpadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabVariant>("details");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [investAmount, setInvestAmount] = useState("0");
  const [lbPage, setLbPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [allowance, setAllowance] = useState(0n);
  const [investTokenBalance, setInvestTokenBalance] = useState(0n);
  const [nftApproved, setNftApproved] = useState(false);
  const [stakeableNftTokenIds, setStakeableNftTokenIds] = useState<bigint[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showClaimToast, setShowClaimToast] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<Hash | null>(null);
  const [recoveryTick, setRecoveryTick] = useState(0);
  const recoveringRef = useRef<string | null>(null);
  const recoveryAttemptsRef = useRef<Record<string, number>>({});
  const recoveryTimerRef = useRef<number | null>(null);

  const loadDetail = useCallback(async (signal?: AbortSignal, quiet = false) => {
    if (!id) return;
    if (!quiet) {
      setIsLoading(true);
      setLoadError(null);
      setNotFound(false);
    }
    try {
      const next = await fetchFomoV2LaunchpadDetail(id, address, signal);
      setDetail(next);
      setNotFound(false);
      setLoadError(null);
      setOpenFaqId((current) => current || (next.launch.faq?.length ? "faq-0" : null));
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof LaunchpadApiError && error.status === 404) {
        setNotFound(true);
        setDetail(null);
      } else if (!quiet) {
        setLoadError(errorMessage(error));
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [address, id]);

  useEffect(() => {
    const controller = new AbortController();
    void loadDetail(controller.signal);
    return () => controller.abort();
  }, [loadDetail]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadDetail(undefined, true);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadDetail]);

  const project = useMemo(() => detail ? mapLaunchpadDetailToView(detail) : null, [detail]);
  const participation = detail?.participation || null;
  const activeTimelineIndex = detail ? lifecycleTimelineIndex(detail.lifecycle) : 0;
  const zone = normalizeLaunchpadZone(participation?.zone, participation?.activeStakeCount);
  const investDecimals = detail?.contract.investToken.decimals ?? 18;
  const investSymbol = detail?.contract.investToken.symbol || "USDT";
  const minInvestmentRaw = rawUint(
    detail?.pool.createParams?.minInvestmentAmount ?? detail?.pool.createParams?.minInvestment
  );
  const maxInvestmentRaw = rawUint(participation?.maxAllowedNow);
  const parsedInvestment = useMemo(
    () => validateInvestmentAmount(investAmount, investDecimals, minInvestmentRaw, maxInvestmentRaw),
    [investAmount, investDecimals, maxInvestmentRaw, minInvestmentRaw]
  );

  const launchpadAddress = useMemo(() => {
    if (!detail) return null;
    try { return normalizeAddress(detail.contract.address, "Launchpad"); } catch { return null; }
  }, [detail]);
  const investTokenAddress = useMemo(() => {
    if (!detail) return null;
    try { return normalizeAddress(detail.contract.investToken.address, "Investment token"); } catch { return null; }
  }, [detail]);
  const nftAddress = useMemo(() => {
    const configured = detail?.contract.stakingNftAddress || FOMO_STAKING_NFT_ADDRESS;
    try { return normalizeAddress(configured, "Staking NFT"); } catch { return FOMO_STAKING_NFT_ADDRESS; }
  }, [detail]);

  const refreshWalletReads = useCallback(async () => {
    if (!address || !bscClient || !launchpadAddress || !investTokenAddress) {
      setAllowance(0n);
      setInvestTokenBalance(0n);
      setNftApproved(false);
      setStakeableNftTokenIds([]);
      return;
    }
    const [allowanceResult, tokenBalanceResult] = await Promise.allSettled([
      bscClient.readContract({
        address: investTokenAddress,
        abi: erc20LaunchpadAbi,
        functionName: "allowance",
        args: [address, launchpadAddress],
      }),
      bscClient.readContract({
        address: investTokenAddress,
        abi: erc20LaunchpadAbi,
        functionName: "balanceOf",
        args: [address],
      }),
    ]);
    setAllowance(settledValue(allowanceResult, 0n));
    setInvestTokenBalance(settledValue(tokenBalanceResult, 0n));

    try {
      const [approvedResult, balanceResult] = await Promise.allSettled([
        bscClient.readContract({
          address: nftAddress,
          abi: erc721LaunchpadAbi,
          functionName: "isApprovedForAll",
          args: [address, launchpadAddress],
        }),
        bscClient.readContract({
          address: nftAddress,
          abi: erc721LaunchpadAbi,
          functionName: "balanceOf",
          args: [address],
        }),
      ]);
      const approved = settledValue(approvedResult, false);
      const balance = settledValue(balanceResult, 0n);
      setNftApproved(approved);
      const count = Number(balance > 100n ? 100n : balance);
      const walletOwnedResults = await Promise.allSettled(Array.from({ length: count }, (_, index) => (
        bscClient.readContract({
          address: nftAddress,
          abi: erc721LaunchpadAbi,
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(index)],
        })
      )));
      const walletOwnedIds = fulfilledValues(walletOwnedResults);
      const reusableIds = (participation?.reusableStakedTokenIds || [])
        .map((value) => rawUint(value, ""))
        .filter(Boolean)
        .map(BigInt);
      const uniqueReusableIds = Array.from(new Map(
        reusableIds.map((tokenId) => [tokenId.toString(), tokenId])
      ).values());
      const activeCurrentIds = new Set(
        (participation?.activeStakedTokenIds || []).map((value) => rawUint(value, ""))
      );
      const currentPoolId = rawBigInt(detail?.pool.poolId);
      const reusableAvailability = await Promise.all(uniqueReusableIds.map(async (tokenId) => {
        try {
          const alreadyInPool = await bscClient.readContract({
            address: launchpadAddress,
            abi: launchpadAbi,
            functionName: "isTokenStakedInPool",
            args: [currentPoolId, address, tokenId],
          });
          return !alreadyInPool;
        } catch {
          return !activeCurrentIds.has(tokenId.toString());
        }
      }));
      const availableReusableIds = uniqueReusableIds.filter((_, index) => reusableAvailability[index]);
      setStakeableNftTokenIds(mergeStakeableNftTokenIds(walletOwnedIds, availableReusableIds));
    } catch {
      setNftApproved(false);
      setStakeableNftTokenIds([]);
    }
  }, [
    address,
    bscClient,
    detail?.pool.poolId,
    investTokenAddress,
    launchpadAddress,
    nftAddress,
    participation?.activeStakedTokenIds,
    participation?.reusableStakedTokenIds,
  ]);

  useEffect(() => { void refreshWalletReads(); }, [refreshWalletReads, detail]);

  useEffect(() => {
    if (!showClaimToast) return;
    const timer = window.setTimeout(() => setShowClaimToast(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showClaimToast]);

  useEffect(() => () => {
    if (recoveryTimerRef.current !== null) window.clearTimeout(recoveryTimerRef.current);
  }, []);

  const runSmartAction = useCallback(async (action: () => Promise<void>) => {
    loadingStateHandler(true);
    try {
      await action();
    } finally {
      loadingStateHandler(false);
    }
  }, [loadingStateHandler]);

  const getWriteClients = useCallback(async (): Promise<LaunchpadWriteClients> => {
    if (!address || !isConnected) throw new Error("Connect your wallet to continue.");
    if (!bscClient) throw new Error("BSC testnet RPC is unavailable.");
    if (detail?.contract.chainId !== BSC_TESTNET_CHAIN_ID) {
      throw new Error(`This launch is configured for unsupported chain ${detail?.contract.chainId}.`);
    }
    if (!launchpadAddress || launchpadAddress.toLowerCase() !== FOMO_LAUNCHPAD_ADDRESS.toLowerCase()) {
      throw new Error("Backend Launchpad address does not match the BSC testnet deployment.");
    }
    if (!investTokenAddress || investTokenAddress.toLowerCase() !== FOMO_LAUNCHPAD_USDT_ADDRESS.toLowerCase()) {
      throw new Error("Backend investment token does not match the BSC testnet USDT deployment.");
    }
    if (nftAddress.toLowerCase() !== FOMO_STAKING_NFT_ADDRESS.toLowerCase()) {
      throw new Error("Backend staking NFT does not match the Spaceport deployment.");
    }
    if (chainId !== BSC_TESTNET_CHAIN_ID) {
      await switchChainAsync({ chainId: BSC_TESTNET_CHAIN_ID });
    }
    const walletClient = await getWalletClient(wagmiAdapter.wagmiConfig, {
      chainId: BSC_TESTNET_CHAIN_ID,
    });
    if (!walletClient) throw new Error("Wallet client is unavailable.");
    return {
      publicClient: bscClient as PublicClient,
      walletClient,
      account: getAddress(address),
    };
  }, [address, bscClient, chainId, detail?.contract.chainId, investTokenAddress, isConnected, launchpadAddress, nftAddress, switchChainAsync]);

  const verifyTransaction = useCallback(async (
    action: FomoV2LaunchpadTransactionAction,
    hash: Hash
  ) => {
    if (!detail || !address) throw new Error("Launch or wallet context was lost.");
    const response = await verifyFomoV2LaunchpadTransaction(detail.id, {
      txHash: hash,
      action,
      wallet: address,
    });
    if (response.launch) setDetail(response.launch);
    const status = response.verification.status;
    if (status === "confirmed") {
      clearLaunchpadRecovery(detail.id, address);
      setActionMessage("Transaction confirmed and synchronized.");
      return true;
    }
    if (status === "failed") {
      clearLaunchpadRecovery(detail.id, address);
      throw new Error(response.verification.reason || "Backend verification rejected the transaction.");
    }
    setActionMessage("Transaction is mined; backend confirmation is still pending.");
    return false;
  }, [address, detail]);

  const runVerifiedWrite = useCallback(async (
    action: FomoV2LaunchpadTransactionAction,
    writer: (
      clients: LaunchpadWriteClients,
      onSubmitted: (hash: Hash) => void
    ) => Promise<LaunchpadWriteResult>
  ) => {
    if (!detail || !address) throw new Error("Connect your wallet and reload this launch.");
    setPendingAction(action);
    setActionMessage("");
    try {
      const clients = await getWriteClients();
      const onSubmitted = (hash: Hash) => {
        setLastTxHash(hash);
        saveLaunchpadRecovery({
          launchpadId: detail.id,
          wallet: address,
          txHash: hash,
          action,
          createdAt: new Date().toISOString(),
        });
        setActionMessage("Transaction submitted. Waiting for BSC confirmation…");
      };
      const result = await writer(clients, onSubmitted);
      if (result.submittedHash && result.submittedHash.toLowerCase() !== result.hash.toLowerCase()) {
        setLastTxHash(result.hash);
        saveLaunchpadRecovery({
          launchpadId: detail.id,
          wallet: address,
          txHash: result.hash,
          action,
          createdAt: new Date().toISOString(),
        });
        setActionMessage("Wallet replacement mined. Verifying its final transaction hash…");
      }
      const confirmed = await verifyTransaction(action, result.hash);
      await loadDetail(undefined, true);
      await refreshWalletReads();
      if (confirmed) {
        toast.success(`${action.charAt(0).toUpperCase()}${action.slice(1)} confirmed`);
      }
      return confirmed;
    } catch (error) {
      const message = errorMessage(error);
      setActionMessage(message);
      toast.error(message);
      return false;
    } finally {
      setPendingAction(null);
    }
  }, [address, detail, getWriteClients, loadDetail, refreshWalletReads, verifyTransaction]);

  useEffect(() => {
    if (!detail || !address || !bscClient || pendingAction) return;
    const recovery = readLaunchpadRecovery(detail.id, address);
    if (!recovery || recoveringRef.current === recovery.txHash) return;
    recoveringRef.current = recovery.txHash;
    setActionMessage(`Recovering submitted ${recovery.action} transaction…`);
    const scheduleRecovery = (message: string) => {
      const attempt = (recoveryAttemptsRef.current[recovery.txHash] || 0) + 1;
      recoveryAttemptsRef.current[recovery.txHash] = attempt;
      setActionMessage(message);
      if (attempt < 12) {
        recoveryTimerRef.current = window.setTimeout(() => {
          recoveringRef.current = null;
          setRecoveryTick((value) => value + 1);
        }, Math.min(30_000, 2_000 * attempt));
      } else {
        setActionMessage("Backend confirmation is still pending. It will be recovered on the next page load.");
      }
    };
    void (async () => {
      try {
        const receipt = await bscClient.waitForTransactionReceipt({ hash: recovery.txHash });
        const recoveredHash = receipt.transactionHash;
        if (recoveredHash.toLowerCase() !== recovery.txHash.toLowerCase()) {
          saveLaunchpadRecovery({ ...recovery, txHash: recoveredHash });
          setLastTxHash(recoveredHash);
        }
        const confirmed = await verifyTransaction(recovery.action, recoveredHash);
        if (confirmed) {
          delete recoveryAttemptsRef.current[recovery.txHash];
          await loadDetail(undefined, true);
          await refreshWalletReads();
        } else {
          scheduleRecovery("Transaction is mined; backend confirmation is still pending.");
        }
      } catch (error) {
        if (readLaunchpadRecovery(detail.id, address)) {
          scheduleRecovery(`Recovery pending: ${errorMessage(error)}`);
        } else {
          setActionMessage(errorMessage(error));
        }
      }
    })();
  }, [address, bscClient, detail, loadDetail, pendingAction, recoveryTick, refreshWalletReads, verifyTransaction]);

  const handleInvest = useCallback(async () => {
    if (!isConnected || !address) {
      await openAppKit({ view: "Connect" });
      return;
    }
    if (!detail || !launchpadAddress || !investTokenAddress) {
      setActionMessage("Launchpad contract configuration is invalid.");
      return;
    }
    if (chainId !== BSC_TESTNET_CHAIN_ID) {
      setActionMessage("Confirm switching your wallet to BSC Testnet.");
      try {
        await getWriteClients();
        setActionMessage("Wallet switched to BSC Testnet. Click Invest again to continue.");
      } catch (error) {
        setActionMessage(errorMessage(error));
      }
      return;
    }
    if (!participation?.canInvestNow) {
      setActionMessage("Your purchase window is not open.");
      return;
    }
    if (!parsedInvestment.raw) {
      setActionMessage(parsedInvestment.error || "Enter an investment amount.");
      return;
    }
    if (parsedInvestment.raw > investTokenBalance) {
      setActionMessage(`Insufficient ${investSymbol} balance.`);
      return;
    }
    if (allowance < parsedInvestment.raw) {
      setPendingAction("approve_investment");
      setActionMessage("");
      try {
        const clients = await getWriteClients();
        await approveLaunchpadInvestment(
          clients,
          investTokenAddress,
          launchpadAddress,
          parsedInvestment.raw,
          () => setActionMessage("USDT approval submitted…")
        );
        setAllowance(parsedInvestment.raw);
        setActionMessage("USDT approved. Confirm Invest to participate.");
      } catch (error) {
        setActionMessage(errorMessage(error));
      } finally {
        setPendingAction(null);
      }
      return;
    }
    await runVerifiedWrite("invest", (clients, submitted) => (
      investInLaunchpadPool(
        clients,
        launchpadAddress,
        rawBigInt(detail.pool.poolId),
        parsedInvestment.raw as bigint,
        submitted
      )
    ));
  }, [address, allowance, chainId, detail, getWriteClients, investSymbol, investTokenAddress, investTokenBalance, isConnected, launchpadAddress, openAppKit, parsedInvestment, participation?.canInvestNow, runVerifiedWrite]);

  const handleStake = useCallback(async () => {
    if (!isConnected || !address) {
      await openAppKit({ view: "Connect" });
      return;
    }
    if (!detail || !launchpadAddress) return;
    if (detail.lifecycle !== "staking") {
      setActionMessage("NFT staking is not open for this launch.");
      return;
    }
    if (stakeableNftTokenIds.length === 0) {
      setActionMessage("No wallet-owned or reusable FOMO NFTs are available to stake.");
      return;
    }
    setShowStakeModal(true);
  }, [address, detail, isConnected, launchpadAddress, openAppKit, stakeableNftTokenIds.length]);

  const handleConfirmStake = useCallback(async (tokenIds: bigint[]) => {
    if (!detail || !launchpadAddress || !address || tokenIds.length === 0) return;
    if (!hasOnlyAvailableNftSelection(tokenIds, stakeableNftTokenIds)) {
      setActionMessage("One or more selected NFTs are no longer available.");
      return;
    }
    let hasWalletOwnedToken = false;
    try {
      if (!bscClient) throw new Error("BSC testnet RPC is unavailable.");
      const ownership = await Promise.all(tokenIds.map(async (tokenId) => {
        const [owner, usageCount, alreadyInPool] = await Promise.all([
          bscClient.readContract({
            address: nftAddress,
            abi: erc721LaunchpadAbi,
            functionName: "ownerOf",
            args: [tokenId],
          }),
          bscClient.readContract({
            address: launchpadAddress,
            abi: launchpadAbi,
            functionName: "userTokenPoolUsageCount",
            args: [address, tokenId],
          }),
          bscClient.readContract({
            address: launchpadAddress,
            abi: launchpadAbi,
            functionName: "isTokenStakedInPool",
            args: [rawBigInt(detail.pool.poolId), address, tokenId],
          }),
        ]);
        return { owner, usageCount, alreadyInPool };
      }));
      if (ownership.some(({ alreadyInPool }) => alreadyInPool)) {
        throw new Error("At least one selected NFT is already active in this pool.");
      }
      if (ownership.some(({ owner, usageCount }) => (
        owner.toLowerCase() !== address.toLowerCase()
        && !(owner.toLowerCase() === launchpadAddress.toLowerCase() && usageCount > 0n)
      ))) {
        throw new Error("At least one selected NFT is neither wallet-owned nor reusable by this wallet.");
      }
      hasWalletOwnedToken = ownership.some(({ owner }) => (
        owner.toLowerCase() === address.toLowerCase()
      ));
    } catch (error) {
      setActionMessage(errorMessage(error));
      return;
    }

    if (hasWalletOwnedToken && !nftApproved) {
      setPendingAction("approve_nft");
      try {
        const clients = await getWriteClients();
        await approveLaunchpadNfts(clients, nftAddress, launchpadAddress, () => (
          setActionMessage("NFT approval submitted…")
        ));
        setNftApproved(true);
        setActionMessage("NFT contract approved. Confirm the staking transaction in your wallet.");
      } catch (error) {
        const message = errorMessage(error);
        setActionMessage(message);
        toast.error(message);
        return;
      } finally {
        setPendingAction(null);
      }
    }

    const confirmed = await runVerifiedWrite("stake", (clients, submitted) => (
      stakeLaunchpadNfts(clients, launchpadAddress, rawBigInt(detail.pool.poolId), tokenIds, submitted)
    ));
    if (confirmed) setShowStakeModal(false);
  }, [address, bscClient, detail, getWriteClients, launchpadAddress, nftAddress, nftApproved, runVerifiedWrite, stakeableNftTokenIds]);

  const handleUnstake = useCallback(async () => {
    if (!detail || !launchpadAddress || !participation?.canUnstake) {
      setActionMessage("The contract has not enabled NFT unstaking for this pool.");
      return;
    }
    await runVerifiedWrite("unstake", (clients, submitted) => (
      unstakeLaunchpadNfts(clients, launchpadAddress, rawBigInt(detail.pool.poolId), submitted)
    ));
  }, [detail, launchpadAddress, participation?.canUnstake, runVerifiedWrite]);

  const handleClaim = useCallback(async () => {
    if (!detail || !launchpadAddress || !participation) return;
    if (!participation.canClaim && !participation.canRefund) {
      setActionMessage("This receipt is not claimable yet.");
      return;
    }
    let receiptTokenId: string | undefined;
    let receiptReadSucceeded = false;
    if (bscClient) {
      for (const candidate of participation.receiptTokenIds) {
        try {
          const receipt = await bscClient.readContract({
            address: launchpadAddress,
            abi: launchpadAbi,
            functionName: "getReceiptInfo",
            args: [rawBigInt(candidate)],
          });
          receiptReadSucceeded = true;
          const [, investor, , burned] = receipt;
          if (!burned && address && investor.toLowerCase() === address.toLowerCase()) {
            receiptTokenId = candidate;
            break;
          }
        } catch {
          // Backend receipts remain the source of truth if an RPC read is temporarily unavailable.
        }
      }
    }
    if (!receiptReadSucceeded) receiptTokenId = participation.receiptTokenIds[0];
    if (!receiptTokenId) {
      setActionMessage("No claim receipt was found for this wallet.");
      return;
    }
    const confirmed = await runVerifiedWrite("claim", (clients, submitted) => (
      claimLaunchpadReceipt(clients, launchpadAddress, rawBigInt(receiptTokenId), submitted)
    ));
    if (confirmed) {
      setShowClaimModal(true);
      setShowClaimToast(true);
    }
  }, [address, bscClient, detail, launchpadAddress, participation, runVerifiedWrite]);

  const adjustAmount = useCallback((increment: string, setMaximum = false) => {
    if (setMaximum) {
      setInvestAmount(formatUnits(rawBigInt(maxInvestmentRaw), investDecimals));
      return;
    }
    let current = 0n;
    try { current = amountToRaw(investAmount || "0", investDecimals); } catch { current = 0n; }
    const delta = parseUnits(increment, investDecimals);
    const max = rawBigInt(maxInvestmentRaw);
    const next = max > 0n && current + delta > max ? max : current + delta;
    setInvestAmount(formatUnits(next, investDecimals));
  }, [investAmount, investDecimals, maxInvestmentRaw]);

  const stepAmount = useCallback((direction: "up" | "down") => {
    if (direction === "up") {
      adjustAmount("1");
      return;
    }
    let current = 0n;
    try { current = amountToRaw(investAmount || "0", investDecimals); } catch { current = 0n; }
    const one = parseUnits("1", investDecimals);
    setInvestAmount(formatUnits(current > one ? current - one : 0n, investDecimals));
  }, [adjustAmount, investAmount, investDecimals]);

  if (isLoading && !detail) {
    return <PageWrapper><LaunchpadDetailSkeleton /></PageWrapper>;
  }
  if (notFound) {
    return <PageWrapper><Card>This launch was not found or is not published.</Card></PageWrapper>;
  }
  if (loadError || !detail || !project) {
    return (
      <PageWrapper>
        <Card>
          <p>{loadError || "Launch data is unavailable."}</p>
          <button type="button" onClick={() => void loadDetail()}>Try again</button>
        </Card>
      </PageWrapper>
    );
  }

  const investmentActionLabel = !isConnected
    ? "Connect wallet"
    : pendingAction === "approve_investment"
      ? "Approving…"
      : pendingAction === "invest"
        ? "Investing…"
        : chainId !== BSC_TESTNET_CHAIN_ID
          ? "Switch to BSC Testnet"
          : parsedInvestment.raw && parsedInvestment.raw > investTokenBalance
          ? `Insufficient ${investSymbol} balance`
          : parsedInvestment.raw && allowance < parsedInvestment.raw
          ? `Approve ${investSymbol}`
          : "Invest";
  const claimActionLabel = pendingAction === "claim"
    ? "Claiming…"
    : participation?.canRefund
      ? "Claim USDT Refund"
      : "Claim Tokens";
  const isPurchaseWindow = detail.lifecycle === "green" || detail.lifecycle === "yellow";
  const isCurrentInvestZone = isCurrentLaunchpadInvestZone(detail.lifecycle, zone);
  const isActiveInvestWindow = Boolean(
    isConnected && isCurrentInvestZone && participation?.canInvestNow
  );
  const canInvest = Boolean(
    isActiveInvestWindow
    && (
      chainId !== BSC_TESTNET_CHAIN_ID
      || !parsedInvestment.raw
      || parsedInvestment.raw <= investTokenBalance
    )
  );
  const canStake = detail.lifecycle === "staking";

  const getSimilarStatusVariant = (variant: string): "yellow" | "gray" | "green" | "blue" | "greenLight" => {
    if (variant === "green") return "greenLight";
    if (variant === "yellow") return "yellow";
    if (variant === "blue") return "blue";
    return "gray";
  };

  return (
    <PageWrapper>
      <ProjectHeader project={project} />
      <TwoColLayout>
        <MainColumn>
          <SaleTimeline
            project={project}
            activeTimelineIndex={activeTimelineIndex}
            onTimelineClick={() => undefined}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          {activeTab === "details" && <DetailsTab project={project} openFaqId={openFaqId} onFaqToggle={(faqId) => setOpenFaqId((current) => current === faqId ? null : faqId)} />}
          {activeTab === "ido" && <IdoTab project={project} openFaqId={openFaqId} onFaqToggle={(faqId) => setOpenFaqId((current) => current === faqId ? null : faqId)} />}
          {activeTab === "leaderboard" && (
            <LeaderboardTab
              project={project}
              lbPage={lbPage}
              onLbPageChange={setLbPage}
              onLbPageSet={setLbPage}
              openFaqId={openFaqId}
              onFaqToggle={(faqId) => setOpenFaqId((current) => current === faqId ? null : faqId)}
            />
          )}
        </MainColumn>
        <Sidebar>
          <SidebarAllocationCard
            zone={zone}
            project={project}
            activeTimelineIndex={activeTimelineIndex}
            investAmount={investAmount}
            setInvestAmount={setInvestAmount}
            onAmountStep={stepAmount}
            onQuickAmount={(value) => adjustAmount(value === "max" ? "0" : value, value === "max")}
            onInvest={() => void runSmartAction(handleInvest)}
            onClaim={() => void runSmartAction(handleClaim)}
            investmentActionLabel={investmentActionLabel}
            claimActionLabel={claimActionLabel}
            canInvest={canInvest}
            hasClaimReceipts={Boolean(participation?.receiptTokenIds.length && !participation.claimed)}
            canClaim={Boolean(participation?.canClaim)}
            canRefund={Boolean(participation?.canRefund)}
            isPending={pendingAction !== null}
            investTokenSymbol={investSymbol}
            minInvestment={project.ido.minInvestment}
            maxInvestment={project.ido.maxInvestment}
            timeRemaining={project.ido.timeRemaining}
            actionMessage={actionMessage}
            isPurchaseWindow={isPurchaseWindow}
            isActiveInvestWindow={isActiveInvestWindow}
          />
          <SidebarNftCard
            zone={zone}
            project={project}
            onStake={() => void handleStake()}
            onUnstake={() => void runSmartAction(handleUnstake)}
            canStake={canStake}
            canUnstake={Boolean(isConnected && participation?.canUnstake)}
            hasOwnedNfts={stakeableNftTokenIds.length > 0}
            isPending={pendingAction !== null}
            isConnected={isConnected}
          />
          {project.display.showLeaderboard && (
            <SidebarLeaderboard leaderboard={project.leaderboard} />
          )}
          <SidebarFlags flags={project.flags} participationRules={project.participationRules} />
        </Sidebar>
      </TwoColLayout>

      {project.similarProjects.length > 0 && (
        <SimilarSection>
          <SimilarTitle>You May Also Like</SimilarTitle>
          <SimilarGrid>
            {project.similarProjects.map((similar) => (
              <SimilarCard key={similar.id} onClick={() => { window.location.href = `/utility/launchpad/${similar.id}`; }}>
                <SimilarCardTop>
                  <SimilarCardHeader>
                    <SimilarCardInfo>
                      <SimilarLogo>{similar.logo ? <img src={similar.logo} alt={similar.name} /> : null}</SimilarLogo>
                      <SimilarCardMeta><SimilarCardName>{similar.name}</SimilarCardName><SimilarCardCategory>{similar.category}</SimilarCardCategory></SimilarCardMeta>
                    </SimilarCardInfo>
                    <StatusBadge variant={getSimilarStatusVariant(similar.statusVariant)}>{similar.statusLabel}</StatusBadge>
                  </SimilarCardHeader>
                  <SimilarStatsRow>
                    <SimilarStatBox><SimilarStatLabel>Total Raise</SimilarStatLabel><SimilarStatValue>{similar.totalRaise}</SimilarStatValue></SimilarStatBox>
                    <SimilarStatBox><SimilarStatLabel>Allocation</SimilarStatLabel><SimilarStatValue>{similar.allocation}</SimilarStatValue></SimilarStatBox>
                  </SimilarStatsRow>
                </SimilarCardTop>
                <SimilarCardBottom>
                  <ProgressSection>
                    <ProgressHeader><ProgressLabel>Funding Progress</ProgressLabel><ProgressPercent>{similar.fundingProgress}%</ProgressPercent></ProgressHeader>
                    <ProgressBarBg>{similar.fundingProgress > 0 && <ProgressBarFill percent={similar.fundingProgress} />}</ProgressBarBg>
                  </ProgressSection>
                  <SimilarCardDivider />
                  <SimilarCardFooter>
                    {similar.timeLeft && (
                      <TimeLeftLabel><IconClockMedium /><p>{similar.timeLeft}</p></TimeLeftLabel>
                    )}
                    {similar.isEligible && <EligibleLabel><IconCheckbox /><p>Eligible</p></EligibleLabel>}
                  </SimilarCardFooter>
                </SimilarCardBottom>
              </SimilarCard>
            ))}
          </SimilarGrid>
        </SimilarSection>
      )}

      {showClaimToast && (
        <ToastContainer>
          <ToastBox>
            <ToastIconWrap><IconCircleCheck36 /></ToastIconWrap>
            <ToastContent>
              <ToastTitle>{project.claimDisplay.isRefund ? "Refund claimed successfully!" : "Tokens claimed successfully!"}</ToastTitle>
              <ToastText>{project.claimDisplay.amount} {project.claimDisplay.symbol} sent to your wallet</ToastText>
            </ToastContent>
          </ToastBox>
        </ToastContainer>
      )}

      {showStakeModal && (
        <NftStakeSelectionModal
          tokenIds={stakeableNftTokenIds}
          isPending={pendingAction !== null}
          onClose={() => setShowStakeModal(false)}
          onConfirm={(tokenIds) => void runSmartAction(() => handleConfirmStake(tokenIds))}
        />
      )}

      {showClaimModal && (
        <ModalOverlay onClick={() => setShowClaimModal(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <ModalIconCircle><IconCircleCheck /></ModalIconCircle>
              <ModalTitleGroup>
                <ModalTitle>{project.claimDisplay.isRefund ? "Refund Complete" : "Claim Complete"}</ModalTitle>
                <ModalSubtitle>Your assets have been sent to your wallet</ModalSubtitle>
              </ModalTitleGroup>
            </ModalHeader>
            <ModalAmountBox>
              <ModalAmountLabel>Successfully Claimed</ModalAmountLabel>
              <ModalAmountRow><ModalAmountNumber>{project.claimDisplay.amount}</ModalAmountNumber><ModalAmountTicker>{project.claimDisplay.symbol}</ModalAmountTicker></ModalAmountRow>
            </ModalAmountBox>
            <ModalViewBtn onClick={() => lastTxHash && window.open(`${detail.contract.explorerUrl || "https://testnet.bscscan.com"}/tx/${lastTxHash}`, "_blank", "noopener,noreferrer") }>
              <IconExternalLink />
              View Transaction
            </ModalViewBtn>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
};

export default LaunchpadProjectDetail;

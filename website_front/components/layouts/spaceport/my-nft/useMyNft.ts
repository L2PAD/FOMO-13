import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";
import type { NFTDetailsData } from "./NFTDetailsModal";
import type { NFTHiddenDetailsData } from "./NFTHiddenDetailsModal";
import type { NFTSingularityDetailsData } from "./NFTSingularityDetailsModal";
import { CollectionFilter, NFTItem } from "./types";
import { SPACEPORT_FLOOR_PRICE } from "./constants";
import { AuthContext, LoadingContext } from "../../../global/Layout";
import {
  getNftOwnerTokens,
  getSpaceportWalletAddress,
  probeNftStake,
  getNftStakeInfo,
  nftAddress as spaceportNftAddress,
  Rarity,
  stakeNft,
  unstakeNft,
  type TokenInfo,
} from "../../../../smart/contractSpaceport";
import fetchSpaceportOpenings, {
  SpaceportOpeningRecord,
} from "../../../../http/spaceport/fetchSpaceportOpenings";
import fetchSpaceportFusions from "../../../../http/spaceport/fetchSpaceportFusions";
import fetchSpaceportStaking, {
  FetchSpaceportStakingResponse,
  SpaceportStakingEvent,
  SpaceportStakingTokenSummary,
} from "../../../../http/spaceport/fetchSpaceportStaking";
import saveSpaceportStaking from "../../../../http/spaceport/saveSpaceportStaking";
import {
  fetchMetadataByTokenUri,
  fetchMockMetadataImageByTokenId,
  getCollectionMetadataBaseLink,
  resolveAssetUri,
} from "../../../../utils/spaceportMetadata";
import { useTranslation } from "i18n";

const FALLBACK_NFT_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const ONE_DAY_SECONDS = 24 * 60 * 60;
const DEFAULT_STAKING_REWARD_UNIT_SECONDS = 60;
const DEFAULT_STAKING_REWARD_UNIT_LABEL = "MIN";
const DEFAULT_STAKING_REWARD_MILESTONES = [30, 60, 120, 180, 365, 540];
const EMPTY_STAKING_RESPONSE: FetchSpaceportStakingResponse = {
  isSuccess: false,
  walletAddress: "",
  events: [],
  summary: {},
};

type StakingRewardMilestone = {
  key: string;
  requiredUnits: number;
};

type StakingRewardConfig = {
  milestones: StakingRewardMilestone[];
  unitSeconds: number;
  unitLabel: string;
};

type SmartStakeSnapshot = {
  isStaked: boolean;
  stakedAt: number;
  seconds: number;
  days: number;
};

const buildModalData = (nft: NFTItem): NFTDetailsData => {
  return {
    id: nft.id,
    name: nft.name,
    number: nft.number,
    rarity: nft.rarity,
    image: nft.image,
    tokenId: nft.tokenId ?? nft.id,
    floorPrice: SPACEPORT_FLOOR_PRICE,
    status: nft.status ?? (nft.staked ? "Staked" : "Unstaked"),
    properties: nft.properties ?? [],
    stakingHistory: nft.stakingHistory ?? [],
    rewards: nft.rewards ?? [],
  };
};

const shortenAddress = (address: string): string => {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const toDisplayRarity = (rarityName: string, rarityId: number): NFTItem["rarity"] => {
  const normalized = String(rarityName || "").toLowerCase();

  if (normalized.includes("fomo")) {
    return "FOMO Gold";
  }
  if (normalized.includes("legendary")) {
    return "Legendary";
  }
  if (normalized.includes("epic")) {
    return "Epic";
  }
  if (normalized.includes("rare")) {
    return "Rare";
  }
  if (normalized.includes("uncommon") || normalized.includes("common") || normalized.includes("shard")) {
    return "Common";
  }

  if (rarityId === 8) {
    return "FOMO Gold";
  }
  if (rarityId === 7) {
    return "Legendary";
  }
  if (rarityId === 6 || rarityId === 2) {
    return "Epic";
  }
  if (rarityId === 5) {
    return "Rare";
  }

  return "Common";
};

const toDisplayName = (rarityName: string): string => {
  const normalized = String(rarityName || "").toLowerCase();

  if (normalized.includes("premint")) {
    return "Pre-Mint Box";
  }
  if (normalized.includes("shard")) {
    return "NFT Shard";
  }

  return "Spaceport NFT";
};

const PREMINT_RARITY_IDS = new Set<number>([
  Rarity.PreMint_Uncommon,
  Rarity.PreMint_Epic,
  Rarity.PreMint_Legendary,
]);

const isPreMintToken = (token: Pick<TokenInfo, "rarityId" | "rarityName">): boolean => {
  if (PREMINT_RARITY_IDS.has(token.rarityId)) {
    return true;
  }

  const normalizedName = String(token.rarityName || "").toLowerCase();
  return normalizedName.includes("premint") || normalizedName.includes("pre-mint");
};

const formatDateTime = (value?: string | Date | null): string => {
  if (!value) {
    return "Unknown date";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-US");
};

const formatDuration = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.trunc(Number(totalSeconds) || 0));
  const days = Math.floor(safeSeconds / ONE_DAY_SECONDS);
  const hours = Math.floor((safeSeconds % ONE_DAY_SECONDS) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${safeSeconds}s`;
};

const toPositiveInteger = (value: unknown, fallback = 0): number => {
  const numericValue = Math.trunc(Number(value) || 0);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return fallback;
  }

  return numericValue;
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
};

const toSmartStakeSnapshot = (value: any): SmartStakeSnapshot => {
  if (!value || value.ok !== true) {
    return {
      isStaked: false,
      stakedAt: 0,
      seconds: 0,
      days: 0,
    };
  }

  return {
    isStaked: Boolean(value.isStaked),
    stakedAt: Number(value.stakedAt || 0),
    seconds: Math.max(0, Number(value.seconds || 0)),
    days: Math.max(0, Number(value.days || 0)),
  };
};

const buildStakingHistory = (
  events: SpaceportStakingEvent[],
  smartStakeSnapshot?: SmartStakeSnapshot
): NonNullable<NFTItem["stakingHistory"]> => {
  if (Array.isArray(events) && events.length > 0) {
    return [...events]
      .sort((a, b) => {
        const left =
          new Date(a.unstakedAt || a.stakedAt || a.updatedAt || a.createdAt || 0).getTime() || 0;
        const right =
          new Date(b.unstakedAt || b.stakedAt || b.updatedAt || b.createdAt || 0).getTime() || 0;

        return right - left;
      })
      .map((event) => ({
        id: event._id,
        name: event.action === "stake" ? "Staked" : "Unstaked",
        date: formatDateTime(event.unstakedAt || event.stakedAt || event.updatedAt || event.createdAt),
        xp: "0",
        value:
          event.action === "stake"
            ? "Started"
            : event.stakedSeconds > 0
              ? formatDuration(event.stakedSeconds)
              : "Completed",
        valueTone: "neutral" as const,
      }));
  }

  if (smartStakeSnapshot?.isStaked && smartStakeSnapshot.stakedAt > 0) {
    return [
      {
        id: "current-stake",
        name: "Currently staked",
        date: formatDateTime(new Date(smartStakeSnapshot.stakedAt * 1000)),
        xp: "0",
        value: "Live on-chain",
        valueTone: "neutral" as const,
      },
    ];
  }

  return [];
};

const buildStakingPresentation = (
  isStaked: boolean,
  totalSeconds: number,
  rewardConfig: StakingRewardConfig
): Pick<
  NFTItem,
  | "timeToNextLevel"
  | "progressPercent"
  | "totalStakedDays"
  | "totalStakedUnits"
  | "stakingRewardUnitLabel"
  | "nextRewardTarget"
  | "nextRewardUnlock"
  | "stakingSeconds"
> => {
  const safeSeconds = Math.max(0, Math.trunc(Number(totalSeconds) || 0));
  const safeUnitSeconds = Math.max(
    1,
    toPositiveInteger(rewardConfig.unitSeconds, DEFAULT_STAKING_REWARD_UNIT_SECONDS)
  );
  const safeUnitLabel = String(
    rewardConfig.unitLabel || DEFAULT_STAKING_REWARD_UNIT_LABEL
  ).toUpperCase();
  const milestones =
    rewardConfig.milestones.length > 0
      ? [...rewardConfig.milestones].sort((left, right) => left.requiredUnits - right.requiredUnits)
      : DEFAULT_STAKING_REWARD_MILESTONES.map((requiredUnits) => ({
          key: `stake-${requiredUnits}`,
          requiredUnits,
        }));
  const totalStakedUnits = Math.floor(safeSeconds / safeUnitSeconds);
  const nextMilestone = milestones.find((milestone) => {
    return milestone.requiredUnits > totalStakedUnits;
  });

  if (!nextMilestone) {
    return {
      timeToNextLevel: isStaked ? "Unlocked" : undefined,
      progressPercent: isStaked ? 100 : 0,
      totalStakedDays: Math.floor(safeSeconds / ONE_DAY_SECONDS),
      totalStakedUnits,
      stakingRewardUnitLabel: safeUnitLabel,
      nextRewardTarget: undefined,
      nextRewardUnlock: isStaked ? "All current reward milestones reached" : undefined,
      stakingSeconds: safeSeconds,
    };
  }

  const nextMilestoneIndex = milestones.findIndex((milestone) => {
    return milestone.key === nextMilestone.key;
  });
  const previousMilestoneUnits =
    nextMilestoneIndex > 0 ? milestones[nextMilestoneIndex - 1].requiredUnits : 0;
  const rewardSegmentSpan = Math.max(1, nextMilestone.requiredUnits - previousMilestoneUnits);
  const rewardSegmentProgress = Math.max(0, totalStakedUnits - previousMilestoneUnits);
  const secondsToNextReward = Math.max(
    0,
    nextMilestone.requiredUnits * safeUnitSeconds - safeSeconds
  );

  return {
    timeToNextLevel: isStaked ? formatDuration(secondsToNextReward) : undefined,
    progressPercent: isStaked
      ? clampPercent((rewardSegmentProgress / rewardSegmentSpan) * 100)
      : 0,
    totalStakedDays: Math.floor(safeSeconds / ONE_DAY_SECONDS),
    totalStakedUnits,
    stakingRewardUnitLabel: safeUnitLabel,
    nextRewardTarget: `${nextMilestone.requiredUnits} ${safeUnitLabel}`,
    nextRewardUnlock: isStaked
      ? `Next reward at ${nextMilestone.requiredUnits} ${safeUnitLabel}`
      : undefined,
    stakingSeconds: safeSeconds,
  };
};

const mapTokenToNftItem = async (
  token: TokenInfo,
  rewardConfig: StakingRewardConfig,
  metadataBaseLink?: string,
  opening?: SpaceportOpeningRecord,
  displayMetadata?: Record<string, any>,
  smartStakeSnapshot?: SmartStakeSnapshot,
  backendSummary?: SpaceportStakingTokenSummary,
  backendEvents?: SpaceportStakingEvent[]
): Promise<NFTItem> => {
  const tokenId = token.tokenIdNumber;
  const openingMetadata =
    displayMetadata && typeof displayMetadata === "object"
      ? displayMetadata
      : opening?.metadata && typeof opening.metadata === "object"
        ? opening.metadata
        : {};
  const resolvedRarityName = String(openingMetadata.rarityName || token.rarityName || "");
  const resolvedRarityId = Number.isFinite(Number(openingMetadata.rarityId))
    ? Number(openingMetadata.rarityId)
    : token.rarityId;
  const needsSmartMetadata =
    !String(openingMetadata.name || "").trim() ||
    !Array.isArray(openingMetadata.attributes) ||
    openingMetadata.attributes.length === 0;
  const smartMetadata = needsSmartMetadata
    ? await fetchMetadataByTokenUri(token.tokenUri, tokenId, metadataBaseLink)
    : null;
  const rarity = toDisplayRarity(resolvedRarityName, resolvedRarityId);
  const displayName =
    String(openingMetadata.name || smartMetadata?.name || "").trim() || toDisplayName(resolvedRarityName);
  const rawImage = String(openingMetadata.image || smartMetadata?.image || "").trim();
  const mockImage = !rawImage ? await fetchMockMetadataImageByTokenId(tokenId) : "";
  const metadataImage = resolveAssetUri(rawImage || mockImage);
  const metadataAttributesFromSmart =
    smartMetadata && Array.isArray(smartMetadata.attributes) ? smartMetadata.attributes : [];
  const metadataAttributes = Array.isArray(openingMetadata.attributes)
    ? openingMetadata.attributes
    : metadataAttributesFromSmart;
  const attributeProperties = metadataAttributes.slice(0, 4).map((attr) => ({
    label: String(attr?.trait_type || "Attribute"),
    value: String(attr?.value ?? "-"),
  }));
  const displayProperties =
    attributeProperties.length > 0
      ? attributeProperties
      : [
          { label: "Type", value: "TBD" },
          { label: "Element", value: "TBD" },
          { label: "Power", value: "TBD" },
          { label: "Level", value: "TBD" },
        ];

  const smartSnapshot = smartStakeSnapshot ?? {
    isStaked: false,
    stakedAt: 0,
    seconds: 0,
    days: 0,
  };
  const totalSeconds = Math.max(smartSnapshot.seconds, Number(backendSummary?.totalSeconds || 0));
  const isCurrentlyStaked = smartSnapshot.isStaked || Boolean(backendSummary?.isCurrentlyStaked);
  const stakingPresentation = buildStakingPresentation(isCurrentlyStaked, totalSeconds, rewardConfig);

  return {
    id: String(tokenId),
    name: displayName,
    number: `#${tokenId}`,
    rarity,
    image: metadataImage || FALLBACK_NFT_IMAGE,
    views: "-",
    floorPrice: SPACEPORT_FLOOR_PRICE,
    hiddenRarity: false,
    priceEth: "TBD",
    priceUsd: "TBD",
    staked: isCurrentlyStaked,
    tokenId: String(tokenId),
    status: isCurrentlyStaked ? "Staked" : "Unstaked",
    floorPriceEth: SPACEPORT_FLOOR_PRICE,
    properties: displayProperties,
    stakingHistory: buildStakingHistory(backendEvents ?? [], smartSnapshot),
    rewards: [],
    stakingStartedAt:
      smartSnapshot.stakedAt > 0
        ? new Date(smartSnapshot.stakedAt * 1000).toISOString()
        : backendSummary?.lastStakedAt || undefined,
    ...stakingPresentation,
  };
};

export const useMyNft = () => {
  const { t } = useTranslation();
  const { address: wagmiAddress, chainId: wagmiChainId } = useAccount();
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("all");
  const [nftItems, setNftItems] = useState<NFTItem[]>([]);
  const [connectedAccount, setConnectedAccount] = useState<string>("");
  const [isNftLoading, setIsNftLoading] = useState<boolean>(false);
  const [modalData, setModalData] = useState<NFTDetailsData | null>(null);
  const [featuredNFT, setFeaturedNFT] = useState<NFTItem | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [hiddenModalData, setHiddenModalData] = useState<NFTHiddenDetailsData | null>(null);
  const [singularityModalData, setSingularityModalData] = useState<NFTSingularityDetailsData | null>(null);
  const [activeStakeTokenId, setActiveStakeTokenId] = useState<string | null>(null);

  const stakingRewardConfig = useMemo<StakingRewardConfig>(() => {
    const stakingRewards = Array.isArray(userData?.spaceportProgression?.stakingRewards)
      ? userData.spaceportProgression.stakingRewards
      : [];
    const milestones = stakingRewards
      .map((reward: any) => {
        return {
          key: String(reward?.key || ""),
          requiredUnits: toPositiveInteger(reward?.requiredUnits),
        };
      })
      .filter((reward: StakingRewardMilestone) => reward.key && reward.requiredUnits > 0)
      .sort((left: StakingRewardMilestone, right: StakingRewardMilestone) => {
        return left.requiredUnits - right.requiredUnits;
      });

    return {
      milestones:
        milestones.length > 0
          ? milestones
          : DEFAULT_STAKING_REWARD_MILESTONES.map((requiredUnits) => ({
              key: `stake-${requiredUnits}`,
              requiredUnits,
            })),
      unitSeconds: Math.max(
        1,
        toPositiveInteger(
          userData?.spaceportProgression?.stakingRewardUnitSeconds,
          DEFAULT_STAKING_REWARD_UNIT_SECONDS
        )
      ),
      unitLabel: String(
        userData?.spaceportProgression?.stakingRewardUnitLabel ||
          DEFAULT_STAKING_REWARD_UNIT_LABEL
      ).toUpperCase(),
    };
  }, [
    userData?.spaceportProgression?.stakingRewardUnitLabel,
    userData?.spaceportProgression?.stakingRewardUnitSeconds,
    userData?.spaceportProgression?.stakingRewards,
  ]);

  const loadWalletNfts = useCallback(async () => {
    try {
      setIsNftLoading(true);

      const account = await getSpaceportWalletAddress(false);
      setConnectedAccount(account);

      if (!account) {
        setNftItems([]);
        setFeaturedNFT(null);
        return;
      }

      const tokens = await getNftOwnerTokens(account);
      const [metadataBaseLink, openingsResponse, fusionHistoryResponse] = await Promise.all([
        getCollectionMetadataBaseLink(spaceportNftAddress),
        fetchSpaceportOpenings(account, spaceportNftAddress),
        fetchSpaceportFusions(account, spaceportNftAddress),
      ]);

      const openingsByTokenId = new Map<number, SpaceportOpeningRecord>();
      for (const opening of openingsResponse.openings ?? []) {
        openingsByTokenId.set(Number(opening.tokenId), opening);
      }

      const fusionDisplayByTokenId = new Map<number, Record<string, any>>();
      for (const fusion of fusionHistoryResponse.fusions ?? []) {
        const resultTokenId = Number(fusion.resultTokenId || 0);
        if (!Number.isInteger(resultTokenId) || resultTokenId <= 0) {
          continue;
        }

        const metadata = fusion.metadata && typeof fusion.metadata === "object" ? fusion.metadata : {};
        const resultMetadata = metadata.result && typeof metadata.result === "object" ? metadata.result : {};

        fusionDisplayByTokenId.set(resultTokenId, {
          ...resultMetadata,
          rarityName:
            String(resultMetadata.rarityName || resultMetadata.rarity || fusion.resultRarityName || "").trim() ||
            undefined,
        });
      }

      const visibleTokens = tokens.filter((token) => {
        return (
          openingsByTokenId.has(token.tokenIdNumber) ||
          fusionDisplayByTokenId.has(token.tokenIdNumber) ||
          !isPreMintToken(token)
        );
      });
      const visibleTokenIds = visibleTokens.map((token) => token.tokenIdNumber);
      const [stakingResponse, smartStakeResults] = await Promise.all([
        visibleTokenIds.length > 0
          ? fetchSpaceportStaking(account, visibleTokenIds)
          : Promise.resolve({
              ...EMPTY_STAKING_RESPONSE,
              walletAddress: account,
            }),
        Promise.all(
          visibleTokens.map((token) =>
            getNftStakeInfo(spaceportNftAddress, token.tokenIdNumber).catch(() => ({
              ok: false,
              error: "Failed to load stake info",
            }))
          )
        ),
      ]);

      const eventsByTokenId = new Map<number, SpaceportStakingEvent[]>();
      for (const event of stakingResponse.events ?? []) {
        const existing = eventsByTokenId.get(event.tokenId) ?? [];
        existing.push(event);
        eventsByTokenId.set(event.tokenId, existing);
      }

      const stakingSummaryByTokenId = stakingResponse.summary as Record<
        string,
        SpaceportStakingTokenSummary
      >;

      const smartStakeByTokenId = new Map<number, SmartStakeSnapshot>();
      for (let index = 0; index < visibleTokens.length; index += 1) {
        const token = visibleTokens[index];
        smartStakeByTokenId.set(token.tokenIdNumber, toSmartStakeSnapshot(smartStakeResults[index]));
      }

      const normalized = await Promise.all(
        [...visibleTokens]
          .sort((a, b) => b.tokenIdNumber - a.tokenIdNumber)
          .map((token) =>
            mapTokenToNftItem(
              token,
              stakingRewardConfig,
              metadataBaseLink,
              openingsByTokenId.get(token.tokenIdNumber),
              fusionDisplayByTokenId.get(token.tokenIdNumber),
              smartStakeByTokenId.get(token.tokenIdNumber),
              stakingSummaryByTokenId[String(token.tokenIdNumber)],
              eventsByTokenId.get(token.tokenIdNumber) ?? []
            )
          )
      );

      setNftItems(normalized);
      setFeaturedNFT((prev) => {
        if (!normalized.length) {
          return null;
        }
        if (!prev) {
          return normalized[0];
        }

        return normalized.find((item) => item.id === prev.id) ?? normalized[0];
      });
    } catch (error) {
      console.warn("[Spaceport][MyNFT] failed to load wallet NFTs", error);
      setNftItems([]);
      setFeaturedNFT(null);
    } finally {
      setIsNftLoading(false);
    }
  }, [stakingRewardConfig, wagmiAddress, wagmiChainId]);

  const closeModal = useCallback(() => {
    setModalData(null);
  }, []);

  const closeHiddenModal = useCallback(() => {
    setHiddenModalData(null);
  }, []);

  const closeSingularityModal = useCallback(() => {
    setSingularityModalData(null);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
  }, []);

  const openImageModal = useCallback(() => {
    setShowImageModal(true);
  }, []);

  const handleStakeToggle = useCallback(
    async (nft: NFTItem | null) => {
      if (!nft) {
        return;
      }

      const account = connectedAccount || (await getSpaceportWalletAddress(true));
      if (!account) {
        toast.error(t("spaceport.myNft.connectWalletFirst"));
        return;
      }

      const tokenId = Number(nft.tokenId || nft.id);
      if (!Number.isInteger(tokenId) || tokenId < 0) {
        toast.error(t("spaceport.myNft.invalidTokenId"));
        return;
      }

      const tokenKey = String(tokenId);
      if (activeStakeTokenId === tokenKey) {
        return;
      }

      try {
        setActiveStakeTokenId(tokenKey);
        loadingStateHandler(true);

        const result = nft.staked
          ? await unstakeNft(spaceportNftAddress, tokenId)
          : await stakeNft(spaceportNftAddress, tokenId);

        if (!result.ok) {
          toast.error(result.error || t("spaceport.myNft.transactionFailed"));
          return;
        }

        const syncResponse = await saveSpaceportStaking({
          txHash: result.txHash,
          walletAddress: account,
          nftAddress: spaceportNftAddress,
          tokenId,
          action: nft.staked ? "unstake" : "stake",
          stakedAt: !nft.staked ? new Date().toISOString() : undefined,
          unstakedAt: nft.staked ? new Date().toISOString() : undefined,
          stakedSeconds: nft.staked ? nft.stakingSeconds : undefined,
          metadata: {
            tokenName: nft.name,
          },
        });

        if (!syncResponse.isSuccess) {
          toast.warning(t("spaceport.myNft.syncPending"));
        }

        toast.success(
          nft.staked
            ? t("spaceport.myNft.unstakedSuccess")
            : t("spaceport.myNft.stakedSuccess")
        );
        await loadWalletNfts();
      } catch (error) {
        console.warn("[Spaceport][MyNFT] stake toggle failed", error);
        const diagnostic = await probeNftStake(spaceportNftAddress, tokenId).catch(() => null);
        if (diagnostic) {
          console.warn("[Spaceport][MyNFT] stake diagnostic", {
            walletAddress: account,
            tokenId,
            diagnostic,
          });
        }
        toast.error(error instanceof Error ? error.message : "Staking transaction failed");
      } finally {
        loadingStateHandler(false);
        setActiveStakeTokenId(null);
      }
    },
    [activeStakeTokenId, connectedAccount, loadWalletNfts, loadingStateHandler, t]
  );

  useEffect(() => {
    void loadWalletNfts();
  }, [loadWalletNfts]);

  useEffect(() => {
    const ethereum = (window as any)?.ethereum;
    if (!ethereum || typeof ethereum.on !== "function") {
      return;
    }

    const onWalletChanged = () => {
      void loadWalletNfts();
    };

    ethereum.on("accountsChanged", onWalletChanged);
    ethereum.on("chainChanged", onWalletChanged);

    return () => {
      if (typeof ethereum.removeListener === "function") {
        ethereum.removeListener("accountsChanged", onWalletChanged);
        ethereum.removeListener("chainChanged", onWalletChanged);
      }
    };
  }, [loadWalletNfts]);

  const openNftDetails = useCallback((nft: NFTItem) => {
    setFeaturedNFT(nft);

    if (nft.singularityRarity) {
      setSingularityModalData({
        id: nft.id,
        name: nft.name,
        number: nft.number,
        rarity: nft.rarity,
        image: nft.image,
        tokenId: nft.tokenId ?? nft.id,
        floorPrice: SPACEPORT_FLOOR_PRICE,
        status: nft.status ?? (nft.staked ? "Staked" : "Unstaked"),
        properties: nft.properties ?? [],
        stakingHistory: nft.stakingHistory ?? [],
        rewards: nft.rewards ?? [],
        congratsNotice: nft.congratsNotice,
        achievements: nft.achievements,
        tradingRestrictions: nft.tradingRestrictions,
      });
      return;
    }

    if (nft.hiddenRarity) {
      setHiddenModalData({
        id: nft.id,
        name: nft.name,
        number: nft.number,
        rarity: nft.rarity,
        image: nft.image,
        tokenId: nft.tokenId ?? nft.id,
        floorPrice: SPACEPORT_FLOOR_PRICE,
        status: nft.status ?? (nft.staked ? "Staked" : "Unstaked"),
        properties: nft.properties ?? [],
        stakingHistory: nft.stakingHistory ?? [],
        rewards: nft.rewards ?? [],
        singularityNotice: nft.singularityNotice,
        requirements: nft.requirements,
        benefits: nft.benefits,
        tradingRestriction: nft.tradingRestriction,
      });
      return;
    }

    setModalData(buildModalData(nft));
  }, []);

  const openFeaturedModal = useCallback(() => {
    if (!featuredNFT) {
      return;
    }

    openNftDetails(featuredNFT);
  }, [featuredNFT, openNftDetails]);

  const selectFeaturedNft = useCallback((nft: NFTItem) => {
    setFeaturedNFT(nft);
  }, []);

  const filteredNFTs = nftItems.filter((nft) => {
    if (collectionFilter === "staked") {
      return nft.staked;
    }
    if (collectionFilter === "ready") {
      return !nft.staked;
    }

    return true;
  });

  const featuredOwnerName = connectedAccount
    ? shortenAddress(connectedAccount)
    : isNftLoading
      ? t("common.actions.loading")
      : "--";
  const isFeaturedStakePending =
    !!featuredNFT?.tokenId && activeStakeTokenId === String(featuredNFT.tokenId);

  return {
    collectionFilter,
    connectedAccount,
    featuredNFT,
    featuredOwnerName,
    filteredNFTs,
    handleStakeToggle,
    hiddenModalData,
    isFeaturedStakePending,
    isNftLoading,
    modalData,
    openFeaturedModal,
    openImageModal,
    selectFeaturedNft,
    setCollectionFilter,
    showImageModal,
    singularityModalData,
    closeHiddenModal,
    closeImageModal,
    closeModal,
    closeSingularityModal,
  };
};

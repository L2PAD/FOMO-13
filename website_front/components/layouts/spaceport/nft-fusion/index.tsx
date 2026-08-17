import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ArrowRight, Plus, Zap } from "lucide-react";
import { useAccount } from "wagmi";
import { FusionProgressModal, FusionResultModal } from "./FusionModals";
import {
  ArrowSep,
  ChipBadge,
  FusionButtonRow,
  FusionCenter,
  FusionIcon,
  FusionText,
  HistoryCard,
  HistoryItems,
  HistorySection,
  HistorySectionTitle,
  NFTChip,
  NFTEmptyArea,
  NFTFusionWrapper,
  NFTImageArea,
  NFTSelectorCard,
  OutcomeBadge,
  OutcomeBadges,
  PlusSep,
  SelectorRow,
  SelectorTitle,
  StartFusionButton,
  StatBadge,
  StatCard,
  StatsRow,
  HistoryTime,
  rarityColor,
} from "./styles";
import { FusionHistoryEntry, NFTOption } from "./types";
import CustomDropdown from "../../../UI/CustomDropdown";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import { BOXES_DATA } from "../box-shop/data";
import {
  approveNft,
  getNftApproved,
  getNftOwnerTokenIds,
  getNftTokenInfo,
  getSpaceportWalletAddress,
  isNftApprovedForAll,
  mergePreMintNfts,
  nftAddress as spaceportNftAddress,
  Rarity as SmartRarity,
  TokenInfo,
} from "../../../../smart/contractSpaceport";
import fetchSpaceportFusions, {
  SpaceportFusionRecord,
} from "../../../../http/spaceport/fetchSpaceportFusions";
import saveSpaceportFusion from "../../../../http/spaceport/saveSpaceportFusion";
import {
  fetchMetadataByTokenUri,
  fetchMockMetadataImageByTokenId,
  getCollectionMetadataBaseLink,
  resolveAssetUri,
} from "../../../../utils/spaceportMetadata";
import { useTranslation } from "i18n";

const getRarityTranslationKey = (value: string): string => {
  const normalized = value.toLowerCase();

  if (normalized.includes("fomo")) return "spaceport.rarity.fomoGold";
  if (normalized.includes("legendary")) return "spaceport.rarity.legendary";
  if (normalized.includes("epic")) return "spaceport.rarity.epic";
  if (normalized.includes("rare")) return "spaceport.rarity.rare";
  if (normalized.includes("uncommon")) return "spaceport.rarity.uncommon";
  return "spaceport.rarity.common";
};

const FusionHistoryRow: React.FC<{ entry: FusionHistoryEntry }> = ({
  entry,
}) => {
  const { t } = useTranslation();

  return (
    <HistoryCard>
      <HistoryItems>
        <NFTChip>
          <span className="nft-name">{entry.nft1.name}</span>
          <ChipBadge>#{entry.nft1.number}</ChipBadge>
          <ChipBadge color={rarityColor[entry.nft1.rarity]}>
            {t(getRarityTranslationKey(entry.nft1.rarity))}
          </ChipBadge>
        </NFTChip>

        <PlusSep>+</PlusSep>

        <NFTChip>
          <span className="nft-name">{entry.nft2.name}</span>
          <ChipBadge>#{entry.nft2.number}</ChipBadge>
          <ChipBadge color={rarityColor[entry.nft2.rarity]}>
            {t(getRarityTranslationKey(entry.nft2.rarity))}
          </ChipBadge>
        </NFTChip>

        <ArrowSep>→</ArrowSep>

        <NFTChip>
          <span className="nft-name">{entry.result.name}</span>
          <ChipBadge>#{entry.result.number}</ChipBadge>
          <ChipBadge color={rarityColor[entry.result.rarity]}>
            {t(getRarityTranslationKey(entry.result.rarity))}
          </ChipBadge>
        </NFTChip>
      </HistoryItems>

      <HistoryTime>{entry.time}</HistoryTime>
    </HistoryCard>
  );
};

type ModalState = "progress" | "result" | null;
const DEFAULT_BOX_IMAGE = BOXES_DATA[0]?.image ?? "";
const PREMINT_RARITY_IDS = new Set<number>([
  SmartRarity.PreMint_Uncommon,
  SmartRarity.PreMint_Epic,
  SmartRarity.PreMint_Legendary,
]);

const extractErrorMessage = (error: any): string => {
  if (typeof error?.reason === "string" && error.reason.trim()) {
    return error.reason;
  }

  if (typeof error?.data?.message === "string" && error.data.message.trim()) {
    return error.data.message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
};

const isPreMintToken = (token: Pick<TokenInfo, "rarityId" | "rarityName">): boolean => {
  if (PREMINT_RARITY_IDS.has(token.rarityId)) {
    return true;
  }

  const normalizedName = String(token.rarityName || "").toLowerCase();
  return normalizedName.includes("premint") || normalizedName.includes("pre-mint");
};

const toDisplayRarity = (rarityName: string, rarityId: number): NFTOption["rarity"] => {
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

  if (rarityId === SmartRarity.FOMOGold) {
    return "FOMO Gold";
  }
  if (rarityId === SmartRarity.Legendary || rarityId === SmartRarity.PreMint_Legendary) {
    return "Legendary";
  }
  if (rarityId === SmartRarity.Epic || rarityId === SmartRarity.PreMint_Epic) {
    return "Epic";
  }
  if (rarityId === SmartRarity.Rare) {
    return "Rare";
  }

  return "Common";
};

const formatHistoryTime = (value?: string | null): string => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
};

const mapFusionRecordToEntry = (fusion: SpaceportFusionRecord): FusionHistoryEntry => {
  const metadata =
    fusion.metadata && typeof fusion.metadata === "object" ? fusion.metadata : {};
  const left = metadata.nft1 || {};
  const right = metadata.nft2 || {};
  const result = metadata.result || {};

  return {
    id: fusion._id,
    nft1: {
      name: String(left.name || `NFT #${fusion.tokenId1 || "-"}`),
      number: Number(left.number || fusion.tokenId1 || 0),
      rarity: (left.rarity as FusionHistoryEntry["nft1"]["rarity"]) || "Common",
    },
    nft2: {
      name: String(right.name || `NFT #${fusion.tokenId2 || "-"}`),
      number: Number(right.number || fusion.tokenId2 || 0),
      rarity: (right.rarity as FusionHistoryEntry["nft2"]["rarity"]) || "Common",
    },
    result: {
      name: String(result.name || `NFT #${fusion.resultTokenId || "-"}`),
      number: Number(result.number || fusion.resultTokenId || 0),
      rarity:
        (result.rarity as FusionHistoryEntry["result"]["rarity"]) ||
        toDisplayRarity(String(fusion.resultRarityName || ""), Number(fusion.resultRarityId || 0)),
    },
    time: formatHistoryTime(fusion.mergedAt || fusion.createdAt),
  };
};

export const NFTFusion: React.FC = () => {
  const { t } = useTranslation();
  const { address: wagmiAddress, chainId: wagmiChainId } = useAccount();
  const [availableNFTs, setAvailableNFTs] = useState<NFTOption[]>([]);
  const [history, setHistory] = useState<FusionHistoryEntry[]>([]);
  const [connectedAccount, setConnectedAccount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [firstNFTId, setFirstNFTId] = useState<string>("");
  const [secondNFTId, setSecondNFTId] = useState<string>("");
  const [modal, setModal] = useState<ModalState>(null);
  const [progress, setProgress] = useState(0);
  const [fusionResult, setFusionResult] = useState<NFTOption | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const firstNFT = availableNFTs.find((n) => n.id === firstNFTId) ?? null;
  const secondNFT = availableNFTs.find((n) => n.id === secondNFTId) ?? null;

  const canFuse = !!firstNFT && !!secondNFT && firstNFTId !== secondNFTId;
  const possibleOutcomeLabel = secondNFT
    ? `${t(getRarityTranslationKey(firstNFT?.rarity || "Common"))} + ${t(getRarityTranslationKey(secondNFT.rarity))}`
    : firstNFT?.rarity
      ? t(getRarityTranslationKey(firstNFT.rarity))
      : t("spaceport.nftFusion.selectTwoNfts");

  const loadFusionData = useCallback(async () => {
    try {
      setIsLoading(true);

      const account = await getSpaceportWalletAddress(false);
      setConnectedAccount(account);

      if (!account) {
        setAvailableNFTs([]);
        setHistory([]);
        return;
      }

      const [tokenIds, metadataBaseLink, fusionHistoryResponse] = await Promise.all([
        getNftOwnerTokenIds(account, spaceportNftAddress),
        getCollectionMetadataBaseLink(spaceportNftAddress),
        fetchSpaceportFusions(account, spaceportNftAddress),
      ]);
      const tokens = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            return await getNftTokenInfo(tokenId, spaceportNftAddress);
          } catch (error) {
            console.warn("[Spaceport][Fusion] failed to read token info", {
              tokenId: tokenId?.toString?.() ?? tokenId,
              error,
            });
            return null;
          }
        })
      );

      const eligibleTokens = tokens
        .filter((token): token is NonNullable<typeof token> => !!token)
        .filter((token) => isPreMintToken(token))
        .sort((a, b) => b.tokenIdNumber - a.tokenIdNumber);

      const normalized = await Promise.all(
        eligibleTokens.map(async (token) => {
          const metadata = await fetchMetadataByTokenUri(
            token.tokenUri,
            token.tokenIdNumber,
            metadataBaseLink
          ).catch(() => null);
          const fallbackImage = await fetchMockMetadataImageByTokenId(token.tokenIdNumber);
          const rarity = toDisplayRarity(token.rarityName, token.rarityId);
          const normalizedName =
            String(metadata?.name || "").trim() || `${rarity} Box`;

          return {
            id: String(token.tokenIdNumber),
            tokenId: token.tokenIdNumber,
            name: normalizedName,
            number: token.tokenIdNumber,
            rarity,
            image:
              resolveAssetUri(String(metadata?.image || fallbackImage || DEFAULT_BOX_IMAGE)) ||
              DEFAULT_BOX_IMAGE,
            rarityId: token.rarityId,
            rarityName: token.rarityName,
            tokenUri: token.tokenUri,
          } satisfies NFTOption;
        })
      );

      setAvailableNFTs(normalized);
      setHistory(
        Array.isArray(fusionHistoryResponse.fusions)
          ? fusionHistoryResponse.fusions.map(mapFusionRecordToEntry)
          : []
      );
      setFirstNFTId((current) =>
        normalized.some((item) => item.id === current) ? current : ""
      );
      setSecondNFTId((current) =>
        normalized.some((item) => item.id === current) ? current : ""
      );
    } catch (error) {
      console.warn("[Spaceport][Fusion] failed to load fusion data", error);
      setAvailableNFTs([]);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [wagmiAddress, wagmiChainId]);

  const handleStartFusion = useCallback(async () => {
    if (!canFuse || !firstNFT || !secondNFT || isMerging) {
      return;
    }

    try {
      const account = await getSpaceportWalletAddress(true);
      if (!account) {
        toast.error(t("spaceport.nftFusion.connectWalletFirst"));
        return;
      }

      setConnectedAccount(account);
      setIsMerging(true);
      setProgress(0);
      setModal("progress");

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) {
            return prev;
          }
          return prev + 4;
        });
      }, 120);

      const [approved1, approved2, approvedForAll, metadataBaseLink, beforeTokenIds] =
        await Promise.all([
          getNftApproved(firstNFT.tokenId, spaceportNftAddress).catch(() => ""),
          getNftApproved(secondNFT.tokenId, spaceportNftAddress).catch(() => ""),
          isNftApprovedForAll(account, spaceportNftAddress, spaceportNftAddress).catch(
            () => false
          ),
          getCollectionMetadataBaseLink(spaceportNftAddress),
          getNftOwnerTokenIds(account, spaceportNftAddress),
        ]);

      const normalizedOperator = spaceportNftAddress.toLowerCase();
      if (!approvedForAll) {
        if (String(approved1 || "").toLowerCase() !== normalizedOperator) {
          await approveNft(firstNFT.tokenId, spaceportNftAddress, spaceportNftAddress);
        }
        if (String(approved2 || "").toLowerCase() !== normalizedOperator) {
          await approveNft(secondNFT.tokenId, spaceportNftAddress, spaceportNftAddress);
        }
      }

      const receipt = await mergePreMintNfts(
        firstNFT.tokenId,
        secondNFT.tokenId,
        spaceportNftAddress
      );

      const afterTokenIds = await getNftOwnerTokenIds(account, spaceportNftAddress);
      const beforeSet = new Set(beforeTokenIds.map((tokenId) => tokenId.toString()));
      const addedTokenId = afterTokenIds.find(
        (tokenId) => !beforeSet.has(tokenId.toString())
      );
      const resultTokenId = addedTokenId ? Number(addedTokenId.toString()) : undefined;
      const resultToken = resultTokenId
        ? await getNftTokenInfo(resultTokenId, spaceportNftAddress).catch(() => null)
        : null;
      const resultMetadata = resultToken
        ? await fetchMetadataByTokenUri(
            resultToken.tokenUri,
            resultToken.tokenIdNumber,
            metadataBaseLink
          ).catch(() => null)
        : null;
      const fallbackResultImage = resultTokenId
        ? await fetchMockMetadataImageByTokenId(resultTokenId)
        : "";

      const resultOption: NFTOption = {
        id: String(resultToken?.tokenIdNumber || resultTokenId || Date.now()),
        tokenId: resultToken?.tokenIdNumber || resultTokenId || 0,
        name:
          String(resultMetadata?.name || "").trim() ||
          `${toDisplayRarity(
            String(resultToken?.rarityName || ""),
            Number(resultToken?.rarityId || 0)
          )} NFT`,
        number: resultToken?.tokenIdNumber || resultTokenId || 0,
        rarity: toDisplayRarity(
          String(resultToken?.rarityName || ""),
          Number(resultToken?.rarityId || 0)
        ),
        image:
          resolveAssetUri(
            String(resultMetadata?.image || fallbackResultImage || DEFAULT_BOX_IMAGE)
          ) || DEFAULT_BOX_IMAGE,
        rarityId: Number(resultToken?.rarityId || 0),
        rarityName: String(resultToken?.rarityName || ""),
        tokenUri: resultToken?.tokenUri,
      };

      const txHash = String(receipt?.transactionHash || receipt?.hash || "").trim();
      if (!txHash) {
        throw new Error("Transaction hash not found");
      }

      const saveResponse = await saveSpaceportFusion({
        txHash,
        walletAddress: account,
        nftAddress: spaceportNftAddress,
        tokenId1: firstNFT.tokenId,
        tokenId2: secondNFT.tokenId,
        resultTokenId: resultOption.tokenId || undefined,
        resultRarityId: resultOption.rarityId || undefined,
        resultRarityName: resultOption.rarityName || undefined,
        blockNumber: Number(receipt?.blockNumber || 0) || undefined,
        mergedAt: new Date().toISOString(),
        metadata: {
          nft1: {
            name: firstNFT.name,
            number: firstNFT.number,
            rarity: firstNFT.rarity,
            image: firstNFT.image,
          },
          nft2: {
            name: secondNFT.name,
            number: secondNFT.number,
            rarity: secondNFT.rarity,
            image: secondNFT.image,
          },
          result: {
            name: resultOption.name,
            number: resultOption.number,
            rarity: resultOption.rarity,
            image: resultOption.image,
          },
        },
      });

      if (!saveResponse.isSuccess) {
        console.warn("[Spaceport][Fusion] failed to sync fusion", saveResponse.errorMessage);
        toast.warning(t("spaceport.nftFusion.syncFailed"));
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setProgress(100);
      setFusionResult(resultOption);
      setModal("result");
      await loadFusionData();
      toast.success(t("spaceport.nftFusion.completed"));
    } catch (error) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setModal(null);
      toast.error(extractErrorMessage(error));
    } finally {
      setIsMerging(false);
      setProgress(0);
    }
  }, [canFuse, firstNFT, secondNFT, isMerging, loadFusionData, t]);

  const handleCloseModal = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setModal(null);
    setProgress(0);
  };

  const handleFuseAgain = () => {
    setModal(null);
    setProgress(0);
    setFirstNFTId("");
    setSecondNFTId("");
    setFusionResult(null);
  };

  useEffect(() => {
    void loadFusionData();

    const ethereum = (window as any)?.ethereum;
    if (!ethereum || typeof ethereum.on !== "function") {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    const handleWalletChange = () => {
      void loadFusionData();
    };

    ethereum.on("accountsChanged", handleWalletChange);
    ethereum.on("chainChanged", handleWalletChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (typeof ethereum.removeListener === "function") {
        ethereum.removeListener("accountsChanged", handleWalletChange);
        ethereum.removeListener("chainChanged", handleWalletChange);
      }
    };
  }, [loadFusionData]);

  return (
    <NFTFusionWrapper>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SelectorRow>
          <NFTSelectorCard>
            <SelectorTitle>{t("spaceport.nftFusion.selectFirstNft")}</SelectorTitle>

            {firstNFT ? (
              <NFTImageArea>
                <img src={firstNFT.image} alt={firstNFT.name} />
              </NFTImageArea>
            ) : (
              <NFTEmptyArea onClick={() => {}}>
                <Plus size={24} className="plus-icon" />
                <span>
                  {connectedAccount
                    ? isLoading
                      ? t("spaceport.nftFusion.loadingEligibleNfts")
                      : t("spaceport.nftFusion.selectNftToFuse")
                    : t("spaceport.nftFusion.connectWalletToLoadNfts")}
                </span>
              </NFTEmptyArea>
            )}

            <CustomDropdown
              options={availableNFTs
                .filter((n) => n.id !== secondNFTId)
                .map((nft) => ({
                  value: nft.id,
                  label: `${nft.name} #${nft.number}`,
                }))}
              value={firstNFTId}
              placeholder={isLoading ? t("spaceport.boxShop.loading") : t("spaceport.nftFusion.chooseNft")}
              onChange={(val) => setFirstNFTId(val as string)}
              searchable={false}
              multiSelect={false}
            />
          </NFTSelectorCard>

          <FusionCenter>
            <FusionIcon>
              <Zap size={40} strokeWidth={1.5} />
            </FusionIcon>
            <FusionText>
              <h2>{t("spaceport.nftFusion.processTitle")}</h2>
              <p>{t("spaceport.nftFusion.processDescription")}</p>
            </FusionText>
          </FusionCenter>

          <NFTSelectorCard>
            <SelectorTitle>{t("spaceport.nftFusion.selectSecondNft")}</SelectorTitle>

            {secondNFT ? (
              <NFTImageArea>
                <img src={secondNFT.image} alt={secondNFT.name} />
              </NFTImageArea>
            ) : (
              <NFTEmptyArea onClick={() => {}}>
                <Plus size={24} className="plus-icon" />
                <span>
                  {connectedAccount
                    ? isLoading
                      ? t("spaceport.nftFusion.loadingEligibleNfts")
                      : t("spaceport.nftFusion.selectNftToFuse")
                    : t("spaceport.nftFusion.connectWalletToLoadNfts")}
                </span>
              </NFTEmptyArea>
            )}

            <CustomDropdown
              options={availableNFTs
                .filter((n) => n.id !== firstNFTId)
                .map((nft) => ({
                  value: nft.id,
                  label: `${nft.name} #${nft.number}`,
                }))}
              value={secondNFTId}
              placeholder={isLoading ? t("spaceport.boxShop.loading") : t("spaceport.nftFusion.chooseNft")}
              onChange={(val) => setSecondNFTId(val as string)}
              searchable={false}
              multiSelect={false}
            />
          </NFTSelectorCard>
        </SelectorRow>

        <StatsRow>
          <StatCard>
            <span className="label">{t("spaceport.nftFusion.eligibleNfts")}</span>
            <StatBadge>
              <span>{availableNFTs.length}</span>
            </StatBadge>
          </StatCard>

          <StatCard>
            <span className="label">{t("spaceport.nftFusion.wallet")}</span>
            <StatBadge>
              <span>{connectedAccount ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}` : t("spaceport.nftFusion.notConnected")}</span>
            </StatBadge>
          </StatCard>

          <StatCard>
            <span className="label">{t("spaceport.nftFusion.selectedPair")}</span>
            <OutcomeBadges>
              <OutcomeBadge rarity={firstNFT?.rarity || "Common"}>
                <span>{possibleOutcomeLabel}</span>
              </OutcomeBadge>
            </OutcomeBadges>
          </StatCard>
        </StatsRow>
      </div>

      {modal === "progress" && <FusionProgressModal progress={progress} />}
      {modal === "result" && fusionResult && (
        <FusionResultModal
          result={{
            name: fusionResult.name,
            rarity: fusionResult.rarity,
            image: fusionResult.image,
          }}
          onClose={handleCloseModal}
          onFuseAgain={handleFuseAgain}
        />
      )}

      <FusionButtonRow>
        <StartFusionButton disabled={!canFuse || isMerging || isLoading} onClick={() => void handleStartFusion()}>
          <SparklesIcon size={"small"} stroke="#fff" />
          <span>{isMerging ? t("spaceport.nftFusion.fusing") : t("spaceport.nftFusion.startFusion")}</span>
          <ArrowRight size={20} color="#ffffff" />
        </StartFusionButton>
      </FusionButtonRow>

      <HistorySection>
        <HistorySectionTitle>{t("spaceport.nftFusion.history")}</HistorySectionTitle>
        {history.length > 0 ? (
          history.map((entry) => <FusionHistoryRow key={entry.id} entry={entry} />)
        ) : (
          <HistoryCard>
            <HistoryItems>
              <span style={{ color: "#738094", fontSize: 14 }}>
                {connectedAccount
                  ? isLoading
                    ? t("spaceport.nftFusion.loadingHistory")
                    : t("spaceport.nftFusion.noHistory")
                  : t("spaceport.nftFusion.connectWalletToLoadHistory")}
              </span>
            </HistoryItems>
            <HistoryTime>--</HistoryTime>
          </HistoryCard>
        )}
      </HistorySection>
    </NFTFusionWrapper>
  );
};

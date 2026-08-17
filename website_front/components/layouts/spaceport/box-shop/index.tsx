import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";
import { BoxShopWrapper, EmptyBoxesState } from "./styles";
import BoxShopHeader from "./BoxShopHeader";
import BoxTypeSelector from "./BoxTypeSelector";
import PurchaseSection from "./PurchaseSection";
import BenefitsSection from "./BenefitsSection";
import ImportantInfoSection from "./ImportantInfoSection";
import HowItWorksSection from "./HowItWorksSection";
import PossibleRarityBoxesSection from "./PossibleRarityBoxesSection";
import UnopenedBoxesSection, { UnopenedBox } from "./UnopenedBoxesSection";
import OpenBoxModal, { BoxReward } from "./OpenBoxModal";
import { BoxType, BOXES_DATA } from "./data";
import { LoadingContext } from "../../../global/Layout";
import {
  approveErc20,
  buyFromSale,
  getErc20Allowance,
  getErc20Decimals,
  getNftOwnerTokenIds,
  getNftTokenInfo,
  getSpaceportWalletAddress,
  getSaleBaseTotalPrice,
  getSaleFinalPrice,
  getSalePurchasedBy,
  getSaleReferrerOf,
  getSaleState,
  marketAddress,
  nftAddress,
  openPreMintNft,
  Rarity,
  tokenAddress,
} from "../../../../smart/contractSpaceport";
import createSpaceportPurchase from "../../../../http/spaceport/createSpaceportPurchase";
import fetchSpaceportOpenings from "../../../../http/spaceport/fetchSpaceportOpenings";
import saveSpaceportOpening from "../../../../http/spaceport/saveSpaceportOpening";
import {
  fetchMetadataByTokenUri,
  fetchMockMetadataImageByTokenId,
  getCollectionMetadataBaseLink,
  resolveAssetUri,
} from "../../../../utils/spaceportMetadata";
import {
  isMinedSuccessReceipt,
  resolveOpenedRewardTokenId,
} from "../../../../utils/spaceportTransactions";
import { useTranslation } from "i18n";

const DEFAULT_MAX_BOXES = 6;
const DEFAULT_TOTAL_BOXES = 666;
const DEFAULT_BOX_PRICE = 100;
const DEFAULT_TOKEN_DECIMALS = 18;
const PREMINT_RARITY_IDS = new Set<number>([
  Rarity.PreMint_Uncommon,
  Rarity.PreMint_Epic,
  Rarity.PreMint_Legendary,
]);
const DEFAULT_BOX_IMAGE = BOXES_DATA[0]?.image ?? "";

const toPositiveNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value?.toString?.() ?? value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(parsed, 0);
};

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

const getReferralFromUrl = (buyerAddress: string): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = String(params.get("ref") || "").trim();
    if (!ref || !ethers.utils.isAddress(ref)) {
      return null;
    }

    if (buyerAddress && ref.toLowerCase() === buyerAddress.toLowerCase()) {
      return null;
    }

    return ref;
  } catch {
    return null;
  }
};

const preMintRarityToBoxType = (rarityId: number): BoxType => {
  if (rarityId === Rarity.PreMint_Epic) {
    return "epic";
  }

  if (rarityId === Rarity.PreMint_Legendary) {
    return "legendary";
  }

  return "uncommon";
};

const isPreMintToken = (token: { rarityId: number; rarityName: string }): boolean => {
  if (PREMINT_RARITY_IDS.has(token.rarityId)) {
    return true;
  }

  const normalizedName = String(token.rarityName || "").toLowerCase();
  return normalizedName.includes("premint") || normalizedName.includes("pre-mint");
};

const normalizeModalRarity = (rarityName: string, rarityId: number): "uncommon" | "rare" | "epic" | "legendary" => {
  const normalized = String(rarityName || "").toLowerCase();

  if (normalized.includes("fomo") || normalized.includes("legendary")) {
    return "legendary";
  }

  if (normalized.includes("epic")) {
    return "epic";
  }

  if (normalized.includes("rare")) {
    return "rare";
  }

  if (normalized.includes("uncommon")) {
    return "uncommon";
  }

  if (rarityId === Rarity.Legendary || rarityId === Rarity.FOMOGold) {
    return "legendary";
  }

  if (rarityId === Rarity.Epic || rarityId === Rarity.PreMint_Epic) {
    return "epic";
  }

  if (rarityId === Rarity.Rare) {
    return "rare";
  }

  return "uncommon";
};

export const BoxShop: React.FC = () => {
  const { t } = useTranslation();
  const { loadingStateHandler } = useContext(LoadingContext);
  const { address: wagmiAddress, chainId: wagmiChainId } = useAccount();
  const [activeView, setActiveView] = useState<"shop" | "boxes">("shop");
  const [quantity, setQuantity] = useState<number>(1);
  const [unopenedBoxes, setUnopenedBoxes] = useState<UnopenedBox[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<BoxReward | null>(null);

  const [connectedAccount, setConnectedAccount] = useState<string>("");
  const [maxPerWallet, setMaxPerWallet] = useState<number>(DEFAULT_MAX_BOXES);
  const [maxSupply, setMaxSupply] = useState<number>(DEFAULT_TOTAL_BOXES);
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [salePaused, setSalePaused] = useState<boolean>(false);
  const [walletPurchased, setWalletPurchased] = useState<number>(0);
  const [boxPrice, setBoxPrice] = useState<number>(DEFAULT_BOX_PRICE);
  const [paymentTokenAddress, setPaymentTokenAddress] = useState<string>(tokenAddress);
  const [nftContractAddress, setNftContractAddress] = useState<string>(nftAddress);
  const [tokenDecimals, setTokenDecimals] = useState<number>(DEFAULT_TOKEN_DECIMALS);

  const [totalPrice, setTotalPrice] = useState<number>(DEFAULT_BOX_PRICE);
  const [baseTotalPrice, setBaseTotalPrice] = useState<number>(DEFAULT_BOX_PRICE);
  const [totalPriceRaw, setTotalPriceRaw] = useState<string>("0");
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [isOpeningBoxId, setIsOpeningBoxId] = useState<string>("");
  const [isSmartDataLoading, setIsSmartDataLoading] = useState<boolean>(true);

  const remainingSupply = Math.max(maxSupply - totalMinted, 0);
  const walletLimitLeft = Math.max(maxPerWallet - walletPurchased, 0);
  const maxPurchasable = Math.max(Math.min(remainingSupply, walletLimitLeft), 0);
  const purchaseDisabled = isSmartDataLoading || salePaused || maxPurchasable === 0;
  const savingsAmount = Math.max(baseTotalPrice - totalPrice, 0);

  const loadUnopenedBoxes = useCallback(async (account: string, contractNftAddress: string) => {
    if (!account) {
      setUnopenedBoxes([]);
      return;
    }

    try {
      const [tokenIds, openingsResponse] = await Promise.all([
        getNftOwnerTokenIds(account, contractNftAddress),
        fetchSpaceportOpenings(account, contractNftAddress),
      ]);
      const ownerTokens = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            return await getNftTokenInfo(tokenId, contractNftAddress);
          } catch (error) {
            console.warn("[Spaceport][BoxShop] failed to read token info", {
              tokenId: tokenId?.toString?.() ?? tokenId,
              error,
            });
            return null;
          }
        })
      );
      const openedTokenIds = new Set(
        (openingsResponse?.openedTokenIds || []).map((tokenId) => Number(tokenId))
      );

      const boxes: UnopenedBox[] = ownerTokens
        .filter((token): token is NonNullable<typeof token> => !!token)
        .filter((token) => isPreMintToken(token))
        .filter((token) => !openedTokenIds.has(token.tokenIdNumber))
        .map((token) => {
          const type = preMintRarityToBoxType(token.rarityId);
          return {
            id: token.tokenId.toString(),
            tokenId: token.tokenIdNumber,
            type,
            name: `FOMO Box #${token.tokenIdNumber}`,
            image: DEFAULT_BOX_IMAGE,
          };
        })
        .sort((a, b) => b.tokenId - a.tokenId);

      setUnopenedBoxes(boxes);
    } catch (error) {
      console.warn("[Spaceport][BoxShop] failed to load unopened boxes", error);
      setUnopenedBoxes([]);
    }
  }, []);

  const loadSmartData = useCallback(async () => {
    setIsSmartDataLoading(true);
    try {
      const saleState = await getSaleState();

      const stateMaxPerWallet = Math.max(
        Math.trunc(toPositiveNumber(saleState.maxPerWallet, DEFAULT_MAX_BOXES)),
        1
      );
      const stateMaxSupply = Math.max(
        Math.trunc(toPositiveNumber(saleState.maxSupply, DEFAULT_TOTAL_BOXES)),
        DEFAULT_TOTAL_BOXES
      );
      const stateTotalMinted = Math.trunc(toPositiveNumber(saleState.totalMinted, 0));
      const stateSalePaused = !!saleState.salePaused;

      const currentPaymentToken = String(saleState.paymentToken || tokenAddress);
      const currentNftAddress = String(saleState.nftContract || nftAddress);

      let currentTokenDecimals = DEFAULT_TOKEN_DECIMALS;
      try {
        currentTokenDecimals = await getErc20Decimals(currentPaymentToken);
      } catch {
        currentTokenDecimals = DEFAULT_TOKEN_DECIMALS;
      }

      const statePrice = toPositiveNumber(
        ethers.utils.formatUnits(saleState.price, currentTokenDecimals),
        DEFAULT_BOX_PRICE
      );

      const account = await getSpaceportWalletAddress(false);
      let purchased = 0;
      if (account) {
        const purchasedByWallet = await getSalePurchasedBy(account);
        purchased = Math.trunc(toPositiveNumber(purchasedByWallet, 0));
      }

      await loadUnopenedBoxes(account, currentNftAddress);

      setConnectedAccount(account);
      setMaxPerWallet(stateMaxPerWallet);
      setMaxSupply(stateMaxSupply);
      setTotalMinted(stateTotalMinted);
      setSalePaused(stateSalePaused);
      setBoxPrice(statePrice);
      setWalletPurchased(purchased);
      setPaymentTokenAddress(currentPaymentToken);
      setNftContractAddress(currentNftAddress);
      setTokenDecimals(currentTokenDecimals);
    } catch (error) {
      console.warn("[Spaceport][BoxShop] failed to load smart data", error);
    } finally {
      setIsSmartDataLoading(false);
    }
  }, [loadUnopenedBoxes, wagmiAddress, wagmiChainId]);

  useEffect(() => {
    loadSmartData();
  }, [loadSmartData]);

  useEffect(() => {
    const ethereum = (window as any)?.ethereum;
    if (!ethereum || typeof ethereum.on !== "function") {
      return;
    }

    const handleWalletChange = () => {
      loadSmartData();
    };

    ethereum.on("accountsChanged", handleWalletChange);
    ethereum.on("chainChanged", handleWalletChange);

    return () => {
      if (typeof ethereum.removeListener === "function") {
        ethereum.removeListener("accountsChanged", handleWalletChange);
        ethereum.removeListener("chainChanged", handleWalletChange);
      }
    };
  }, [loadSmartData]);

  useEffect(() => {
    if (maxPurchasable > 0 && quantity > maxPurchasable) {
      setQuantity(maxPurchasable);
    }
  }, [quantity, maxPurchasable]);

  useEffect(() => {
    let cancelled = false;

    const loadPrices = async () => {
      try {
        const baseRaw = await getSaleBaseTotalPrice(quantity);

        let finalRaw = baseRaw;
        if (connectedAccount) {
          finalRaw = await getSaleFinalPrice(connectedAccount, quantity);
        }

        const base = Number(ethers.utils.formatUnits(baseRaw, tokenDecimals));
        const final = Number(ethers.utils.formatUnits(finalRaw, tokenDecimals));

        if (!cancelled) {
          setBaseTotalPrice(base);
          setTotalPrice(final);
          setTotalPriceRaw(finalRaw.toString());
        }
      } catch {
        if (!cancelled) {
          const fallback = boxPrice * quantity;
          setBaseTotalPrice(fallback);
          setTotalPrice(fallback);
          setTotalPriceRaw("0");
        }
      }
    };

    loadPrices();

    return () => {
      cancelled = true;
    };
  }, [quantity, connectedAccount, tokenDecimals, boxPrice]);

  const handleQuantityChange = (newQuantity: number) => {
    const upperBound = maxPurchasable > 0 ? maxPurchasable : 1;
    const normalizedQuantity = Math.min(Math.max(newQuantity, 1), upperBound);
    setQuantity(normalizedQuantity);
  };

  const handlePurchase = async () => {
    if (purchaseDisabled || isBuying) return;

    try {
      setIsBuying(true);
      loadingStateHandler(true);

      const account = await getSpaceportWalletAddress(true);
      if (!account) {
        toast.error(t("spaceport.boxShop.connectWalletFirst"));
        return;
      }

      setConnectedAccount(account);

      const saleState = await getSaleState();
      const currentPaymentToken = String(saleState.paymentToken || paymentTokenAddress || tokenAddress);
      const currentNftAddress = String(saleState.nftContract || nftContractAddress || nftAddress);

      const currentTokenDecimals = await getErc20Decimals(currentPaymentToken);
      const baseTotalRaw = await getSaleBaseTotalPrice(quantity);
      const finalTotalRaw = await getSaleFinalPrice(account, quantity);

      const allowance = await getErc20Allowance(currentPaymentToken, account, marketAddress);
      if (allowance.lt(finalTotalRaw)) {
        await approveErc20(currentPaymentToken, marketAddress, finalTotalRaw);
      }

      const referralFromUrl = getReferralFromUrl(account);
      const receipt = await buyFromSale(quantity, referralFromUrl);
      const txHash = String(receipt?.transactionHash || receipt?.hash || "").trim();

      if (!txHash) {
        throw new Error("Transaction hash not found");
      }

      const referralAddress = await getSaleReferrerOf(account);
      const finalTotal = Number(ethers.utils.formatUnits(finalTotalRaw, currentTokenDecimals));

      const saveResult = await createSpaceportPurchase({
        txHash,
        quantity,
        totalPrice: finalTotal,
        totalPriceRaw: finalTotalRaw.toString(),
        tokenDecimals: currentTokenDecimals,
        walletAddress: account,
        paymentTokenAddress: currentPaymentToken,
        marketAddress,
        nftAddress: currentNftAddress,
        blockNumber: Number(receipt?.blockNumber || 0) || undefined,
        purchasedAt: new Date().toISOString(),
        referralAddress: referralAddress || undefined,
        metadata: {
          selectedBox: BOXES_DATA[0]?.type || null,
          baseTotalPriceRaw: baseTotalRaw.toString(),
          referralFromUrl,
        },
      });

      if (!saveResult.isSuccess) {
        console.warn("[Spaceport][BoxShop] purchase tx saved failed", saveResult.errorMessage);
        toast.warning(t("spaceport.boxShop.purchaseSyncFailed"));
      }

      await loadSmartData();
      setActiveView("boxes");
      toast.success(t("spaceport.boxShop.purchaseCompleted"));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      loadingStateHandler(false);
      setIsBuying(false);
    }
  };

  const handleOpenBox = async (boxId: string) => {
    const box = unopenedBoxes.find((b) => b.id === boxId);

    if (!box || isOpeningBoxId) return;

    try {
      setIsOpeningBoxId(boxId);
      loadingStateHandler(true);

      const account = await getSpaceportWalletAddress(true);
      if (!account) {
        toast.error(t("spaceport.boxShop.connectWalletFirst"));
        return;
      }

      setConnectedAccount(account);

      const currentNftAddress = nftContractAddress || nftAddress;
      const metadataBaseLink = await getCollectionMetadataBaseLink(currentNftAddress);
      const fallbackRarity = normalizeModalRarity(box.type, 0);
      const fallbackImage =
        (await fetchMockMetadataImageByTokenId(box.tokenId)) || DEFAULT_BOX_IMAGE;
      const tokenIdsBeforeOpen = await getNftOwnerTokenIds(account, currentNftAddress);
      const receipt = await openPreMintNft(box.tokenId, currentNftAddress);
      if (!isMinedSuccessReceipt(receipt)) {
        throw new Error("Open transaction was not mined successfully.");
      }

      const txHash = String(receipt?.transactionHash || receipt?.hash || "").trim();
      if (!txHash) {
        throw new Error("Open transaction hash not found.");
      }

      const tokenIdsAfterOpen = await getNftOwnerTokenIds(account, currentNftAddress).catch(
        () => []
      );
      const mintedEvent = Array.isArray(receipt?.events)
        ? receipt.events.find((event: any) => {
          if (event?.event !== "Minted") return false;
          const recipient = String(event?.args?.to || event?.args?.[0] || "").toLowerCase();
          return !recipient || recipient === account.toLowerCase();
        })
        : undefined;
      const eventTokenId = Number(
        mintedEvent?.args?.tokenId?.toString?.() || mintedEvent?.args?.[1]?.toString?.()
      );
      const resultTokenId =
        resolveOpenedRewardTokenId(box.tokenId, tokenIdsBeforeOpen, tokenIdsAfterOpen) ??
        (Number.isSafeInteger(eventTokenId) && eventTokenId >= 0 ? eventTokenId : undefined);

      if (resultTokenId === undefined) {
        throw new Error("Opened NFT was not found after the transaction.");
      }

      let reward: BoxReward = {
        type: "nft",
        rarity: fallbackRarity,
        name: `NFT #${resultTokenId}`,
        image: fallbackImage,
        number: `#${resultTokenId}`,
      };

      try {
        const openedToken = await getNftTokenInfo(resultTokenId, currentNftAddress);

        const smartMetadata = await fetchMetadataByTokenUri(
          openedToken.tokenUri,
          openedToken.tokenIdNumber,
          metadataBaseLink
        );
        const saveResponse = await saveSpaceportOpening({
          walletAddress: account,
          nftAddress: currentNftAddress,
          tokenId: box.tokenId,
          txHash,
          openedAt: new Date().toISOString(),
          metadata: {
            ...(smartMetadata || {}),
            resultTokenId: openedToken.tokenIdNumber,
            rarityId: openedToken.rarityId,
            rarityName: openedToken.rarityName,
            tokenUri: openedToken.tokenUri,
          },
        });

        if (!saveResponse.isSuccess) {
          console.warn("[Spaceport][BoxShop] failed to sync opened box", saveResponse.errorMessage);
          toast.warning(t("spaceport.boxShop.openSyncFailed"));
        }

        const normalizedRarity = normalizeModalRarity(openedToken.rarityName, openedToken.rarityId);
        const isShardReward =
          openedToken.rarityId === Rarity.Shard ||
          String(openedToken.rarityName || "").toLowerCase().includes("shard");
        const rewardImage = resolveAssetUri(
          String(smartMetadata?.image || saveResponse.opening?.metadata?.image || fallbackImage)
        ) || fallbackImage;
        const rewardName =
          String(smartMetadata?.name || "").trim() ||
          `${openedToken.rarityName || "NFT"} #${openedToken.tokenIdNumber}`;

        reward = isShardReward
          ? {
            type: "shard",
            rarity: normalizedRarity,
            name: rewardName,
            image: rewardImage,
            level: 1,
          }
          : {
            type: "nft",
            rarity: normalizedRarity,
            name: rewardName,
            image: rewardImage,
            number: `#${openedToken.tokenIdNumber}`,
          };
      } catch (readError) {
        console.warn("[Spaceport][BoxShop] opened token details unavailable", readError);
        const saveResponse = await saveSpaceportOpening({
          walletAddress: account,
          nftAddress: currentNftAddress,
          tokenId: box.tokenId,
          txHash,
          openedAt: new Date().toISOString(),
          metadata: {
            image: fallbackImage,
            resultTokenId,
          },
        });

        if (!saveResponse.isSuccess) {
          console.warn("[Spaceport][BoxShop] failed to sync opened box fallback", saveResponse.errorMessage);
          toast.warning(t("spaceport.boxShop.openSyncFailed"));
        }
      }

      setCurrentReward(reward);

      await loadSmartData();
      setIsModalOpen(true);
      toast.success(t("spaceport.boxShop.boxOpened", { values: { tokenId: box.tokenId } }));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsOpeningBoxId("");
      loadingStateHandler(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentReward(null);
  };

  const handleOpenAnother = () => {
    setIsModalOpen(false);
    setCurrentReward(null);

    const nextBox = unopenedBoxes[0];
    if (nextBox) {
      void handleOpenBox(nextBox.id);
    }
  };

  const handleViewCollection = () => {
    setIsModalOpen(false);
    setCurrentReward(null);
  };

  const boxesData = useMemo(
    () =>
      BOXES_DATA.map((box) => ({
        ...box,
        price: boxPrice,
        remaining: BOXES_DATA.length === 1 ? remainingSupply : box.remaining,
        total: BOXES_DATA.length === 1 ? maxSupply : box.total,
      })),
    [boxPrice, remainingSupply, maxSupply]
  );

  const selectedBoxData = boxesData[0] ?? null;

  const salePausedSuffix = salePaused
    ? t("spaceport.boxShop.salePausedSuffix")
    : "";
  const subtitle = isSmartDataLoading
    ? t("spaceport.boxShop.subtitleLoading")
    : t("spaceport.boxShop.subtitle", {
      values: {
        maxSupply,
        maxPerWallet,
        totalMinted,
        boxPrice,
        symbol: "USDT",
        salePausedSuffix,
      },
    });

  return (
    <BoxShopWrapper>
      <BoxShopHeader
        userBoxesCount={walletPurchased}
        maxBoxes={maxPerWallet}
        subtitle={subtitle}
        isLoading={isSmartDataLoading}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      {activeView === "shop" ? (
        <>
          <BoxTypeSelector boxes={boxesData} isLoading={isSmartDataLoading} />
          <PurchaseSection
            selectedBox={selectedBoxData}
            quantity={quantity}
            maxQuantity={maxPurchasable > 0 ? maxPurchasable : 1}
            disabled={purchaseDisabled || isBuying}
            isLoading={isBuying}
            isDataLoading={isSmartDataLoading}
            totalPrice={totalPrice}
            savingsAmount={savingsAmount}
            priceSymbol="USDT"
            onQuantityChange={handleQuantityChange}
            onPurchase={handlePurchase}
          />
          <HowItWorksSection />
          <BenefitsSection />
          <ImportantInfoSection
            maxPerWallet={maxPerWallet}
            maxSupply={maxSupply}
            totalMinted={totalMinted}
            salePaused={salePaused}
            isLoading={isSmartDataLoading}
          />
          <PossibleRarityBoxesSection />
        </>
      ) : (
        <>
          <UnopenedBoxesSection
            boxes={unopenedBoxes}
            onOpenBox={handleOpenBox}
            openingBoxId={isOpeningBoxId}
            disabled={isBuying}
          />
          {unopenedBoxes.length === 0 && (
            <EmptyBoxesState>
              {t("spaceport.boxShop.emptyBoxes")}
            </EmptyBoxesState>
          )}
        </>
      )}

      <OpenBoxModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        reward={currentReward}
        onOpenAnother={handleOpenAnother}
        onViewCollection={handleViewCollection}
      />
    </BoxShopWrapper>
  );
};

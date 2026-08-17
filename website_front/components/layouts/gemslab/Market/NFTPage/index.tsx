import React, { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import {
  CartCurrency,
  CartItem,
  useCart,
} from "../../../../../contexts/CartContext";
import {
  AuthContext,
  BalanceContext,
  CartContext,
  LoadingContext,
} from "../../../../global/Layout";
import Modal from "../../../../global/common/Modal";
import CartModal from "../../../../global/modals/CartModal/index";
import { normalizeInitialItem } from "../../../../global/modals/CartModal/utils";
import { PageWrapper, ContentWrapper } from "./styles";
import { NFTPageSidebar } from "./components/NFTPageSidebar";
import { NFTPageDetails } from "./components/NFTPageDetails";
import { NFTPageActivities } from "./components/NFTPageActivities";
import { NFTPageRelatedSection } from "./components/NFTPageRelatedSection";
import MakeOfferModal from "./MakeOfferModal";
import toggleNft from "../../../../../http/cart/toggleNft";
import createOrder from "../../../../../http/order/createOrder";
import confirmOrder from "../../../../../http/order/confirmOrder";
import deactivateOrder from "../../../../../http/order/deactivateOrder";
import fetchOrders from "../../../../../http/order/fetchOrders";
import addNftView from "../../../../../http/collections/addNftView";
import completeCollectionNftCheckout from "../../../../../helpers/completeCollectionNftCheckout";
import {
  cancelItem,
  cancelItemUsd,
  createItemForSm,
  createItemForSmUsd,
} from "../../../../../smart/initialSmartMarketplace";
import {
  formatChartDate,
  formatDateTime,
  formatRelativeTime,
  formatTokenId,
  formatViews,
  isExpiredDate,
  resolveMediaUrl,
  resolveUserAvatar,
} from "./helpers";
import { NFT_PAGE_TABS, NFTPageTab } from "./types";
import {
  ICollectionNft,
  ICreateOrder,
  IOrder,
} from "../../../../../types/global_types";

interface NFTPageProps {
  nft: ICollectionNft;
}

type OfferAction = "cancel" | "confirm" | "buy" | null;

const OFFER_FALLBACK_DURATION_MS = 24 * 60 * 60 * 1000;

const normalizeWallet = (value?: string) => String(value || "").trim().toLowerCase();

const formatContractAddress = (value?: string) => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue || normalizedValue === "-") {
    return "-";
  }

  if (normalizedValue.length <= 14) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 6)}...${normalizedValue.slice(-6)}`;
};

const getProjectId = (nft: ICollectionNft) => {
  const collectionProject = nft?.collection?.project as { _id?: string } | string;

  return String(
    nft?.project?._id ||
    (typeof collectionProject === "object" ? collectionProject?._id : collectionProject) ||
    ""
  );
};

const getFallbackOfferEndDate = (value?: string | Date | null) => {
  if (value && !isExpiredDate(value)) {
    return new Date(value);
  }

  return new Date(Date.now() + OFFER_FALLBACK_DURATION_MS);
};

export const NFTPage: React.FC<NFTPageProps> = ({ nft }) => {
  const { replace } = useRouter();
  const { userData } = useContext(AuthContext);
  const cartData = useContext(CartContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const { refetchBalance } = useContext(BalanceContext);
  const [activeTab, setActiveTab] = useState<NFTPageTab>(NFT_PAGE_TABS[0]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [isAddToCartPending, setIsAddToCartPending] = useState(false);
  const [isRemovedFromCart, setIsRemovedFromCart] = useState(false);
  const [isCreateOfferPending, setIsCreateOfferPending] = useState(false);
  const [viewsCount, setViewsCount] = useState<number>(
    Number(nft?.nftPage?.views ?? nft?.viewsCount ?? nft?.views ?? 0)
  );
  const [offerActionState, setOfferActionState] = useState<{
    id: string | null;
    action: OfferAction;
  }>({
    id: null,
    action: null,
  });
  const uiCart = useCart();
  const pageData = nft?.nftPage;
  const entityId = String(nft?._id || "");
  const collectionId = String(nft?.collection?._id || nft?.collectionId || "");
  const projectId = getProjectId(nft);
  const collectionName =
    pageData?.collection?.name || nft?.collection?.name || "Collection";
  const ownerDisplayName =
    pageData?.owner?.displayName ||
    pageData?.owner?.username ||
    nft?.owner?.username ||
    nft?.owner?.twitterData?.name ||
    "Owner";
  const creatorDisplayName =
    pageData?.creator?.displayName ||
    pageData?.creator?.username ||
    ownerDisplayName;
  const contractAddress =
    pageData?.info?.contractAddress || nft?.collection?.smart || "-";
  const currentUserWallet = normalizeWallet(userData?.wallet);
  const currentUserId = String(userData?._id || "");
  const ownerWallet = normalizeWallet(pageData?.owner?.wallet || nft?.owner?.wallet);
  const ownerId = String(pageData?.owner?._id || nft?.owner?._id || "");
  const isNftOwner = Boolean(
    (ownerWallet && currentUserWallet && ownerWallet === currentUserWallet) ||
    (ownerId && currentUserId && ownerId === currentUserId)
  );

  useEffect(() => {
    setViewsCount(Number(nft?.nftPage?.views ?? nft?.viewsCount ?? nft?.views ?? 0));
  }, [nft?.nftPage?.views, nft?.viewsCount, nft?.views]);

  useEffect(() => {
    if (typeof window === "undefined" || !entityId) return;
    if (!userData?.isFullAuth) return;

    const sessionViewKey = `market:nft:${entityId}:viewed:${String(
      userData?._id || ""
    )}`;

    if (!window.sessionStorage.getItem(sessionViewKey)) {
      addNftView(entityId).then(({ isSuccess, nft: updated }) => {
        if (isSuccess && updated && typeof updated === "object") {
          setViewsCount(Number((updated as ICollectionNft)?.viewsCount || 0));
        }
      });
      window.sessionStorage.setItem(sessionViewKey, "1");
    }
  }, [entityId, userData?._id, userData?.isFullAuth]);

  const details = {
    cartId: entityId,
    title: nft?.name || `NFT ${formatTokenId(nft?.nftId)}`,
    tokenId: formatTokenId(pageData?.info?.tokenId || nft?.nftId),
    rarity: pageData?.rarity || nft?.rarity || "Common",
    views: formatViews(viewsCount),
    collectionName,
    collectionAvatar: resolveMediaUrl(pageData?.collection?.avatar),
    creatorName: creatorDisplayName,
    creatorAvatar: resolveUserAvatar(pageData?.creator),
    description: pageData?.description || nft?.description || "",
    image: resolveMediaUrl(pageData?.image || nft?.displayImage || nft?.image),
    priceAmount: Number(pageData?.price?.amount || nft?.price || 0),
    priceUsd: Number(pageData?.price?.usd || nft?.priceUsd || 0),
    currency: pageData?.price?.currency || nft?.currency || "ETH",
    endDate: pageData?.endDate || nft?.endDate || null,
  };
  const priceData =
    pageData?.priceHistory?.map((item) => ({
      id: item.id,
      date: formatChartDate(item.timestamp),
      price: Number(item.price || 0),
      priceUsd: Number(item.priceUsd || 0),
      currency: item.currency,
    })) || [];
  const activitiesData =
    pageData?.activities?.map((activity) => ({
      id: activity.id,
      type: activity.type,
      status: activity.status,
      itemImage: resolveMediaUrl(activity.itemImage),
      collectionName: activity.collectionName,
      itemName: activity.itemName,
      price: Number(activity.price || 0),
      priceUSD: Number(activity.priceUsd || 0),
      currency: activity.currency,
      from: activity.from,
      to: activity.to,
      date: formatRelativeTime(activity.createdAt, formatDateTime(activity.createdAt)),
    })) || [];
  const moreFromCollectionData = pageData?.related?.fromCollection || [];
  const moreFromSellerData = pageData?.related?.fromSeller || [];
  const isAuctionEnded = isExpiredDate(details.endDate);
  const cartCurrency: CartCurrency =
    details.currency === "USDC" ? "USDC" : "ETH";
  const backendListingOrderId = Math.trunc(Number(nft?.orderId || 0));
  const backendListingTokenAddress = String(
    nft?.tokenAddress || nft?.collection?.smart || ""
  ).trim();
  const isBackendListingAvailable = Boolean(
    nft?.isActive !== false &&
      !isAuctionEnded &&
      backendListingOrderId > 0 &&
      backendListingTokenAddress
  );
  const smartNftId = Number.isFinite(Number(nft?.nftId))
    ? Number(nft?.nftId)
    : undefined;
  const cartItemId = `${entityId}-${cartCurrency}`;
  const normalizedServerCart = useMemo(
    () =>
      (Array.isArray(cartData?.cart) ? cartData.cart : [])
        .map(normalizeInitialItem)
        .filter(
          (item: ReturnType<typeof normalizeInitialItem>): item is CartItem =>
            Boolean(item)
        ),
    [cartData?.cart]
  );
  const isInLocalCart = useMemo(
    () => uiCart.items.some((item: CartItem) => String(item.id) === cartItemId),
    [cartItemId, uiCart.items]
  );
  const isInServerCart = useMemo(
    () =>
      normalizedServerCart.some(
        (item: CartItem) => String(item.id) === cartItemId
      ),
    [cartItemId, normalizedServerCart]
  );
  const isInCart =
    !isRemovedFromCart && (isInServerCart || (isInLocalCart && !isAddToCartPending));
  const activeOffersQuery = useQuery(
    ["nft-offers", entityId],
    () => fetchOrders("active", entityId),
    {
      enabled: Boolean(entityId),
    }
  );
  const liveOrders = activeOffersQuery.data?.isSuccess
    ? activeOffersQuery.data?.orders || []
    : [];
  const orderMap = useMemo(
    () => new Map(liveOrders.map((order: IOrder) => [String(order._id), order])),
    [liveOrders]
  );
  const offerEthUsdRate =
    details.currency === "ETH" && details.priceAmount > 0
      ? Number(details.priceUsd || 0) / Number(details.priceAmount || 1)
      : 0;

  const buildCartItem = (options?: { orderId?: number; price?: number }) => {
    const resolvedPrice = Number(options?.price || details.priceAmount || 0);
    const resolvedUsdPrice =
      cartCurrency === "USDC"
        ? resolvedPrice
        : offerEthUsdRate > 0
          ? Number((resolvedPrice * offerEthUsdRate).toFixed(2))
          : Number(details.priceUsd || 0) || undefined;

    return {
      id: cartItemId,
      entityId,
      collectionId,
      nftId: smartNftId,
      orderId: Number(options?.orderId || nft?.orderId || 0) || undefined,
      tokenAddress: String(nft?.tokenAddress || nft?.collection?.smart || ""),
      ownerWallet: String(nft?.owner?.wallet || ""),
      ownerId: String(nft?.owner?._id || ""),
      name: details.title,
      description: collectionName,
      price: resolvedPrice,
      usdPrice: resolvedUsdPrice,
      image: { src: details.image },
      currency: cartCurrency,
      isEth: cartCurrency === "ETH",
      isUsdc: cartCurrency === "USDC",
    };
  };

  const mapOrderToOffer = (order: IOrder) => {
    const offerWallet = normalizeWallet(order?.user?.wallet);
    const offerUserId = String(order?.user?._id || "");
    const isOwnOffer = Boolean(
      (offerWallet && currentUserWallet && offerWallet === currentUserWallet) ||
      (offerUserId && currentUserId && offerUserId === currentUserId)
    );
    const isExpired = isExpiredDate(order?.endDate);
    const smartOrderId = Math.trunc(Number(order?.smartOrderId || 0)) || undefined;
    const canConfirm = Boolean(isNftOwner && !order?.isConfirm && !isExpired);
    const canBuy = Boolean(
      isOwnOffer && !!order?.isConfirm && !!smartOrderId && !isExpired
    );
    const canCancel = Boolean(isOwnOffer);
    const status = order?.isConfirm
      ? smartOrderId
        ? `Accepted #${smartOrderId}`
        : "Accepted"
      : isExpired
        ? "Expired"
        : `Ends ${formatDateTime(order?.endDate)}`;

    return {
      id: String(order?._id || ""),
      userName:
        order?.user?.username ||
        order?.user?.twitterData?.name ||
        order?.user?.name ||
        "User",
      avatar: resolveUserAvatar(order?.user),
      price: Number(order?.price || 0),
      priceUSD: order?.isUsdc
        ? Number(order?.price || 0)
        : offerEthUsdRate > 0
          ? Number((Number(order?.price || 0) * offerEthUsdRate).toFixed(2))
          : Number(order?.price || 0),
      currency: (order?.isUsdc ? "USDC" : "ETH") as "USDC" | "ETH",
      time: formatRelativeTime(order?.created),
      canCancel,
      canConfirm,
      canBuy,
      isConfirmed: !!order?.isConfirm,
      isExpired,
      status,
      smartOrderId,
    };
  };

  const fallbackOffersData =
    pageData?.offers?.map((offer) => {
      const offerWallet = normalizeWallet(offer?.user?.wallet);
      const offerUserId = String(offer?.user?._id || "");
      const isOwnOffer = Boolean(
        (offerWallet && currentUserWallet && offerWallet === currentUserWallet) ||
        (offerUserId && currentUserId && offerUserId === currentUserId)
      );

      return {
        id: offer._id,
        userName:
          offer?.user?.displayName ||
          offer?.user?.username ||
          offer?.user?.twitterData?.name ||
          "User",
        avatar: resolveUserAvatar(offer?.user),
        price: Number(offer.price || 0),
        priceUSD: Number(offer.priceUsd || 0),
        currency: offer.currency as "USDC" | "ETH",
        time: formatRelativeTime(offer.createdAt),
        canCancel: isOwnOffer && Boolean(offer.canCancel),
        canConfirm: false,
        canBuy: false,
        isConfirmed: false,
        isExpired: isExpiredDate(offer.endDate),
        status: offer?.endDate
          ? `Ends ${formatDateTime(offer.endDate)}`
          : "Open",
        smartOrderId: undefined,
      };
    }) || [];
  const offersData = activeOffersQuery.data?.isSuccess
    ? liveOrders.map(mapOrderToOffer)
    : fallbackOffersData;
  const infoRows = [
    {
      label: "Contract Address:",
      value: formatContractAddress(contractAddress),
      copyValue: contractAddress !== "-" ? contractAddress : undefined,
    },
    {
      label: "Token ID:",
      value: pageData?.info?.tokenId || String(nft?.nftId || "-"),
    },
    {
      label: "Token Standard:",
      value:
        pageData?.info?.tokenStandard || nft?.collection?.tokenStandart || "-",
    },
    {
      label: "Blockchain:",
      value:
        pageData?.info?.blockchain || nft?.collection?.project?.blockchain || "-",
    },
    {
      label: "Metadata:",
      value: pageData?.info?.metadataLabel || "Not available",
    },
  ];

  const handlePurchaseNow = async () => {
    if (isInCart) {
      setShowCartModal(true);
      return;
    }

    if (isAuctionEnded) {
      toast.error("Auction has already ended");
      return;
    }

    if (!userData?.isFullAuth) {
      toast.error("You need to be fully logged in to manage cart");
      return;
    }

    if (isNftOwner) {
      toast.error("You cannot buy your own NFT");
      return;
    }

    if (!entityId) {
      toast.error("NFT is unavailable");
      return;
    }

    if (!isBackendListingAvailable) {
      toast.error("NFT is no longer available");
      return;
    }

    setShowCartModal(true);
    const cartItem = buildCartItem();

    setIsAddToCartPending(true);
    setIsRemovedFromCart(false);
    uiCart.addToCart(cartItem);
    loadingStateHandler(true);

    try {
      const { isSuccess } = await toggleNft(entityId, "POST");

      if (!isSuccess) {
        uiCart.removeFromCart(cartItem.id);
        toast.error("Failed to add NFT to cart");
        return;
      }

      await cartData?.refetch?.();
      toast.success("NFT added to cart");
    } catch (error) {
      uiCart.removeFromCart(cartItem.id);
      toast.error("Failed to add NFT to cart");
    } finally {
      setIsAddToCartPending(false);
      loadingStateHandler(false);
    }
  };

  const handleMakeOffer = () => {
    if (isAuctionEnded) {
      toast.error("Auction has already ended");
      return;
    }

    if (!userData?.isFullAuth) {
      toast.error("You need to be fully logged in to make offers");
      return;
    }

    if (isNftOwner) {
      toast.error("You cannot make an offer on your own NFT");
      return;
    }

    setShowOfferModal(true);
  };

  const handleCreateOffer = async (payload: {
    price: number;
    currency: "USDC" | "ETH";
  }) => {
    if (!userData?.isFullAuth) {
      toast.error("You need to be fully logged in to make offers");
      return false;
    }

    if (isNftOwner) {
      toast.error("You cannot make an offer on your own NFT");
      return false;
    }

    if (!entityId || !collectionId || !projectId) {
      toast.error("NFT offer data is unavailable");
      return false;
    }

    const offerData: ICreateOrder = {
      collectionId,
      collectionNftId: entityId,
      projectId,
      endDate: getFallbackOfferEndDate(details.endDate),
      isEth: payload.currency === "ETH",
      isUsdc: payload.currency === "USDC",
      price: Number(payload.price || 0),
      belowFloor:
        Number(details.priceAmount || 0) > 0
          ? ((Number(details.priceAmount || 0) - Number(payload.price || 0)) /
            Number(details.priceAmount || 1)) *
          100
          : 0,
    };

    setIsCreateOfferPending(true);
    loadingStateHandler(true);

    try {
      const { isSuccess } = await createOrder("orders", offerData);

      if (!isSuccess) {
        toast.error("Failed to create offer");
        return false;
      }

      await activeOffersQuery.refetch();
      toast.success("Offer created");
      return true;
    } catch (error) {
      toast.error("Failed to create offer");
      return false;
    } finally {
      setIsCreateOfferPending(false);
      loadingStateHandler(false);
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    const order = orderMap.get(offerId);

    if (!order) {
      toast.error("Offer not found");
      return;
    }

    if (!userData?.isFullAuth) {
      toast.error("You need to be fully logged in to cancel offers");
      return;
    }

    setOfferActionState({ id: offerId, action: "cancel" });
    loadingStateHandler(true);

    try {
      const smartOrderId = Math.trunc(Number(order?.smartOrderId || 0));

      if (order?.isConfirm && smartOrderId > 0) {
        const cancelFn = order?.isUsdc ? cancelItemUsd : cancelItem;
        const { success } = await cancelFn(smartOrderId);

        if (!success) {
          toast.error("Failed to cancel accepted offer on-chain");
          return;
        }
      }

      const { isSuccess } = await deactivateOrder(order._id);

      if (!isSuccess) {
        toast.error("Failed to cancel offer");
        return;
      }

      await activeOffersQuery.refetch();
      toast.success(order?.isConfirm ? "Accepted offer canceled" : "Offer canceled");
    } catch (error) {
      toast.error("Failed to cancel offer");
    } finally {
      setOfferActionState({ id: null, action: null });
      loadingStateHandler(false);
    }
  };

  const handleConfirmOffer = async (offerId: string) => {
    const order = orderMap.get(offerId);
    if (!order) {
      toast.error("Offer not found");
      return;
    }

    if (!isNftOwner) {
      toast.error("Only the seller can accept this offer");
      return;
    }

    if (!nft?.collection?.smart || !nft?.nftId || !order?.user?.wallet) {
      toast.error("Offer confirmation data is unavailable");
      return;
    }

    setOfferActionState({ id: offerId, action: "confirm" });
    loadingStateHandler(true);

    try {
      const createFn = order?.isUsdc ? createItemForSmUsd : createItemForSm;
      const { success, id } = await createFn(
        new Date(order.endDate).getTime() / 1000,
        Number(nft.nftId),
        String(nft.collection.smart),
        Number(order.price || 0),
        String(order.user.wallet || "")
      );

      if (!success || !Number(id || 0)) {
        toast.error("Failed to create accepted offer on-chain");
        return;
      }

      const acceptedSmartOrderId = Number(id || 0);
      const { isSuccess } = await confirmOrder(order._id, acceptedSmartOrderId);

      if (!isSuccess) {
        const rollbackAcceptedOrder =
          order?.isUsdc ? cancelItemUsd : cancelItem;
        const rollbackResult = await rollbackAcceptedOrder(acceptedSmartOrderId);

        if (!rollbackResult.success) {
          toast.error(
            "Failed to save accepted offer. Accepted order remains on-chain."
          );
          return;
        }

        toast.error("Failed to save accepted offer");
        return;
      }

      await activeOffersQuery.refetch();
      toast.success("Offer accepted");
    } catch (error) {
      toast.error("Failed to accept offer");
    } finally {
      setOfferActionState({ id: null, action: null });
      loadingStateHandler(false);
    }
  };

  const handleBuyOffer = async (offerId: string) => {
    const order = orderMap.get(offerId);
    const checkoutCurrency = order?.isUsdc ? "USDC" : "ETH";
    const smartOrderId = Math.trunc(Number(order?.smartOrderId || 0));
    const isOfferExpired = isExpiredDate(order?.endDate);

    if (!order || !smartOrderId) {
      toast.error("Accepted offer is unavailable");
      return;
    }

    if (!userData?.isFullAuth) {
      toast.error("You need to be fully logged in to buy this NFT");
      return;
    }

    if (isNftOwner) {
      toast.error("You cannot buy your own NFT");
      return;
    }

    if (!entityId || !nft?.tokenAddress || !Number.isFinite(Number(nft?.nftId))) {
      toast.error("Checkout data is unavailable");
      return;
    }

    if (!order?.isConfirm || order?.isActive === false || isOfferExpired) {
      toast.error("Accepted offer is no longer available");
      return;
    }

    setOfferActionState({ id: offerId, action: "buy" });
    loadingStateHandler(true);

    try {
      const result = await completeCollectionNftCheckout(
        [
          {
            collectionNftId: entityId,
            orderId: smartOrderId,
            nftId: Number(nft.nftId || 0),
            tokenAddress: String(nft.tokenAddress || ""),
            price: Number(order?.price || 0),
            currency: checkoutCurrency,
          },
        ],
        checkoutCurrency
      );

      if (!result.chainSuccess) {
        toast.error("Blockchain purchase failed");
        return;
      }

      if (!result.backendSuccess) {
        toast.error(
          "Purchase succeeded on-chain, but backend sync failed. Retry or refresh."
        );
        return;
      }

      await cartData?.refetch?.();
      await refetchBalance?.();
      await activeOffersQuery.refetch();
      toast.success("NFT purchased successfully");
      await replace("/utility/market");
    } catch (error) {
      toast.error("Failed to buy NFT");
    } finally {
      setOfferActionState({ id: null, action: null });
      loadingStateHandler(false);
    }
  };

  return (
    <PageWrapper>
      <ContentWrapper>
        <NFTPageSidebar
          details={details}
          isInCart={isInCart}
          disableMakeOffer={isNftOwner}
          onExpandImage={() => setShowImageModal(true)}
          onPurchaseNow={handlePurchaseNow}
          onMakeOffer={handleMakeOffer}
        />

        <NFTPageDetails
          details={details}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          infoRows={infoRows}
          priceData={priceData}
          offersData={offersData}
          pendingOfferId={offerActionState.id}
          pendingOfferAction={offerActionState.action}
          onCancelOffer={handleCancelOffer}
          onConfirmOffer={handleConfirmOffer}
          onBuyOffer={handleBuyOffer}
        />
      </ContentWrapper>

      <NFTPageActivities activities={activitiesData} />

      <NFTPageRelatedSection
        title={`More from ${collectionName}`}
        items={moreFromCollectionData}
      />

      <NFTPageRelatedSection
        title={`More from ${ownerDisplayName}`}
        items={moreFromSellerData}
      />

      {showOfferModal && (
        <MakeOfferModal
          defaultCurrency={details.currency === "USDC" ? "USDC" : "ETH"}
          ethUsdRate={offerEthUsdRate}
          isSubmitting={isCreateOfferPending}
          nftImage={details.image}
          nftName={details.title}
          onClose={() => setShowOfferModal(false)}
          onSubmit={handleCreateOffer}
        />
      )}

      {showCartModal ? (
        <CartModal
          currency={cartCurrency}
          initialItems={Array.isArray(cartData?.cart) ? cartData.cart : []}
          onClose={() => setShowCartModal(false)}
          onItemRemoved={(itemId) => {
            if (itemId === cartItemId) {
              setIsRemovedFromCart(true);
            }
          }}
          onCheckoutSuccess={async () => {
            await replace("/utility/market");
          }}
        />
      ) : null}

      {showImageModal && (
        <Modal
          className="image-modal"
          onClose={() => setShowImageModal(false)}
          title={details.title}
        >
          <img src={details.image} alt={details.title} />
        </Modal>
      )}
    </PageWrapper>
  );
};

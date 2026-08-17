import React, { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Badges, List, NFTItemWrapper, Price } from "./styles";
import humans from "../../../../../../assets/images/nft/humans.png";
import UserAvatar from "../../../../../global/common/UserAvatar";
import Typography from "../../../../../global/common/Typography";
import {
  AuthContext,
  CartContext,
  LoadingContext,
  LocationContext,
  WatchlistContext,
} from "../../../../../global/Layout";
import {
  CardHeader,
  ProjectType,
} from "../../../../projects/OTC/FeaturedAllocations/styles";
import { ArrowRight, Eye, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { LOADER_API } from "../../../../../../config/api";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import imageLoader from "../../../../../../helpers/imageLoader";
import addProjectToWatchlist from "../../../../../../http/watchlist/addProjectToWatchlist";
import deleteFromWatchlist from "../../../../../../http/watchlist/deleteFromWatchlist";
import toggleNft from "../../../../../../http/cart/toggleNft";
import CartIcon from "../../../../../global/Icons/CartIcon";
import { useCart } from "../../../../../../contexts/CartContext";
import { formatViews } from "../../NFTPage/helpers";
import {
  toEthPrice,
  toUsdPrice,
  useEthUsdPrice,
} from "../../../../../../hooks/useEthUsdPrice";

interface NFTItemProps {
  item: any;
  currency: "ETH" | "USDC";
  onOpenCart: () => void;
}

const resolveImage = (image?: unknown): string => {
  if (!image) return humans.src;

  const imageValue =
    typeof image === "string"
      ? image
      : typeof image === "object" &&
        image !== null &&
        "src" in image &&
        typeof (image as { src?: unknown }).src === "string"
        ? String((image as { src: string }).src)
        : "";

  if (!imageValue) return humans.src;
  if (imageValue.startsWith("http")) return imageValue;
  if (imageValue.startsWith("/uploads")) return `${LOADER_API}${imageValue}`;
  if (imageValue.startsWith("/")) return `${LOADER_API}/uploads${imageValue}`;

  return `${LOADER_API}/uploads/${imageValue}`;
};

export const CollectionItem: React.FC<NFTItemProps> = ({
  item,
  currency,
  onOpenCart,
}) => {
  const router = useRouter();
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const { path } = useContext(LocationContext);
  const { watchlist, refetch: refetchWatchlist } = useContext(WatchlistContext);
  const cartData = useContext(CartContext);
  const uiCart = useCart();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const nftName = item?.name || "NFT";
  const collectionName = item?.collection?.name || "Collection";
  const collectionId = item?.collection?._id || item?.collectionId || "";
  const projectId = String(item?.project?._id || item?.collection?.projectId || "");
  const projectName = item?.project?.name || nftName;
  const projectNiche = item?.project?.niche || item?.collection?.type || "-";
  const projectLogo = item?.project?.logo
    ? imageLoader(String(item.project.logo))
    : humans.src;
  const chain = "zkSync Era";
  const rarity = String(item?.rarity || "Common");
  const rarityClassName = rarity.toLowerCase().replace(/\s+/g, "-");
  const priceValue = Number(item?.price || 0);
  const derivedEthUsdPrice =
    currency === "ETH" && priceValue > 0 && Number(item?.priceUsd || 0) > 0
      ? Number(item?.priceUsd || 0) / priceValue
      : undefined;
  const ethUsdPrice = useEthUsdPrice(derivedEthUsdPrice);
  const imageSrc = resolveImage(item?.image);
  const views = formatViews(
    Number(item?.views ?? item?.viewsCount ?? 0)
  );
  const usdPriceValue = toUsdPrice(
    priceValue,
    currency,
    ethUsdPrice,
    item?.priceUsd
  );
  const ethPriceValue = toEthPrice(priceValue, currency, ethUsdPrice);
  const smartNftId = Number.isFinite(Number(item?.nftId))
    ? Number(item?.nftId)
    : null;
  const watchlistPath = path || "utility";
  const entityId = String(item?._id || "");
  const nftPageHref = entityId
    ? `/utility/market/collection/nft/${entityId}?currency=${currency}`
    : `/utility/market?currency=${currency}`;
  const cartItemId = `${entityId}-${currency}`;
  const isInCart = useMemo(
    () => uiCart.items.some((cartItem) => String(cartItem.id) === cartItemId),
    [cartItemId, uiCart.items]
  );

  const buildCartItem = () => ({
    id: cartItemId,
    entityId,
    collectionId,
    nftId: smartNftId || undefined,
    orderId: Number(item?.orderId || 0) || undefined,
    tokenAddress: String(item?.tokenAddress || ""),
    ownerWallet: String(item?.owner?.wallet || ""),
    name: nftName,
    description: collectionName,
    price: priceValue,
    usdPrice: usdPriceValue,
    image: { src: imageSrc },
    currency,
    isEth: currency === "ETH",
    isUsdc: currency === "USDC",
  });

  useEffect(() => {
    if (!projectId) {
      setIsInWatchlist(false);
      return;
    }

    setIsInWatchlist(
      !!watchlist?.projects?.find((watchlistItem: any) => {
        return String(watchlistItem?._id || "") === projectId;
      })
    );
  }, [watchlist, projectId]);

  const handleWatchlist = async () => {
    if (!projectId) {
      toast.error("Project is not connected to collection");
      return;
    }

    if (!userData?.isFullAuth) {
      toast.error("You need to be fully logged in to add project to watchlist");
      return;
    }

    loadingStateHandler(true);

    try {
      if (isInWatchlist) {
        const { success } = await deleteFromWatchlist(watchlistPath, projectId);

        if (!success) {
          toast.error("Failed to remove from watchlist");
          return;
        }

        setIsInWatchlist(false);
        toast.success("Removed from watchlist");
      } else {
        const { success } = await addProjectToWatchlist(watchlistPath, projectId);

        if (!success) {
          toast.error("Failed to add to watchlist");
          return;
        }

        setIsInWatchlist(true);
        toast.success("Added to watchlist");
      }

      await refetchWatchlist?.();
    } catch (error) {
      toast.error("Watchlist update failed");
    } finally {
      loadingStateHandler(false);
    }
  };

  const handleCartClick = async () => {
    if (!userData?.isFullAuth) {
      toast.error("You need to be fully logged in to manage cart");
      return;
    }

    if (
      String(item?.owner?.wallet || "").toLowerCase() ===
      String(userData?.wallet || "").toLowerCase()
    ) {
      toast.error("You cannot buy your own NFT");
      return;
    }

    if (!entityId) {
      toast.error("NFT is unavailable");
      return;
    }

    if (isInCart) {
      loadingStateHandler(true);

      try {
        const { isSuccess } = await toggleNft(entityId, "DELETE");

        if (!isSuccess) {
          toast.error("Failed to remove NFT from cart");
          return;
        }

        uiCart.removeFromCart(cartItemId);
        await cartData?.refetch?.();
        toast.success("NFT removed from cart");
      } catch (error) {
        toast.error("Failed to remove NFT from cart");
      } finally {
        loadingStateHandler(false);
      }

      return;
    }

    const cartItem = buildCartItem();

    uiCart.addToCart(cartItem);
    onOpenCart();
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
      loadingStateHandler(false);
    }
  };

  const handleOpenNftPage = () => {
    void router.push(nftPageHref);
  };

  return (
    <>
      <NFTItemWrapper
        role="link"
        tabIndex={0}
        onClick={handleOpenNftPage}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenNftPage();
          }
        }}
      >
        <img src={imageSrc} alt={nftName} />
        <div className="nft-info">
          <Badges>
            <button
              className={isInWatchlist ? "favorite active" : "favorite"}
              onClick={(event) => {
                event.stopPropagation();
                void handleWatchlist();
              }}
              type="button"
            >
              <Star width={16} height={16} />
            </button>
            <div className={`rarity ${rarityClassName}`}>{rarity}</div>
            <div className="number">
              {smartNftId !== null ? `#${smartNftId}` : "-"}
            </div>
          </Badges>
          <div className="owner-info">
            <CardHeader>
              <UserAvatar
                avatar={projectLogo}
                size="otc"
                variant="default"
                name={projectName}
              />
              <div className="project-info">
                <Typography variant="h5">{projectName}</Typography>
                <ProjectType>{projectNiche}</ProjectType>
              </div>
              <div className="views">
                <Eye width={18} /> {views}
              </div>
            </CardHeader>
            <List>
              <span>
                Collection: <strong>{collectionName}</strong>
              </span>
              <span>
                Chain: <strong>{chain}</strong>
              </span>

            </List>
            <Price>
              <div className="value">
                <strong>
                  {currency === "ETH"
                    ? `$${clarifyAmount(usdPriceValue)}`
                    : ethPriceValue > 0 || priceValue === 0
                      ? `ETH ${clarifyAmount(ethPriceValue)}`
                      : "ETH -"}
                </strong>

                <span>
                  {currency === "ETH"
                    ? `ETH ${clarifyAmount(priceValue)}`
                    : `USDC ${clarifyAmount(priceValue)}`}
                </span>
              </div>
              <div className="actions">
                <button
                  className={isInCart ? "cart active" : "cart"}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleCartClick();
                  }}
                  type="button"
                >
                  <CartIcon fill={isInCart ? "#04A584" : "#738094"} />
                </button>
                <Link
                  onClick={(event) => event.stopPropagation()}
                  href={
                    collectionId
                      ? `/utility/market/collection/${collectionId}?currency=${currency}`
                      : `/utility/market?currency=${currency}`
                  }
                >
                  <ArrowRight width={20} height={20} color="#04A584" />
                </Link>
              </div>
            </Price>
          </div>
        </div>
      </NFTItemWrapper>
    </>
  );
};

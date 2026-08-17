import React, { useContext, useMemo } from "react";
import { toast } from "react-toastify";
import { Badges, List, NFTItemWrapper, Price } from "./styles";
import Typography from "../../../../../global/common/Typography";
import { CardHeader } from "../../../../projects/OTC/FeaturedAllocations/styles";
import { Eye, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import humans from "../../../../../../assets/images/nft/humans.png";
import { LOADER_API } from "../../../../../../config/api";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import {
  AuthContext,
  CartContext,
  LoadingContext,
} from "../../../../../global/Layout";
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
  currency?: "ETH" | "USDC";
  onOpenCart?: () => void;
  detailsHref?: string;
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

const formatPrice = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  if (value < 1) return value.toFixed(4);
  return value.toFixed(2);
};

export const NFTItem: React.FC<NFTItemProps> = ({
  item,
  currency,
  onOpenCart,
  detailsHref,
}) => {
  const router = useRouter();
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const cartData = useContext(CartContext);
  const uiCart = useCart();
  const imageSrc = resolveImage(item?.displayImage || item?.image);
  const nftName = item?.name || "NFT";
  const rarity = String(item?.rarity || "Common");
  const rarityClassName = rarity.toLowerCase().replace(/\s+/g, "-");
  const nftId = item?.nftId || item?._id || "-";
  const sourceCurrency =
    String(item?.currency || "").toUpperCase() === "USDC" || item?.isUsdc
      ? "USDC"
      : "ETH";
  const displayCurrency = currency || sourceCurrency;
  const rawPrice = Number(item?.price || 0);
  const rawUsdPrice = Number(item?.priceUsd || 0);
  const derivedEthUsdPrice =
    sourceCurrency === "ETH" && rawPrice > 0 && rawUsdPrice > 0
      ? rawUsdPrice / rawPrice
      : undefined;
  const ethUsdPrice = useEthUsdPrice(derivedEthUsdPrice);
  const ethPrice = toEthPrice(rawPrice, sourceCurrency, ethUsdPrice);
  const usdPrice = toUsdPrice(
    rawPrice,
    sourceCurrency,
    ethUsdPrice,
    rawUsdPrice
  );
  const displayPrice = displayCurrency === "USDC" ? usdPrice : ethPrice;
  const floorPrice =
    item?.floorPrice || `${displayCurrency} ${formatPrice(displayPrice)}`;
  const hiddenRarity = Boolean(item?.hiddenRarity);
  const entityId = String(item?._id || "");
  const collectionId = String(item?.collection?._id || item?.collectionId || "");
  const views = formatViews(
    Number(item?.views ?? item?.viewsCount ?? 0)
  );

  const smartNftId = Number.isFinite(Number(item?.nftId))
    ? Number(item?.nftId)
    : undefined;
  const nftPageHref =
    detailsHref ||
    (entityId
      ? `/utility/market/collection/nft/${entityId}?currency=${displayCurrency}`
      : "/utility/market");
  const cartItemId = `${entityId}-${displayCurrency}`;
  const isInCart = useMemo(
    () => uiCart.items.some((cartItem) => String(cartItem.id) === cartItemId),
    [cartItemId, uiCart.items]
  );
  const canManageCart = Boolean(
    onOpenCart &&
    entityId &&
    Number(item?.orderId || 0) > 0 &&
    String(item?.tokenAddress || "")
  );

  const buildCartItem = () => ({
    id: cartItemId,
    entityId,
    collectionId,
    nftId: smartNftId,
    orderId: Number(item?.orderId || 0) || undefined,
    tokenAddress: String(item?.tokenAddress || ""),
    ownerWallet: String(item?.owner?.wallet || ""),
    ownerId: String(item?.owner?._id || item?.ownerId || ""),
    name: nftName,
    description: String(item?.collection?.name || "NFT Collection"),
    price: displayPrice,
    usdPrice,
    image: { src: imageSrc },
    currency: displayCurrency,
    isEth: displayCurrency === "ETH",
    isUsdc: displayCurrency === "USDC",
  });

  const handleCartClick = async () => {
    if (!canManageCart) {
      return;
    }

    if (!userData?.isFullAuth) {
      toast.error("You need to be fully logged in to manage cart");
      return;
    }

    const ownerWallet = String(item?.owner?.wallet || "").toLowerCase();
    const ownerId = String(item?.owner?._id || item?.ownerId || "");
    const userWallet = String(userData?.wallet || "").toLowerCase();
    const userId = String(userData?._id || "");

    if (
      (ownerWallet && userWallet && ownerWallet === userWallet) ||
      (ownerId && userId && ownerId === userId)
    ) {
      toast.error("You cannot buy your own NFT");
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
    onOpenCart?.();
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
    if (!entityId && !detailsHref) {
      return;
    }

    router.push(nftPageHref);
  };

  return (
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
            className="favorite"
            type="button"
            onClick={(event) => event.stopPropagation()}
          >
            <Star width={16} height={16} />
          </button>
          <div className={`rarity ${rarityClassName}`}>{rarity}</div>
          <div className="number">#{nftId}</div>
        </Badges>
        <div className="owner-info">
          <CardHeader>
            <div className="project-info">
              <Typography variant="h5">{nftName}</Typography>
            </div>
            <div className="views">
              <Eye width={18} /> {views}
            </div>
          </CardHeader>
          <List>
            <span>
              Floor Price: <strong>{floorPrice}</strong>
            </span>
            <span>
              <div className="rarity-tooltip">
                Hidden rarity{" "}
                <button className="tooltip-button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="13"
                    viewBox="0 0 14 13"
                    fill="none"
                  >
                    <path
                      d="M7 5.83333V8.83333M7 3.6097V3.58333M13 6.5C13 3.18629 10.3137 0.5 7 0.5C3.68629 0.5 1 3.18629 1 6.5C1 9.81371 3.68629 12.5 7 12.5C10.3137 12.5 13 9.81371 13 6.5Z"
                      stroke="#738094"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  <span className="tooltip-text">
                    Additional rarity level that can be upgraded by spending XP
                    earned on the platform. Unlike the fixed rarity type (e.g.,
                    Legendary), Hidden Rarity is dynamic and reflects your NFT's
                    progress and achievements.{" "}
                  </span>
                </button>
              </div>
              <strong className={hiddenRarity ? "yes" : "no"}>
                {hiddenRarity ? "Yes" : "No"}
              </strong>
            </span>
          </List>
          <Price>
            <div className="value">
              <strong>{`${displayCurrency} ${formatPrice(displayPrice)}`}</strong>
              <span>
                {displayCurrency === "ETH"
                  ? `$${clarifyAmount(usdPrice)}`
                  : ethPrice > 0 || rawPrice === 0
                    ? `ETH ${clarifyAmount(ethPrice)}`
                    : "ETH -"}
              </span>
            </div>
            <div className="actions">
              {canManageCart ? (
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
              ) : null}
            </div>
          </Price>
        </div>
      </div>
    </NFTItemWrapper>
  );
};

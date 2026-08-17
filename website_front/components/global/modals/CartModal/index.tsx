import React, { FC, useContext, useEffect, useMemo, useRef, useState } from "react";
import Modal from "../../common/Modal";
import {
  CartCurrency,
  CartItem as StoredCartItem,
  useCart,
} from "../../../../contexts/CartContext";
import {
  SubmitButton,
  CartSwitch,
  CartBody,
  CartBottom,
  CartLabel,
  CartValue,
  SelectAllContainer,
} from "./styles";
import Checkbox from "../../common/Checkbox";
import Switch from "../../../UI/inputs/switch";
import EmptyCartState from "./components/EmptyCartState";
import CartItemsList from "./components/CartItemsList";
import { formatTokenPrice, getItemCurrency, normalizeInitialItem } from "./utils";
import {
  AuthContext,
  BalanceContext,
  CartContext,
  LoadingContext,
} from "../../Layout";
import { toast } from "react-toastify";
import completeCollectionNftCheckout from "../../../../helpers/completeCollectionNftCheckout";
import toggleNft from "../../../../http/cart/toggleNft";

interface Props {
  onClose: () => void;
  initialItems?: any[];
  currency?: CartCurrency;
  onCheckoutSuccess?: () => Promise<void> | void;
  onItemRemoved?: (itemId: string) => void;
}

const isExpiredDate = (value?: string | Date | null): boolean => {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp <= Date.now();
};

const CartModal: FC<Props> = ({
  onClose,
  initialItems,
  currency,
  onCheckoutSuccess,
  onItemRemoved,
}) => {
  const [activeCurrency, setActiveCurrency] = useState<CartCurrency>(
    currency || "USDC"
  );
  const cart = useCart();
  const { userData } = useContext(AuthContext);
  const cartData = useContext(CartContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const { refetchBalance } = useContext(BalanceContext);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);
  const didSeedInitialItems = useRef(false);

  const normalizedInitialItems = useMemo(
    () =>
      (initialItems || []).map(normalizeInitialItem).filter(Boolean) as StoredCartItem[],
    [initialItems]
  );
  const backendListingsMap = useMemo(
    () =>
      new Map(
        (Array.isArray(cartData?.cart) ? cartData.cart : [])
          .map((cartItem: any) => {
            const listing = cartItem?.nftId;
            const entityId = String(listing?._id || "");

            if (!entityId || !listing) {
              return null;
            }

            return [entityId, listing] as const;
          })
          .filter(Boolean) as Array<readonly [string, any]>
      ),
    [cartData?.cart]
  );

  const cartItems = useMemo(
    () => cart.items.filter((item) => getItemCurrency(item) === activeCurrency),
    [activeCurrency, cart.items]
  );

  useEffect(() => {
    setActiveCurrency(currency || "USDC");
  }, [currency]);

  useEffect(() => {
    if (didSeedInitialItems.current || !normalizedInitialItems.length) {
      return;
    }

    cart.mergeItems(normalizedInitialItems);
    didSeedInitialItems.current = true;
  }, [cart, normalizedInitialItems]);

  useEffect(() => {
    if (!cartItems.length) {
      setSelectedItems([]);
      return;
    }

    setSelectedItems((prev) => {
      const availableIds = cartItems.map((item) => item.id);
      const filteredSelected = prev.filter((id) => availableIds.includes(id));

      return filteredSelected.length ? filteredSelected : availableIds;
    });
  }, [cartItems]);

  const allItemsSelected =
    selectedItems.length === cartItems.length && cartItems.length > 0;

  const handleSelectAll = () => {
    if (allItemsSelected) {
      setSelectedItems([]);
      return;
    }

    setSelectedItems(cartItems.map((item) => item.id));
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const removeFromCart = async (itemId: string) => {
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem?.entityId) {
      cart.removeFromCart(itemId);
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      return;
    }

    loadingStateHandler(true);

    try {
      await toggleNft(String(cartItem.entityId), "DELETE");
    } catch (error) {
      console.warn("Backend remove failed, cleaning up locally:", error);
    }

    cart.removeFromCart(itemId);
    setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    onItemRemoved?.(itemId);
    await cartData?.refetch?.();
    toast.success("NFT removed from cart");
    loadingStateHandler(false);
  };

  const selectedItemsData = useMemo(() => {
    const selected = cartItems.filter((item) => selectedItems.includes(item.id));
    const totalPrice = selected.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      count: selected.length,
      totalPrice,
      items: selected,
    };
  }, [cartItems, selectedItems]);

  const handleCheckout = async () => {
    if (!selectedItemsData.items.length || isCheckoutPending) {
      return;
    }

    const userWallet = String(userData?.wallet || "").toLowerCase();
    const userId = String(userData?._id || "");

    const hasOwnNft = selectedItemsData.items.some((item) => {
      const ownerWallet = String(item.ownerWallet || "").toLowerCase();
      const ownerId = String(item.ownerId || "");

      return (
        (ownerWallet && userWallet && ownerWallet === userWallet) ||
        (ownerId && userId && ownerId === userId)
      );
    });

    if (hasOwnNft) {
      toast.error("You cannot buy your own NFT");
      return;
    }

    loadingStateHandler(true);
    setIsCheckoutPending(true);

    try {
      const validatedCheckoutItems = selectedItemsData.items.map((item) => {
        const entityId = String(item.entityId || "");
        const backendListing = backendListingsMap.get(entityId);
        const listingOrderId = Math.trunc(
          Number(backendListing?.orderId || item.orderId || 0)
        );
        const listingTokenAddress = String(
          backendListing?.tokenAddress || item.tokenAddress || ""
        );
        const listingPrice = Number(backendListing?.price || item.price || 0);
        const listingNftId = Number(backendListing?.nftId || item.nftId || 0);
        const listingIsActive = backendListing
          ? backendListing?.isActive !== false
          : true;
        const listingIsExpired = backendListing?.endDate
          ? isExpiredDate(backendListing.endDate)
          : false;
        const listingMatchesCurrency = backendListing
          ? activeCurrency === "USDC"
            ? !!backendListing?.isUsdc
            : !!backendListing?.isEth
          : getItemCurrency(item) === activeCurrency;

        if (
          !entityId ||
          !listingIsActive ||
          listingIsExpired ||
          !listingMatchesCurrency ||
          listingOrderId <= 0 ||
          !listingTokenAddress ||
          listingNftId < 0
        ) {
          return {
            item,
            reason: "NFT is no longer available",
            checkoutItem: null,
          };
        }

        return {
          item,
          reason: "",
          checkoutItem: {
            collectionNftId: entityId,
            orderId: listingOrderId,
            nftId: listingNftId,
            tokenAddress: listingTokenAddress,
            price: listingPrice,
            currency: activeCurrency,
            cartItemId: item.id,
          },
        };
      });

      const unavailableItems = validatedCheckoutItems.filter(
        (item) => !item.checkoutItem
      );

      if (unavailableItems.length) {
        const unavailableIds = new Set(
          unavailableItems.map((item) => String(item.item.id))
        );

        await Promise.allSettled(
          unavailableItems.map(async ({ item }) => {
            if (item.entityId) {
              try {
                await toggleNft(String(item.entityId), "DELETE");
              } catch (error) {
                console.warn("Failed to remove unavailable cart item:", error);
              }
            }

            cart.removeFromCart(item.id);
            onItemRemoved?.(item.id);
          })
        );

        setSelectedItems((prev) =>
          prev.filter((itemId) => !unavailableIds.has(String(itemId)))
        );
        await cartData?.refetch?.();
        toast.warning(
          unavailableItems.length === 1
            ? "1 NFT was removed from cart because it is no longer available"
            : `${unavailableItems.length} NFTs were removed from cart because they are no longer available`
        );
      }

      const checkoutItems = validatedCheckoutItems.flatMap((item) =>
        item.checkoutItem ? [item.checkoutItem] : []
      );

      if (!checkoutItems.length) {
        toast.error("Selected NFTs are no longer available");
        return;
      }

      const result = await completeCollectionNftCheckout(
        checkoutItems,
        activeCurrency
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

      result.processedItems.forEach((item) => {
        if (item.cartItemId) {
          cart.removeFromCart(item.cartItemId);
        }
      });

      await cartData?.refetch?.();
      await refetchBalance?.();
      await onCheckoutSuccess?.();

      if (result.failedItems.length) {
        toast.warning(
          `${result.processedItems.length} NFT purchased, ${result.failedItems.length} still in cart`
        );
        return;
      }

      toast.success(
        result.processedItems.length > 1
          ? "NFTs purchased successfully"
          : "NFT purchased successfully"
      );
      onClose();
    } catch (error) {
      toast.error("Checkout failed");
    } finally {
      setIsCheckoutPending(false);
      loadingStateHandler(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Modal
        variant="cart"
        className="cart-modal"
        onClose={onClose}
        title="My Cart"
      >
        <EmptyCartState />
      </Modal>
    );
  }

  return (
    <Modal
      variant="cart"
      className="cart-modal"
      onClose={onClose}
      title="My Cart"
    >
      <CartBody>
        <CartSwitch>
          <Switch
            rightLabel="USDC"
            leftLabel="ETH"
            onChange={(value: boolean) =>
              setActiveCurrency(value ? "USDC" : "ETH")
            }
            checked={activeCurrency === "USDC"}
          />
        </CartSwitch>

        <SelectAllContainer>
          <Checkbox
            checked={allItemsSelected}
            onChange={handleSelectAll}
          />
          <span>
            {selectedItems.length} items out of {cartItems.length} are chosen
          </span>
        </SelectAllContainer>

        <CartItemsList
          items={cartItems}
          selectedItems={selectedItems}
          onSelectItem={handleItemSelect}
          onRemove={removeFromCart}
        />

        {selectedItems.length > 0 ? (
          <CartBottom>
            <div className="totals">
              <CartLabel>
                Total {selectedItemsData.count} item
                {selectedItemsData.count !== 1 ? "s" : ""}
              </CartLabel>
            </div>
            <div className="checkout">
              <CartValue>
                {formatTokenPrice(selectedItemsData.totalPrice, activeCurrency)}
              </CartValue>
              <SubmitButton onClick={handleCheckout} disabled={isCheckoutPending}>
                {isCheckoutPending ? "Processing..." : "Go to checkout"}
              </SubmitButton>
            </div>
          </CartBottom>
        ) : null}

        {/* <CartRecommendations /> */}
      </CartBody>
    </Modal>
  );
};

export default CartModal;

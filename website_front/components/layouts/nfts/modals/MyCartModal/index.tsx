import React, { FC, useContext, useMemo } from "react";
import { toast } from "react-toastify";
import Modal from "../../../../global/common/Modal";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import { TrashIcon } from "../../../../global/Icons";
import { SubmitButton } from "../../../projects/modals/AddFundsModal/styles";
import humans from "../../../../../assets/images/nft/humans.png";
import {
  ItemDataWrapper,
  ItemPriceWrapper,
  ItemsWrapper,
  ItemWrapper,
  ResultWrapper,
} from "./styles";
import { CartContext, LoadingContext } from "../../../../global/Layout";
import toggleNft from "../../../../../http/cart/toggleNft";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { LOADER_API } from "../../../../../config/api";

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

interface Props {
  onClose: () => void;
}

const MyCartModal: FC<Props> = ({ onClose }) => {
  const cartData = useContext(CartContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const cartItems = Array.isArray(cartData?.cart) ? cartData.cart : [];
  const total = useMemo(
    () =>
      cartItems.reduce((sum: number, cartItem: any) => {
        return sum + Number(cartItem?.nftId?.price || cartItem?.price || 0);
      }, 0),
    [cartItems]
  );

  const handleRemove = async (nftId: string) => {
    loadingStateHandler(true);

    try {
      const { isSuccess } = await toggleNft(nftId, "DELETE");

      if (!isSuccess) {
        toast.error("Failed to remove NFT from cart");
        return;
      }

      await cartData?.refetch?.();
      toast.success("NFT removed from cart");
    } catch (error) {
      toast.error("Failed to remove NFT from cart");
    } finally {
      loadingStateHandler(false);
    }
  };

  return (
    <Modal onClose={onClose} title="My cart" variant="small">
      <ItemsWrapper>
        {cartItems.length ? (
          cartItems.map((cartItem: any) => {
            const nftItem = cartItem?.nftId || {};
            const title = nftItem?.name || "NFT";
            const subtitle = nftItem?.project?.niche || nftItem?.collection?.name || "NFT & Collectibles";
            const price = Number(nftItem?.price || cartItem?.price || 0);

            return (
              <ItemWrapper variant="default" key={String(nftItem?._id || cartItem?._id || title)}>
                <ItemDataWrapper>
                  <UserAvatar
                    avatar={resolveImage(nftItem?.image || nftItem?.project?.logo)}
                    name={title}
                    variant="default"
                    size="small"
                  />
                  <div>
                    <Typography variant="p">{title}</Typography>
                    <span>{subtitle}</span>
                  </div>
                </ItemDataWrapper>
                <ItemPriceWrapper>
                  <p>{`ETH ${clarifyAmount(price)}`}</p>
                  <button onClick={() => handleRemove(String(nftItem?._id || ""))}>
                    <TrashIcon fill="#FF5858" />
                  </button>
                </ItemPriceWrapper>
              </ItemWrapper>
            );
          })
        ) : (
          <ItemWrapper variant="default">
            <ItemDataWrapper>
              <div>
                <Typography variant="p">Your cart is empty</Typography>
                <span>Add NFTs from market cards to see them here</span>
              </div>
            </ItemDataWrapper>
          </ItemWrapper>
        )}
      </ItemsWrapper>
      <ResultWrapper>
        <div>You Pay</div>
        <div>
          <p>{`ETH ${clarifyAmount(total)}`}</p>
          <span>{`$${clarifyAmount(total * 1800)}`}</span>
        </div>
      </ResultWrapper>
      <SubmitButton onClick={onClose}>
        {cartItems.length ? "Continue" : "Browse market"}
      </SubmitButton>
    </Modal>
  );
};

export default MyCartModal;

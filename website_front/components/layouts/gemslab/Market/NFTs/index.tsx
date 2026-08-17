import React, { useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  AuthContext,
  BalanceContext,
  CartContext,
  LoadingContext,
} from "../../../../global/Layout";
import NFTCard from "./NFTCard";
import { ArrowRightIcon } from "../../../../global/Icons";
import EmptyList from "../../../../global/EmptyList";
import { ICollectionNft } from "../../../../../types/global_types";
import toggleNft from "../../../../../http/cart/toggleNft";
import {
  NFTCardWrapper,
  NFTsCardsWrapper,
  NftsEmptyWrapper,
  Wrapper,
} from "./styles";
import { ShowAll } from "../styles";
import completeCollectionNftCheckout from "../../../../../helpers/completeCollectionNftCheckout";

interface Props {
  isCollectionPage?: boolean;
  collectionId?: string;
  nfts?: Array<any>;
  arrow?: boolean;
}

const isExpiredDate = (value?: string | Date | null): boolean => {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp <= Date.now();
};

const NFTs = ({ nfts, arrow, collectionId, isCollectionPage }: Props) => {
  const { userData } = useContext(AuthContext);
  const [currency, setCurrency] = useState<"ETH" | "USDC">("ETH");
  const { loadingStateHandler } = useContext(LoadingContext);
  const { refetchBalance } = useContext(BalanceContext);
  const router = useRouter();
  const { cart, refetch } = useContext(CartContext);
  const scrollRef = useRef(null);

  const resolveBackendListing = (
    nft: ICollectionNft,
    checkoutCurrency: "ETH" | "USDC"
  ) => {
    const listingOrderId = Math.trunc(Number(nft?.orderId || 0));
    const listingTokenAddress = String(
      nft?.tokenAddress || nft?.collection?.smart || ""
    ).trim();
    const listingPrice = Number(nft?.price || 0);
    const listingMatchesCurrency =
      checkoutCurrency === "USDC" ? !!nft?.isUsdc : !!nft?.isEth;

    if (
      nft?.isActive === false ||
      isExpiredDate(nft?.endDate) ||
      !listingMatchesCurrency ||
      listingOrderId <= 0 ||
      !listingTokenAddress
    ) {
      toast.error("NFT is no longer available");
      return null;
    }

    return {
      orderId: listingOrderId,
      tokenAddress: listingTokenAddress,
      price: listingPrice,
    };
  };

  const buyByEth = async (nft: ICollectionNft) => {
    if (
      String(nft?.owner?.wallet || "").toLowerCase() ===
      String(userData?.wallet || "").toLowerCase()
    ) {
      toast.error("You cannot buy your own NFT");
      return;
    }

    const resolvedListing = resolveBackendListing(nft, "ETH");
    if (!resolvedListing) return;

    const result = await completeCollectionNftCheckout(
      [
        {
          collectionNftId: String(nft._id || ""),
          orderId: resolvedListing.orderId,
          nftId: Number(nft.nftId || 0),
          tokenAddress: resolvedListing.tokenAddress,
          price: Number(resolvedListing.price || nft.price || 0),
          currency: "ETH",
        },
      ],
      "ETH"
    );

    if (result.backendSuccess) {
      await refetch();
      await refetchBalance?.();
      toast.success("NFT purchased successfully");
      return;
    }

    if (result.chainSuccess) {
      toast.error(
        "Purchase succeeded on-chain, but backend sync failed. Retry or refresh."
      );
      return;
    }

    toast.error("Blockchain purchase failed");
  };

  const buyByUsdc = async (nft: ICollectionNft) => {
    if (
      String(nft?.owner?.wallet || "").toLowerCase() ===
      String(userData?.wallet || "").toLowerCase()
    ) {
      toast.error("You cannot buy your own NFT");
      return;
    }

    const resolvedListing = resolveBackendListing(nft, "USDC");
    if (!resolvedListing) return;

    const result = await completeCollectionNftCheckout(
      [
        {
          collectionNftId: String(nft._id || ""),
          orderId: resolvedListing.orderId,
          nftId: Number(nft.nftId || 0),
          tokenAddress: resolvedListing.tokenAddress,
          price: Number(resolvedListing.price || nft.price || 0),
          currency: "USDC",
        },
      ],
      "USDC"
    );

    if (result.backendSuccess) {
      await refetch();
      await refetchBalance?.();
      toast.success("NFT purchased successfully");
      return;
    }

    if (result.chainSuccess) {
      toast.error(
        "Purchase succeeded on-chain, but backend sync failed. Retry or refresh."
      );
      return;
    }

    toast.error("Blockchain purchase failed");
  };

  const confirmBuyNft = async (nft: ICollectionNft) => {
    loadingStateHandler(true);

    if (currency === "ETH") {
      await buyByEth(nft);
    } else {
      await buyByUsdc(nft);
    }

    loadingStateHandler(false);
  };

  const toggleNftInCart = useCallback(async (nft: ICollectionNft): Promise<void> => {
    const isInCart =
      Array.isArray(cart) &&
      !!cart.find((cartItem: any) => cartItem?.nftId?._id === nft?._id);

    if (!isInCart) {
      const resolvedListing = resolveBackendListing(nft, currency);
      if (!resolvedListing) {
        return;
      }
    }

    const { isSuccess } = await toggleNft(String(nft?._id || ""), "POST");

    if (isSuccess) {
      refetch();
    }
  }, [cart, currency, refetch, userData?.wallet]);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      // @ts-ignore
      scrollRef.current.scrollLeft += 290;
    }
  };

  return (
    <Wrapper arrow={arrow}>
      <NFTsCardsWrapper ref={scrollRef} id="scroll">
        {nfts?.length ? (
          nfts.map((item: ICollectionNft) => {
            return (
              <NFTCardWrapper key={item._id}>
                <NFTCard
                  isAuth={userData?.isFullAuth}
                  buyNft={confirmBuyNft}
                  inCart={
                    Array.isArray(cart) &&
                    !!cart?.find(
                      (cartItem: any) => cartItem?.nftId?._id === item._id
                    )
                  }
                  toggleCart={toggleNftInCart}
                  nftData={item}
                />
              </NFTCardWrapper>
            );
          })
        ) : (
          <NftsEmptyWrapper />
        )}
        {/* <NFTCardWrapper>
          <NFTCard />
        </NFTCardWrapper>
        <NFTCardWrapper>
          <NFTCard />
        </NFTCardWrapper>
        <NFTCardWrapper>
          <NFTCard />
        </NFTCardWrapper>
        <NFTCardWrapper>
          <NFTCard />
        </NFTCardWrapper> */}
        {/* {arrow && (
          <>
            <NFTCardWrapper>
              <NFTCard />
            </NFTCardWrapper>
            <NFTCardWrapper>
              <NFTCard />
            </NFTCardWrapper>
            <NFTCardWrapper>
              <NFTCard />
            </NFTCardWrapper>
            <NFTCardWrapper>
              <NFTCard />
            </NFTCardWrapper>
          </>
        )} */}
      </NFTsCardsWrapper>
      {nfts?.length && isCollectionPage ? (
        <ShowAll
          onClick={() =>
            router.push(`/utility/market/collection/${collectionId}`)
          }
        >
          Show all {`>`}
        </ShowAll>
      ) : (
        <></>
      )}
      {/* {arrow && nfts?.length ? (
        <ArrowRightIcon
          className="arrow"
          fill="#738094"
          onClick={handleScrollRight}
        />
      )
      :
      <></>
    } */}
    </Wrapper>
  );
};

export default NFTs;

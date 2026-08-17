import React, { FC, useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import nft from "../../../../../../public/static/nft_card.png";
import Button from "../../../../../global/common/Button";
import { authState } from "../../../../../../store/slices/authSlice";
import ConnectWalletModal from "../../../../../global/modals/ConnectWalletModal";
import { ICollectionNft } from "../../../../../../types/global_types";
import SecondaryButton from "../../../../../global/common/SecondaryButton";
import {
  DescriptionWrapper,
  ImageTagWrapper,
  ImageWrapper,
  NumberTag,
  PriceWrapper,
  Tag,
  TagCircle,
  Title,
  Wrapper,
} from "./styles";
import { CurrencyContext } from "../../NFTsMarket";

interface IProps {
  isAuth?: boolean;
  buyNft?: (nft: ICollectionNft) => Promise<void>;
  inCart: boolean;
  nftData: ICollectionNft;
  toggleCart: (nft: ICollectionNft) => Promise<void>;
}

const NFTCard: FC<IProps> = ({
  nftData,
  toggleCart,
  inCart,
  buyNft,
  isAuth,
}) => {
  const { currency } = useContext(CurrencyContext);
  const number: string = nftData.name.split("#")[1];

  return (
    <Wrapper variant="default">
      <Link href={`/utility/market/${nftData._id}?currency=${currency}`}>
        <ImageWrapper>
          <ImageTagWrapper>
            <TagCircle />
            <Tag>RARE</Tag>
          </ImageTagWrapper>
          <img src={nftData.image} alt="SharkRace Club" />
          <NumberTag>#{number}</NumberTag>
        </ImageWrapper>
        <DescriptionWrapper>
          <Title variant="p">{nftData.name}</Title>
          <PriceWrapper>
            <span>
              Price: {String(nftData.price)?.length > 7 ? <br /> : <></>}{" "}
              <b>${nftData.price}</b>
            </span>
            <span>
              Floor price: <b>$0</b>
            </span>
            <span>
              Your share: <b>0%</b>
            </span>
          </PriceWrapper>
        </DescriptionWrapper>
      </Link>
      <div className="buttons">
        <Button
          disabled={!isAuth}
          onClick={() => buyNft && buyNft(nftData)}
          variant="primary"
        >
          Buy now
        </Button>
        <SecondaryButton
          disabled={!isAuth}
          onClick={() => toggleCart(nftData)}
          variant="secondary"
          className="secondary"
        >
          {inCart ? "Remove" : "To cart"}
        </SecondaryButton>
      </div>
    </Wrapper>
  );
};

export default NFTCard;

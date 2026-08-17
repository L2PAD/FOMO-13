import React, { FC } from "react";
import FavButton from "../../../global/common/FavButton";
import imageLoader from "../../../../helpers/imageLoader";
import OpenEyeIcon from "../../../../assets/images/watchlist-eye.png";
import UserAvatar, {
  UserAvatarInterface,
} from "../../../global/common/UserAvatar/index";
import {
  EpicLabel,
  FavButtonWrapper,
  IdWrapper,
  InfoBottom,
  InfoHeader,
  InfoWrapper,
  PriceInfo,
  ViewsWrapper,
  Wrapper,
} from "./styles";
import Image from "next/image";

interface IProps {
  nft: any;
}

const NftItem: FC<IProps> = ({ nft }) => {
  return (
    <Wrapper>
      <img className="nft-logo" src={imageLoader(nft.logo)} alt={nft.name} />
      <FavButtonWrapper>
        <FavButton isFavorite={nft.isFavorite} />
      </FavButtonWrapper>
      <EpicLabel className={nft.type}>{nft.type}</EpicLabel>
      <IdWrapper>#{nft.id}</IdWrapper>
      <InfoWrapper>
        <InfoHeader>
          <div className="project">
            <UserAvatar
              variant="default"
              avatar={imageLoader(String(nft.projectLogo))}
              name={nft.name}
              size="otc"
            />
            <div className="info">
              <div>{nft.name}</div>
              <span>{nft.niche}</span>
            </div>
          </div>
          <ViewsWrapper>
            <Image src={OpenEyeIcon} alt="eye icon" />
            {nft.views}
          </ViewsWrapper>
        </InfoHeader>
        <InfoBottom>
          <PriceInfo>
            <div>ETH ${nft.ethPrice}</div>
            <span>${nft.usdPrice}</span>
          </PriceInfo>
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="16"
              viewBox="0 0 18 16"
              fill="none"
            >
              <path
                d="M10.3333 1L17 8M17 8L10.3333 15M17 8L1 8"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </InfoBottom>
      </InfoWrapper>
    </Wrapper>
  );
};

export default NftItem;

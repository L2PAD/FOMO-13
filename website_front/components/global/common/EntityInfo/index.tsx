import React, { FC } from "react";
import UserAvatar, { AvatartSize, AvatarVariants } from "../UserAvatar";
import { Wrapper } from "./styles";
import imageLoader from "../../../../helpers/imageLoader";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { type ImageFallbackType } from "../../../../helpers/imageFallbacks";

interface IProps {
  img: string;
  name: string;
  username?: string;
  niche?: string;
  variant: AvatarVariants;
  size?: AvatartSize;
  rating?: number;
  isSponsored?: boolean;
  className?: string;
  followers?: number;
  following?: number;
  isFollowersInfo?: boolean;
  type?: "default" | "date";
  fallbackType?: ImageFallbackType;
}

const EntityInfo: FC<IProps> = ({
  img,
  name,
  username,
  niche,
  variant,
  rating,
  isSponsored,
  type = "default",
  size = "otc",
  followers,
  following,
  isFollowersInfo,
  fallbackType,
}) => {
  return (
    <Wrapper>
      <UserAvatar
        rating={rating || 0}
        avatar={imageLoader(img)}
        name={name}
        variant={variant}
        size={size}
        isSponsored={isSponsored}
        fallbackType={fallbackType}
      />
      <div className="info">
        <div className="name">{name}</div>
        {niche ? (
          <div className="description">{niche}</div>
        ) : (
          <div className="username">@{username}</div>
        )}
        {isFollowersInfo ? (
          <div className="followers-info">
            <div className="followers-info-item">
              <span>{clarifyAmount(following)}</span>
              <div>Following</div>
            </div>
            <div className="followers-info-item">
              <span>{clarifyAmount(followers)}</span>
              <div>Followers</div>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </Wrapper>
  );
};

export default EntityInfo;

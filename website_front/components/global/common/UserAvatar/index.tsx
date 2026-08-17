import React, { FC, useEffect, useState } from "react";
import {
  AnimatedWrapper,
  Avatar,
  AvatarWrapper,
  RatingWrapper,
  RightIconWrapper,
} from "./styles";
import SponsoredIcon from "../../Icons/SponsoredIcon";
import {
  getImageFallback,
  getProjectImage,
  type ImageFallbackType,
} from "../../../../helpers/imageFallbacks";

export type AvatarVariants =
  | "default"
  | "warn"
  | "success"
  | "error"
  | "none"
  | "spotlight";

export type AvatartSize =
  | "xxSmall"
  | "xSmall"
  | "small"
  | "medium"
  | "big"
  | "giant"
  | "project"
  | "otc"
  | "project-page";

export interface UserAvatarInterface {
  size: AvatartSize;
  variant: AvatarVariants;
  rating?: number;
  avatar: string | undefined;
  name?: string;
  className?: string;
  isSponsored?: boolean;
  customBorderColor?: string;
  isVerified?: boolean;
  fallbackType?: ImageFallbackType;
}

const UserAvatar: FC<UserAvatarInterface> = ({
  size,
  variant,
  rating,
  avatar,
  name,
  className,
  isSponsored = false,
  customBorderColor,
  fallbackType,
}) => {
  const resolvedFallbackType =
    fallbackType || (size === "project" || size === "project-page" ? "project" : "user");
  const isProjectAvatar = resolvedFallbackType === "project";
  const fallbackSrc = isProjectAvatar
    ? getProjectImage(undefined, name || avatar)
    : getImageFallback(resolvedFallbackType);
  const resolvedAvatar = isProjectAvatar
    ? getProjectImage(avatar, name)
    : avatar || fallbackSrc;
  const [imgSrc, setImgSrc] = useState(resolvedAvatar);
  const [showRating, setShowRating] = useState(true);

  useEffect(() => {
    setImgSrc(resolvedAvatar);
  }, [resolvedAvatar]);

  useEffect(() => {
    if (isSponsored) {
      const interval = setInterval(() => {
        setShowRating((prev) => !prev);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isSponsored]);

  return (
    <AvatarWrapper className={`${className} ${size} `} size={size}>
      <Avatar
        loading="lazy"
        src={imgSrc}
        alt={name}
        size={size}
        variant={isSponsored ? (showRating ? variant : "spotlight") : variant}
        onError={() => setImgSrc(fallbackSrc)}
      />
      {isSponsored ? (
        <AnimatedWrapper isVisible={showRating}>
          <RatingWrapper
            className="rating-wrapper"
            size={size}
            variant={variant}
          >
            {rating || 0}
          </RatingWrapper>
          <RightIconWrapper className={`sponsored-icon-wrapper ${size}`}>
            <SponsoredIcon />
          </RightIconWrapper>
        </AnimatedWrapper>
      ) : typeof rating === "number" && variant !== "default" ? (
        <RatingWrapper size={size} variant={variant}>
          {rating}
        </RatingWrapper>
      ) : null}
    </AvatarWrapper>
  );
};

export default UserAvatar;

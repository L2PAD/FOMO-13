import React from "react";
import styled from "styled-components";
import {
  getUserLogo,
  setUserLogoFallback,
} from "../../../../helpers/imageFallbacks";

const FollowersWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const AvatarsStack = styled.div`
  display: flex;
  margin-right: 8px;
`;

const Avatar = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -8px;
  object-fit: cover;

  &:first-child {
    margin-left: 0;
  }
`;

const CountBadge = styled.div<{ type: "followers" | "following" }>`
  background: #e9f8f8;
  color: #04a584;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  padding: 2px 4px;
  border-radius: 20px;
  white-space: nowrap;
  z-index: 100;
`;

interface FollowersDisplayProps {
  followers: Array<{ avatar?: string; logo?: string; name: string }>;
  type: "followers" | "following";
  onClick: () => void;
}

const formatCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}m`;
};

const FollowersDisplay: React.FC<FollowersDisplayProps> = ({
  followers,
  type,
  onClick,
}) => {
  // Show max 3 avatars
  const displayAvatars = followers
    .slice(0, 3)
    .map((f) => f.avatar || f.logo);
  const count = formatCount(followers.length);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <FollowersWrapper onClick={handleClick}>
      <AvatarsStack>
        {displayAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            src={getUserLogo(avatar)}
            alt=""
            style={{ zIndex: 3 + index, marginLeft: index === 0 ? 0 : -10 }}
            onError={setUserLogoFallback}
          />
        ))}
      </AvatarsStack>
      <CountBadge
        style={{
          marginLeft: -18,
        }}
        type={type}
      >
        +{count}
      </CountBadge>
    </FollowersWrapper>
  );
};

export default FollowersDisplay;

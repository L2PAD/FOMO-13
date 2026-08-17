import React, { FC } from "react";
import Link from "next/link";
import { useQuery } from "react-query";
import {
  Asset,
  Assets,
  EmptyState,
  Header,
  PriceInfo,
  ProjectData,
  SkeletonCards,
  Wrapper,
} from "./styles";
import UserAvatar from "../../../../global/common/UserAvatar";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import Placeholder from "../../../../global/common/Placeholder";
import fetchUserFollowing, {
  IUserFollowingItem,
} from "../../../../../http/user/fetchUserFollowing";

interface IProps {
  personData: any;
}

const UserFollow: FC<IProps> = ({ personData }) => {
  const {
    data: followingData,
    isLoading,
    isError,
  } = useQuery(
    ["fomie-following", personData?._id],
    () => fetchUserFollowing(personData?._id || "", { limit: 12 }),
    {
      enabled: !!personData?._id,
      refetchOnWindowFocus: false,
    }
  );

  const items = followingData?.items || [];
  const titleName =
    personData?.twitterData?.name || personData?.name || personData?.username || "";

  const renderSkeleton = () => (
    <SkeletonCards>
      {[0, 1, 2].map((item) => (
        <Asset variant="main" key={item}>
          <Header>
            <ProjectData>
              <Placeholder
                width="52px"
                height="52px"
                borderRadius="999px"
                marginBottom="0"
              />
              <div className="info" style={{ width: "160px" }}>
                <Placeholder
                  width="70%"
                  height="16px"
                  borderRadius="8px"
                  marginBottom="8px"
                />
                <Placeholder
                  width="52%"
                  height="14px"
                  borderRadius="8px"
                  marginBottom="0"
                />
              </div>
            </ProjectData>
            <Placeholder
              width="36px"
              height="36px"
              borderRadius="10px"
              marginBottom="0"
            />
          </Header>
          <PriceInfo>
            <div className="info">
              <Placeholder
                width="64px"
                height="12px"
                borderRadius="8px"
                marginBottom="6px"
              />
              <Placeholder
                width="72px"
                height="16px"
                borderRadius="8px"
                marginBottom="0"
              />
            </div>
            <div className="info">
              <Placeholder
                width="48px"
                height="12px"
                borderRadius="8px"
                marginBottom="6px"
              />
              <Placeholder
                width="96px"
                height="16px"
                borderRadius="8px"
                marginBottom="0"
              />
            </div>
          </PriceInfo>
        </Asset>
      ))}
    </SkeletonCards>
  );

  const renderItem = (item: IUserFollowingItem) => {
    const displayName = item.twitterName || item.name || "Unnamed user";
    const displayHandle = item.twitterUsername
      ? `@${item.twitterUsername}`
      : item.username
        ? `@${item.username}`
        : "No handle";
    const avatar = item.avatar || item.photo || item.twitterData?.photo || "";
    const rankLabel = item.rank || "Fomie";

    return (
      <Asset variant="main" key={item._id}>
        <Header>
          <ProjectData>
            <UserAvatar
              avatar={avatar}
              size="otc"
              variant={item.verificationStatus ? "success" : "default"}
              rating={item.rating}
              name={displayName}
            />
            <div className="info">
              <div>{displayName}</div>
              <span>{displayHandle}</span>
            </div>
          </ProjectData>
          <Link href={item.profileLink}>
            <button aria-label={`Open ${displayName} profile`}>
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </Link>
        </Header>
        <PriceInfo>
          <div className="info">
            <div className="key">Followers</div>
            <div style={{ fontWeight: "var(--font-weight-regular)" }} className="value">
              {clarifyAmount(item.followersCount || 0)}
            </div>
          </div>
          <div className="info">
            <div className="key">Rank</div>
            <div className="value">{rankLabel}</div>
          </div>
        </PriceInfo>
      </Asset>
    );
  };

  return (
    <Wrapper>
      <h2>Fomies {titleName} Follow</h2>
      {isLoading ? renderSkeleton() : null}
      {!isLoading && isError ? (
        <EmptyState variant="main">
          <h3>Unable to load followings</h3>
          <p>Please try again a bit later.</p>
        </EmptyState>
      ) : null}
      {!isLoading && !isError && !items.length ? (
        <EmptyState variant="main">
          <h3>No followings yet</h3>
          <p>This user isn't following anyone yet.</p>
        </EmptyState>
      ) : null}
      {!isLoading && !isError && !!items.length ? (
        <Assets>{items.map(renderItem)}</Assets>
      ) : null}
    </Wrapper>
  );
};

export default UserFollow;

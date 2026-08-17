import React from "react";
import styled from "styled-components";
import { Button } from "../../../../global/common/Button";
import ScoreProgress from "../../../../global/common/ScoreBar";
import RatingInfoTooltip from "../../../../global/common/RatingInfoTooltip";

const CardWrapper = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  position: relative;

  @media (max-width: 768px) {
    margin-bottom: 0;
    flex-direction: column;
    gap: 12px;
  }
`;

const EntityInfo = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
`;

const AvatarWrapper = styled.div`
  position: relative;
`;

const Avatar = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #05a584;

  &.entity-avatar {
    width: 41px;
    height: 41px;
    border: 0;
  }
`;

const ScoreBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #05a584;
  color: #fff;
  font-size: 12px;
  font-weight: 550;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 24px;
  text-align: center;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 4px;
  }
`;

const EntityNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const EntityName = styled.h2`
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const Username = styled.div`
  font-size: 18px;
  color: #738094;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const EntityType = styled.span`
  font-size: 12px;
  font-weight: 550;
  color: #05a584;
  background: #e9f8f8;
  padding: 4px 8px;
  border-radius: 6px;
  width: max-content;
`;

const Description = styled.p`
  font-size: 14px;
  color: #070b35;
  margin: 0;
  line-height: 1.6;
  max-width: 485px;
  margin-bottom: 20px;
  white-space: pre-line;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const SeeMoreLink = styled.span`
  color: #05a584;
  cursor: pointer;
  font-weight: var(--font-weight-medium);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;

  button {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    border-radius: 6px;
    padding: 6px 12px;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
    margin-bottom: 10px;

    & > div {
      width: fit-content !important;
    }
  }
`;

const SnapshotInfo = styled.div`
  font-size: 14px;
  color: #738094;
  text-align: right;
  margin-bottom: 20px;
`;

const StatsGrid = styled.div<{ network?: string }>`
  display: grid;
  grid-template-columns: ${({ network }) =>
    network === "threads" || network === "linkedin"
      ? "repeat(3, 1fr)"
      : "repeat(4, 1fr)"};
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ isXScore?: boolean }>`
  background: #e9f8f8;
  border-radius: 16px;
  padding: 10px 10px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CompareStats = styled.div`
  padding: 20px;
  background: #f5fbfd;
  margin-top: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CompareStatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  &:last-child {
    border-bottom: none;
  }
`;

const CompareStatLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .label {
    font-size: 14px;
    color: #000;
    opacity: 1;
  }

  .sub-label {
    font-size: 12px;
    color: #738094;
  }
`;

const CompareStatValue = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;

  .value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #070b35;
  }

  .sub-value {
    font-size: 12px;
    color: #05a584;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const CompareStatBadge = styled.span<{ level?: "high" | "medium" | "low" }>`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #e9f8f8;
  color: #05a584;

  ${({ level }) => {
    console.log("CompareStatBadge level:", level);

    switch (level) {
      case "high":
        return `
          color: #05A584;
        `;
      case "medium":
        return `
          color: #FFC704;
          background: #FEFCF3;
        `;
      case "low":
        return `
          color: #ff5858;
        `;
    }
  }}
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #738094;
  font-weight: var(--font-weight-regular);
`;

const StatValue = styled.span`
  font-size: 24px;
  font-weight: 550;
  color: #070b35;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const StatSubValue = styled.span`
  font-size: 12px;
  color: #05a584;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActivityBadge = styled.span<{ level: "high" | "medium" | "low" }>`
  font-size: 14px;
  font-weight: 550;
  padding: 6px 12px;
  border-radius: 6px;
  width: max-content;
  ${({ level }) => {
    switch (level) {
      case "high":
        return `
          color: #05A584;
          border: 1px solid #05A584;
        `;
      case "medium":
        return `
          color: #d4a600;
          border: 1px solid #ffc107;
          background: #fff;
        `;
      case "low":
        return `
          color: #ff5858;
          border: 1px solid #ff5858;
        `;
    }
  }}
`;

const XScoreDescription = styled.p`
  font-size: 10px;
  color: #05a584;
  margin: 0;
  line-height: 1.2;
  margin-top: 4px;
`;

interface EntityHeaderProps {
  name: string;
  username?: string;
  type?: string | string[];
  avatar: string;
  score?: number;
  verified?: boolean;
  description?: string;
  snapshotUpdated?: string;
  // Telegram/Default stats
  subscribers?: string;
  subscribersChange?: string;
  viewsPost?: string;
  viewRate?: string;
  messagesDay?: string;
  messagesSub?: string;
  activity?: "high" | "medium" | "low";
  activitySub?: string;
  // X-specific stats
  followers?: string;
  followersChange?: string;
  following?: string;
  followingLabel?: string;
  engagementRate?: string;
  engagementLabel?: string;
  xScore?: number;
  xScoreChange?: number;
  xScoreDescription?: string;
  // Discord-specific stats
  members?: string;
  membersChange?: string;
  activeMembers?: string;
  activeMembersLabel?: string;
  engagementLevel?: "high" | "medium" | "low";
  engagementLevelLabel?: string;
  // Instagram-specific stats
  posts?: string;
  postsSub?: string;
  engagementSub?: string;
  instagramScore?: number;
  instagramFollowers?: string;
  instagramFollowersChange?: string;
  instagramFollowing?: string;
  instagramPosts?: string;
  instagramEngagementRate?: string;
  // TikTok-specific stats
  videos?: string;
  videosSub?: string;
  avgViewsVideo?: string;
  tiktokScore?: number;
  // Threads-specific stats
  threadsScore?: number;
  // LinkedIn-specific stats
  companySize?: string;
  hiringActivity?: string;
  linkedinConnections?: string;
  linkedinFollowers?: string;
  linkedinFollowersChange?: string;
  linkedinActivity?: "high" | "medium" | "low";
  // Button customization
  viewButtonLabel?: string;
  viewOnFomoButton?: boolean;
  onView?: () => void;
  onCompare?: () => void;
  forCompare?: boolean;
  // Network identifier
  network?:
    | "telegram"
    | "x"
    | "discord"
    | "instagram"
    | "linkedin"
    | "tiktok"
    | "threads";
  isPrivate?: boolean;
}

const EntityHeader: React.FC<EntityHeaderProps> = ({
  name,
  username,
  type,
  avatar,
  score = 94,
  verified = false,
  description,
  snapshotUpdated,
  // Telegram/Default stats
  subscribers,
  subscribersChange,
  viewsPost,
  viewRate,
  messagesDay,
  messagesSub,
  activity,
  activitySub,
  // X-specific stats
  followers,
  followersChange,
  following,
  followingLabel,
  engagementRate,
  engagementLabel,
  xScore,
  xScoreChange,
  xScoreDescription,
  // Discord-specific stats
  members,
  membersChange,
  activeMembers,
  activeMembersLabel,
  engagementLevel,
  engagementLevelLabel,
  // Instagram-specific stats
  posts,
  postsSub,
  engagementSub,
  instagramScore,
  instagramFollowers,
  instagramFollowersChange,
  instagramFollowing,
  instagramPosts,
  instagramEngagementRate,
  // TikTok-specific stats
  videos,
  videosSub,
  avgViewsVideo,
  tiktokScore,
  // Threads-specific stats
  threadsScore,
  // LinkedIn-specific stats
  companySize,
  hiringActivity,
  linkedinConnections,
  linkedinFollowers,
  linkedinFollowersChange,
  linkedinActivity,
  // Button customization
  viewButtonLabel = "View on Telegram",
  viewOnFomoButton = false,
  onView,
  onCompare,
  forCompare = false,
  // Network identifier
  network = "telegram",
  isPrivate,
}) => {
  const isXNetwork = network === "x";
  const isDiscordNetwork = network === "discord";
  const isInstagramNetwork = network === "instagram";
  const isTikTokNetwork = network === "tiktok";
  const isThreadsNetwork = network === "threads";
  const isLinkedInNetwork = network === "linkedin";

  if (forCompare) {
    return (
      <CardWrapper style={{ background: "transparent", padding: 0 }}>
        <TopRow
          style={{
            ...(isPrivate && { marginBottom: 0 }),
          }}
        >
          <EntityInfo
            style={{
              gap: 8,
            }}
          >
            <AvatarWrapper>
              <Avatar className={"entity-avatar"} src={avatar} alt={name} />
            </AvatarWrapper>
            <Details
              style={{
                gap: 4,
              }}
            >
              <EntityNameRow>
                <EntityName style={{ fontSize: "16px" }}>{name}</EntityName>
              </EntityNameRow>
              {username && (
                <Username
                  style={{
                    fontSize: "14px",
                  }}
                >
                  {username}
                </Username>
              )}
            </Details>
          </EntityInfo>
        </TopRow>
        {!isPrivate ? (
          <>
            <EntityName style={{ fontSize: "16px" }}>Basics</EntityName>
            <CompareStats>
              {isDiscordNetwork ? (
                <>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Members</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{members}</span>
                      <span className="sub-value">
                        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                          <path
                            d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                            fill="#05A584"
                          />
                        </svg>
                        {membersChange}
                      </span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Active members</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{activeMembers}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Engagement level</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <CompareStatBadge
                        level={
                          engagementLevel?.toLowerCase() as
                            | "high"
                            | "medium"
                            | "low"
                        }
                      >
                        {engagementLevel === "high"
                          ? "High"
                          : engagementLevel === "medium"
                            ? "Medium"
                            : "Low"}
                      </CompareStatBadge>
                    </CompareStatValue>
                  </CompareStatRow>
                </>
              ) : network === "telegram" ? (
                <>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Members</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{subscribers}</span>
                      <span className="sub-value">
                        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                          <path
                            d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                            fill="#05A584"
                          />
                        </svg>
                        {subscribersChange}
                      </span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Views/Post</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{viewsPost}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Messages/Day</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{messagesDay}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Activity</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <CompareStatBadge
                        level={
                          activity?.toLowerCase() as "high" | "medium" | "low"
                        }
                      >
                        {activity === "high"
                          ? "High"
                          : activity === "medium"
                            ? "Medium"
                            : "Low"}
                      </CompareStatBadge>
                    </CompareStatValue>
                  </CompareStatRow>
                </>
              ) : network === "instagram" ? (
                <>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Followers</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{instagramFollowers}</span>
                      <span className="sub-value">
                        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                          <path
                            d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                            fill="#05A584"
                          />
                        </svg>
                        {instagramFollowersChange}
                      </span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Following</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{instagramFollowing}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Posts</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{instagramPosts}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Engagement rate</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{instagramEngagementRate}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                </>
              ) : network === "linkedin" ? (
                <>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Connections</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{linkedinConnections}</span>
                      <span className="sub-value">1st-degree network</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Followers</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{linkedinFollowers}</span>
                      <span className="sub-value">
                        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                          <path
                            d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                            fill="#05A584"
                          />
                        </svg>
                        {linkedinFollowersChange}
                      </span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Activity</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <CompareStatBadge
                        level={
                          linkedinActivity?.toLowerCase() as
                            | "high"
                            | "medium"
                            | "low"
                        }
                      >
                        {linkedinActivity === "high"
                          ? "High"
                          : linkedinActivity === "medium"
                            ? "Medium"
                            : "Low"}
                      </CompareStatBadge>
                    </CompareStatValue>
                  </CompareStatRow>
                </>
              ) : network === "tiktok" ? (
                <>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Followers</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{followers}</span>
                      <span className="sub-value">
                        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                          <path
                            d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                            fill="#05A584"
                          />
                        </svg>
                        {followersChange}
                      </span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Engagement rate</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{engagementRate}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Avg. views/video</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{avgViewsVideo}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Activity</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <CompareStatBadge
                        level={
                          activity?.toLowerCase() as "high" | "medium" | "low"
                        }
                      >
                        {activity === "high"
                          ? "High"
                          : activity === "medium"
                            ? "Medium"
                            : "Low"}
                      </CompareStatBadge>
                    </CompareStatValue>
                  </CompareStatRow>
                </>
              ) : network === "threads" ? (
                <>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Followers</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{followers}</span>
                      <span className="sub-value">
                        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                          <path
                            d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                            fill="#05A584"
                          />
                        </svg>
                        {followersChange}
                      </span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Following</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{following}</span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Engagement rate</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{engagementRate}</span>
                      <span className="sub-value">Neutral benchmark</span>
                    </CompareStatValue>
                  </CompareStatRow>
                </>
              ) : (
                <>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Followers</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{followers}</span>
                      <span className="sub-value">
                        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                          <path
                            d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                            fill="#05A584"
                          />
                        </svg>
                        {followersChange}
                      </span>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">Engagement rate</span>
                      <span className="sub-label">vs similar accounts</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{engagementRate}</span>
                      <CompareStatBadge
                        level={
                          engagementLevel?.toLowerCase() as
                            | "high"
                            | "medium"
                            | "low"
                        }
                      >
                        {engagementLabel}
                      </CompareStatBadge>
                    </CompareStatValue>
                  </CompareStatRow>
                  <CompareStatRow>
                    <CompareStatLabel>
                      <span className="label">X Score</span>
                      <span className="sub-label">posting & quality</span>
                    </CompareStatLabel>
                    <CompareStatValue>
                      <span className="value">{xScore}</span>
                      <CompareStatBadge>Consistent</CompareStatBadge>
                    </CompareStatValue>
                  </CompareStatRow>
                </>
              )}
            </CompareStats>
          </>
        ) : null}
      </CardWrapper>
    );
  }

  return (
    <CardWrapper>
      <TopRow>
        <EntityInfo>
          <AvatarWrapper>
            <Avatar src={avatar} alt={name} />
            {!isXNetwork &&
              !isInstagramNetwork &&
              !isTikTokNetwork &&
              !isThreadsNetwork &&
              !isLinkedInNetwork && <ScoreBadge>{score}</ScoreBadge>}
            {isInstagramNetwork && (
              <ScoreBadge>{instagramScore || score}</ScoreBadge>
            )}
            {isTikTokNetwork && <ScoreBadge>{tiktokScore || score}</ScoreBadge>}
            {isThreadsNetwork && (
              <ScoreBadge>{threadsScore || score}</ScoreBadge>
            )}
          </AvatarWrapper>
          <Details>
            <EntityNameRow>
              <EntityName>{name}</EntityName>
              <RatingInfoTooltip />
              {verified && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.1939 2.51042C14.6108 2.26536 15.1395 2.43682 15.3497 2.88523L16.3062 4.92658C16.4307 5.19224 16.6764 5.37348 16.958 5.40743L19.1223 5.66826C19.5977 5.72556 19.9288 6.18837 19.846 6.67994L19.4694 8.91777C19.4203 9.20901 19.5169 9.50623 19.7257 9.70635L21.3296 11.244C21.6819 11.5818 21.6889 12.1592 21.3449 12.5061L19.7789 14.0857C19.5751 14.2912 19.4857 14.5909 19.5418 14.8808L19.9727 17.1079C20.0674 17.5972 19.7476 18.0686 19.2737 18.1384L17.1165 18.4563C16.8358 18.4977 16.5946 18.6854 16.4766 18.9542L15.5699 21.0202C15.3708 21.474 14.8464 21.6594 14.4236 21.4254L12.4992 20.3603C12.2488 20.2217 11.9479 20.2256 11.7009 20.3708L9.80295 21.4865C9.38605 21.7315 8.85733 21.56 8.64721 21.1116L7.69066 19.0703C7.56618 18.8046 7.3205 18.6234 7.03883 18.5894L4.87459 18.3286C4.39918 18.2713 4.06808 17.8085 4.15082 17.3169L4.52751 15.0791C4.57653 14.7879 4.47992 14.4906 4.27119 14.2905L2.66729 12.7529C2.31497 12.4151 2.30796 11.8377 2.65196 11.4907L4.218 9.91119C4.42181 9.70563 4.51117 9.40595 4.45509 9.1161L4.02417 6.88894C3.92952 6.39971 4.24927 5.9283 4.72313 5.85846L6.88035 5.54054C7.1611 5.49917 7.4023 5.3115 7.52029 5.04263L8.42695 2.97667C8.62611 2.52286 9.1505 2.33748 9.57322 2.57145L11.4976 3.63659C11.7481 3.77521 12.049 3.77124 12.296 3.62604L14.1939 2.51042Z"
                    fill="#2082EA"
                  />
                  <path
                    d="M15 10L10.5253 14L9 12.6365"
                    stroke="white"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              )}
            </EntityNameRow>
            {username && <Username>{username}</Username>}
            {!isXNetwork && type && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 4,
                }}
              >
                {Array.isArray(type) && type.length > 0 ? (
                  type.map((t, index) => (
                    <EntityType key={index}>{t}</EntityType>
                  ))
                ) : (
                  <EntityType>{type}</EntityType>
                )}
              </div>
            )}
          </Details>
        </EntityInfo>
        <ActionButtons>
          <Button variant="primary" onClick={onView}>
            {viewButtonLabel}
          </Button>
          {viewOnFomoButton && (
            <Button variant="primary" onClick={() => {}}>
              View on FOMO
            </Button>
          )}
          <div
            style={{
              width: isXNetwork ? "100%" : "auto",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button variant="primary" onClick={onCompare}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.8 6.3C3.52386 6.3 3.3 6.52386 3.3 6.8C3.3 7.07614 3.52386 7.3 3.8 7.3V6.8V6.3ZM6.5 6.8L6.85355 7.15355C7.04882 6.95829 7.04882 6.64171 6.85355 6.44645L6.5 6.8ZM4.94645 7.64645C4.75118 7.84171 4.75118 8.15829 4.94645 8.35355C5.14171 8.54882 5.45829 8.54882 5.65355 8.35355L5.3 8L4.94645 7.64645ZM5.65355 5.24645C5.45829 5.05118 5.14171 5.05118 4.94645 5.24645C4.75118 5.44171 4.75118 5.75829 4.94645 5.95355L5.3 5.6L5.65355 5.24645ZM11.9 9.7C12.1761 9.7 12.4 9.47614 12.4 9.2C12.4 8.92386 12.1761 8.7 11.9 8.7V9.2V9.7ZM9.2 9.2L8.84645 8.84645C8.75268 8.94021 8.7 9.06739 8.7 9.2C8.7 9.33261 8.75268 9.45978 8.84645 9.55355L9.2 9.2ZM10.7536 8.35355C10.9488 8.15829 10.9488 7.84171 10.7536 7.64645C10.5583 7.45118 10.2417 7.45118 10.0464 7.64645L10.4 8L10.7536 8.35355ZM10.0464 10.7536C10.2417 10.9488 10.5583 10.9488 10.7536 10.7536C10.9488 10.5583 10.9488 10.2417 10.7536 10.0464L10.4 10.4L10.0464 10.7536ZM3.2 2V2.5H7.4V2V1.5H3.2V2ZM7.7 11.6V11.1H3.2V11.6V12.1H7.7V11.6ZM2 10.4H2.5V3.2H2H1.5V10.4H2ZM8.6 3.2H8.1V4.33333H8.6H9.1V3.2H8.6ZM3.2 11.6V11.1C2.8134 11.1 2.5 10.7866 2.5 10.4H2H1.5C1.5 11.3389 2.26112 12.1 3.2 12.1V11.6ZM7.4 2V2.5C7.7866 2.5 8.1 2.8134 8.1 3.2H8.6H9.1C9.1 2.26112 8.33888 1.5 7.4 1.5V2ZM3.2 2V1.5C2.26112 1.5 1.5 2.26112 1.5 3.2H2H2.5C2.5 2.8134 2.8134 2.5 3.2 2.5V2ZM8.6 4.4V4.9H12.8V4.4V3.9H8.6V4.4ZM14 5.6H13.5V12.8H14H14.5V5.6H14ZM12.8 14V13.5H8.6V14V14.5H12.8V14ZM7.4 12.8H7.9V5.6H7.4H6.9V12.8H7.4ZM8.6 14V13.5C8.2134 13.5 7.9 13.1866 7.9 12.8H7.4H6.9C6.9 13.7389 7.66112 14.5 8.6 14.5V14ZM14 12.8H13.5C13.5 13.1866 13.1866 13.5 12.8 13.5V14V14.5C13.7389 14.5 14.5 13.7389 14.5 12.8H14ZM12.8 4.4V4.9C13.1866 4.9 13.5 5.2134 13.5 5.6H14H14.5C14.5 4.66112 13.7389 3.9 12.8 3.9V4.4ZM8.6 4.4V3.9C7.66112 3.9 6.9 4.66112 6.9 5.6H7.4H7.9C7.9 5.2134 8.2134 4.9 8.6 4.9V4.4ZM3.8 6.8V7.3H6.5V6.8V6.3H3.8V6.8ZM5.3 8L5.65355 8.35355L6.85355 7.15355L6.5 6.8L6.14645 6.44645L4.94645 7.64645L5.3 8ZM6.5 6.8L6.85355 6.44645L5.65355 5.24645L5.3 5.6L4.94645 5.95355L6.14645 7.15355L6.5 6.8ZM11.9 9.2V8.7H9.2V9.2V9.7H11.9V9.2ZM10.4 8L10.0464 7.64645L8.84645 8.84645L9.2 9.2L9.55355 9.55355L10.7536 8.35355L10.4 8ZM9.2 9.2L8.84645 9.55355L10.0464 10.7536L10.4 10.4L10.7536 10.0464L9.55355 8.84645L9.2 9.2Z"
                  fill="white"
                />
              </svg>
              Compare
            </Button>
          </div>
        </ActionButtons>
      </TopRow>

      <Description
        style={{
          marginBottom: isLinkedInNetwork ? "11px" : "20px",
        }}
      >
        {description}
        {description?.length && description?.length > 100 && (
          <SeeMoreLink> See More</SeeMoreLink>
        )}
      </Description>

      <SnapshotInfo
        style={{
          marginBottom: isLinkedInNetwork ? "11px" : "20px",
        }}
      >
        {snapshotUpdated}
      </SnapshotInfo>

      <StatsGrid network={network}>
        {isXNetwork ? (
          <>
            <StatCard>
              <StatLabel>Followers</StatLabel>
              <StatValue>{followers}</StatValue>
              <StatSubValue>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                  <path
                    d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                    fill="#05A584"
                  />
                </svg>
                {followersChange}
              </StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Following</StatLabel>
              <StatValue>{following}</StatValue>
              <StatSubValue>{followingLabel}</StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Engagement rate</StatLabel>
              <StatValue>{engagementRate}</StatValue>
              <StatSubValue>{engagementLabel}</StatSubValue>
            </StatCard>
            <StatCard isXScore>
              <StatLabel>X Score</StatLabel>
              <ScoreProgress
                score={xScore || 0}
                maxScore={1000}
                change={xScoreChange || 0}
                isSmall
                lineWeight={2}
              />
              <XScoreDescription>{xScoreDescription}</XScoreDescription>
            </StatCard>
          </>
        ) : isDiscordNetwork ? (
          <>
            <StatCard>
              <StatLabel>Members</StatLabel>
              <StatValue>{members}</StatValue>
              <StatSubValue>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                  <path
                    d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                    fill="#05A584"
                  />
                </svg>
                {membersChange}
              </StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Active members</StatLabel>
              <StatValue>{activeMembers}</StatValue>
              <StatSubValue>{activeMembersLabel}</StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Messages/Day</StatLabel>
              <StatValue>{messagesDay}</StatValue>
              <StatSubValue>{messagesSub}</StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Engagement Level</StatLabel>
              <ActivityBadge level={engagementLevel || "high"}>
                {engagementLevel
                  ? engagementLevel.charAt(0).toUpperCase() +
                    engagementLevel.slice(1)
                  : "High"}
              </ActivityBadge>
              <StatSubValue>{engagementLevelLabel}</StatSubValue>
            </StatCard>
          </>
        ) : isInstagramNetwork ? (
          <>
            <StatCard>
              <StatLabel>Followers</StatLabel>
              <StatValue>{followers}</StatValue>
              <StatSubValue>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                  <path
                    d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                    fill="#05A584"
                  />
                </svg>
                {followersChange}
              </StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Following</StatLabel>
              <StatValue>{following}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Posts</StatLabel>
              <StatValue>{posts}</StatValue>
              <StatSubValue>{postsSub}</StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Engagement rate</StatLabel>
              <StatValue>{engagementRate}</StatValue>
              <StatSubValue>{engagementSub}</StatSubValue>
            </StatCard>
          </>
        ) : isTikTokNetwork ? (
          <>
            <StatCard>
              <StatLabel>Followers</StatLabel>
              <StatValue>{followers}</StatValue>
              <StatSubValue>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                  <path
                    d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                    fill="#05A584"
                  />
                </svg>
                {followersChange}
              </StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Engagement Rate</StatLabel>
              <StatValue>{engagementRate}</StatValue>
              <StatSubValue>{engagementSub}</StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Avg. views/video</StatLabel>
              <StatValue>{avgViewsVideo}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Activity</StatLabel>
              <ActivityBadge level={activity || "medium"}>
                {activity &&
                  activity.charAt(0).toUpperCase() + activity.slice(1)}
              </ActivityBadge>
              <StatSubValue>{activitySub}</StatSubValue>
            </StatCard>
          </>
        ) : isThreadsNetwork ? (
          <>
            <StatCard>
              <StatLabel>Followers</StatLabel>
              <StatValue>{followers}</StatValue>
              <StatSubValue>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                  <path
                    d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                    fill="#05A584"
                  />
                </svg>
                {followersChange}
              </StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Following</StatLabel>
              <StatValue>{following}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Engagement rate</StatLabel>
              <StatValue>{engagementRate}</StatValue>
              <StatSubValue>{engagementSub}</StatSubValue>
            </StatCard>
          </>
        ) : isLinkedInNetwork ? (
          <>
            <StatCard>
              <StatLabel>
                {companySize ? "Company size" : "Connections"}
              </StatLabel>
              <StatValue>{companySize || linkedinConnections}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Followers</StatLabel>
              <StatValue>{followers}</StatValue>
              <StatSubValue>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                  <path
                    d="M4 0.5L0.535898 3.5L7.4641 3.5L4 0.5Z"
                    fill="#05A584"
                  />
                </svg>
                {followersChange}
              </StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Hiring activity</StatLabel>
              <ActivityBadge level={activity || "medium"}>
                {activity === "high"
                  ? "Active"
                  : activity === "medium"
                    ? "Neutral"
                    : "Low"}
              </ActivityBadge>
            </StatCard>
          </>
        ) : (
          <>
            <StatCard>
              <StatLabel>Subscribers</StatLabel>
              <StatValue>{subscribers}</StatValue>
              <StatSubValue>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="#05a584">
                  <path d="M6 2L10 8H2L6 2Z" />
                </svg>
                {subscribersChange}
              </StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Views/Post</StatLabel>
              <StatValue>{viewsPost}</StatValue>
              <StatSubValue>{viewRate}</StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Messages/Day</StatLabel>
              <StatValue>{messagesDay}</StatValue>
              <StatSubValue>{messagesSub}</StatSubValue>
            </StatCard>
            <StatCard>
              <StatLabel>Activity</StatLabel>
              <ActivityBadge level={activity || "high"}>
                {activity
                  ? activity.charAt(0).toUpperCase() + activity.slice(1)
                  : "High"}
              </ActivityBadge>
              <StatSubValue>{activitySub}</StatSubValue>
            </StatCard>
          </>
        )}
      </StatsGrid>
    </CardWrapper>
  );
};

export default EntityHeader;

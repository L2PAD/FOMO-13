import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div<{ forCompare?: boolean }>`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  height: 100%;

  &.fit {
    height: auto;
  }

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CardBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #728094;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const Subtitle = styled.p<{ forCompare?: boolean }>`
  font-size: 14px;
  color: #738094;
  margin: 0 0 20px 0;
  display: ${({ forCompare }) => (forCompare ? "none" : "block")};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  &:not(:last-child) {
    margin-bottom: 12px;
  }
`;

const Label = styled.span`
  font-size: 14px;
  color: #070b35;
  min-width: max-content;
`;

const CompactViewBox = styled.div`
  margin-top: 20px;
  padding: 16px;
  border: 2px dashed #05a584;
  border-radius: 12px;
  background: #e9f8f8;
`;

const CompactTitle = styled.h4`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: #070b35;
  margin: 0 0 10px 0;
`;

const CompactRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CompactLabel = styled.span`
  font-size: 14px;
  color: #070b35;
`;

const CompactValue = styled.span`
  font-size: 14px;
  font-weight: 550;
  color: #070b35;
  text-align: right;

  span {
    color: #05a584;
  }
`;

const Value = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  text-transform: capitalize;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  margin-top: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MetricCard = styled.div`
  background: #e9f8f8;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetricLabel = styled.span`
  font-size: 14px;
  color: #738094;
  line-height: 1.4;
`;

const MetricValue = styled.span`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ContentSection = styled.div`
  margin-bottom: 20px;
  width: 100%;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 12px 0;
`;

const BulletList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BulletItem = styled.li`
  font-size: 14px;
  color: #070b35;
  margin-bottom: 2px;
  padding-left: 16px;
  position: relative;

  &:last-child {
    margin-bottom: 0;
  }

  &:before {
    content: "•";
    position: absolute;
    left: 0;
    color: #070b35;
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00ffe3 0%, #00b4e2 50%, #0f66dd 100%);
  border-radius: 3px;
  position: relative;
`;

const ProgressDot = styled.div<{ position: number }>`
  position: absolute;
  top: 50%;
  left: ${({ position }) => position}%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  background: #070b35;
  border-radius: 50%;
`;

const ActivityBadge = styled.span<{ level: "high" | "moderate" | "low" }>`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: ${({ level }) => {
    switch (level) {
      case "high":
        return "#070b35";
      case "moderate":
        return "#070b35";
      case "low":
        return "#ff5858";
      default:
        return "#070b35";
    }
  }};
`;

interface ActivityOverviewProps {
  postsPerDay?: string;
  viewRateStability: number;
  viewRateLevel: "high" | "moderate" | "low";
  forwardVolatility: number;
  forwardLevel: "high" | "moderate" | "low";
  // X-specific props
  mostActiveTime?: string;
  bestEngagement?: string;
  // Discord-specific props
  activeHours?: string;
  activeDays?: string;
  // Network identifier
  network?:
    | "telegram"
    | "x"
    | "discord"
    | "instagram"
    | "linkedin"
    | "tiktok"
    | "threads";
  // Instagram-specific props
  posts?: string;
  avgLikes?: string;
  avgComments?: string;
  avgReposts?: string;
  avgShares?: string;
  // TikTok-specific props
  videos?: string;
  avgViewsVideo?: string;
  mostActive?: string;
  // LinkedIn-specific props
  originalPosts?: string;
  avgReactions?: string;
  reshares?: string;
  contentMix?: string[];
  whenPostsPerformBest?: string[];
  forCompare?: boolean;
}

const ActivityOverview: React.FC<ActivityOverviewProps> = ({
  // Telegram/Default
  postsPerDay,
  viewRateStability,
  viewRateLevel,
  forwardVolatility,
  forwardLevel,
  // X-specific
  mostActiveTime,
  bestEngagement,
  // Discord-specific
  activeHours,
  activeDays,
  // Network identifier
  network = "telegram",
  forCompare = false,
  // Instagram-specific
  posts,
  avgLikes,
  avgComments,
  avgReposts,
  avgShares,
  // TikTok-specific
  videos,
  avgViewsVideo,
  mostActive,
  // LinkedIn-specific
  originalPosts,
  avgReactions,
  reshares,
  contentMix = [],
  whenPostsPerformBest = [],
}) => {
  const isXNetwork = network === "x";
  const isDiscordNetwork = network === "discord";
  const isInstagramNetwork = network === "instagram";
  const isTikTokNetwork = network === "tiktok";
  const isThreadsNetwork = network === "threads";
  const isLinkedInNetwork = network === "linkedin";

  if (!forCompare) {
    if (isLinkedInNetwork) {
      return (
        <CardWrapper className="fit">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardBadge>Last 30 Days</CardBadge>
          </CardHeader>

          <MetricsGrid>
            <MetricCard>
              <MetricLabel>Original posts</MetricLabel>
              <MetricValue>{originalPosts}</MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Avg reactions / post</MetricLabel>
              <MetricValue>{avgReactions}</MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Avg comments / post</MetricLabel>
              <MetricValue>{avgComments}</MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Reshares</MetricLabel>
              <MetricValue>{reshares}</MetricValue>
            </MetricCard>
          </MetricsGrid>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <ContentSection>
              <SectionTitle>Content mix</SectionTitle>
              <BulletList>
                {contentMix.map((item, index) => (
                  <BulletItem key={index}>{item}</BulletItem>
                ))}
              </BulletList>
            </ContentSection>

            <ContentSection>
              <SectionTitle>When posts perform best</SectionTitle>
              <BulletList>
                {whenPostsPerformBest.map((item, index) => (
                  <BulletItem key={index}>{item}</BulletItem>
                ))}
              </BulletList>
            </ContentSection>
          </div>
        </CardWrapper>
      );
    }

    if (isThreadsNetwork || isInstagramNetwork) {
      return (
        <CardWrapper>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardBadge>Last 30 Days</CardBadge>
          </CardHeader>
          <Subtitle>Posting rhythm & engagement patterns.</Subtitle>

          <Row>
            <Label>Posts</Label>
            <Value>{posts}</Value>
          </Row>
          <Row>
            <Label>Avg likes/post</Label>
            <Value>{avgLikes}</Value>
          </Row>
          <Row>
            <Label>Avg comments/post</Label>
            <Value>{avgComments}</Value>
          </Row>
          <Row>
            <Label>Avg reposts/post</Label>
            <Value>{avgReposts}</Value>
          </Row>
          <Row>
            <Label>Avg shares/post</Label>
            <Value>{avgShares}</Value>
          </Row>
          <Row>
            <Label>Most active</Label>
            <Value>18:00–21:00 UTC</Value>
          </Row>
        </CardWrapper>
      );
    }

    if (isTikTokNetwork) {
      return (
        <CardWrapper>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardBadge>Last 30 Days</CardBadge>
          </CardHeader>
          <Subtitle>Posting rhythm & engagement patterns.</Subtitle>

          <Row>
            <Label>Videos</Label>
            <Value>{videos}</Value>
          </Row>
          <Row>
            <Label>Avg views/video</Label>
            <Value>{avgViewsVideo}</Value>
          </Row>
          <Row>
            <Label>Avg likes/video</Label>
            <Value>{avgLikes}</Value>
          </Row>
          <Row>
            <Label>Avg comments/video</Label>
            <Value>{avgComments}</Value>
          </Row>
          <Row>
            <Label>Avg shares/video</Label>
            <Value>{avgShares}</Value>
          </Row>
          <Row>
            <Label>Most active</Label>
            <Value>{mostActive}</Value>
          </Row>
        </CardWrapper>
      );
    }
  }

  return (
    <CardWrapper forCompare={forCompare}>
      {!forCompare && (
        <>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardBadge>Last 30 Days</CardBadge>
          </CardHeader>
          <Subtitle forCompare={forCompare}>
            How often the account posts and how stable its engagement is.
          </Subtitle>
        </>
      )}

      {isXNetwork ? (
        <>
          <Row>
            <Label>Posts / day</Label>
            <Value>{postsPerDay}</Value>
          </Row>
          <Row>
            <Label>Engagement stability</Label>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={viewRateStability || 0} />
              </ProgressTrack>
            </ProgressContainer>
            <Value>{viewRateLevel}</Value>
          </Row>
          <Row>
            <Label>Volatility (likes)</Label>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={forwardVolatility || 0} />
              </ProgressTrack>
            </ProgressContainer>
            <Value>{forwardLevel}</Value>
          </Row>
          {!forCompare && (
            <CompactViewBox>
              <CompactTitle>
                Compact view of recent posting windows:
              </CompactTitle>
              <CompactRow>
                <CompactLabel>Most active:</CompactLabel>
                <CompactValue>{mostActiveTime}</CompactValue>
              </CompactRow>
              <CompactRow>
                <CompactLabel>Best engagement:</CompactLabel>
                <CompactValue>{bestEngagement}</CompactValue>
              </CompactRow>
            </CompactViewBox>
          )}
        </>
      ) : isDiscordNetwork ? (
        <>
          <Row>
            <Label>Messages / day</Label>
            <Value>{postsPerDay}</Value>
          </Row>
          <Row>
            <Label>Engagement stability</Label>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={viewRateStability || 0} />
              </ProgressTrack>
            </ProgressContainer>
            <Value>{viewRateLevel}</Value>
          </Row>
          <Row>
            <Label>Volatility (spikes)</Label>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={forwardVolatility || 0} />
              </ProgressTrack>
            </ProgressContainer>
            <Value>{forwardLevel}</Value>
          </Row>
          {!forCompare && (
            <CompactViewBox>
              <CompactRow>
                <CompactLabel>Most active:</CompactLabel>
                <CompactValue>{mostActiveTime}</CompactValue>
              </CompactRow>
              <CompactRow>
                <CompactLabel>Best engagement:</CompactLabel>
                <CompactValue>{bestEngagement}</CompactValue>
              </CompactRow>
              <CompactRow>
                <CompactLabel>Most active channels:</CompactLabel>
                <CompactValue>
                  #research, #flows <span>+1</span>
                </CompactValue>
              </CompactRow>
            </CompactViewBox>
          )}
        </>
      ) : isInstagramNetwork ? (
        <>
          <Row>
            <Label>Posts</Label>
            <Value>{posts}</Value>
          </Row>
          <Row>
            <Label>Avg likes/post</Label>
            <Value>{avgLikes}</Value>
          </Row>
          <Row>
            <Label>Avg comments/post</Label>
            <Value>{avgComments}</Value>
          </Row>
          <Row>
            <Label>Avg reposts/post</Label>
            <Value>{avgReposts}</Value>
          </Row>
          <Row>
            <Label>Avg shares/post</Label>
            <Value>{avgShares}</Value>
          </Row>
        </>
      ) : isTikTokNetwork ? (
        <>
          <Row>
            <Label>Videos</Label>
            <Value>{videos}</Value>
          </Row>
          <Row>
            <Label>Avg views/video</Label>
            <Value>{avgViewsVideo}</Value>
          </Row>
          <Row>
            <Label>Avg likes/video</Label>
            <Value>{avgLikes}</Value>
          </Row>
          <Row>
            <Label>Avg comments/video</Label>
            <Value>{avgComments}</Value>
          </Row>
          <Row>
            <Label>Avg shares/video</Label>
            <Value>{avgShares}</Value>
          </Row>
          <Row>
            <Label>Most active</Label>
            <Value>{mostActive}</Value>
          </Row>
        </>
      ) : isThreadsNetwork ? (
        <>
          <Row>
            <Label>Posts</Label>
            <Value>{posts}</Value>
          </Row>
          <Row>
            <Label>Avg likes/post</Label>
            <Value>{avgLikes}</Value>
          </Row>
          <Row>
            <Label>Avg views/post</Label>
            <Value>{avgViewsVideo}</Value>
          </Row>
          <Row>
            <Label>Avg comments/post</Label>
            <Value>{avgComments}</Value>
          </Row>
          <Row>
            <Label>Most active</Label>
            <Value>18:00–21:00 UTC</Value>
          </Row>
        </>
      ) : isThreadsNetwork ? (
        <>
          <Row>
            <Label>Threads / day</Label>
            <Value>{postsPerDay}</Value>
          </Row>
          <Row>
            <Label>Engagement stability</Label>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={viewRateStability || 0} />
              </ProgressTrack>
            </ProgressContainer>
            <Value>{viewRateLevel}</Value>
          </Row>
          <Row>
            <Label>Volatility (likes)</Label>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={forwardVolatility || 0} />
              </ProgressTrack>
            </ProgressContainer>
            <Value>{forwardLevel}</Value>
          </Row>
          {!forCompare && (
            <CompactViewBox>
              <CompactTitle>Best time to post</CompactTitle>
              <CompactRow>
                <CompactLabel>Most active time (UTC)</CompactLabel>
                <CompactValue>{mostActiveTime}</CompactValue>
              </CompactRow>
              <CompactRow>
                <CompactLabel>Best engagement</CompactLabel>
                <CompactValue>{bestEngagement}</CompactValue>
              </CompactRow>
            </CompactViewBox>
          )}
        </>
      ) : isLinkedInNetwork ? (
        forCompare ? (
          <>
            <Row>
              <Label>Original posts</Label>
              <Value>{originalPosts}</Value>
            </Row>
            <Row>
              <Label>Avg reactions/post</Label>
              <Value>{avgReactions}</Value>
            </Row>
            <Row>
              <Label>Avg comments/post</Label>
              <Value>{avgComments}</Value>
            </Row>
            <Row>
              <Label>Reshares</Label>
              <Value>{reshares}</Value>
            </Row>
          </>
        ) : (
          <ContentSection>
            <SectionTitle>Activity Overview</SectionTitle>
            <MetricsGrid>
              <MetricCard>
                <MetricLabel>Original posts</MetricLabel>
                <MetricValue>{originalPosts}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Avg reactions / post</MetricLabel>
                <MetricValue>{avgReactions}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Avg comments / post</MetricLabel>
                <MetricValue>{avgComments}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Reshares</MetricLabel>
                <MetricValue>{reshares}</MetricValue>
              </MetricCard>
            </MetricsGrid>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <ContentSection>
                <SectionTitle>Content mix</SectionTitle>
                <BulletList>
                  {contentMix.map((item, index) => (
                    <BulletItem key={index}>{item}</BulletItem>
                  ))}
                </BulletList>
              </ContentSection>

              <ContentSection>
                <SectionTitle>When posts perform best</SectionTitle>
                <BulletList>
                  {whenPostsPerformBest.map((item, index) => (
                    <BulletItem key={index}>{item}</BulletItem>
                  ))}
                </BulletList>
              </ContentSection>
            </div>
          </ContentSection>
        )
      ) : (
        // Default/Telegram
        <>
          <Row>
            <Label>{isDiscordNetwork ? "Messages/day" : "Posts/day"}</Label>
            <Value>{postsPerDay}</Value>
          </Row>

          <Row>
            <Label>
              {isXNetwork || isDiscordNetwork
                ? "Engagement stability"
                : "View-rate stability"}
            </Label>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={viewRateStability || 0} />
              </ProgressTrack>
            </ProgressContainer>
            <Value>{viewRateLevel}</Value>
          </Row>

          <Row>
            <Label>
              {isXNetwork
                ? "Volatility (likes)"
                : isDiscordNetwork
                  ? "Volatility (spikes)"
                  : "Forward volatility"}
            </Label>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={forwardVolatility || 0} />
              </ProgressTrack>
            </ProgressContainer>
            <Value>{forwardLevel}</Value>
          </Row>
        </>
      )}
    </CardWrapper>
  );
};

export default ActivityOverview;
